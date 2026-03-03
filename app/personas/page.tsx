'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react'

export default function PersonasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [personas] = useState([])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Personas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Administra los datos de todas las personas en el sistema
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Personas Registradas</CardTitle>
            <CardDescription>Lista completa de personas en el sistema</CardDescription>
          </div>
          <Link href="/personas/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Persona
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {personas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Organización</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {personas.map((persona: any) => (
                    <tr key={persona.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{persona.nombre}</td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.telefono}</td>
                      <td className="py-3 px-4 text-muted-foreground">{persona.organizacion}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/personas/${persona.id}/editar`}>
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
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay personas registradas</h3>
              <p className="mt-2 text-muted-foreground">Comienza agregando la primera persona al sistema</p>
              <Link href="/personas/nueva" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Persona
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
