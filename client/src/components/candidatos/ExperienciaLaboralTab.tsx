import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { supabase } from '@/services/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface ExperienciaLaboral {
  id?: number;
  empresa: string;
  fechaInicio: string;
  fechaFin: string;
  cargo: string;
  responsabilidades: string;
  salario: string | number;
  motivoRetiro?: string;
}

interface ExperienciaLaboralTabProps {
  experienciaLaboral: ExperienciaLaboral[];
  onChange: (experienciaLaboral: ExperienciaLaboral[]) => void;
  triggerAutoSave?: () => void;
  candidatoId?: number;
}

export const ExperienciaLaboralTab: React.FC<ExperienciaLaboralTabProps> = ({ experienciaLaboral, onChange, triggerAutoSave, candidatoId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentExperiencia, setCurrentExperiencia] = useState<ExperienciaLaboral>({
    empresa: '',
    fechaInicio: '',
    fechaFin: '',
    cargo: '',
    responsabilidades: '',
    salario: '',
    motivoRetiro: '',
  });
  

  // Función para actualizar un registro específico en la base de datos
  const updateExperienciaInDB = async (experiencia: ExperienciaLaboral, index: number) => {
    if (!candidatoId || !experiencia.id) {
      console.error('❌ No se puede actualizar: candidatoId o experiencia.id faltante');
      toast.error("Error: No se puede actualizar el registro");
      return;
    }

    try {
      const { error } = await supabase
        .from('experiencia_laboral')
        .update({
          empresa: experiencia.empresa,
          cargo: experiencia.cargo,
          fecha_inicio: experiencia.fechaInicio,
          fecha_fin: experiencia.fechaFin,
          responsabilidades: experiencia.responsabilidades,
          salario: experiencia.salario ? parseFloat(experiencia.salario.toString()) : null,
          motivo_retiro: experiencia.motivoRetiro || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', experiencia.id)
        .eq('candidato_id', candidatoId);

      if (error) {
      console.error('❌ Error actualizando experiencia:', error);
      toast.error("Error al actualizar la experiencia laboral");
      throw error;
      }

      toast.success("Experiencia laboral actualizada correctamente");
    } catch (error) {
      console.error('❌ Error en updateExperienciaInDB:', error);
      throw error;
    }
  };

  const handleAdd = () => {
    setCurrentExperiencia({
      empresa: '',
      fechaInicio: '',
      fechaFin: '',
      cargo: '',
      responsabilidades: '',
      salario: '',
      motivoRetiro: '',
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setCurrentExperiencia({ ...experienciaLaboral[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const newExperiencia = [...experienciaLaboral];
    
    if (editingIndex !== null) {
      // Editando registro existente - guardar directamente en BD
      try {
        await updateExperienciaInDB(currentExperiencia, editingIndex);
        newExperiencia[editingIndex] = currentExperiencia;
      } catch (error) {
        console.error('❌ Error editando registro:', error);
        return; // No actualizar el estado si hay error
      }
    } else {
      // Agregando nuevo registro - usar auto-guardado
      newExperiencia.push({
        ...currentExperiencia,
        id: Date.now(), // Temporary ID for new items
      });
      
      // Trigger auto-save for new additions
      if (triggerAutoSave) {
        triggerAutoSave(false);
      }
    }
    
    onChange(newExperiencia);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newExperiencia = experienciaLaboral.filter((_, i) => i !== index);
    
    onChange(newExperiencia);
    
    // NO ejecutar auto-guardado inmediatamente para eliminaciones
    // El auto-guardado se ejecutará por el useEffect que detecta cambios en la cantidad
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setCurrentExperiencia({
      empresa: '',
      fechaInicio: '',
      fechaFin: '',
      cargo: '',
      responsabilidades: '',
      salario: '',
      motivoRetiro: '',
    });
  };

  const calcularDuracion = (fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio) return '';
    
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0 && months > 0) {
      return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`;
    } else if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} mes${months > 1 ? 'es' : ''}`;
    } else {
      return 'Menos de 1 mes';
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            {editingIndex !== null ? 'Editar Experiencia Laboral' : 'Agregar Experiencia Laboral'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primera fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa *</label>
              <Input
                value={currentExperiencia.empresa}
                onChange={(e) => setCurrentExperiencia(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo *</label>
              <Input
                value={currentExperiencia.cargo}
                onChange={(e) => setCurrentExperiencia(prev => ({ ...prev, cargo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Salario</label>
              <Input
                type="number"
                value={currentExperiencia.salario}
                onChange={(e) => setCurrentExperiencia(prev => ({ ...prev, salario: e.target.value }))}
              />
            </div>
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Inicio *</label>
              <CustomDatePicker
                value={currentExperiencia.fechaInicio ? new Date(currentExperiencia.fechaInicio) : null}
                onChange={(date) => setCurrentExperiencia(prev => ({ 
                  ...prev, 
                  fechaInicio: date ? format(date, 'yyyy-MM-dd') : '' 
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Fin</label>
              <CustomDatePicker
                value={currentExperiencia.fechaFin ? new Date(currentExperiencia.fechaFin) : null}
                onChange={(date) => setCurrentExperiencia(prev => ({ 
                  ...prev, 
                  fechaFin: date ? format(date, 'yyyy-MM-dd') : '' 
                }))}
                minDate={currentExperiencia.fechaInicio ? new Date(currentExperiencia.fechaInicio) : undefined}
              />
              <p className="text-xs text-muted-foreground">Deje vacío si aún trabaja aquí</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo de Retiro</label>
              <Input
                value={currentExperiencia.motivoRetiro || ''}
                onChange={(e) => setCurrentExperiencia(prev => ({ ...prev, motivoRetiro: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Responsabilidades *</label>
            <Textarea
              value={currentExperiencia.responsabilidades}
              onChange={(e) => setCurrentExperiencia(prev => ({ ...prev, responsabilidades: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={!currentExperiencia.empresa || !currentExperiencia.cargo || !currentExperiencia.fechaInicio || !currentExperiencia.responsabilidades}
            >
              {editingIndex !== null ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          Experiencia Laboral
        </h3>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Experiencia
        </Button>
      </div>

      {experienciaLaboral.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay registros de experiencia laboral</p>
            <p className="text-sm text-muted-foreground">Agregue la experiencia laboral del candidato</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3 text-xs font-medium">Cargo</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Empresa</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Período</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Duración</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Motivo Retiro</TableHead>
                  <TableHead className="py-2 px-3 text-center text-xs font-medium">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experienciaLaboral.map((exp, index) => (
                  <TableRow key={exp.id || index} className="hover:bg-muted/50">
                    <TableCell className="py-2 px-3">
                      <div className="font-medium text-sm">{exp.cargo}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-sm">{exp.empresa}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(exp.fechaInicio).toLocaleDateString()} - {exp.fechaFin ? new Date(exp.fechaFin).toLocaleDateString() : 'Actual'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                        {calcularDuracion(exp.fechaInicio, exp.fechaFin)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-xs text-muted-foreground">
                        {exp.motivoRetiro || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex justify-center space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(index)} title="Editar" className="h-6 w-6 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" title="Eliminar" className="h-6 w-6 p-0">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar experiencia laboral?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la experiencia laboral de <strong>{exp.empresa}</strong> como <strong>{exp.cargo}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(index)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};



