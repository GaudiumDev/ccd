'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FinalizarEventoButton({ eventoId }: { eventoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFinalizar = async () => {
    if (!confirm('¿Finalizar el evento? Pasará a estado "Finalizado".')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/eventos/${eventoId}/finalizar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al finalizar el evento')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={handleFinalizar}
        disabled={loading}
        size="sm"
        variant="outline"
        className="gap-2 bg-transparent"
      >
        <Flag className="h-4 w-4" />
        {loading ? 'Finalizando...' : 'Finalizar Evento'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
