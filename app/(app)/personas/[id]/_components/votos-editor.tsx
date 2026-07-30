'use client'

import { useRef, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Debe coincidir con VOTO_TIPOS de settings/page.tsx y con votoLabel del detalle.
const VOTO_TIPOS = [
  { value: 'tender_union_dios', label: 'Tender a la unión con Dios' },
  { value: 'caridad_fraterna', label: 'Caridad fraterna' },
  { value: 'irradiacion', label: 'Irradiación' },
  { value: 'castidad', label: 'Castidad' },
  { value: 'pobreza', label: 'Pobreza' },
  { value: 'obediencia', label: 'Obediencia' },
  { value: 'tender_union_dios_matrimonios', label: 'Tender a la unión con Dios (matrimonios)' },
  { value: 'otros_familiares', label: 'Solo familiares — otros votos' },
]

type VotoState = { anio: string; perpetuo: boolean; temporal: string }

interface InitialVoto {
  tipo_voto: string
  anio: number | null
  perpetuo: boolean
  temporal_cant_anios: number | null
}

export function VotosEditor({
  personaId,
  initialVotos,
}: {
  personaId: string
  initialVotos: InitialVoto[]
}) {
  const supabase = createClient()

  const [votos, setVotos] = useState<Record<string, VotoState>>(() => {
    const map: Record<string, VotoState> = {}
    for (const t of VOTO_TIPOS) map[t.value] = { anio: '', perpetuo: false, temporal: '' }
    for (const v of initialVotos ?? []) {
      map[v.tipo_voto] = {
        anio: v.anio != null ? String(v.anio) : '',
        perpetuo: !!v.perpetuo,
        temporal: v.temporal_cant_anios != null ? String(v.temporal_cant_anios) : '',
      }
    }
    return map
  })

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  async function persistVoto(tipo: string, row: VotoState) {
    setStatus('saving')
    const isEmpty = !row.anio && !row.perpetuo && !row.temporal
    const { error } = isEmpty
      ? await supabase
          .from('persona_votos')
          .delete()
          .eq('persona_id', personaId)
          .eq('tipo_voto', tipo)
      : await supabase.from('persona_votos').upsert(
          {
            persona_id: personaId,
            tipo_voto: tipo,
            anio: row.anio ? Number(row.anio) : null,
            perpetuo: row.perpetuo,
            temporal_cant_anios: row.perpetuo ? null : row.temporal ? Number(row.temporal) : null,
          },
          { onConflict: 'persona_id,tipo_voto' },
        )
    setStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setStatus('idle'), 1500)
  }

  function changeVoto(tipo: string, patch: Partial<VotoState>, immediate: boolean) {
    const row: VotoState = { ...(votos[tipo] ?? { anio: '', perpetuo: false, temporal: '' }), ...patch }
    setVotos(prev => ({ ...prev, [tipo]: row }))
    if (timers.current[tipo]) clearTimeout(timers.current[tipo])
    if (immediate) {
      void persistVoto(tipo, row)
    } else {
      timers.current[tipo] = setTimeout(() => void persistVoto(tipo, row), 900)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Votos
        </CardTitle>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {status === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="h-3 w-3 text-green-600" /> Guardado
            </>
          )}
          {status === 'error' && <span className="text-destructive">Error al guardar</span>}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Indicá el año del voto. Si es perpetuo marcalo; si es temporal, la cantidad de años.
        </p>
        <div className="space-y-2">
          {VOTO_TIPOS.map(t => {
            const v = votos[t.value] ?? { anio: '', perpetuo: false, temporal: '' }
            return (
              <div
                key={t.value}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-border p-2"
              >
                <span className="text-sm text-foreground">{t.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Año"
                  value={v.anio}
                  onChange={e => changeVoto(t.value, { anio: e.target.value }, false)}
                  className="w-20 h-8 rounded-md border border-border bg-background px-2 text-sm"
                />
                <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={v.perpetuo}
                    onChange={e =>
                      changeVoto(
                        t.value,
                        { perpetuo: e.target.checked, ...(e.target.checked ? { temporal: '' } : {}) },
                        true,
                      )
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Perpetuo
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Años"
                  value={v.temporal}
                  disabled={v.perpetuo}
                  onChange={e => changeVoto(t.value, { temporal: e.target.value }, false)}
                  className="w-20 h-8 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-40"
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
