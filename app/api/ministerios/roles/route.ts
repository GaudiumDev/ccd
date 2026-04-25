import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(request: Request) {
  const ctx = await getUserContext()
  if (!ctx) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!canPerform(ctx, 'roles.assign')) {
    return NextResponse.json({ error: 'Sin permisos para gestionar roles' }, { status: 403 })
  }

  let body: { nombre?: string; descripcion?: string | null; nivel_acceso?: number; codigo_interno?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { nombre, descripcion, nivel_acceso, codigo_interno } = body

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return NextResponse.json({ error: 'El campo nombre es requerido' }, { status: 400 })
  }

  if (typeof nivel_acceso !== 'number' || nivel_acceso < 1 || nivel_acceso > 99) {
    return NextResponse.json(
      { error: 'El nivel de acceso debe ser un número entre 1 y 99' },
      { status: 400 }
    )
  }

  if (codigo_interno !== undefined && codigo_interno !== null && codigo_interno !== '') {
    if (!/^[A-Za-z0-9_-]+$/.test(codigo_interno)) {
      return NextResponse.json(
        { error: 'El código interno solo puede contener letras, números, guiones y guiones bajos' },
        { status: 400 }
      )
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles_sistema')
    .insert({
      nombre: nombre.trim(),
      descripcion: descripcion ?? null,
      nivel_acceso,
      activo: true,
      codigo_interno: codigo_interno?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const isDuplicateCodigo = error.message.includes('codigo_interno')
      return NextResponse.json(
        { error: isDuplicateCodigo ? 'Ya existe un rol con ese código interno' : 'Ya existe un rol con ese nombre' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
