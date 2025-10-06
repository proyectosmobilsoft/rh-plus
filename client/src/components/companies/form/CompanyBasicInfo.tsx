import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
  } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
  import { UseFormReturn } from "react-hook-form";
  import { CreateEmpresaDTO } from "@/types/empresa";
  import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  
  interface CompanyBasicInfoProps {
    form: UseFormReturn<CreateEmpresaDTO>;
  }
  
  export function CompanyBasicInfo({ form }: CompanyBasicInfoProps) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="razon_social"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Razón Social</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIT</FormLabel>
              <FormControl>
                <Input placeholder="Número de identificación tributaria" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Documento</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full border rounded p-2"
                  onChange={e => field.onChange(e.target.value)}
                >
                  <option value="nit">NIT</option>
                  <option value="cc">Cédula de Ciudadanía</option>
                  <option value="ce">Cédula de Extranjería</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regimen_tributario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Régimen Tributario</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full border rounded p-2"
                  onChange={e => field.onChange(e.target.value)}
                >
                  <option value="responsable_iva">Responsable de IVA</option>
                  <option value="no_responsable_iva">No Responsable de IVA</option>
                  <option value="gran_contribuyente">Gran Contribuyente</option>
                  <option value="autorretenedor">Autorretenedor</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

