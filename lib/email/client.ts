import { Resend } from 'resend'

import { getEmailConfig } from './config'

let cached: Resend | null = null
let cachedKey: string | null = null

/**
 * Cliente Resend (singleton perezoso). Devuelve null si no hay RESEND_API_KEY,
 * para que el envío pueda degradar a "dry run" en vez de romper el flujo.
 *
 * Solo para código de servidor (Route Handlers, Server Actions, scripts).
 */
export function getResendClient(): Resend | null {
  const { apiKey } = getEmailConfig()
  if (!apiKey) return null

  if (!cached || cachedKey !== apiKey) {
    cached = new Resend(apiKey)
    cachedKey = apiKey
  }

  return cached
}
