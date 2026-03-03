'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewPersonaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
    direccion: '',
    ciudad: '',
    pais: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Aquí irá la lógica para guardar la persona en la BD
      // Por ahora es un placeholder
      console.log('Guardando persona:', formData)
      
      // Simulamos un delay y luego redirigimos
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/personas')
    } catch (err: any) {
      setError(err.message || 'Error al crear la persona')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-6">
      <Link href="/personas" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Personas
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Persona</CardTitle>
          <CardDescription>Completa el formulario para registrar una nueva persona en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-foreground">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-foreground">Apellido *</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  placeholder="García"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-foreground">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="+34 123 456 789"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Documento y Dirección */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documento" className="text-foreground">Documento (DNI/Cédula)</Label>
                <Input
                  id="documento"
                  name="documento"
                  placeholder="12345678A"
                  value={formData.documento}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-foreground">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  placeholder="Calle Principal 123"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ciudad y País */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ciudad" className="text-foreground">Ciudad</Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  placeholder="Madrid"
                  value={formData.ciudad}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais" className="text-foreground">País</Label>
                <Input
                  id="pais"
                  name="pais"
                  placeholder="España"
                  value={formData.pais}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear Persona'}
              </Button>
              <Link href="/personas">
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
