import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';
import { useTiposDocumentos } from '@/hooks/useTiposDocumentos';
import { useTiposCandidatosDocumentos } from '@/hooks/useTiposCandidatosDocumentos';
import { TipoCandidato, TipoDocumento, TipoCandidatoForm, DocumentoTipoForm } from '@/types/maestro';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

const tipoCandidatoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
});

const documentoTipoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
  requerido: z.boolean().default(false),
});

export default function TiposCandidatosPage() {
  const [showTipoDialog, setShowTipoDialog] = useState(false);
  const [showDocumentoDialog, setShowDocumentoDialog] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoCandidato | null>(null);
  const [editingDocumento, setEditingDocumento] = useState<TipoDocumento | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoCandidato | null>(null);
  const [showDocumentosConfig, setShowDocumentosConfig] = useState(false);

  // Hooks
  const { 
    tiposCandidatos, 
    isLoading: loadingTipos, 
    createTipoCandidato, 
    isCreating 
  } = useTiposCandidatos();

  const { 
    tiposDocumentos, 
    tiposDocumentosActivos,
    isLoading: loadingDocumentos, 
    createTipoDocumento, 
    isCreating: isCreatingDocumento,
    forceRefresh: forceRefreshDocumentos
  } = useTiposDocumentos();

  const { getDocumentosRequeridos, updateDocumentosForTipoCandidato } = useTiposCandidatosDocumentos();
  
  const { 
    data: documentosRequeridos = [], 
    isLoading: loadingRequeridos 
  } = getDocumentosRequeridos(selectedTipo?.id || 0);

  // Debug: mostrar información de tipos de documentos
  console.log('🔍 TiposCandidatosPage - Tipos de documentos cargados:', tiposDocumentos);
  console.log('🔍 TiposCandidatosPage - Tipos de documentos activos:', tiposDocumentosActivos);
  console.log('🔍 TiposCandidatosPage - Estado de carga de documentos:', loadingDocumentos);

  // Función para limpiar completamente el cache
  const queryClient = useQueryClient();
  const handleClearCache = () => {
    console.log('🔍 TiposCandidatosPage - Limpiando cache completamente...');
    // Limpiar todas las queries relacionadas con tipos de documentos
    queryClient.removeQueries({ queryKey: ['tipos-documentos'] });
    queryClient.removeQueries({ queryKey: ['tipos-documentos-activos'] });
    queryClient.removeQueries({ queryKey: ['tipos-documentos-requeridos'] });
    // Forzar recarga inmediata
    forceRefreshDocumentos();
  };

  // Función para verificar datos directamente desde la BD
  const handleVerifyDatabase = async () => {
    console.log('🔍 TiposCandidatosPage - Verificando datos directamente desde la BD...');
    try {
      const { data, error } = await supabase
        .from('tipos_documentos')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) {
        console.error('🔍 TiposCandidatosPage - Error al consultar BD:', error);
        return;
      }
      
      console.log('🔍 TiposCandidatosPage - Datos directos de BD:', data);
      console.log('🔍 TiposCandidatosPage - Total en BD:', data?.length || 0);
      console.log('🔍 TiposCandidatosPage - Total en cache:', tiposDocumentosActivos.length);
      
      if (data && data.length !== tiposDocumentosActivos.length) {
        console.warn('🔍 TiposCandidatosPage - ¡DIFERENCIA DETECTADA!');
        console.warn('🔍 TiposCandidatosPage - BD tiene:', data.length, 'elementos');
        console.warn('🔍 TiposCandidatosPage - Cache tiene:', tiposDocumentosActivos.length, 'elementos');
      }
    } catch (error) {
      console.error('🔍 TiposCandidatosPage - Error en verificación:', error);
    }
  };

  // Forms
  const tipoForm = useForm<TipoCandidatoForm>({
    resolver: zodResolver(tipoCandidatoSchema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  const documentoForm = useForm<DocumentoTipoForm>({
    resolver: zodResolver(documentoTipoSchema),
    defaultValues: { nombre: '', descripcion: '', requerido: false },
  });

  const handleTipoSubmit = (data: TipoCandidatoForm) => {
    createTipoCandidato(data);
    setShowTipoDialog(false);
    tipoForm.reset();
  };

  const handleDocumentoSubmit = (data: DocumentoTipoForm) => {
    createTipoDocumento(data);
    setShowDocumentoDialog(false);
    documentoForm.reset();
  };

  const handleConfigureTipo = (tipo: TipoCandidato) => {
    setSelectedTipo(tipo);
    setShowDocumentosConfig(true);
  };

  const handleToggleDocumento = (documentoId: number, obligatorio: boolean) => {
    if (!selectedTipo) return;
    
    const updatedDocumentos = [...documentosRequeridos];
    const index = updatedDocumentos.findIndex(d => d.tipo_documento_id === documentoId);
    
    if (index >= 0) {
      if (obligatorio) {
        updatedDocumentos[index].obligatorio = true;
      } else {
        updatedDocumentos.splice(index, 1);
      }
    } else if (obligatorio) {
      updatedDocumentos.push({
        tipo_candidato_id: selectedTipo.id,
        tipo_documento_id: documentoId,
        obligatorio: true,
        orden: updatedDocumentos.length,
      } as any); // Usar any temporalmente para evitar conflictos de tipos
    }

    updateDocumentosForTipoCandidato.mutate({
      tipoCandidatoId: selectedTipo.id,
      documentos: updatedDocumentos.map(doc => ({
        tipo_documento_id: doc.tipo_documento_id,
        obligatorio: doc.obligatorio,
        orden: doc.orden
      })),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maestro de Candidatos</h1>
          <p className="text-muted-foreground">
            Configura los tipos de candidatos y documentos requeridos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Candidatos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Tipos de Candidatos</CardTitle>
              <CardDescription>
                Define los diferentes tipos de candidatos (Ingeniero, Diseñador, etc.)
              </CardDescription>
            </div>
            <Dialog open={showTipoDialog} onOpenChange={setShowTipoDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-brand-lime hover:bg-brand-lime/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Tipo de Candidato</DialogTitle>
                  <DialogDescription>
                    Define un nuevo tipo de candidato para el sistema
                  </DialogDescription>
                </DialogHeader>
                <Form {...tipoForm}>
                  <form onSubmit={tipoForm.handleSubmit(handleTipoSubmit)} className="space-y-4">
                    <FormField
                      control={tipoForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Ingeniero de Sistemas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={tipoForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descripción del tipo de candidato" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creando...' : 'Crear Tipo'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingTipos ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <div className="space-y-2">
                {tiposCandidatos.map((tipo: TipoCandidato) => (
                  <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{tipo.nombre}</h4>
                      {tipo.descripcion && (
                        <p className="text-sm text-muted-foreground">{tipo.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tipo.activo ? "default" : "secondary"}>
                        {tipo.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfigureTipo(tipo)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de Documentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Tipos de Documentos</CardTitle>
              <CardDescription>
                Define los documentos disponibles en el sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCache}
                disabled={loadingDocumentos}
              >
                🔄
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleVerifyDatabase}
                disabled={loadingDocumentos}
              >
                🔍
              </Button>
              <Dialog open={showDocumentoDialog} onOpenChange={setShowDocumentoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Tipo de Documento</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo tipo de documento al sistema
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...documentoForm}>
                    <form onSubmit={documentoForm.handleSubmit(handleDocumentoSubmit)} className="space-y-4">
                      <FormField
                        control={documentoForm.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentoForm.control}
                        name="descripcion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentoForm.control}
                        name="requerido"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Requerido por defecto
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={isCreatingDocumento}>
                          {isCreatingDocumento ? 'Creando...' : 'Crear Documento'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDocumentos ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <div className="space-y-2">
                {tiposDocumentosActivos.map((documento: TipoDocumento) => (
                  <div key={documento.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{documento.nombre}</h4>
                      {documento.descripcion && (
                        <p className="text-sm text-muted-foreground">{documento.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {documento.requerido && (
                        <Badge variant="default">Por defecto</Badge>
                      )}
                      <Badge variant={documento.activo ? "default" : "secondary"}>
                        {documento.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {/* Debug info */}
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-4">
                  <p>Total tipos de documentos: {tiposDocumentos.length}</p>
                  <p>Tipos activos: {tiposDocumentosActivos.length}</p>
                  <p>Estado de carga: {loadingDocumentos ? 'Cargando...' : 'Completado'}</p>
                  <p>Última actualización: {new Date().toLocaleTimeString()}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver datos completos</summary>
                    <div className="mt-2 space-y-1">
                      <p><strong>Tipos activos:</strong></p>
                      <pre className="text-xs overflow-auto max-h-20 bg-white p-1 rounded">
                        {JSON.stringify(tiposDocumentosActivos.map(d => ({ id: d.id, nombre: d.nombre, activo: d.activo })), null, 2)}
                      </pre>
                      <p><strong>Total en BD:</strong> 7 (según consulta directa)</p>
                      <p><strong>Diferencia:</strong> {7 - tiposDocumentosActivos.length} faltantes</p>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Documentos por Tipo */}
      <Dialog open={showDocumentosConfig} onOpenChange={setShowDocumentosConfig}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Configurar Documentos - {selectedTipo?.nombre}
            </DialogTitle>
            <DialogDescription>
              Selecciona qué documentos son requeridos para este tipo de candidato
            </DialogDescription>
          </DialogHeader>
          {selectedTipo && (
            <div className="space-y-4">
              {loadingRequeridos ? (
                <div className="text-center py-4">Cargando documentos requeridos...</div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Requerido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposDocumentosActivos.map((documento: TipoDocumento) => {
                    const isRequerido = documentosRequeridos?.some(
                      (dr: any) => dr.tipo_documento_id === documento.id
                    ) || false;
                    return (
                      <TableRow key={documento.id}>
                        <TableCell className="font-medium">{documento.nombre}</TableCell>
                        <TableCell>{documento.descripcion || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={isRequerido}
                            onCheckedChange={(checked) => 
                              handleToggleDocumento(documento.id, checked)
                            }
                            disabled={updateDocumentosForTipoCandidato.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}