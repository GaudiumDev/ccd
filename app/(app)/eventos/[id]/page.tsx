export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit2, Calendar, MapPin, Users } from 'lucide-react'
import DiscernimientoPanel from './_components/approval-panel'
import DatosNoticiasPannel from './_components/datos-noticias-panel'
import { PublicarButton } from './_components/publicar-button'
import { formatDateAR } from '@/lib/utils'

const estadoClases: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  solicitud: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  discernimiento_confra: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  discernimiento_eqt: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  pendiente_datos_noticias: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  aprobado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  publicado: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  rechazado: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  finalizado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  cancelado: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const estadoLabel: Record<string, string> = {
  borrador: 'Borrador',
  solicitud: 'Pend. Disc. Confra/Delegado',
  discernimiento_confra: 'Pend. Disc. Equipo Timón',
  discernimiento_eqt: 'Disc. Equipo Timón',
  pendiente_datos_noticias: 'Pendiente Datos Noticias',
  aprobado: 'Aprobado',
  publicado: 'Publicado',
  rechazado: 'Rechazado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const tipoLabel: Record<string, string> = {
  convivencia: 'Convivencia',
  retiro: 'Retiro',
  taller: 'Taller',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, ctx] = await Promise.all([createClient(), getUserContext()])

  const { data: evento } = await supabase
    .from('eventos')
    .select(`
      id, nombre, tipo, estado, fecha_inicio, fecha_fin,
      modalidad, descripcion, notas, cupo_maximo, audiencia,
      requiere_discernimiento_confra, requiere_discernimiento_eqt,
      coordinadores_propuestos, asesor_propuesto, asesor_voluntario, es_apv,
      ciudad, codigo_postal, diocesis, provincia_evento, pais_evento,
      notas_discernimiento, casa_retiro_id,
      coordinador_asignado_id, asesor_asignado_id,
      solicitado_por,
      centralizador_1_nombre, centralizador_1_email, centralizador_1_telefono,
      centralizador_2_nombre, centralizador_2_email, centralizador_2_telefono,
      centralizador_3_nombre, centralizador_3_email, centralizador_3_telefono,
      notas_noticias,
      fecha_solicitud, fecha_aprobacion, fecha_rechazo, motivo_rechazo,
      fecha_publicacion,
      organizacion_id,
      disc_confra_estado, disc_confra_fecha, disc_confra_notas,
      disc_eqt_estado, disc_eqt_fecha, disc_eqt_notas,
      disc_confra_por_persona:personas!disc_confra_por(nombre, apellido),
      disc_eqt_por_persona:personas!disc_eqt_por(nombre, apellido),
      confraternidad:organizaciones!organizacion_id(id, nombre),
      fraternidad:organizaciones!fraternidad_id(id, nombre),
      casa_retiro:casas_retiro!casa_retiro_id(id, nombre, ciudad, provincia),
      coordinador_asignado:personas!coordinador_asignado_id(id, nombre, apellido),
      asesor_asignado:personas!asesor_asignado_id(id, nombre, apellido),
      solicitado_por_persona:personas!solicitado_por(nombre, apellido),
      aprobado_por_persona:personas!aprobado_por(nombre, apellido),
      rechazado_por_persona:personas!rechazado_por(nombre, apellido),
      publicado_por_persona:personas!publicado_por(nombre, apellido)
    `)
    .eq('id', id)
    .single()

  if (!evento) notFound()

  const { data: fechasEjecucion } = await supabase
    .from('evento_fechas')
    .select('id, fecha_inicio, fecha_fin')
    .eq('evento_id', id)
    .order('fecha_inicio')

  const { data: cambiosHistorial } = await supabase
    .from('evento_cambios')
    .select('id, nivel_disc, campo, valor_anterior, valor_nuevo, fecha, modificado_por_persona:personas!modificado_por(nombre, apellido)')
    .eq('evento_id', id)
    .order('fecha', { ascending: true })

  const { data: casasRetiro } = await supabase
    .from('casas_retiro')
    .select('id, nombre, ciudad, provincia')
    .order('nombre')

  const { data: personasCecistas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, email, telefono')
    .eq('estado', 'activo')
    .order('apellido')
    .order('nombre')

  const campoLabel: Record<string, string> = {
    nombre: 'Nombre', fecha_inicio: 'Fecha inicio', fecha_fin: 'Fecha fin',
    ciudad: 'Ciudad', provincia_evento: 'Provincia', pais_evento: 'País',
    codigo_postal: 'CP', diocesis: 'Diócesis',
    coordinadores_propuestos: 'Coordinadores propuestos', asesor_propuesto: 'Asesor propuesto',
    asesor_voluntario: 'Asesor voluntario', modalidad: 'Modalidad',
    notas: 'Notas', casa_retiro_id: 'Casa de Retiro',
    coordinador_asignado_id: 'Coordinador asignado', asesor_asignado_id: 'Asesor asignado',
    fechas_ejecucion: 'Fechas de ejecución',
  }

  const nivelDiscLabel: Record<string, string> = {
    confra: 'Confraternidad',
    eqt: 'Equipo Timón',
  }

  const confraternidad = evento.confraternidad as { id: string; nombre: string } | null
  const fraternidad = evento.fraternidad as { id: string; nombre: string } | null
  const casaRetiro = evento.casa_retiro as { id: string; nombre: string; ciudad?: string | null; provincia?: string | null } | null
  const coordinadorAsignado = (evento as Record<string, unknown>).coordinador_asignado as { id: string; nombre: string; apellido: string } | null
  const asesorAsignado = (evento as Record<string, unknown>).asesor_asignado as { id: string; nombre: string; apellido: string } | null
  const solicitadoPor = evento.solicitado_por_persona as { nombre: string; apellido: string } | null
  const aprobadoPor = evento.aprobado_por_persona as { nombre: string; apellido: string } | null
  const rechazadoPor = evento.rechazado_por_persona as { nombre: string; apellido: string } | null
  const publicadoPor = evento.publicado_por_persona as { nombre: string; apellido: string } | null
  const discConfraPor = evento.disc_confra_por_persona as { nombre: string; apellido: string } | null
  const discEqtPor = evento.disc_eqt_por_persona as { nombre: string; apellido: string } | null

  const estadoDiscLabel: Record<string, string> = {
    aprobado_sin_modificaciones: 'Aprobado sin modificaciones',
    aprobado_con_modificaciones: 'Aprobado con modificaciones',
    rechazado: 'Rechazado',
  }

  type EntradaHistorial = {
    fecha: string
    label: string
    persona: string | null
    extra?: string
    tipo: 'solicitud' | 'discernimiento' | 'aprobacion' | 'rechazo' | 'publicacion'
  }

  const timelineHistorial: EntradaHistorial[] = []

  if (evento.fecha_solicitud) {
    timelineHistorial.push({
      fecha: evento.fecha_solicitud,
      label: 'Solicitud enviada',
      persona: solicitadoPor ? `${solicitadoPor.nombre} ${solicitadoPor.apellido}` : null,
      tipo: 'solicitud',
    })
  }
  if (evento.disc_confra_fecha && evento.disc_confra_estado) {
    timelineHistorial.push({
      fecha: evento.disc_confra_fecha,
      label: `Disc. Confraternidad — ${estadoDiscLabel[evento.disc_confra_estado] ?? evento.disc_confra_estado}`,
      persona: discConfraPor ? `${discConfraPor.nombre} ${discConfraPor.apellido}` : null,
      extra: evento.disc_confra_notas ?? undefined,
      tipo: 'discernimiento',
    })
  }
  if (evento.disc_eqt_fecha && evento.disc_eqt_estado) {
    timelineHistorial.push({
      fecha: evento.disc_eqt_fecha,
      label: `Disc. Equipo Timón — ${estadoDiscLabel[evento.disc_eqt_estado] ?? evento.disc_eqt_estado}`,
      persona: discEqtPor ? `${discEqtPor.nombre} ${discEqtPor.apellido}` : null,
      extra: evento.disc_eqt_notas ?? undefined,
      tipo: 'discernimiento',
    })
  }
  if (evento.fecha_aprobacion) {
    timelineHistorial.push({
      fecha: evento.fecha_aprobacion,
      label: 'Aprobado',
      persona: aprobadoPor ? `${aprobadoPor.nombre} ${aprobadoPor.apellido}` : null,
      tipo: 'aprobacion',
    })
  }
  if (evento.fecha_rechazo) {
    timelineHistorial.push({
      fecha: evento.fecha_rechazo,
      label: 'Rechazado',
      persona: rechazadoPor ? `${rechazadoPor.nombre} ${rechazadoPor.apellido}` : null,
      extra: evento.motivo_rechazo ?? undefined,
      tipo: 'rechazo',
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((evento as any).fecha_publicacion) {
    timelineHistorial.push({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fecha: (evento as any).fecha_publicacion,
      label: 'Publicado',
      persona: publicadoPor ? `${publicadoPor.nombre} ${publicadoPor.apellido}` : null,
      tipo: 'publicacion',
    })
  }

  timelineHistorial.sort((a, b) => a.fecha.localeCompare(b.fecha))

  const canEdit = ctx && canPerform(ctx, 'event.update', evento.organizacion_id ?? null)
  const canPublish = ctx && evento.estado === 'aprobado' && canPerform(ctx, 'event.publish', evento.organizacion_id ?? null)

  // Datos noticias panel: visible when pendiente_datos_noticias and user has permission
  const esSolicitante = ctx?.persona_id && ctx.persona_id === (evento as Record<string, unknown>).solicitado_por
  const canDatosNoticias = ctx && evento.estado === 'pendiente_datos_noticias' && (
    esSolicitante ||
    canPerform(ctx, 'event.approve_confra', evento.organizacion_id ?? null) ||
    canPerform(ctx, 'event.approve_eqt')
  )

  // Build discernimiento niveles for the panel
  type NivelDiscernimiento = {
    nivel: 'confra' | 'eqt'
    title: string
    yaRegistrado?: { estado: string; fecha: string | null; notas: string | null }
  }

  const discNiveles: NivelDiscernimiento[] = []

  if (ctx) {
    const estado = evento.estado
    const requiereConfra = evento.requiere_discernimiento_confra ?? false
    const requiereEqt = evento.requiere_discernimiento_eqt ?? false
    const confraId = evento.organizacion_id

    // Confra level — show if requiereConfra and user can approve_confra
    if (requiereConfra && canPerform(ctx, 'event.approve_confra', confraId)) {
      if (evento.disc_confra_estado) {
        // Already discerned — show read-only
        discNiveles.push({
          nivel: 'confra',
          title: 'Discernimiento Confraternidad / Delegado',
          yaRegistrado: {
            estado: evento.disc_confra_estado,
            fecha: evento.disc_confra_fecha ?? null,
            notas: evento.disc_confra_notas ?? null,
          },
        })
      } else if (estado === 'solicitud') {
        // Confra needs to act on this solicitud
        discNiveles.push({
          nivel: 'confra',
          title: 'Discernimiento Confraternidad / Delegado',
        })
      }
    }

    // EqT level — show only if requiereEqt and user can approve_eqt
    if (requiereEqt && canPerform(ctx, 'event.approve_eqt')) {
      if (evento.disc_eqt_estado) {
        discNiveles.push({
          nivel: 'eqt',
          title: 'Discernimiento Equipo Timón',
          yaRegistrado: {
            estado: evento.disc_eqt_estado,
            fecha: evento.disc_eqt_fecha ?? null,
            notas: evento.disc_eqt_notas ?? null,
          },
        })
      } else if (
        estado === 'discernimiento_confra' ||
        estado === 'discernimiento_eqt' ||
        (estado === 'solicitud' && !requiereConfra)
      ) {
        discNiveles.push({
          nivel: 'eqt',
          title: 'Discernimiento Equipo Timón',
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver a Eventos
        </Link>
        <div className="flex items-center gap-2">
          {canPublish && <PublicarButton eventoId={id} />}
          {canEdit && (
            <Link href={`/eventos/${id}/editar`}>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Rejection notice — full width */}
      {evento.estado === 'rechazado' && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-5 space-y-1">
          <p className="font-semibold text-red-800 dark:text-red-300 text-sm uppercase tracking-wide">
            Solicitud Rechazada
          </p>
          {rechazadoPor && (
            <p className="text-sm text-red-700 dark:text-red-400">
              Rechazado por: {rechazadoPor.nombre} {rechazadoPor.apellido}
              {evento.fecha_rechazo && ` el ${formatDateAR(evento.fecha_rechazo)}`}
            </p>
          )}
          {evento.motivo_rechazo && (
            <p className="text-sm text-red-700 dark:text-red-400">Motivo: {evento.motivo_rechazo}</p>
          )}
        </div>
      )}

      {/* Main grid: event card + sidebar */}
      <div className={discNiveles.length > 0 || canDatosNoticias ? 'grid gap-6 lg:grid-cols-3 items-start' : undefined}>

      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {tipoLabel[evento.tipo] ?? evento.tipo}
              </p>
              <CardTitle className="text-2xl text-foreground">{evento.nombre}</CardTitle>
            </div>
            <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${estadoClases[evento.estado] ?? estadoClases.borrador}`}>
              {estadoLabel[evento.estado] ?? evento.estado}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Organización */}
          <div className="grid gap-3 sm:grid-cols-2">
            {confraternidad && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Confraternidad</p>
                  <p className="text-foreground">{confraternidad.nombre}</p>
                </div>
              </div>
            )}
            {fraternidad && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fraternidad</p>
                  <p className="text-foreground">{fraternidad.nombre}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fechas y modalidad */}
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fechas propuestas</p>
                <p className="text-foreground">{formatDateAR(evento.fecha_inicio)} — {formatDateAR(evento.fecha_fin)}</p>
              </div>
            </div>
            <Field label="Modalidad" value={evento.modalidad} />
            {evento.es_apv && (
              <div>
                <p className="text-xs text-muted-foreground">APV</p>
                <p className="text-sm text-foreground">Aporte de valor voluntario</p>
              </div>
            )}
          </div>

          {/* Fechas de ejecución */}
          {fechasEjecucion && fechasEjecucion.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Fechas de ejecución</p>
              <div className="space-y-1">
                {(fechasEjecucion as Array<{ id: string; fecha_inicio: string; fecha_fin: string }>).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-16">Período {i + 1}</span>
                    <span className="text-foreground">{formatDateAR(f.fecha_inicio)} — {formatDateAR(f.fecha_fin)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación */}
          {(evento.ciudad || evento.provincia_evento) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="grid gap-2 sm:grid-cols-3 flex-1">
                <Field label="Ciudad" value={evento.ciudad} />
                <Field label="Provincia" value={evento.provincia_evento} />
                <Field label="País" value={evento.pais_evento} />
                <Field label="CP" value={evento.codigo_postal} />
                <Field label="Diócesis" value={evento.diocesis} />
              </div>
            </div>
          )}

          {/* Casa de retiro */}
          {casaRetiro && (
            <div className="border-t border-border pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Casa de Retiro</p>
                <p className="text-foreground">{casaRetiro.nombre}</p>
                {(casaRetiro.ciudad || casaRetiro.provincia) && (
                  <p className="text-xs text-muted-foreground">{[casaRetiro.ciudad, casaRetiro.provincia].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Personas propuestas — visible cuando la confra ya discernió */}
          {evento.disc_confra_estado && (evento.coordinadores_propuestos || evento.asesor_propuesto) && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Personas propuestas (Confraternidad)</p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <Field label="Coordinador/es" value={evento.coordinadores_propuestos} />
                {evento.asesor_propuesto && (
                  <div>
                    <p className="text-xs text-muted-foreground">Asesor</p>
                    <p className="text-foreground">
                      {evento.asesor_propuesto}
                      {evento.asesor_voluntario && <span className="ml-2 text-xs text-muted-foreground">(voluntario)</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coordinador y asesor asignados por EqT */}
          {(coordinadorAsignado || asesorAsignado) && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Personas asignadas (Equipo Timón)</p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {coordinadorAsignado && (
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinador asignado</p>
                    <Link href={`/personas/${coordinadorAsignado.id}`} className="text-foreground hover:text-primary hover:underline">
                      {coordinadorAsignado.nombre} {coordinadorAsignado.apellido}
                    </Link>
                  </div>
                )}
                {asesorAsignado && (
                  <div>
                    <p className="text-xs text-muted-foreground">Asesor asignado</p>
                    <Link href={`/personas/${asesorAsignado.id}`} className="text-foreground hover:text-primary hover:underline">
                      {asesorAsignado.nombre} {asesorAsignado.apellido}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discernimiento */}
          <div className="grid gap-2 sm:grid-cols-2 text-sm border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Disc. Confraternidad / Delegado</p>
              <p className="text-foreground">{evento.requiere_discernimiento_confra ? 'Sí' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disc. Equipo Timón</p>
              <p className="text-foreground">{evento.requiere_discernimiento_eqt ? 'Sí' : 'No'}</p>
            </div>
          </div>

          {/* Notas del evento */}
          {evento.notas && (
            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Notas aclaratorias</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{evento.notas}</p>
            </div>
          )}

          {/* Notas de discernimiento */}
          {evento.notas_discernimiento && (
            <div className="space-y-1 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Notas de discernimiento</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{evento.notas_discernimiento}</p>
            </div>
          )}

          {/* Historial */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Historial</p>

            {timelineHistorial.length > 0 && (
              <div className="space-y-1.5">
                {timelineHistorial.map((entrada, i) => (
                  <div key={i} className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                    <span className={`font-medium ${entrada.tipo === 'rechazo' ? 'text-destructive' : entrada.tipo === 'publicacion' ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                      {entrada.label}
                    </span>
                    {entrada.persona && <span> · {entrada.persona}</span>}
                    <span> · {formatDateAR(entrada.fecha)}</span>
                    {entrada.extra && (
                      <p className="mt-0.5 pl-1 text-muted-foreground italic">{entrada.extra}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {cambiosHistorial && cambiosHistorial.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cambios registrados</p>
                {(cambiosHistorial as Array<{
                  id: string
                  nivel_disc: string
                  campo: string
                  valor_anterior: string | null
                  valor_nuevo: string | null
                  fecha: string | null
                  modificado_por_persona: { nombre: string; apellido: string } | null
                }>).map((c) => (
                  <div key={c.id} className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                    <span className="font-medium text-foreground">{campoLabel[c.campo] ?? c.campo}</span>
                    {': '}
                    <span className="line-through opacity-60">{c.valor_anterior ?? '—'}</span>
                    {' → '}
                    <span className="text-foreground">{c.valor_nuevo ?? '—'}</span>
                    {c.modificado_por_persona && (
                      <span> · {c.modificado_por_persona.nombre} {c.modificado_por_persona.apellido}</span>
                    )}
                    <span> · {nivelDiscLabel[c.nivel_disc] ?? c.nivel_disc}</span>
                    {c.fecha && <span> · {formatDateAR(c.fecha.split('T')[0])}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discernimiento sidebar */}
      {discNiveles.length > 0 && (
        <div className="lg:col-span-1 order-first lg:order-last">
          <div className="sticky top-6">
            <DiscernimientoPanel
              eventoId={id}
              niveles={discNiveles}
              evento={{
                nombre: evento.nombre,
                fecha_inicio: evento.fecha_inicio ?? null,
                fecha_fin: evento.fecha_fin ?? null,
                ciudad: evento.ciudad ?? null,
                provincia_evento: evento.provincia_evento ?? null,
                pais_evento: evento.pais_evento ?? null,
                codigo_postal: evento.codigo_postal ?? null,
                diocesis: evento.diocesis ?? null,
                coordinadores_propuestos: evento.coordinadores_propuestos ?? null,
                asesor_propuesto: evento.asesor_propuesto ?? null,
                asesor_voluntario: evento.asesor_voluntario ?? null,
                modalidad: evento.modalidad ?? null,
                notas: evento.notas ?? null,
                casa_retiro_id: (evento as Record<string, unknown>).casa_retiro_id as string | null,
                coordinador_asignado_id: (evento as Record<string, unknown>).coordinador_asignado_id as string | null,
                asesor_asignado_id: (evento as Record<string, unknown>).asesor_asignado_id as string | null,
              }}
              fechasEjecucion={(fechasEjecucion ?? []) as { id: string; fecha_inicio: string; fecha_fin: string }[]}
              casasRetiro={(casasRetiro ?? []) as { id: string; nombre: string; ciudad?: string | null; provincia?: string | null }[]}
              personas={(personasCecistas ?? []) as { id: string; nombre: string; apellido: string }[]}
            />
          </div>
        </div>
      )}

      {/* Datos Noticias sidebar */}
      {canDatosNoticias && (
        <div className="lg:col-span-1 order-first lg:order-last">
          <div className="sticky top-6">
            <DatosNoticiasPannel
              eventoId={id}
              inicial={{
                casa_retiro_id: (evento as Record<string, unknown>).casa_retiro_id as string | null,
                centralizador_1_nombre: (evento as Record<string, unknown>).centralizador_1_nombre as string | null,
                centralizador_1_email: (evento as Record<string, unknown>).centralizador_1_email as string | null,
                centralizador_1_telefono: (evento as Record<string, unknown>).centralizador_1_telefono as string | null,
                centralizador_2_nombre: (evento as Record<string, unknown>).centralizador_2_nombre as string | null,
                centralizador_2_email: (evento as Record<string, unknown>).centralizador_2_email as string | null,
                centralizador_2_telefono: (evento as Record<string, unknown>).centralizador_2_telefono as string | null,
                centralizador_3_nombre: (evento as Record<string, unknown>).centralizador_3_nombre as string | null,
                centralizador_3_email: (evento as Record<string, unknown>).centralizador_3_email as string | null,
                centralizador_3_telefono: (evento as Record<string, unknown>).centralizador_3_telefono as string | null,
                notas_noticias: (evento as Record<string, unknown>).notas_noticias as string | null,
              }}
              casasRetiro={(casasRetiro ?? []) as { id: string; nombre: string; ciudad?: string | null; provincia?: string | null }[]}
              personas={(personasCecistas ?? []) as { id: string; nombre: string; apellido: string; email?: string | null; telefono?: string | null }[]}
            />
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
