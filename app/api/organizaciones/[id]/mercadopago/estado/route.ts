import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getUserContext, canPerform } from '@/lib/auth/context'

export async function GET(
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

  const { data: cuenta } = await supabaseAdmin
    .from('organizacion_mercadopago')
    .select('mp_user_id, conectado_en')
    .eq('organizacion_id', id)
    .maybeSingle()

  if (!cuenta) {
    return NextResponse.json({ conectado: false })
  }

  return NextResponse.json({
    conectado: true,
    mp_user_id: cuenta.mp_user_id,
    conectado_en: cuenta.conectado_en,
  })
}
