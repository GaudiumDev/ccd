import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: permiso } = await supabase
    .from('permisos')
    .select('id')
    .eq('clave', 'event.create')
    .eq('activo', true)
    .single()

  if (!permiso) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('ministerio_permisos')
    .select('ministerios!inner(id, nombre)')
    .eq('permiso_id', permiso.id)
    .eq('ministerios.activo', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const opciones = (data ?? [])
    .map((row: any) => ({ id: row.ministerios.id as string, nombre: row.ministerios.nombre as string }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return NextResponse.json(opciones)
}
