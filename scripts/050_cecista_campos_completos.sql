-- ============================================================
-- Migration 050: Campos faltantes del perfil de Cecistas
-- Completa el relevamiento de "Datos de Cecistas a Relevar":
--   1. Columnas simples nuevas en personas
--   2. Reestructuración de estado_eclesial (2 niveles + rango)
--   3. Ampliación de estado_vida (estado civil)
--   4. Acompañante no-cecista (texto libre) en persona_acompanamiento
--   5. Convivencias/retiros/talleres realizados (histórico)
-- ============================================================

BEGIN;

-- ─── 1. Columnas simples nuevas en personas ──────────────────────────────────

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT,
  ADD COLUMN IF NOT EXISTS nacionalidad TEXT,
  ADD COLUMN IF NOT EXISTS pais_documento TEXT,
  ADD COLUMN IF NOT EXISTS ocupacion TEXT,
  ADD COLUMN IF NOT EXISTS titulo_estudios TEXT,
  ADD COLUMN IF NOT EXISTS institucion_religiosa TEXT,
  ADD COLUMN IF NOT EXISTS estado_eclesial_rango TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_personas_codigo_interno
  ON public.personas(codigo_interno) WHERE codigo_interno IS NOT NULL;

-- ─── 2. Reestructurar estado_eclesial (laico/clerigo/consagrado + rango) ─────
-- Antes: laico | religioso | diacono | sacerdote | obispo | cardenal
-- Ahora: laico | clerigo | consagrado, con el detalle del rango (si es
-- clérigo) en estado_eclesial_rango. 'cardenal' no tiene rango propio en el
-- relevamiento -> se mapea al más cercano ('obispo').

ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_estado_eclesial_check;

UPDATE public.personas SET estado_eclesial_rango = 'presbitero' WHERE estado_eclesial = 'sacerdote';
UPDATE public.personas SET estado_eclesial_rango = 'diacono' WHERE estado_eclesial = 'diacono';
UPDATE public.personas SET estado_eclesial_rango = 'obispo' WHERE estado_eclesial IN ('obispo', 'cardenal');
UPDATE public.personas SET estado_eclesial = 'clerigo'
  WHERE estado_eclesial IN ('diacono', 'sacerdote', 'obispo', 'cardenal');
UPDATE public.personas SET estado_eclesial = 'consagrado' WHERE estado_eclesial = 'religioso';

ALTER TABLE public.personas
  ADD CONSTRAINT personas_estado_eclesial_check
    CHECK (estado_eclesial IN ('laico', 'clerigo', 'consagrado')),
  ADD CONSTRAINT personas_estado_eclesial_rango_check
    CHECK (estado_eclesial_rango IS NULL OR estado_eclesial_rango IN
      ('obispo', 'presbitero', 'diacono', 'seminarista', 'diacono_permanente'));

-- ─── 3. Ampliar estado_vida (estado civil) ───────────────────────────────────

ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_estado_vida_check;
ALTER TABLE public.personas ADD CONSTRAINT personas_estado_vida_check
  CHECK (estado_vida IN
    ('sin_especificar', 'soltero', 'casado', 'viudo', 'separado', 'divorciado', 'union_civil', 'consagrado'));

-- ─── 4. Acompañante no-cecista (texto libre) ─────────────────────────────────
-- Algunos cecistas acompañan/son acompañados por alguien que no está
-- registrado como persona en la plataforma.

ALTER TABLE public.persona_acompanamiento
  ALTER COLUMN acompanante_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS acompanante_libre TEXT;

ALTER TABLE public.persona_acompanamiento
  DROP CONSTRAINT IF EXISTS persona_acompanamiento_alguno_check;
ALTER TABLE public.persona_acompanamiento
  ADD CONSTRAINT persona_acompanamiento_alguno_check
    CHECK (acompanante_id IS NOT NULL OR acompanante_libre IS NOT NULL);

-- ─── 5. Convivencias/retiros/talleres realizados (histórico) ────────────────
-- Checklist contra el catálogo tipos_eventos (categoría convivencia/retiro/
-- taller, excluyendo encuentro), independiente de evento_participantes real
-- (sirve para cargar historial previo a la plataforma).

CREATE TABLE IF NOT EXISTS public.persona_eventos_realizados (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  tipo_evento_id UUID NOT NULL REFERENCES public.tipos_eventos(id) ON DELETE RESTRICT,
  anio           INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (persona_id, tipo_evento_id)
);

ALTER TABLE public.persona_eventos_realizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_eventos_realizados_select_auth"
  ON public.persona_eventos_realizados FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_eventos_realizados_insert_auth"
  ON public.persona_eventos_realizados FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_eventos_realizados_update_auth"
  ON public.persona_eventos_realizados FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_eventos_realizados_delete_auth"
  ON public.persona_eventos_realizados FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_persona_eventos_realizados_persona_id
  ON public.persona_eventos_realizados(persona_id);

COMMIT;
