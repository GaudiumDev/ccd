-- Migration 027: EqT discernimiento — coordinador/asesor asignados y nuevo estado
-- El Equipo Timón asigna definitivamente coordinador y asesor, y el resultado
-- queda en estado 'pendiente_datos_noticias' (en lugar de 'aprobado') para que
-- se completen los datos de noticias/publicación.

BEGIN;

-- Columnas para los asignados definitivos (solo las define el EqT)
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS coordinador_asignado_id UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS asesor_asignado_id      UUID REFERENCES public.personas(id);

-- Actualizar constraint de estado para incluir el nuevo valor
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_estado_check;

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_estado_check
  CHECK (estado IN (
    'borrador',
    'solicitud',
    'discernimiento_confra',
    'discernimiento_eqt',
    'pendiente_datos_noticias',
    'aprobado',
    'rechazado',
    'publicado',
    'finalizado',
    'cancelado'
  ));

COMMIT;
