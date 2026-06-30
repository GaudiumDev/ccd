-- Migration 043: Seed canonical Confraternidades y Fraternidades
-- Source: "Listado de Confraternidades y Fraternidades - Listado.csv"
-- Run this in the Supabase SQL editor.
--
-- Behaviour:
--   1. Soft-deletes ALL existing institutional orgs (comunidad/confraternidad/fraternidad/eqt).
--   2. Upserts the canonical hierarchy by `codigo` (idempotent / re-runnable).
--   3. Resolves parent_id by self-join on `codigo`.
--   4. Canonical rows are re-activated (estado='activa', fecha_baja=NULL); old un-coded
--      rows remain inactiva.
--
-- Hierarchy: Equipo Timón (comunidad) -> Confraternidades -> Fraternidades.
-- "FRAT-DEQT" ("Fraternidades dependientes del Equipo Timón") is modelled as a
-- confraternidad-level grouping node for the international / unattached fraternidades.

BEGIN;

-- ─── 1. Unique key on codigo (enables idempotent upsert) ──────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_organizaciones_codigo
  ON public.organizaciones (codigo) WHERE codigo IS NOT NULL;

-- ─── 2. Soft-delete existing institutional orgs ───────────────────────────────
UPDATE public.organizaciones
  SET estado = 'inactiva',
      fecha_baja = COALESCE(fecha_baja, now())
  WHERE tipo IN ('comunidad', 'confraternidad', 'fraternidad', 'eqt');

-- ─── 3. Staging with the canonical rows from the CSV ──────────────────────────
CREATE TEMP TABLE _staging_org (
  codigo        TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  tipo          TEXT NOT NULL,
  parent_codigo TEXT,
  pais          TEXT NOT NULL DEFAULT 'Argentina'
) ON COMMIT DROP;

INSERT INTO _staging_org (codigo, nombre, tipo, parent_codigo, pais) VALUES
  -- Comunidad raíz
  ('EQT', 'Equipo Timón', 'comunidad', NULL, 'Argentina'),

  -- Confraternidades (parent = EQT)
  ('CONF-BSAS', 'Confraternidad Buenos Aires',                'confraternidad', 'EQT', 'Argentina'),
  ('CONF-CB',   'Confraternidad Cura Brochero',               'confraternidad', 'EQT', 'Argentina'),
  ('CONF-CSFN', 'Confraternidad Chaco Santa Fe Norte',        'confraternidad', 'EQT', 'Argentina'),
  ('CONF-MAUX', 'Confraternidad María Auxiliadora',           'confraternidad', 'EQT', 'Argentina'),
  ('CONF-MIS',  'Confraternidad Misiones',                    'confraternidad', 'EQT', 'Argentina'),
  ('CONF-NOA',  'Confraternidad NOA',                         'confraternidad', 'EQT', 'Argentina'),
  ('CONF-NSDR', 'Confraternidad Nuestra Señora del Rosario',  'confraternidad', 'EQT', 'Argentina'),
  ('CONF-PY',   'Confraternidad Paraguay',                    'confraternidad', 'EQT', 'Paraguay'),
  ('CONF-PAT',  'Confraternidad Patagonia Austral',           'confraternidad', 'EQT', 'Argentina'),
  ('CONF-PDA',  'Confraternidad Profeta del Altísimo',        'confraternidad', 'EQT', 'Argentina'),
  ('CONF-SDD',  'Confraternidad Soplo de Dios',               'confraternidad', 'EQT', 'Argentina'),
  ('CONF-SFVC', 'Confraternidad Santa Fe de la Vera Cruz',    'confraternidad', 'EQT', 'Argentina'),
  ('CONF-SHE',  'Confraternidad Shejináh',                    'confraternidad', 'EQT', 'Argentina'),
  -- Grouping node for fraternidades directly dependent on EQT
  ('FRAT-DEQT', 'Fraternidades dependientes del Equipo Timón', 'confraternidad', 'EQT', 'Argentina'),

  -- Fraternidades (parent = su confraternidad)
  -- Confraternidad Buenos Aires
  ('FRAT-DN',   'Fraternidad Divino Niño',            'fraternidad', 'CONF-BSAS', 'Argentina'),
  ('FRAT-JER',  'Fraternidad Jerusalén',              'fraternidad', 'CONF-BSAS', 'Argentina'),
  ('FRAT-JBP',  'Fraternidad Jesús Buen Pastor',      'fraternidad', 'CONF-BSAS', 'Argentina'),
  ('FRAT-MES',  'Fraternidad María Estrella del Sur', 'fraternidad', 'CONF-BSAS', 'Argentina'),
  ('FRAT-SC',   'Fraternidad Sagrado Corazón',        'fraternidad', 'CONF-BSAS', 'Argentina'),
  -- Confraternidad Shejináh
  ('FRAT-MAS',  'Fraternidad Mascháj (derramar Unción)', 'fraternidad', 'CONF-SHE', 'Argentina'),
  ('FRAT-JUD',  'Fraternidad Judá',                      'fraternidad', 'CONF-SHE', 'Argentina'),
  -- Confraternidad Cura Brochero
  ('FRAT-CORD', 'Fraternidad Córdoba',                  'fraternidad', 'CONF-CB', 'Argentina'),
  ('FRAT-DFUN', 'Fraternidad Deán Funes',               'fraternidad', 'CONF-CB', 'Argentina'),
  ('FRAT-RIV',  'Fraternidad Río Cuarto',               'fraternidad', 'CONF-CB', 'Argentina'),
  ('FRAT-CRED', 'Fraternidad Cristo Redentor (Mendoza)','fraternidad', 'CONF-CB', 'Argentina'),
  -- Confraternidad María Auxiliadora
  ('FRAT-JPII', 'Fraternidad Juan Pablo II',            'fraternidad', 'CONF-MAUX', 'Argentina'),
  ('FRAT-LVIC', 'Fraternidad Laura Vicuña',             'fraternidad', 'CONF-MAUX', 'Argentina'),
  -- Confraternidad Misiones
  ('FRAT-APO',  'Fraternidad Apóstoles',                'fraternidad', 'CONF-MIS', 'Argentina'),
  ('FRAT-IGU',  'Fraternidad Iguazú',                   'fraternidad', 'CONF-MIS', 'Argentina'),
  ('FRAT-SJOS', 'Fraternidad San José',                 'fraternidad', 'CONF-MIS', 'Argentina'),
  ('FRAT-MPAD', 'Fraternidad Morada del Padre',         'fraternidad', 'CONF-MIS', 'Argentina'),
  ('FRAT-OBE',  'Fraternidad Oberá',                    'fraternidad', 'CONF-MIS', 'Argentina'),
  -- Confraternidad Soplo de Dios
  ('FRAT-CTES', 'Fraternidad Corrientes',               'fraternidad', 'CONF-SDD', 'Argentina'),
  ('FRAT-FOR',  'Fraternidad Formosa',                  'fraternidad', 'CONF-SDD', 'Argentina'),
  ('FRAT-GOY',  'Fraternidad Goya',                     'fraternidad', 'CONF-SDD', 'Argentina'),
  -- Confraternidad Chaco Santa Fe Norte
  ('FRAT-JMIS', 'Fraternidad Jesús Misericordioso',     'fraternidad', 'CONF-CSFN', 'Argentina'),
  ('FRAT-RCIA', 'Fraternidad Resistencia',              'fraternidad', 'CONF-CSFN', 'Argentina'),
  ('FRAT-BQRAS','Fraternidad Barranquera',              'fraternidad', 'CONF-CSFN', 'Argentina'),
  ('FRAT-VNIN', 'Fraternidad Virgen Niña',              'fraternidad', 'CONF-CSFN', 'Argentina'),
  -- Confraternidad NOA
  ('FRAT-JUJ',  'Fraternidad Jujuy',                    'fraternidad', 'CONF-NOA', 'Argentina'),
  ('FRAT-SAL',  'Fraternidad Salta',                    'fraternidad', 'CONF-NOA', 'Argentina'),
  ('FRAT-TUC',  'Fraternidad Tucumán',                  'fraternidad', 'CONF-NOA', 'Argentina'),
  -- Confraternidad Nuestra Señora del Rosario
  ('FRAT-MDP',  'Fraternidad Madre de la Divina Providencia',     'fraternidad', 'CONF-NSDR', 'Argentina'),
  ('FRAT-NSC',  'Fraternidad Nuestra Señora de la Candelaria',    'fraternidad', 'CONF-NSDR', 'Argentina'),
  ('FRAT-ROS',  'Fraternidad Rosario',                            'fraternidad', 'CONF-NSDR', 'Argentina'),
  ('FRAT-RSTA', 'Fraternidad Ruaj Santa',                         'fraternidad', 'CONF-NSDR', 'Argentina'),
  ('FRAT-SLZO', 'Fraternidad San Lorenzo',                        'fraternidad', 'CONF-NSDR', 'Argentina'),
  -- Confraternidad Paraguay
  ('FRAT-MANG', 'Fraternidad María de los Ángeles',               'fraternidad', 'CONF-PY', 'Paraguay'),
  ('FRAT-NSM',  'Fraternidad Nuestra Señora de la Merced',        'fraternidad', 'CONF-PY', 'Paraguay'),
  -- Confraternidad Patagonia Austral
  ('FRAT-CRIV', 'Fraternidad Comodoro Rivadavia',                 'fraternidad', 'CONF-PAT', 'Argentina'),
  ('FRAT-ESQ',  'Fraternidad Esquel',                             'fraternidad', 'CONF-PAT', 'Argentina'),
  ('FRAT-ST',   'Santisima Trinidad',                             'fraternidad', 'CONF-PAT', 'Argentina'),
  -- Confraternidad Profeta del Altísimo
  ('FRAT-CON',  'Fraternidad Concordia',                          'fraternidad', 'CONF-PDA', 'Argentina'),
  ('FRAT-LPAZ', 'Fraternidad La Paz',                             'fraternidad', 'CONF-PDA', 'Argentina'),
  ('FRAT-PAR',  'Fraternidad Paraná',                             'fraternidad', 'CONF-PDA', 'Argentina'),
  ('FRAT-FDD',  'Fraternidad Fuego de Dios',                      'fraternidad', 'CONF-PDA', 'Argentina'),
  -- Confraternidad Santa Fe de la Vera Cruz
  ('FRAT-ESPE', 'Fraternidad Esperanza',                          'fraternidad', 'CONF-SFVC', 'Argentina'),
  ('FRAT-RAF',  'Fraternidad Rafaela',                            'fraternidad', 'CONF-SFVC', 'Argentina'),
  ('FRAT-SFE',  'Fraternidad Santa Fe',                           'fraternidad', 'CONF-SFVC', 'Argentina'),
  ('FRAT-SUN',  'Fraternidad Sunchales-Santa Rafaela María',      'fraternidad', 'CONF-SFVC', 'Argentina'),
  -- Fraternidades dependientes del Equipo Timón (FRAT-DEQT)
  ('FRAT-NSESP','Fraternidad Nuestra Señora de la Esperanza',     'fraternidad', 'FRAT-DEQT', 'Argentina'),
  ('FRAT-MONT', 'Fraternidad Montevideo',                         'fraternidad', 'FRAT-DEQT', 'Uruguay'),
  ('FRAT-MERC', 'Fraternidad Mercedes',                           'fraternidad', 'FRAT-DEQT', 'Uruguay'),
  ('FRAT-SCRU', 'Fraternidad Santa Cruz de la Sierra',            'fraternidad', 'FRAT-DEQT', 'Bolivia'),
  ('FRAT-COCH', 'Fraternidad Cochabamba',                         'fraternidad', 'FRAT-DEQT', 'Bolivia'),
  ('FRAT-REFM', 'Fraternidad Refugio de Misericordia (Santiago)', 'fraternidad', 'FRAT-DEQT', 'Chile'),
  ('FRAT-SAHU', 'Fraternidad San Alberto Hurtado (Temuco)',       'fraternidad', 'FRAT-DEQT', 'Chile'),
  ('FRAT-DOM',  'Fraternidad Dominicana',                         'fraternidad', 'FRAT-DEQT', 'República Dominicana'),
  ('FRAT-SJBA', 'Fraternidad San Juan Bautista',                  'fraternidad', 'FRAT-DEQT', 'Panamá'),
  ('FRAT-MIPE', 'Fraternidad María Inmaculada Penonomé',          'fraternidad', 'FRAT-DEQT', 'Panamá'),
  ('FRAT-ICDM', 'Fraternidad Inmaculado Corazón de María (La Rioja)', 'fraternidad', 'FRAT-DEQT', 'Argentina'),
  ('FRAT-SMG',  'Fraternidad Santa María de Guadalupe',           'fraternidad', 'FRAT-DEQT', 'México'),
  ('FRAT-LIMA', 'Fraternidad Lima',                               'fraternidad', 'FRAT-DEQT', 'Perú'),
  ('FRAT-MCAF', 'Fraternidad María de Cafarnaúm (Arequipa)',      'fraternidad', 'FRAT-DEQT', 'Perú'),
  ('FRAT-CHIC', 'Fraternidad Chicago',                            'fraternidad', 'FRAT-DEQT', 'Estados Unidos'),
  ('FRAT-HAMB', 'Fraternidad Hamburgo',                           'fraternidad', 'FRAT-DEQT', 'Alemania'),
  ('FRAT-EPEN', 'Fraternidad España-Península',                   'fraternidad', 'FRAT-DEQT', 'España'),
  ('FRAT-ICAN', 'Fraternidad Islas Canarias',                     'fraternidad', 'FRAT-DEQT', 'España'),
  ('FRAT-MM',   'Congregación de Marta y María',                  'fraternidad', 'FRAT-DEQT', 'Argentina'),
  ('FRAT-CALIF','Fraternidad USA - California',                   'fraternidad', 'FRAT-DEQT', 'Estados Unidos'),
  ('FRAT-MIAM', 'Fraternidad USA - Miami',                        'fraternidad', 'FRAT-DEQT', 'Estados Unidos'),
  ('FRAT-CAT',  'Fraternidad Catamarca',                          'fraternidad', 'FRAT-DEQT', 'Argentina'),
  ('FRAT-ITA',  'Fraternidad Italia',                             'fraternidad', 'FRAT-DEQT', 'Italia');

-- ─── 4. Upsert canonical rows (idempotent by codigo) ──────────────────────────
INSERT INTO public.organizaciones (codigo, nombre, tipo, pais, estado)
SELECT codigo, nombre, tipo, pais, 'activa'
  FROM _staging_org
ON CONFLICT (codigo) WHERE codigo IS NOT NULL DO UPDATE
  SET nombre     = EXCLUDED.nombre,
      tipo       = EXCLUDED.tipo,
      pais       = EXCLUDED.pais,
      estado     = 'activa',
      fecha_baja = NULL,
      updated_at = now();

-- ─── 5. Resolve parent_id via self-join on codigo ─────────────────────────────
UPDATE public.organizaciones o
  SET parent_id = p.id,
      updated_at = now()
  FROM _staging_org s
  JOIN public.organizaciones p ON p.codigo = s.parent_codigo
  WHERE o.codigo = s.codigo
    AND s.parent_codigo IS NOT NULL;

COMMIT;

-- ─── Verification (run separately after commit) ───────────────────────────────
-- SELECT tipo, estado, count(*) FROM public.organizaciones GROUP BY tipo, estado ORDER BY tipo, estado;
-- SELECT codigo, nombre FROM public.organizaciones
--   WHERE estado='activa' AND tipo='fraternidad' AND parent_id IS NULL;   -- expect 0 rows
-- SELECT codigo, nombre, pais FROM public.organizaciones WHERE pais <> 'Argentina' ORDER BY pais;
