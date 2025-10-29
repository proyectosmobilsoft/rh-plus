import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ubicacionesService } from '@/services/ubicacionesService';
import { handleServiceError, logError } from '@/utils/errorHandler';

// Schema sin el campo estado
const ciudadSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la ciudad es requerido'),
  codigo_dane: z.string().optional(),
  departamento_id: z.number().min(1, 'Debe seleccionar un departamento'),
});

type CiudadFormData = z.infer<typeof ciudadSchema>;

interface CiudadFormProps {
  initialData?: (CiudadFormData & { id?: number }) | any;
  departamentos: Array<{ id: number; nombre: string; pais_id: number }>;
  paises: Array<{ id: number; nombre: string }>;
  onSaved: () => void;
}

export function CiudadForm({ initialData, departamentos, paises, onSaved }: CiudadFormProps) {
  const form = useForm<CiudadFormData>({
    resolver: zodResolver(ciudadSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      codigo_dane: initialData?.codigo_dane || '',
      departamento_id: initialData?.departamento_id || undefined,
    },
  });

  const [openDepto, setOpenDepto] = React.useState(false);

  const onSubmit = async (data: CiudadFormData) => {
    try {
      if (initialData?.id) {
        await ubicacionesService.updateCiudad(initialData.id, data);
        toast.success('Ciudad actualizada correctamente');
      } else {
        await ubicacionesService.createCiudad(data);
        toast.success('Ciudad creada correctamente');
      }
      onSaved();
    } catch (error) {
      logError('CiudadForm', error);
      const errorMessage = handleServiceError(error, 'Error al guardar la ciudad', 'la ciudad');
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Ciudad *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Medellín" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codigo_dane"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código DANE</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 05001" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departamento_id"
            render={({ field }) => {
              const selected = departamentos.find(d => d.id === field.value);
              return (
                <FormItem>
                  <FormLabel>Departamento *</FormLabel>
                  <Popover open={openDepto} onOpenChange={setOpenDepto}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDepto}
                        className="w-full justify-between"
                      >
                        {selected ? selected.nombre : 'Seleccionar departamento'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar departamento..." className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                        <CommandList>
                          <CommandEmpty>No se encontraron departamentos.</CommandEmpty>
                          <CommandGroup>
                            {departamentos.map((d) => (
                              <CommandItem
                                key={d.id}
                                onSelect={() => {
                                  form.setValue('departamento_id', d.id, { shouldValidate: true, shouldDirty: true });
                                  setOpenDepto(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn('mr-2 h-4 w-4', d.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                {d.nombre}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSaved()}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}

