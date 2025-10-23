import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  addDays,
  subDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import './date-picker.css';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
  diasMinimos?: number | string;
  isDateDisabled?: (day: Date, diasMinimos: number | string) => boolean;
}

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  maxDate,
  minDate,
  diasMinimos,
  isDateDisabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(() => {
    if (value) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    return '';
  });
  const [isInputValid, setIsInputValid] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Generar años (desde 1950 hasta 2030)
  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 10; year >= 1950; year--) {
      years.push(year);
    }
    return years;
  };

  const years = generateYears();

  // Sincronizar inputValue con value
  useEffect(() => {
    if (value) {
      // Crear fecha local sin problemas de zona horaria
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      setInputValue(`${day}/${month}/${year}`);
    } else {
      setInputValue('');
    }
    setIsInputValid(true);
  }, [value]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generar días del calendario
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = generateCalendarDays();

  // Función para validar fecha ingresada manualmente
  const validateInputDate = (dateString: string): { isValid: boolean; date: Date | null; isDisabled: boolean } => {
    // Verificar formato dd/MM/yyyy
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) {
      return { isValid: false, date: null, isDisabled: false };
    }

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validar rangos
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return { isValid: false, date: null, isDisabled: false };
    }

    const date = new Date(yearNum, monthNum - 1, dayNum);
    
    // Verificar que la fecha es válida (no es 31 de febrero, etc.)
    if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
      return { isValid: false, date: null, isDisabled: false };
    }

    // Verificar si está deshabilitada usando la misma lógica del calendario
    let isDisabled = false;
    if (isDateDisabled && diasMinimos) {
      isDisabled = isDateDisabled(date, diasMinimos);
    } else {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
      const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
      
      if (minDateOnly && dateOnly < minDateOnly) isDisabled = true;
      if (maxDateOnly && dateOnly > maxDateOnly) isDisabled = true;
    }

    return { isValid: true, date, isDisabled };
  };

  // Función para formatear automáticamente la fecha mientras se escribe
  const formatInputValue = (value: string): string => {
    // Remover caracteres no numéricos
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Función para manejar cambios en el input de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatInputValue(rawValue);
    setInputValue(formattedValue);
    
    if (formattedValue === '') {
      setIsInputValid(true);
      onChange(null);
      return;
    }

    // Solo validar si tiene el formato completo dd/MM/yyyy
    if (formattedValue.length === 10) {
      const validation = validateInputDate(formattedValue);
      setIsInputValid(validation.isValid && !validation.isDisabled);
      
      if (validation.isValid && !validation.isDisabled && validation.date) {
        onChange(validation.date);
      }
    } else {
      // Mientras se está escribiendo, considerar válido temporalmente
      setIsInputValid(true);
    }
  };

  // Función para manejar el blur del input
  const handleInputBlur = () => {
    if (inputValue === '') {
      onChange(null);
      return;
    }

    const validation = validateInputDate(inputValue);
    if (!validation.isValid || validation.isDisabled) {
      // Restaurar el valor anterior si la validación falla
      if (value) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        setInputValue(`${day}/${month}/${year}`);
      } else {
        setInputValue('');
      }
      setIsInputValid(true);
    }
  };

  const handleDateSelect = (date: Date) => {
    // Usar la función personalizada de desactivación si está disponible
    if (isDateDisabled && diasMinimos) {
      if (isDateDisabled(date, diasMinimos)) return;
    } else {
      // Lógica original para minDate y maxDate - usar fecha local sin problemas de zona horaria
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const dateOnly = new Date(year, month, day);
      
      const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
      const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
      
      if (minDateOnly && dateOnly < minDateOnly) return;
      if (maxDateOnly && dateOnly > maxDateOnly) return;
    }
    
    // Crear fecha local sin problemas de zona horaria usando UTC
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const localDate = new Date(Date.UTC(year, month, day));
    
    onChange(localDate);
    setIsOpen(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
    setShowMonthDropdown(false);
  };

  const handleYearChange = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth()));
    setShowYearDropdown(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(today);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={calendarRef}>
      {/* Input Field */}
      <div 
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !isInputValid && "border-red-500 focus-visible:ring-red-500",
          className
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-left"
        />
        <Calendar 
          className="h-4 w-4 text-muted-foreground cursor-pointer" 
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {/* Error Message */}
      {!isInputValid && inputValue && inputValue.length === 10 && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200 z-50">
          Esta fecha no está permitida según la configuración
        </div>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="mobilsoft-datepicker-calendar">
          {/* Header */}
          <div className="mobilsoft-datepicker-header">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="mobilsoft-datepicker-nav mobilsoft-datepicker-nav-prev"
            >
              ‹
            </button>
            
            <div className="mobilsoft-datepicker-month-container" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="mobilsoft-datepicker-month-button"
              >
                {months[currentMonth.getMonth()]}
              </button>
              
              {showMonthDropdown && (
                <div className="mobilsoft-datepicker-month-dropdown">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleMonthChange(index)}
                      className={cn(
                        "mobilsoft-datepicker-month-option",
                        index === currentMonth.getMonth() && "mobilsoft-datepicker-month-option-selected"
                      )}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mobilsoft-datepicker-year-container" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="mobilsoft-datepicker-year-button"
              >
                {currentMonth.getFullYear()}
              </button>
              
              {showYearDropdown && (
                <div className="mobilsoft-datepicker-year-dropdown">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearChange(year)}
                      className={cn(
                        "mobilsoft-datepicker-year-option",
                        year === currentMonth.getFullYear() && "mobilsoft-datepicker-year-option-selected"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="mobilsoft-datepicker-nav mobilsoft-datepicker-nav-next"
            >
              ›
            </button>
          </div>

          {/* Week Days */}
          <div className="mobilsoft-datepicker-day-names">
            {weekDays.map((day) => (
              <div key={day} className="mobilsoft-datepicker-day-name">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="mobilsoft-datepicker-month-grid">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = value && isSameDay(day, value);
              const isTodayDate = isToday(day);
              // Usar la función personalizada de desactivación si está disponible
              let isDisabled = false;
              
              if (isDateDisabled && diasMinimos) {
                // Usar la lógica personalizada para desactivar solo los días específicos del rango
                isDisabled = isDateDisabled(day, diasMinimos);
              } else {
                // Lógica original para minDate y maxDate
                const dayDateOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
                const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
                
                isDisabled = (minDateOnly && dayDateOnly < minDateOnly) || (maxDateOnly && dayDateOnly > maxDateOnly);
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "mobilsoft-datepicker-day",
                    !isCurrentMonth && "mobilsoft-datepicker-day-outside-month",
                    isSelected && "mobilsoft-datepicker-day-selected",
                    isTodayDate && !isSelected && "mobilsoft-datepicker-day-today",
                    isDisabled && "mobilsoft-datepicker-day-disabled"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mobilsoft-datepicker-footer">
            <button
              type="button"
              onClick={handleToday}
              className="mobilsoft-datepicker-today-button"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

