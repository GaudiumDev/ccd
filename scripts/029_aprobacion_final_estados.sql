-- Migration 029: Add pendiente_aprobacion_final and suspendido states + tracking columns

-- Extend the estado check constraint to include new states
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
    'rechazado',
    'suspendido',
    'finalizado',
    'cancelado'
  ));

-- Add columns for final approval tracking
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS notas_aprobacion_final TEXT,
  ADD COLUMN IF NOT EXISTS aprobacion_final_por UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS fecha_aprobacion_final DATE;
