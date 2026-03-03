'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const estadosEventos = ['borrador', 'publicado', 'en_progreso', 'finalizado', 'cancelado']

export default function NewEventoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'retiro',
    estado: 'borrador',
    organizacion: '',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: '',
    capacidadMaxima: '100',
    precioRegistro: '0',
    fechaLimiteRegistro: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Guardando evento:', formData)
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/eventos')
    } catch (err: any) {
      setError(err.message || 'Error al crear el evento')
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
      <Link href="/eventos" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Eventos
      </Link>

      <Card className="border-border bg-card max-w-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nuevo Evento</CardTitle>
          <CardDescription>Completa el formulario para crear un nuevo evento espiritual</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre y Tipo */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-foreground">Nombre del Evento *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Retiro Espiritual 2024"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-foreground">Tipo de Evento *</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="retiro">Retiro Espiritual</option>
                  <option value="convivencia">Convivencia</option>
                  <option value="taller">Taller</option>
                  <option value="misa">Misa</option>
                  <option value="conferencia">Conferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-foreground">Descripción *</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Describe los detalles del evento..."
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground min-h-24"
                required
              />
            </div>

            {/* Organización y Estado */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organizacion" className="text-foreground">Organización *</Label>
                <Input
                  id="organizacion"
                  name="organizacion"
                  placeholder="Nombre de la organización"
                  value={formData.organizacion}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-foreground">Estado del Evento *</Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  {estadosEventos.map(estado => (
                    <option key={estado} value={estado}>
                      {estado.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-foreground">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="datetime-local"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin" className="text-foreground">Fecha de Fin *</Label>
                <Input
                  id="fechaFin"
                  name="fechaFin"
                  type="datetime-local"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="text-foreground">Ubicación *</Label>
              <Input
                id="ubicacion"
                name="ubicacion"
                placeholder="Ciudad, país o dirección específica"
                value={formData.ubicacion}
                onChange={handleChange}
                required
              />
            </div>

            {/* Capacidad y Precio */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacidadMaxima" className="text-foreground">Capacidad Máxima</Label>
                <Input
                  id="capacidadMaxima"
                  name="capacidadMaxima"
                  type="number"
                  placeholder="100"
                  value={formData.capacidadMaxima}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioRegistro" className="text-foreground">Precio de Registro</Label>
                <Input
                  id="precioRegistro"
                  name="precioRegistro"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precioRegistro}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Fecha Límite de Registro */}
            <div className="space-y-2">
              <Label htmlFor="fechaLimiteRegistro" className="text-foreground">Fecha Límite de Registro</Label>
              <Input
                id="fechaLimiteRegistro"
                name="fechaLimiteRegistro"
                type="datetime-local"
                value={formData.fechaLimiteRegistro}
                onChange={handleChange}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear Evento'}
              </Button>
              <Link href="/eventos">
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
