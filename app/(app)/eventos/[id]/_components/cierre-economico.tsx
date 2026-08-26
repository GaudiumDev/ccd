'use client'

import { useState } from 'react'
import { Trash2, Plus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SUBTIPOS_INGRESO,
  CATEGORIAS_EGRESO,
  calcularResumenEconomico,
  formatMonto,
  type Movimiento,
} from '@/lib/eventos/cierre'
import { exportInformeEconomicoPDF, type EventoInfo } from '@/lib/eventos/cierre-pdf'

const inputClass = 'w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground'

type ResumenConcepto = { confirmado: number; pendiente: number }

type Props = {
  eventoId: string
  eventoInfo: EventoInfo
  movimientosIniciales: Movimiento[]
  resumenPagos: { inscripcion: ResumenConcepto; pension: ResumenConcepto }
  readOnly: boolean
}

export default function CierreEconomico({ eventoId, eventoInfo, movimientosIniciales, resumenPagos, readOnly }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>(movimientosIniciales)
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [subtipoIngreso, setSubtipoIngreso] = useState<string>(SUBTIPOS_INGRESO[0].value)
  const [categoriaEgreso, setCategoriaEgreso] = useState<string>(CATEGORIAS_EGRESO[0])
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { ingresos, egresos, saldo, diezmo } = calcularResumenEconomico(movimientos)

  async function agregar() {
    setError('')
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/eventos/${eventoId}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          subtipo_ingreso: tipo === 'ingreso' ? subtipoIngreso : null,
          categoria_egreso: tipo === 'egreso' ? categoriaEgreso : null,
          concepto: concepto || null,
          monto: montoNum,
          fecha: fecha || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al agregar el movimiento')
      setMovimientos(prev => [...prev, data.movimiento])
      setConcepto('')
      setMonto('')
      setFecha('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function eliminar(movId: string) {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/eventos/${eventoId}/movimientos?movimiento_id=${movId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al eliminar')
      }
      setMovimientos(prev => prev.filter(m => m.id !== movId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  async function importarPagos() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/eventos/${eventoId}/movimientos?import=pagos`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al importar')
      // Recargar la lista completa
      const listRes = await fetch(`/api/eventos/${eventoId}/movimientos`)
      const listData = await listRes.json()
      if (listRes.ok) setMovimientos(listData.movimientos)
      if (data.importados === 0) setError('No hay pagos confirmados nuevos para importar.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  function subtipoLabel(v: string | null): string {
    return SUBTIPOS_INGRESO.find(s => s.value === v)?.label ?? v ?? ''
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResumenBox label="Ingresos" value={ingresos} tone="pos" />
        <ResumenBox label="Egresos" value={egresos} tone="neg" />
        <ResumenBox label="Saldo" value={saldo} tone={saldo >= 0 ? 'pos' : 'neg'} strong />
        <ResumenBox label="Diezmo (20% EqT)" value={diezmo} tone="neutral" strong />
      </div>

      {/* Inscripciones y Pensiones */}
      <div className="grid grid-cols-2 gap-3">
        <ResumenConceptoBox label="Inscripciones" resumen={resumenPagos.inscripcion} />
        <ResumenConceptoBox label="Pensiones" resumen={resumenPagos.pension} />
      </div>

      {/* Movimientos */}
      <div className="rounded-md border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Concepto</th>
              <th className="px-3 py-2 text-right font-medium">Monto</th>
              <th className="px-3 py-2 text-left font-medium">Fecha</th>
              {!readOnly && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-3 py-4 text-center text-muted-foreground text-xs">
                  Sin movimientos registrados.
                </td>
              </tr>
            ) : (
              movimientos.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <span className={m.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {m.tipo === 'ingreso' ? subtipoLabel(m.subtipo_ingreso) : m.categoria_egreso}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground">{m.concepto || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {m.tipo === 'ingreso' ? '+' : '−'} ${formatMonto(Number(m.monto))}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{m.fecha ?? '—'}</td>
                  {!readOnly && (
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => eliminar(m.id)}
                        disabled={busy}
                        className="text-destructive hover:opacity-70 disabled:opacity-40"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alta de movimiento */}
      {!readOnly && (
        <div className="space-y-2 rounded-md border border-border p-3 bg-muted/20">
          <div className="grid gap-2 sm:grid-cols-2">
            <select className={inputClass} value={tipo} onChange={e => setTipo(e.target.value as 'ingreso' | 'egreso')}>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
            {tipo === 'ingreso' ? (
              <select className={inputClass} value={subtipoIngreso} onChange={e => setSubtipoIngreso(e.target.value)}>
                {SUBTIPOS_INGRESO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            ) : (
              <select className={inputClass} value={categoriaEgreso} onChange={e => setCategoriaEgreso(e.target.value)}>
                {CATEGORIAS_EGRESO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={`${inputClass} sm:col-span-1`} type="number" min={0} step="0.01" placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} />
            <input className={`${inputClass} sm:col-span-1`} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            <input className={`${inputClass} sm:col-span-1`} type="text" placeholder="Concepto (opcional)" value={concepto} onChange={e => setConcepto(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={agregar} disabled={busy} className="gap-1">
              <Plus className="h-4 w-4" /> Agregar movimiento
            </Button>
            <Button size="sm" variant="outline" onClick={importarPagos} disabled={busy} className="gap-1 bg-transparent">
              <RefreshCw className="h-4 w-4" /> Importar pagos confirmados
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        size="sm"
        variant="outline"
        onClick={() => exportInformeEconomicoPDF(eventoInfo, movimientos)}
        className="gap-1 bg-transparent"
      >
        <Download className="h-4 w-4" /> Exportar PDF
      </Button>
    </div>
  )
}

function ResumenConceptoBox({ label, resumen }: { label: string; resumen: { confirmado: number; pendiente: number } }) {
  return (
    <div className="rounded-md border border-border p-3 bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium tabular-nums">
        <span className="text-green-600 dark:text-green-400">${formatMonto(resumen.confirmado)}</span>
        <span className="mx-1 text-xs text-muted-foreground">confirmado</span>
        {' · '}
        <span className="text-yellow-600 dark:text-yellow-400">${formatMonto(resumen.pendiente)}</span>
        <span className="mx-1 text-xs text-muted-foreground">pendiente</span>
      </p>
    </div>
  )
}

function ResumenBox({ label, value, tone, strong }: { label: string; value: number; tone: 'pos' | 'neg' | 'neutral'; strong?: boolean }) {
  const color = tone === 'pos' ? 'text-green-600 dark:text-green-400'
    : tone === 'neg' ? 'text-red-600 dark:text-red-400'
    : 'text-foreground'
  return (
    <div className="rounded-md border border-border p-3 bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`${strong ? 'text-base font-bold' : 'text-sm font-medium'} ${color} tabular-nums`}>${formatMonto(value)}</p>
    </div>
  )
}
