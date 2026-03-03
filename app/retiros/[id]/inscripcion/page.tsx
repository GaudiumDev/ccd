"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createClient } from "@/lib/supabase/client"

interface Retreat {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string
  price: number
  max_participants: number
  current_participants: number
}

export default function RegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const retreatId = params.id as string
  
  const [retreat, setRetreat] = useState<Retreat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    medicalInfo: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({ id: user.id, email: user.email || "" })
        setFormData(prev => ({ ...prev, email: user.email || "" }))
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .single()
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            phone: profile.phone || "",
          }))
        }
      }

      const { data: retreatData } = await supabase
        .from("retreats")
        .select("*")
        .eq("id", retreatId)
        .single()
      
      if (retreatData) {
        setRetreat(retreatData)
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [retreatId, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      router.push(`/auth/login?redirect=/retiros/${retreatId}/inscripcion`)
      return
    }

    const { error: regError } = await supabase
      .from("registrations")
      .insert({
        retreat_id: retreatId,
        user_id: user.id,
        participant_name: formData.fullName,
        participant_email: formData.email,
        phone: formData.phone,
        emergency_contact: formData.emergencyContact,
        medical_info: formData.medicalInfo,
        status: "pending",
      })

    if (regError) {
      if (regError.code === "23505") {
        setError("Ya estás inscrito en este retiro.")
      } else {
        setError(regError.message)
      }
      setIsSubmitting(false)
      return
    }

    setIsSuccess(true)
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!retreat) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Retiro no encontrado</h1>
            <Link href="/retiros" className="mt-4 inline-block text-primary hover:underline">
              Volver a retiros
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-border text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="mt-4 text-2xl text-foreground">¡Inscripción Exitosa!</CardTitle>
              <CardDescription>
                Tu solicitud ha sido recibida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hemos recibido tu inscripción para <strong>{retreat.name}</strong>. 
                Recibirás un correo con los detalles y próximos pasos.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard">
                  <Button className="w-full">Ver mis Inscripciones</Button>
                </Link>
                <Link href="/retiros">
                  <Button variant="outline" className="w-full bg-transparent">Ver más Retiros</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-border text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Inicia Sesión</CardTitle>
              <CardDescription>
                Necesitas una cuenta para inscribirte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para inscribirte en <strong>{retreat.name}</strong>, primero debes iniciar sesión o crear una cuenta.
              </p>
              <div className="flex flex-col gap-2">
                <Link href={`/auth/login?redirect=/retiros/${retreatId}/inscripcion`}>
                  <Button className="w-full">Iniciar Sesión</Button>
                </Link>
                <Link href={`/auth/sign-up?redirect=/retiros/${retreatId}/inscripcion`}>
                  <Button variant="outline" className="w-full bg-transparent">Crear Cuenta</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-8">
          <div className="container mx-auto px-4">
            <Link href={`/retiros/${retreatId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Volver al retiro
            </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto max-w-2xl px-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Formulario de Inscripción</CardTitle>
                <CardDescription>
                  Inscripción para: {retreat.name}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      placeholder="Nombre y teléfono"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalInfo">Información Médica Relevante</Label>
                    <Textarea
                      id="medicalInfo"
                      name="medicalInfo"
                      placeholder="Alergias, condiciones médicas, medicamentos..."
                      value={formData.medicalInfo}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="font-medium text-foreground">Resumen</h4>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>Retiro: {retreat.name}</p>
                      <p>Fecha: {new Date(retreat.start_date).toLocaleDateString("es-ES")} - {new Date(retreat.end_date).toLocaleDateString("es-ES")}</p>
                      <p>Lugar: {retreat.location}</p>
                      <p className="text-lg font-semibold text-foreground">Total: ${retreat.price?.toFixed(2) || "Gratis"}</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Confirmar Inscripción"
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
