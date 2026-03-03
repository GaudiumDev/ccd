import Link from "next/link"
import { Calendar, Users, Building2, TrendingUp, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

async function getStats() {
  const supabase = await createClient()
  
  const [retreatsResult, registrationsResult, confraternitiesResult] = await Promise.all([
    supabase.from("retreats").select("id", { count: "exact" }),
    supabase.from("registrations").select("id", { count: "exact" }),
    supabase.from("confraternities").select("id", { count: "exact" }),
  ])

  const { data: recentRegistrations } = await supabase
    .from("registrations")
    .select(`
      *,
      retreats (name),
      profiles:user_id (first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    retreatsCount: retreatsResult.count || 0,
    registrationsCount: registrationsResult.count || 0,
    confraternitiesCount: confraternitiesResult.count || 0,
    recentRegistrations: recentRegistrations || [],
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Panel de Administración</h1>
        <p className="mt-1 text-muted-foreground">Gestiona retiros, inscripciones y cofradías</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Retiros</CardDescription>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.retreatsCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Inscripciones</CardDescription>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.registrationsCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Cofradías</CardDescription>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.confraternitiesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Tasa Conversión</CardDescription>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">--</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Inscripciones Recientes</CardTitle>
              <CardDescription>Últimas solicitudes recibidas</CardDescription>
            </div>
            <Link href="/admin/inscripciones">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRegistrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {reg.participant_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{reg.retreats?.name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(reg.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No hay inscripciones recientes</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>Gestión de contenido</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/admin/retiros/nuevo">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Calendar className="h-4 w-4" />
                Crear Nuevo Retiro
              </Button>
            </Link>
            <Link href="/admin/cofradias/nueva">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Building2 className="h-4 w-4" />
                Agregar Cofradía
              </Button>
            </Link>
            <Link href="/admin/inscripciones">
              <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                <Users className="h-4 w-4" />
                Gestionar Inscripciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
