export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import CasasComunitariasManager from './_components/casas-manager'

export default async function CasasComunitariasPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')
  if (!canPerform(ctx, 'organization.create')) redirect('/dashboard')

  const supabase = await createClient()
  const { data: casas } = await supabase
    .from('casas_comunitarias')
    .select('id, codigo, nombre, tipo, estado')
    .is('fecha_baja', null)
    .order('nombre')

  return <CasasComunitariasManager initial={casas ?? []} />
}
