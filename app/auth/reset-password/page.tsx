"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for PASSWORD_RECOVERY event from Supabase token in URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError("No se pudo actualizar la contraseña. El link puede haber expirado.")
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push("/auth/login")
    }, 2000)
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
            Nueva contraseña
          </CardTitle>
          <CardDescription>
            Ingresá tu nueva contraseña para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent>
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              ¡Contraseña actualizada correctamente! Redirigiendo al inicio de sesión...
            </div>
          </CardContent>
        ) : !isReady ? (
          <CardContent>
            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Verificando el link de recuperación... Si esta página no carga, el link puede haber expirado.{" "}
              <Link href="/auth/forgot-password" className="underline underline-offset-4">
                Solicitar uno nuevo.
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
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
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
