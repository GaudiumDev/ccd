-- Migration 013: Replanteo del formulario de solicitud de eventos
-- - Actualiza el constraint de estados (solicitud, discernimiento_eqt en lugar de solicitado/discernimiento_timon)
-- - Agrega columnas para los campos del formulario de solicitud (mockup)

BEGIN;

-- Actualizar constraint de estado
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_estado_check;

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_estado_check
  CHECK (estado IN (
    'borrador',
    'solicitud',
    'discernimiento_confra',
    'discernimiento_eqt',
    'aprobado',
    'rechazado',
    'publicado',
    'finalizado',
    'cancelado'
  ));

-- Migrar estados anteriores si existen registros
UPDATE public.eventos SET estado = 'solicitud'         WHERE estado = 'solicitado';
UPDATE public.eventos SET estado = 'discernimiento_eqt' WHERE estado = 'discernimiento_timon';

-- Nuevas columnas del formulario de solicitud
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fraternidad_id              UUID REFERENCES public.organizaciones(id),
  ADD COLUMN IF NOT EXISTS requiere_discernimiento_confra BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coordinadores_propuestos    TEXT,
  ADD COLUMN IF NOT EXISTS asesor_propuesto            TEXT,
  ADD COLUMN IF NOT EXISTS asesor_voluntario           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS es_apv                      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ciudad                      TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal               TEXT,
  ADD COLUMN IF NOT EXISTS diocesis                    TEXT,
  ADD COLUMN IF NOT EXISTS provincia_evento            TEXT,
  ADD COLUMN IF NOT EXISTS pais_evento                 TEXT DEFAULT 'Argentina',
  ADD COLUMN IF NOT EXISTS notas_discernimiento        TEXT;

-- Nota semántica:
-- organizacion_id = confraternidad (a la que pertenece la fraternidad solicitante)
-- fraternidad_id  = fraternidad específica que solicita el evento

COMMIT;
