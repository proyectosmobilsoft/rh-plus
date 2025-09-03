import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building2, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { candidatosDocumentosService, CandidatoDocumentoConDetalles } from '@/services/candidatosDocumentosService';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';

interface Empresa {
  id: number;
  razon_social: string;
  nit: string;
}

interface DocumentosPorEmpresa {
  empresa: Empresa;
  documentos: CandidatoDocumentoConDetalles[];
}

interface DocumentosCandidatoViewerProps {
  candidatoId: number;
  candidatoNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentosCandidatoViewer: React.FC<DocumentosCandidatoViewerProps> = ({
  candidatoId,
  candidatoNombre,
  isOpen,
  onClose
}) => {
  const [documentosPorEmpresa, setDocumentosPorEmpresa] = useState<DocumentosPorEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisualizacionOpen, setModalVisualizacionOpen] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<any>(null);
  const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<number>>(new Set());
  const [documentoBlobUrl, setDocumentoBlobUrl] = useState<string | null>(null);

  // Cargar documentos del candidato organizados por empresa
  const loadDocumentos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener documentos con información de empresa directamente desde candidatos_documentos
      console.log('🔍 Cargando documentos para candidato ID:', candidatoId);
      
                 const { data: documentos, error: documentosError } = await supabase
             .from('candidatos_documentos')
             .select(`
               id,
               candidato_id,
               empresa_id,
               tipo_documento_id,
               nombre_archivo,
               url_archivo,
               fecha_vigencia,
               observaciones,
               fecha_carga,
               tipos_documentos (
                 id,
                 nombre,
                 descripcion,
                 activo
               ),
               empresas (
                 id,
                 razon_social,
                 nit
               )
             `)
             .eq('candidato_id', candidatoId)
             .order('fecha_carga', { ascending: false });

      if (documentosError) {
        console.error('❌ Error obteniendo documentos:', documentosError);
        throw documentosError;
      }
      
      console.log('📄 Documentos obtenidos:', documentos);
      
      if (!documentos || documentos.length === 0) {
        setDocumentosPorEmpresa([]);
        return;
      }

      // Agrupar documentos por empresa
      const empresasMap = new Map<number, { empresa: Empresa; documentos: any[] }>();

                 documentos.forEach((doc: any) => {
             const empresaId = doc.empresa_id;
             console.log('📋 Procesando documento:', {
               id: doc.id,
               nombre: doc.nombre_archivo,
               empresa_id: empresaId,
               empresa_data: doc.empresas,
               tiene_url_archivo: !!doc.url_archivo,
               url_archivo_length: doc.url_archivo ? doc.url_archivo.length : 0,
               url_archivo_preview: doc.url_archivo ? doc.url_archivo.substring(0, 100) + '...' : 'No disponible'
             });
        
        if (empresaId && doc.empresas) {
          // Documento con empresa asignada
          if (!empresasMap.has(empresaId)) {
            empresasMap.set(empresaId, {
              empresa: doc.empresas,
              documentos: []
            });
            console.log('🏢 Nueva empresa agregada:', doc.empresas);
          }
          empresasMap.get(empresaId)!.documentos.push(doc);
        } else {
          // Documento sin empresa asignada
          if (!empresasMap.has(0)) {
            empresasMap.set(0, {
              empresa: {
                id: 0,
                razon_social: 'Sin Empresa Asignada',
                nit: 'N/A'
              },
              documentos: []
            });
            console.log('📁 Agregando sección "Sin Empresa Asignada"');
          }
          empresasMap.get(0)!.documentos.push(doc);
        }
      });

      // Convertir a array
                 const documentosAgrupados: DocumentosPorEmpresa[] = Array.from(empresasMap.values());
           console.log('📊 Documentos agrupados por empresa:', documentosAgrupados);

           setDocumentosPorEmpresa(documentosAgrupados);
           
           // Si hay múltiples empresas, expandir la primera automáticamente
           if (documentosAgrupados.length > 1) {
             setEmpresasExpandidas(new Set([documentosAgrupados[0].empresa.id]));
           } else if (documentosAgrupados.length === 1) {
             // Si hay solo una empresa, expandirla automáticamente
             setEmpresasExpandidas(new Set([documentosAgrupados[0].empresa.id]));
           }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      setError('Error al cargar los documentos del candidato');
      toast.error('Error al cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar documentos cuando se abre el modal
  useEffect(() => {
    if (isOpen && candidatoId) {
      loadDocumentos();
    }
  }, [isOpen, candidatoId]);

  // Limpiar blob URL cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (documentoBlobUrl) {
        URL.revokeObjectURL(documentoBlobUrl);
      }
    };
  }, [documentoBlobUrl]);

  // Función para descargar documento
  const handleDownload = async (documento: any) => {
    try {
      console.log('⬇️ Iniciando descarga de documento:', {
        nombre: documento.nombre_archivo,
        tiene_base64: !!documento.url_archivo,
        tiene_url: !!documento.url_archivo
      });
      
      if (documento.url_archivo) {
        // Verificar si es base64 o URL
        const isBase64 = isBase64Data(documento.url_archivo);
        
        if (isBase64) {
          // Manejar base64
          const base64Data = documento.url_archivo.includes(',') 
            ? documento.url_archivo.split(',')[1] 
            : documento.url_archivo;
          
          // Determinar el tipo MIME
          const mimeType = getMimeTypeFromBase64(documento.url_archivo);
          
          try {
            // Convertir base64 a blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            // Crear URL del blob
            const blobUrl = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = documento.nombre_archivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpiar URL del blob
            URL.revokeObjectURL(blobUrl);
            
            console.log('✅ Descarga de base64 iniciada exitosamente');
            toast.success(`Descargando ${documento.nombre_archivo}`);
          } catch (base64Error) {
            console.error('❌ Error procesando base64:', base64Error);
            toast.error('Error al procesar el archivo base64');
          }
        } else {
          // Manejar URL normal
          const link = document.createElement('a');
          link.href = documento.url_archivo;
          link.download = documento.nombre_archivo;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Descarga de URL iniciada exitosamente');
          toast.success(`Descargando ${documento.nombre_archivo}`);
        }
      } else {
        console.warn('⚠️ No hay archivo disponible');
        toast.error('No hay archivo disponible para descargar');
      }
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  // Función para visualizar documento
  const handleView = async (documento: any) => {
    try {
      console.log('👁️ Abriendo documento para visualización:', {
        nombre: documento.nombre_archivo,
        tiene_base64: !!documento.url_archivo,
        tipo_archivo: documento.nombre_archivo?.split('.').pop()?.toLowerCase()
      });
      
      if (documento.url_archivo) {
        // Limpiar blob URL anterior si existe
        if (documentoBlobUrl) {
          URL.revokeObjectURL(documentoBlobUrl);
          setDocumentoBlobUrl(null);
        }

        let urlParaVisualizar = documento.url_archivo;

        // Si es base64, crear blob URL para evitar headers grandes
        if (isBase64Data(documento.url_archivo)) {
          try {
            const base64Data = documento.url_archivo.includes(',') 
              ? documento.url_archivo.split(',')[1] 
              : documento.url_archivo;
            
            const mimeType = getMimeTypeFromBase64(documento.url_archivo);
            
            // Convertir base64 a blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            // Crear blob URL
            const blobUrl = URL.createObjectURL(blob);
            setDocumentoBlobUrl(blobUrl);
            urlParaVisualizar = blobUrl;
            
            console.log('✅ Blob URL creado para visualización');
          } catch (blobError) {
            console.error('❌ Error creando blob URL:', blobError);
            toast.error('Error al procesar el documento para visualización');
            return;
          }
        }

        setDocumentoSeleccionado({ ...documento, url_archivo: urlParaVisualizar });
        setModalVisualizacionOpen(true);
        console.log('✅ Modal de visualización abierto');
      } else {
        console.warn('⚠️ No hay archivo disponible');
        toast.error('No hay archivo disponible para visualizar');
      }
    } catch (error) {
      console.error('❌ Error visualizando archivo:', error);
      toast.error('Error al abrir el documento');
    }
  };

  // Función auxiliar para detectar si es base64
  const isBase64Data = (data: string): boolean => {
    if (!data) return false;
    
    // Verificar patrones comunes de base64
    const base64Patterns = [
      /^data:[^;]+;base64,/,  // data:image/jpeg;base64,
      /^\/9j\//,              // JPEG base64
      /^iVBORw0KGgo/,         // PNG base64
      /^UEsDBAoAAAAA/,        // ZIP base64
      /^JVBERi0x/,            // PDF base64
      /^[A-Za-z0-9+/]{4,}={0,2}$/  // Base64 puro
    ];
    
    return base64Patterns.some(pattern => pattern.test(data));
  };

  // Función auxiliar para obtener el tipo MIME desde base64
  const getMimeTypeFromBase64 = (base64Data: string): string => {
    if (base64Data.startsWith('data:')) {
      return base64Data.split(',')[0].split(':')[1].split(';')[0];
    }
    
    // Detectar tipo por patrones
    if (base64Data.startsWith('/9j/')) return 'image/jpeg';
    if (base64Data.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64Data.startsWith('JVBERi0x')) return 'application/pdf';
    if (base64Data.startsWith('UEsDBAoAAAAA')) return 'application/zip';
    
    return 'application/octet-stream';
  };

  // Función para manejar el colapso de empresas
  const toggleEmpresa = (empresaId: number) => {
    const nuevasEmpresasExpandidas = new Set(empresasExpandidas);
    if (nuevasEmpresasExpandidas.has(empresaId)) {
      nuevasEmpresasExpandidas.delete(empresaId);
    } else {
      nuevasEmpresasExpandidas.add(empresaId);
    }
    setEmpresasExpandidas(nuevasEmpresasExpandidas);
  };

  // Función para cerrar modal de visualización y limpiar blob URL
  const handleCloseVisualizacion = () => {
    if (documentoBlobUrl) {
      URL.revokeObjectURL(documentoBlobUrl);
      setDocumentoBlobUrl(null);
    }
    setModalVisualizacionOpen(false);
    setDocumentoSeleccionado(null);
  };

  // Función para obtener el tipo de visualización apropiado
  const getVisualizacionType = (documento: any) => {
    if (!documento?.url_archivo) return 'none';
    
    const extension = documento.nombre_archivo?.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromBase64(documento.url_archivo);
    
    // PDFs
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }
    
    // Imágenes
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension) || 
        mimeType.startsWith('image/')) {
      return 'image';
    }
    
    // Documentos de texto
    if (['txt', 'md'].includes(extension) || mimeType === 'text/plain') {
      return 'text';
    }
    
    // Por defecto, intentar iframe
    return 'iframe';
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para verificar si un documento está vencido
  const isDocumentExpired = (fechaVigencia?: string) => {
    if (!fechaVigencia) return false;
    return new Date(fechaVigencia) < new Date();
  };

  // Función para verificar si un documento está próximo a vencer (30 días)
  const isDocumentExpiringSoon = (fechaVigencia?: string) => {
    if (!fechaVigencia) return false;
    const fechaVencimiento = new Date(fechaVigencia);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);
    return fechaVencimiento <= fechaLimite && fechaVencimiento > new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Documentos de {candidatoNombre}
          </DialogTitle>
          <DialogDescription>
            Visualiza y gestiona todos los documentos del candidato organizados por empresa
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando documentos...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <span className="ml-2 text-red-600">{error}</span>
            </div>
          ) : documentosPorEmpresa.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <FileText className="h-8 w-8 text-gray-400" />
              <span className="ml-2 text-gray-600">No hay documentos disponibles</span>
            </div>
          ) : (
            <div className="space-y-6">
              {documentosPorEmpresa.map((grupo, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <Collapsible 
                    open={empresasExpandidas.has(grupo.empresa.id)}
                    onOpenChange={() => toggleEmpresa(grupo.empresa.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            {grupo.empresa.razon_social}
                            {grupo.empresa.nit !== 'N/A' && (
                              <Badge variant="outline" className="ml-2">
                                NIT: {grupo.empresa.nit}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {grupo.documentos.length} documento{grupo.documentos.length !== 1 ? 's' : ''}
                            </Badge>
                            {empresasExpandidas.has(grupo.empresa.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                    <div className="space-y-3">
                      {grupo.documentos.map((documento) => (
                        <div key={documento.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {documento.tipos_documentos?.nombre || 'Documento'}
                                </span>
                                
                                {/* Badges de estado */}
                                {documento.fecha_vigencia && (
                                  <>
                                    {isDocumentExpired(documento.fecha_vigencia) ? (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Vencido
                                      </Badge>
                                    ) : isDocumentExpiringSoon(documento.fecha_vigencia) ? (
                                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Por Vencer
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Vigente
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Archivo:</span>
                                  <span>{documento.nombre_archivo}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>Cargado: {formatDate(documento.fecha_carga)}</span>
                                </div>
                                
                                {documento.fecha_vigencia && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>Vigencia: {formatDate(documento.fecha_vigencia)}</span>
                                  </div>
                                )}
                                
                                {documento.observaciones && (
                                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                    <span className="font-medium">Observaciones:</span>
                                    <p className="mt-1">{documento.observaciones}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleView(documento)}
                                      className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver documento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDownload(documento)}
                                      className="h-8 w-8 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Descargar documento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
      
      {/* Modal de Visualización de Documento */}
      <Dialog open={modalVisualizacionOpen} onOpenChange={handleCloseVisualizacion}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {documentoSeleccionado?.nombre_archivo || 'Visualizar Documento'}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseVisualizacion}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            {documentoSeleccionado?.url_archivo ? (
              <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
                {(() => {
                  const tipoVisualizacion = getVisualizacionType(documentoSeleccionado);
                  
                  switch (tipoVisualizacion) {
                    case 'pdf':
                      return (
                        <iframe
                          src={documentoSeleccionado.url_archivo}
                          className="w-full h-full"
                          title={documentoSeleccionado.nombre_archivo}
                          style={{ border: 'none' }}
                        />
                      );
                    
                    case 'image':
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <img
                            src={documentoSeleccionado.url_archivo}
                            alt={documentoSeleccionado.nombre_archivo}
                            className="max-w-full max-h-full object-contain"
                            style={{ maxHeight: '100%' }}
                          />
                        </div>
                      );
                    
                    case 'text':
                      return (
                        <div className="w-full h-full p-4 bg-white overflow-auto">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {documentoSeleccionado.url_archivo}
                          </pre>
                        </div>
                      );
                    
                    case 'iframe':
                    default:
                      return (
                        <iframe
                          src={documentoSeleccionado.url_archivo}
                          className="w-full h-full"
                          title={documentoSeleccionado.nombre_archivo}
                          style={{ border: 'none' }}
                        />
                      );
                  }
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay archivo disponible para visualizar</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default DocumentosCandidatoViewer;
