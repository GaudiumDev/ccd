'use client'

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Mail, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 md:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Convivencia</h1>
          </div>

          {/* Form Card */}
          <Card className="border-border bg-card">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl text-foreground">Bienvenido</CardTitle>
              <CardDescription>
                Inicia sesión en tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 space-y-3 text-center text-sm">
                <p className="text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2024 Convivencia con Dios. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 items-center justify-center">
        <div className="max-w-lg space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Convivencia con Dios
            </h2>
            <p className="text-lg text-foreground/70">
              Gestión integral de retiros y convivencias espirituales para la comunidad católica.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Experiencias Espirituales</h3>
                <p className="text-sm text-foreground/60">
                  Conecta con retiros y convivencias transformadoras
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Gestión Simplificada</h3>
                <p className="text-sm text-foreground/60">
                  Organiza eventos con facilidad y eficiencia
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Comunidad Unida</h3>
                <p className="text-sm text-foreground/60">
                  Fortalece los lazos espirituales de tu comunidad
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
