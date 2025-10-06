import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { supabase } from '@/services/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Educacion {
  id?: number;
  titulo: string;
  institucion: string;
  fechaInicio: string;
  fechaFin: string;
  ciudad: string;
  nivelEducativo: string;
}

interface EducacionTabProps {
  educacion: Educacion[];
  onChange: (educacion: Educacion[]) => void;
  triggerAutoSave?: () => void;
  candidatoId?: number;
}

export function EducacionTab({ educacion, onChange, triggerAutoSave, candidatoId }: EducacionTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentEducacion, setCurrentEducacion] = useState<Educacion>({
    titulo: '',
    institucion: '',
    fechaInicio: '',
    fechaFin: '',
    ciudad: '',
    nivelEducativo: ''
  });
  

  // Función para actualizar un registro específico en la base de datos
  const updateEducacionInDB = async (educacion: Educacion, index: number) => {
    if (!candidatoId || !educacion.id) {
      console.error('❌ No se puede actualizar: candidatoId o educacion.id faltante');
      toast.error("Error: No se puede actualizar el registro");
      return;
    }

    try {
      console.log('💾 Actualizando educación en BD:', educacion);
      
      const { error } = await supabase
        .from('educacion_candidato')
        .update({
          titulo: educacion.titulo,
          institucion: educacion.institucion,
          fecha_inicio: educacion.fechaInicio,
          fecha_fin: educacion.fechaFin,
          ciudad: educacion.ciudad,
          nivel_educativo: educacion.nivelEducativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', educacion.id)
        .eq('candidato_id', candidatoId);

      if (error) {
        console.error('❌ Error actualizando educación:', error);
        toast.error("Error al actualizar la educación");
        throw error;
      }

      console.log('✅ Educación actualizada exitosamente en BD');
      toast.success("Educación actualizada correctamente");
    } catch (error) {
      console.error('❌ Error en updateEducacionInDB:', error);
      throw error;
    }
  };

  const nivelesEducativos = [
    'Primaria',
    'Secundaria',
    'Técnico',
    'Tecnológico',
    'Universitario',
    'Especialización',
    'Maestría',
    'Doctorado'
  ];

  const handleAdd = () => {
    setCurrentEducacion({
      titulo: '',
      institucion: '',
      fechaInicio: '',
      fechaFin: '',
      ciudad: '',
      nivelEducativo: ''
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setCurrentEducacion({ ...educacion[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const newEducacion = [...educacion];
    
    if (editingIndex !== null) {
      // Editando registro existente - guardar directamente en BD
      try {
        console.log('✏️ Editando registro existente en BD...');
        await updateEducacionInDB(currentEducacion, editingIndex);
        newEducacion[editingIndex] = currentEducacion;
        console.log('✅ Edición completada sin auto-guardado');
      } catch (error) {
        console.error('❌ Error editando registro:', error);
        return; // No actualizar el estado si hay error
      }
    } else {
      // Agregando nuevo registro - usar auto-guardado
      console.log('➕ Agregando nuevo registro...');
      newEducacion.push({
        ...currentEducacion,
        id: Date.now(), // Temporary ID for new items
      });
      
      // Trigger auto-save for new additions
      if (triggerAutoSave) {
        console.log('🔄 Activando auto-guardado para adición...');
        triggerAutoSave(false);
      }
    }
    
    onChange(newEducacion);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    console.log('🗑️ Eliminando educación en índice:', index);
    console.log('📚 Educación antes de eliminar:', educacion);
    
    const newEducacion = educacion.filter((_, i) => i !== index);
    console.log('📚 Educación después de eliminar:', newEducacion);
    
    onChange(newEducacion);
    
    // NO ejecutar auto-guardado inmediatamente para eliminaciones
    // El auto-guardado se ejecutará por el useEffect que detecta cambios en la cantidad
    console.log('ℹ️ Eliminación completada, auto-guardado se ejecutará automáticamente');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setCurrentEducacion({
      titulo: '',
      institucion: '',
      fechaInicio: '',
      fechaFin: '',
      ciudad: '',
      nivelEducativo: ''
    });
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            {editingIndex !== null ? 'Editar Educación' : 'Agregar Educación'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primera fila */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Título/Programa *</label>
              <Input
                value={currentEducacion.titulo}
                onChange={(e) => setCurrentEducacion(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Institución Educativa *</label>
              <Input
                value={currentEducacion.institucion}
                onChange={(e) => setCurrentEducacion(prev => ({ ...prev, institucion: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nivel *</label>
              <Select
                value={currentEducacion.nivelEducativo}
                onValueChange={(value) => setCurrentEducacion(prev => ({ ...prev, nivelEducativo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nivelesEducativos.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Inicio *</label>
              <CustomDatePicker
                value={currentEducacion.fechaInicio ? new Date(currentEducacion.fechaInicio) : null}
                onChange={(date) => setCurrentEducacion(prev => ({ 
                  ...prev, 
                  fechaInicio: date ? format(date, 'yyyy-MM-dd') : '' 
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Finalización *</label>
              <CustomDatePicker
                value={currentEducacion.fechaFin ? new Date(currentEducacion.fechaFin) : null}
                onChange={(date) => setCurrentEducacion(prev => ({ 
                  ...prev, 
                  fechaFin: date ? format(date, 'yyyy-MM-dd') : '' 
                }))}
                minDate={currentEducacion.fechaInicio ? new Date(currentEducacion.fechaInicio) : undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ciudad *</label>
              <Input
                value={currentEducacion.ciudad}
                onChange={(e) => setCurrentEducacion(prev => ({ ...prev, ciudad: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={!currentEducacion.titulo || !currentEducacion.institucion || !currentEducacion.fechaInicio || !currentEducacion.fechaFin || !currentEducacion.ciudad || !currentEducacion.nivelEducativo}
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
          <GraduationCap className="mr-2 h-5 w-5" />
          Educación
        </h3>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Educación
        </Button>
      </div>

      {educacion.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay registros de educación</p>
            <p className="text-sm text-muted-foreground">Agregue la formación académica del candidato</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3 text-xs font-medium">Título/Programa</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Institución</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Período</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Ciudad</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Nivel</TableHead>
                  <TableHead className="py-2 px-3 text-center text-xs font-medium">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {educacion.map((item, index) => (
                  <TableRow key={item.id || index} className="hover:bg-muted/50">
                    <TableCell className="py-2 px-3">
                      <div className="font-medium text-sm">{item.titulo}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-sm">{item.institucion}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.fechaInicio).toLocaleDateString()} - {new Date(item.fechaFin).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="text-xs text-muted-foreground">{item.ciudad}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                        {item.nivelEducativo}
                      </span>
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
                              <AlertDialogTitle>¿Eliminar educación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la educación de <strong>{item.titulo}</strong> en <strong>{item.institucion}</strong>.
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
}



