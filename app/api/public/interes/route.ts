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
  const emailNorm = email ? email.trim().toLowerCase() : null

  // Identificar si la persona ya está en la base de datos (por email).
  // El email NO es condicionante: una misma persona puede pedir info de varias
  // convivencias. Si ya existe, reutilizamos su registro; si no, la creamos.
  let personaId: string | null = null
  let personaExistente = false

  if (emailNorm) {
    const { data: existente } = await supabaseAdmin
      .from('personas')
      .select('id')
      .eq('email', emailNorm)
      .limit(1)
      .maybeSingle()
    if (existente) {
      personaId = existente.id
      personaExistente = true
    }
  }

  if (!personaId) {
    const insertData: Record<string, unknown> = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      tipo_persona: 'no_cecista',
      acepta_comunicaciones: true,
      fecha_alta: today,
    }
    if (emailNorm) insertData.email = emailNorm
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

    if (personaError || !persona) {
      // Carrera: el email pudo haberse insertado entre la búsqueda y este insert.
      if (personaError?.code === '23505' && emailNorm) {
        const { data: reintento } = await supabaseAdmin
          .from('personas')
          .select('id')
          .eq('email', emailNorm)
          .limit(1)
          .maybeSingle()
        if (reintento) {
          personaId = reintento.id
          personaExistente = true
        }
      }
      if (!personaId) {
        return NextResponse.json({ error: 'Error al registrar. Intentá de nuevo.' }, { status: 400 })
      }
    } else {
      personaId = persona.id
    }
  }

  // Evitar duplicar el interés en el MISMO evento (idempotente por persona+evento).
  const { data: yaInteresado } = await supabaseAdmin
    .from('evento_participantes')
    .select('id')
    .eq('evento_id', evento_id)
    .eq('persona_id', personaId)
    .limit(1)
    .maybeSingle()

  if (yaInteresado) {
    return NextResponse.json({
      ok: true,
      evento_participante_id: yaInteresado.id,
      persona_existente: personaExistente,
      ya_registrado: true,
    })
  }

  const { data: participante, error: partError } = await supabaseAdmin
    .from('evento_participantes')
    .insert({
      evento_id,
      persona_id: personaId,
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

  return NextResponse.json({
    ok: true,
    evento_participante_id: participante.id,
    persona_existente: personaExistente,
  })
}
