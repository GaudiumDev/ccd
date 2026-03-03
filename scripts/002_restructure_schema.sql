-- ============================================================
-- CcD Platform - Reestructuración del Modelo de Datos
-- ============================================================

-- Eliminar tablas anteriores (orden inverso por dependencias)
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.retreats CASCADE;
DROP TABLE IF EXISTS public.confraternities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Eliminar trigger anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- 1. PERSONA
-- ============================================================
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE,
  telefono TEXT,
  documento TEXT UNIQUE,
  fecha_nacimiento DATE,
  direccion TEXT,
  localidad TEXT,
  provincia TEXT,
  pais TEXT DEFAULT 'Argentina',
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','fallecido')),
  acepta_comunicaciones BOOLEAN DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personas_select_auth" ON public.personas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "personas_insert_auth" ON public.personas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "personas_update_auth" ON public.personas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "personas_delete_auth" ON public.personas FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_personas_email ON public.personas(email);
CREATE INDEX idx_personas_documento ON public.personas(documento);
CREATE INDEX idx_personas_auth_user ON public.personas(auth_user_id);

-- ============================================================
-- 2. ORGANIZACION
-- ============================================================
CREATE TABLE public.organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('comunidad','confraternidad','fraternidad','casa_retiro','otra')),
  localidad TEXT,
  provincia TEXT,
  pais TEXT DEFAULT 'Argentina',
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select_auth" ON public.organizaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "org_insert_auth" ON public.organizaciones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "org_update_auth" ON public.organizaciones FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "org_delete_auth" ON public.organizaciones FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_org_tipo ON public.organizaciones(tipo);

-- ============================================================
-- 3. ROL (Catálogo de roles)
-- ============================================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('sistema','funcional')),
  nivel_acceso INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select_auth" ON public.roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "roles_insert_auth" ON public.roles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "roles_update_auth" ON public.roles FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insertar roles iniciales
INSERT INTO public.roles (nombre, descripcion, tipo, nivel_acceso) VALUES
  ('admin', 'Administrador global del sistema', 'sistema', 100),
  ('admin_confraternidad', 'Administrador de confraternidad', 'sistema', 80),
  ('usuario_carga', 'Usuario de carga de datos', 'sistema', 50),
  ('solo_lectura', 'Solo lectura', 'sistema', 10),
  ('eqt', 'Equipo de trabajo', 'funcional', 0),
  ('delegado', 'Delegado EQT', 'funcional', 0),
  ('coordinador', 'Coordinador de evento', 'funcional', 0),
  ('asesor', 'Asesor espiritual', 'funcional', 0),
  ('centralizador', 'Centralizador de evento', 'funcional', 0),
  ('convivente', 'Participante de convivencia', 'funcional', 0),
  ('responsable', 'Responsable de área', 'funcional', 0);

-- ============================================================
-- 4. PERSONA_ROL (Relación muchos a muchos)
-- ============================================================
CREATE TABLE public.persona_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','historico')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.persona_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persona_roles_select_auth" ON public.persona_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "persona_roles_insert_auth" ON public.persona_roles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "persona_roles_update_auth" ON public.persona_roles FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "persona_roles_delete_auth" ON public.persona_roles FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_persona_roles_persona ON public.persona_roles(persona_id);
CREATE INDEX idx_persona_roles_rol ON public.persona_roles(rol_id);
CREATE INDEX idx_persona_roles_org ON public.persona_roles(organizacion_id);

-- ============================================================
-- 5. EVENTO (Convivencia / Retiro / Taller)
-- ============================================================
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CcD','Retiro','Taller')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  organizacion_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL,
  casa_retiro_id UUID REFERENCES public.organizaciones(id) ON DELETE SET NULL,
  cupo_maximo INTEGER DEFAULT 30,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','solicitado','aprobado','publicado','cerrado','finalizado','cancelado')),
  descripcion TEXT,
  precio DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_select_auth" ON public.eventos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "eventos_insert_auth" ON public.eventos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "eventos_update_auth" ON public.eventos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "eventos_delete_auth" ON public.eventos FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_eventos_org ON public.eventos(organizacion_id);
CREATE INDEX idx_eventos_estado ON public.eventos(estado);
CREATE INDEX idx_eventos_fechas ON public.eventos(fecha_inicio, fecha_fin);

-- ============================================================
-- 6. EVENTO_PARTICIPANTE
-- ============================================================
CREATE TABLE public.evento_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  rol_en_evento TEXT NOT NULL DEFAULT 'convivente' CHECK (rol_en_evento IN ('convivente','coordinador','asesor','centralizador','eqt','delegado')),
  estado_inscripcion TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_inscripcion IN ('pendiente','confirmado','cancelado','lista_espera')),
  fecha_inscripcion TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evento_id, persona_id)
);

ALTER TABLE public.evento_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ep_select_auth" ON public.evento_participantes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ep_insert_auth" ON public.evento_participantes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ep_update_auth" ON public.evento_participantes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ep_delete_auth" ON public.evento_participantes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_ep_evento ON public.evento_participantes(evento_id);
CREATE INDEX idx_ep_persona ON public.evento_participantes(persona_id);

-- ============================================================
-- 7. PAGO
-- ============================================================
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_participante_id UUID NOT NULL REFERENCES public.evento_participantes(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  medio_pago TEXT CHECK (medio_pago IN ('efectivo','transferencia','mercadopago','otro')),
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','confirmado','rechazado','reembolsado')),
  fecha_pago TIMESTAMPTZ,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagos_select_auth" ON public.pagos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "pagos_insert_auth" ON public.pagos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pagos_update_auth" ON public.pagos FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_pagos_ep ON public.pagos(evento_participante_id);

-- ============================================================
-- 8. DOCUMENTACION_EVENTO
-- ============================================================
CREATE TABLE public.documentos_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('informe_ie','listado_conviventes','foto','informe_coordinador','otro')),
  nombre TEXT NOT NULL,
  url_archivo TEXT,
  persona_carga_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos_evento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select_auth" ON public.documentos_evento FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "docs_insert_auth" ON public.documentos_evento FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "docs_delete_auth" ON public.documentos_evento FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_docs_evento ON public.documentos_evento(evento_id);

-- ============================================================
-- TRIGGER: Crear persona automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- Crear persona
  INSERT INTO public.personas (auth_user_id, nombre, apellido, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  )
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO v_persona_id;

  -- Asignar rol de solo_lectura por defecto
  IF v_persona_id IS NOT NULL THEN
    SELECT id INTO v_admin_role_id FROM public.roles WHERE nombre = 'solo_lectura' LIMIT 1;
    IF v_admin_role_id IS NOT NULL THEN
      INSERT INTO public.persona_roles (persona_id, rol_id)
      VALUES (v_persona_id, v_admin_role_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER organizaciones_updated_at BEFORE UPDATE ON public.organizaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER ep_updated_at BEFORE UPDATE ON public.evento_participantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER pagos_updated_at BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
