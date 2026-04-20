'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react'
import { LocationFields } from '@/components/location-fields'
import { Combobox } from '@/components/ui/combobox'

type OrgOption = { id: string; nombre: string; parent_id?: string | null }
type TipoEvento = {
  id: string
  nombre: string
  categoria: string
  requiere_discernimiento_confra: boolean
  requiere_discernimiento_eqt: boolean
}

type Props = {
  fraternidades: OrgOption[]
  confraternidades: OrgOption[]
  tiposEventos: TipoEvento[]
  personaNombre: string
  isAdmin?: boolean
  canEditConfra?: boolean
}

const today = new Date().toISOString().split('T')[0]

export default function NuevoEventoForm({ fraternidades, confraternidades, tiposEventos, personaNombre, isAdmin = false, canEditConfra = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fraternidadId, setFraternidadId] = useState(fraternidades[0]?.id ?? '')
  const [tipoEventoId, setTipoEventoId] = useState(tiposEventos[0]?.id ?? '')
  const [confraternidadOverride, setConfraternidadOverride] = useState('')

  type FechaEjecucion = { fecha_inicio: string; fecha_fin: string }
  const [fechasEjecucion, setFechasEjecucion] = useState<FechaEjecucion[]>([{ fecha_inicio: '', fecha_fin: '' }])

  const tipoSeleccionado = tiposEventos.find(t => t.id === tipoEventoId) ?? null

  const [formData, setFormData] = useState({
    nombre: '',
    modalidad: 'presencial',
    es_apv: false,
    fecha_inicio: '',
    fecha_fin: '',
    fecha_solicitud: today,
    coordinadores_propuestos: '',
    asesor_propuesto: '',
    asesor_voluntario: false,
    ciudad: '',
    codigo_postal: '',
    diocesis: '',
    provincia_evento: '',
    pais_evento: 'Argentina',
    notas: '',
  })

  // Derive confraternidad from selected fraternidad (overridable for users with discernimiento permission)
  const fraternidadSeleccionada = fraternidades.find(f => f.id === fraternidadId)
  const derivedConfraternidadId = fraternidadSeleccionada?.parent_id ?? confraternidades[0]?.id ?? ''
  const confraternidadId = (canEditConfra && confraternidadOverride) ? confraternidadOverride : derivedConfraternidadId
  const confraternidadNombre = confraternidades.find(c => c.id === confraternidadId)?.nombre ?? '—'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setFormData(prev => ({ ...prev, [target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate fechas de ejecución are within the proposed range
      const fechasCompletas = fechasEjecucion.filter(f => f.fecha_inicio && f.fecha_fin)
      for (const f of fechasCompletas) {
        if (formData.fecha_inicio && f.fecha_inicio < formData.fecha_inicio) {
          setError('Las fechas de ejecución no pueden comenzar antes de la fecha de inicio propuesta.')
          setLoading(false)
          return
        }
        if (formData.fecha_fin && f.fecha_fin > formData.fecha_fin) {
          setError('Las fechas de ejecución no pueden terminar después de la fecha de fin propuesta.')
          setLoading(false)
          return
        }
      }

      const payload = {
        ...formData,
        tipo: tipoSeleccionado?.categoria ?? '',
        tipo_evento_id: tipoEventoId || null,
        fraternidad_id: fraternidadId,
        organizacion_id: confraternidadId,
        requiere_discernimiento_confra: tipoSeleccionado?.requiere_discernimiento_confra ?? false,
        requiere_discernimiento_eqt: tipoSeleccionado?.requiere_discernimiento_eqt ?? false,
        estado: 'solicitud',
        fecha_solicitud: formData.fecha_solicitud || today,
        fechas_ejecucion: fechasEjecucion.filter(f => f.fecha_inicio && f.fecha_fin),
      }

      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError ?? 'Error al enviar la solicitud')
      }

      const { id } = await res.json()
      router.push(`/eventos/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm'
  const readonlyClass = 'w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-sm'

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground uppercase tracking-wide text-sm">Solicitud de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            {fraternidades.length === 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-400">
                No tenés fraternidades asignadas. Contactá al administrador para que te asigne permisos.
              </div>
            )}

            {/* Fecha solicitud + Solicitado por */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fecha_solicitud">Fecha Solicitud</Label>
                <input
                  id="fecha_solicitud"
                  type="date"
                  name="fecha_solicitud"
                  value={formData.fecha_solicitud}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label>Solicitado por</Label>
                <div className={readonlyClass}>{personaNombre || '—'}</div>
              </div>
            </div>

            {/* Fraternidad */}
            <div className="space-y-1">
              <Label htmlFor="fraternidad_id">Fraternidad *</Label>
              {fraternidades.length === 1 ? (
                <div className={readonlyClass}>{fraternidades[0].nombre}</div>
              ) : (
                <select
                  id="fraternidad_id"
                  value={fraternidadId}
                  onChange={e => setFraternidadId(e.target.value)}
                  required
                  className={fieldClass}
                >
                  <option value="">— Seleccionar fraternidad —</option>
                  {fraternidades.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Confraternidad (derived; editable for users with discernimiento permission) */}
            <div className="space-y-1">
              <Label htmlFor="confraternidad_id">Confraternidad</Label>
              {canEditConfra ? (
                <select
                  id="confraternidad_id"
                  value={confraternidadId}
                  onChange={e => setConfraternidadOverride(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">— Seleccionar confraternidad —</option>
                  {confraternidades.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className={readonlyClass}>{confraternidadNombre}</div>
              )}
            </div>

            {/* Tipo de evento */}
            <div className="space-y-1">
              <Label>Tipo de evento solicitado *</Label>
              {tiposEventos.length === 0 ? (
                <div className={readonlyClass}>No hay tipos de eventos configurados</div>
              ) : (
                <Combobox
                  value={tipoEventoId}
                  onSelect={setTipoEventoId}
                  options={tiposEventos.map(t => ({ label: t.nombre, value: t.id }))}
                  placeholder="Seleccionar tipo de evento..."
                  searchPlaceholder="Buscar tipo..."
                  emptyText="No se encontraron tipos de eventos."
                />
              )}
            </div>

            {/* Niveles de discernimiento (readonly, derivados del tipo) */}
            {tipoSeleccionado && (
              <div className="rounded-md border border-border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niveles de discernimiento</p>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_confra
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={`text-sm ${tipoSeleccionado.requiere_discernimiento_confra ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Requiere discernimiento Confraternidad / Delegado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tipoSeleccionado.requiere_discernimiento_eqt
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={`text-sm ${tipoSeleccionado.requiere_discernimiento_eqt ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Requiere discernimiento Equipo Timón
                  </span>
                </div>
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre del evento *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Convivencia San José 2026"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Modalidad + APV */}
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="modalidad">Modalidad solicitada</Label>
                <select
                  id="modalidad"
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="bimodal">Bimodal</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pb-2">
                <input
                  type="checkbox"
                  id="es_apv"
                  name="es_apv"
                  checked={formData.es_apv}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="es_apv" className="text-sm text-foreground cursor-pointer">
                  Es de aporte voluntario APV
                </label>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fecha_inicio">Fecha inicio propuesta *</Label>
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fecha_fin">Fecha fin propuesta *</Label>
                <Input
                  id="fecha_fin"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Fechas de ejecución */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fechas reales de ejecución</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-transparent h-7 text-xs"
                  disabled={fechasEjecucion.length >= 3 || !fechasEjecucion[fechasEjecucion.length - 1].fecha_inicio || !fechasEjecucion[fechasEjecucion.length - 1].fecha_fin}
                  onClick={() => setFechasEjecucion(prev => [...prev, { fecha_inicio: '', fecha_fin: '' }])}
                >
                  <Plus className="h-3 w-3" />
                  Agregar período
                </Button>
              </div>
              {fechasEjecucion.map((fecha, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-2 items-end relative">
                  <div className="space-y-1">
                    <Label htmlFor={`fe_inicio_${idx}`} className="text-xs text-muted-foreground">
                      Fecha Desde {idx + 1}
                    </Label>
                    <Input
                      id={`fe_inicio_${idx}`}
                      type="date"
                      value={fecha.fecha_inicio}
                      min={formData.fecha_inicio || undefined}
                      max={formData.fecha_fin || undefined}
                      onChange={e => setFechasEjecucion(prev => prev.map((f, i) => i === idx ? { ...f, fecha_inicio: e.target.value } : f))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`fe_fin_${idx}`} className="text-xs text-muted-foreground">
                      Fecha Hasta {idx + 1}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`fe_fin_${idx}`}
                        type="date"
                        value={fecha.fecha_fin}
                        min={fecha.fecha_inicio || formData.fecha_inicio || undefined}
                        max={formData.fecha_fin || undefined}
                        onChange={e => setFechasEjecucion(prev => prev.map((f, i) => i === idx ? { ...f, fecha_fin: e.target.value } : f))}
                      />
                      {fechasEjecucion.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setFechasEjecucion(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coordinadores */}
            <div className="space-y-1">
              <Label htmlFor="coordinadores_propuestos">Coordinador/es propuesto/s</Label>
              <Input
                id="coordinadores_propuestos"
                name="coordinadores_propuestos"
                placeholder="Nombre y apellido (hasta 3, separados por coma)"
                value={formData.coordinadores_propuestos}
                onChange={handleChange}
              />
            </div>

            {/* Asesor + voluntario */}
            <div className="grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1">
                <Label htmlFor="asesor_propuesto">Asesor propuesto</Label>
                <Input
                  id="asesor_propuesto"
                  name="asesor_propuesto"
                  placeholder="Texto — puede ser persona externa"
                  value={formData.asesor_propuesto}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center gap-3 pb-2">
                <input
                  type="checkbox"
                  id="asesor_voluntario"
                  name="asesor_voluntario"
                  checked={formData.asesor_voluntario}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="asesor_voluntario" className="text-sm text-foreground cursor-pointer">
                  Es voluntario el asesor
                </label>
              </div>
            </div>

            {/* Ubicación */}
            <LocationFields
              pais={formData.pais_evento}
              provincia={formData.provincia_evento}
              localidad={formData.ciudad}
              codigoPostal={formData.codigo_postal}
              diocesis={formData.diocesis}
              onPaisChange={(val) => setFormData(prev => ({ ...prev, pais_evento: val }))}
              onProvinciaChange={(val) => setFormData(prev => ({ ...prev, provincia_evento: val }))}
              onLocalidadChange={(val) => setFormData(prev => ({ ...prev, ciudad: val }))}
              onCodigoPostalChange={(val) => setFormData(prev => ({ ...prev, codigo_postal: val }))}
              onDiocesisChange={(val) => setFormData(prev => ({ ...prev, diocesis: val }))}
            />

            {/* Notas */}
            <div className="space-y-1">
              <Label htmlFor="notas">Notas aclaratorias y observaciones</Label>
              <textarea
                id="notas"
                name="notas"
                placeholder="Notas adicionales..."
                value={formData.notas}
                onChange={handleChange}
                className={`${fieldClass} min-h-24`}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading || fraternidades.length === 0 || !fraternidadId || !tipoEventoId}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              <Link href="/eventos">
                <Button type="button" variant="outline" className="bg-transparent">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
