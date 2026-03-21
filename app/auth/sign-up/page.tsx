import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex flex-col items-center gap-2">
            <Image
              src="/logoccd.jpeg"
              alt="Convivencia con Dios"
              width={64}
              height={64}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold text-foreground">Convivencia con Dios</span>
          </Link>
          <CardTitle className="text-2xl text-foreground">Acceso por invitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            El acceso a la plataforma es solo por invitación. Contactá a un administrador de tu comunidad.
          </p>
          <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
