'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Search, Plus, Edit2, Trash2 } from 'lucide-react'

export default function OrganizacionesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [organizaciones] = useState([])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Gestión de Organizaciones
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra las organizaciones y sus datos
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Organizaciones Registradas</CardTitle>
            <CardDescription>Lista completa de organizaciones en el sistema</CardDescription>
          </div>
          <Link href="/organizaciones/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Organización
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {organizaciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ciudad</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Tipo</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {organizaciones.map((org: any) => (
                    <tr key={org.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{org.nombre}</td>
                      <td className="py-3 px-4 text-muted-foreground">{org.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{org.telefono}</td>
                      <td className="py-3 px-4 text-muted-foreground">{org.ciudad}</td>
                      <td className="py-3 px-4 text-muted-foreground">{org.tipo}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/organizaciones/${org.id}/editar`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay organizaciones registradas</h3>
              <p className="mt-2 text-muted-foreground">Comienza agregando la primera organización al sistema</p>
              <Link href="/organizaciones/nueva" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Organización
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
