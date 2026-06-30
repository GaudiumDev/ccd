"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface SeguimientoActionsProps {
  participanteId: string
  personaId: string
  estadoContacto: string
  medioContacto: string | null
  notasSeguimiento: string | null
}

const ESTADOS_CONTACTO = [
  { value: "no_contactado", label: "No contactado" },
  { value: "contactado", label: "Contactado" },
  { value: "sin_respuesta", label: "Sin respuesta" },
  { value: "confirmo", label: "Confirmó" },
  { value: "declino", label: "Declinó" },
]

const MEDIOS_CONTACTO = [
  { value: "", label: "— Medio —" },
  { value: "telefono", label: "Teléfono" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "personal", label: "Personal" },
  { value: "otro", label: "Otro" },
]

export function SeguimientoActions({
  participanteId,
  personaId,
  estadoContacto,
  medioContacto,
  notasSeguimiento,
}: SeguimientoActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [estado, setEstado] = useState(estadoContacto ?? "no_contactado")
  const [medio, setMedio] = useState(medioContacto ?? "")
  const [notas, setNotas] = useState(notasSeguimiento ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty =
    estado !== (estadoContacto ?? "no_contactado") ||
    medio !== (medioContacto ?? "") ||
    notas !== (notasSeguimiento ?? "")

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    const contactado = estado !== "no_contactado"
    await supabase
      .from("evento_participantes")
      .update({
        estado_contacto: estado,
        medio_contacto: medio || null,
        notas_seguimiento: notas.trim() || null,
        fecha_contacto: contactado ? new Date().toISOString() : null,
        contactado_por: contactado ? personaId || null : null,
      })
      .eq("id", participanteId)

    setIsSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="flex w-full flex-col gap-2 lg:w-64">
      <select
        value={estado}
        onChange={(e) => {
          setEstado(e.target.value)
          setSaved(false)
        }}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
      >
        {ESTADOS_CONTACTO.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={medio}
        onChange={(e) => {
          setMedio(e.target.value)
          setSaved(false)
        }}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
      >
        {MEDIOS_CONTACTO.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <textarea
        value={notas}
        onChange={(e) => {
          setNotas(e.target.value)
          setSaved(false)
        }}
        rows={2}
        placeholder="Nota de seguimiento..."
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
      />

      <Button
        size="sm"
        className="gap-1.5 text-xs"
        onClick={handleSave}
        disabled={isSaving || !dirty}
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        {saved && !dirty ? "Guardado" : "Guardar"}
      </Button>
    </div>
  )
}
