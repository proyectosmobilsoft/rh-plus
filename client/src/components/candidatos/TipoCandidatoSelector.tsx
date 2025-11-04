import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Upload, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  User,
  Briefcase
} from 'lucide-react';
import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';
import { useTiposCandidatosDocumentos } from '@/hooks/useTiposCandidatosDocumentos';
import { TipoCandidato } from '@/types/maestro';

interface DocumentoRequerido {
  id: number;
  tipo_candidato_id: number;
  tipo_documento_id: number;
  obligatorio: boolean;
  orden: number;
  tipos_documentos: {
    id: number;
    nombre: string;
    descripcion?: string;
    requerido: boolean;
    activo: boolean;
  };
}

interface TipoCandidatoSelectorProps {
  selectedTipoId: number | null;
  onTipoChange: (tipoId: number | null) => void;
  documentosCargados: Record<number, { archivo?: File; fechaVigencia?: string; observaciones?: string }>;
  onDocumentoChange: (documentoId: number, data: { archivo?: File; fechaVigencia?: string; observaciones?: string }) => void;
}

export const TipoCandidatoSelector: React.FC<TipoCandidatoSelectorProps> = ({
  selectedTipoId,
  onTipoChange,
  documentosCargados,
  onDocumentoChange,
}) => {
  const { tiposCandidatos, tiposCandidatosActivos, isLoading: loadingTipos, refetch, invalidateCache, forceRefresh } = useTiposCandidatos();
  const { getDocumentosRequeridos } = useTiposCandidatosDocumentos();
  
  const { 
    data: documentosRequeridos = [], 
    isLoading: loadingDocumentos 
  } = getDocumentosRequeridos(selectedTipoId || 0);

  const handleTipoChange = (tipoId: string) => {
    const id = tipoId ? parseInt(tipoId) : null;
    onTipoChange(id);
  };

  // Función para forzar la recarga de datos
  const handleRefresh = async () => {
    await forceRefresh();
  };


  const handleFileChange = (documentoId: number, file: File | undefined) => {
    onDocumentoChange(documentoId, { 
      ...documentosCargados[documentoId], 
      archivo: file 
    });
  };

  const handleFechaVigenciaChange = (documentoId: number, fecha: string) => {
    onDocumentoChange(documentoId, { 
      ...documentosCargados[documentoId], 
      fechaVigencia: fecha 
    });
  };

  const handleObservacionesChange = (documentoId: number, observaciones: string) => {
    onDocumentoChange(documentoId, { 
      ...documentosCargados[documentoId], 
      observaciones 
    });
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selección de Tipo de Candidato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tipo de Candidato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="tipo-candidato">Seleccione su tipo de candidato *</Label>
                <Select value={selectedTipoId?.toString() || ''} onValueChange={handleTipoChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccione un tipo de candidato" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTipos ? (
                      <SelectItem value="" disabled>Cargando tipos...</SelectItem>
                    ) : (
                      tiposCandidatosActivos
                        .map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              {tipo.nombre}
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loadingTipos}
                className="mt-6"
              >
                🔄
              </Button>
            </div>

            {selectedTipoId && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tipo seleccionado: <strong>{tiposCandidatosActivos.find(t => t.id === selectedTipoId)?.nombre}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Debug info */}
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <p>Total tipos: {tiposCandidatos.length}</p>
              <p>Tipos activos: {tiposCandidatosActivos.length}</p>
              <p>Estado de carga: {loadingTipos ? 'Cargando...' : 'Completado'}</p>
              <p>Última actualización: {new Date().toLocaleTimeString()}</p>
              <details className="mt-2">
                <summary className="cursor-pointer">Ver datos completos</summary>
                <pre className="text-xs mt-1 overflow-auto max-h-20">
                  {JSON.stringify(tiposCandidatosActivos, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos Requeridos */}
      {selectedTipoId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Requeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDocumentos ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Cargando documentos requeridos...</p>
              </div>
            ) : documentosRequeridos.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay documentos requeridos para este tipo de candidato.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {documentosRequeridos.map((documento, index) => (
                  <div key={documento.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <h4 className="font-medium">{documento.tipos_documentos.nombre}</h4>
                        <Badge variant="destructive">Obligatorio</Badge>
                      </div>
                      {documentosCargados[documento.tipo_documento_id]?.archivo && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cargado
                        </Badge>
                      )}
                    </div>

                    {documento.tipos_documentos.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {documento.tipos_documentos.descripcion}
                      </p>
                    )}

                    <Separator />

                    {/* Carga de Archivo */}
                    <div className="space-y-2">
                      <Label htmlFor={`file-${documento.tipo_documento_id}`}>
                        Archivo *
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`file-${documento.tipo_documento_id}`}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleFileChange(documento.tipo_documento_id, file);
                          }}
                          className="flex-1"
                        />
                        {documentosCargados[documento.tipo_documento_id]?.archivo && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            {getFileTypeIcon(documentosCargados[documento.tipo_documento_id].archivo!.name)}
                            {documentosCargados[documento.tipo_documento_id].archivo!.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fecha de Vigencia */}
                    <div className="space-y-2">
                      <Label htmlFor={`fecha-${documento.tipo_documento_id}`}>
                        Fecha de Vigencia
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`fecha-${documento.tipo_documento_id}`}
                          type="date"
                          value={documentosCargados[documento.tipo_documento_id]?.fechaVigencia || ''}
                          onChange={(e) => handleFechaVigenciaChange(documento.tipo_documento_id, e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2">
                      <Label htmlFor={`obs-${documento.tipo_documento_id}`}>
                        Observaciones
                      </Label>
                      <Textarea
                        id={`obs-${documento.tipo_documento_id}`}
                        placeholder="Observaciones adicionales sobre el documento..."
                        value={documentosCargados[documento.tipo_documento_id]?.observaciones || ''}
                        onChange={(e) => handleObservacionesChange(documento.tipo_documento_id, e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                {/* Resumen */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resumen de Documentos</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total de documentos requeridos:</span>
                      <span className="font-medium">{documentosRequeridos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documentos cargados:</span>
                      <span className="font-medium text-green-600">
                        {Object.values(documentosCargados).filter(doc => doc.archivo).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documentos pendientes:</span>
                      <span className="font-medium text-orange-600">
                        {documentosRequeridos.length - Object.values(documentosCargados).filter(doc => doc.archivo).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 

