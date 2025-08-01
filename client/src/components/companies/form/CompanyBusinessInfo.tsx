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
  import { Button } from "@/components/ui/button";
  import { Upload, Check, FileText } from "lucide-react";
  import { useState, useEffect } from "react";
  import { useToast } from "@/components/ui/use-toast";
  
  interface CompanyBusinessInfoProps {
    form: UseFormReturn<CreateEmpresaDTO>;
    existingDocuments: any[];
  }
  
  export function CompanyBusinessInfo({ form, existingDocuments }: CompanyBusinessInfoProps) {
    const { toast } = useToast();
    const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});
  
    const { data: codigosCIIU=[] } = useQuery({
      queryKey: ['codigos_ciiu'],
      queryFn: async () => {
        /*const { data, error } = await supabase
          .from('codigos_ciiu')
          .select('*')
          .order('codigo');
        
        if (error) throw error;
        return data;*/
      }
    });
  
    useEffect(() => {
      if (existingDocuments) {
        const files: {[key: string]: string} = {};
        existingDocuments.forEach((doc: {tipo: string, nombre_archivo: string}) => {
          files[doc.tipo] = doc.nombre_archivo;
        });
        setUploadedFiles(files);
      }
    }, [existingDocuments]);
  
    const handleCIIUChange = (codigo: string) => {
      const actividad = codigosCIIU?.find(c => c.codigo === codigo);
      if (actividad) {
        form.setValue('actividad_economica', actividad.codigo);
        form.setValue('actividad_nombre', actividad.descripcion);
      }
    };
  
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
      e.preventDefault();
      const file = e.target.files?.[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Solo se permiten archivos PDF",
          });
          return;
        }
  
        const documentos = form.getValues('documentos') || [];
        documentos.push({
          tipo,
          archivo: file,
          nombre: file.name
        });
        form.setValue('documentos', documentos);
        setUploadedFiles(prev => ({...prev, [tipo]: file.name}));
        
        toast({
          title: "Archivo seleccionado",
          description: `${file.name} ha sido seleccionado correctamente.`,
        });
      }
    };
  
    const getDocumentUrl = (tipo: string) => {
      if (!existingDocuments) return null;
      const doc: {url_archivo: string} = existingDocuments.find((d: {tipo: string}) => d.tipo === tipo);
      return doc ? doc.url_archivo : null;
    };
  
    // Mock de actividades económicas (CIIU) de Colombia
    const actividadesEconomicas = [
      { codigo: '0111', descripcion: 'Cultivo de cereales' },
      { codigo: '0112', descripcion: 'Cultivo de arroz' },
      { codigo: '0113', descripcion: 'Cultivo de hortalizas' },
      { codigo: '0141', descripcion: 'Cría de ganado bovino' },
      { codigo: '1011', descripcion: 'Procesamiento y conservación de carne' },
      { codigo: '1071', descripcion: 'Elaboración de productos de panadería' },
      { codigo: '2011', descripcion: 'Fabricación de sustancias químicas' },
      { codigo: '4711', descripcion: 'Comercio al por menor en establecimientos no especializados' },
      { codigo: '6201', descripcion: 'Actividades de desarrollo de sistemas informáticos' },
      { codigo: '8411', descripcion: 'Actividades de la administración pública' },
      { codigo: '8511', descripcion: 'Educación preescolar' },
      { codigo: '8610', descripcion: 'Actividades de hospitales' },
      { codigo: '9311', descripcion: 'Gestión de instalaciones deportivas' },
      { codigo: '9602', descripcion: 'Peluquería y otros tratamientos de belleza' },
    ];
  
    // Mock de ciudades principales de Colombia
    const ciudadesColombia = [
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Cartagena',
      'Cúcuta',
      'Bucaramanga',
      'Pereira',
      'Santa Marta',
      'Ibagué',
      'Manizales',
      'Villavicencio',
      'Neiva',
      'Pasto',
      'Montería',
      'Armenia',
      'Sincelejo',
      'Popayán',
      'Valledupar',
      'Tunja',
    ];
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="representante_legal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Representante Legal</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del representante legal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actividad_economica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actividad Económica (CIIU)</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full border rounded p-2"
                  onChange={e => field.onChange(e.target.value)}
                >
                  <option value="">Seleccione código CIIU</option>
                  <option value="0111">0111 - Cultivo de cereales</option>
                  <option value="0112">0112 - Cultivo de arroz</option>
                  <option value="0113">0113 - Cultivo de hortalizas</option>
                  <option value="0141">0141 - Cría de ganado bovino</option>
                  <option value="1011">1011 - Procesamiento y conservación de carne</option>
                  <option value="1071">1071 - Elaboración de productos de panadería</option>
                  <option value="2011">2011 - Fabricación de sustancias químicas</option>
                  <option value="4711">4711 - Comercio al por menor</option>
                  <option value="6201">6201 - Actividades de desarrollo de sistemas informáticos</option>
                  <option value="8411">8411 - Actividades de la administración pública</option>
                  <option value="8511">8511 - Educación preescolar</option>
                  <option value="8610">8610 - Actividades de hospitales</option>
                  <option value="9311">9311 - Gestión de instalaciones deportivas</option>
                  <option value="9602">9602 - Peluquería y otros tratamientos de belleza</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero_empleados"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Empleados</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }