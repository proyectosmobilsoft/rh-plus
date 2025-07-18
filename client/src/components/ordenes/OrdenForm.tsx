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
  
  estado: z.string().default("PENDIENTE"),
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
      
      estado: orden?.estado || "PENDIENTE",
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaIngreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Ingreso</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Textarea
                      placeholder="Lunes a Viernes: 6:00-12:00 pm - 5pm, Sábados de 8am-12m"
                      {...field}
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
    </Form>
  );
};

export default OrdenForm;