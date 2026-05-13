import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/context'
import { canPerform } from '@/lib/auth/permissions'
import EditarTipoEventoForm from './_form'

export default async function EditarTipoEventoPage() {
  const ctx = await getUserContext()

  if (!ctx || !canPerform(ctx, 'tipos_eventos.update')) {
    redirect('/tipos-eventos')
  }

  return <EditarTipoEventoForm />
}
