import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">C</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Convivencia con Dios</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma para la gestión de retiros y convivencias espirituales de la Iglesia Católica.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/retiros" className="text-sm text-muted-foreground hover:text-foreground">
                  Retiros Disponibles
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-sm text-muted-foreground hover:text-foreground">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/noticias" className="text-sm text-muted-foreground hover:text-foreground">
                  Noticias
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Cuenta</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-up" className="text-sm text-muted-foreground hover:text-foreground">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Mi Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">
                contacto@convivenciacondios.org
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {new Date().getFullYear()} Convivencia con Dios. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
