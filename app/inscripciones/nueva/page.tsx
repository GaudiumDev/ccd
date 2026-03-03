'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewInscripcionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    persona: '',
    evento: '',
    email: '',
    telefono: '',
    necesidadesEspeciales: '',
    numeroDocumento: '',
    diasAsistencia: 'completo',
    aceptaTerminos: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Guardando inscripción:', formData)
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/inscripciones')
    } catch (err: any) {
      setError(err.message || 'Error al crear la inscripción')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/inscripciones" className="inline-flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Volver a Inscripciones
      </Link>

      <Card className="border-border bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nueva Inscripción</CardTitle>
          <CardDescription>Registra una nueva inscripción a un evento</CardDescription>
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
                  placeholder="Selecciona o busca una persona"
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
                  placeholder="Selecciona el evento"
                  value={formData.evento}
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
                  placeholder="correo@ejemplo.com"
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

            {/* Documento y Días Asistencia */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroDocumento" className="text-foreground">Número de Documento</Label>
                <Input
                  id="numeroDocumento"
                  name="numeroDocumento"
                  placeholder="DNI/Cédula"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAsistencia" className="text-foreground">Días de Asistencia</Label>
                <select
                  id="diasAsistencia"
                  name="diasAsistencia"
                  value={formData.diasAsistencia}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="completo">Evento Completo</option>
                  <option value="primer-dia">Solo Primer Día</option>
                  <option value="ultimos-dias">Últimos Días</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
            </div>

            {/* Necesidades Especiales */}
            <div className="space-y-2">
              <Label htmlFor="necesidadesEspeciales" className="text-foreground">Necesidades Especiales</Label>
              <textarea
                id="necesidadesEspeciales"
                name="necesidadesEspeciales"
                placeholder="Indica si tienes alguna necesidad especial (dieta, alojamiento, etc.)"
                value={formData.necesidadesEspeciales}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground min-h-20"
              />
            </div>

            {/* Términos */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="aceptaTerminos"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                className="mt-1"
              />
              <Label htmlFor="aceptaTerminos" className="text-foreground cursor-pointer">
                Acepto los términos y condiciones del evento *
              </Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear Inscripción'}
              </Button>
              <Link href="/inscripciones">
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
