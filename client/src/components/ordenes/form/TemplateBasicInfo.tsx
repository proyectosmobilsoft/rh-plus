import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateBasicInfoProps {
  form: UseFormReturn<any>;
  templateOption: string;
  onTemplateOptionChange: (value: string) => void;
}

export function TemplateBasicInfo({ form, templateOption, onTemplateOptionChange }: TemplateBasicInfoProps) {
  return (
    <div className="space-y-4">
      {/* Campos principales en grid de 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primera columna: Nombre y Descripción */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Plantilla *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={4}
                    className="min-h-[120px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Segunda columna: Switches y Tipo de Plantilla */}
        <div className="space-y-4">
          {/* Switches */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="esDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Plantilla Predeterminada</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Establecer como plantilla por defecto
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Plantilla Activa</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Habilitar esta plantilla para su uso
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Tipo de Plantilla */}
          <div>
            <label className="block font-medium mb-2 text-sm">Tipo de Plantilla</label>
            <Select value={templateOption} onValueChange={onTemplateOptionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Crear Nueva Plantilla</SelectItem>
                <SelectItem value="existing">Seleccionar Plantilla Existente</SelectItem>
                <SelectItem value="basic">Plantilla Básica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
} 