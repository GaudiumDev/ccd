import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ctx = await getUserContext()

  if (!ctx || !canPerform(ctx, 'organization.update', id)) {
    return NextResponse.json({ error: 'No tenés permiso' }, { status: 403 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabaseAdmin
    .from('organizacion_mercadopago')
    .delete()
    .eq('organizacion_id', id)

  if (error) {
    return NextResponse.json({ error: 'No se pudo desconectar la cuenta' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
