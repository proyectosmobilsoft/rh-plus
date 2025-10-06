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

// Schema sin el campo estado
const departamentoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del departamento es requerido'),
  codigo_dane: z.string().optional(),
  pais_id: z.number().min(1, 'Debe seleccionar un país'),
});

type DepartamentoFormData = z.infer<typeof departamentoSchema>;

interface DepartamentoFormProps {
  initialData?: (DepartamentoFormData & { id?: number }) | any;
  paises: Array<{ id: number; nombre: string }>;
  onSaved: () => void;
}

export function DepartamentoForm({ initialData, paises, onSaved }: DepartamentoFormProps) {
  const form = useForm<DepartamentoFormData>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      codigo_dane: initialData?.codigo_dane || '',
      pais_id: initialData?.pais_id || undefined,
    },
  });

  const [openPais, setOpenPais] = React.useState(false);

  const onSubmit = async (data: DepartamentoFormData) => {
    try {
      if (initialData?.id) {
        await ubicacionesService.updateDepartamento(initialData.id, data);
        toast.success('Departamento actualizado correctamente');
      } else {
        await ubicacionesService.createDepartamento(data);
        toast.success('Departamento creado correctamente');
      }
      onSaved();
    } catch (error) {
      console.error('Error al guardar departamento:', error);
      toast.error('Error al guardar el departamento');
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
                <FormLabel>Nombre del Departamento *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Antioquia" {...field} />
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
                  <Input placeholder="Ej: 05" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pais_id"
            render={({ field }) => {
              const selected = paises.find(p => p.id === field.value);
              return (
                <FormItem>
                  <FormLabel>País *</FormLabel>
                  <Popover open={openPais} onOpenChange={setOpenPais}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPais}
                        className="w-full justify-between"
                      >
                        {selected ? selected.nombre : 'Seleccionar país'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar país..." className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                        <CommandList>
                          <CommandEmpty>No se encontraron países.</CommandEmpty>
                          <CommandGroup>
                            {paises.map((p) => (
                              <CommandItem
                                key={p.id}
                                onSelect={() => {
                                  form.setValue('pais_id', p.id, { shouldValidate: true, shouldDirty: true });
                                  setOpenPais(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn('mr-2 h-4 w-4', p.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                {p.nombre}
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

