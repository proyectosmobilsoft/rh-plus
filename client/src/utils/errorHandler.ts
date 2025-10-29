/**
 * Utilidad para manejo de errores con mensajes específicos
 */

export interface ErrorWithCode {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Obtiene un mensaje de error específico basado en el tipo de error
 */
export function getErrorMessage(error: unknown, context?: string): string {
  // Si es un Error estándar, usar su mensaje
  if (error instanceof Error) {
    return error.message;
  }

  // Si es un objeto con propiedades de error de Supabase
  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as ErrorWithCode;
    
    // Manejar errores específicos de Supabase
    switch (errorObj.code) {
      case '23505': // Duplicate key constraint
        const message = errorObj.message || '';
        const hint = errorObj.hint || '';
        const messageLower = message.toLowerCase();
        const hintLower = hint.toLowerCase();
        
        // Errores específicos de ubicaciones - claves primarias duplicadas
        // Este error normalmente indica un problema con la secuencia de la base de datos o un ID duplicado
        if (messageLower.includes('ciudades_pkey') || hintLower.includes('ciudades_pkey') || 
            messageLower.includes('unique constraint') && messageLower.includes('ciudades_pkey') ||
            messageLower.includes('duplicate key') && messageLower.includes('ciudades')) {
          return 'Error al crear la ciudad: Ya existe una ciudad con este identificador. Esto generalmente ocurre por un problema con la secuencia de la base de datos. Por favor, contacte al administrador del sistema para revisar la base de datos.';
        }
        if (messageLower.includes('paises_pkey') || hintLower.includes('paises_pkey') ||
            (messageLower.includes('unique constraint') && messageLower.includes('paises_pkey')) ||
            (messageLower.includes('duplicate key') && messageLower.includes('pais'))) {
          return 'Error al crear el país: Ya existe un país con este identificador. Esto generalmente ocurre por un problema con la secuencia de la base de datos. Por favor, contacte al administrador del sistema.';
        }
        if (messageLower.includes('departamentos_pkey') || hintLower.includes('departamentos_pkey') ||
            (messageLower.includes('unique constraint') && messageLower.includes('departamentos_pkey')) ||
            (messageLower.includes('duplicate key') && messageLower.includes('departamento'))) {
          return 'Error al crear el departamento: Ya existe un departamento con este identificador. Esto generalmente ocurre por un problema con la secuencia de la base de datos. Por favor, contacte al administrador del sistema.';
        }
        if (messageLower.includes('regionales_pkey') || hintLower.includes('regionales_pkey') ||
            (messageLower.includes('unique constraint') && messageLower.includes('regionales_pkey')) ||
            (messageLower.includes('duplicate key') && messageLower.includes('regional'))) {
          return 'Error al crear la regional: Ya existe una regional con este identificador. Esto generalmente ocurre por un problema con la secuencia de la base de datos. Por favor, contacte al administrador del sistema.';
        }
        if (messageLower.includes('sucursales_pkey') || hintLower.includes('sucursales_pkey') ||
            (messageLower.includes('unique constraint') && messageLower.includes('sucursales_pkey')) ||
            (messageLower.includes('duplicate key') && messageLower.includes('sucursal'))) {
          return 'Error al crear la sucursal: Ya existe una sucursal con este identificador. Esto generalmente ocurre por un problema con la secuencia de la base de datos. Por favor, contacte al administrador del sistema.';
        }
        
        // Errores de restricciones únicas por nombre
        if (message.includes('ciudades_nombre_key') || hint.includes('ciudades_nombre_key') || 
            message.includes('unique constraint "ciudades_nombre') || hint.includes('unique constraint "ciudades_nombre')) {
          return 'Ya existe una ciudad con este nombre en el mismo departamento. Por favor, use un nombre diferente.';
        }
        if (message.includes('paises_nombre_key') || hint.includes('paises_nombre_key') ||
            message.includes('unique constraint "paises_nombre') || hint.includes('unique constraint "paises_nombre')) {
          return 'Ya existe un país con este nombre. Por favor, use un nombre diferente.';
        }
        if (message.includes('departamentos_nombre_key') || hint.includes('departamentos_nombre_key') ||
            message.includes('unique constraint "departamentos_nombre') || hint.includes('unique constraint "departamentos_nombre')) {
          return 'Ya existe un departamento con este nombre en el mismo país. Por favor, use un nombre diferente.';
        }
        if (message.includes('regionales_nombre_key') || hint.includes('regionales_nombre_key') ||
            message.includes('unique constraint "regionales_nombre') || hint.includes('unique constraint "regionales_nombre')) {
          return 'Ya existe una regional con este nombre. Por favor, use un nombre diferente.';
        }
        if (message.includes('sucursales_nombre_key') || hint.includes('sucursales_nombre_key') ||
            message.includes('unique constraint "sucursales_nombre') || hint.includes('unique constraint "sucursales_nombre')) {
          return 'Ya existe una sucursal con este nombre en la misma empresa. Por favor, use un nombre diferente.';
        }
        
        // Errores de código único
        if (message.includes('codigo_key') || hint.includes('codigo_key')) {
          return 'Ya existe un registro con este código. Por favor, use un código diferente.';
        }
        if (message.includes('email_key') || hint.includes('email_key')) {
          return 'Ya existe un registro con este email. Por favor, use un email diferente.';
        }
        if (message.includes('nit_key') || hint.includes('nit_key')) {
          return 'Ya existe una empresa con este NIT. Por favor, verifique el NIT ingresado.';
        }
        
        // Mensaje genérico para claves duplicadas
        if (context) {
          return `Ya existe un registro con estos datos para ${context}. Por favor, verifique la información ingresada.`;
        }
        return 'Ya existe un registro con estos datos. Por favor, verifique la información ingresada.';
      
      case '23503': // Foreign key constraint
        if (message.includes('foreign key constraint') || hint) {
          const hintMsg = hint || message;
          if (hintMsg.includes('departamento')) {
            return 'No se puede realizar esta acción porque hay departamentos relacionados.';
          }
          if (hintMsg.includes('ciudad')) {
            return 'No se puede realizar esta acción porque hay ciudades relacionadas.';
          }
          if (hintMsg.includes('sucursal')) {
            return 'No se puede realizar esta acción porque hay sucursales relacionadas.';
          }
        }
        return 'No se puede realizar esta acción porque hay registros relacionados.';
      
      case '23502': // Not null constraint
        if (message.includes('not null constraint')) {
          const fieldMatch = message.match(/column "([^"]+)"/);
          if (fieldMatch) {
            const field = fieldMatch[1];
            return `El campo "${field}" es obligatorio. Por favor, complete este campo.`;
          }
        }
        return 'Faltan campos obligatorios. Por favor, complete todos los campos requeridos.';
      
      case '23514': // Check constraint
        return 'Los datos ingresados no cumplen con las reglas de validación.';
      
      case '42P01': // Undefined table
        return 'Error de configuración del sistema. Contacte al administrador.';
      
      case '42501': // Insufficient privilege
        return 'No tiene permisos para realizar esta acción.';
      
      default:
        // Si el mensaje es muy técnico, intentar extraer información útil
        if (message.includes('duplicate key value violates')) {
          return 'Ya existe un registro con estos datos. Por favor, verifique la información ingresada.';
        }
        return errorObj.message || 'Ha ocurrido un error inesperado.';
    }
  }

  // Si es un string, devolverlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Mensaje por defecto
  return 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
}

/**
 * Maneja errores de servicios y retorna mensajes específicos
 */
export function handleServiceError(error: unknown, defaultMessage: string = 'Error al procesar la solicitud', context?: string): string {
  const message = getErrorMessage(error, context);
  
  // El mensaje ya está procesado y es más descriptivo, así que lo devolvemos directamente
  return message || defaultMessage;
}

/**
 * Logs de error para debugging
 */
export function logError(context: string, error: unknown): void {
  console.error(`❌ Error en ${context}:`, error);
  
  if (error && typeof error === 'object' && 'code' in error) {
    const errorObj = error as ErrorWithCode;
    console.error(`   Código: ${errorObj.code}`);
    console.error(`   Mensaje: ${errorObj.message}`);
    if (errorObj.details) console.error(`   Detalles: ${errorObj.details}`);
    if (errorObj.hint) console.error(`   Sugerencia: ${errorObj.hint}`);
  }
}
