"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function NewConfraterityPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
  })

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: insertError } = await supabase.from("confraternities").insert({
      name: formData.name,
      description: formData.description || null,
      location: formData.location || null,
      contact_email: formData.contactEmail || null,
      contact_phone: formData.contactPhone || null,
      website: formData.website || null,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push("/admin/cofradias")
    router.refresh()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/cofradias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Cofradías
        </Link>
      </div>

      <Card className="mx-auto max-w-2xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Registrar Nueva Cofradía</CardTitle>
          <CardDescription>Completa la información de la cofradía</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Cofradía *</Label>
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
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de Contacto</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://"
                value={formData.website}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Cofradía"
                )}
              </Button>
              <Link href="/admin/cofradias">
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
