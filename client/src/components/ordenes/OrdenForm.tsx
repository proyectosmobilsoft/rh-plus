import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, User, Building, DollarSign, Clock, FileText, Users } from "lucide-react";
import { Orden } from '@/services/ordenesService';
import { empresasService } from '@/services/empresasService';
import { templatesService } from '@/services/templatesService';
import { EmpresaOrderTemplate, FieldConfiguration } from '@shared/schema';
import WorkScheduleBuilder from './WorkScheduleBuilder';
import { useQuery } from '@tanstack/react-query';
import { CustomDatePicker } from '@/components/ui/date-picker';

// Validation schema
const ordenSchema = z.object({
  nombres: z.string().min(2, "Nombres son requeridos"),
  apellidos: z.string().min(2, "Apellidos son requeridos"),
  tipoDocumento: z.string().min(1, "Tipo de documento requerido"),
  numeroDocumento: z.string().min(6, "Número de documento requerido"),
  lugarExpedicion: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  
  empresaUsuaria: z.string().optional(),
  ciudadPrestacionServicio: z.string().optional(),
  departamentoPrestacionServicio: z.string().optional(),
  
  cargo: z.string().min(2, "Cargo es requerido"),
  salario: z.string().optional(),
  ciudad: z.string().min(2, "Ciudad es requerida"),
  fechaIngreso: z.string().optional(),
  tipoContrato: z.string().optional(),
  
  salarioBasico: z.string().optional(),
  auxilioTransporte: z.string().optional(),
  viajeRotativo: z.boolean().default(false),
  
  vehiculoTransporte: z.string().optional(),
  vehiculoAlimentacion: z.string().optional(),
  
  salarioMensual: z.string().optional(),
  jornadaLaboral: z.string().optional(),
  pagosAuxilios: z.string().optional(),
  especificacionesAdicionales: z.string().optional(),
  
  estado: z.string().default("pendiente"),
  prioridad: z.string().default("media"),
  
  observaciones: z.string().optional(),
  notasInternas: z.string().optional(),
  
  centroTrabajo: z.string().optional(),
  areaFuncional: z.string().optional(),
  tipoExamen: z.string().optional(),
  examenMedicoRealizar: z.string().optional(),
  
  departamento: z.string().optional(),
  cumpleHorario: z.boolean().default(false),
  especifique: z.string().optional(),
});

interface OrdenFormProps {
  orden?: Orden;
  onSubmit: (data: Orden) => void;
  onCancel: () => void;
}

const OrdenForm: React.FC<OrdenFormProps> = ({ orden, onSubmit, onCancel }) => {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration>({});

  // Fetch companies for selector
  const { data: empresas = [] } = useQuery({
    queryKey: ['/api/empresas'],
    queryFn: () => empresasService.getAll()
  });

  // Fetch default template for selected company
  const { data: defaultTemplate } = useQuery({
    queryKey: ['/api/empresas', selectedEmpresaId, 'templates', 'default'],
    queryFn: () => selectedEmpresaId ? templatesService.getDefaultTemplate(selectedEmpresaId) : Promise.resolve(null),
    enabled: !!selectedEmpresaId
  });

  const form = useForm<z.infer<typeof ordenSchema>>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      nombres: orden?.nombres || "",
      apellidos: orden?.apellidos || "",
      tipoDocumento: orden?.tipoDocumento || "CC",
      numeroDocumento: orden?.numeroDocumento || "",
      lugarExpedicion: orden?.lugarExpedicion || "",
      celular: orden?.celular || "",
      direccion: orden?.direccion || "",
      
      empresaUsuaria: orden?.empresaUsuaria || "",
      ciudadPrestacionServicio: orden?.ciudadPrestacionServicio || "",
      departamentoPrestacionServicio: orden?.departamentoPrestacionServicio || "",
      
      cargo: orden?.cargo || "",
      salario: orden?.salario || "",
      ciudad: orden?.ciudad || "",
      fechaIngreso: orden?.fechaIngreso || "",
      tipoContrato: orden?.tipoContrato || "",
      
      salarioBasico: orden?.salarioBasico || "",
      auxilioTransporte: orden?.auxilioTransporte || "",
      viajeRotativo: orden?.viajeRotativo || false,
      
      vehiculoTransporte: orden?.vehiculoTransporte || "",
      vehiculoAlimentacion: orden?.vehiculoAlimentacion || "",
      
      salarioMensual: orden?.salarioMensual || "",
      jornadaLaboral: orden?.jornadaLaboral || "",
      pagosAuxilios: orden?.pagosAuxilios || "",
      especificacionesAdicionales: orden?.especificacionesAdicionales || "",
      
      estado: orden?.estado || "pendiente",
      prioridad: orden?.prioridad || "media",
      
      observaciones: orden?.observaciones || "",
      notasInternas: orden?.notasInternas || "",
      
      centroTrabajo: orden?.centroTrabajo || "",
      areaFuncional: orden?.areaFuncional || "",
      tipoExamen: orden?.tipoExamen || "",
      examenMedicoRealizar: orden?.examenMedicoRealizar || "",
      
      departamento: orden?.departamento || "",
      cumpleHorario: orden?.cumpleHorario || false,
      especifique: orden?.especifique || "",
    },
  });

  const [workSchedule, setWorkSchedule] = useState(orden?.jornadaLaboral || "");

  // Update field configuration when template changes
  useEffect(() => {
    if (defaultTemplate) {
      setFieldConfig(defaultTemplate.configuracionCampos);
    } else {
      // If no template, show all fields by default
      const allFieldsVisible: FieldConfiguration = {
        nombreTrabajador: { visible: true, required: false },
        cedulaTrabajador: { visible: true, required: true },
        empresaSeleccionada: { visible: true, required: true },
        cargoTrabajador: { visible: true, required: true },
        fechaIngreso: { visible: true, required: false },
        jornadaLaboral: { visible: true, required: false },
        salario: { visible: true, required: false },
        celular: { visible: true, required: false },
        correo: { visible: true, required: false },
        direccion: { visible: true, required: false },
        tipoExamen: { visible: true, required: false },
        observaciones: { visible: true, required: false }
      };
      setFieldConfig(allFieldsVisible);
    }
  }, [defaultTemplate]);

  const handleScheduleChange = (schedule: string) => {
    setWorkSchedule(schedule);
    form.setValue('jornadaLaboral', schedule);
  };

  // Function to check if a field should be visible
  const isFieldVisible = (fieldKey: keyof FieldConfiguration): boolean => {
    return fieldConfig[fieldKey]?.visible ?? true;
  };

  // Function to check if a field is required
  const isFieldRequired = (fieldKey: keyof FieldConfiguration): boolean => {
    return fieldConfig[fieldKey]?.required ?? false;
  };

  // Handle empresa selection
  const handleEmpresaChange = (empresaId: string) => {
    const id = parseInt(empresaId);
    setSelectedEmpresaId(id);
    form.setValue('empresaUsuaria', empresas.find(e => e.id === id)?.razon_social || '');
  };

  const handleSubmit = (data: z.infer<typeof ordenSchema>) => {
    const ordenData: Orden = {
      ...data,
      id: orden?.id,
      numeroOrden: orden?.numeroOrden,
    };
    onSubmit(ordenData);
  };

  return (
    <Form {...form}>
      <div className="transform scale-90 origin-top">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Información del Trabajador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Datos del Trabajador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombres completos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellidos completos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipoDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Documento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                        <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                        <SelectItem value="PEP">Permiso Especial de Permanencia</SelectItem>
                        <SelectItem value="VISA">Visa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numeroDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Documento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lugarExpedicion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar de Expedición</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad de expedición" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isFieldVisible('celular') && (
                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular {isFieldRequired('celular') && '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de celular" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isFieldVisible('direccion') && (
                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección {isFieldRequired('direccion') && '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección de residencia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              Empresa Usuaria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isFieldVisible('empresaSeleccionada') && (
                <FormField
                  control={form.control}
                  name="empresaUsuaria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa Usuaria {isFieldRequired('empresaSeleccionada') && '*'}</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Find the empresa and trigger template loading
                          const empresa = empresas.find(e => e.razon_social === value);
                          if (empresa) {
                            handleEmpresaChange(empresa.id.toString());
                          }
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.Id || empresa.id} value={empresa.razon_social}>
                              {empresa.razon_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="ciudadPrestacionServicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad Prestación del Servicio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="departamentoPrestacionServicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento Prestación del Servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="Departamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Información del Cargo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Información del Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isFieldVisible('cargoTrabajador') && (
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo {isFieldRequired('cargoTrabajador') ? '*' : ''}</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo a desempeñar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad de trabajo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isFieldVisible('fechaIngreso') && (
                <FormField
                  control={form.control}
                  name="fechaIngreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Ingreso {isFieldRequired('fechaIngreso') && '*'}</FormLabel>
                      <FormControl>
                        <CustomDatePicker
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            if (date) {
                              // Crear fecha local sin problemas de zona horaria
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const dateString = `${year}-${month}-${day}`;
                              field.onChange(dateString);
                            } else {
                              field.onChange('');
                            }
                          }}
                          placeholder="Seleccionar fecha de ingreso"
                          maxDate={new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="tipoContrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato</FormLabel>
                    <FormControl>
                      <Input placeholder="Tipo de contrato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Especificaciones para el Ingreso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Especificaciones para el Ingreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salarioBasico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salario Básico</FormLabel>
                    <FormControl>
                      <Input placeholder="$ 1,423,500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auxilioTransporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auxilio de Transporte</FormLabel>
                    <FormControl>
                      <Input placeholder="$ 200,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="viajeRotativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Viaje Rotativo</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehiculoTransporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo de Transporte</FormLabel>
                    <FormControl>
                      <Input placeholder="Tipo de vehículo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehiculoAlimentacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo de Alimentación</FormLabel>
                    <FormControl>
                      <Input placeholder="No aplica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salarioMensual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salario Mensual</FormLabel>
                  <FormControl>
                    <Input placeholder="$ 1,623,500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Jornada Laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Jornada Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="jornadaLaboral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jornada Laboral</FormLabel>
                  <FormControl>
                    <WorkScheduleBuilder 
                      value={field.value || ''} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cumpleHorario"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Cumple Horario</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="especifique"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Especificaciones adicionales" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pagos Adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Pagos o Auxilios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pagosAuxilios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagos o Auxilios</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa los pagos adicionales o auxilios"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Examen Médico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Examen Médico a Realizar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="examenMedicoRealizar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Examen Médico a Realizar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="VISITA DOMICILIARIA, PRUEBA PSICOTÉCNICA, EXAMEN DE INGRESO, COPROLOÓGICO, KOH DE UÑAS, FROTIS DE GARGANTA"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Especificaciones Adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Especificaciones Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="especificacionesAdicionales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especificaciones Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Especificaciones adicionales sobre la orden"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="APROBADA">Aprobada</SelectItem>
                        <SelectItem value="ANULADA">Anulada</SelectItem>
                        <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-8"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-8 bg-primary hover:bg-primary/90"
          >
            {orden ? 'Actualizar' : 'Crear'} Orden
          </Button>
        </div>
        </form>
      </div>
    </Form>
  );
};

export default OrdenForm;

