import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPurchaseEmailOnce } from "../_shared/purchase-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusMap: Record<string, string> = {
  approved: "pago",
  pending: "pendente",
  in_process: "pendente",
  rejected: "cancelado",
  cancelled: "cancelado",
  refunded: "cancelado",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração incompleta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, user_email } = await req.json();

    if (!order_id || !user_email) {
      return new Response(JSON.stringify({ error: "order_id e user_email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(user_email).trim().toLowerCase();

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, user_email")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (String(order.user_email).trim().toLowerCase() !== normalizedEmail) {
      return new Response(JSON.stringify({ error: "Pedido não pertence a este e-mail" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "pago") {
      await sendPurchaseEmailOnce(supabase, order_id);
      return new Response(JSON.stringify({ status: "pago", approved: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(
      String(order_id)
    )}&sort=date_created&criteria=desc&limit=1`;

    const paymentRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!paymentRes.ok) {
      const errorBody = await paymentRes.json();
      console.error("MP status check error:", errorBody);
      return new Response(JSON.stringify({ error: "Falha ao verificar pagamento" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentData = await paymentRes.json();
    const latestPayment = Array.isArray(paymentData?.results) ? paymentData.results[0] : null;
    const mappedStatus = latestPayment?.status ? statusMap[latestPayment.status] || "pendente" : order.status || "pendente";

    if (mappedStatus !== order.status) {
      await supabase
        .from("orders")
        .update({ status: mappedStatus, payment_method: "pix" })
        .eq("id", order_id);
      if (mappedStatus === "pago") await sendPurchaseEmailOnce(supabase, order_id);
    }

    return new Response(
      JSON.stringify({
        status: mappedStatus,
        approved: mappedStatus === "pago",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-mp-payment-status error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});