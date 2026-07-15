import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()

  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id, estado, organizacion_id')
    .eq('id', id)
    .single()

  if (eventoError || !evento) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (evento.estado !== 'publicado') {
    return NextResponse.json(
      { error: `Solo se pueden iniciar eventos en estado "publicado". Estado actual: "${evento.estado}".` },
      { status: 422 }
    )
  }

  if (!canPerform(ctx, 'event.publish', evento.organizacion_id ?? null)) {
    return NextResponse.json(
      { error: 'No tenés permiso para iniciar este evento' },
      { status: 403 }
    )
  }

  const { error: updateError } = await supabase
    .from('eventos')
    .update({
      estado: 'en_curso',
      fecha_inicio_real: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ estado: 'en_curso' })
}
