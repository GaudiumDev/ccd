-- ============================================================
-- Migration 039: Perfil autogestionado de Cecistas
-- Agrega 3 conceptos del dominio que el cecista mantiene desde
-- su propio perfil:
--   1. Casa Comunitaria  (entidad nueva, relación 1→1 a persona)
--   2. Dedicaciones       (no excluyentes, cada una con año de inicio)
--   3. Votos              (temporales o perpetuos)
-- En esta instancia solo se ALMACENAN los datos. La lógica de
-- renovación de votos se agregará más adelante.
-- ============================================================

BEGIN;

-- ─── 1. Casas Comunitarias ────────────────────────────────────────────────────
-- Por ahora solo identidad básica (codigo, tipo, nombre). Se ampliará luego.

CREATE TABLE IF NOT EXISTS public.casas_comunitarias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT,
  nombre      TEXT NOT NULL,
  tipo        TEXT CHECK (tipo IN ('incoada', 'con_pautas_aprobadas')),
  estado      TEXT NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'inactiva')),
  fecha_baja  DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.casas_comunitarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casas_comunitarias_select_auth"
  ON public.casas_comunitarias FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "casas_comunitarias_insert_auth"
  ON public.casas_comunitarias FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "casas_comunitarias_update_auth"
  ON public.casas_comunitarias FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_casas_comunitarias_estado
  ON public.casas_comunitarias(estado);

CREATE TRIGGER casas_comunitarias_updated_at
  BEFORE UPDATE ON public.casas_comunitarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Relación 1→1 a nivel persona (atributo del cecista)
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS casa_comunitaria_id UUID
    REFERENCES public.casas_comunitarias(id) ON DELETE SET NULL;

-- ─── 2. Dedicaciones (no excluyentes) ─────────────────────────────────────────
-- El campo legacy personas.cecista_dedicado (boolean) se conserva para no
-- romper el form admin ni el export. Las dedicaciones detalladas viven acá.

CREATE TABLE IF NOT EXISTS public.persona_dedicaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id  UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,   -- 'dedicado' | 'viviendo_como_dedicado' (lista ampliable)
  anio_inicio INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (persona_id, tipo)
);

ALTER TABLE public.persona_dedicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_dedicaciones_select_auth"
  ON public.persona_dedicaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_dedicaciones_insert_auth"
  ON public.persona_dedicaciones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_dedicaciones_update_auth"
  ON public.persona_dedicaciones FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_dedicaciones_delete_auth"
  ON public.persona_dedicaciones FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_persona_dedicaciones_persona_id
  ON public.persona_dedicaciones(persona_id);

-- ─── 3. Votos (temporales o perpetuos) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.persona_votos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id           UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  tipo_voto            TEXT NOT NULL,   -- tender_union_dios, caridad_fraterna, irradiacion,
                                        -- castidad, pobreza, obediencia,
                                        -- tender_union_dios_matrimonios, otros_familiares
  anio                 INTEGER,         -- año en que hizo el voto
  perpetuo             BOOLEAN NOT NULL DEFAULT FALSE,
  temporal_cant_anios  INTEGER,         -- si es temporal, cantidad de años
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (persona_id, tipo_voto)
);

ALTER TABLE public.persona_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_votos_select_auth"
  ON public.persona_votos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_votos_insert_auth"
  ON public.persona_votos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_votos_update_auth"
  ON public.persona_votos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "persona_votos_delete_auth"
  ON public.persona_votos FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_persona_votos_persona_id
  ON public.persona_votos(persona_id);

COMMIT;
