import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, Users, Phone, Mail, Link2 as Link2Icon, Building2, UserCheck, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { InteresModalWrapper } from '@/components/landing/InteresModalWrapper'

const TIPO_LABELS: Record<string, string> = {
  convivencia: 'Convivencia',
  retiro: 'Retiro',
  taller: 'Taller',
}

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  bimodal: 'Bimodal',
}

function formatDateRange(inicio: string, fin: string) {
  const start = new Date(inicio + 'T00:00:00')
  const end = new Date(fin + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const locale = 'es-AR'
  if (inicio === fin) return start.toLocaleDateString(locale, opts)
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} al ${end.toLocaleDateString(locale, opts)}`
  }
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} al ${end.toLocaleDateString(locale, opts)}`
}

export default async function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: evento }, { data: fechasEjecucion }] = await Promise.all([
    supabase
      .from('eventos')
      .select(`
        id, nombre, tipo, estado, fecha_inicio, fecha_fin,
        modalidad, descripcion, notas, cupo_maximo, audiencia,
        ciudad, codigo_postal, diocesis, provincia_evento, pais_evento,
        es_apv, link_pago_mercadopago,
        flyer_horizontal_url, flyer_cuadrado_url,
        asesor_voluntario,
        centralizador_1_persona_id, centralizador_1_nombre, centralizador_1_email, centralizador_1_telefono,
        centralizador_2_persona_id, centralizador_2_nombre, centralizador_2_email, centralizador_2_telefono,
        centralizador_3_persona_id, centralizador_3_nombre, centralizador_3_email, centralizador_3_telefono,
        organizacion:organizaciones!organizacion_id(id, nombre),
        fraternidad:organizaciones!fraternidad_id(id, nombre),
        casa_retiro:casas_retiro!casa_retiro_id(id, nombre, ciudad, provincia, link_maps),
        coordinador_asignado:personas!coordinador_asignado_id(id, nombre, apellido),
        asesor_asignado:personas!asesor_asignado_id(id, nombre, apellido)
      `)
      .eq('id', id)
      .eq('estado', 'publicado')
      .single(),
    supabase
      .from('evento_fechas')
      .select('id, fecha_inicio, fecha_fin')
      .eq('evento_id', id)
      .order('fecha_inicio'),
  ])

  if (!evento) notFound()

  const ev = evento as Record<string, unknown>
  const org = evento.organizacion as { id: string; nombre: string } | null
  const fraternidad = evento.fraternidad as { id: string; nombre: string } | null
  const casaRetiro = evento.casa_retiro as { id: string; nombre: string; ciudad?: string | null; provincia?: string | null; link_maps?: string | null } | null
  const coordinadorAsignado = ev.coordinador_asignado as { id: string; nombre: string; apellido: string } | null
  const asesorAsignado = ev.asesor_asignado as { id: string; nombre: string; apellido: string } | null
  const flyerH = ev.flyer_horizontal_url as string | null
  const flyerC = ev.flyer_cuadrado_url as string | null
  const linkPago = ev.link_pago_mercadopago as string | null

  const centralizadores = [
    { nombre: ev.centralizador_1_nombre as string | null, email: ev.centralizador_1_email as string | null, telefono: ev.centralizador_1_telefono as string | null },
    { nombre: ev.centralizador_2_nombre as string | null, email: ev.centralizador_2_email as string | null, telefono: ev.centralizador_2_telefono as string | null },
    { nombre: ev.centralizador_3_nombre as string | null, email: ev.centralizador_3_email as string | null, telefono: ev.centralizador_3_telefono as string | null },
  ].filter((c) => c.nombre)

  const locationParts = [
    evento.ciudad,
    evento.provincia_evento,
    evento.pais_evento !== 'Argentina' ? evento.pais_evento : null,
  ].filter(Boolean)

  const locationDetails = [
    evento.codigo_postal ? `CP ${evento.codigo_postal}` : null,
    evento.diocesis ? `Diócesis de ${evento.diocesis}` : null,
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-foreground focus:underline">
        Ir al contenido principal
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logoccd.jpeg" alt="Convivencia con Dios" width={32} height={32} className="rounded-md" priority />
            <span className="text-sm font-semibold text-foreground" translate="no">Convivencia con Dios</span>
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">

          {/* Back */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Volver a eventos
            </Link>
          </div>

          {/* Flyer */}
          {(flyerH || flyerC) && (
            <div className="rounded-xl overflow-hidden shadow-lg mb-8">
              {flyerH && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flyerH} alt={`Flyer de ${evento.nombre}`} className={`w-full object-cover${flyerC ? ' hidden sm:block' : ''}`} />
              )}
              {flyerC && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flyerC} alt={`Flyer de ${evento.nombre}`} className={`w-full object-cover${flyerH ? ' sm:hidden' : ''}`} />
              )}
            </div>
          )}

          {/* Título + badges */}
          <div className="space-y-3 mb-8">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="capitalize">{TIPO_LABELS[evento.tipo] ?? evento.tipo}</Badge>
              {evento.modalidad && evento.modalidad !== 'presencial' && (
                <Badge variant="outline">{MODALIDAD_LABELS[evento.modalidad] ?? evento.modalidad}</Badge>
              )}
              {ev.es_apv && <Badge variant="outline" className="text-xs">Aporte voluntario</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-snug">{evento.nombre}</h1>
            {(org?.nombre || fraternidad?.nombre) && (
              <p className="text-muted-foreground text-sm">
                {[fraternidad?.nombre, org?.nombre].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid gap-5 sm:grid-cols-2 mb-8 p-5 rounded-xl bg-muted/40 border border-border">

            {/* Fechas propuestas */}
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Fechas</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateRange(evento.fecha_inicio, evento.fecha_fin)}
                </p>
              </div>
            </div>

            {/* Lugar */}
            {(locationParts.length > 0 || casaRetiro) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Lugar</p>
                  {casaRetiro && (
                    <p className="text-sm font-medium text-foreground">{casaRetiro.nombre}</p>
                  )}
                  {locationParts.length > 0 && (
                    <p className="text-sm text-muted-foreground">{locationParts.join(', ')}</p>
                  )}
                  {locationDetails.length > 0 && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{locationDetails.join(' · ')}</p>
                  )}
                  {casaRetiro?.link_maps && (
                    <a href={casaRetiro.link_maps} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#F08020] hover:underline mt-1">
                      <MapPin className="h-3 w-3" />
                      Ver en Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Cupo */}
            {evento.cupo_maximo && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cupo</p>
                  <p className="text-sm font-medium text-foreground">{evento.cupo_maximo} personas</p>
                </div>
              </div>
            )}

            {/* Modalidad presencial */}
            {evento.modalidad === 'presencial' && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Modalidad</p>
                  <p className="text-sm font-medium text-foreground">Presencial</p>
                </div>
              </div>
            )}

            {/* Audiencia */}
            {evento.audiencia && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Dirigido a</p>
                  <p className="text-sm font-medium text-foreground">{evento.audiencia}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fechas de ejecución (si hay múltiples períodos) */}
          {fechasEjecucion && fechasEjecucion.length > 0 && (
            <div className="mb-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#F08020]" />
                Fechas de ejecución
              </h2>
              <div className="space-y-2">
                {(fechasEjecucion as Array<{ id: string; fecha_inicio: string; fecha_fin: string }>).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Período {i + 1}</span>
                    <span className="text-foreground">{formatDateRange(f.fecha_inicio, f.fecha_fin)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descripción / notas */}
          {(evento.descripcion || evento.notas) && (
            <div className="mb-8 border-t border-border pt-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#F08020]" />
                Información
              </h2>
              {evento.descripcion && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{evento.descripcion}</p>
              )}
              {evento.notas && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{evento.notas}</p>
              )}
            </div>
          )}

          {/* Coordinador / Asesor asignados */}
          {(coordinadorAsignado || asesorAsignado) && (
            <div className="mb-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#F08020]" />
                Equipo
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {coordinadorAsignado && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Coordinador</p>
                    <p className="text-sm font-medium text-foreground">
                      {coordinadorAsignado.nombre} {coordinadorAsignado.apellido}
                    </p>
                  </div>
                )}
                {asesorAsignado && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Asesor{ev.asesor_voluntario ? ' (voluntario)' : ''}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {asesorAsignado.nombre} {asesorAsignado.apellido}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Centralizadores */}
          {centralizadores.length > 0 && (
            <div className="mb-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#F08020]" />
                Contacto / Centralizadores
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {centralizadores.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                    <p className="font-medium text-sm text-foreground">{c.nombre}</p>
                    {c.email && (
                      <a href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#F08020] transition-colors">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {c.email}
                      </a>
                    )}
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#F08020] transition-colors">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {c.telefono}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row gap-3 items-start">
            <InteresModalWrapper eventoId={evento.id} eventoNombre={evento.nombre} />
            {linkPago && (
              <a href={linkPago} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#009EE3] hover:bg-[#0089C6] text-white text-sm font-medium px-4 py-2 transition-colors">
                <Link2Icon className="h-4 w-4" />
                Pagar con Mercado Pago
              </a>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-white/80 mt-16" style={{ backgroundColor: '#1B3A4C' }}>
        <p className="font-medium text-white mb-1" translate="no">Convivencia con Dios</p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
