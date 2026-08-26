import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { esCentralizadorDeEvento } from '@/lib/eventos/cierre'
import { resolverCuentaEvento } from '@/lib/mercadopago/org-account'
import { getPublicOrigin } from '@/lib/http'

// Genera un link de pago de Mercado Pago para la pensión de un participante.
// A diferencia de la inscripción (checkout público en la landing), esto lo
// invoca un Centralizador/Responsable/Enlace/Delegado EqT desde el panel
// interno de Pagos, para compartir el link con el conviviente.
export async function POST(request: Request) {
  const ctx = await getUserContext()
  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: { evento_participante_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })
  }

  const eventoParticipanteId = body.evento_participante_id
  if (typeof eventoParticipanteId !== 'string' || !eventoParticipanteId) {
    return NextResponse.json({ error: 'Falta el participante.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: participante } = await supabaseAdmin
    .from('evento_participantes')
    .select(
      'id, evento:eventos!evento_id(id, nombre, pension, organizacion_id, fraternidad_id, centralizador_1_persona_id, centralizador_2_persona_id, centralizador_3_persona_id)'
    )
    .eq('id', eventoParticipanteId)
    .single()

  if (!participante) {
    return NextResponse.json({ error: 'No se encontró el participante.' }, { status: 404 })
  }

  const evento = participante.evento as unknown as {
    id: string
    nombre: string
    pension: number | null
    organizacion_id: string | null
    fraternidad_id: string | null
    centralizador_1_persona_id: string | null
    centralizador_2_persona_id: string | null
    centralizador_3_persona_id: string | null
  } | null

  if (!evento) {
    return NextResponse.json({ error: 'No se encontró el evento.' }, { status: 404 })
  }

  const autorizado =
    canPerform(ctx, 'event.update', evento.organizacion_id) ||
    (evento.fraternidad_id ? canPerform(ctx, 'event.update', evento.fraternidad_id) : false) ||
    esCentralizadorDeEvento(ctx, evento)

  if (!autorizado) {
    return NextResponse.json({ error: 'No tenés permiso para generar pagos de pensión de este evento' }, { status: 403 })
  }

  const monto = Number(evento.pension ?? 0)
  if (monto <= 0) {
    return NextResponse.json({ error: 'Este evento no tiene precio de pensión configurado.' }, { status: 400 })
  }

  const cuenta = await resolverCuentaEvento(evento.organizacion_id, evento.fraternidad_id)
  if (!cuenta) {
    return NextResponse.json(
      { error: 'Este evento no tiene Mercado Pago configurado. Contactate con los organizadores.' },
      { status: 409 }
    )
  }

  // Evitar preferencias duplicadas para una pensión ya con pago en curso
  // (scopeado por concepto: un pago de inscripción confirmado no debe bloquear la pensión).
  const { data: pagoExistente } = await supabaseAdmin
    .from('pagos')
    .select('id')
    .eq('evento_participante_id', eventoParticipanteId)
    .eq('concepto', 'pension')
    .in('estado_pago', ['pendiente', 'confirmado'])
    .maybeSingle()

  if (pagoExistente) {
    return NextResponse.json(
      { error: 'Ya hay un pago de pensión en curso para este participante.' },
      { status: 409 }
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: pago, error: pagoError } = await supabaseAdmin
    .from('pagos')
    .insert({
      evento_participante_id: eventoParticipanteId,
      concepto: 'pension',
      monto,
      medio_pago: 'mercadopago',
      estado_pago: 'pendiente',
      fecha_pago: today,
      mp_organizacion_id: cuenta.organizacionId,
    })
    .select('id')
    .single()

  if (pagoError || !pago) {
    return NextResponse.json({ error: 'No se pudo registrar el pago. Intentá de nuevo.' }, { status: 400 })
  }

  const origin = getPublicOrigin(request)
  const client = new MercadoPagoConfig({ accessToken: cuenta.accessToken })
  const preference = new Preference(client)

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: pago.id,
            title: `Pensión — ${evento.nombre}`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS',
          },
        ],
        external_reference: pago.id,
        notification_url: `${origin}/api/public/pagos/mercadopago/webhook?pago_id=${pago.id}`,
      },
    })

    await supabaseAdmin.from('pagos').update({ mp_preference_id: result.id }).eq('id', pago.id)

    const checkoutUrl = process.env.VERCEL_ENV === 'production'
      ? result.init_point
      : (result.sandbox_init_point ?? result.init_point)

    return NextResponse.json({ checkout_url: checkoutUrl })
  } catch {
    await supabaseAdmin.from('pagos').delete().eq('id', pago.id)
    return NextResponse.json({ error: 'No se pudo iniciar el pago con Mercado Pago. Intentá de nuevo.' }, { status: 502 })
  }
}
