-- Migration 051: Add "en_curso" event state + attendance check-in tracking
-- Enables validating attendance at event start (QR + manual): inscriptos become
-- convivientes (estado_participacion inscripto -> en_curso), and the event moves
-- publicado -> en_curso (hidden from the public home) -> finalizado.

-- 1. Extend eventos.estado to include "en_curso" (based on migration 029's set)
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_estado_check;

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_estado_check CHECK (estado IN (
    'borrador',
    'solicitud',
    'discernimiento_confra',
    'discernimiento_eqt',
    'pendiente_datos_noticias',
    'aprobado',
    'pendiente_aprobacion_final',
    'publicado',
    'en_curso',
    'rechazado',
    'suspendido',
    'finalizado',
    'cancelado'
  ));

-- 2. Record when the event actually started
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fecha_inicio_real TIMESTAMPTZ;

-- 3. Attendance check-in audit columns on participants
ALTER TABLE public.evento_participantes
  ADD COLUMN IF NOT EXISTS fecha_asistencia TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS asistencia_metodo TEXT,
  ADD COLUMN IF NOT EXISTS asistencia_por UUID REFERENCES public.personas(id);

ALTER TABLE public.evento_participantes
  DROP CONSTRAINT IF EXISTS evento_participantes_asistencia_metodo_check;

ALTER TABLE public.evento_participantes
  ADD CONSTRAINT evento_participantes_asistencia_metodo_check
  CHECK (asistencia_metodo IS NULL OR asistencia_metodo IN ('qr', 'manual'));
