import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { OrdenServicio } from '@/services/ordenesService';
import { serviciosService } from '@/services/serviciosService';

interface ServicioSelectorProps {
  onServicioSelected: (servicio: OrdenServicio) => void;
}

const ServicioSelector = ({ onServicioSelected }: ServicioSelectorProps) => {
  const [servicios, setServicios] = useState<OrdenServicio[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<OrdenServicio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchServicios = async () => {
      setIsLoading(true);
      try {
        const data = await serviciosService.getAll();
        setServicios(data);
        setFilteredServicios(data);
      } catch (error) {
        console.error('Error fetching servicios:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServicios();
  }, []);

  useEffect(() => {
    const filtered = servicios.filter((servicio) => 
      servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (servicio.codigo && servicio.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredServicios(filtered);
  }, [searchTerm, servicios]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleServicioSelect = (servicio: OrdenServicio) => {
    onServicioSelected(servicio);
    setIsDialogOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          <span>Agregar Servicio</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Servicios</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            placeholder="Buscar servicio por nombre o código CUPS..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="mb-4"
          />
          
          {isLoading ? (
            <div className="text-center py-4">Cargando servicios...</div>
          ) : (
            filteredServicios.length > 0 ? (
              <div className="max-h-96 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Código CUPS</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServicios.map((servicio) => (
                      <TableRow key={servicio.id}>
                        <TableCell className="font-medium">{servicio.descripcion}</TableCell>
                        <TableCell>{servicio.codigo}</TableCell>
                        <TableCell className="text-right">${servicio.precio.toLocaleString('es-CO')}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleServicioSelect(servicio)}
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                {searchTerm ? 'No se encontraron servicios que coincidan con la búsqueda' : 'No hay servicios disponibles'}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServicioSelector;
