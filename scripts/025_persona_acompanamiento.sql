-- ============================================================
-- Migration 025: Historial de Acompañamiento
-- Reemplaza el campo puntual personas.acompanante_id por una
-- tabla histórica con fecha_inicio / fecha_fin, igual que
-- persona_modos y asignaciones_ministerio.
-- ============================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS public.persona_acompanamiento (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  acompanante_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
  fecha_inicio   DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin      DATE,
  notas          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS — mismo patrón que persona_modos
ALTER TABLE public.persona_acompanamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_acompanamiento_select_auth"
  ON public.persona_acompanamiento FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_acompanamiento_insert_auth"
  ON public.persona_acompanamiento FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_acompanamiento_update_auth"
  ON public.persona_acompanamiento FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 3. Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_persona_acomp_persona_id
  ON public.persona_acompanamiento(persona_id);

CREATE INDEX IF NOT EXISTS idx_persona_acomp_acompanante_id
  ON public.persona_acompanamiento(acompanante_id);

-- 4. Índice único parcial: solo un acompañante activo por persona
CREATE UNIQUE INDEX IF NOT EXISTS uq_persona_acompanamiento_activo
  ON public.persona_acompanamiento(persona_id)
  WHERE fecha_fin IS NULL;

-- 5. Migración de datos existentes desde personas.acompanante_id
INSERT INTO public.persona_acompanamiento (persona_id, acompanante_id, fecha_inicio)
SELECT id, acompanante_id, CURRENT_DATE
FROM public.personas
WHERE acompanante_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Marcar columna legacy como deprecada
COMMENT ON COLUMN public.personas.acompanante_id
  IS '[DEPRECATED] Usar persona_acompanamiento WHERE fecha_fin IS NULL. Se mantiene por compatibilidad y se sincroniza en cada escritura. Eliminar en migración 026.';
