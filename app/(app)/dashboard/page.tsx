export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { formatDateShort, formatDateLong } from "@/lib/utils"
import { getUserContext, canPerform } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  admin_general: "Administrador General",
  tecnico_confraternidad: "Técnico de Confraternidad",
  responsable_fraternidad: "Responsable de Fraternidad",
  usuario_carga: "Usuario de Carga",
  solo_lectura: "Solo Lectura",
}

const ESTADO_EVENT_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  solicitud:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  discernimiento_confra:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  discernimiento_eqt:
    "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  aprobado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  publicado:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  finalizado: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  rechazado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: "Borrador",
  solicitud: "Pend. Disc. Confra",
  discernimiento_confra: "Pend. Disc. EqT",
  discernimiento_eqt: "Disc. EqT",
  aprobado: "Aprobado",
  publicado: "Publicado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
}

const MODO_LABELS: Record<string, string> = {
  colaborador: "Colaborador",
  servidor: "Servidor",
  asesor: "Asesor",
  familiar: "Familiar",
  orante: "Orante",
  intercesor: "Intercesor",
}

export default async function DashboardPage() {
  const ctx = await getUserContext()
  if (!ctx) redirect("/auth/login")

  const supabase = await createClient()

  // Determinar la org primaria del usuario: primero buscar su membresía activa
  // en persona_organizacion (donde está inscripto como cecista). Si no tiene
  // persona_id, caer a la primera org de sus roles/ministerios.
  let primaryOrgId: string | null = ctx.org_ids[0] ?? null
  let personaNombre: string | null = null
  if (ctx.persona_id) {
    const [poResult, personaResult] = await Promise.all([
      supabase
        .from("persona_organizacion")
        .select("organizacion_id")
        .eq("persona_id", ctx.persona_id)
        .is("fecha_fin", null)
        .limit(1)
        .single(),
      supabase
        .from("personas")
        .select("nombre, apellido")
        .eq("id", ctx.persona_id)
        .single(),
    ])
    if (poResult.data?.organizacion_id) primaryOrgId = poResult.data.organizacion_id
    if (personaResult.data) {
      const { nombre, apellido } = personaResult.data
      personaNombre = [nombre, apellido].filter(Boolean).join(" ") || null
    }
  }

  const canApprove =
    canPerform(ctx, "event.approve_confra") ||
    canPerform(ctx, "event.approve_eqt")
  const canApproveConfra = canPerform(ctx, "event.approve_confra")
  const canApproveEqt = canPerform(ctx, "event.approve_eqt")
  const canCreatePerson = canPerform(ctx, "person.create")
  const canCreateOrg = canPerform(ctx, "organization.create")
  const canCreateEvent = canPerform(ctx, "event.create")
  const hasPersonaId = ctx.persona_id !== null

  // ── Queries paralelas ────────────────────────────────────────────────────────

  const today = new Date().toISOString().split("T")[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]

  const [
    personasCountResult,
    confraternidadesCountResult,
    fraternidadesCountResult,
    eventosCountResult,
    proximosCountResult,
    proximosEventosResult,
    misEventosResult,
    discernimientoContraResult,
    discernimientoEqtResult,
    misRechazadosResult,
  ] = await Promise.all([
    // 1. Count personas (non-admin count se calcula en el bloque cecistas más abajo)
    ctx.is_admin
      ? supabase
          .from("personas")
          .select("id", { count: "exact", head: true })
          .is("fecha_baja", null)
      : Promise.resolve({ count: 0, error: null }),

    // 2a. Count confraternidades
    ctx.is_admin
      ? supabase
          .from("organizaciones")
          .select("id", { count: "exact", head: true })
          .eq("tipo", "confraternidad")
          .is("fecha_baja", null)
      : Promise.resolve({ count: ctx.org_ids.length, error: null }),

    // 2b. Count fraternidades
    ctx.is_admin
      ? supabase
          .from("organizaciones")
          .select("id", { count: "exact", head: true })
          .eq("tipo", "fraternidad")
          .is("fecha_baja", null)
      : Promise.resolve({ count: 0, error: null }),

    // 3. Count eventos activos (aprobado + publicado)
    (() => {
      let q = supabase
        .from("eventos")
        .select("id", { count: "exact", head: true })
        .in("estado", ["aprobado", "publicado"])
      if (!ctx.is_admin && primaryOrgId)
        q = q.eq("organizacion_id", primaryOrgId)
      return q
    })(),

    // 4. Count próximos eventos (30 días)
    (() => {
      let q = supabase
        .from("eventos")
        .select("id", { count: "exact", head: true })
        .in("estado", ["aprobado", "publicado"])
        .gte("fecha_inicio", today)
        .lte("fecha_inicio", in30)
      if (!ctx.is_admin && primaryOrgId)
        q = q.eq("organizacion_id", primaryOrgId)
      return q
    })(),

    // 5. Próximos eventos lista (reemplaza mock)
    (() => {
      let q = supabase
        .from("eventos")
        .select(
          "id, nombre, tipo, estado, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
        )
        .in("estado", ["aprobado", "publicado"])
        .gte("fecha_inicio", today)
        .order("fecha_inicio", { ascending: true })
        .limit(5)
      if (!ctx.is_admin && primaryOrgId)
        q = q.eq("organizacion_id", primaryOrgId)
      return q
    })(),

    // 8. Mis eventos solicitados (eventos en tránsito que yo solicité)
    canCreateEvent && hasPersonaId
      ? supabase
          .from("eventos")
          .select("id, nombre, estado, tipo, fecha_inicio")
          .eq("solicitado_por", ctx.persona_id!)
          .in("estado", [
            "solicitud",
            "discernimiento_confra",
            "discernimiento_eqt",
            "aprobado",
            "publicado",
          ])
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),

    // 9. En Discernimiento Confra/Delegado (para quienes pueden aprobar a nivel confra)
    canApproveConfra
      ? (() => {
          let q = supabase
            .from("eventos")
            .select(
              "id, nombre, estado, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
            )
            .eq("estado", "discernimiento_confra")
            .order("fecha_solicitud", { ascending: true })
            .limit(5)
          if (!ctx.is_admin && primaryOrgId)
            q = q.eq("organizacion_id", primaryOrgId)
          return q
        })()
      : Promise.resolve({ data: null, error: null }),

    // 10. En Discernimiento EqT (solo admin_general / approve_eqt)
    canApproveEqt
      ? supabase
          .from("eventos")
          .select(
            "id, nombre, estado, tipo, fecha_inicio, organizacion:organizaciones!organizacion_id(nombre)",
          )
          .eq("estado", "discernimiento_eqt")
          .order("fecha_solicitud", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),

    // 11. Mis eventos rechazados
    canCreateEvent && hasPersonaId
      ? supabase
          .from("eventos")
          .select("id, nombre, estado, motivo_rechazo, fecha_rechazo")
          .eq("solicitado_por", ctx.persona_id!)
          .eq("estado", "rechazado")
          .order("fecha_rechazo", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null, error: null }),
  ])

  let totalPersonas = personasCountResult.count ?? 0
  const totalConfraternidades = confraternidadesCountResult.count ?? 0
  const totalFraternidades = fraternidadesCountResult.count ?? 0
  const totalEventos = eventosCountResult.count ?? 0
  const proximosCount = proximosCountResult.count ?? 0

  // Pendientes: misma lógica que eventos/page.tsx, con filtrado post-fetch por rol
  let pendientes: any[] | null = null
  if (canApprove) {
    const canApproveConfra = canPerform(ctx, "event.approve_confra")
    const canApproveEqt = canPerform(ctx, "event.approve_eqt")
    const pendingStates: string[] = []
    if (canApproveConfra) {
      pendingStates.push("solicitud")
    }
    if (canApproveEqt) {
      pendingStates.push("discernimiento_confra", "discernimiento_eqt")
      if (!pendingStates.includes("solicitud")) pendingStates.push("solicitud")
    }
    const { data: pendingData } = await supabase
      .from("eventos")
      .select(
        "id, nombre, tipo, estado, fecha_inicio, requiere_discernimiento_confra, requiere_discernimiento_eqt, organizacion:organizaciones!organizacion_id(id, nombre)",
      )
      .in("estado", pendingStates)
      .order("fecha_solicitud", { ascending: true })
      .limit(10)
    pendientes = (pendingData ?? []).filter((ev: any) => {
      const confraId = ev.organizacion?.id as string | null
      const requiereConfra = ev.requiere_discernimiento_confra ?? false
      const requiereEqt = ev.requiere_discernimiento_eqt ?? false
      // discernimiento_confra = confra done, EqT needs to act
      if (ev.estado === "discernimiento_confra" && canApproveEqt) return true
      // discernimiento_eqt = legacy state, also EqT's turn
      if (ev.estado === "discernimiento_eqt" && canApproveEqt) return true
      if (ev.estado === "solicitud") {
        // EqT acts directly when no confra step required
        if (!requiereConfra && requiereEqt && canApproveEqt) return true
        // Confra acts on solicitud
        if (requiereConfra && canApproveConfra) {
          if (ctx.is_admin) return true
          return confraId ? ctx.org_ids.includes(confraId) : false
        }
      }
      return false
    })
  }

  // Cecistas: two-step fetch — same pattern as /personas page
  // Also derives totalPersonas for non-admin (consistent with fecha_baja filter)
  let cecistas: any[] | null = null
  if (primaryOrgId) {
    const { data: orgRows } = await supabase
      .from("persona_organizacion")
      .select("persona_id")
      .eq("organizacion_id", primaryOrgId)
      .is("fecha_fin", null)
    const ids = (orgRows ?? []).map((r: any) => r.persona_id)
    if (ids.length > 0) {
      const { data, count } = await supabase
        .from("personas")
        .select("id, nombre, apellido, persona_modos(modo, fecha_fin)", {
          count: "exact",
        })
        .in("id", ids)
        .is("fecha_baja", null)
        .limit(8)
      cecistas = data
      totalPersonas = count ?? 0
    } else {
      cecistas = []
      totalPersonas = 0
    }
  }

  const proximosEventos = (proximosEventosResult as any).data as any[] | null
  const misEventos = (misEventosResult as any).data as any[] | null
  const discernimientoConfra = (discernimientoContraResult as any).data as
    | any[]
    | null
  const discernimientoEqt = (discernimientoEqtResult as any).data as
    | any[]
    | null
  const misRechazados = (misRechazadosResult as any).data as any[] | null

  const primaryRole = ctx.roles[0]?.rol ?? null
  const roleName =
    ctx.ministerio_nombre ??
    (primaryRole && primaryRole !== "solo_lectura"
      ? (ROLE_LABELS[primaryRole] ?? primaryRole)
      : null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {personaNombre ? `Hola, ${personaNombre}` : "Panel de Inicio"}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Plataforma de gestión para Convivencia con Dios
          </p>
        </div>
        {roleName && (
          <Badge variant="secondary" className="text-sm mt-1">
            {roleName}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {primaryOrgId ? "Cecistas" : "Personas"}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalPersonas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {primaryOrgId
                ? "En tu Confraternidad / Fraternidad"
                : "Registradas en el sistema"}
            </p>
          </CardContent>
        </Card>

        {canPerform(ctx, "view.all") && (
          <Card className="border-border bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Confraternidades & Fraternidades
              </CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalConfraternidades + totalFraternidades}
              </div>
              {ctx.is_admin ? (
                <div className="flex gap-3 mt-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {totalConfraternidades}
                    </span>{" "}
                    confra
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {totalFraternidades}
                    </span>{" "}
                    frat
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Asignadas a tu perfil
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalEventos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aprobados o publicados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Próximos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {proximosCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>

        {canApprove && (
          <Card className="bg-card hover:border-amber-500/50 transition-colors border-amber-200 dark:border-amber-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Pendientes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendientes?.length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Eventos por aprobar
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Acciones rápidas */}
      {(canCreatePerson || canCreateOrg || canCreateEvent) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {canCreatePerson && (
                <Link href="/personas/nueva">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Users className="h-4 w-4 text-blue-500" />
                    Nueva Persona
                  </Button>
                </Link>
              )}
              {canCreateOrg && (
                <Link href="/organizaciones/nueva">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Building2 className="h-4 w-4 text-green-500" />
                    Nueva Organización
                  </Button>
                </Link>
              )}
              {canCreateEvent && (
                <Link href="/eventos/nuevo">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Solicitar Evento
                  </Button>
                </Link>
              )}
              <Link href="/pagos/nuevo">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Registrar Pago
                </Button>
              </Link>
              <Link href="/documentos/nuevo">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4 text-red-500" />
                  Agregar Documento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pendientes de aprobación */}
      {canApprove && pendientes && pendientes.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Solicitudes pendientes de aprobación
            </CardTitle>
            <CardDescription>Eventos que requieren tu revisión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendientes.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? "—"}
                      {evento.fecha_inicio
                        ? ` · ${formatDateShort(evento.fecha_inicio)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                    >
                      {ESTADO_LABELS[evento.estado] ?? evento.estado}
                    </span>
                    <Link href={`/eventos/${evento.id}`}>
                      <Button size="sm" className="h-7 text-xs">
                        Discernir
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/eventos?estado=solicitud" className="block mt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas las solicitudes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Cecistas de mi organización */}
      {primaryOrgId && cecistas && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Cecistas en mi Confraternidad / Fraternidad.
            </CardTitle>
            <CardDescription>
              Personas activas en tu Confraternidad / Fraternidad ·{" "}
              {totalPersonas} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cecistas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay personas registradas en tu Confraternidad / Fraternidad
              </p>
            ) : (
              <div className="space-y-2">
                {cecistas.map((persona: any) => {
                  const currentModo = Array.isArray(persona.persona_modos)
                    ? persona.persona_modos.find(
                        (m: any) => m.fecha_fin === null,
                      )
                    : null
                  return (
                    <Link
                      key={persona.id}
                      href={`/personas/${persona.id}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-primary/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {persona.apellido}, {persona.nombre}
                      </p>
                      {currentModo && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {MODO_LABELS[currentModo.modo] ?? currentModo.modo}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
            <Link
              href={`/personas?organizacion_id=${primaryOrgId}`}
              className="block mt-4"
            >
              <Button variant="outline" className="w-full bg-transparent">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Mis eventos solicitados */}
      {canCreateEvent &&
        hasPersonaId &&
        misEventos &&
        misEventos.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Mis eventos solicitados
              </CardTitle>
              <CardDescription>
                Eventos que solicitaste y están en proceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {misEventos.map((evento: any) => (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      {evento.fecha_inicio && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(evento.fecha_inicio)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                    >
                      {ESTADO_LABELS[evento.estado] ?? evento.estado}
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/eventos" className="block mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos mis eventos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* En Discernimiento Confra/Delegado */}
      {canApproveConfra &&
        discernimientoConfra &&
        discernimientoConfra.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                En Discernimiento Confra / Delegado
              </CardTitle>
              <CardDescription>
                Eventos esperando aprobación a nivel confraternidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {discernimientoConfra.map((evento: any) => (
                  <div
                    key={evento.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.organizacion?.nombre ?? "—"}
                        {evento.fecha_inicio
                          ? ` · ${formatDateShort(evento.fecha_inicio)}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/eventos/${evento.id}`}
                      className="ml-3 shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                href="/eventos?estado=discernimiento_confra"
                className="block mt-4"
              >
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos en discernimiento confra
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* En Discernimiento EqT */}
      {canApproveEqt && discernimientoEqt && discernimientoEqt.length > 0 && (
        <Card className="border-sky-200 dark:border-sky-900 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-sky-500" />
              En Discernimiento Equipo Timón
            </CardTitle>
            <CardDescription>
              Eventos esperando aprobación del Equipo Timón
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discernimientoEqt.map((evento: any) => (
                <div
                  key={evento.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.organizacion?.nombre ?? "—"}
                      {evento.fecha_inicio
                        ? ` · ${formatDateShort(evento.fecha_inicio)}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="ml-3 shrink-0"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link
              href="/eventos?estado=discernimiento_eqt"
              className="block mt-4"
            >
              <Button variant="outline" className="w-full bg-transparent">
                Ver todos en discernimiento EqT
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Mis eventos rechazados */}
      {canCreateEvent &&
        hasPersonaId &&
        misRechazados &&
        misRechazados.length > 0 && (
          <Card className="border-red-200 dark:border-red-900 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Mis eventos rechazados
              </CardTitle>
              <CardDescription>
                Eventos que fueron rechazados y requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {misRechazados.map((evento: any) => (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="flex items-start justify-between rounded-lg border border-border p-3 hover:border-red-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {evento.nombre}
                      </p>
                      {evento.motivo_rechazo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          Motivo: {evento.motivo_rechazo}
                        </p>
                      )}
                      {evento.fecha_rechazo && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(evento.fecha_rechazo)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS.rechazado}`}
                    >
                      Rechazado
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/eventos?estado=rechazado" className="block mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver todos los rechazados
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {/* Próximos Eventos */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
          <CardDescription>
            Eventos programados en los próximos días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!proximosEventos || proximosEventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay eventos próximos programados
            </p>
          ) : (
            <div className="space-y-3">
              {proximosEventos.map((evento: any) => (
                <Link
                  key={evento.id}
                  href={`/eventos/${evento.id}`}
                  className="flex items-start justify-between rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {evento.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evento.fecha_inicio
                        ? formatDateLong(evento.fecha_inicio)
                        : "Fecha por definir"}
                      {evento.organizacion?.nombre
                        ? ` · ${evento.organizacion.nombre}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ml-3 shrink-0 ${ESTADO_EVENT_COLORS[evento.estado] ?? ""}`}
                  >
                    {evento.estado}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/eventos" className="block mt-4">
            <Button variant="outline" className="w-full bg-transparent">
              Ver todos los eventos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Estado del sistema */}
      {/* <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Sistema</CardTitle>
          <CardDescription>Estado actual de la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sistema Operativo</p>
                <p className="text-xs text-muted-foreground">
                  La plataforma está lista para usar
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
              Activo
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
