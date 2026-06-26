'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Copy, Check } from 'lucide-react'

export type DatosPago = {
  alias: string
  cbu: string | null
  titular: string | null
  banco: string | null
  instrucciones: string | null
}

interface Props {
  eventoId: string
  eventoNombre: string
  montoInscripcion: number | null
  datosPago: DatosPago | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'datos' | 'pago' | 'listo'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* noop */
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-[#F08020] hover:underline"
      aria-label="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export function InteresModal({ eventoId, eventoNombre, montoInscripcion, datosPago, open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    localidad: '',
    provincia: '',
    pais: 'Argentina',
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('datos')
  const [error, setError] = useState<string | null>(null)
  const [participanteId, setParticipanteId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  // ¿Corresponde el paso de pago? Solo si hay monto y datos de cobro configurados.
  const requierePago = (montoInscripcion ?? 0) > 0 && !!datosPago

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmitDatos(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/public/interes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, evento_id: eventoId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error inesperado. Intentá de nuevo.')
      } else if (requierePago && data.evento_participante_id) {
        setParticipanteId(data.evento_participante_id)
        setStep('pago')
      } else {
        setStep('listo')
      }
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComprobante(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !participanteId) return
    setLoading(true)
    setError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setError('El archivo supera los 10 MB.')
      setLoading(false)
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Formato no permitido. Usá PDF, JPG, PNG o WebP.')
      setLoading(false)
      return
    }

    try {
      const fd = new FormData()
      fd.append('evento_participante_id', participanteId)
      fd.append('file', file)
      const res = await fetch('/api/public/pago-transferencia', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo subir el comprobante. Intentá de nuevo.')
      } else {
        setStep('listo')
      }
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setStep('datos')
      setError(null)
      setParticipanteId(null)
      setFile(null)
      setForm({ nombre: '', apellido: '', email: '', telefono: '', direccion: '', localidad: '', provincia: '', pais: 'Argentina' })
    }
    onOpenChange(open)
  }

  const montoLabel = montoInscripcion != null ? `$${montoInscripcion.toLocaleString('es-AR')}` : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'listo' ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-foreground">¡Gracias por tu interés!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {participanteId && file
                  ? <>Recibimos tu comprobante para <strong>{eventoNombre}</strong>. Lo verificaremos y nos comunicaremos pronto.</>
                  : <>Tu interés en <strong>{eventoNombre}</strong> fue registrado. Nos comunicaremos pronto.</>}
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="mt-2">
              Cerrar
            </Button>
          </div>
        ) : step === 'pago' && datosPago ? (
          <>
            <DialogHeader>
              <DialogTitle>Pago de inscripción</DialogTitle>
              <DialogDescription>
                Para reservar tu lugar en <strong className="text-foreground">{eventoNombre}</strong>
                {montoLabel ? <> transferí <strong className="text-foreground">{montoLabel}</strong></> : <> transferí el pago de inscripción</>}
                {' '}y adjuntá el comprobante.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Alias</p>
                  <p className="font-medium text-foreground">{datosPago.alias}</p>
                </div>
                <CopyButton value={datosPago.alias} />
              </div>
              {datosPago.cbu && (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">CBU / CVU</p>
                    <p className="font-medium text-foreground break-all">{datosPago.cbu}</p>
                  </div>
                  <CopyButton value={datosPago.cbu} />
                </div>
              )}
              {datosPago.titular && (
                <div>
                  <p className="text-xs text-muted-foreground">Titular</p>
                  <p className="font-medium text-foreground">{datosPago.titular}</p>
                </div>
              )}
              {datosPago.banco && (
                <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-medium text-foreground">{datosPago.banco}</p>
                </div>
              )}
              {datosPago.instrucciones && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-border pt-2">{datosPago.instrucciones}</p>
              )}
            </div>

            <form onSubmit={handleSubmitComprobante} className="grid gap-3 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="comprobante">
                  Comprobante <span className="text-destructive">*</span>{' '}
                  <span className="text-muted-foreground text-xs">(PDF o imagen, máx. 10 MB)</span>
                </Label>
                <Input
                  id="comprobante"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('listo')}
                  disabled={loading}
                >
                  Lo envío más tarde
                </Button>
                <Button type="submit" disabled={loading || !file}>
                  {loading ? 'Enviando...' : 'Enviar comprobante'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quiero participar</DialogTitle>
              <DialogDescription>
                Te invitamos a completar tus datos para recibir más información sobre{' '}
                <strong className="text-foreground">{eventoNombre}</strong>.
                Dentro de las próximas 48 horas, nos estaremos comunicando. ¡Bendiciones!
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitDatos} className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="nombre">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="apellido">
                    Apellido <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email">
                  Email <span className="text-muted-foreground text-xs">(recomendado)</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={handleChange}
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  autoComplete="street-address"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  name="localidad"
                  value={form.localidad}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    name="provincia"
                    value={form.provincia}
                    onChange={handleChange}
                    autoComplete="address-level1"
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    name="pais"
                    value={form.pais}
                    onChange={handleChange}
                    autoComplete="country-name"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : requierePago ? 'Continuar' : 'Registrar interés'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
