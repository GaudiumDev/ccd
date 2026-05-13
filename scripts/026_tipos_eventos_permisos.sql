-- Migration 026: Permisos para gestión del catálogo de tipos de eventos
-- Se usa categoría 'tipos_eventos' para agruparlos separados de 'eventos'

-- Ampliar el CHECK constraint de la columna categoria
ALTER TABLE public.permisos
  DROP CONSTRAINT IF EXISTS permisos_categoria_check;

ALTER TABLE public.permisos
  ADD CONSTRAINT permisos_categoria_check
  CHECK (categoria IN ('personas', 'organizaciones', 'eventos', 'tipos_eventos', 'roles', 'sistema'));

-- Insertar los 3 nuevos permisos
INSERT INTO public.permisos (clave, nombre, descripcion, categoria) VALUES
  ('tipos_eventos.create', 'Crear tipos de eventos',       'Permite registrar nuevos tipos de eventos en el catálogo', 'tipos_eventos'),
  ('tipos_eventos.update', 'Editar tipos de eventos',      'Permite modificar tipos de eventos existentes',            'tipos_eventos'),
  ('tipos_eventos.delete', 'Dar de baja tipos de eventos', 'Permite desactivar tipos de eventos (soft delete)',        'tipos_eventos')
ON CONFLICT (clave) DO UPDATE SET categoria = EXCLUDED.categoria;
