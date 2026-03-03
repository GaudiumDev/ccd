import Link from "next/link"
import { Plus, Calendar, MapPin, Users, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
  completed: "Completado",
}

async function getRetreats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("retreats")
    .select(`
      *,
      confraternities (name),
      registrations (id)
    `)
    .order("created_at", { ascending: false })
  
  return data || []
}

export default async function AdminRetreatsPage() {
  const retreats = await getRetreats()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Retiros</h1>
          <p className="mt-1 text-muted-foreground">Gestiona todos los retiros</p>
        </div>
        <Link href="/admin/retiros/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Retiro
          </Button>
        </Link>
      </div>

      {retreats.length > 0 ? (
        <div className="grid gap-4">
          {retreats.map((retreat) => (
            <Card key={retreat.id} className="border-border">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{retreat.name}</h3>
                    <Badge className={statusColors[retreat.status]}>
                      {statusLabels[retreat.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(retreat.start_date).toLocaleDateString("es-ES")} - {new Date(retreat.end_date).toLocaleDateString("es-ES")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {retreat.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {retreat.registrations?.length || 0} / {retreat.max_participants}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {retreat.confraternities?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/retiros/${retreat.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                  <Link href={`/admin/retiros/${retreat.id}/inscripciones`}>
                    <Button variant="outline" size="sm">Inscripciones</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Sin retiros</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primer retiro para comenzar
            </p>
            <Link href="/admin/retiros/nuevo" className="mt-4 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Retiro
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
