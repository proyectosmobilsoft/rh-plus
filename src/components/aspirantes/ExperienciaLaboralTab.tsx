
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Edit, Trash2, Plus } from 'lucide-react';

interface ExperienciaLaboral {
  id?: number;
  empresa: string;
  fechaInicio: string;
  fechaFin: string;
  cargo: string;
  responsabilidades: string;
  salario: string | number;
}

interface ExperienciaLaboralTabProps {
  experienciaLaboral: ExperienciaLaboral[];
  onChange: (experienciaLaboral: ExperienciaLaboral[]) => void;
}

export const ExperienciaLaboralTab: React.FC<ExperienciaLaboralTabProps> = ({ experienciaLaboral, onChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExperiencia, setCurrentExperiencia] = useState<ExperienciaLaboral>({
    empresa: '',
    fechaInicio: '',
    fechaFin: '',
    cargo: '',
    responsabilidades: '',
    salario: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExperiencia({ ...currentExperiencia, [name]: value });
  };

  const handleAddExperiencia = () => {
    if (editingIndex !== null) {
      // Edit existing item - preserve existing ID
      const updatedExperiencia = [...experienciaLaboral];
      updatedExperiencia[editingIndex] = {
        ...currentExperiencia,
        id: updatedExperiencia[editingIndex]?.id // Preserve existing ID if available
      };
      onChange(updatedExperiencia);
    } else {
      // Add new item
      onChange([
        ...experienciaLaboral,
        {
          ...currentExperiencia,
          id: Date.now() // Generate temporary ID
        }
      ]);
    }
    
    // Reset form and close dialog
    setCurrentExperiencia({
      empresa: '',
      fechaInicio: '',
      fechaFin: '',
      cargo: '',
      responsabilidades: '',
      salario: ''
    });
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleEditExperiencia = (index: number) => {
    // Just set the current experience data from local state without API request
    setCurrentExperiencia({...experienciaLaboral[index]});
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteExperiencia = (index: number) => {
    const updatedExperiencia = [...experienciaLaboral];
    updatedExperiencia.splice(index, 1);
    onChange(updatedExperiencia);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Experiencia Laboral</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentExperiencia({
                empresa: '',
                fechaInicio: '',
                fechaFin: '',
                cargo: '',
                responsabilidades: '',
                salario: ''
              });
              setEditingIndex(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Experiencia Laboral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Editar Experiencia" : "Agregar Experiencia"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="empresa" className="text-sm font-medium">
                  Empresa
                </label>
                <Input
                  id="empresa"
                  name="empresa"
                  placeholder="Ingrese empresa"
                  value={currentExperiencia.empresa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="fechaInicio" className="text-sm font-medium">
                    Fecha Inicio
                  </label>
                  <Input
                    id="fechaInicio"
                    name="fechaInicio"
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={currentExperiencia.fechaInicio}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fechaFin" className="text-sm font-medium">
                    Fecha Fin
                  </label>
                  <Input
                    id="fechaFin"
                    name="fechaFin"
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={currentExperiencia.fechaFin}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="cargo" className="text-sm font-medium">
                  Cargo
                </label>
                <Input
                  id="cargo"
                  name="cargo"
                  placeholder="Ingrese cargo"
                  value={currentExperiencia.cargo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="responsabilidades" className="text-sm font-medium">
                  Responsabilidades
                </label>
                <Textarea
                  id="responsabilidades"
                  name="responsabilidades"
                  placeholder="Ingrese responsabilidades"
                  value={currentExperiencia.responsabilidades}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salario" className="text-sm font-medium">
                  Salario
                </label>
                <Input
                  id="salario"
                  name="salario"
                  type="number"
                  placeholder="0"
                  value={currentExperiencia.salario}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddExperiencia}>
                {editingIndex !== null ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {experienciaLaboral.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay experiencia laboral registrada. Use el botón "Añadir Experiencia Laboral" para agregar.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Responsabilidades</TableHead>
              <TableHead>Salario</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experienciaLaboral.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell>{item.empresa}</TableCell>
                <TableCell>{item.fechaInicio}</TableCell>
                <TableCell>{item.fechaFin}</TableCell>
                <TableCell>{item.cargo}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.responsabilidades}</TableCell>
                <TableCell>{typeof item.salario === 'number' ? item.salario.toLocaleString() : item.salario}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteExperiencia(index)}>
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
