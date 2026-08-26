-- ============================================================
-- Migration 060: Catálogo de Diócesis
-- La columna `diocesis` es TEXT en personas, organizaciones,
-- casas_retiro y eventos. NO se cambia el tipo: este catálogo
-- solo alimenta el menú desplegable y se sigue guardando el
-- nombre como texto (los datos ya cargados quedan válidos).
--
-- El contenido se importa aparte (archivo "listados para
-- importación") con un seed tipo 043/045/053: upsert por `codigo`.
-- Mientras la tabla esté vacía, la UI cae automáticamente a un
-- campo de texto libre.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.diocesis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT,
  nombre      TEXT NOT NULL,
  tipo        TEXT CHECK (tipo IN ('arquidiocesis', 'diocesis', 'eparquia',
                                   'prelatura', 'ordinariato', 'otra')),
  pais        TEXT,
  provincia   TEXT,
  estado      TEXT NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'inactiva')),
  fecha_baja  DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Claves de deduplicación para el import (mismo patrón que organizaciones)
CREATE UNIQUE INDEX IF NOT EXISTS uq_diocesis_codigo
  ON public.diocesis(codigo) WHERE codigo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_diocesis_nombre
  ON public.diocesis(nombre);
CREATE INDEX IF NOT EXISTS idx_diocesis_pais_estado
  ON public.diocesis(pais, estado);

ALTER TABLE public.diocesis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diocesis_select_auth" ON public.diocesis;
CREATE POLICY "diocesis_select_auth"
  ON public.diocesis FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "diocesis_insert_auth" ON public.diocesis;
CREATE POLICY "diocesis_insert_auth"
  ON public.diocesis FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "diocesis_update_auth" ON public.diocesis;
CREATE POLICY "diocesis_update_auth"
  ON public.diocesis FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS diocesis_updated_at ON public.diocesis;
CREATE TRIGGER diocesis_updated_at
  BEFORE UPDATE ON public.diocesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;

-- ─── Plantilla para el seed del listado (correr aparte) ──────────────────────
-- INSERT INTO public.diocesis (codigo, nombre, tipo, pais, provincia) VALUES
--   ('DIOC-001', 'Arquidiócesis de Buenos Aires', 'arquidiocesis', 'Argentina', 'Ciudad Autónoma de Buenos Aires'),
--   ('DIOC-002', 'Diócesis de Corrientes',        'diocesis',      'Argentina', 'Corrientes')
-- ON CONFLICT (codigo) DO UPDATE SET
--   nombre     = EXCLUDED.nombre,
--   tipo       = EXCLUDED.tipo,
--   pais       = EXCLUDED.pais,
--   provincia  = EXCLUDED.provincia,
--   estado     = 'activa',
--   fecha_baja = NULL,
--   updated_at = NOW();
