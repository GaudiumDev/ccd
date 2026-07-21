import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'
import { canEditarCierre, canVerInformesConfidenciales } from '@/lib/eventos/cierre'

// Guarda los datos del cierre: fotos, materiales/manuales y los informes confidenciales.
export async function PATCH(
  request: Request,
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

  if (!canEditarCierre(ctx, evento)) {
    return NextResponse.json(
      { error: 'No tenés permiso para editar el cierre (o el evento ya está cerrado)' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const update: Record<string, unknown> = {}

  // Campos no confidenciales — cualquiera que pueda editar el cierre
  if ('cierre_foto_convivencia_url' in body) update.cierre_foto_convivencia_url = body.cierre_foto_convivencia_url || null
  if ('cierre_foto_servidores_url' in body) update.cierre_foto_servidores_url = body.cierre_foto_servidores_url || null
  if ('cierre_bolso_manuales_completo' in body) update.cierre_bolso_manuales_completo = body.cierre_bolso_manuales_completo
  if ('cierre_manuales_saldo_final' in body) update.cierre_manuales_saldo_final = body.cierre_manuales_saldo_final === '' || body.cierre_manuales_saldo_final == null ? null : Number(body.cierre_manuales_saldo_final)
  if ('cierre_manuales_recibidos_de' in body) update.cierre_manuales_recibidos_de = body.cierre_manuales_recibidos_de || null
  if ('cierre_manuales_entrego_a' in body) update.cierre_manuales_entrego_a = body.cierre_manuales_entrego_a || null
  if ('cierre_manuales_notas' in body) update.cierre_manuales_notas = body.cierre_manuales_notas || null

  // Campos confidenciales (informes 6 y 7) — solo quien tiene permiso confidencial
  const tocaConfidenciales = 'informe_coordinador_respuestas' in body || 'informe_carismas' in body
  if (tocaConfidenciales) {
    if (!canVerInformesConfidenciales(ctx, evento)) {
      return NextResponse.json({ error: 'Sin permiso para editar los informes confidenciales' }, { status: 403 })
    }
    if ('informe_coordinador_respuestas' in body) update.informe_coordinador_respuestas = body.informe_coordinador_respuestas ?? null
    if ('informe_carismas' in body) update.informe_carismas = body.informe_carismas ?? null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const { error: updateError } = await supabase.from('eventos').update(update).eq('id', id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
