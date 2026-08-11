-- ============================================================
-- Migration 057: Ministerios que ejerce (áreas de servicio)
-- Lista autodeclarada por el cecista (Música, Eucaristía, Escucha...),
-- selección múltiple. Independiente del catálogo institucional
-- `ministerios` / `asignaciones_ministerio` (roles formales
-- asignados por un admin) para no conflacionar ambos conceptos.
-- No lleva histórico (fecha_inicio/fin) porque no es una
-- asignación institucional, es una autodeclaración simple.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.areas_servicio (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT UNIQUE NOT NULL,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.persona_areas_servicio (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id        UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  area_servicio_id  UUID NOT NULL REFERENCES public.areas_servicio(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (persona_id, area_servicio_id)
);

ALTER TABLE public.areas_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_areas_servicio ENABLE ROW LEVEL SECURITY;

-- Mismo patrón permisivo que el resto de las tablas persona_* del proyecto.
CREATE POLICY "areas_servicio_select_auth" ON public.areas_servicio
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "areas_servicio_insert_auth" ON public.areas_servicio
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "persona_areas_servicio_select_auth" ON public.persona_areas_servicio
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "persona_areas_servicio_insert_auth" ON public.persona_areas_servicio
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "persona_areas_servicio_delete_auth" ON public.persona_areas_servicio
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Seed inicial — ampliar por SQL cuando Ángeles confirme la lista completa.
INSERT INTO public.areas_servicio (nombre) VALUES
  ('Música'),
  ('Eucaristía'),
  ('Escucha')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
