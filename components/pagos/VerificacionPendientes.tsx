'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Check, X } from 'lucide-react'
import { formatDateAR } from '@/lib/utils'

export type PagoPendiente = {
  id: string
  monto: number
  fecha_pago: string | null
  comprobante_signed_url: string | null
  persona: string
  evento: string
}

export function VerificacionPendientes({ pagos }: { pagos: PagoPendiente[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function verificar(id: string, accion: 'aprobar' | 'rechazar') {
    setError(null)
    let notas: string | undefined
    if (accion === 'rechazar') {
      const motivo = window.prompt('Motivo del rechazo (opcional):') ?? ''
      notas = motivo.trim() || undefined
    }
    setLoadingId(id)
    try {
      const res = await fetch(`/api/pagos/${id}/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, notas }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'No se pudo procesar el pago.')
      } else {
        router.refresh()
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoadingId(null)
    }
  }

  if (pagos.length === 0) return null

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Pendientes de verificación</CardTitle>
        <CardDescription>
          Comprobantes de transferencia que esperan tu aprobación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {pagos.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="font-medium text-foreground">{p.persona}</p>
                <p className="text-sm text-muted-foreground">{p.evento}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">${Number(p.monto).toFixed(2)}</span>
                <span className="text-muted-foreground">{p.fecha_pago ? formatDateAR(p.fecha_pago) : '—'}</span>
              </div>
              {p.comprobante_signed_url ? (
                <a
                  href={p.comprobante_signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Ver comprobante
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Sin comprobante</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={loadingId === p.id}
                  onClick={() => verificar(p.id, 'aprobar')}
                >
                  <Check className="h-4 w-4" />
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-transparent"
                  disabled={loadingId === p.id}
                  onClick={() => verificar(p.id, 'rechazar')}
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
