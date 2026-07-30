'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InteresModal } from './InteresModal'

interface Props {
  eventoId: string
  eventoNombre: string
  montoInscripcion?: number | null
  mpDisponible?: boolean
}

export function InteresModalWrapper({ eventoId, eventoNombre, montoInscripcion, mpDisponible }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Quiero participar
      </Button>
      <InteresModal
        eventoId={eventoId}
        eventoNombre={eventoNombre}
        montoInscripcion={montoInscripcion ?? null}
        mpDisponible={mpDisponible ?? false}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
