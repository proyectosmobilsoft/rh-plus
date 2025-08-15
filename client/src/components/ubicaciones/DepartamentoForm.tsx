import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>País *</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paises.map((pais) => (
                      <SelectItem key={pais.id} value={pais.id.toString()}>
                        {pais.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
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
