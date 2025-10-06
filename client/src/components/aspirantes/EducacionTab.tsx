
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Educacion {
  id?: number;
  nivelEducativo: string;
  institucion: string;
  titulo: string;
  fechaGraduacion: string;
}

interface EducacionTabProps {
  educacion: Educacion[];
  onChange: (educacion: Educacion[]) => void;
}

export const EducacionTab: React.FC<EducacionTabProps> = ({ educacion, onChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEducacion, setCurrentEducacion] = useState<Educacion>({
    nivelEducativo: '',
    institucion: '',
    titulo: '',
    fechaGraduacion: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentEducacion({ ...currentEducacion, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentEducacion({ ...currentEducacion, [name]: value });
  };

  const handleAddEducacion = () => {
    if (editingIndex !== null) {
      // Edit existing item - preserve existing ID
      const updatedEducacion = [...educacion];
      updatedEducacion[editingIndex] = { 
        ...currentEducacion,
        id: updatedEducacion[editingIndex].id // Preserve existing ID if available
      };
      onChange(updatedEducacion);
    } else {
      // Add new item
      onChange([
        ...educacion,
        {
          ...currentEducacion,
          id: Date.now() // Generate temporary ID
        }
      ]);
    }
    
    // Reset form and close dialog
    setCurrentEducacion({
      nivelEducativo: '',
      institucion: '',
      titulo: '',
      fechaGraduacion: ''
    });
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleEditEducacion = (index: number) => {
    // Just set the current education data from local state without API request
    setCurrentEducacion({...educacion[index]});
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteEducacion = (index: number) => {
    const updatedEducacion = [...educacion];
    updatedEducacion.splice(index, 1);
    onChange(updatedEducacion);
  };

  const nivelesEducativos = [
    { value: 'bachiller', label: 'Bachiller' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'tecnologo', label: 'Tecnólogo' },
    { value: 'profesional', label: 'Profesional' },
    { value: 'especializacion', label: 'Especialización' },
    { value: 'maestria', label: 'Maestría' },
    { value: 'doctorado', label: 'Doctorado' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Educación</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentEducacion({
                nivelEducativo: '',
                institucion: '',
                titulo: '',
                fechaGraduacion: ''
              });
              setEditingIndex(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Item Educación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Editar Educación" : "Agregar Educación"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="nivelEducativo" className="text-sm font-medium">
                    Nivel Educativo
                  </label>
                  <Select
                    value={currentEducacion.nivelEducativo}
                    onValueChange={(value) => handleSelectChange('nivelEducativo', value)}
                  >
                    <SelectTrigger id="nivelEducativo">
                      <SelectValue placeholder="Seleccione nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {nivelesEducativos.map(nivel => (
                        <SelectItem key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="institucion" className="text-sm font-medium">
                    Institución
                  </label>
                  <Input
                    id="institucion"
                    name="institucion"
                    placeholder="Ingrese institución"
                    value={currentEducacion.institucion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="titulo" className="text-sm font-medium">
                    Título Obtenido
                  </label>
                  <Input
                    id="titulo"
                    name="titulo"
                    placeholder="Ingrese título"
                    value={currentEducacion.titulo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fechaGraduacion" className="text-sm font-medium">
                    Fecha Graduación
                  </label>
                  <Input
                    id="fechaGraduacion"
                    name="fechaGraduacion"
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={currentEducacion.fechaGraduacion}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEducacion}>
                {editingIndex !== null ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {educacion.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay información educativa registrada. Use el botón "Añadir Item Educación" para agregar.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nivel Educativo</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Fecha Graduación</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {educacion.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell>
                  {nivelesEducativos.find(n => n.value === item.nivelEducativo)?.label || item.nivelEducativo}
                </TableCell>
                <TableCell>{item.institucion}</TableCell>
                <TableCell>{item.titulo}</TableCell>
                <TableCell>{item.fechaGraduacion}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEducacion(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

