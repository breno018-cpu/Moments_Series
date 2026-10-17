import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TEMPLATES } from './registry.ts'

const SITE_NAME = "HangarBox"
const FROM_EMAIL = Deno.env.get('RESEND_FROM') || 'HangarBox <noreply@hangarboxx.com.br>'

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: string }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  idempotencyKey?: string
  replyTo?: string
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await renderAsync(element)
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [recipient],
      subject,
      html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Resend API error [${res.status}]: ${errorText}`)
    return { sent: false, reason: errorText }
  }

  return { sent: true }
}
