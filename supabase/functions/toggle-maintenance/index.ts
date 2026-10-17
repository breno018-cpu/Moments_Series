// Toggle/set the site maintenance overlay using a shared secret token.
// Bypasses RLS via service role so it works from any browser without admin login.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET_TOKEN = "9f3a-loop-402";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    let action = (url.searchParams.get("action") || "toggle").toLowerCase();

    if (req.method === "POST") {
      try {
        const body = await req.json();
        token = body.token ?? token;
        action = (body.action ?? action).toLowerCase();
      } catch {}
    }

    if (token !== SECRET_TOKEN) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id,value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    let next: boolean;
    if (action === "on") next = true;
    else if (action === "off") next = false;
    else next = !((existing?.value as any)?.enabled ?? false);

    const value = { enabled: next };

    if (existing?.id) {
      await supabase.from("site_settings").update({ value }).eq("id", existing.id);
    } else {
      await supabase.from("site_settings").insert({ key: "maintenance_mode", value });
    }

    return new Response(JSON.stringify({ ok: true, enabled: next }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
