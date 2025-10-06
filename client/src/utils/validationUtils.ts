/**
 * Utilidades para validación y normalización de datos
 */

/**
 * Normaliza el tipo de documento para manejar variaciones comunes
 * @param tipoDocumento - Tipo de documento a normalizar
 * @returns Tipo de documento normalizado
 */
export function normalizeTipoDocumento(tipoDocumento: string): string {
  if (!tipoDocumento) return '';
  
  const normalized = tipoDocumento.toLowerCase().trim();
  
  // Mapeo de variaciones comunes
  const tipoMap: Record<string, string> = {
    'cedulaciudadania': 'CC',
    'cedula_ciudadania': 'CC',
    'cedula ciudadania': 'CC',
    'ceduladeciudadania': 'CC',
    'cedula_de_ciudadania': 'CC',
    'cedula de ciudadania': 'CC',
    'cedulaciudadanía': 'CC',
    'cedula_ciudadanía': 'CC',
    'cedula ciudadanía': 'CC',
    'ceduladeciudadanía': 'CC',
    'cedula_de_ciudadanía': 'CC',
    'cedula de ciudadanía': 'CC',
    'cedulaextranjeria': 'CE',
    'cedula_extranjeria': 'CE',
    'cedula extranjeria': 'CE',
    'ceduladeextranjeria': 'CE',
    'cedula_de_extranjeria': 'CE',
    'cedula de extranjeria': 'CE',
    'cedulaextranjería': 'CE',
    'cedula_extranjería': 'CE',
    'cedula extranjería': 'CE',
    'ceduladeextranjería': 'CE',
    'cedula_de_extranjería': 'CE',
    'cedula de extranjería': 'CE',
    'tarjetadeidentidad': 'TI',
    'tarjeta_de_identidad': 'TI',
    'tarjeta de identidad': 'TI',
    'pasaporte': 'PP',
    'nit': 'NIT',
    'cc': 'CC',
    'ce': 'CE',
    'ti': 'TI',
    'pp': 'PP'
  };
  
  return tipoMap[normalized] || tipoDocumento.toUpperCase();
}

/**
 * Normaliza campos que pueden venir pegados sin la raya al piso (_)
 * @param campo - Campo a normalizar
 * @returns Campo normalizado
 */
export function normalizeCampo(campo: string): string {
  if (!campo) return '';
  
  // Patrones comunes que necesitan separación
  const patrones = [
    { regex: /([a-z])([A-Z])/g, replacement: '$1_$2' }, // camelCase a snake_case
    { regex: /([a-z])([0-9])/g, replacement: '$1_$2' }, // letra seguida de número
    { regex: /([0-9])([a-z])/g, replacement: '$1_$2' }, // número seguido de letra
    { regex: /([a-z])([A-Z])([a-z])/g, replacement: '$1_$2_$3' }, // patrones más complejos
  ];
  
  let normalized = campo;
  
  // Aplicar patrones de normalización
  patrones.forEach(patron => {
    normalized = normalized.replace(patron.regex, patron.replacement);
  });
  
  return normalized.toLowerCase();
}

/**
 * Valida y normaliza el número de documento
 * @param numeroDocumento - Número de documento a validar
 * @returns Objeto con el número normalizado y si es válido
 */
export function validateNumeroDocumento(numeroDocumento: string): {
  numero: string;
  isValid: boolean;
  error?: string;
} {
  if (!numeroDocumento) {
    return { numero: '', isValid: false, error: 'Número de documento requerido' };
  }
  
  // Limpiar el número de documento
  const numeroLimpio = numeroDocumento.replace(/[^0-9]/g, '');
  
  if (numeroLimpio.length < 6) {
    return { 
      numero: numeroLimpio, 
      isValid: false, 
      error: 'El número de documento debe tener al menos 6 dígitos' 
    };
  }
  
  if (numeroLimpio.length > 15) {
    return { 
      numero: numeroLimpio, 
      isValid: false, 
      error: 'El número de documento no puede tener más de 15 dígitos' 
    };
  }
  
  return { numero: numeroLimpio, isValid: true };
}

/**
 * Valida y normaliza el tipo de documento
 * @param tipoDocumento - Tipo de documento a validar
 * @returns Objeto con el tipo normalizado y si es válido
 */
export function validateTipoDocumento(tipoDocumento: string): {
  tipo: string;
  isValid: boolean;
  error?: string;
} {
  if (!tipoDocumento) {
    return { tipo: '', isValid: false, error: 'Tipo de documento requerido' };
  }
  
  const tipoNormalizado = normalizeTipoDocumento(tipoDocumento);
  
  const tiposValidos = ['CC', 'CE', 'TI', 'NIT', 'PP'];
  
  if (!tiposValidos.includes(tipoNormalizado)) {
    return { 
      tipo: tipoNormalizado, 
      isValid: false, 
      error: `Tipo de documento inválido. Tipos válidos: ${tiposValidos.join(', ')}` 
    };
  }
  
  return { tipo: tipoNormalizado, isValid: true };
}

/**
 * Valida y normaliza un campo de texto
 * @param campo - Campo a validar
 * @param nombreCampo - Nombre del campo para mensajes de error
 * @param minLength - Longitud mínima requerida
 * @param maxLength - Longitud máxima permitida
 * @returns Objeto con el campo normalizado y si es válido
 */
export function validateTextField(
  campo: string, 
  nombreCampo: string, 
  minLength: number = 2, 
  maxLength: number = 100
): {
  valor: string;
  isValid: boolean;
  error?: string;
} {
  if (!campo) {
    return { valor: '', isValid: false, error: `${nombreCampo} es requerido` };
  }
  
  const valorNormalizado = campo.trim();
  
  if (valorNormalizado.length < minLength) {
    return { 
      valor: valorNormalizado, 
      isValid: false, 
      error: `${nombreCampo} debe tener al menos ${minLength} caracteres` 
    };
  }
  
  if (valorNormalizado.length > maxLength) {
    return { 
      valor: valorNormalizado, 
      isValid: false, 
      error: `${nombreCampo} no puede tener más de ${maxLength} caracteres` 
    };
  }
  
  return { valor: valorNormalizado, isValid: true };
}

/**
 * Valida y normaliza un email
 * @param email - Email a validar
 * @returns Objeto con el email normalizado y si es válido
 */
export function validateEmail(email: string): {
  email: string;
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return { email: '', isValid: false, error: 'Email es requerido' };
  }
  
  const emailNormalizado = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(emailNormalizado)) {
    return { 
      email: emailNormalizado, 
      isValid: false, 
      error: 'Formato de email inválido' 
    };
  }
  
  return { email: emailNormalizado, isValid: true };
}

/**
 * Valida y normaliza los datos de una solicitud
 * @param datos - Datos de la solicitud a validar
 * @returns Objeto con los datos normalizados y errores
 */
export function validateSolicitudData(datos: any): {
  datos: any;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const datosNormalizados = { ...datos };
  
  // Validar tipo de documento
  if (datos.tipo_documento) {
    const tipoValidation = validateTipoDocumento(datos.tipo_documento);
    if (tipoValidation.isValid) {
      datosNormalizados.tipo_documento = tipoValidation.tipo;
    } else {
      errors.push(tipoValidation.error || 'Error en tipo de documento');
    }
  }
  
  // Validar número de documento
  if (datos.numero_documento) {
    const numeroValidation = validateNumeroDocumento(datos.numero_documento);
    if (numeroValidation.isValid) {
      datosNormalizados.numero_documento = numeroValidation.numero;
    } else {
      errors.push(numeroValidation.error || 'Error en número de documento');
    }
  }
  
  // Validar nombres
  if (datos.primer_nombre) {
    const nombreValidation = validateTextField(datos.primer_nombre, 'Primer nombre');
    if (nombreValidation.isValid) {
      datosNormalizados.primer_nombre = nombreValidation.valor;
    } else {
      errors.push(nombreValidation.error || 'Error en primer nombre');
    }
  }
  
  // Validar apellidos
  if (datos.primer_apellido) {
    const apellidoValidation = validateTextField(datos.primer_apellido, 'Primer apellido');
    if (apellidoValidation.isValid) {
      datosNormalizados.primer_apellido = apellidoValidation.valor;
    } else {
      errors.push(apellidoValidation.error || 'Error en primer apellido');
    }
  }
  
  // Validar email
  if (datos.email) {
    const emailValidation = validateEmail(datos.email);
    if (emailValidation.isValid) {
      datosNormalizados.email = emailValidation.email;
    } else {
      errors.push(emailValidation.error || 'Error en email');
    }
  }
  
  return {
    datos: datosNormalizados,
    isValid: errors.length === 0,
    errors
  };
}

