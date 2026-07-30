import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'
import { canCerrarConvivencia } from '@/lib/eventos/cierre'

// Cierra la convivencia: finalizado → cerrado. Solo Equipo Timón.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const supabase = await createClient()

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id, estado, organizacion_id, fraternidad_id, coordinador_asignado_id')
    .eq('id', id)
    .single()

  if (eventoError || !evento) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (evento.estado !== 'finalizado') {
    return NextResponse.json(
      { error: `Solo se pueden cerrar eventos finalizados. Estado actual: "${evento.estado}".` },
      { status: 422 }
    )
  }

  if (!canCerrarConvivencia(ctx, evento)) {
    return NextResponse.json(
      { error: 'Solo el Equipo Timón puede cerrar la convivencia' },
      { status: 403 }
    )
  }

  const { error: updateError } = await supabase
    .from('eventos')
    .update({
      estado: 'cerrado',
      fecha_cierre: new Date().toISOString(),
      cerrado_por: ctx.persona_id,
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  return NextResponse.json({ estado: 'cerrado' })
}
