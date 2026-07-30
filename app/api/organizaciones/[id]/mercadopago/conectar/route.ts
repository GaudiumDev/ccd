import { NextResponse } from 'next/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { MercadoPagoConfig, OAuth } from 'mercadopago'
import { getPublicOrigin } from '@/lib/http'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()

  if (!ctx || !canPerform(ctx, 'organization.update', id)) {
    return NextResponse.json({ error: 'No tenés permiso para conectar Mercado Pago en esta organización' }, { status: 403 })
  }

  const origin = getPublicOrigin(request)
  const config = new MercadoPagoConfig({ accessToken: process.env.MP_CLIENT_SECRET! })
  const oauth = new OAuth(config)

  const authorizationUrl = oauth.getAuthorizationURL({
    options: {
      client_id: process.env.MP_CLIENT_ID!,
      redirect_uri: `${origin}/api/mercadopago/oauth/callback`,
      state: id,
    },
  })

  return NextResponse.redirect(authorizationUrl)
}
