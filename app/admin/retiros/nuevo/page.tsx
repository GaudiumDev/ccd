"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface Confraternity {
  id: string
  name: string
}

export default function NewRetreatPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confraternities, setConfraternities] = useState<Confraternity[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: "",
    price: "",
    confraterityId: "",
    status: "draft",
  })

  const supabase = createClient()

  useEffect(() => {
    const loadConfraternities = async () => {
      const { data } = await supabase.from("confraternities").select("id, name")
      if (data) setConfraternities(data)
    }
    loadConfraternities()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: insertError } = await supabase.from("retreats").insert({
      name: formData.name,
      description: formData.description,
      location: formData.location,
      start_date: formData.startDate,
      end_date: formData.endDate,
      registration_deadline: formData.registrationDeadline || null,
      max_participants: parseInt(formData.maxParticipants),
      price: parseFloat(formData.price) || 0,
      confraternity_id: formData.confraterityId || null,
      status: formData.status,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push("/admin/retiros")
    router.refresh()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/retiros" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Retiros
        </Link>
      </div>

      <Card className="mx-auto max-w-2xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Crear Nuevo Retiro</CardTitle>
          <CardDescription>Completa la información del retiro</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Retiro *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Fecha Límite de Inscripción</Label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Máximo de Participantes *</Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confraternity">Cofradía</Label>
              <Select
                value={formData.confraterityId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, confraterityId: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cofradía" />
                </SelectTrigger>
                <SelectContent>
                  {confraternities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Retiro"
                )}
              </Button>
              <Link href="/admin/retiros">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
