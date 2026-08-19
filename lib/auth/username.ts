/**
 * Normalización del nombre de usuario.
 *
 * Los logins internos se crean siempre en ASCII (`scripts/create_cecista_logins.mjs`),
 * así que hay que aplicar la misma transformación en cualquier punto donde el usuario
 * tipee su nombre: login, recuperación de contraseña, etc. De este modo "muñoz" y
 * "munoz" resuelven a la misma cuenta.
 */
export function normalizeUsername(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .trim()
}

/** Dominio no ruteable usado para los logins internos (ver `app/api/personas/invite/route.ts`). */
export const INTERNAL_EMAIL_DOMAIN = 'ccd.internal'

/** Email interno de Supabase Auth que corresponde a un nombre de usuario. */
export function internalEmailFor(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`
}
