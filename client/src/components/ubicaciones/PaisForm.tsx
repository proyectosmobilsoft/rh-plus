import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ubicacionesService } from '@/services/ubicacionesService';
import { handleServiceError, logError } from '@/utils/errorHandler';

// Schema sin el campo estado
const paisSchema = z.object({
  nombre: z.string().min(1, 'El nombre del país es requerido'),
  codigo_iso: z.string().optional(),
});

type PaisFormData = z.infer<typeof paisSchema>;

interface PaisFormProps {
  initialData?: (PaisFormData & { id?: number }) | any;
  onSaved: () => void;
}

export function PaisForm({ initialData, onSaved }: PaisFormProps) {
  const form = useForm<PaisFormData>({
    resolver: zodResolver(paisSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      codigo_iso: initialData?.codigo_iso || '',
    },
  });

  const onSubmit = async (data: PaisFormData) => {
    try {
      if (initialData?.id) {
        await ubicacionesService.updatePais(initialData.id, data);
        toast.success('País actualizado correctamente');
      } else {
        await ubicacionesService.createPais(data);
        toast.success('País creado correctamente');
      }
      onSaved();
    } catch (error) {
      logError('PaisForm', error);
      const errorMessage = handleServiceError(error, 'Error al guardar el país', 'el país');
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del País *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Colombia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codigo_iso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código ISO</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: CO" {...field} />
                </FormControl>
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

