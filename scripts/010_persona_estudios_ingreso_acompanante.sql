-- Migration: Agregar campos nivel_estudios, anio_ingreso y acompanante_id a personas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS nivel_estudios TEXT
    CHECK (nivel_estudios IN ('primario', 'secundario', 'terciario', 'universitario', 'posgrado_doctorado')),
  ADD COLUMN IF NOT EXISTS anio_ingreso INTEGER,
  ADD COLUMN IF NOT EXISTS acompanante_id UUID REFERENCES public.personas(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.personas.nivel_estudios IS 'Máximo nivel de estudios alcanzado';
COMMENT ON COLUMN public.personas.anio_ingreso IS 'Año de ingreso a la comunidad';
COMMENT ON COLUMN public.personas.acompanante_id IS 'Persona que acompaña a esta persona (relación self-referencing)';
