-- 038_participation_lifecycle.sql
-- Refactor del ciclo de vida de participación en eventos.
-- Agrega estado_participacion (reemplaza semántica de estado_inscripcion) y tipo_participante (cecista/no_cecista).
-- estado_inscripcion se mantiene para compatibilidad; eliminar con 039_drop_estado_inscripcion.sql una vez migrado todo el código.

BEGIN;

-- 1. Agregar nuevas columnas
ALTER TABLE public.evento_participantes
  ADD COLUMN IF NOT EXISTS estado_participacion TEXT
    CHECK (estado_participacion IN (
      'interesado',
      'inscripto',
      'en_curso',
      'completado',
      'cancelado',
      'lista_espera'
    )),
  ADD COLUMN IF NOT EXISTS tipo_participante TEXT
    CHECK (tipo_participante IN ('cecista', 'no_cecista'));

-- 2. Migrar datos existentes de estado_inscripcion → estado_participacion
UPDATE public.evento_participantes
SET estado_participacion = CASE
  WHEN estado_inscripcion = 'pendiente'    THEN 'interesado'
  WHEN estado_inscripcion = 'confirmado'   THEN 'inscripto'
  WHEN estado_inscripcion = 'cancelado'    THEN 'cancelado'
  WHEN estado_inscripcion = 'lista_espera' THEN 'lista_espera'
  ELSE 'interesado'
END
WHERE estado_participacion IS NULL;

-- 3. Backfill tipo_participante desde personas.tipo_persona
UPDATE public.evento_participantes ep
SET tipo_participante = CASE
  WHEN p.tipo_persona = 'cecista' THEN 'cecista'
  ELSE 'no_cecista'
END
FROM public.personas p
WHERE p.id = ep.persona_id
  AND ep.tipo_participante IS NULL;

-- 4. Hacer NOT NULL
ALTER TABLE public.evento_participantes
  ALTER COLUMN estado_participacion SET NOT NULL;

-- 5. Limpiar personas.tipo_persona: quitar estados del lifecycle de eventos
-- DROP primero para que el UPDATE pueda escribir 'no_cecista' sin violar el constraint viejo
ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_tipo_persona_check;

UPDATE public.personas
SET tipo_persona = 'no_cecista'
WHERE tipo_persona IN ('interesado', 'inscripto', 'convivente');

ALTER TABLE public.personas
  ADD CONSTRAINT personas_tipo_persona_check
    CHECK (tipo_persona IN ('cecista', 'no_cecista', 'otro'));

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_ep_estado_participacion
  ON public.evento_participantes(estado_participacion);

CREATE INDEX IF NOT EXISTS idx_ep_tipo_participante
  ON public.evento_participantes(tipo_participante);

COMMIT;
