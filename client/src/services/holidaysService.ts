/**
 * Servicio para manejar días festivos y no hábiles en Colombia
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'fijo' | 'movible' | 'puente';
}

/**
 * Días festivos fijos en Colombia
 */
const FIXED_HOLIDAYS: Omit<Holiday, 'date'>[] = [
  { name: 'Año Nuevo', type: 'fijo' },
  { name: 'Día del Trabajo', type: 'fijo' },
  { name: 'Independencia de Colombia', type: 'fijo' },
  { name: 'Batalla de Boyacá', type: 'fijo' },
  { name: 'Inmaculada Concepción', type: 'fijo' },
  { name: 'Navidad', type: 'fijo' }
];

/**
 * Días festivos móviles en Colombia (basados en Semana Santa)
 */
const MOVABLE_HOLIDAYS: Omit<Holiday, 'date'>[] = [
  { name: 'Jueves Santo', type: 'movible' },
  { name: 'Viernes Santo', type: 'movible' },
  { name: 'Ascensión del Señor', type: 'movible' },
  { name: 'Corpus Christi', type: 'movible' },
  { name: 'Sagrado Corazón de Jesús', type: 'movible' }
];

/**
 * Calcula la fecha de Pascua para un año dado usando el algoritmo de Gauss
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = Math.floor((h + l - 7 * m + 114) / 31);
  const p = (h + l - 7 * m + 114) % 31;
  
  return new Date(year, n - 1, p + 1);
}

/**
 * Calcula los días festivos móviles basados en la fecha de Pascua
 */
function calculateMovableHolidays(year: number): Holiday[] {
  const easter = calculateEaster(year);
  const holidays: Holiday[] = [];
  
  // Jueves Santo (3 días antes de Pascua)
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);
  holidays.push({
    date: holyThursday.toISOString().split('T')[0],
    name: 'Jueves Santo',
    type: 'movible'
  });
  
  // Viernes Santo (2 días antes de Pascua)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({
    date: goodFriday.toISOString().split('T')[0],
    name: 'Viernes Santo',
    type: 'movible'
  });
  
  // Ascensión del Señor (40 días después de Pascua)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 40);
  holidays.push({
    date: ascension.toISOString().split('T')[0],
    name: 'Ascensión del Señor',
    type: 'movible'
  });
  
  // Corpus Christi (60 días después de Pascua)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push({
    date: corpusChristi.toISOString().split('T')[0],
    name: 'Corpus Christi',
    type: 'movible'
  });
  
  // Sagrado Corazón de Jesús (68 días después de Pascua)
  const sacredHeart = new Date(easter);
  sacredHeart.setDate(easter.getDate() + 68);
  holidays.push({
    date: sacredHeart.toISOString().split('T')[0],
    name: 'Sagrado Corazón de Jesús',
    type: 'movible'
  });
  
  return holidays;
}

/**
 * Obtiene todos los días festivos para un año específico
 */
export function getHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // Días festivos fijos
  FIXED_HOLIDAYS.forEach(holiday => {
    let month: number, day: number;
    
    switch (holiday.name) {
      case 'Año Nuevo':
        month = 0; day = 1; break;
      case 'Día del Trabajo':
        month = 4; day = 1; break;
      case 'Independencia de Colombia':
        month = 6; day = 20; break;
      case 'Batalla de Boyacá':
        month = 7; day = 7; break;
      case 'Inmaculada Concepción':
        month = 11; day = 8; break;
      case 'Navidad':
        month = 11; day = 25; break;
      default:
        return;
    }
    
    const date = new Date(year, month, day);
    holidays.push({
      date: date.toISOString().split('T')[0],
      name: holiday.name,
      type: holiday.type
    });
  });
  
  // Días festivos móviles
  const movableHolidays = calculateMovableHolidays(year);
  holidays.push(...movableHolidays);
  
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Verifica si una fecha es un día festivo
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);
  const dateString = date.toISOString().split('T')[0];
  
  return holidays.some(holiday => holiday.date === dateString);
}

/**
 * Verifica si una fecha es sábado o domingo
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Verifica si una fecha es un día no hábil (sábado, domingo o festivo)
 */
export function isNonBusinessDay(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

/**
 * Obtiene el nombre del día festivo si existe
 */
export function getHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);
  const dateString = date.toISOString().split('T')[0];
  
  const holiday = holidays.find(h => h.date === dateString);
  return holiday ? holiday.name : null;
}

/**
 * Obtiene información detallada sobre si una fecha es no hábil
 */
export function getNonBusinessDayInfo(date: Date): {
  isNonBusinessDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  dayOfWeek: string;
} {
  const isWeekendDay = isWeekend(date);
  const isHolidayDay = isHoliday(date);
  const holidayName = isHolidayDay ? getHolidayName(date) : undefined;
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayOfWeek = dayNames[date.getDay()];
  
  return {
    isNonBusinessDay: isWeekendDay || isHolidayDay,
    isWeekend: isWeekendDay,
    isHoliday: isHolidayDay,
    holidayName,
    dayOfWeek
  };
}

/**
 * Obtiene el próximo día hábil después de una fecha dada
 */
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  while (isNonBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Obtiene el día hábil anterior antes de una fecha dada
 */
export function getPreviousBusinessDay(date: Date): Date {
  const prevDay = new Date(date);
  prevDay.setDate(date.getDate() - 1);
  
  while (isNonBusinessDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
}

