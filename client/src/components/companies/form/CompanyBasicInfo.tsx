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
  import { useEffect } from "react";
  
  interface CompanyBasicInfoProps {
    form: UseFormReturn<CreateEmpresaDTO>;
  }
  
  const calculateNITVerificationDigit = (nit: string): number => {
    const factors = [41, 37, 29, 23, 19, 17, 13, 7, 3];
    const cleanNIT = nit.replace(/[^0-9]/g, '').padStart(9, '0');
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNIT[i]) * factors[i];
    }
    
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : remainder;
  };
  
  export function CompanyBasicInfo({ form }: CompanyBasicInfoProps) {
    useEffect(() => {
      const subscription = form.watch((value, { name }) => {
        if (name === 'nit_base' && value.nit_base) {
          const verificationDigit = calculateNITVerificationDigit(value.nit_base);
          form.setValue('nit_verification', verificationDigit.toString());
          form.setValue('nit', `${value.nit_base}-${verificationDigit}`);
        }
      });
  
      return () => subscription.unsubscribe();
    }, [form]);
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <FormField
              control={form.control}
              name="tipo_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nit">NIT</SelectItem>
                      <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                      <SelectItem value="pp">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
  
          <div className="col-span-5 grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <FormField
                control={form.control}
                name="nit_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Número de identificación" 
                        {...field}
                        maxLength={9}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 9) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-1">
              <FormField
                control={form.control}
                name="nit_verification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DV</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        readOnly
                        className="bg-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
  
          <div className="col-span-4">
            <FormField
              control={form.control}
              name="regimen_tributario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Régimen Tributario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="responsable_iva">Responsable de IVA</SelectItem>
                      <SelectItem value="no_responsable_iva">No Responsable de IVA</SelectItem>
                      <SelectItem value="regimen_simple">Régimen Simple de Tributación</SelectItem>
                      <SelectItem value="gran_contribuyente">Gran Contribuyente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
  
        <FormField
          control={form.control}
          name="razon_social"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razón Social</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }