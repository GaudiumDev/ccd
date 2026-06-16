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
import { CheckCircle } from 'lucide-react'

interface Props {
  eventoId: string
  eventoNombre: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InteresModal({ eventoId, eventoNombre, open, onOpenChange }: Props) {
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
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
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
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setSuccess(false)
      setError(null)
      setForm({ nombre: '', apellido: '', email: '', telefono: '', direccion: '', localidad: '', provincia: '', pais: 'Argentina' })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-foreground">¡Gracias por tu interés!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu interés en <strong>{eventoNombre}</strong> fue registrado. Nos comunicaremos pronto.
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="mt-2">
              Cerrar
            </Button>
          </div>
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

            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
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
                  {loading ? 'Enviando...' : 'Registrar interés'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
