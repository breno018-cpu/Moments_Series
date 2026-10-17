import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Configuration
const SITE_NAME = "HangarBox"
const FROM_EMAIL = Deno.env.get('RESEND_FROM') || 'HangarBox <noreply@hangarboxx.com.br>'
const ROOT_DOMAIN = "hangarboxx.com.br"
const SITE_URL = `https://${ROOT_DOMAIN}`

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirme seu e-mail',
  invite: 'Você foi convidado',
  magiclink: 'Seu link de acesso',
  recovery: 'Recupere sua senha',
  email_change: 'Confirme seu novo e-mail',
  reauthentication: 'Seu código de verificação',
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured')
    return false
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    console.error('Failed to send email via Resend:', await res.text())
    return false
  }

  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { user, email_data } = body

    if (!user || !email_data) {
      return new Response(JSON.stringify({ message: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const actionType = email_data.email_action_type || 'signup'
    const templateComponent = EMAIL_TEMPLATES[actionType]

    if (!templateComponent) {
      console.warn(`Unknown action type: ${actionType}`)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || SITE_URL
    const confirmationUrl = email_data.token_hash
      ? `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${actionType}&redirect_to=${encodeURIComponent(email_data.redirect_to || SITE_URL)}`
      : (email_data.redirect_to || SITE_URL)

    const props: Record<string, any> = {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      recipient: user.email,
      confirmationUrl,
      oldEmail: email_data.old_email || user.email,
      email: user.email,
      newEmail: email_data.new_email || '',
      token: email_data.token || '',
    }

    const html = await renderAsync(React.createElement(templateComponent, props))
    const subject = EMAIL_SUBJECTS[actionType] || `${SITE_NAME} - Notificação`

    await sendViaResend(user.email, subject, html)

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Auth email hook error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
