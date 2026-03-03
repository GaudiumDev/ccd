import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, MapPin, Users, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createClient } from "@/lib/supabase/server"

async function getRetreat(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("retreats")
    .select(`
      *,
      confraternities (name, description)
    `)
    .eq("id", id)
    .single()
  
  return data
}

export default async function RetreatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const retreat = await getRetreat(id)

  if (!retreat) {
    notFound()
  }

  const spotsLeft = retreat.max_participants - (retreat.current_participants || 0)
  const isFull = spotsLeft <= 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-8">
          <div className="container mx-auto px-4">
            <Link href="/retiros" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver a Retiros
            </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {retreat.confraternities?.name || "Cofradía"}
                    </span>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                      {retreat.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
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
                      <MapPin className="h-5 w-5" />
                      <span>{retreat.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>{retreat.current_participants || 0} / {retreat.max_participants} participantes</span>
                    </div>
                  </div>

                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Descripción</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {retreat.description}
                      </p>
                    </CardContent>
                  </Card>

                  {retreat.confraternities?.description && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Sobre la Cofradía</CardTitle>
                        <CardDescription>{retreat.confraternities.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {retreat.confraternities.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl text-foreground">
                      ${retreat.price?.toFixed(2) || "Gratis"}
                    </CardTitle>
                    <CardDescription>Por persona</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cupos disponibles</span>
                        <span className="font-medium text-foreground">
                          {spotsLeft > 0 ? `${spotsLeft} cupos` : "Agotado"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fecha límite</span>
                        <span className="font-medium text-foreground">
                          {new Date(retreat.registration_deadline || retreat.start_date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                      </div>
                    </div>

                    <Link href={isFull ? "#" : `/retiros/${retreat.id}/inscripcion`} className="block">
                      <Button className="w-full" size="lg" disabled={isFull}>
                        {isFull ? "Cupos Agotados" : "Inscribirme Ahora"}
                      </Button>
                    </Link>

                    {!isFull && spotsLeft <= 5 && (
                      <p className="text-center text-sm text-accent">
                        <Clock className="mr-1 inline h-4 w-4" />
                        ¡Solo quedan {spotsLeft} cupos!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
