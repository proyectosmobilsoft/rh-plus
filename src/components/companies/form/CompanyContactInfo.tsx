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
  import { useQuery } from "@tanstack/react-query";
  
  interface CompanyContactInfoProps {
    form: UseFormReturn<CreateEmpresaDTO>;
  }
  
  export function CompanyContactInfo({ form }: CompanyContactInfoProps) {
    const { data: ciudades=[] } = useQuery({
      queryKey: ['ciudades'],
      queryFn: async () => {
       /* const { data, error } = await supabase
          .from('ciudades')
          .select(`
            *,
            departamentos (
              nombre
            )
          `)
          .order('nombre');
        
        if (error) throw error;
        return data;*/
      }
    });
  
    const handleCiudadChange = (codigo: string) => {
      const ciudad = ciudades?.find(c => c.codigo === codigo);
      if (ciudad) {
        form.setValue('ciudad', ciudad.codigo);
        form.setValue('ciudad_nombre', ciudad.nombre);
        form.setValue('departamento_nombre', ciudad.departamentos.nombre);
      }
    };
  
    return (
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Dirección de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={form.control}
          name="ciudad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <Select onValueChange={handleCiudadChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una ciudad">
                      {field.value && ciudades?.find(c => c.codigo === field.value)?.nombre} 
                      {field.value && ` - ${ciudades?.find(c => c.codigo === field.value)?.departamentos.nombre}`}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ciudades?.map((ciudad) => (
                    <SelectItem key={ciudad.id} value={ciudad.codigo}>
                      {ciudad.codigo} - {ciudad.nombre} - {ciudad.departamentos.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Teléfono de contacto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
  
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email de contacto" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }