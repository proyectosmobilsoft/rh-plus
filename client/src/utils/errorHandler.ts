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
export function getErrorMessage(error: unknown): string {
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
        if (errorObj.message.includes('codigo_key')) {
          return 'Ya existe un registro con este código. Por favor, use un código diferente.';
        }
        if (errorObj.message.includes('email_key')) {
          return 'Ya existe un registro con este email. Por favor, use un email diferente.';
        }
        if (errorObj.message.includes('nit_key')) {
          return 'Ya existe una empresa con este NIT. Por favor, verifique el NIT ingresado.';
        }
        return 'Ya existe un registro con estos datos. Por favor, verifique la información ingresada.';
      
      case '23503': // Foreign key constraint
        return 'No se puede realizar esta acción porque hay registros relacionados.';
      
      case '23502': // Not null constraint
        return 'Faltan campos obligatorios. Por favor, complete todos los campos requeridos.';
      
      case '23514': // Check constraint
        return 'Los datos ingresados no cumplen con las reglas de validación.';
      
      case '42P01': // Undefined table
        return 'Error de configuración del sistema. Contacte al administrador.';
      
      case '42501': // Insufficient privilege
        return 'No tiene permisos para realizar esta acción.';
      
      default:
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
export function handleServiceError(error: unknown, defaultMessage: string = 'Error al procesar la solicitud'): string {
  const message = getErrorMessage(error);
  
  // Si el mensaje es muy técnico o genérico, usar el mensaje por defecto
  if (message.includes('duplicate key value violates') || 
      message.includes('violates unique constraint') ||
      message.includes('violates foreign key constraint')) {
    return defaultMessage;
  }
  
  return message;
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
