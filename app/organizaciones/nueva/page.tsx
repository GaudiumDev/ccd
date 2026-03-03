'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewOrganizacionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo: 'parroquia',
    direccion: '',
    ciudad: '',
    pais: '',
    sitioWeb: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Guardando organización:', formData)
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/organizaciones')
    } catch (err: any) {
      setError(err.message || 'Error al crear la organización')
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
      <Link href="/organizaciones" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Organizaciones
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Organización</CardTitle>
          <CardDescription>Completa el formulario para registrar una nueva organización en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Nombre e Email */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-foreground">Nombre de la Organización *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Parroquia San Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contacto@sanjuan.org"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Teléfono y Tipo */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-foreground">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="+34 123 456 789"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-foreground">Tipo de Organización *</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="parroquia">Parroquia</option>
                  <option value="diocesis">Diócesis</option>
                  <option value="comunidad">Comunidad Religiosa</option>
                  <option value="movimiento">Movimiento Eclesial</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
            </div>

            {/* Dirección */}
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

            {/* Sitio Web */}
            <div className="space-y-2">
              <Label htmlFor="sitioWeb" className="text-foreground">Sitio Web</Label>
              <Input
                id="sitioWeb"
                name="sitioWeb"
                type="url"
                placeholder="https://www.ejemplo.org"
                value={formData.sitioWeb}
                onChange={handleChange}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-foreground">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                placeholder="Información sobre la organización..."
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground min-h-24"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear Organización'}
              </Button>
              <Link href="/organizaciones">
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
