-- Migration 048: Deactivate legacy / duplicate ministerios
-- Context: the 047 import matched by `nombre`, so pre-existing roles written in a
-- different case ("TIMONEL", "ANIMADOR DE DEDICADOS", ...) were NOT matched and are
-- now duplicated alongside the 30 canonical roles.
--
-- Goal: keep active ONLY the 30 canonical roles (identified by their canonical
-- `codigo_interno` set in 047) + `admin_general`; deactivate & hide everything else.
--
-- "Ocultar" == activo=false (the catalog marks them Inactivo and filters them out).
-- This is a soft-delete: assignments/history and FKs are preserved.
--
-- NOTE: this also deactivates the internal system roles other than admin_general
-- (solo_lectura, usuario_carga, tecnico_confraternidad, responsable_fraternidad),
-- matching the instruction "todos los creados antes de hoy excepto admin_general".
-- If any of those are still needed for access, add them to the keep-list below.

BEGIN;

UPDATE public.ministerios
SET activo = FALSE
WHERE activo = TRUE
  AND nombre <> 'admin_general'
  AND (
        codigo_interno IS NULL
        OR codigo_interno NOT IN (
          'TIMON','RCONFRA','EFRATER','DEQT','ADEDI','RDEDI','AJOV','RJOV','GFAM',
          'FFFAM','SECN','MCOM','TCONFRA','TFRATER','RFRA','ALOR','TICC','TICR',
          'COOR','MMUSIC','CENT','ASES','CONV','CEC','ADMIN','SEC','TES','FIN',
          'COP','CEDIT'
        )
      );

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- Roles que quedan activos (esperado: 30 canónicos + admin_general = 31):
-- SELECT nombre, codigo_interno, tipo, activo FROM public.ministerios
--   WHERE activo = TRUE ORDER BY nombre;
-- Roles desactivados:
-- SELECT nombre, codigo_interno FROM public.ministerios
--   WHERE activo = FALSE ORDER BY nombre;
