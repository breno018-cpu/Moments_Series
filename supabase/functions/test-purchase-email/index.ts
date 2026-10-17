import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { template } from '../_shared/transactional-email-templates/purchase-confirmation.tsx'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPurchaseEmailOnce } from '../_shared/purchase-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // 1. Se for reenvio de um pedido real (via painel administrativo)
  if (body?.order_id) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      // Carrega o pedido para validação estrita
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, user_email')
        .eq('id', body.order_id)
        .maybeSingle()

      if (error || !order) {
        return new Response(JSON.stringify({ error: 'Pedido não localizado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Garante envio seguro exclusivamente para o e-mail registrado na compra
      await sendPurchaseEmailOnce(supabase, String(body.order_id))
      return new Response(
        JSON.stringify({ success: true, message: `E-mail reenviado com segurança para ${order.user_email}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. Se for disparo de teste de layout administrativo
  let toEmail = (body?.to || 'laurentinobreno08@gmail.com').toString().trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(toEmail)) {
    return new Response(JSON.stringify({ error: 'Endereço de e-mail inválido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const fromEmail = Deno.env.get('RESEND_FROM') || 'HangarBox <noreply@hangarboxx.com.br>'
  const html = await renderAsync(React.createElement(template.component, template.previewData))

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: '[TESTE] ' + template.subject,
      html,
    }),
  })

  const resText = await res.text()
  return new Response(`${res.status} ${resText}`, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
