import Link from "next/link"
import { Plus, Building2, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getConfraternities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("confraternities")
    .select(`
      *,
      retreats (id)
    `)
    .order("name", { ascending: true })
  
  return data || []
}

export default async function AdminConfraternitiesPage() {
  const confraternities = await getConfraternities()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Cofradías</h1>
          <p className="mt-1 text-muted-foreground">Gestiona las cofradías registradas</p>
        </div>
        <Link href="/admin/cofradias/nueva">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cofradía
          </Button>
        </Link>
      </div>

      {confraternities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {confraternities.map((confraternity) => (
            <Card key={confraternity.id} className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{confraternity.name}</CardTitle>
                {confraternity.location && (
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {confraternity.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {confraternity.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {confraternity.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {confraternity.retreats?.length || 0} retiros
                  </span>
                  <Link href={`/admin/cofradias/${confraternity.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Sin cofradías</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra tu primera cofradía para comenzar
            </p>
            <Link href="/admin/cofradias/nueva" className="mt-4 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Cofradía
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
