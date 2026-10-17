import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, amount, description, payer } = await req.json();

    if (!order_id || !amount || !payer?.email) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const notificationUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const payload = {
      transaction_amount: Number(amount),
      description: description || `Pedido ${order_id}`,
      payment_method_id: "pix",
      external_reference: order_id,
      notification_url: notificationUrl,
      payer: {
        email: String(payer.email).toLowerCase().trim(),
        first_name: payer.name || String(payer.email).split("@")[0],
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": String(order_id),
      },
      body: JSON.stringify(payload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP PIX create error:", mpData);
      return new Response(JSON.stringify({ error: "Erro ao gerar PIX", details: mpData }), {
        status: mpResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData?.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      console.error("MP PIX missing qr data:", mpData);
      return new Response(JSON.stringify({ error: "Mercado Pago não retornou QR Code PIX" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        payment_id: String(mpData.id),
        status: mpData.status || "pending",
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        expires_at: mpData.date_of_expiration || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-mp-pix-payment error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});