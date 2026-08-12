import { NextResponse } from 'next/server'

import { getUserContext } from '@/lib/auth/context'
import { getEmailConfig, sendTemplateEmail, templates } from '@/lib/email'

/** GET /api/email/test — diagnóstico de configuración (no envía nada). Solo admin. */
export async function GET() {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!ctx.is_admin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const config = getEmailConfig()

  return NextResponse.json({
    enabled: config.enabled,
    api_key_presente: Boolean(config.apiKey),
    from: config.from,
    reply_to: config.replyTo,
    dev_redirect_to: config.devRedirectTo,
  })
}

/** POST /api/email/test { to } — envía un email de prueba. Solo admin. */
export async function POST(request: Request) {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!ctx.is_admin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { to } = (await request.json()) as { to?: string }
  if (!to) return NextResponse.json({ error: 'Falta el destinatario (to)' }, { status: 400 })

  const result = await sendTemplateEmail(
    templates.generico,
    {
      titulo: 'Prueba de configuración de email',
      asunto: 'Prueba de email — Comunidad CcD',
      parrafos: [
        'Si estás leyendo esto, la integración con Resend está funcionando correctamente.',
        'Este mensaje fue enviado desde el endpoint de diagnóstico de la plataforma.',
      ],
      datos: [
        { label: 'Entorno', value: process.env.NODE_ENV ?? 'desconocido' },
        { label: 'Enviado', value: new Date().toLocaleString('es-AR') },
      ],
      nota: 'Podés ignorar este correo.',
    },
    { to, tags: { categoria: 'test' } }
  )

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ ok: true, id: result.id, skipped: result.skipped ?? null })
}
