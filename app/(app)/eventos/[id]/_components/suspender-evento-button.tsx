'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OctagonX } from 'lucide-react'

type Props = {
  eventoId: string
}

export default function SuspenderEventoButton({ eventoId }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSuspender() {
    if (!notas.trim()) {
      setError('El motivo de la suspensión es obligatorio')
      return
    }
    const ok = window.confirm('¿Confirmás que querés suspender este evento? Esta acción es definitiva y no puede revertirse.')
    if (!ok) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/eventos/${eventoId}/suspender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas_suspension: notas }),
      })
      if (!res.ok) {
        const { error: e } = await res.json()
        throw new Error(e ?? 'Error inesperado')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 bg-transparent"
      >
        <OctagonX className="h-4 w-4" />
        Suspender Evento
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 p-4 space-y-3 w-full">
      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
        <OctagonX className="h-4 w-4" />
        Suspender Evento
      </p>
      <p className="text-xs text-orange-700 dark:text-orange-400">
        Esta acción es definitiva. El evento quedará en estado Suspendido y no podrá reactivarse.
      </p>
      <div>
        <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">Motivo de la suspensión <span className="text-destructive">*</span></p>
        <textarea
          className="w-full rounded border border-orange-300 dark:border-orange-700 bg-background px-3 py-2 text-sm text-foreground min-h-20"
          value={notas}
          placeholder="Describí el motivo de la suspensión..."
          onChange={e => { setNotas(e.target.value); setError('') }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setExpanded(false); setNotas(''); setError('') }}
          disabled={loading}
          className="flex-1 bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleSuspender}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Suspendiendo...' : 'Confirmar Suspensión'}
        </Button>
      </div>
    </div>
  )
}
