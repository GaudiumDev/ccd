import Image from "next/image"
import Link from "next/link"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

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

  const { data: eventos } = await supabase
    .from("eventos")
    .select(
      `id, nombre, tipo, fecha_inicio, fecha_fin, ciudad, provincia_evento, modalidad, cupo_maximo,
       organizacion:organizaciones!organizacion_id(nombre)`,
    )
    .eq("estado", "publicado")
    .gte("fecha_fin", today)
    .order("fecha_inicio", { ascending: true })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logoccd.jpeg"
              alt="Convivencia con Dios"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-sm font-semibold text-foreground">
              Convivencia con Dios
            </span>
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/login">Acceder a la plataforma</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-24">
        <Image
          src="/logoccd.jpeg"
          alt="Convivencia con Dios"
          width={96}
          height={96}
          className="rounded-2xl shadow-lg"
        />
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Convivencia con Dios
          </h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Somos una comunidad de oración, apostolado y vida que ayuda a las
            personas a encontrarse con un Dios vivo, alentándolos hacia la
            santidad, brindando una experiencia comunitaria de su presencia.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/auth/login">Acceder a la plataforma</Link>
        </Button>
      </section>

      {/* Events */}
      <section className="flex-1 px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Próximos eventos
          </h2>

          {!eventos || eventos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-8 py-16 text-center text-muted-foreground">
              No hay eventos publicados próximamente.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eventos.map((evento) => {
                const org = evento.organizacion as { nombre: string } | null
                return (
                  <Card key={evento.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize"
                        >
                          {TIPO_LABELS[evento.tipo] ?? evento.tipo}
                        </Badge>
                        {evento.modalidad &&
                          evento.modalidad !== "presencial" && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-xs"
                            >
                              {MODALIDAD_LABELS[evento.modalidad] ??
                                evento.modalidad}
                            </Badge>
                          )}
                      </div>
                      <CardTitle className="mt-2 text-base leading-snug">
                        {evento.nombre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span>
                          {formatDateRange(
                            evento.fecha_inicio,
                            evento.fecha_fin,
                          )}
                        </span>
                      </div>
                      {(evento.ciudad || evento.provincia_evento) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>
                            {[evento.ciudad, evento.provincia_evento]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      {evento.cupo_maximo && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>Cupo: {evento.cupo_maximo} personas</span>
                        </div>
                      )}
                      {org?.nombre && (
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          {org.nombre}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Convivencia con Dios.
      </footer>
    </div>
  )
}
