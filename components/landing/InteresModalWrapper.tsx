'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InteresModal, type DatosPago } from './InteresModal'

interface Props {
  eventoId: string
  eventoNombre: string
  montoInscripcion?: number | null
  datosPago?: DatosPago | null
  volverAlListadoHref?: string
}

export function InteresModalWrapper({ eventoId, eventoNombre, montoInscripcion, datosPago, volverAlListadoHref }: Props) {
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
        datosPago={datosPago ?? null}
        open={open}
        onOpenChange={setOpen}
        volverAlListadoHref={volverAlListadoHref}
      />
    </>
  )
}
