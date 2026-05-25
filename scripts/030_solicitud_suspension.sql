-- Migration 030: Add suspension request and suspension tracking columns

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS solicitud_suspension_notas TEXT,
  ADD COLUMN IF NOT EXISTS solicitud_suspension_por UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS solicitud_suspension_fecha DATE,
  ADD COLUMN IF NOT EXISTS suspendido_por UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS fecha_suspension DATE,
  ADD COLUMN IF NOT EXISTS notas_suspension TEXT;
