-- Script para corregir nombres duplicados en plantillas existentes
-- Este script actualiza automáticamente los nombres de campos duplicados en las plantillas

-- Función para generar nombres únicos basados en labels
CREATE OR REPLACE FUNCTION fix_duplicate_field_names()
RETURNS void AS $$
DECLARE
    plantilla_record RECORD;
    section_data JSONB;
    field_data JSONB;
    field_array JSONB;
    new_field_array JSONB;
    used_names TEXT[];
    field_name TEXT;
    base_name TEXT;
    counter INTEGER;
    final_name TEXT;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Iterar sobre todas las plantillas
    FOR plantilla_record IN 
        SELECT id, estructura_formulario 
        FROM plantillas_solicitudes 
        WHERE estructura_formulario IS NOT NULL 
        AND jsonb_array_length(estructura_formulario) > 0
    LOOP
        new_field_array := '[]'::jsonb;
        used_names := ARRAY[]::TEXT[];
        
        -- Iterar sobre cada sección
        FOR i IN 0..jsonb_array_length(plantilla_record.estructura_formulario) - 1 LOOP
            section_data := plantilla_record.estructura_formulario->i;
            
            -- Verificar si la sección tiene campos
            IF section_data ? 'campos' AND jsonb_array_length(section_data->'campos') > 0 THEN
                field_array := section_data->'campos';
                
                -- Iterar sobre cada campo en la sección
                FOR j IN 0..jsonb_array_length(field_array) - 1 LOOP
                    field_data := field_array->j;
                    
                    -- Obtener el nombre actual del campo
                    field_name := COALESCE(field_data->>'nombre', field_data->>'name', '');
                    
                    -- Si no tiene nombre, generarlo del label
                    IF field_name = '' OR field_name IS NULL THEN
                        base_name := COALESCE(field_data->>'label', 'campo_sin_nombre');
                        -- Limpiar y normalizar el nombre
                        base_name := lower(regexp_replace(base_name, '[^a-z0-9\s]', '', 'g'));
                        base_name := regexp_replace(base_name, '\s+', '_', 'g');
                        base_name := regexp_replace(base_name, '_+', '_', 'g');
                        base_name := regexp_replace(base_name, '^_|_$', '', 'g');
                    ELSE
                        base_name := field_name;
                    END IF;
                    
                    -- Generar nombre único
                    final_name := base_name;
                    counter := 1;
                    
                    WHILE final_name = ANY(used_names) LOOP
                        final_name := base_name || '_' || counter;
                        counter := counter + 1;
                    END LOOP;
                    
                    -- Agregar el nombre a la lista de usados
                    used_names := array_append(used_names, final_name);
                    
                    -- Actualizar el campo con el nuevo nombre
                    field_data := jsonb_set(field_data, '{nombre}', to_jsonb(final_name));
                    
                    -- Agregar el campo actualizado al array
                    new_field_array := new_field_array || jsonb_build_array(field_data);
                END LOOP;
                
                -- Actualizar la sección con los campos corregidos
                section_data := jsonb_set(section_data, '{campos}', new_field_array);
                plantilla_record.estructura_formulario := jsonb_set(
                    plantilla_record.estructura_formulario, 
                    ARRAY[i::text], 
                    section_data
                );
            END IF;
        END LOOP;
        
        -- Actualizar la plantilla en la base de datos
        UPDATE plantillas_solicitudes 
        SET estructura_formulario = plantilla_record.estructura_formulario,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = plantilla_record.id;
        
        RAISE NOTICE 'Plantilla % corregida exitosamente', plantilla_record.id;
    END LOOP;
    
    RAISE NOTICE 'Corrección de nombres duplicados completada';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función
SELECT fix_duplicate_field_names();

-- Limpiar la función temporal
DROP FUNCTION fix_duplicate_field_names();
