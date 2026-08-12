-- Migration 056: Limpiar el email interno falso (@ccd.internal) de personas.email
--
-- Contexto: el login por usuario necesita un email interno en auth.users
-- (Supabase Auth lo exige) con el patrón `usuario@ccd.internal`. Ese email es
-- SOLO plomería del login y NO debe aparecer como email real de la persona.
-- El trigger handle_new_user (004) lo copiaba a personas.email vía
-- `email = COALESCE(email, NEW.email)`, ensuciando el dato real.
--
-- Este script:
--   1. Borra de personas.email todos los `%@ccd.internal` (vuelven a NULL).
--   2. Corrige el trigger para que NUNCA vuelva a copiar ese email interno.
--
-- El login sigue funcionando: el email interno queda en auth.users (invisible),
-- pero ya no se guarda como email de la persona.

BEGIN;

-- ─── 1. Limpiar los emails internos falsos ────────────────────────────────────
UPDATE public.personas
  SET email = NULL,
      updated_at = now()
  WHERE email LIKE '%@ccd.internal';

-- ─── 2. Arreglar el trigger: nunca copiar el email interno a personas.email ────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id      UUID;
  v_rol_sistema_id  UUID;
  v_rol_legacy_id   UUID;
  -- email real: NULL si es el interno @ccd.internal
  v_email_real      TEXT := CASE WHEN NEW.email LIKE '%@ccd.internal' THEN NULL ELSE NEW.email END;
BEGIN
  v_persona_id := (NEW.raw_user_meta_data ->> 'persona_id')::UUID;

  IF v_persona_id IS NOT NULL THEN
    -- Persona ya existe — solo enlazar auth_user_id (sin pisar/inventar email)
    UPDATE public.personas
      SET auth_user_id = NEW.id,
          email        = COALESCE(email, v_email_real)
    WHERE id = v_persona_id;
  ELSE
    -- Buscar persona por email real
    IF v_email_real IS NOT NULL THEN
      SELECT id INTO v_persona_id
      FROM public.personas
      WHERE email = v_email_real
      LIMIT 1;
    END IF;

    IF v_persona_id IS NOT NULL THEN
      UPDATE public.personas
        SET auth_user_id = NEW.id
      WHERE id = v_persona_id;
    ELSE
      -- No existe — crear persona nueva (email real o NULL, nunca @ccd.internal)
      INSERT INTO public.personas (auth_user_id, nombre, apellido, email, fecha_alta)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        v_email_real,
        CURRENT_DATE
      )
      ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id
      RETURNING id INTO v_persona_id;
    END IF;
  END IF;

  IF v_persona_id IS NOT NULL THEN
    INSERT INTO public.perfiles_usuario (id, persona_id, estado)
    VALUES (NEW.id, v_persona_id, 'activo')
    ON CONFLICT (id) DO NOTHING;

    SELECT id INTO v_rol_sistema_id
    FROM public.roles_sistema WHERE nombre = 'solo_lectura' LIMIT 1;

    IF v_rol_sistema_id IS NOT NULL THEN
      INSERT INTO public.usuario_roles (usuario_id, rol_sistema_id)
      VALUES (NEW.id, v_rol_sistema_id)
      ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO v_rol_legacy_id
    FROM public.roles WHERE nombre = 'solo_lectura' LIMIT 1;

    IF v_rol_legacy_id IS NOT NULL THEN
      INSERT INTO public.persona_roles (persona_id, rol_id)
      VALUES (v_persona_id, v_rol_legacy_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;

-- Verificación: no debe quedar ningún email @ccd.internal en personas
-- SELECT count(*) FROM public.personas WHERE email LIKE '%@ccd.internal';   -- 0
