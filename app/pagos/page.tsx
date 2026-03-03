'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Plus, Search, Edit2, Trash2 } from 'lucide-react'

const estadoColores: Record<string, string> = {
  pendiente: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  procesado: 'bg-green-500/20 text-green-700 dark:text-green-300',
  rechazado: 'bg-red-500/20 text-red-700 dark:text-red-300',
  reembolsado: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
}

export default function PagosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const pagos: any[] = []

  const totalRecaudado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + (p.monto || 0), 0)
  const totalProcesado = pagos.filter(p => p.estado === 'procesado').reduce((sum, p) => sum + (p.monto || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Gestión de Pagos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Registra y controla los pagos de eventos
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Recaudado</CardDescription>
            <CardTitle className="text-2xl text-foreground">€{totalRecaudado.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription>Procesados</CardDescription>
            <CardTitle className="text-2xl text-green-600">€{totalProcesado.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">€{totalPendiente.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Pagos Registrados</CardTitle>
            <CardDescription>Historial de todos los pagos en el sistema</CardDescription>
          </div>
          <Link href="/pagos/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Pago
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por persona, evento o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {pagos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Persona</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Evento</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Monto</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha Pago</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Método</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago: any) => (
                    <tr key={pago.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{pago.persona}</td>
                      <td className="py-3 px-4 text-foreground">{pago.evento}</td>
                      <td className="py-3 px-4 text-foreground font-medium">€{pago.monto?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(pago.fecha).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{pago.metodo}</td>
                      <td className="py-3 px-4">
                        <Badge className={estadoColores[pago.estado] || estadoColores.pendiente}>
                          {pago.estado.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/pagos/${pago.id}/editar`}>
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
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay pagos registrados</h3>
              <p className="mt-2 text-muted-foreground">Comienza registrando el primer pago en el sistema</p>
              <Link href="/pagos/nuevo" className="mt-4 inline-block">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Pago
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
