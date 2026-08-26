import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/context'
import { canEditarCierre, canVerCierre, SUBTIPOS_INGRESO, CATEGORIAS_EGRESO } from '@/lib/eventos/cierre'

async function loadEvento(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('eventos')
    .select('id, estado, organizacion_id, fraternidad_id, coordinador_asignado_id, centralizador_1_persona_id, centralizador_2_persona_id, centralizador_3_persona_id')
    .eq('id', id)
    .single()
  return { supabase, evento: data }
}

// Lista los movimientos económicos del evento.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { supabase, evento } = await loadEvento(id)
  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canVerCierre(ctx, evento)) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const { data, error } = await supabase
    .from('evento_movimientos')
    .select('*')
    .eq('evento_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ movimientos: data ?? [] })
}

// Crea un movimiento, o importa los pagos confirmados (?import=pagos).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { supabase, evento } = await loadEvento(id)
  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canEditarCierre(ctx, evento)) {
    return NextResponse.json({ error: 'No tenés permiso para editar el cierre (o el evento ya está cerrado)' }, { status: 403 })
  }

  // ── Importar pagos confirmados del módulo de pagos ──
  if (url.searchParams.get('import') === 'pagos') {
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('id, monto, fecha_pago, participante:evento_participantes!evento_participante_id!inner(evento_id, persona:personas!persona_id(nombre, apellido))')
      .eq('estado_pago', 'confirmado')
      .eq('concepto', 'pension')
      .eq('participante.evento_id', id)

    if (pagosError) return NextResponse.json({ error: pagosError.message }, { status: 400 })

    const { data: yaImportados } = await supabase
      .from('evento_movimientos')
      .select('pago_id')
      .eq('evento_id', id)
      .not('pago_id', 'is', null)

    const importadosSet = new Set((yaImportados ?? []).map(m => m.pago_id))
    const nuevos = (pagos ?? [])
      .filter(p => !importadosSet.has(p.id))
      .map(p => {
        const part = p.participante as unknown as { persona: { nombre: string; apellido: string } | null } | null
        const persona = part?.persona
        return {
          evento_id: id,
          tipo: 'ingreso' as const,
          subtipo_ingreso: 'pago' as const,
          categoria_egreso: null,
          pago_id: p.id,
          concepto: persona ? `Pago — ${persona.apellido}, ${persona.nombre}` : 'Pago de pensión',
          monto: Number(p.monto ?? 0),
          fecha: p.fecha_pago ? String(p.fecha_pago).split('T')[0] : null,
          created_by: ctx.persona_id,
        }
      })

    if (nuevos.length === 0) {
      return NextResponse.json({ importados: 0 })
    }

    const { error: insertError } = await supabase.from('evento_movimientos').insert(nuevos)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
    return NextResponse.json({ importados: nuevos.length })
  }

  // ── Alta manual de un movimiento ──
  const body = await request.json()
  const tipo = body.tipo === 'egreso' ? 'egreso' : 'ingreso'
  const monto = Number(body.monto)
  if (!Number.isFinite(monto) || monto < 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }

  const insert: Record<string, unknown> = {
    evento_id: id,
    tipo,
    concepto: body.concepto || null,
    monto,
    fecha: body.fecha || null,
    notas: body.notas || null,
    created_by: ctx.persona_id,
  }

  if (tipo === 'ingreso') {
    if (!SUBTIPOS_INGRESO.some(s => s.value === body.subtipo_ingreso)) {
      return NextResponse.json({ error: 'Subtipo de ingreso inválido' }, { status: 400 })
    }
    insert.subtipo_ingreso = body.subtipo_ingreso
  } else {
    if (!(CATEGORIAS_EGRESO as readonly string[]).includes(body.categoria_egreso)) {
      return NextResponse.json({ error: 'Categoría de egreso inválida' }, { status: 400 })
    }
    insert.categoria_egreso = body.categoria_egreso
  }

  const { data, error } = await supabase.from('evento_movimientos').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ movimiento: data })
}

// Elimina un movimiento (?movimiento_id=...).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const movimientoId = url.searchParams.get('movimiento_id')
  if (!movimientoId) return NextResponse.json({ error: 'Falta movimiento_id' }, { status: 400 })

  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { supabase, evento } = await loadEvento(id)
  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canEditarCierre(ctx, evento)) {
    return NextResponse.json({ error: 'No tenés permiso para editar el cierre (o el evento ya está cerrado)' }, { status: 403 })
  }

  const { error } = await supabase
    .from('evento_movimientos')
    .delete()
    .eq('id', movimientoId)
    .eq('evento_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
