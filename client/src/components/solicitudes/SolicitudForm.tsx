import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Building, DollarSign, FileText } from 'lucide-react';
import { Solicitud } from '@/services/solicitudesService';
import { validateTipoDocumento, validateNumeroDocumento, validateTextField, validateEmail } from '@/utils/validationUtils';
import { CustomDatePicker } from '@/components/ui/date-picker';

// Esquema de validación para crear solicitud
const solicitudSchema = z.object({
  nombres: z.string().min(2, "Los nombres son requeridos"),
  apellidos: z.string().min(2, "Los apellidos son requeridos"),
  tipoDocumento: z.string()
    .min(1, "Tipo de documento requerido")
    .refine((val) => {
      const validation = validateTipoDocumento(val);
      return validation.isValid;
    }, (val) => {
      const validation = validateTipoDocumento(val);
      return { message: validation.error || "Tipo de documento inválido" };
    }),
  numeroDocumento: z.string()
    .min(6, "Número de documento requerido")
    .refine((val) => {
      const validation = validateNumeroDocumento(val);
      return validation.isValid;
    }, (val) => {
      const validation = validateNumeroDocumento(val);
      return { message: validation.error || "Número de documento inválido" };
    }),
  lugarExpedicion: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  
  empresaUsuaria: z.string().optional(),
  ciudadPrestacionServicio: z.string().optional(),
  departamentoPrestacionServicio: z.string().optional(),
  
  cargo: z.string().min(2, "El cargo es requerido"),
  salario: z.string().optional(),
  ciudad: z.string().min(2, "La ciudad es requerida"),
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

type SolicitudFormData = z.infer<typeof solicitudSchema>;

interface SolicitudFormProps {
  solicitud?: Solicitud;
  onSubmit: (data: SolicitudFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const SolicitudForm: React.FC<SolicitudFormProps> = ({ 
  solicitud, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  readOnly = false
}) => {
  const form = useForm<SolicitudFormData>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      nombres: solicitud?.nombres || "",
      apellidos: solicitud?.apellidos || "",
      tipoDocumento: solicitud?.tipoDocumento || "CC",
      numeroDocumento: solicitud?.numeroDocumento || "",
      lugarExpedicion: solicitud?.lugarExpedicion || "",
      celular: solicitud?.celular || "",
      direccion: solicitud?.direccion || "",
      empresaUsuaria: solicitud?.empresaUsuaria || "",
      ciudadPrestacionServicio: solicitud?.ciudadPrestacionServicio || "",
      departamentoPrestacionServicio: solicitud?.departamentoPrestacionServicio || "",
      cargo: solicitud?.cargo || "",
      salario: solicitud?.salario || "",
      ciudad: solicitud?.ciudad || "",
      fechaIngreso: solicitud?.fechaIngreso || "",
      tipoContrato: solicitud?.tipoContrato || "",
      salarioBasico: solicitud?.salarioBasico || "",
      auxilioTransporte: solicitud?.auxilioTransporte || "",
      viajeRotativo: solicitud?.viajeRotativo || false,
      vehiculoTransporte: solicitud?.vehiculoTransporte || "",
      vehiculoAlimentacion: solicitud?.vehiculoAlimentacion || "",
      salarioMensual: solicitud?.salarioMensual || "",
      jornadaLaboral: solicitud?.jornadaLaboral || "",
      pagosAuxilios: solicitud?.pagosAuxilios || "",
      especificacionesAdicionales: solicitud?.especificacionesAdicionales || "",
      estado: solicitud?.estado || "pendiente",
      prioridad: solicitud?.prioridad || "media",
      observaciones: solicitud?.observaciones || "",
      notasInternas: solicitud?.notasInternas || "",
      centroTrabajo: solicitud?.centroTrabajo || "",
      areaFuncional: solicitud?.areaFuncional || "",
      tipoExamen: solicitud?.tipoExamen || "",
      examenMedicoRealizar: solicitud?.examenMedicoRealizar || "",
      departamento: solicitud?.departamento || "",
      cumpleHorario: solicitud?.cumpleHorario || false,
      especifique: solicitud?.especifique || "",
    },
  });

  const handleSubmit = (data: SolicitudFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <fieldset disabled={readOnly} className={readOnly ? 'opacity-90 pointer-events-none' : ''}>
          {/* Información del Trabajador */}
          <div className="p-4 border rounded-lg bg-slate-50 mb-4">
            <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Datos del Trabajador
            </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField
                control={form.control}
                name="tipoDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Documento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de celular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección de residencia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Información de la Empresa */}
          <div className="p-4 border rounded-lg bg-slate-50 mb-4">
            <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600" />
              Información de la Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="empresaUsuaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Usuaria</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ciudadPrestacionServicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad de Prestación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad donde presta servicio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Información del Cargo */}
          <div className="p-4 border rounded-lg bg-slate-50 mb-4">
            <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Información del Cargo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cargo a desempeñar" {...field} />
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
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad de trabajo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="fechaIngreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Ingreso</FormLabel>
                    <FormControl>
                      <CustomDatePicker
                        value={field.value ? new Date(field.value + 'T00:00:00') : null}
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
          </div>

          {/* Estado y Prioridad */}
          <div className="p-4 border rounded-lg bg-cyan-50 mb-4">
            <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              Estado y Prioridad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="APROBADA">Aprobada</SelectItem>
                        <SelectItem value="RECHAZADA">Rechazada</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
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
          </div>

          {/* Observaciones */}
          <div className="p-4 border rounded-lg bg-slate-50 mb-4">
            <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Observaciones
            </h3>
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales sobre la solicitud"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {!readOnly && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : (solicitud ? 'Actualizar' : 'Guardar')}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default SolicitudForm; 

