-- Migration 015: EqT discernimiento es opcional (igual que Confra)
-- Agrega columna requiere_discernimiento_eqt a eventos.
-- Los eventos existentes sin esta columna asumen eqt=true para preservar comportamiento anterior.

BEGIN;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS requiere_discernimiento_eqt BOOLEAN NOT NULL DEFAULT false;

-- Los eventos ya existentes en estados de discernimiento EqT o aprobados
-- se asume que sí requerían EqT — actualizarlos para consistencia
UPDATE public.eventos
  SET requiere_discernimiento_eqt = true
  WHERE estado IN ('discernimiento_eqt', 'aprobado', 'publicado', 'finalizado')
     OR disc_eqt_estado IS NOT NULL;

COMMIT;
