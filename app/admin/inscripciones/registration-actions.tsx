"use client"

import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface RegistrationActionsProps {
  registrationId: string
  currentStatus: string
}

export function RegistrationActions({ registrationId, currentStatus }: RegistrationActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const supabase = createClient()

  const updateStatus = async (newStatus: string) => {
    setIsLoading(newStatus)
    
    await supabase
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", registrationId)

    router.refresh()
    setIsLoading(null)
  }

  if (currentStatus === "confirmed" || currentStatus === "cancelled") {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-2 bg-transparent"
        onClick={() => updateStatus("confirmed")}
        disabled={isLoading !== null}
      >
        {isLoading === "confirmed" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Confirmar
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
        onClick={() => updateStatus("cancelled")}
        disabled={isLoading !== null}
      >
        {isLoading === "cancelled" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        Cancelar
      </Button>
    </div>
  )
}
