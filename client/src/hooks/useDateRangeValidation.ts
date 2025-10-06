import { useMemo } from 'react';
import { DateRange } from '@/components/ui/DateRangePicker';
import { isAfter, isBefore, differenceInDays } from 'date-fns';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UseDateRangeValidationOptions {
  maxRangeDays?: number;
  minRangeDays?: number;
  maxDate?: Date;
  minDate?: Date;
  allowSameDay?: boolean;
  allowFutureDates?: boolean;
}

export function useDateRangeValidation(
  dateRange: DateRange,
  options: UseDateRangeValidationOptions = {}
): ValidationResult {
  const {
    maxRangeDays = 365,
    minRangeDays = 1,
    maxDate,
    minDate,
    allowSameDay = true,
    allowFutureDates = true
  } = options;

  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar si hay fechas seleccionadas
    if (!dateRange.from || !dateRange.to) {
      return {
        isValid: true, // Permitir selección parcial
        errors: [],
        warnings: []
      };
    }

    // Verificar que la fecha inicial no sea posterior a la final
    if (isAfter(dateRange.from, dateRange.to)) {
      errors.push('La fecha inicial no puede ser posterior a la fecha final');
    }

    // Verificar rango mínimo
    const daysDifference = differenceInDays(dateRange.to, dateRange.from);
    if (!allowSameDay && daysDifference < minRangeDays) {
      errors.push(`El rango debe ser de al menos ${minRangeDays} días`);
    }

    // Verificar rango máximo
    if (daysDifference > maxRangeDays) {
      errors.push(`El rango no puede ser mayor a ${maxRangeDays} días`);
    }

    // Verificar fecha máxima
    if (maxDate && (isAfter(dateRange.from, maxDate) || isAfter(dateRange.to, maxDate))) {
      errors.push(`Las fechas no pueden ser posteriores a ${maxDate.toLocaleDateString()}`);
    }

    // Verificar fecha mínima
    if (minDate && (isBefore(dateRange.from, minDate) || isBefore(dateRange.to, minDate))) {
      errors.push(`Las fechas no pueden ser anteriores a ${minDate.toLocaleDateString()}`);
    }

    // Verificar fechas futuras
    if (!allowFutureDates) {
      const today = new Date();
      if (isAfter(dateRange.from, today) || isAfter(dateRange.to, today)) {
        errors.push('No se permiten fechas futuras');
      }
    }

    // Advertencias
    if (daysDifference > 90) {
      warnings.push('Rango de fechas muy amplio, esto puede afectar el rendimiento');
    }

    if (daysDifference === 0 && !allowSameDay) {
      warnings.push('Selecciona un rango de al menos un día');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [dateRange, maxRangeDays, minRangeDays, maxDate, minDate, allowSameDay, allowFutureDates]);
}

export default useDateRangeValidation;

