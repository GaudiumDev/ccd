-- Migration 052: Cierre de Convivencia
-- Enables the post-event closing workflow: coordinators/managers load the event
-- deliverables (conviventes list, economic report, photos, confidential reports,
-- materials/manuals) while the event is 'finalizado', and Equipo Timón presses
-- "Cerrar Convivencia" to move it to a new terminal state 'cerrado' (locks edits).
--
-- Idempotent / re-runnable (mirrors 049/051).

-- ─── 1. Add 'cerrado' terminal state (based on migration 051's set) ────────────
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
    'cerrado',
    'cancelado'
  ));

-- ─── 2. Cierre columns on eventos ─────────────────────────────────────────────
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cerrado_por UUID REFERENCES public.personas(id),
  -- Fotos (puntos 3 y 5)
  ADD COLUMN IF NOT EXISTS cierre_foto_convivencia_url TEXT,
  ADD COLUMN IF NOT EXISTS cierre_foto_servidores_url TEXT,
  -- Informes confidenciales (puntos 6 y 7)
  ADD COLUMN IF NOT EXISTS informe_coordinador_respuestas JSONB,
  ADD COLUMN IF NOT EXISTS informe_carismas JSONB,
  -- Materiales / Manuales (puntos 8 y 9)
  ADD COLUMN IF NOT EXISTS cierre_bolso_manuales_completo BOOLEAN,
  ADD COLUMN IF NOT EXISTS cierre_manuales_saldo_final INT,
  ADD COLUMN IF NOT EXISTS cierre_manuales_recibidos_de UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS cierre_manuales_entrego_a UUID REFERENCES public.personas(id),
  ADD COLUMN IF NOT EXISTS cierre_manuales_notas TEXT;

-- ─── 3. evento_movimientos (Informe económico — punto 2) ──────────────────────
-- Movements of income/expense per event. Balance and 20% tithe are computed in the app.
CREATE TABLE IF NOT EXISTS public.evento_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  -- Ingreso: pago (pensiones) | otros_ingresos (bolsillo de Dios) | donacion
  subtipo_ingreso TEXT CHECK (subtipo_ingreso IN ('pago', 'otros_ingresos', 'donacion')),
  -- Egreso: categoría de una lista predefinida en la app (CATEGORIAS_EGRESO)
  categoria_egreso TEXT,
  -- Movimientos importados desde el módulo de pagos (evita doble carga)
  pago_id UUID REFERENCES public.pagos(id),
  concepto TEXT,
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  fecha DATE,
  notas TEXT,
  created_by UUID REFERENCES public.personas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Coherencia ingreso/egreso
  CONSTRAINT evento_movimientos_tipo_check CHECK (
    (tipo = 'ingreso' AND subtipo_ingreso IS NOT NULL AND categoria_egreso IS NULL) OR
    (tipo = 'egreso'  AND categoria_egreso IS NOT NULL AND subtipo_ingreso IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_evento_movimientos_evento
  ON public.evento_movimientos (evento_id);

-- Evita importar el mismo pago dos veces
CREATE UNIQUE INDEX IF NOT EXISTS uq_evento_movimientos_pago
  ON public.evento_movimientos (pago_id) WHERE pago_id IS NOT NULL;

-- RLS: se habilita; la autorización fina se hace en las API routes vía canPerform
-- (mismo patrón que el resto del app). Política base: authenticated CRUD.
ALTER TABLE public.evento_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evento_movimientos_authenticated ON public.evento_movimientos;
CREATE POLICY evento_movimientos_authenticated
  ON public.evento_movimientos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 4. Preguntas configurables del Informe del Coordinador (por tipo de evento) ─
ALTER TABLE public.tipos_eventos
  ADD COLUMN IF NOT EXISTS preguntas_informe JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Seed de las 7 preguntas por defecto para convivencias que aún no tienen preguntas.
UPDATE public.tipos_eventos
SET preguntas_informe = '[
  {"id": "p1", "texto": "¿Alguna característica especial de la CcD?"},
  {"id": "p2", "texto": "¿A qué miembros de la Comunidad llamaste y no pudieron integrar el equipo?"},
  {"id": "p3", "texto": "¿Sacerdotes Conviventes que podrían ser llamados a asesorar CcD? (nombre, dirección, teléfono)."},
  {"id": "p4", "texto": "Conviventes que manifestaron interés por la Comunidad y su ministerio."},
  {"id": "p5", "texto": "Conviventes que vemos como posibles candidatos para la Comunidad (desde la CcPa)."},
  {"id": "p6", "texto": "¿Algo para indicar sobre las comodidades de la Casa? (comentarlo también al centralizador)."},
  {"id": "p7", "texto": "¿Algo para destacar sobre el Equipo Auxiliar?"}
]'::jsonb
WHERE categoria = 'convivencia'
  AND (preguntas_informe IS NULL OR preguntas_informe = '[]'::jsonb);

-- Verificación:
-- SELECT nombre, categoria, jsonb_array_length(preguntas_informe) FROM public.tipos_eventos WHERE activo;
-- SELECT tipo, subtipo_ingreso, categoria_egreso, monto FROM public.evento_movimientos ORDER BY created_at;
