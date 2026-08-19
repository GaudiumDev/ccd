"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
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

export default function ForgotPasswordPage() {
  const [identificador, setIdentificador] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: identificador.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "No se pudo procesar el pedido. Intentá de nuevo en unos minutos.")
        setIsLoading(false)
        return
      }

      // La respuesta es siempre la misma exista o no la cuenta: no se filtra
      // quién está registrado.
      setSubmitted(true)
    } catch {
      setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.")
    }

    setIsLoading(false)
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
            Ingresá tu usuario y te enviaremos un link a tu email para restablecer la contraseña.
          </CardDescription>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              Si el usuario existe y tiene un email cargado, vas a recibir un link para
              restablecer tu contraseña en los próximos minutos. Revisá también tu carpeta
              de spam.
            </div>
            <p className="text-sm text-muted-foreground">
              ¿No te llega nada? Puede que tu cuenta todavía no tenga un email cargado.
              En ese caso, escribile a tu responsable de fraternidad para que te lo cargue
              o te restablezca el acceso.
            </p>
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
                <Label htmlFor="identificador">Usuario o email</Label>
                <Input
                  id="identificador"
                  type="text"
                  placeholder="tu.usuario"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-xs text-muted-foreground">
                  Es el mismo usuario con el que ingresás. También podés usar tu email
                  si lo tenés cargado en tu perfil.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperación"
                )}
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
