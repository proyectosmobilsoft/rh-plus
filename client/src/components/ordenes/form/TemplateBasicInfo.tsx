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
    <div className="space-y-6">
      {/* Campos principales en grid de 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primera columna: Nombre */}
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
        </div>

        {/* Segunda columna: Tipo de Plantilla */}
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2 text-sm">Tipo de Plantilla</label>
            <Select value={templateOption} onValueChange={onTemplateOptionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Crear Nueva Plantilla</SelectItem>
                {/*<SelectItem value="existing">Seleccionar Plantilla Existente</SelectItem>*/}
                <SelectItem value="basic">Plantilla Básica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Campo Descripción en ancho completo */}
      <div className="w-full">
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={3}
                  className="min-h-[80px] max-h-[120px] resize-y"
                  placeholder="Ingrese una descripción para la plantilla..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 