import Image from "next/image"
import Link from "next/link"
import { CalendarDays, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { EventosPublicosGrid } from "@/components/landing/EventosPublicosGrid"

const TIPO_LABELS: Record<string, string> = {
  convivencia: "Convivencia",
  retiro: "Retiro",
  taller: "Taller",
}

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  bimodal: "Bimodal",
}

function formatDateRange(inicio: string, fin: string) {
  const start = new Date(inicio + "T00:00:00")
  const end = new Date(fin + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
  const locale = "es-AR"
  if (inicio === fin) return start.toLocaleDateString(locale, opts)
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} al ${end.toLocaleDateString(locale, opts)}`
  }
  return `${start.toLocaleDateString(locale, { day: "numeric", month: "long" })} al ${end.toLocaleDateString(locale, opts)}`
}

export default async function LandingPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const eventosSelect = `id, nombre, tipo, fecha_inicio, fecha_fin, ciudad, provincia_evento, modalidad, cupo_maximo,
       organizacion:organizaciones!organizacion_id(nombre)`

  const [{ data: eventos }, { data: eventosAnteriores }] = await Promise.all([
    supabase
      .from("eventos")
      .select(eventosSelect)
      .eq("estado", "publicado")
      .gte("fecha_fin", today)
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("eventos")
      .select(eventosSelect)
      .or(`estado.eq.finalizado,and(estado.eq.publicado,fecha_fin.lt.${today})`)
      .order("fecha_inicio", { ascending: false })
      .limit(12),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-foreground focus:underline"
      >
        Ir al contenido principal
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logoccd.jpeg"
              alt="Convivencia con Dios"
              width={32}
              height={32}
              className="rounded-md"
              priority
            />
            <span className="text-sm font-semibold text-foreground" translate="no">
              Convivencia con Dios
            </span>
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/login">Acceder a la plataforma</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="main"
        className="flex flex-col items-center justify-center gap-6 px-4 py-20 text-center md:py-28"
        style={{ backgroundColor: "#F08020" }}
      >
        <Image
          src="/logoccd.jpeg"
          alt="Convivencia con Dios"
          width={96}
          height={96}
          className="rounded-2xl shadow-lg"
          priority
        />
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-white text-balance md:text-5xl" translate="no">
            Convivencia con Dios
          </h1>
          <p className="mx-auto max-w-md text-white/90 text-lg">
            Una meta posible y deseable
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-white text-[#F08020] hover:bg-orange-50 font-semibold shadow"
        >
          <Link href="/auth/login">Acceder a la plataforma</Link>
        </Button>
      </section>

      {/* About */}
      <section className="bg-white px-4 py-14 text-center">
        <p className="mx-auto max-w-xl text-muted-foreground leading-relaxed">
          Somos una <strong className="text-foreground">comunidad de oración, apostolado y vida</strong> que
          ayuda a las personas a encontrarse con un Dios vivo, alentándolos hacia la santidad,
          brindando una experiencia comunitaria de su presencia.
        </p>
      </section>

      {/* Events */}
      <section className="flex-1 bg-background px-4 pb-20 pt-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-bold text-foreground text-center">
            Próximos eventos
          </h2>

          {!eventos || eventos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-8 py-16 text-center text-muted-foreground">
              No hay eventos publicados próximamente.
            </div>
          ) : (
            <EventosPublicosGrid eventos={eventos} />
          )}
        </div>
      </section>

      {/* Past Events */}
      {eventosAnteriores && eventosAnteriores.length > 0 && (
        <section className="bg-white px-4 pb-20 pt-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-2xl font-bold text-foreground text-center">
              Eventos anteriores
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eventosAnteriores.map((evento) => {
                const org = evento.organizacion as unknown as { nombre: string } | null
                return (
                  <Card key={evento.id} className="flex flex-col opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="shrink-0 capitalize">
                          {TIPO_LABELS[evento.tipo] ?? evento.tipo}
                        </Badge>
                        {evento.modalidad && evento.modalidad !== "presencial" && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {MODALIDAD_LABELS[evento.modalidad] ?? evento.modalidad}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-2 text-base leading-snug line-clamp-2 text-muted-foreground">
                        {evento.nombre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{formatDateRange(evento.fecha_inicio, evento.fecha_fin)}</span>
                      </div>
                      {(evento.ciudad || evento.provincia_evento) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {[evento.ciudad, evento.provincia_evento].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {org?.nombre && (
                        <p className="mt-1 text-xs text-muted-foreground/70">{org.nombre}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="px-4 py-8 text-center text-sm text-white/80"
        style={{ backgroundColor: "#1B3A4C" }}
      >
        <p className="font-medium text-white mb-1" translate="no">
          Convivencia con Dios
        </p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
