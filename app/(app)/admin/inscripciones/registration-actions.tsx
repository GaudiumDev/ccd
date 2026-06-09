"use client"

import { useRouter } from "next/navigation"
import { Check, X, Loader2, Play, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface RegistrationActionsProps {
  participanteId: string
  personaId: string
  currentStatus: string
  tipoParticipante: string | null
}

export function RegistrationActions({
  participanteId,
  personaId,
  currentStatus,
  tipoParticipante,
}: RegistrationActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [confirmingInscripto, setConfirmingInscripto] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState(tipoParticipante ?? "no_cecista")
  const supabase = createClient()

  const updateStatus = async (newStatus: string, extraData?: Record<string, unknown>) => {
    setIsLoading(newStatus)

    await supabase
      .from("evento_participantes")
      .update({ estado_participacion: newStatus, ...extraData })
      .eq("id", participanteId)

    // When event completed and participant was no_cecista, advance their community standing
    const resolvedTipo = (extraData?.tipo_participante as string | undefined) ?? tipoParticipante
    if (newStatus === "completado" && resolvedTipo === "no_cecista") {
      await supabase
        .from("personas")
        .update({ tipo_persona: "cecista" })
        .eq("id", personaId)
    }

    router.refresh()
    setIsLoading(null)
    setConfirmingInscripto(false)
  }

  if (currentStatus === "completado" || currentStatus === "cancelado") return null

  if (confirmingInscripto) {
    return (
      <div className="flex flex-col gap-2 w-52">
        <p className="text-xs font-medium text-muted-foreground">Tipo de participante:</p>
        <select
          value={selectedTipo}
          onChange={(e) => setSelectedTipo(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
        >
          <option value="no_cecista">No cecista (primera vez)</option>
          <option value="cecista">Cecista</option>
        </select>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-xs flex-1"
            onClick={() => updateStatus("inscripto", { tipo_participante: selectedTipo })}
            disabled={isLoading !== null}
          >
            {isLoading === "inscripto" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => setConfirmingInscripto(false)}
            disabled={isLoading !== null}
          >
            Atrás
          </Button>
        </div>
      </div>
    )
  }

  if (currentStatus === "interesado" || currentStatus === "lista_espera") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => setConfirmingInscripto(true)}
          disabled={isLoading !== null}
        >
          <Check className="h-4 w-4" />
          Inscribir
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          onClick={() => updateStatus("cancelado")}
          disabled={isLoading !== null}
        >
          {isLoading === "cancelado" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Cancelar
        </Button>
      </div>
    )
  }

  if (currentStatus === "inscripto") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => updateStatus("en_curso")}
          disabled={isLoading !== null}
        >
          {isLoading === "en_curso" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Marcar en curso
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          onClick={() => updateStatus("cancelado")}
          disabled={isLoading !== null}
        >
          {isLoading === "cancelado" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Cancelar
        </Button>
      </div>
    )
  }

  if (currentStatus === "en_curso") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-2 bg-transparent"
        onClick={() => updateStatus("completado")}
        disabled={isLoading !== null}
      >
        {isLoading === "completado" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Flag className="h-4 w-4" />
        )}
        Marcar completado
      </Button>
    )
  }

  return null
}
