"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const origin = window.location.origin

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/reset-password`,
    })

    // Always show success to avoid leaking whether email exists
    setIsLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex flex-col items-center gap-2"
          >
            <Image
              src="/logoccd.jpeg"
              alt="Convivencia con Dios"
              width={64}
              height={64}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold text-foreground">
              Convivencia con Dios
            </span>
          </Link>
          <CardTitle className="text-2xl text-foreground">
            Recuperar contraseña
          </CardTitle>
          <CardDescription>
            Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              Si ese email está registrado, recibirás un link para restablecer tu contraseña en los próximos minutos. Revisá también tu carpeta de spam.
            </div>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar link de recuperación"}
              </Button>
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
