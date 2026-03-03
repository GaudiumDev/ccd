import { Calendar, User, Mail, Phone, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { RegistrationActions } from "./registration-actions"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  attended: "bg-blue-100 text-blue-800",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  attended: "Asistió",
}

async function getRegistrations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("registrations")
    .select(`
      *,
      retreats (name, start_date, location)
    `)
    .order("created_at", { ascending: false })
  
  return data || []
}

export default async function AdminRegistrationsPage() {
  const registrations = await getRegistrations()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Inscripciones</h1>
        <p className="mt-1 text-muted-foreground">Gestiona todas las inscripciones a retiros</p>
      </div>

      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <Card key={reg.id} className="border-border">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{reg.participant_name}</h3>
                      <Badge className={statusColors[reg.status]}>
                        {statusLabels[reg.status]}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {reg.retreats?.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {reg.participant_email}
                      </p>
                      {reg.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {reg.phone}
                        </p>
                      )}
                    </div>

                    {reg.medical_info && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground">Info Médica:</p>
                        <p className="text-sm text-foreground">{reg.medical_info}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Registrado: {new Date(reg.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <RegistrationActions registrationId={reg.id} currentStatus={reg.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Sin inscripciones</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aún no hay inscripciones registradas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
