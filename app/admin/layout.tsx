import React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Calendar, Users, Building2, Newspaper, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const navItems = [
  { href: "/admin", icon: Home, label: "Inicio" },
  { href: "/admin/retiros", icon: Calendar, label: "Retiros" },
  { href: "/admin/inscripciones", icon: Users, label: "Inscripciones" },
  { href: "/admin/cofradias", icon: Building2, label: "Cofradías" },
  { href: "/admin/noticias", icon: Newspaper, label: "Noticias" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)

  const isAdmin = roles?.some(r => r.role === "admin" || r.role === "coordinador" || r.role === "centralizador")

  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="font-semibold text-foreground">Admin Panel</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Volver al Dashboard
          </Link>
        </div>
      </aside>
      <main className="flex-1 lg:pl-64">
        {children}
      </main>
    </div>
  )
}
