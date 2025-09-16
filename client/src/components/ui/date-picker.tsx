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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  const handleDateSelect = (date: Date) => {
    // Usar la función personalizada de desactivación si está disponible
    if (isDateDisabled && diasMinimos) {
      if (isDateDisabled(date, diasMinimos)) return;
    } else {
      // Lógica original para minDate y maxDate
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
      const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
      
      if (minDateOnly && dateOnly < minDateOnly) return;
      if (maxDateOnly && dateOnly > maxDateOnly) return;
    }
    
    onChange(date);
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
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="flex-1 text-left">
          {value ? format(value, 'dd/MM/yyyy') : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>

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
                  {format(day, 'd')}
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