-- Migración para corregir nombres de campos en plantillas existentes
-- Convierte los labels en nombres usando guiones bajos (_) como separadores

-- Función para generar un nombre de campo a partir de un label
CREATE OR REPLACE FUNCTION generate_field_name_from_label(p_label TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    -- Convertir a minúsculas, remover caracteres especiales, reemplazar espacios con guiones bajos
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRIM(p_label), 
                '[^a-z0-9\s]', '', 'g'
            ), 
            '\s+', '_', 'g'
        )
    );
END;
$$;

-- Procedimiento para corregir nombres de campos en todas las plantillas
CREATE OR REPLACE PROCEDURE fix_plantilla_field_names() LANGUAGE plpgsql AS $$
DECLARE
    plantilla_record RECORD;
    section_data JSONB;
    field_data JSONB;
    new_field_array JSONB;
    used_names TEXT[];
    generated_name TEXT;
    final_name TEXT;
    counter INTEGER;
    i INTEGER;
    j INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando corrección de nombres de campos en plantillas...';
    
    FOR plantilla_record IN
        SELECT id, nombre, estructura_formulario
        FROM plantillas_solicitudes
        WHERE estructura_formulario IS NOT NULL
        AND jsonb_typeof(estructura_formulario -> 'secciones') = 'array'
        AND jsonb_array_length(estructura_formulario -> 'secciones') > 0
    LOOP
        RAISE NOTICE 'Procesando plantilla ID: %, Nombre: %', plantilla_record.id, plantilla_record.nombre;
        
        new_field_array := '[]'::jsonb;
        used_names := ARRAY[]::TEXT[];

        -- Iterar sobre cada sección
        FOR i IN 0 .. jsonb_array_length(plantilla_record.estructura_formulario -> 'secciones') - 1 LOOP
            section_data := plantilla_record.estructura_formulario -> 'secciones' -> i;
            
            IF jsonb_typeof(section_data -> 'campos') = 'array' THEN
                DECLARE
                    new_campos_array JSONB := '[]'::jsonb;
                BEGIN
                    -- Iterar sobre cada campo dentro de la sección
                    FOR j IN 0 .. jsonb_array_length(section_data -> 'campos') - 1 LOOP
                        field_data := section_data -> 'campos' -> j;
                        
                        -- Obtener el label del campo
                        IF field_data ? 'label' AND field_data ->> 'label' IS NOT NULL AND field_data ->> 'label' != '' THEN
                            -- Generar nombre basado en el label
                            generated_name := generate_field_name_from_label(field_data ->> 'label');
                            
                            -- Si el nombre generado está vacío, usar un nombre por defecto
                            IF generated_name = '' THEN
                                generated_name := 'campo_' || (j + 1);
                            END IF;
                            
                            -- Verificar si el nombre ya está en uso y hacerlo único
                            final_name := generated_name;
                            counter := 1;
                            WHILE final_name = ANY(used_names) LOOP
                                final_name := generated_name || '_' || counter;
                                counter := counter + 1;
                            END LOOP;
                            
                            used_names := array_append(used_names, final_name);
                            
                            -- Actualizar el campo con el nuevo nombre
                            field_data := jsonb_set(field_data, '{nombre}', TO_JSONB(final_name), TRUE);
                            
                            RAISE NOTICE 'Campo "%" -> nombre: "%"', field_data ->> 'label', final_name;
                        ELSE
                            -- Si no hay label, generar un nombre por defecto
                            final_name := 'campo_' || (j + 1);
                            counter := 1;
                            WHILE final_name = ANY(used_names) LOOP
                                final_name := 'campo_' || (j + 1) || '_' || counter;
                                counter := counter + 1;
                            END LOOP;
                            
                            used_names := array_append(used_names, final_name);
                            field_data := jsonb_set(field_data, '{nombre}', TO_JSONB(final_name), TRUE);
                            
                            RAISE NOTICE 'Campo sin label -> nombre: "%"', final_name;
                        END IF;
                        
                        -- Agregar el campo actualizado al array
                        new_campos_array := jsonb_insert(new_campos_array, '{' || j || '}', field_data);
                    END LOOP;
                    
                    -- Actualizar la sección con los campos corregidos
                    section_data := jsonb_set(section_data, '{campos}', new_campos_array, TRUE);
                END;
            END IF;
            
            -- Agregar la sección actualizada al array
            new_field_array := jsonb_insert(new_field_array, '{' || i || '}', section_data);
        END LOOP;

        -- Actualizar la plantilla en la base de datos
        UPDATE plantillas_solicitudes
        SET estructura_formulario = jsonb_set(plantilla_record.estructura_formulario, '{secciones}', new_field_array, TRUE),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = plantilla_record.id;

        RAISE NOTICE 'Plantilla % corregida exitosamente', plantilla_record.id;
    END LOOP;

    RAISE NOTICE 'Corrección de nombres de campos completada exitosamente';
END;
$$;

-- Ejecutar el procedimiento
CALL fix_plantilla_field_names();

-- Limpiar las funciones temporales
DROP PROCEDURE IF EXISTS fix_plantilla_field_names();
DROP FUNCTION IF EXISTS generate_field_name_from_label(TEXT);
