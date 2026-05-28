-- Migration 034: Reemplaza categoria_persona + persona_categoria_no_cecista
-- por un único campo tipo_persona que representa el estadío en el journey hacia la comunidad.

BEGIN;

-- 1. Agregar columna tipo_persona
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS tipo_persona TEXT
    CHECK (tipo_persona IN ('interesado', 'inscripto', 'convivente', 'cecista', 'otro'));

-- 2. Migrar datos existentes

-- Cecistas → cecista
UPDATE public.personas
  SET tipo_persona = 'cecista'
  WHERE categoria_persona = 'cecista'
    AND tipo_persona IS NULL;

-- No cecistas con subcategoría convivente → convivente
UPDATE public.personas p
  SET tipo_persona = 'convivente'
  WHERE p.categoria_persona = 'no_cecista'
    AND p.tipo_persona IS NULL
    AND EXISTS (
      SELECT 1 FROM public.persona_categoria_no_cecista pnc
      WHERE pnc.persona_id = p.id AND pnc.categoria = 'convivente'
    );

-- Resto de no cecistas → otro
UPDATE public.personas
  SET tipo_persona = 'otro'
  WHERE categoria_persona = 'no_cecista'
    AND tipo_persona IS NULL;

-- Nota: categoria_persona y persona_categoria_no_cecista se mantienen en la DB
-- por compatibilidad histórica. El código de aplicación ya no las usa.

COMMIT;
