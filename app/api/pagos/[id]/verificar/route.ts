import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .select(`
      id, estado_pago, evento_participante_id, notas,
      participante:evento_participantes!evento_participante_id(
        id, estado_participacion,
        evento:eventos!evento_id(organizacion_id)
      )
    `)
    .eq('id', id)
    .single()

  if (pagoError || !pago) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  }

  const participante = pago.participante as unknown as
    | { id: string; estado_participacion: string; evento: { organizacion_id: string | null } | null }
    | null
  const organizacionId = participante?.evento?.organizacion_id ?? null

  if (!canPerform(ctx, 'payment.verify', organizacionId)) {
    return NextResponse.json({ error: 'No tenés permiso para verificar este pago' }, { status: 403 })
  }

  if (pago.estado_pago !== 'pendiente') {
    return NextResponse.json(
      { error: `El pago ya fue ${pago.estado_pago}` },
      { status: 422 }
    )
  }

  const body = (await request.json()) as { accion?: string; notas?: string }

  if (body.accion === 'aprobar') {
    const today = new Date().toISOString().split('T')[0]
    const { error: updateError } = await supabase
      .from('pagos')
      .update({ estado_pago: 'confirmado', fecha_pago: today })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    if (participante?.estado_participacion === 'interesado') {
      await supabase
        .from('evento_participantes')
        .update({ estado_participacion: 'inscripto' })
        .eq('id', participante.id)
        .eq('estado_participacion', 'interesado')
    }

    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'rechazar') {
    const notas = body.notas?.trim()
      ? `${pago.notas ? pago.notas + '\n' : ''}Rechazado: ${body.notas.trim()}`
      : pago.notas
    const { error: updateError } = await supabase
      .from('pagos')
      .update({ estado_pago: 'rechazado', notas })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
