import React, { useState } from 'react';
import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';
import { useDateRangeValidation } from '@/hooks/useDateRangeValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const DateRangeExample: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  // Validaciones del rango de fechas
  const validation = useDateRangeValidation(dateRange, {
    maxRangeDays: 90,
    minRangeDays: 1,
    allowSameDay: false,
    allowFutureDates: false
  });

  // Presets personalizados para el ejemplo
  const customPresets = [
    {
      label: 'Última semana',
      value: () => {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { from: lastWeek, to: today };
      }
    },
    {
      label: 'Último mes',
      value: () => {
        const today = new Date();
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: lastMonth, to: today };
      }
    },
    {
      label: 'Últimos 3 meses',
      value: () => {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { from: threeMonthsAgo, to: today };
      }
    }
  ];

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    console.log('Rango seleccionado:', newRange);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Selector de Rango de Fechas Moderno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector principal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Selecciona un rango de fechas:
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder="Selecciona un rango de fechas"
              className="w-full max-w-md"
              presets={customPresets}
              showPresets={true}
              maxDate={new Date()}
              minDate={new Date('2020-01-01')}
            />
          </div>

          {/* Validaciones */}
          {!validation.isValid && validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index}>• {warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Información del rango seleccionado */}
          {dateRange.from && dateRange.to && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Información del Rango Seleccionado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Fecha Inicial</Badge>
                    <span className="text-sm">
                      {dateRange.from.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Fecha Final</Badge>
                    <span className="text-sm">
                      {dateRange.to.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Días de diferencia</Badge>
                    <span className="text-sm font-medium">
                      {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={validation.isValid ? "default" : "destructive"}>
                      Estado
                    </Badge>
                    <span className="text-sm">
                      {validation.isValid ? 'Válido' : 'Inválido'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Código de ejemplo */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Código de Ejemplo</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';

const [dateRange, setDateRange] = useState<DateRange>({
  from: undefined,
  to: undefined
});

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  placeholder="Selecciona un rango de fechas"
  className="w-full max-w-md"
  presets={customPresets}
  showPresets={true}
  maxDate={new Date()}
  minDate={new Date('2020-01-01')}
/>`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateRangeExample;

