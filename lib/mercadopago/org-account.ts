import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, OAuth } from 'mercadopago'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function oauthClient() {
  // El accessToken de este config no se usa: los métodos de OAuth se autentican
  // con client_id/client_secret en el body de cada request.
  const config = new MercadoPagoConfig({ accessToken: process.env.MP_CLIENT_SECRET! })
  return new OAuth(config)
}

type CuentaMp = {
  organizacion_id: string
  access_token: string
  refresh_token: string
  token_expira_en: string
}

/**
 * Devuelve un access_token vigente para la organización, refrescándolo si está
 * por vencer. Mercado Pago rota el refresh_token en cada uso, por eso se
 * persiste siempre el par nuevo antes de devolver el token.
 */
export async function obtenerAccessTokenVigente(organizacionId: string): Promise<string | null> {
  const supabase = supabaseAdmin()
  const { data: cuenta } = await supabase
    .from('organizacion_mercadopago')
    .select('organizacion_id, access_token, refresh_token, token_expira_en')
    .eq('organizacion_id', organizacionId)
    .maybeSingle<CuentaMp>()

  if (!cuenta) return null

  const vence = new Date(cuenta.token_expira_en).getTime()
  const margenMs = 10 * 60 * 1000
  if (vence - Date.now() > margenMs) {
    return cuenta.access_token
  }

  const result = await oauthClient().refresh({
    body: {
      client_id: process.env.MP_CLIENT_ID!,
      client_secret: process.env.MP_CLIENT_SECRET!,
      refresh_token: cuenta.refresh_token,
    },
  })

  if (!result.access_token || !result.refresh_token || !result.expires_in) {
    return cuenta.access_token // el refresh falló, se intenta con el token actual
  }

  const nuevoVencimiento = new Date(Date.now() + result.expires_in * 1000).toISOString()
  await supabase
    .from('organizacion_mercadopago')
    .update({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_expira_en: nuevoVencimiento,
      updated_at: new Date().toISOString(),
    })
    .eq('organizacion_id', organizacionId)

  return result.access_token
}

/**
 * Chequeo liviano de disponibilidad (sin refrescar tokens) para decidir si un
 * evento puede ofrecer pago online. Se usa en la landing pública, que se
 * renderiza en cada visita — no conviene disparar un refresh de token ahí.
 */
export async function hayCuentaConectada(
  organizacionId: string | null,
  fraternidadId: string | null
): Promise<boolean> {
  const ids = [fraternidadId, organizacionId].filter((v): v is string => !!v)
  if (ids.length === 0) return false

  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('organizacion_mercadopago')
    .select('organizacion_id')
    .in('organizacion_id', ids)
    .limit(1)

  return (data?.length ?? 0) > 0
}

/**
 * Resuelve qué organización cobra el pago de un evento: se prefiere la cuenta
 * de la Fraternidad; si no está conectada, se usa la de la Confraternidad.
 */
export async function resolverCuentaEvento(
  organizacionId: string | null,
  fraternidadId: string | null
): Promise<{ organizacionId: string; accessToken: string } | null> {
  const supabase = supabaseAdmin()
  const ids = [fraternidadId, organizacionId].filter((v): v is string => !!v)
  if (ids.length === 0) return null

  const { data: cuentas } = await supabase
    .from('organizacion_mercadopago')
    .select('organizacion_id')
    .in('organizacion_id', ids)

  const conectadas = new Set((cuentas ?? []).map((c) => c.organizacion_id as string))

  const elegido = ids.find((id) => conectadas.has(id))
  if (!elegido) return null

  const accessToken = await obtenerAccessTokenVigente(elegido)
  if (!accessToken) return null

  return { organizacionId: elegido, accessToken }
}
