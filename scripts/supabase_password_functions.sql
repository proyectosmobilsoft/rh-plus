-- Funciones para manejo de contraseñas en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para generar hash de contraseña usando bcrypt
CREATE OR REPLACE FUNCTION hash_password(password_to_hash TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password_to_hash, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar contraseña
CREATE OR REPLACE FUNCTION check_password(password_to_check TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Si el hash almacenado es bcrypt (comienza con $2b$)
  IF stored_hash LIKE '$2b$%' THEN
    RETURN crypt(password_to_check, stored_hash) = stored_hash;
  -- Si es un hash legacy (base64), comparar directamente
  ELSE
    RETURN encode(password_to_check::bytea, 'base64') = stored_hash;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar contraseña de usuario
CREATE OR REPLACE FUNCTION update_user_password(user_id INTEGER, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  password_hash TEXT;
BEGIN
  -- Generar hash de la nueva contraseña
  password_hash := hash_password(new_password);
  
  -- Actualizar en la tabla gen_usuarios
  UPDATE gen_usuarios 
  SET password_hash = password_hash, updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar credenciales completas de usuario
CREATE OR REPLACE FUNCTION verify_user_credentials(username_input TEXT, password_input TEXT)
RETURNS TABLE(
  user_id INTEGER,
  is_valid BOOLEAN,
  user_data JSON
) AS $$
DECLARE
  user_record RECORD;
  password_valid BOOLEAN;
BEGIN
  -- Buscar usuario por username o email
  SELECT id, username, email, password_hash, activo, primer_nombre, primer_apellido
  INTO user_record
  FROM gen_usuarios
  WHERE username = username_input OR email = username_input;
  
  -- Si no se encuentra el usuario
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, NULL::JSON;
    RETURN;
  END IF;
  
  -- Verificar contraseña
  password_valid := check_password(password_input, user_record.password_hash);
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    user_record.id,
    password_valid AND user_record.activo,
    json_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'email', user_record.email,
      'primer_nombre', user_record.primer_nombre,
      'primer_apellido', user_record.primer_apellido,
      'activo', user_record.activo
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para migrar contraseñas legacy a bcrypt
CREATE OR REPLACE FUNCTION migrate_legacy_passwords()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  updated_count INTEGER := 0;
  new_hash TEXT;
BEGIN
  -- Buscar usuarios con contraseñas que no son bcrypt
  FOR user_record IN 
    SELECT id, username, password_hash
    FROM gen_usuarios 
    WHERE password_hash IS NOT NULL 
    AND password_hash NOT LIKE '$2b$%'
    AND password_hash != ''
  LOOP
    -- Intentar decodificar la contraseña base64 para obtener la original
    -- NOTA: Esto solo funciona si las contraseñas legacy están en base64
    BEGIN
      -- Por seguridad, establecer una contraseña por defecto
      -- En producción, deberías forzar a los usuarios a resetear sus contraseñas
      new_hash := hash_password('temp123'); -- Contraseña temporal
      
      UPDATE gen_usuarios 
      SET password_hash = new_hash, updated_at = NOW()
      WHERE id = user_record.id;
      
      updated_count := updated_count + 1;
      
      RAISE NOTICE 'Usuario % actualizado con contraseña temporal', user_record.username;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error actualizando usuario %: %', user_record.username, SQLERRM;
    END;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios sobre las funciones
COMMENT ON FUNCTION hash_password(TEXT) IS 'Genera un hash bcrypt para la contraseña proporcionada';
COMMENT ON FUNCTION check_password(TEXT, TEXT) IS 'Verifica si una contraseña coincide con el hash almacenado (soporta bcrypt y legacy)';
COMMENT ON FUNCTION update_user_password(INTEGER, TEXT) IS 'Actualiza la contraseña de un usuario específico';
COMMENT ON FUNCTION verify_user_credentials(TEXT, TEXT) IS 'Verifica las credenciales completas de un usuario';
COMMENT ON FUNCTION migrate_legacy_passwords() IS 'Migra contraseñas legacy a bcrypt (establece contraseña temporal)';

-- Crear un usuario admin por defecto si no existe
DO $$
DECLARE
  admin_exists BOOLEAN;
  admin_hash TEXT;
BEGIN
  -- Verificar si ya existe un usuario admin
  SELECT EXISTS(SELECT 1 FROM gen_usuarios WHERE username = 'admin') INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Crear hash para contraseña admin123
    admin_hash := hash_password('admin123');
    
    -- Insertar usuario admin
    INSERT INTO gen_usuarios (
      username, 
      email, 
      password_hash, 
      primer_nombre, 
      primer_apellido, 
      activo,
      rol_id
    ) VALUES (
      'admin',
      'admin@sistema.com',
      admin_hash,
      'Administrador',
      'Sistema',
      true,
      1 -- Asumiendo que rol_id 1 es administrador
    );
    
    RAISE NOTICE 'Usuario admin creado con contraseña: admin123';
  ELSE
    RAISE NOTICE 'Usuario admin ya existe';
  END IF;
END $$;
