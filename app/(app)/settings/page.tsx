'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Settings, Lock, Loader2, Eye, EyeOff, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { translateSupabaseError } from '@/lib/errors/supabase'
import { LocationFields } from '@/components/location-fields'

type FontSize = 'small' | 'medium' | 'large'

const FONT_SCALES: Record<FontSize, number> = {
  small: 1,
  medium: 1.125,
  large: 1.25,
}

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; preview: string }[] = [
  { value: 'small', label: 'Pequeño', preview: 'A' },
  { value: 'medium', label: 'Mediano', preview: 'A' },
  { value: 'large', label: 'Grande', preview: 'A' },
]

const NIVELES_ESTUDIOS = [
  { value: 'primario', label: 'Primario' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'terciario', label: 'Terciario' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'posgrado_doctorado', label: 'Posgrado / Doctorado' },
]

const MODOS_LABEL: Record<string, string> = {
  colaborador: 'Colaborador',
  servidor: 'Servidor',
  asesor: 'Asesor',
  familiar: 'Familiar',
  orante: 'Orante',
  intercesor: 'Intercesor',
}

const CATEGORIAS_LABEL: Record<string, string> = {
  cecista: 'Cecista',
  no_cecista: 'No cecista',
}

type Persona = {
  id: string
  nombre: string
  apellido: string
  email: string | null
  email_ccd: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  tipo_documento: string | null
  documento: string | null
  direccion: string | null
  direccion_nro: string | null
  codigo_postal: string | null
  localidad: string | null
  provincia: string | null
  pais: string | null
  diocesis: string | null
  estado_eclesial: string | null
  parroquia: string | null
  estado_vida: string | null
  nivel_estudios: string | null
  anio_ingreso: number | null
  acompanante_id: string | null
  notas: string | null
  categoria_persona: string | null
}

type EditForm = {
  nombre: string
  apellido: string
  email: string
  email_ccd: string
  telefono: string
  fecha_nacimiento: string
  tipo_documento: string
  documento: string
  direccion: string
  direccion_nro: string
  codigo_postal: string
  localidad: string
  provincia: string
  pais: string
  diocesis: string
  estado_eclesial: string
  parroquia: string
  estado_vida: string
  nivel_estudios: string
  anio_ingreso: string
  acompanante_id: string
  notas: string
}

type PersonaOpcion = { id: string; nombre: string; apellido: string }

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [fontSize, setFontSize] = useState<FontSize>('small')

  // Password change dialog
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ actual: false, nueva: false, confirmar: false })

  // Perfil tab state
  const [persona, setPersona] = useState<Persona | null>(null)
  const [modoActual, setModoActual] = useState<string | null>(null)
  const [loadingPersona, setLoadingPersona] = useState(true)
  const [todasPersonas, setTodasPersonas] = useState<PersonaOpcion[]>([])
  const [editForm, setEditForm] = useState<EditForm>({
    nombre: '', apellido: '', email: '', email_ccd: '', telefono: '',
    fecha_nacimiento: '', tipo_documento: '', documento: '',
    direccion: '', direccion_nro: '', codigo_postal: '',
    localidad: '', provincia: '', pais: 'Argentina', diocesis: '',
    estado_eclesial: 'laico', parroquia: '', estado_vida: '',
    nivel_estudios: '', anio_ingreso: '', acompanante_id: '', notas: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)

  const handlePasswordChange = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwError(null)

    if (pwForm.nueva.length < 8) {
      setPwError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwError('Las contraseñas no coinciden.')
      return
    }

    setPwLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPwError('No se pudo obtener el usuario actual.')
      setPwLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwForm.actual,
    })

    if (signInError) {
      setPwError('Contraseña actual incorrecta.')
      setPwLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.nueva })
    setPwLoading(false)

    if (updateError) {
      setPwError(updateError.message)
      return
    }

    setPwSuccess(true)
    setPwForm({ actual: '', nueva: '', confirmar: '' })
    setTimeout(() => {
      setPwOpen(false)
      setPwSuccess(false)
    }, 1500)
  }

  useEffect(() => {
    const saved = localStorage.getItem('font-size-preference') as FontSize | null
    if (saved && saved in FONT_SCALES) setFontSize(saved)
  }, [])

  useEffect(() => {
    async function loadPersona() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingPersona(false)
        return
      }

      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, email_ccd, telefono, fecha_nacimiento, tipo_documento, documento, direccion, direccion_nro, codigo_postal, localidad, provincia, pais, diocesis, estado_eclesial, parroquia, estado_vida, nivel_estudios, anio_ingreso, acompanante_id, notas, categoria_persona')
        .eq('auth_user_id', user.id)
        .single()

      if (data) {
        setPersona(data)
        setEditForm({
          nombre: data.nombre ?? '',
          apellido: data.apellido ?? '',
          email: data.email ?? '',
          email_ccd: data.email_ccd ?? '',
          telefono: data.telefono ?? '',
          fecha_nacimiento: data.fecha_nacimiento ?? '',
          tipo_documento: data.tipo_documento ?? '',
          documento: data.documento ?? '',
          direccion: data.direccion ?? '',
          direccion_nro: data.direccion_nro ?? '',
          codigo_postal: data.codigo_postal ?? '',
          localidad: data.localidad ?? '',
          provincia: data.provincia ?? '',
          pais: data.pais ?? 'Argentina',
          diocesis: data.diocesis ?? '',
          estado_eclesial: data.estado_eclesial ?? 'laico',
          parroquia: data.parroquia ?? '',
          estado_vida: data.estado_vida ?? '',
          nivel_estudios: data.nivel_estudios ?? '',
          anio_ingreso: data.anio_ingreso != null ? String(data.anio_ingreso) : '',
          acompanante_id: data.acompanante_id ?? '',
          notas: data.notas ?? '',
        })

        const { data: modo } = await supabase
          .from('persona_modos')
          .select('modo')
          .eq('persona_id', data.id)
          .is('fecha_fin', null)
          .maybeSingle()

        setModoActual(modo?.modo ?? null)
      }

      // Cargar personas para el select de acompañante
      const { data: personas } = await supabase
        .from('personas')
        .select('id, nombre, apellido')
        .is('fecha_baja', null)
        .eq('estado', 'activo')
        .order('apellido')

      setTodasPersonas(personas ?? [])
      setLoadingPersona(false)
    }
    loadPersona()
  }, [])

  function applyFontSize(size: FontSize) {
    setFontSize(size)
    localStorage.setItem('font-size-preference', size)
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALES[size]))
  }

  async function handleSaveProfile(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!persona) return
    setEditError(null)
    setEditSuccess(false)
    setEditLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('personas')
      .update({
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        email: editForm.email || null,
        email_ccd: editForm.email_ccd || null,
        telefono: editForm.telefono || null,
        fecha_nacimiento: editForm.fecha_nacimiento || null,
        tipo_documento: editForm.tipo_documento || null,
        documento: editForm.documento || null,
        direccion: editForm.direccion || null,
        direccion_nro: editForm.direccion_nro || null,
        codigo_postal: editForm.codigo_postal || null,
        localidad: editForm.localidad || null,
        provincia: editForm.provincia || null,
        pais: editForm.pais || null,
        diocesis: editForm.diocesis || null,
        estado_eclesial: editForm.estado_eclesial || 'laico',
        parroquia: editForm.parroquia || null,
        estado_vida: editForm.estado_vida || null,
        nivel_estudios: editForm.nivel_estudios || null,
        anio_ingreso: editForm.anio_ingreso ? Number(editForm.anio_ingreso) : null,
        acompanante_id: editForm.acompanante_id || null,
        notas: editForm.notas || null,
      })
      .eq('id', persona.id)

    setEditLoading(false)

    if (error) {
      setEditError(translateSupabaseError(error))
    } else {
      setPersona({
        ...persona,
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        email: editForm.email || null,
        email_ccd: editForm.email_ccd || null,
        telefono: editForm.telefono || null,
        categoria_persona: persona.categoria_persona,
      })
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 3000)
    }
  }

  function field(key: keyof EditForm, value: string) {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const selectClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configuración
        </h1>
        <p className="mt-2 text-muted-foreground">
          Preferencias de tu cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'perfil'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('seguridad')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'seguridad'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Seguridad
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Apariencia</CardTitle>
            <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Tamaño de texto</p>
              <div className="flex gap-3">
                {FONT_SIZE_OPTIONS.map((opt, i) => {
                  const previewSizes = ['text-base', 'text-xl', 'text-2xl']
                  return (
                    <button
                      key={opt.value}
                      onClick={() => applyFontSize(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 px-6 py-4 rounded-lg border-2 transition-colors',
                        fontSize === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span className={cn('font-semibold leading-none', previewSizes[i])}>
                        {opt.preview}
                      </span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                El cambio se aplica de inmediato y se recuerda al volver.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perfil */}
      {activeTab === 'perfil' && (
        <div className="space-y-6 max-w-2xl">
          {loadingPersona ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando perfil...</span>
            </div>
          ) : !persona ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Sin perfil asociado</p>
                <p className="text-sm mt-1">Tu cuenta aún no tiene un perfil de persona asociado. Contactá al administrador.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary card */}
              <Card className="border-border bg-card">
                <CardContent className="py-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shrink-0">
                    {persona.nombre.charAt(0)}{persona.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg leading-tight">{persona.nombre} {persona.apellido}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {persona.categoria_persona && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {CATEGORIAS_LABEL[persona.categoria_persona] ?? persona.categoria_persona}
                        </span>
                      )}
                      {modoActual && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {MODOS_LABEL[modoActual] ?? modoActual}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit form */}
              <form onSubmit={handleSaveProfile}>
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Datos Personales
                    </CardTitle>
                    <CardDescription>Actualizá tu información personal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Nombre / Apellido */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-nombre">Nombre *</Label>
                        <Input id="p-nombre" value={editForm.nombre} onChange={e => field('nombre', e.target.value)} required disabled={editLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-apellido">Apellido *</Label>
                        <Input id="p-apellido" value={editForm.apellido} onChange={e => field('apellido', e.target.value)} required disabled={editLoading} />
                      </div>
                    </div>

                    {/* Teléfono / Fecha nacimiento */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-telefono">Teléfono</Label>
                        <Input id="p-telefono" type="tel" value={editForm.telefono} onChange={e => field('telefono', e.target.value)} disabled={editLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-nacimiento">Fecha de Nacimiento</Label>
                        <Input id="p-nacimiento" type="date" value={editForm.fecha_nacimiento} onChange={e => field('fecha_nacimiento', e.target.value)} disabled={editLoading} />
                      </div>
                    </div>

                    {/* Mail Personal / Mail CcD */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-email">Mail Personal</Label>
                        <Input id="p-email" type="email" value={editForm.email} onChange={e => field('email', e.target.value)} disabled={editLoading} />
                        <p className="text-xs text-muted-foreground">No afecta el acceso al sistema.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-email-ccd">Mail CcD</Label>
                        <Input id="p-email-ccd" type="email" value={editForm.email_ccd} onChange={e => field('email_ccd', e.target.value)} disabled={editLoading} />
                      </div>
                    </div>

                    {/* Tipo Documento / Nro Documento */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-tipo-doc">Tipo de Documento</Label>
                        <select id="p-tipo-doc" value={editForm.tipo_documento} onChange={e => field('tipo_documento', e.target.value)} disabled={editLoading} className={selectClass}>
                          <option value="">Seleccionar...</option>
                          <option value="dni">DNI</option>
                          <option value="pasaporte">Pasaporte</option>
                          <option value="cedula">Cédula</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-documento">Nro Documento</Label>
                        <Input id="p-documento" value={editForm.documento} onChange={e => field('documento', e.target.value)} disabled={editLoading} />
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor="p-direccion">Dirección Calle</Label>
                        <Input id="p-direccion" value={editForm.direccion} onChange={e => field('direccion', e.target.value)} disabled={editLoading} />
                      </div>
                      <div className="space-y-2 w-28">
                        <Label htmlFor="p-nro">Número</Label>
                        <Input id="p-nro" value={editForm.direccion_nro} onChange={e => field('direccion_nro', e.target.value)} disabled={editLoading} />
                      </div>
                    </div>

                    {/* LocationFields: País, Provincia, Ciudad, CP, Diócesis */}
                    <LocationFields
                      pais={editForm.pais}
                      provincia={editForm.provincia}
                      localidad={editForm.localidad}
                      codigoPostal={editForm.codigo_postal}
                      diocesis={editForm.diocesis}
                      onPaisChange={val => setEditForm(prev => ({ ...prev, pais: val, provincia: '', localidad: '' }))}
                      onProvinciaChange={val => setEditForm(prev => ({ ...prev, provincia: val, localidad: '' }))}
                      onLocalidadChange={val => setEditForm(prev => ({ ...prev, localidad: val }))}
                      onCodigoPostalChange={val => field('codigo_postal', val)}
                      onDiocesisChange={val => field('diocesis', val)}
                      disabled={editLoading}
                    />

                    {/* Estado Eclesiástico / Parroquia */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-eclesial">Estado Eclesiástico</Label>
                        <select id="p-eclesial" value={editForm.estado_eclesial} onChange={e => field('estado_eclesial', e.target.value)} disabled={editLoading} className={selectClass}>
                          <option value="laico">Laico</option>
                          <option value="religioso">Religioso/a</option>
                          <option value="diacono">Diácono</option>
                          <option value="sacerdote">Sacerdote</option>
                          <option value="obispo">Obispo</option>
                          <option value="cardenal">Cardenal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-parroquia">Parroquia</Label>
                        <Input id="p-parroquia" placeholder="Ej: Parroquia San José" value={editForm.parroquia} onChange={e => field('parroquia', e.target.value)} disabled={editLoading} />
                      </div>
                    </div>

                    {/* Estado de Vida */}
                    <div className="space-y-2">
                      <Label htmlFor="p-vida">Estado de Vida</Label>
                      <select id="p-vida" value={editForm.estado_vida} onChange={e => field('estado_vida', e.target.value)} disabled={editLoading} className={selectClass}>
                        <option value="">Sin especificar</option>
                        <option value="soltero">Soltero/a</option>
                        <option value="casado">Casado/a</option>
                        <option value="viudo">Viudo/a</option>
                        <option value="separado">Separado/a</option>
                        <option value="consagrado">Consagrado/a</option>
                      </select>
                    </div>

                    {/* Nivel Estudios / Año Ingreso */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="p-estudios">Máx. Nivel de Estudios</Label>
                        <select id="p-estudios" value={editForm.nivel_estudios} onChange={e => field('nivel_estudios', e.target.value)} disabled={editLoading} className={selectClass}>
                          <option value="">Sin especificar</option>
                          {NIVELES_ESTUDIOS.map(n => (
                            <option key={n.value} value={n.value}>{n.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-anio">Año de Ingreso</Label>
                        <Input
                          id="p-anio"
                          type="number"
                          min="1950"
                          max={new Date().getFullYear()}
                          placeholder="Ej: 2010"
                          value={editForm.anio_ingreso}
                          onChange={e => field('anio_ingreso', e.target.value)}
                          disabled={editLoading}
                        />
                      </div>
                    </div>

                    {/* Acompañante */}
                    <div className="space-y-2">
                      <Label htmlFor="p-acompanante">Acompañante</Label>
                      <select id="p-acompanante" value={editForm.acompanante_id} onChange={e => field('acompanante_id', e.target.value)} disabled={editLoading} className={selectClass}>
                        <option value="">Sin acompañante</option>
                        {todasPersonas.map(p => (
                          <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                      <Label htmlFor="p-notas">Notas</Label>
                      <textarea
                        id="p-notas"
                        rows={3}
                        value={editForm.notas}
                        onChange={e => field('notas', e.target.value)}
                        disabled={editLoading}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                      />
                    </div>

                    {editError && (
                      <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3">
                        {editError}
                      </div>
                    )}
                    {editSuccess && (
                      <div className="rounded-md bg-green-50 text-green-700 text-sm px-4 py-3">
                        Perfil actualizado correctamente.
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={editLoading}>
                        {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Guardar Datos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </>
          )}
        </div>
      )}

      {/* Security */}
      {activeTab === 'seguridad' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5 text-primary" />
              Seguridad
            </CardTitle>
            <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-4">
              <h3 className="font-medium text-foreground mb-2">Cambiar Contraseña</h3>
              <p className="text-sm text-muted-foreground mb-4">Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
              <Button variant="outline" className="bg-transparent" onClick={() => { setPwOpen(true); setPwError(null); setPwSuccess(false) }}>
                Cambiar Contraseña
              </Button>

              <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) { setPwForm({ actual: '', nueva: '', confirmar: '' }); setPwError(null); setPwSuccess(false) } }}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>Ingresá tu contraseña actual y la nueva contraseña dos veces para confirmar.</DialogDescription>
                  </DialogHeader>

                  {pwSuccess ? (
                    <p className="text-sm text-green-600 py-4 text-center">¡Contraseña actualizada correctamente!</p>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4 py-2">
                      <div className="space-y-1">
                        <Label htmlFor="pw-actual">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="pw-actual"
                            type={showPw.actual ? 'text' : 'password'}
                            value={pwForm.actual}
                            onChange={(e) => setPwForm(prev => ({ ...prev, actual: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, actual: !prev.actual }))}
                            tabIndex={-1}
                          >
                            {showPw.actual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pw-nueva">Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-nueva"
                            type={showPw.nueva ? 'text' : 'password'}
                            value={pwForm.nueva}
                            onChange={(e) => setPwForm(prev => ({ ...prev, nueva: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, nueva: !prev.nueva }))}
                            tabIndex={-1}
                          >
                            {showPw.nueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pw-confirmar">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-confirmar"
                            type={showPw.confirmar ? 'text' : 'password'}
                            value={pwForm.confirmar}
                            onChange={(e) => setPwForm(prev => ({ ...prev, confirmar: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                            tabIndex={-1}
                          >
                            {showPw.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {pwError && <p className="text-sm text-destructive">{pwError}</p>}

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setPwOpen(false)} disabled={pwLoading}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={pwLoading}>
                          {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
