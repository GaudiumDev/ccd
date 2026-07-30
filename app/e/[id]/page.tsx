import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ArrowLeft, CalendarDays, MapPin, Users, Phone, Mail, Building2, BookOpen, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InteresModalWrapper } from '@/components/landing/InteresModalWrapper'
import { hayCuentaConectada } from '@/lib/mercadopago/org-account'

// El precio y la disponibilidad de Mercado Pago pueden cambiar en cualquier
// momento (una organización conecta su cuenta) — no cachear esta página.
export const dynamic = 'force-dynamic'

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
  // Página pública: el control de acceso es el filtro estado='publicado' de
  // abajo, no RLS. Usamos el cliente de servicio porque organizaciones no
  // tiene policy de lectura anónima y el join a fraternidad/organizacion
  // (necesario para saber si hay cuenta de Mercado Pago conectada) devolvería
  // null con el cliente atado a la sesión del visitante.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ data: evento }, { data: fechasEjecucion }] = await Promise.all([
    supabase
      .from('eventos')
      .select(`
        id, nombre, tipo, estado, fecha_inicio, fecha_fin,
        modalidad, descripcion, notas, cupo_maximo, audiencia,
        ciudad, codigo_postal, diocesis, provincia_evento, pais_evento,
        es_apv, precio,
        flyer_horizontal_url, flyer_cuadrado_url,
        asesor_voluntario,
        centralizador_1_persona_id, centralizador_1_nombre, centralizador_1_email, centralizador_1_telefono,
        centralizador_2_persona_id, centralizador_2_nombre, centralizador_2_email, centralizador_2_telefono,
        centralizador_3_persona_id, centralizador_3_nombre, centralizador_3_email, centralizador_3_telefono,
        organizacion:organizaciones!organizacion_id(id, nombre, pago_alias, pago_cbu, pago_titular, pago_banco, pago_instrucciones),
        fraternidad:organizaciones!fraternidad_id(id, nombre, pago_alias, pago_cbu, pago_titular, pago_banco, pago_instrucciones),
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

  type Org = {
    id: string
    nombre: string
    pago_alias?: string | null
    pago_cbu?: string | null
    pago_titular?: string | null
    pago_banco?: string | null
    pago_instrucciones?: string | null
  }

  const ev = evento as Record<string, unknown>
  const org = evento.organizacion as Org | null
  const fraternidad = evento.fraternidad as Org | null
  const casaRetiro = evento.casa_retiro as { id: string; nombre: string; ciudad?: string | null; provincia?: string | null; link_maps?: string | null } | null
  const flyerH = ev.flyer_horizontal_url as string | null
  const flyerC = ev.flyer_cuadrado_url as string | null
  const montoInscripcion = ev.precio != null ? Number(ev.precio) : null

  const mpDisponible = await hayCuentaConectada(org?.id ?? null, fraternidad?.id ?? null)

  // Datos de transferencia: preferir los de la fraternidad si tiene alias; si no, los de la confraternidad.
  const orgPago = fraternidad?.pago_alias ? fraternidad : org
  const datosPago = orgPago?.pago_alias
    ? {
        alias: orgPago.pago_alias as string,
        cbu: orgPago.pago_cbu ?? null,
        titular: orgPago.pago_titular ?? null,
        banco: orgPago.pago_banco ?? null,
        instrucciones: orgPago.pago_instrucciones ?? null,
      }
    : null

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

            {/* Precio de inscripción */}
            {montoInscripcion != null && montoInscripcion > 0 && (
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 shrink-0 mt-0.5 text-[#F08020]" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Precio</p>
                  <p className="text-sm font-medium text-foreground">${montoInscripcion.toLocaleString('es-AR')}</p>
                  {mpDisponible && datosPago ? (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Se abona con Mercado Pago o por transferencia al inscribirte</p>
                  ) : mpDisponible ? (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Se abona con Mercado Pago al inscribirte</p>
                  ) : datosPago ? (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Se abona por transferencia al inscribirte</p>
                  ) : null}
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
            <InteresModalWrapper
              eventoId={evento.id}
              eventoNombre={evento.nombre}
              montoInscripcion={montoInscripcion}
              mpDisponible={mpDisponible}
              datosPago={datosPago}
              volverAlListadoHref="/#panel-eventos"
            />
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
