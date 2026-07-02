-- Migration 046: Seed canonical Tipos de Eventos
-- Source: "Tipos de Eventos - Hoja 1.csv"
-- Run this in the Supabase SQL editor.
--
-- Behaviour:
--   1. Adds `codigo` column + partial unique index (enables idempotent upsert).
--   2. Widens the `categoria` CHECK to include 'encuentro' (already used by the UI).
--   3. Soft-deletes ALL existing tipos (activo=false); canonical rows re-activated.
--   4. Upserts the canonical rows by `codigo` (idempotent / re-runnable).
--
-- Mapping from CSV:
--   CATEGORIA: CONVIVENCIA->convivencia, ENCUENTRO->encuentro, RETIRO->retiro, TALLER->taller
--   ALCANCE:   ABIERTO->abierto, INTERNO->interno
--   REQUIERE DISC. CONFR / REQUIERE DISCEN EQT: SI->true, NO->false
--   REQUISITOS: text as-is; "NINGUNO"/"Ninguno"/empty -> NULL
--
-- CSV data fix: rows "Doctrina IV/V/VI" all shared código TDOCVI (typo);
-- corrected here to TDOCIV / TDOCV / TDOCVI so codes are unique.

BEGIN;

-- ─── 1. codigo column + unique key ────────────────────────────────────────────
ALTER TABLE public.tipos_eventos
  ADD COLUMN IF NOT EXISTS codigo TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tipos_eventos_codigo
  ON public.tipos_eventos (codigo) WHERE codigo IS NOT NULL;

-- ─── 2. Widen categoria CHECK to include 'encuentro' ──────────────────────────
ALTER TABLE public.tipos_eventos
  DROP CONSTRAINT IF EXISTS tipos_eventos_categoria_check;

ALTER TABLE public.tipos_eventos
  ADD CONSTRAINT tipos_eventos_categoria_check
  CHECK (categoria IN ('convivencia', 'encuentro', 'retiro', 'taller', 'otro'));

-- ─── 3. Soft-delete existing tipos (canonical ones re-activated in step 4) ─────
UPDATE public.tipos_eventos SET activo = FALSE;

-- ─── 4. Upsert canonical rows (idempotent by codigo) ──────────────────────────
INSERT INTO public.tipos_eventos
  (codigo, nombre, categoria, alcance, requiere_discernimiento_confra, requiere_discernimiento_eqt, requisitos, activo)
VALUES
  ('CCC',      'CONVIVENCIA CON CRISTO',        'convivencia', 'abierto', TRUE,  TRUE, NULL, TRUE),
  ('CCPA',     'CONVIVENCIA CON PABLO',         'convivencia', 'abierto', TRUE,  TRUE, 'CcC', TRUE),
  ('CCPE',     'CONVIVENCIA CON PEDRO',         'convivencia', 'abierto', TRUE,  TRUE, 'CcP', TRUE),
  ('CCM',      'CONVIVENCIA CON MARIA',         'convivencia', 'abierto', TRUE,  TRUE, 'CcPe', TRUE),
  ('CCE',      'CONVIVENCIA CON EL ESPÍRITU',   'convivencia', 'abierto', TRUE,  TRUE, 'CcM', TRUE),
  ('CCT',      'CONVIVENCIA TRINIDAD',          'convivencia', 'abierto', TRUE,  TRUE, 'CcE', TRUE),
  ('CCDA',     'CONVIVENCIA DIOS AMOR',         'convivencia', 'abierto', TRUE,  TRUE, 'CcT', TRUE),
  ('EGS',      'Encuentro General de Servidores',       'encuentro', 'interno', TRUE, TRUE, 'SER CECISTA/ a veces son conviventes o hijos de cecistas', TRUE),
  ('ERJ',      'Encuentro Regional de Jóvenes',         'encuentro', 'interno', TRUE, TRUE, 'SER CECISTA/ a veces son conviventes o hijos de cecistas', TRUE),
  ('EQTA',     'Equipo Timón Amplado',                  'encuentro', 'interno', TRUE, TRUE, 'MIN PASTORAL, CONDUCCION, INVITADO', TRUE),
  ('ETITA',    'EqTA y Min. Pastorales',                'encuentro', 'interno', TRUE, TRUE, 'MIN PASTORAL, CONDUCCION, INVITADO', TRUE),
  ('AJOVREF',  'Animadores de Jóvenes y Referentes',    'encuentro', 'interno', TRUE, TRUE, 'EQT, ANIMADOR DE JOVENES, REFERENTE DE JOVENES', TRUE),
  ('ADEDIREF', 'Animadores de Dedicados y Referentes',  'encuentro', 'interno', TRUE, TRUE, 'EQT, ANIMADOR DE DEDICADOS JOVENES, REFERENTE DE DEDICADOS', TRUE),
  ('EGC',      'Encuentro General de Conviventes',      'encuentro', 'abierto', TRUE, TRUE, 'Haber hecho un retiro en CcD', TRUE),
  ('EGD',      'Encuentro General de Dedicados',        'encuentro', 'interno', TRUE, TRUE, 'CECISTA, DEDICADO o INVITADO', TRUE),
  ('JAE',      'Jesus Amor Eucarístico',        'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('JAM',      'Jesus Amor Misericordioso',     'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('JM',       'Jesús Maestro',                 'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('RPASC',    'Retiro Pascual',                'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('RDEDI',    'Retiro de Dedicados Confraternidades', 'retiro', 'interno', TRUE, TRUE, 'CECISTA, DEDICADO o INVITADO', TRUE),
  ('TCOORD',   'Taller de Coordinadores',       'retiro', 'interno', TRUE, TRUE, 'INVITACION O HABER COORDINADO', TRUE),
  ('RASES',    'Retiro de Asesores',            'retiro', 'abierto', TRUE, TRUE, 'EQT, ASESOR SERVIDOR, ASESOR VOLUNTARIO, INVITADO', TRUE),
  ('JACH',     'Jesus Amigo de los Chicos',     'retiro', 'abierto', TRUE, TRUE, 'Niños que ya hicieron su 1ª comunión o están próximas a recibirla (de 8 a 12 años)', TRUE),
  ('RCASAS',   'Retiro de Casas Comunitarias',  'retiro', 'interno', TRUE, TRUE, 'Cecistas que forman casas comunitarias', TRUE),
  ('SPRES',    'Seminario de Presentación',     'retiro', 'abierto', TRUE, TRUE, 'Conviventes presentados por cecistas', TRUE),
  ('DHA',      'Dulce Huesped del Alma',        'retiro', 'abierto', TRUE, TRUE, 'Pre adolescentes que se preparan a la confirmación, de 12 a 15 años', TRUE),
  ('CCDIOS',   'Cita con Dios',                 'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('FAV',      'Fuente de Agua VIva',           'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('CDLSTOS',  'Comunión de los Santos',        'retiro', 'abierto', TRUE, TRUE, NULL, TRUE),
  ('TDPCOM',   'Taller de Discernimiento Prudencial Comunitario', 'taller', 'interno', TRUE, TRUE, 'servidores de la cCcD y colaboradores con experiencia comunitaria', TRUE),
  ('TCENT',    'Taller de Centralización',      'taller', 'interno', TRUE, TRUE, 'servidores de la cCcD y colaboradores', TRUE),
  ('TSERV',    'Taller de Servicio en las Convivencias', 'taller', 'interno', TRUE, TRUE, 'servidores y colaboradores que deseen prepararse para el servicio', TRUE),
  ('TOO',      'Taller de Oración Ordinaria',   'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas hasta CcPe', TRUE),
  ('TOCI',     'Taller de Oración Contemplativa I',   'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcM', TRUE),
  ('TOC II',   'Taller de Oración Contemplativa II',  'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcE', TRUE),
  ('TOC III',  'Taller de Oración Contemplativa III', 'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcT', TRUE),
  ('TOC IV',   'Taller de Oración Contemplativa IV',  'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcDA', TRUE),
  ('TOC V',    'Taller de Oración Contemplativa V',   'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcDA', TRUE),
  ('TCCC',     'Taller de CcC',                 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCP',     'Taller de CcP',                 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCPE',    'Taller de CcPe',                'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCM',     'Taller de CcM',                 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCE',     'Taller de CcE',                 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCT',     'Taller de CcT',                 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCCDA',    'Taller de CcDA',                'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('TCEAUX',   'Taller de Centralización y Equipo Auxiliar', 'taller', 'interno', TRUE, TRUE, NULL, TRUE),
  ('CJ',       'Cristo joven',                  'retiro', 'abierto', TRUE, TRUE, 'adolescentes de 14 a 17 años', TRUE),
  ('SF',       'Retiro Sagrada Familia',        'retiro', 'abierto', TRUE, TRUE, 'para matrimonios con el sacramento', TRUE),
  ('PROFI',    'Taller de Profecía I',          'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcM', TRUE),
  ('PROFII',   'Taller de Profecía II',         'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcE', TRUE),
  ('TASOC',    'Taller de Acción Social',       'taller', 'abierto', TRUE, TRUE, 'Conviventes y cecistas desde CcC', TRUE),
  ('TMSERV',   'Taller de Mística en el servicio', 'taller', 'interno', TRUE, TRUE, 'Servidores desde CcE en adelante. Coordinadores y futuros coordinadores', TRUE),
  ('TAUT',     'Taller de Autoridad en la cCcD', 'taller', 'interno', TRUE, TRUE, 'Cecistas con ministerios de conducción o en condiciones de desempeñarlos', TRUE),
  ('TAESP',    'Taller de Acompañamiento Espiritual', 'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCI',    'Taller de Doctrina I',          'taller', 'interno', TRUE, TRUE, 'Cecistas y Conviventes', TRUE),
  ('TDOCII',   'Taller de Doctrina II',         'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCIII',  'Taller de Doctrina III',        'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCIV',   'Taller de Doctrina IV',         'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCV',    'Taller de Doctrina V',          'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCVI',   'Taller de Doctrina VI',         'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('TDOCVII',  'Taller de Doctrina VII',        'taller', 'interno', TRUE, TRUE, 'Cecistas', TRUE),
  ('RFYFF',    'Retiro anual de Familiares y Futuro Familiares', 'encuentro', 'interno', FALSE, TRUE, 'Cecistas Familiares y futuros familiares', TRUE),
  ('CAFAR',    'Cafarnaum',                     'encuentro', 'interno', FALSE, TRUE, 'Equipo timón ampliado y familiares', TRUE)
ON CONFLICT (codigo) WHERE codigo IS NOT NULL DO UPDATE
  SET nombre                         = EXCLUDED.nombre,
      categoria                      = EXCLUDED.categoria,
      alcance                        = EXCLUDED.alcance,
      requiere_discernimiento_confra = EXCLUDED.requiere_discernimiento_confra,
      requiere_discernimiento_eqt    = EXCLUDED.requiere_discernimiento_eqt,
      requisitos                     = EXCLUDED.requisitos,
      activo                         = TRUE;

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- SELECT categoria, count(*) FROM public.tipos_eventos WHERE activo GROUP BY categoria ORDER BY categoria;
-- SELECT codigo, nombre, categoria, alcance, requisitos FROM public.tipos_eventos WHERE activo ORDER BY codigo;
