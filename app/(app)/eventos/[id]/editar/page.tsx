export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/context'
import EditarEventoForm from './form'

export default async function EditarEventoPage() {
  const ctx = await getUserContext()

  if (!ctx) redirect('/auth/login')

  return <EditarEventoForm isAdmin={ctx.is_admin} />
}
