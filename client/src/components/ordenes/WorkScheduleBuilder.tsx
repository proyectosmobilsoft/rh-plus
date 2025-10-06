import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface WorkScheduleEntry {
  id: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
}

interface WorkScheduleBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

const WorkScheduleBuilder: React.FC<WorkScheduleBuilderProps> = ({ value, onChange }) => {
  const [schedules, setSchedules] = useState<WorkScheduleEntry[]>([]);

  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const horas = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Parse existing value on component mount
  useEffect(() => {
    if (value && value.trim() !== '') {
      // Try to parse the existing text format
      parseExistingSchedule(value);
    }
  }, []);

  const parseExistingSchedule = (text: string) => {
    // Simple parsing for existing format like "Lunes a Viernes: 6:00-12:00 pm"
    if (text.includes(':')) {
      const entry: WorkScheduleEntry = {
        id: '1',
        dias: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
        horaInicio: '06:00',
        horaFin: '12:00'
      };
      setSchedules([entry]);
    }
  };

  const addSchedule = () => {
    const newSchedule: WorkScheduleEntry = {
      id: Date.now().toString(),
      dias: [],
      horaInicio: '',
      horaFin: ''
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    updateText(updated);
  };

  const updateSchedule = (id: string, field: keyof WorkScheduleEntry, value: any) => {
    const updated = schedules.map(schedule => 
      schedule.id === id ? { ...schedule, [field]: value } : schedule
    );
    setSchedules(updated);
    updateText(updated);
  };

  const updateText = (scheduleList: WorkScheduleEntry[]) => {
    const text = scheduleList
      .filter(s => s.dias.length > 0 && s.horaInicio && s.horaFin)
      .map(schedule => {
        const diasText = formatDays(schedule.dias);
        return `${diasText}: ${schedule.horaInicio} - ${schedule.horaFin}`;
      })
      .join(', ');
    
    onChange(text);
  };

  const formatDays = (dias: string[]): string => {
    if (dias.length === 0) return '';
    if (dias.length === 1) return capitalize(dias[0]);
    
    // Check for consecutive weekdays
    const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    const isConsecutiveWeekdays = weekdays.every(day => dias.includes(day)) && dias.length === 5;
    
    if (isConsecutiveWeekdays) {
      return 'Lunes a Viernes';
    }
    
    // Check for weekend
    if (dias.includes('sábado') && dias.includes('domingo') && dias.length === 2) {
      return 'Sábados y Domingos';
    }
    
    // Default: list all days
    return dias.map(capitalize).join(', ');
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const toggleDay = (scheduleId: string, day: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const updatedDias = schedule.dias.includes(day)
      ? schedule.dias.filter(d => d !== day)
      : [...schedule.dias, day];
    
    updateSchedule(scheduleId, 'dias', updatedDias);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Resultado: <span className="font-medium">{value || 'No configurado'}</span>
      </div>
      
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="p-4">
          <div className="space-y-4">
            {/* Days Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Días de la semana</label>
              <div className="flex flex-wrap gap-2">
                {diasSemana.map((dia) => (
                  <Button
                    key={dia.value}
                    type="button"
                    variant={schedule.dias.includes(dia.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(schedule.id, dia.value)}
                  >
                    {dia.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Hora inicio</label>
                <Select 
                  value={schedule.horaInicio} 
                  onValueChange={(value) => updateSchedule(schedule.id, 'horaInicio', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {horas.map((hora) => (
                      <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Hora fin</label>
                <Select 
                  value={schedule.horaFin}
                  onValueChange={(value) => updateSchedule(schedule.id, 'horaFin', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {horas.map((hora) => (
                      <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Remove button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSchedule(schedule.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSchedule}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar Horario
      </Button>
    </div>
  );
};

export default WorkScheduleBuilder;

