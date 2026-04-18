-- Migration 004: Add fecha_ingreso_comunidad to personas
-- Fecha de ingreso formal a la Comunidad CcD (independiente de persona_modos.fecha_inicio)

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_ingreso_comunidad DATE;
