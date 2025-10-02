import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  presets?: Array<{
    label: string;
    value: () => DateRange;
  }>;
  maxDate?: Date;
  minDate?: Date;
  showPresets?: boolean;
}

const defaultPresets = [
  {
    label: 'Hoy',
    value: () => ({
      from: new Date(),
      to: new Date()
    })
  },
  {
    label: 'Esta semana',
    value: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 })
    })
  },
  {
    label: 'Semana pasada',
    value: () => {
      const today = new Date();
      const lastWeek = subDays(today, 7);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    }
  },
  {
    label: 'Este mes',
    value: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    label: 'Mes pasado',
    value: () => {
      const today = new Date();
      const lastMonth = subDays(today, 30);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
  },
  {
    label: 'Últimos 7 días',
    value: () => ({
      from: subDays(new Date(), 6),
      to: new Date()
    })
  },
  {
    label: 'Últimos 30 días',
    value: () => ({
      from: subDays(new Date(), 29),
      to: new Date()
    })
  }
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango de fechas",
  className,
  disabled = false,
  presets = defaultPresets,
  maxDate,
  minDate,
  showPresets = true
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(value);

  // Sincronizar el estado interno con el valor externo
  useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      setSelectedRange(range);
      // Solo actualizar cuando se complete el rango
      if (range.from && range.to) {
        onChange(range);
        setIsOpen(false);
      }
    }
  };

  const handlePresetSelect = (preset: () => DateRange) => {
    const newRange = preset();
    setSelectedRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const clearSelection = () => {
    const emptyRange = { from: undefined, to: undefined };
    setSelectedRange(emptyRange);
    onChange(emptyRange);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from) return placeholder;
    
    if (!range.to) {
      return format(range.from, "dd 'de' MMMM, yyyy", { locale: es });
    }
    
    return `${format(range.from, "dd 'de' MMMM", { locale: es })} - ${format(range.to, "dd 'de' MMMM, yyyy", { locale: es })}`;
  };

  const isRangeComplete = selectedRange.from && selectedRange.to;

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50 transition-colors",
              !isRangeComplete && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate flex-1">
              {formatDateRange(selectedRange)}
            </span>
            {isRangeComplete && (
              <X
                className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            {showPresets && (
              <div className="border-r border-gray-200 p-3 min-w-[200px]">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Rangos rápidos</h4>
                <div className="space-y-1">
                  {presets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetSelect(preset.value)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={selectedRange.from}
                selected={selectedRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                locale={es}
                disabled={(date) => {
                  if (maxDate && date > maxDate) return true;
                  if (minDate && date < minDate) return true;
                  return false;
                }}
                className="rounded-md border-0"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangePicker;
