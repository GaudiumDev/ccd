import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/auth/context'
import { canPerform } from '@/lib/auth/permissions'
import NuevoTipoEventoForm from './_form'

export default async function NuevoTipoEventoPage() {
  const ctx = await getUserContext()

  if (!ctx || !canPerform(ctx, 'tipos_eventos.create')) {
    redirect('/tipos-eventos')
  }

  return <NuevoTipoEventoForm />
}
