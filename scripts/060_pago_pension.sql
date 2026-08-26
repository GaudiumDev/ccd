-- ============================================================
-- MIGRACIÓN 060: Pago de pensión
--
-- 1. Columna concepto en pagos (inscripcion | pension), default 'inscripcion'
--    para no alterar el significado de las filas existentes.
-- 2. Índice de soporte para las nuevas consultas filtradas por concepto.
--
-- Nota: eventos.pension ya existe desde la migración 003 (sin uso hasta ahora).
-- A partir de esta feature se usa como "Precio de Pensión" — no requiere DDL.
-- ============================================================

BEGIN;

ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS concepto TEXT NOT NULL DEFAULT 'inscripcion'
    CHECK (concepto IN ('inscripcion', 'pension'));

CREATE INDEX IF NOT EXISTS idx_pagos_concepto ON public.pagos(concepto);

COMMIT;
