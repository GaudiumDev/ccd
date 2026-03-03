import Link from "next/link"
import { Calendar, MapPin, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createClient } from "@/lib/supabase/server"

async function getRetreats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("retreats")
    .select(`
      *,
      confraternities (name)
    `)
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
  
  return data || []
}

export default async function RetirosPage() {
  const retreats = await getRetreats()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Retiros Disponibles
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encuentra el retiro espiritual perfecto para ti
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar retiros..."
                  className="pl-10"
                />
              </div>
            </div>

            {retreats.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {retreats.map((retreat) => (
                  <Card key={retreat.id} className="overflow-hidden border-border bg-card transition-shadow hover:shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {retreat.confraternities?.name || "Cofradía"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {retreat.max_participants - (retreat.current_participants || 0)} cupos
                        </span>
                      </div>
                      <CardTitle className="mt-3 line-clamp-2 text-foreground">
                        {retreat.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {retreat.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(retreat.start_date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                            })} - {new Date(retreat.end_date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{retreat.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{retreat.current_participants || 0} / {retreat.max_participants} participantes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-semibold text-foreground">
                          ${retreat.price?.toFixed(2) || "Gratis"}
                        </span>
                        <Link href={`/retiros/${retreat.id}`}>
                          <Button>Ver Detalles</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No hay retiros disponibles</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Actualmente no hay retiros programados. Vuelve pronto para ver nuevas experiencias espirituales.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
