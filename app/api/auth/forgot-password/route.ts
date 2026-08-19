import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { internalEmailFor, normalizeUsername } from '@/lib/auth/username'
import { isSendableAddress, sendTemplateEmail, templates } from '@/lib/email'
import { getPublicOrigin } from '@/lib/http'

/**
 * POST /api/auth/forgot-password { identificador }
 *
 * Los logins de la plataforma no usan el email real: Supabase Auth guarda
 * `usuario@ccd.internal`, una dirección no ruteable (ver `app/api/personas/invite/route.ts`).
 * Por eso el `resetPasswordForEmail` de Supabase no sirve — el correo iría a una casilla
 * inexistente. Acá resolvemos persona → email real (`personas.email`), generamos el link
 * de recuperación con la Admin API y lo mandamos nosotros por Resend.
 *
 * Siempre responde lo mismo, exista o no la cuenta, para no filtrar quién está registrado.
 */

/** Ventana de rate limit por identificador, en milisegundos. */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 3
/** Vigencia del link que informa el email (Supabase usa 1 hora por defecto para recovery). */
const LINK_EXPIRA_MINUTOS = 60

/**
 * Best-effort: en serverless cada instancia tiene su propio mapa, así que esto frena
 * el tecleo repetido pero no un ataque distribuido. Supabase aplica su propio límite.
 */
const intentos = new Map<string, { count: number; resetAt: number }>()

function excedeRateLimit(clave: string): boolean {
  const ahora = Date.now()
  const previo = intentos.get(clave)

  if (!previo || previo.resetAt < ahora) {
    intentos.set(clave, { count: 1, resetAt: ahora + RATE_LIMIT_WINDOW_MS })
    return false
  }

  previo.count += 1
  return previo.count > RATE_LIMIT_MAX
}

/** Respuesta única, se haya enviado o no el correo. */
function respuestaGenerica() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  let identificador: unknown
  try {
    ;({ identificador } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  if (typeof identificador !== 'string' || !identificador.trim()) {
    return NextResponse.json(
      { error: 'Ingresá tu usuario o tu email.' },
      { status: 400 }
    )
  }

  const entrada = identificador.trim()

  if (excedeRateLimit(entrada.toLowerCase())) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá un minuto antes de volver a probar.' },
      { status: 429 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // El identificador puede ser el nombre de usuario del login o el email real de la persona.
  const esEmail = entrada.includes('@')
  const consulta = supabaseAdmin
    .from('personas')
    .select('id, nombre, apellido, email, nombre_usuario, auth_user_id, fecha_baja')
    .is('fecha_baja', null)
    .limit(1)

  const { data: personas, error } = esEmail
    ? await consulta.ilike('email', entrada)
    : await consulta.eq('nombre_usuario', normalizeUsername(entrada))

  if (error) {
    console.error('[forgot-password] error buscando la persona:', error.message)
    return respuestaGenerica()
  }

  const persona = personas?.[0]

  if (!persona) {
    console.warn('[forgot-password] sin coincidencias para el identificador recibido')
    return respuestaGenerica()
  }

  if (!isSendableAddress(persona.email)) {
    // Muchos cecistas tienen login pero todavía no cargaron un email real: no hay a
    // dónde mandar el link. El responsable tiene que resetear la clave a mano.
    console.warn(`[forgot-password] la persona ${persona.id} no tiene email real cargado`)
    return respuestaGenerica()
  }

  // El email de Supabase Auth es el interno; lo leemos de la cuenta cuando podemos,
  // y si no lo reconstruimos a partir del nombre de usuario.
  let emailAuth: string | null = null

  if (persona.auth_user_id) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(persona.auth_user_id)
    emailAuth = authUser?.user?.email ?? null
  }

  if (!emailAuth && persona.nombre_usuario) {
    emailAuth = internalEmailFor(persona.nombre_usuario)
  }

  if (!emailAuth) {
    console.warn(`[forgot-password] la persona ${persona.id} no tiene acceso creado`)
    return respuestaGenerica()
  }

  const origin = getPublicOrigin(request)

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: emailAuth,
    options: { redirectTo: `${origin}/auth/reset-password` },
  })

  if (linkError || !link?.properties?.hashed_token) {
    console.error('[forgot-password] no se pudo generar el link:', linkError?.message)
    return respuestaGenerica()
  }

  // Usamos el `hashed_token` contra nuestra propia página en vez del `action_link` de
  // Supabase: así el token se canjea con `verifyOtp` en `/auth/reset-password` y no
  // dependemos de que el fragmento `#access_token` sobreviva al redirect.
  const resetUrl = `${origin}/auth/reset-password?token_hash=${encodeURIComponent(
    link.properties.hashed_token
  )}&type=recovery`

  const resultado = await sendTemplateEmail(
    templates.recuperarPassword,
    {
      nombre: persona.nombre ?? 'hermano',
      nombreUsuario: persona.nombre_usuario ?? emailAuth.split('@')[0],
      resetUrl,
      expiraEnMinutos: LINK_EXPIRA_MINUTOS,
    },
    { to: persona.email, tags: { categoria: 'recuperacion' } }
  )

  if (!resultado.ok) {
    console.error('[forgot-password] falló el envío del email:', resultado.error)
  }

  return respuestaGenerica()
}
