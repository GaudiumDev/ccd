/**
 * Integración de email (Resend) — punto de entrada único.
 *
 *   import { sendEmail, sendTemplateEmail, templates, block } from '@/lib/email'
 *
 * Solo para código de servidor (Route Handlers, Server Components, scripts).
 * Ver `lib/email/README.md` para ejemplos y variables de entorno.
 */

export { getEmailConfig, isEmailEnabled, isSendableAddress } from './config'
export { getResendClient } from './client'
export { block, escapeHtml, renderEmail } from './render'
export type { EmailBlock, RenderedEmail, RenderEmailOptions } from './render'
export { sendEmail, sendEmailBatch, sendEmailOrThrow } from './send'
export type { EmailAttachment, EmailResult, SendEmailOptions } from './send'
export {
  buildTemplateEmail,
  defineTemplate,
  sendTemplateEmail,
  sendTemplateEmailBatch,
} from './template'
export type { EmailTemplate, TemplateProps, TemplateSendOptions } from './template'
export { templates } from './templates'
export type { TemplateName } from './templates'
