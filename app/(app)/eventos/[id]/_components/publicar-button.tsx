'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function PublicarButton({ eventoId }: { eventoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePublicar = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/eventos/${eventoId}/publicar`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al publicar el evento')
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
        onClick={handlePublicar}
        disabled={loading}
        size="sm"
        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? 'Publicando...' : 'Publicar Evento'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
