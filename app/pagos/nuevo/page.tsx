'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewPagoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    persona: '',
    evento: '',
    monto: '',
    metodo: 'transferencia',
    estado: 'pendiente',
    fecha: new Date().toISOString().split('T')[0],
    referencia: '',
    notas: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Guardando pago:', formData)
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/pagos')
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-6">
      <Link href="/pagos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Pagos
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Registrar Nuevo Pago</CardTitle>
          <CardDescription>Registra un pago de una inscripción a un evento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Persona y Evento */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="persona" className="text-foreground">Persona *</Label>
                <Input
                  id="persona"
                  name="persona"
                  placeholder="Selecciona una persona"
                  value={formData.persona}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento" className="text-foreground">Evento *</Label>
                <Input
                  id="evento"
                  name="evento"
                  placeholder="Selecciona un evento"
                  value={formData.evento}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Monto y Método */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monto" className="text-foreground">Monto (€) *</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metodo" className="text-foreground">Método de Pago *</Label>
                <select
                  id="metodo"
                  name="metodo"
                  value={formData.metodo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta de Crédito</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="cheque">Cheque</option>
                  <option value="paypal">PayPal</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha y Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="text-foreground">Fecha del Pago *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-foreground">Estado *</Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="procesado">Procesado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="referencia" className="text-foreground">Referencia de Pago</Label>
              <Input
                id="referencia"
                name="referencia"
                placeholder="Número de transacción, cheque, etc."
                value={formData.referencia}
                onChange={handleChange}
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas" className="text-foreground">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                placeholder="Observaciones adicionales sobre el pago..."
                value={formData.notas}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground min-h-20"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Registrar Pago'}
              </Button>
              <Link href="/pagos">
                <Button type="button" variant="outline" className="bg-transparent">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
