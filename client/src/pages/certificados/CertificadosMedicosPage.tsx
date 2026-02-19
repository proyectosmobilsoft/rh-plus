import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Search, Filter, Eye, Save, X, Upload } from "lucide-react";
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Solicitud, solicitudesService } from '@/services/solicitudesService';
import { certificadosMedicosService, CertificadoMedicoFormData } from '@/services/certificadosMedicosService';
import { supabase } from '@/services/supabaseClient';
import { emailService } from '@/services/emailService';
import { Can, usePermissions } from '@/contexts/PermissionsContext';


const CertificadosMedicosPage = () => {
  const { hasAction } = usePermissions();
  const [activeTab, setActiveTab] = useState("listado");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'apto' | 'no-apto' | 'aprobar' | 'no-aprobar' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);

  // Estados para el adjunto de aprobación
  const [adjuntoAprobacion, setAdjuntoAprobacion] = useState<File | null>(null);
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null);
  const [isUploadingAdjunto, setIsUploadingAdjunto] = useState(false);

  // Estados del formulario de certificado médico
  const [formData, setFormData] = useState({
    nombresApellidos: '',
    identificacion: '',
    cargo: '',
    area: '',
    eps: '',
    arl: '',
    restriccionMacro: '',
    resumenRestriccion: '',
    remision: 'no',
    requiereMedicacion: 'no',
    elementosProteccionPersonal: '',
    recomendacionesGenerales: ''
  });

  // Estados para el documento del concepto médico
  const [documentoConceptoMedico, setDocumentoConceptoMedico] = useState<File | null>(null);
  const [documentoPreview, setDocumentoPreview] = useState<string | null>(null);
  const [isUploadingDocumento, setIsUploadingDocumento] = useState(false);
  const [acordeonAbierto, setAcordeonAbierto] = useState<string[]>(['documento-medico']);

  // Función para convertir archivo a Base64 (igual que en perfil candidato)
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para manejar el cambio de archivo del concepto médico
  const handleDocumentoConceptoMedicoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo (PDF, imágenes)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, JPEG o PNG');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 10MB');
      return;
    }

    setIsUploadingDocumento(true);
    try {
      // Convertir a base64
      const base64 = await convertFileToBase64(file);
      const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,

      setDocumentoConceptoMedico(file);
      setDocumentoPreview(base64Data);

      toast.success('Documento cargado exitosamente');
    } catch (error) {
      console.error('Error procesando archivo:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setIsUploadingDocumento(false);
    }
  };

  // Función para eliminar el documento
  const handleRemoveDocumento = () => {
    setDocumentoConceptoMedico(null);
    setDocumentoPreview(null);
    // Limpiar el input file
    const fileInput = document.getElementById('documento-concepto-medico') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Función para manejar el cambio de archivo del adjunto de aprobación
  const handleAdjuntoAprobacionChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo (PDF, imágenes)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, JPEG o PNG');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 10MB');
      return;
    }

    setIsUploadingAdjunto(true);
    try {
      // Convertir a base64
      const base64 = await convertFileToBase64(file);
      const base64Data = base64.split(',')[1]; // Remover el prefijo data:application/pdf;base64,

      setAdjuntoAprobacion(file);
      setAdjuntoPreview(base64Data);

      toast.success('Adjunto cargado exitosamente');
    } catch (error) {
      console.error('Error procesando archivo:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setIsUploadingAdjunto(false);
    }
  };

  // Función para eliminar el adjunto de aprobación
  const handleRemoveAdjunto = () => {
    setAdjuntoAprobacion(null);
    setAdjuntoPreview(null);
    // Limpiar el input file
    const fileInput = document.getElementById('adjunto-aprobacion') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Fetch solicitudes when component mounts
  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Filtrar solicitudes
  const filteredSolicitudes = solicitudes
    .filter(solicitud => {
      const matchesSearch =
        solicitud.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solicitud.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solicitud.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (solicitud as any).empresas?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solicitud.empresa_usuaria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solicitud.id?.toString().includes(searchTerm);

      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "pendiente" ? solicitud.estado === 'pendiente documentos' :
          statusFilter === "documentos" ? solicitud.estado === 'documentos entregados' :
            statusFilter === "citado" ? solicitud.estado === 'citado examenes' :
              statusFilter === "restricciones" ? solicitud.estado === 'validacion cliente' :
                statusFilter === "descartado" ? solicitud.estado === 'descartado' :
                  true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Ordenar por fecha de solicitud (más recientes primero)
      const dateA = new Date(a.fecha_solicitud || 0);
      const dateB = new Date(b.fecha_solicitud || 0);
      return dateB.getTime() - dateA.getTime();
    });

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Obtener todas las solicitudes
      const data = await solicitudesService.getAll();

      // Obtener IDs de solicitudes que ya tienen certificados médicos
      const { data: certificadosExistentes, error: certificadosError } = await supabase
        .from('certificados_medicos')
        .select('solicitud_id');

      if (certificadosError) {
        console.error('Error obteniendo certificados existentes:', certificadosError);
        throw certificadosError;
      }

      const idsConCertificados = new Set(certificadosExistentes?.map(c => c.solicitud_id) || []);

      // Verificar si el usuario tiene el permiso campo-resumen-restriccion
      const tienePermisoRestriccion = hasAction('campo-resumen-restriccion');
      console.log('🔍 Usuario tiene permiso campo-resumen-restriccion:', tienePermisoRestriccion);

      // Filtrar solicitudes según el permiso del usuario
      const solicitudesParaCertificacion = data.filter(solicitud => {
        // Si tiene permiso de restricción, solo mostrar solicitudes en 'validacion cliente' (con restricciones)
        if (tienePermisoRestriccion) {
          return solicitud.estado === 'validacion cliente';
        }

        // Si NO tiene el permiso, mostrar solicitudes normales (flujo estándar)
        const esEstadoValido = (solicitud.estado === 'documentos entregados' ||
          solicitud.estado === 'pendiente documentos' ||
          solicitud.estado === 'citado examenes' ||
          solicitud.estado === 'validacion cliente');

        if (solicitud.estado === 'validacion cliente') {
          // Para validacion cliente, siempre mostrar (necesita acciones Aprobar/No Aprobar)
          return esEstadoValido;
        } else {
          // Para otros estados, solo mostrar si NO tienen certificado médico
          return esEstadoValido && !idsConCertificados.has(solicitud.id!);
        }
      });

      console.log(`📊 Solicitudes filtradas: ${solicitudesParaCertificacion.length} de ${data.length}`);
      setSolicitudes(solicitudesParaCertificacion);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApto = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setModalType('apto');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleNoApto = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setModalType('no-apto');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleAprobar = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setModalType('aprobar');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleNoAprobar = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setModalType('no-aprobar');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleSeleccionar = async (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);

    try {
      // Obtener datos del candidato desde la relación
      let nombresApellidos = '';
      let identificacion = '';

      if (solicitud.candidato_id && (solicitud as any).candidatos) {
        const candidato = (solicitud as any).candidatos;
        nombresApellidos = `${candidato.primer_nombre || ''} ${candidato.segundo_nombre || ''} ${candidato.primer_apellido || ''} ${candidato.segundo_apellido || ''}`.trim();
        identificacion = candidato.numero_documento || '';
      } else {
        // Fallback a los datos de la solicitud si no hay relación
        nombresApellidos = `${solicitud.nombres || ''} ${solicitud.apellidos || ''}`.trim();
        identificacion = solicitud.numero_documento || '';
      }

      // Obtener el nombre del cargo desde la relación tipos_candidatos
      let nombreCargo = '';
      if ((solicitud as any).tipos_candidatos?.nombre) {
        nombreCargo = (solicitud as any).tipos_candidatos.nombre;
      } else if (solicitud.cargo) {
        // Si no hay relación, usar el cargo directo (puede ser nombre o ID)
        nombreCargo = solicitud.cargo;
      } else if (solicitud.estructura_datos?.cargo) {
        // Si no hay relación, usar el cargo de estructura_datos (puede ser nombre o ID)
        nombreCargo = solicitud.estructura_datos.cargo;
      }

      // Si es validacion cliente, cargar datos del certificado médico existente
      if (solicitud.estado === 'validacion cliente') {
        try {
          const certificadoExistente = await certificadosMedicosService.getBySolicitudId(solicitud.id!);
          if (certificadoExistente) {
            // Llenar el formulario con los datos del certificado existente
            setFormData({
              nombresApellidos,
              identificacion,
              cargo: nombreCargo,
              area: solicitud.estructura_datos?.area || '',
              eps: solicitud.estructura_datos?.eps || '',
              arl: solicitud.estructura_datos?.arl || '',
              restriccionMacro: certificadoExistente.restriccion_macro || '',
              resumenRestriccion: certificadoExistente.resumen_restriccion || '',
              remision: certificadoExistente.remision ? 'si' : 'no',
              requiereMedicacion: certificadoExistente.requiere_medicacion ? 'si' : 'no',
              elementosProteccionPersonal: certificadoExistente.elementos_proteccion_personal || '',
              recomendacionesGenerales: certificadoExistente.recomendaciones_generales || ''
            });
          } else {
            // Si no hay certificado, usar datos vacíos
            setFormData({
              nombresApellidos,
              identificacion,
              cargo: nombreCargo,
              area: solicitud.estructura_datos?.area || '',
              eps: solicitud.estructura_datos?.eps || '',
              arl: solicitud.estructura_datos?.arl || '',
              restriccionMacro: '',
              resumenRestriccion: '',
              remision: 'no',
              requiereMedicacion: 'no',
              elementosProteccionPersonal: '',
              recomendacionesGenerales: ''
            });
          }
        } catch (error) {
          console.error('Error cargando certificado existente:', error);
          // En caso de error, usar datos vacíos
          setFormData({
            nombresApellidos,
            identificacion,
            cargo: nombreCargo,
            area: solicitud.estructura_datos?.area || '',
            eps: solicitud.estructura_datos?.eps || '',
            arl: solicitud.estructura_datos?.arl || '',
            restriccionMacro: '',
            resumenRestriccion: '',
            remision: 'no',
            requiereMedicacion: 'no',
            elementosProteccionPersonal: '',
            recomendacionesGenerales: ''
          });
        }
      } else {
        // Para otros estados, llenar con datos vacíos (crear nuevo certificado)
        setFormData({
          nombresApellidos,
          identificacion,
          cargo: nombreCargo,
          area: solicitud.estructura_datos?.area || '',
          eps: solicitud.estructura_datos?.eps || '',
          arl: solicitud.estructura_datos?.arl || '',
          restriccionMacro: '',
          resumenRestriccion: '',
          remision: 'no',
          requiereMedicacion: 'no',
          elementosProteccionPersonal: '',
          recomendacionesGenerales: ''
        });
      }

      setActiveTab("registro");
    } catch (error) {
      console.error('Error obteniendo datos del candidato:', error);
      toast.error('Error al cargar los datos del candidato');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitudSeleccionada) {
      toast.error('No hay solicitud seleccionada');
      return;
    }

    try {
      // Preparar datos del certificado médico incluyendo el documento
      const certificadoData = {
        ...formData,
        documento_concepto_medico: documentoPreview, // Base64 del documento
        solicitud_id: solicitudSeleccionada.id,
        candidato_id: solicitudSeleccionada.candidato_id
      };

      console.log('Datos del certificado médico:', certificadoData);

      // Guardar en la base de datos
      const { error } = await supabase
        .from('certificados_medicos')
        .upsert(certificadoData);

      if (error) {
        console.error('Error guardando certificado médico:', error);
        toast.error('Error al guardar el certificado médico');
        return;
      }

      toast.success('Certificado médico guardado correctamente');

      // Limpiar el formulario
      setFormData({
        nombresApellidos: '',
        identificacion: '',
        cargo: '',
        area: '',
        eps: '',
        arl: '',
        restriccionMacro: '',
        resumenRestriccion: '',
        remision: 'no',
        requiereMedicacion: 'no',
        elementosProteccionPersonal: '',
        recomendacionesGenerales: ''
      });
      setDocumentoConceptoMedico(null);
      setDocumentoPreview(null);

    } catch (error) {
      console.error('Error al guardar el certificado médico:', error);
      toast.error('Error al guardar el certificado médico');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConceptoMedico = (tipo: 'apto' | 'no-apto' | 'apto-con-restricciones') => {
    if (!solicitudSeleccionada) {
      toast.error('No hay solicitud seleccionada');
      return;
    }

    setSelectedSolicitud(solicitudSeleccionada);
    setModalType(tipo as 'apto' | 'no-apto');
    setObservaciones('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSolicitud(null);
    setModalType(null);
    setObservaciones('');
    // Limpiar adjunto de aprobación
    setAdjuntoAprobacion(null);
    setAdjuntoPreview(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedSolicitud || !modalType) return;

    setIsConfirming(true);
    try {
      // Determinar el nuevo estado según el concepto médico
      let nuevoEstado = '';
      let conceptoMedico: 'apto' | 'no-apto' | 'apto-con-restricciones' = 'apto';

      if (modalType === 'apto') {
        nuevoEstado = 'firma contrato';
        conceptoMedico = 'apto';
      } else if (modalType === 'no-apto') {
        nuevoEstado = 'descartado';
        conceptoMedico = 'no-apto';
      } else if (modalType === 'aprobar') {
        nuevoEstado = 'firma contrato';
        conceptoMedico = 'apto';
      } else if (modalType === 'no-aprobar') {
        nuevoEstado = 'descartado';
        conceptoMedico = 'no-apto';
      } else {
        // apto-con-restricciones
        nuevoEstado = 'validacion cliente';
        conceptoMedico = 'apto-con-restricciones';
      }

      // Crear el certificado médico
      const certificadoData = {
        solicitud_id: selectedSolicitud.id!,
        candidato_id: selectedSolicitud.candidato_id!,
        restriccion_macro: formData.restriccionMacro,
        resumen_restriccion: formData.resumenRestriccion,
        remision: formData.remision === 'si',
        requiere_medicacion: formData.requiereMedicacion === 'si',
        elementos_proteccion_personal: formData.elementosProteccionPersonal,
        recomendaciones_generales: formData.recomendacionesGenerales,
        observaciones: observaciones,
        concepto_medico: conceptoMedico,
        documento_concepto_medico: documentoPreview // Agregar el documento adjuntado
      };

      // Guardar el certificado médico
      const certificadoCreado = await certificadosMedicosService.create(certificadoData);

      // Si hay adjunto de aprobación, actualizar el certificado con el adjunto
      if (adjuntoPreview && (modalType === 'aprobar' || modalType === 'no-aprobar')) {
        try {
          await supabase
            .from('certificados_medicos')
            .update({ adjunto_aprobacion_certificado: adjuntoPreview })
            .eq('solicitud_id', selectedSolicitud.id);
        } catch (error) {
          console.error('Error guardando adjunto de aprobación:', error);
          // No fallar la operación principal por error de adjunto
        }
      }

      // Actualizar el estado de la solicitud
      // Si se marca como apto y pasa a "firma contrato", guardar en previous_state
      const updateData: any = {
        estado: nuevoEstado
      };

      if ((modalType === 'apto' || modalType === 'aprobar') && nuevoEstado === 'firma contrato') {
        updateData.previous_state = 'firma contrato';
      }

      await solicitudesService.update(selectedSolicitud.id!, updateData);

      // Si se descarta por restricciones, enviar email al candidato
      if (modalType === 'no-aprobar') {
        try {
          // Obtener datos del candidato para el email
          const candidatoNombre = selectedSolicitud.nombres && selectedSolicitud.apellidos
            ? `${selectedSolicitud.nombres} ${selectedSolicitud.apellidos}`
            : 'Candidato';

          const empresaNombre = (selectedSolicitud as any).empresas?.razon_social || selectedSolicitud.empresa_usuaria || 'Empresa';

          // Obtener email del candidato
          const { data: candidatoData } = await supabase
            .from('candidatos')
            .select('email')
            .eq('id', selectedSolicitud.candidato_id)
            .single();

          if (candidatoData?.email) {
            await emailService.sendDescartadoPorRestricciones({
              to: candidatoData.email,
              candidatoNombre,
              empresaNombre,
              solicitudId: selectedSolicitud.id!,
              observaciones: observaciones || 'Restricciones médicas detectadas en los exámenes'
            });
          }
        } catch (emailError) {
          console.error('Error enviando email de descarte:', emailError);
          // No fallar la operación principal por error de email
        }
      }

      toast.success(`Certificado médico guardado y solicitud actualizada a "${nuevoEstado}" correctamente.`);

      // Limpiar estados
      setIsModalOpen(false);
      setSelectedSolicitud(null);
      setModalType(null);
      setObservaciones('');
      setSolicitudSeleccionada(null);
      setActiveTab("listado");

      // Refrescar la lista de solicitudes
      fetchSolicitudes();
    } catch (error) {
      console.error('Error guardando certificado médico:', error);
      toast.error('Error al guardar el certificado médico');
    } finally {
      setIsConfirming(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    // Mostrar "CITADO EXAMENES MEDICOS" para solicitudes en "pendiente documentos", "documentos entregados" y "citado examenes"
    if (estado === 'pendiente documentos' || estado === 'documentos entregados' || estado === 'citado examenes') {
      return 'secondary';
    }
    if (estado === 'validacion cliente') {
      return 'destructive';
    }
    if (estado === 'firma contrato') {
      return 'secondary';
    }
    return 'outline';
  };

  const getEstadoBadgeClass = (estado: string) => {
    // Mostrar "CITADO EXAMENES MEDICOS" para solicitudes en "pendiente documentos", "documentos entregados" y "citado examenes"
    if (estado === 'pendiente documentos' || estado === 'documentos entregados' || estado === 'citado examenes') {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (estado === 'validacion cliente') {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    if (estado === 'firma contrato') {
      return "bg-purple-100 text-purple-800 border-purple-300";
    }
    if (estado === 'descartado') {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (estado === 'deserto') {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-gray-200 text-gray-600 border-gray-300";
  };

  const getEstadoBadgeText = (estado: string) => {
    // Mostrar "CITADO EXAMENES MEDICOS" para solicitudes en "pendiente documentos", "documentos entregados" y "citado examenes"
    if (estado === 'pendiente documentos' || estado === 'documentos entregados' || estado === 'citado examenes') {
      return 'Citado Exámenes Médicos';
    }
    if (estado === 'validacion cliente') {
      return 'Con Restricciones y/o Recomendación';
    }
    return estado;
  };

  const getRowBackgroundColor = (estado: string) => {
    if (estado === 'pendiente documentos' || estado === 'documentos entregados' || estado === 'citado examenes') {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    if (estado === 'validacion cliente') {
      return 'bg-orange-50 hover:bg-orange-100';
    }
    if (estado === 'firma contrato') {
      return 'bg-purple-50 hover:bg-purple-100';
    }
    if (estado === 'descartado') {
      return 'bg-red-50 hover:bg-red-100';
    }
    if (estado === 'deserto') {
      return 'bg-red-50 hover:bg-red-100';
    }
    return 'bg-white hover:bg-gray-50';
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Gestión de Certificados Médicos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="listado"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Solicitudes
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Certificado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="mt-6">
          {/* Header similar al diseño de tipos de documentos */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">CERTIFICADOS MÉDICOS</span>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, cargo, empresa, consecutivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las solicitudes</SelectItem>
                    <SelectItem value="pendiente">Pendiente Documentos</SelectItem>
                    <SelectItem value="documentos">Documentos Entregados</SelectItem>
                    <SelectItem value="citado">Citado Exámenes</SelectItem>
                    <SelectItem value="restricciones">Con Restricciones y/o Recomendación</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla de solicitudes */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Consecutivo</TableHead>
                    <TableHead className="px-4 py-3">Candidato</TableHead>
                    <TableHead className="px-4 py-3">Cargo</TableHead>
                    <TableHead className="px-4 py-3">Empresa</TableHead>
                    <TableHead className="px-4 py-3">Fecha Solicitud</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading ? (
                    filteredSolicitudes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No hay solicitudes citadas para exámenes médicos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSolicitudes.map((solicitud) => (
                        <TableRow key={solicitud.id} className={getRowBackgroundColor(solicitud.estado)}>
                          <TableCell className="px-2 py-1">
                            <div className="flex flex-row gap-1 items-center">
                              {solicitud.estado === 'validacion cliente' ? (
                                <>
                                  <Can action="accion-aprobar-certificado-medico">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleAprobar(solicitud)}
                                      aria-label="Aprobar solicitud"
                                      className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                                      title="Aprobar"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </Can>
                                  <Can action="accion-no-aprobar-certificado-medico">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNoAprobar(solicitud)}
                                      aria-label="No aprobar solicitud"
                                      className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                      title="No Aprobar"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </Can>
                                  <Can action="accion-visualizar-certificado-medico">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleSeleccionar(solicitud)}
                                      aria-label="Visualizar certificado médico"
                                      className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      title="Visualizar"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Can>
                                </>
                              ) : (
                                <Can action="accion-visualizar-certificado-medico">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSeleccionar(solicitud)}
                                    aria-label="Seleccionar solicitud"
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors" />
                                  </Button>
                                </Can>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">
                            #{solicitud.id || 'N/A'}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900">
                            {solicitud.candidatos?.primer_nombre && solicitud.candidatos?.primer_apellido
                              ? `${solicitud.candidatos.primer_nombre} ${solicitud.candidatos.segundo_nombre || ''} ${solicitud.candidatos.primer_apellido} ${solicitud.candidatos.segundo_apellido || ''}`.trim()
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            {(solicitud as any).tipos_candidatos?.nombre || solicitud.cargo || solicitud.estructura_datos?.cargo || 'N/A'}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            {(solicitud as any).empresas?.razon_social || solicitud.empresa_usuaria || 'N/A'}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(solicitud.fecha_solicitud)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant={getEstadoBadgeVariant(solicitud.estado)} className={getEstadoBadgeClass(solicitud.estado)}>
                              {getEstadoBadgeText(solicitud.estado)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Cargando solicitudes...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          {solicitudSeleccionada ? (
            <Card className="bg-white rounded-lg border shadow-sm">
              <CardHeader className="bg-cyan-50 border-b">
                <CardTitle className="text-center text-2xl font-bold text-cyan-800">
                  CERTIFICADO MÉDICO
                </CardTitle>
                <p className="text-center text-lg text-cyan-600">
                  EXAMEN MÉDICO OCUPACIONAL DE INGRESO
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Información del Candidato y Laboral - Solo Lectura */}
                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                    <h3 className="text-lg font-semibold text-cyan-800 mb-4">INFORMACIÓN DEL CANDIDATO</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">NOMBRES Y APELLIDOS:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.nombresApellidos || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">IDENTIFICACIÓN:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.identificacion || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">CARGO:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.cargo || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">ÁREA:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.area || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">EPS:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.eps || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium text-gray-700">ARL:</span>
                        <p className="text-gray-900 bg-white p-2 rounded border">
                          {formData.arl || 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Restricciones y Remisión */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-4">
                    <h3 className="text-lg font-semibold text-orange-800">RECOMENDACIÓN Y REMISIÓN</h3>

                    {/* Campos de restricciones en dos columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Can action="campo-restriccion-macro">
                          <Label htmlFor="restriccionMacro" className="text-sm font-medium text-gray-700">RECOMENDACIÓN MACRO</Label>
                          <Textarea
                            id="restriccionMacro"
                            value={formData.restriccionMacro}
                            onChange={(e) => handleFormChange('restriccionMacro', e.target.value)}
                            placeholder="Ingrese la recomendación macro..."
                            className="w-full min-h-[100px] resize-y"
                            disabled={solicitudSeleccionada?.estado === 'validacion cliente'}
                          />
                        </Can>
                      </div>

                      <div className="space-y-2">
                        <Can action="campo-resumen-restriccion">
                          <Label htmlFor="resumenRestriccion" className="text-sm font-medium text-gray-700">RESUMEN RECOMENDACIÓN</Label>
                          <Textarea
                            id="resumenRestriccion"
                            value={formData.resumenRestriccion}
                            onChange={(e) => handleFormChange('resumenRestriccion', e.target.value)}
                            placeholder="Ingrese el resumen de la recomendación..."
                            className="w-full min-h-[100px] resize-y"
                            disabled={false}
                            readOnly={solicitudSeleccionada?.estado === 'validacion cliente'}
                            style={{
                              backgroundColor: solicitudSeleccionada?.estado === 'validacion cliente' ? 'white' : 'white',
                              cursor: solicitudSeleccionada?.estado === 'validacion cliente' ? 'default' : 'text'
                            }}
                          />
                        </Can>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">REMISIÓN</Label>
                        <RadioGroup
                          value={formData.remision}
                          onValueChange={(value) => handleFormChange('remision', value)}
                          className="flex space-x-4"
                          disabled={solicitudSeleccionada?.estado === 'validacion cliente'}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="si" id="remision-si" disabled={solicitudSeleccionada?.estado === 'validacion cliente'} />
                            <Label htmlFor="remision-si" className="text-sm">SI</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="remision-no" disabled={solicitudSeleccionada?.estado === 'validacion cliente'} />
                            <Label htmlFor="remision-no" className="text-sm">NO</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">REQUIERE MEDICACIÓN</Label>
                        <RadioGroup
                          value={formData.requiereMedicacion}
                          onValueChange={(value) => handleFormChange('requiereMedicacion', value)}
                          className="flex space-x-4"
                          disabled={solicitudSeleccionada?.estado === 'validacion cliente'}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="si" id="medicacion-si" disabled={solicitudSeleccionada?.estado === 'validacion cliente'} />
                            <Label htmlFor="medicacion-si" className="text-sm">SI</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="medicacion-no" disabled={solicitudSeleccionada?.estado === 'validacion cliente'} />
                            <Label htmlFor="medicacion-no" className="text-sm">NO</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Uso de Elementos de Protección Personal */}
                  <Can action="campo-restriccion-macro">
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 space-y-2">
                      <Label htmlFor="elementosProteccion" className="text-sm font-medium text-teal-800">USO DE ELEMENTOS DE PROTECCIÓN PERSONAL RECOMENDADO PARA LA LABOR ASIGNADA</Label>
                      <Textarea
                        id="elementosProteccion"
                        value={formData.elementosProteccionPersonal}
                        onChange={(e) => handleFormChange('elementosProteccionPersonal', e.target.value)}
                        placeholder="Ingrese los elementos de protección personal recomendados..."
                        className="w-full min-h-[100px] resize-y"
                        disabled={solicitudSeleccionada?.estado === 'validacion cliente'}
                      />
                    </div>
                  </Can>


                  {/* Recomendaciones Generales */}
                  <Can action="campo-restriccion-macro">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                      <Label htmlFor="recomendacionesGenerales" className="text-sm font-medium text-blue-800">RECOMENDACIONES GENERALES</Label>
                      <Textarea
                        id="recomendacionesGenerales"
                        value={formData.recomendacionesGenerales}
                        onChange={(e) => handleFormChange('recomendacionesGenerales', e.target.value)}
                        placeholder="Ingrese las recomendaciones generales..."
                        className="w-full min-h-[100px] resize-y"
                        disabled={solicitudSeleccionada?.estado === 'validacion cliente'}
                      />
                    </div>
                  </Can>

                  {/* Sección para adjuntar documento del concepto médico */}
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Documento del concepto médico:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className={`border-2 transition-all duration-200 hover:shadow-md ${documentoConceptoMedico
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}>
                        <CardHeader className="pb-3 pt-4">
                          <CardTitle className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg mr-3 ${documentoConceptoMedico ? 'bg-green-100' : 'bg-blue-100'
                                }`}>
                                <FileText className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800">
                                  Documento del Concepto Médico
                                </span>
                                <Badge variant="destructive" className="text-xs px-2 py-0.5 ml-2">
                                  Obligatorio
                                </Badge>
                              </div>
                            </div>
                            {documentoConceptoMedico && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs font-medium">Subido</span>
                              </div>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                          <div className="space-y-3">
                            {/* Progress Bar for Upload */}
                            {isUploadingDocumento && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span>Subiendo documento...</span>
                                  <span>100%</span>
                                </div>
                                <Progress
                                  value={100}
                                  className="h-2 bg-gray-200"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              {documentoConceptoMedico ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Función para ver documento
                                      const base64 = `data:${documentoConceptoMedico.type};base64,${documentoPreview}`;
                                      window.open(base64, '_blank');
                                    }}
                                    className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
                                    title="Ver documento"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveDocumento}
                                    className="h-7 w-7 p-0 hover:bg-gray-50 rounded-full"
                                    title="Eliminar documento"
                                  >
                                    <X className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const fileInput = document.getElementById('documento-concepto-medico') as HTMLInputElement;
                                    fileInput?.click();
                                  }}
                                  disabled={solicitudSeleccionada?.estado === 'validacion cliente' || isUploadingDocumento}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Subir
                                </Button>
                              )}
                            </div>

                            {/* Input file oculto */}
                            <input
                              id="documento-concepto-medico"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleDocumentoConceptoMedicoChange}
                              disabled={solicitudSeleccionada?.estado === 'validacion cliente' || isUploadingDocumento}
                              className="hidden"
                            />

                            {/* Información del archivo */}
                            {documentoConceptoMedico && (
                              <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex items-center gap-1">
                                  <span>📄 {documentoConceptoMedico.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>📏 {(documentoConceptoMedico.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Botones de Concepto Médico - Solo mostrar si NO es validacion cliente */}
                  {solicitudSeleccionada?.estado !== 'validacion cliente' && (
                    <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
                      <h3 className="text-lg font-semibold text-cyan-800 mb-4 text-center">CONCEPTO MÉDICO</h3>
                      <div className="flex justify-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSolicitudSeleccionada(null);
                            setActiveTab("listado");
                          }}
                          className="px-4 py-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleConceptoMedico('apto')}
                          className="bg-green-100/80 hover:bg-green-500 hover:text-white text-green-800 border border-green-200 hover:border-green-500 px-4 py-2 text-sm shadow-sm transition-colors"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Apto
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleConceptoMedico('no-apto')}
                          className="bg-red-100/80 hover:bg-red-500 hover:text-white text-red-800 border border-red-200 hover:border-red-500 px-4 py-2 text-sm shadow-sm transition-colors"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          No Apto
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleConceptoMedico('apto-con-restricciones')}
                          className="bg-yellow-100/80 hover:bg-yellow-500 hover:text-white text-yellow-800 border border-yellow-200 hover:border-yellow-500 px-4 py-2 text-sm shadow-sm transition-colors"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Apto con recomendaciones
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Mensaje informativo para validacion cliente */}
                  {solicitudSeleccionada?.estado === 'validacion cliente' && (
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <h3 className="text-lg font-semibold text-orange-800 mb-4 text-center">CERTIFICADO MÉDICO CON RECOMENDACIÓN</h3>
                      <div className="text-center space-y-4">
                        <p className="text-orange-700">
                          Este certificado médico ya fue creado con restricciones o recomendaciones. Los datos mostrados son de solo lectura.
                        </p>
                        <div className="flex justify-center space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSolicitudSeleccionada(null);
                              setActiveTab("listado");
                            }}
                            className="px-4 py-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Volver al Listado
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-lg border p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Información de Certificación Médica
              </h3>
              <p className="text-gray-500">
                Seleccione una solicitud del listado para generar el certificado médico.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmación */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {modalType === 'apto' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Marcar como Apto</span>
                </>
              ) : modalType === 'no-apto' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>Marcar como No Apto</span>
                </>
              ) : modalType === 'aprobar' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Aprobar Solicitud</span>
                </>
              ) : modalType === 'no-aprobar' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>No Aprobar Solicitud</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <span>Marcar como Apto con recomendaciones</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                ¿Está seguro de que desea{' '}
                <span className="font-semibold">
                  {modalType === 'apto' ? 'marcar esta solicitud como Apto' :
                    modalType === 'no-apto' ? 'marcar esta solicitud como No Apto' :
                      modalType === 'aprobar' ? 'aprobar esta solicitud' :
                        modalType === 'no-aprobar' ? 'no aprobar esta solicitud (se descartará por restricciones médicas)' :
                          'marcar esta solicitud como Apto con recomendaciones'}
                </span>?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Ingrese observaciones adicionales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Sección para adjuntar archivo - Solo para aprobar/no aprobar */}
            {(modalType === 'aprobar' || modalType === 'no-aprobar') && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">
                  Adjuntar archivo (Opcional)
                </div>
                <Card className={`border-2 transition-all duration-200 hover:shadow-md ${adjuntoAprobacion
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}>
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${adjuntoAprobacion ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">
                            Archivo de Aprobación
                          </span>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 ml-2">
                            Opcional
                          </Badge>
                        </div>
                      </div>
                      {adjuntoAprobacion && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">Subido</span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3">
                      {/* Progress Bar for Upload */}
                      {isUploadingAdjunto && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Subiendo archivo...</span>
                            <span>100%</span>
                          </div>
                          <Progress
                            value={100}
                            className="h-2 bg-gray-200"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {adjuntoAprobacion ? (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Función para ver archivo
                                const base64 = `data:${adjuntoAprobacion.type};base64,${adjuntoPreview}`;
                                window.open(base64, '_blank');
                              }}
                              className="h-7 w-7 p-0 hover:bg-blue-50 rounded-full"
                              title="Ver archivo"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveAdjunto}
                              className="h-7 w-7 p-0 hover:bg-gray-50 rounded-full"
                              title="Eliminar archivo"
                            >
                              <X className="h-4 w-4 text-gray-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const fileInput = document.getElementById('adjunto-aprobacion') as HTMLInputElement;
                              fileInput?.click();
                            }}
                            disabled={isUploadingAdjunto}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Subir
                          </Button>
                        )}
                      </div>

                      {/* Input file oculto */}
                      <input
                        id="adjunto-aprobacion"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleAdjuntoAprobacionChange}
                        disabled={isUploadingAdjunto}
                        className="hidden"
                      />

                      {/* Información del archivo */}
                      {adjuntoAprobacion && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <span>📄 {adjuntoAprobacion.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📏 {(adjuntoAprobacion.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isConfirming}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isConfirming}
              className={
                modalType === 'apto' || modalType === 'aprobar'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400'
                  : modalType === 'no-apto' || modalType === 'no-aprobar'
                    ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-yellow-400'
              }
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                modalType === 'apto' ? 'Confirmar Apto' :
                  modalType === 'no-apto' ? 'Confirmar No Apto' :
                    modalType === 'aprobar' ? 'Confirmar Aprobación' :
                      modalType === 'no-aprobar' ? 'Confirmar Descarte' :
                        'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificadosMedicosPage;

