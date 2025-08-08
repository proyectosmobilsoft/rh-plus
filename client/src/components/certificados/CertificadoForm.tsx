import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, Save, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Orden } from '@/services/ordenesService';
import { Aspirante, aspirantesService } from '@/services/aspirantesService';
import { certificadosService, Certificado } from '@/services/certificadosService';

// Define form schema
const certificadoFormSchema = z.object({
  conceptoMedico: z.string().min(1, { message: 'El concepto médico es requerido' }),
  paraclinicosTenidos: z.string().optional(),
  remision: z.string().min(1, { message: 'La remisión es requerida' }),
  reubicacion: z.string().min(1, { message: 'La reubicación es requerida' }),
  elementosProteccion: z.string().optional(),
  observaciones: z.string().optional(),
  vigilanciaEpidemiologica: z.object({
    cardiovascular: z.boolean().default(false),
    respiratorio: z.boolean().default(false),
    ergonomico: z.boolean().default(false),
    biologicos: z.boolean().default(false),
    dermatologico: z.boolean().default(false),
    visual: z.boolean().default(false),
    estilosVida: z.boolean().default(false),
    psicosocial: z.boolean().default(false),
  }),
  otros: z.string().optional(),
});

type CertificadoFormValues = z.infer<typeof certificadoFormSchema>;

interface CertificadoFormProps {
  orden: Orden;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CertificadoForm = ({ orden, onSubmit, onCancel }: CertificadoFormProps) => {
  const [aspirante, setAspirante] = useState<Aspirante | null>(null);
  const [aspiranteDetalles, setAspiranteDetalles] = useState<{ educacion: any[], experiencia: any[] }>({
    educacion: [],
    experiencia: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('aspirante');
  
  const form = useForm<CertificadoFormValues>({
    resolver: zodResolver(certificadoFormSchema),
    defaultValues: {
      conceptoMedico: '',
      paraclinicosTenidos: '',
      remision: 'No',
      reubicacion: 'No',
      elementosProteccion: '',
      observaciones: '',
      vigilanciaEpidemiologica: {
        cardiovascular: false,
        respiratorio: false,
        ergonomico: false,
        biologicos: false,
        dermatologico: false,
        visual: false,
        estilosVida: false,
        psicosocial: false,
      },
      otros: '',
    },
  });

  // Fetch aspirante details when component mounts
  useEffect(() => {
    const fetchAspiranteData = async () => {
      if (orden?.aspiranteId) {
        setIsLoading(true);
        try {
          const aspiranteId = orden.aspiranteId;
          if (aspiranteId) {
            // Get basic aspirante information
            const data = await aspirantesService.getById(aspiranteId);
            if (data) {
              console.log("Aspirante data:", data);
              setAspirante(data);
              
              // Get detailed information (education and experience)
              const detalles = await aspirantesService.getDetailById(aspiranteId);
              if (detalles) {
                console.log("Aspirante detalles:", detalles);
                setAspiranteDetalles(detalles);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching aspirante details:", error);
          toast.error("Error al cargar datos del aspirante");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAspiranteData();
  }, [orden]);

  const handleSubmit = async (data: CertificadoFormValues) => {
    setIsSaving(true);
    try {
      const certificadoData: Certificado = {
        ordenId: orden.id || 0,
        aspiranteId: orden.aspiranteId || 0,
        empresaId: orden.empresaId || 0,
        conceptoMedico: data.conceptoMedico,
        remision: data.remision,
        reubicacion: data.reubicacion,
        paraclinicosTenidos: data.paraclinicosTenidos,
        elementosProteccion: data.elementosProteccion,
        observaciones: data.observaciones,
        vigilanciaEpidemiologica: data.vigilanciaEpidemiologica,
        otros: data.otros,
        archivo: selectedFile ? selectedFile.name : undefined,
        fecha: new Date().toISOString(),
      };
      
      // Save to API
      const response = await certificadosService.guardar(certificadoData);
      
      if (response.status) {
        toast.success("Certificado guardado correctamente");
        onSubmit(certificadoData);
      } else {
        toast.error(response.mensaje || "Error al guardar el certificado");
      }
    } catch (error) {
      console.error("Error saving certificate:", error);
      toast.error("Error al guardar el certificado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview for the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      // Create a preview for the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="aspirante">Información del Aspirante</TabsTrigger>
            <TabsTrigger value="certificado">Certificado Médico</TabsTrigger>
            <TabsTrigger value="adjuntos">Documentos Adjuntos</TabsTrigger>
          </TabsList>
          
          {/* Tab de Información del Aspirante */}
          <TabsContent value="aspirante" className="p-4 border rounded-md">
            {isLoading ? (
              <div className="text-center py-8">Cargando información del aspirante...</div>
            ) : aspirante ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Datos Personales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-[120px_1fr] gap-y-2">
                        <dt className="font-medium text-muted-foreground">Nombres:</dt>
                        <dd>{aspirante.nombres}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Apellidos:</dt>
                        <dd>{aspirante.apellidos}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Documento:</dt>
                        <dd>{aspirante.tipoDocumento || aspirante.tipo_documento} {aspirante.numeroDocumento || aspirante.numero_documento}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Teléfono:</dt>
                        <dd>{aspirante.telefono || 'No registrado'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Email:</dt>
                        <dd>{aspirante.correoElectronico || aspirante.correo_electronico || 'No registrado'}</dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Adicional</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-[120px_1fr] gap-y-2">
                        <dt className="font-medium text-muted-foreground">Dirección:</dt>
                        <dd>{aspirante.direccion || 'No registrada'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Fecha Nac.:</dt>
                        <dd>{aspirante.fechaNacimiento || aspirante.fecha_nacimiento || 'No registrada'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Género:</dt>
                        <dd>{aspirante.sexo || 'No registrado'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Estado civil:</dt>
                        <dd>{aspirante.estadoCivil || aspirante.estado_civil || 'No registrado'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Ocupación:</dt>
                        <dd>{aspirante.cargoAspirado || aspirante.cargo_aspirado || 'No registrada'}</dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Seguridad Social</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-3 gap-4">
                      <div>
                        <dt className="font-medium text-muted-foreground">EPS</dt>
                        <dd>{aspirante.eps || 'No registrada'}</dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-muted-foreground">ARL</dt>
                        <dd>{aspirante.arl || 'No registrada'}</dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-muted-foreground">Pensiones</dt>
                        <dd>{aspirante.fondoPension || aspirante.fondo_pension || 'No registrada'}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                
                {/* Education Information */}
                {aspiranteDetalles.educacion && aspiranteDetalles.educacion.length > 0 && (
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Educación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aspiranteDetalles.educacion.map((item, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-muted-foreground">Título:</span> {item.titulo || 'No especificado'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Institución:</span> {item.institucion || 'No especificada'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Año:</span> {item.año || 'No especificado'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Nivel:</span> {item.nivel || 'No especificado'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Experience Information */}
                {aspiranteDetalles.experiencia && aspiranteDetalles.experiencia.length > 0 && (
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Experiencia Laboral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aspiranteDetalles.experiencia.map((item, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-muted-foreground">Empresa:</span> {item.empresa || 'No especificada'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Cargo:</span> {item.cargo || 'No especificado'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Periodo:</span> {item.fechaInicio ? `${item.fechaInicio} - ${item.fechaFin || 'Actual'}` : 'No especificado'}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Funciones:</span> {item.funciones || 'No especificadas'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontró información del aspirante.
              </div>
            )}
          </TabsContent>
          
          {/* Tab de Certificado Médico */}
          <TabsContent value="certificado" className="space-y-4 p-4 border rounded-md">
            <div className="bg-cyan-50 p-4 rounded-md border border-cyan-200 mb-4">
              <h3 className="text-cyan-700 font-medium mb-2">PARA DAR EL CONCEPTO DE APTITUD, SE TUVIERON EN CUENTA LOS SIGUIENTES PARACLÍNICOS:</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="paraclinicosTenidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paraclínicos</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese paraclínicos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="remision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remisión</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Si">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reubicación</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Si">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cyan-50 p-4 rounded-md border border-cyan-200 h-full">
                <h3 className="text-cyan-700 font-medium mb-2">USO DE ELEMENTOS DE PROTECCIÓN PERSONAL RECOMENDADO PARA LA LABOR ASIGNADA:</h3>
                <FormField
                  control={form.control}
                  name="elementosProteccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Ingrese recomendaciones de EPP" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-cyan-50 p-4 rounded-md border border-cyan-200 h-full">
                <h3 className="text-cyan-700 font-medium mb-2">CONCEPTO MÉDICO:</h3>
                <FormField
                  control={form.control}
                  name="conceptoMedico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-600">OBSERVACIONES:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ingrese el concepto médico" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="bg-cyan-50 p-4 rounded-md border border-cyan-200">
              <h3 className="text-cyan-700 font-medium mb-2">Recomendaciones Generales:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Cumplir con las normas de protección, seguridad industrial y seguridad vial encaminadas a prevenir la accidentalidad.</li>
                <li>
                  Recomendaciones de hábitos de vida saludable:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Alimentación fraccionada y sana, disminuir consumo de sal, azúcares simples, refinados, grasas saturadas de origen animal, incrementar el consumo de legumbres, frutas y agua.</li>
                    <li>Mantenerse activo(a), realizar actividad física regular aeróbica 40 minutos por día mínimo 4 veces por semana.</li>
                  </ul>
                </li>
                <li>Higiene postural, pausas activas, realizar ejercicios de estiramiento músculo-tendinoso del sistema esquelético axial y apendicular.</li>
                <li>Utilizar los elementos de protección personal (EPP) de acuerdo a matriz de peligros.</li>
                <li>Notificar oportunamente los accidentes o incidentes laborales.</li>
                <li>
                  Reafirmo medidas de bioseguridad, atendiendo las recomendaciones y lineamientos expedidos por el Ministerio de Salud y Protección Social, especialmente los referidos en el "Protocolo de bioseguridad para el manejo y el control del riesgo del Coronavirus COVID 19 en la prestación de los servicios de salud" (Resolución 1155 de 2020):
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Lavado manos con agua y jabón en sus 5 momentos.</li>
                    <li>Para la protección de los ojos, se sugiere el uso de gafas de montura universal con protección lateral.</li>
                    <li>La correcta colocación de los EPP es fundamental para evitar posibles vías de entrada del agente biológico; igualmente importante es la retirada de éstos para evitar el contacto con zonas contaminadas y/o dispersión del agente infeccioso.</li>
                  </ul>
                </li>
                <li>Informar a su jefe inmediato en caso de presentar síntomas respiratorios, tos, rinorrea, fiebre, dificultad para respirar.</li>
                <li>Asesoría en normas de prevención y protección de los efectos nocivos que para la salud tiene la exposición prolongada y sin la debida protección a la radiación solar (Uso del protector solar). Pautas para la realización de Auto-examen de piel para la detección temprana del Cáncer de piel.</li>
                <li>Cumplir con el esquema de vacunación obligatorio para el personal de salud y afines de acuerdo a los lineamientos de la Secretaría de Salud Pública de Santiago de Cali.</li>
              </ol>
            </div>
            
            <div className="bg-cyan-50 p-4 rounded-md border border-cyan-200">
              <h3 className="text-cyan-700 font-medium mb-2">Vigilancia Epidemiológica:</h3>
              
              <div className="bg-gray-100 text-center p-2 rounded mb-4">
                <p className="font-medium">INCLUIR EN SISTEMAS DE VIGILANCIA EPIDEMIOLÓGICA</p>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.cardiovascular"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">CARDIOVASCULAR</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.respiratorio"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">RESPIRATORIO</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.ergonomico"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">ERGONÓMICO</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.biologicos"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">BIOLÓGICOS</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.dermatologico"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">DERMATOLÓGICO</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.visual"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">VISUAL</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.estilosVida"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">ESTILOS DE VIDA</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vigilanciaEpidemiologica.psicosocial"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">PSICOSOCIAL</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="otros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTROS:</FormLabel>
                      <FormControl>
                        <Input placeholder="Especifique otros sistemas de vigilancia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-center italic">
                Bajo la gravedad del juramento afirmo que toda la información anteriormente suministrada es correcta y que no he ocultado nada sobre mi historia de salud.
              </p>
              <p className="text-sm text-center italic mt-2">
                Nota: en caso de existir alguna inexactitud por omisión o a causa del interesado, se hará acreedor a las sanciones previstas por la ley.
              </p>
            </div>
          </TabsContent>
          
          {/* Tab de Documentos Adjuntos */}
          <TabsContent value="adjuntos" className="p-4 border rounded-md">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos adjuntos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-2">Adjuntar documento</label>
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500 mb-1 text-center">
                          Haga clic para seleccionar un archivo o arrástrelo aquí
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                          PDF, DOC, DOCX, JPG, PNG (Máx. 10MB)
                        </p>
                        <input 
                          id="file-upload"
                          type="file" 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                    
                    {selectedFile && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium flex items-center mb-1">
                              Archivo seleccionado:
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                                <p className="text-xs text-gray-400">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedFile(null);
                                  setFilePreview(null);
                                }}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Save button specifically on this tab */}
                    <div className="flex justify-end mt-6">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Certificado'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          {activeTab !== 'adjuntos' && (
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Certificado'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default CertificadoForm;
