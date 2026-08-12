import type { EmailBlock } from './render'
import { sendEmail, sendEmailBatch, type EmailResult, type SendEmailOptions } from './send'

/**
 * Una plantilla es una función pura `props → (asunto, bloques)`.
 * No sabe nada de Resend: se puede testear y previsualizar sin enviar nada.
 */
export type EmailTemplate<Props> = {
  subject: (props: Props) => string
  blocks: (props: Props) => EmailBlock[]
  preheader?: (props: Props) => string
  /** Etiquetas fijas para métricas en Resend. */
  tags?: (props: Props) => Record<string, string>
}

/** Helper de identidad que preserva el tipo de `Props` al declarar el catálogo. */
export function defineTemplate<Props>(template: EmailTemplate<Props>): EmailTemplate<Props> {
  return template
}

export type TemplateProps<T> = T extends EmailTemplate<infer P> ? P : never

/** Opciones de envío que un caller puede pasar además de la plantilla. */
export type TemplateSendOptions = Omit<
  SendEmailOptions,
  'subject' | 'blocks' | 'html' | 'text' | 'preheader'
>

/** Materializa una plantilla en opciones de envío, sin enviarla (preview, tests, batch). */
export function buildTemplateEmail<Props>(
  template: EmailTemplate<Props>,
  props: Props,
  options: TemplateSendOptions
): SendEmailOptions {
  return {
    ...options,
    subject: template.subject(props),
    blocks: template.blocks(props),
    ...(template.preheader ? { preheader: template.preheader(props) } : {}),
    tags: { ...(template.tags?.(props) ?? {}), ...(options.tags ?? {}) },
  }
}

/** Renderiza y envía una plantilla. Mismo contrato que `sendEmail`: nunca lanza. */
export function sendTemplateEmail<Props>(
  template: EmailTemplate<Props>,
  props: Props,
  options: TemplateSendOptions
): Promise<EmailResult> {
  return sendEmail(buildTemplateEmail(template, props, options))
}

/** Envía la misma plantilla a muchos destinatarios, cada uno con sus props. */
export function sendTemplateEmailBatch<Props>(
  template: EmailTemplate<Props>,
  entries: { props: Props; options: TemplateSendOptions }[]
) {
  return sendEmailBatch(entries.map(e => buildTemplateEmail(template, e.props, e.options)))
}
