'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ResultadoDiscernimiento =
  | 'aprobado_sin_modificaciones'
  | 'aprobado_con_modificaciones'
  | 'rechazado'
  | ''

type DiscernimientoNivel = {
  nivel: 'confra' | 'eqt'
  title: string
  /** Si ya fue comunicado previamente — mostrar en modo solo lectura */
  yaRegistrado?: {
    estado: string
    fecha: string | null
    notas: string | null
  }
}

type Props = {
  eventoId: string
  niveles: DiscernimientoNivel[]
}

const estadoDiscLabel: Record<string, string> = {
  aprobado_sin_modificaciones: 'Aprobado sin modificaciones',
  aprobado_con_modificaciones: 'Aprobado con modificaciones',
  rechazado: 'Rechazado',
}

function NivelDiscernimiento({
  eventoId,
  nivel,
  title,
  yaRegistrado,
}: DiscernimientoNivel & { eventoId: string }) {
  const router = useRouter()
  const [resultado, setResultado] = useState<ResultadoDiscernimiento>('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleComunicar = async () => {
    if (!resultado) {
      setError('Seleccioná un estado de discernimiento')
      return
    }
    if (resultado === 'rechazado' && !notas.trim()) {
      setError('Las notas son obligatorias al rechazar')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/eventos/${eventoId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado_discernimiento: resultado,
          notas_discernimiento: notas || undefined,
        }),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al comunicar el discernimiento')
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const readonlyInputClass = 'rounded border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground w-full'

  return (
    <div className="space-y-4">
      {/* Header row with checkbox-style indicator */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded border-2 border-foreground bg-foreground flex items-center justify-center">
          <svg className="h-3 w-3 text-background" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-foreground">{title}</span>
      </div>

      {yaRegistrado ? (
        /* Modo solo lectura — ya fue comunicado */
        <div className="grid gap-3 pl-6">
          <div className="grid gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha discernimiento</p>
              <div className={readonlyInputClass}>{yaRegistrado.fecha ?? '—'}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado discernimiento</p>
              <div className={readonlyInputClass}>
                {estadoDiscLabel[yaRegistrado.estado] ?? yaRegistrado.estado}
              </div>
            </div>
          </div>
          {yaRegistrado.notas && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas aclaratorias</p>
              <div className={`${readonlyInputClass} min-h-16 whitespace-pre-wrap`}>{yaRegistrado.notas}</div>
            </div>
          )}
        </div>
      ) : (
        /* Modo edición — pendiente de comunicar */
        <div className="grid gap-4 pl-6">
          <div className="grid gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha discernimiento</p>
              <div className={readonlyInputClass}>{new Date().toISOString().split('T')[0]} (hoy)</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado discernimiento *</p>
              <select
                value={resultado}
                onChange={e => { setResultado(e.target.value as ResultadoDiscernimiento); setError('') }}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="">— Seleccionar —</option>
                <option value="aprobado_sin_modificaciones">Aprobado sin modificaciones</option>
                <option value="aprobado_con_modificaciones">Aprobado con modificaciones</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Notas aclaratorias{resultado === 'rechazado' && <span className="text-destructive"> *</span>}
            </p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones, cambios sugeridos, contexto pastoral..."
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground min-h-20"
            />
            <Button
              size="sm"
              disabled={loading || !resultado}
              onClick={handleComunicar}
              className="w-full"
            >
              {loading ? 'Comunicando...' : 'Comunicar Discernimiento'}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DiscernimientoPanel({ eventoId, niveles }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground border-b border-border pb-3">
        Discernimiento de la Solicitud
      </h3>

      {niveles.map((n, i) => (
        <div key={n.nivel}>
          <NivelDiscernimiento eventoId={eventoId} {...n} />
          {i < niveles.length - 1 && <div className="border-t border-border mt-6" />}
        </div>
      ))}
    </div>
  )
}
