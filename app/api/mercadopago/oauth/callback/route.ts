import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { MercadoPagoConfig, OAuth } from 'mercadopago'
import { getPublicOrigin } from '@/lib/http'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = getPublicOrigin(request)
  const code = url.searchParams.get('code')
  const organizacionId = url.searchParams.get('state')

  if (!code || !organizacionId) {
    return NextResponse.json({ error: 'Faltan parámetros de Mercado Pago' }, { status: 400 })
  }

  const ctx = await getUserContext()
  if (!ctx || !canPerform(ctx, 'organization.update', organizacionId)) {
    return NextResponse.json({ error: 'No tenés permiso para conectar Mercado Pago en esta organización' }, { status: 403 })
  }

  const config = new MercadoPagoConfig({ accessToken: process.env.MP_CLIENT_SECRET! })
  const oauth = new OAuth(config)

  let result
  try {
    result = await oauth.create({
      body: {
        client_id: process.env.MP_CLIENT_ID!,
        client_secret: process.env.MP_CLIENT_SECRET!,
        code,
        redirect_uri: `${origin}/api/mercadopago/oauth/callback`,
      },
    })
  } catch (err) {
    console.error('[mercadopago/oauth/callback] oauth.create failed:', err)
    return NextResponse.redirect(`${origin}/organizaciones/${organizacionId}/editar?mp=error`)
  }

  if (!result.access_token || !result.refresh_token || !result.user_id || !result.expires_in) {
    console.error('[mercadopago/oauth/callback] incomplete OAuth response:', result)
    return NextResponse.redirect(`${origin}/organizaciones/${organizacionId}/editar?mp=error`)
  }

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tokenExpiraEn = new Date(Date.now() + result.expires_in * 1000).toISOString()

  await supabaseAdmin.from('organizacion_mercadopago').upsert({
    organizacion_id: organizacionId,
    mp_user_id: result.user_id,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    public_key: result.public_key ?? null,
    token_expira_en: tokenExpiraEn,
    conectado_por: ctx.persona_id,
    conectado_en: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return NextResponse.redirect(`${origin}/organizaciones/${organizacionId}/editar?mp=conectado`)
}
