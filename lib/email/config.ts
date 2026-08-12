/**
 * Configuración central del envío de emails (Resend).
 *
 * Variables de entorno:
 *   RESEND_API_KEY        (requerida para enviar de verdad; sin ella todo corre en modo "dry run")
 *   EMAIL_FROM            remitente por defecto — ej. "Comunidad CcD <no-reply@ccd.org>"
 *   EMAIL_REPLY_TO        reply-to por defecto (opcional)
 *   EMAIL_DEV_REDIRECT_TO en desarrollo, redirige TODOS los destinatarios a esta casilla
 *   EMAIL_DISABLED        "true" para desactivar el envío sin sacar la API key
 */

export const EMAIL_FROM_FALLBACK = 'Comunidad CcD <onboarding@resend.dev>'

export type EmailConfig = {
  apiKey: string | null
  from: string
  replyTo: string | null
  /** Si está seteada, todos los envíos van acá (útil en dev/staging). */
  devRedirectTo: string | null
  /** true si hay API key y el envío no está desactivado por env. */
  enabled: boolean
}

export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null
  const disabled = process.env.EMAIL_DISABLED?.toLowerCase() === 'true'

  return {
    apiKey,
    from: process.env.EMAIL_FROM?.trim() || EMAIL_FROM_FALLBACK,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
    devRedirectTo: process.env.EMAIL_DEV_REDIRECT_TO?.trim() || null,
    enabled: Boolean(apiKey) && !disabled,
  }
}

/** true si el sistema puede enviar emails reales en este entorno. */
export function isEmailEnabled(): boolean {
  return getEmailConfig().enabled
}

/**
 * Emails internos de login (`usuario@ccd.internal`) no son direcciones reales:
 * nunca deben recibir correo. Ver `app/api/personas/invite/route.ts`.
 */
export const INTERNAL_EMAIL_DOMAIN = '@ccd.internal'

export function isSendableAddress(email: string | null | undefined): email is string {
  if (!email) return false
  const value = email.trim().toLowerCase()
  if (!value.includes('@')) return false
  if (value.endsWith(INTERNAL_EMAIL_DOMAIN)) return false
  return true
}
