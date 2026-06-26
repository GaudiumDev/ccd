import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  const { nombre, apellido, evento_id, email, telefono, direccion, localidad, provincia, pais, notas } = body

  if (!nombre || !apellido || !evento_id) {
    return NextResponse.json({ error: 'Nombre, apellido y evento son obligatorios.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the event exists and is published
  const { data: evento } = await supabaseAdmin
    .from('eventos')
    .select('id, nombre, estado')
    .eq('id', evento_id)
    .eq('estado', 'publicado')
    .single()

  if (!evento) {
    return NextResponse.json({ error: 'El evento no está disponible.' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]

  const insertData: Record<string, unknown> = {
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    tipo_persona: 'no_cecista',
    acepta_comunicaciones: true,
    fecha_alta: today,
  }
  if (email) insertData.email = email.trim().toLowerCase()
  if (telefono) insertData.telefono = telefono.trim()
  if (direccion) insertData.direccion = direccion.trim()
  if (localidad) insertData.localidad = localidad.trim()
  if (provincia) insertData.provincia = provincia.trim()
  if (pais) insertData.pais = pais.trim()

  const { data: persona, error: personaError } = await supabaseAdmin
    .from('personas')
    .insert(insertData)
    .select('id')
    .single()

  if (personaError) {
    if (personaError.code === '23505') {
      return NextResponse.json(
        { error: 'Ya existe una persona registrada con ese email. Podés contactarnos directamente.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Error al registrar. Intentá de nuevo.' }, { status: 400 })
  }

  const { data: participante, error: partError } = await supabaseAdmin
    .from('evento_participantes')
    .insert({
      evento_id,
      persona_id: persona.id,
      rol_en_evento: 'convivente',
      estado_participacion: 'interesado',
      tipo_participante: 'no_cecista',
      notas: notas?.trim() || null,
    })
    .select('id')
    .single()

  if (partError || !participante) {
    return NextResponse.json({ error: 'Error al registrar el interés. Intentá de nuevo.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, evento_participante_id: participante.id })
}
