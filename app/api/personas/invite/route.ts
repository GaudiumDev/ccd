import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { nombre_usuario, persona_id, rol_sistema_id, organizacion_id } = await request.json()

  if (!nombre_usuario || !persona_id) {
    return NextResponse.json({ error: 'nombre_usuario y persona_id son requeridos' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch the persona's documento to use as initial password
  const { data: persona, error: personaError } = await supabaseAdmin
    .from('personas')
    .select('documento')
    .eq('id', persona_id)
    .single()

  if (personaError || !persona) {
    return NextResponse.json({ error: 'No se encontró la persona' }, { status: 404 })
  }

  if (!persona.documento) {
    return NextResponse.json(
      { error: 'La persona no tiene número de documento. Agregalo antes de crear el acceso.' },
      { status: 400 }
    )
  }

  // Persist nombre_usuario to personas table
  const { error: usernameError } = await supabaseAdmin
    .from('personas')
    .update({ nombre_usuario: nombre_usuario.toLowerCase().trim() })
    .eq('id', persona_id)

  if (usernameError) {
    // Check for unique constraint violation
    if (usernameError.code === '23505') {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso. Elegí otro.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: usernameError.message }, { status: 400 })
  }

  // Construct fake internal email — never exposed to users.
  // Convention: {username}@ccd.internal (non-routable domain)
  const fakeEmail = `${nombre_usuario.toLowerCase().trim()}@ccd.internal`

  // Create user directly with documento as password (no email confirmation needed)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: fakeEmail,
    password: persona.documento,
    email_confirm: true,
    user_metadata: { persona_id },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso. Elegí otro.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // If a rol_sistema_id was provided, assign it after the trigger creates perfiles_usuario.
  // We wait a moment for the DB trigger to run, then look up the perfil and assign the role.
  if (rol_sistema_id && authData.user) {
    // Poll for the perfil_usuario created by the trigger (up to ~2s)
    let perfilId: string | null = null
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 400))
      const { data: perfil } = await supabaseAdmin
        .from('perfiles_usuario')
        .select('id')
        .eq('id', authData.user.id)
        .single()
      if (perfil) { perfilId = perfil.id; break }
    }

    if (perfilId) {
      // Remove the default solo_lectura role assigned by the trigger, then insert the chosen one
      await supabaseAdmin
        .from('usuario_roles')
        .delete()
        .eq('usuario_id', perfilId)

      const rolePayload: Record<string, unknown> = {
        usuario_id: perfilId,
        rol_sistema_id,
      }
      if (organizacion_id) rolePayload.organizacion_id = organizacion_id

      const { error: rolError } = await supabaseAdmin
        .from('usuario_roles')
        .insert(rolePayload)

      if (rolError) {
        // Non-fatal: user was created, log the error
        console.error('Error asignando rol:', rolError.message)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
