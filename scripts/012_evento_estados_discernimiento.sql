-- Migration 012: Add discernimiento states to eventos workflow
-- Adds discernimiento_confra and discernimiento_timon states for the approval flow.
-- Fraternidad solicita → discernimiento_confra → discernimiento_timon → aprobado/rechazado
-- Confraternidad solicita → discernimiento_timon → aprobado/rechazado

BEGIN;

-- Drop existing estado check constraint
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_estado_check;

-- Re-add with new states
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_estado_check
  CHECK (estado IN (
    'borrador',
    'solicitado',
    'discernimiento_confra',
    'discernimiento_timon',
    'aprobado',
    'rechazado',
    'publicado',
    'finalizado',
    'cancelado'
  ));

-- Track who requested and rejection info
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS solicitado_por UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS rechazado_por UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
  ADD COLUMN IF NOT EXISTS fecha_rechazo DATE;

COMMIT;
