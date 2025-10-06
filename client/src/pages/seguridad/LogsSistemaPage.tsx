import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, Phone, Pause, Play, Edit, Plus, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { solicitudesLogsService, SolicitudLog, ACCIONES_SOLICITUDES } from '@/services/solicitudesLogsService';
import { usuariosService } from '@/services/usuariosService';
import { useLoading } from '@/contexts/LoadingContext';
import { formatDateTime, formatDate } from '@/lib/utils';

const LogsSistemaPage: React.FC = () => {
  const { startLoading, stopLoading } = useLoading();
  const [logs, setLogs] = useState<SolicitudLog[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState<string>('all');
  const [accionFilter, setAccionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarLogs();
  }, [currentPage, usuarioFilter, accionFilter]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Cargar usuarios para el filtro
      await cargarUsuarios();
      // Cargar logs iniciales
      await cargarLogs();
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const usuariosData = await usuariosService.listUsuarios();
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const cargarLogs = async () => {
    try {
      startLoading();
      const response = await solicitudesLogsService.getAllLogsPaginated(currentPage, itemsPerPage);
      
      let logsFiltrados = response.logs;
      
      // Aplicar filtros
      if (usuarioFilter !== 'all') {
        logsFiltrados = logsFiltrados.filter(log => log.usuario_id === parseInt(usuarioFilter));
      }
      
      if (accionFilter !== 'all') {
        logsFiltrados = logsFiltrados.filter(log => log.accion === accionFilter);
      }
      
      setLogs(logsFiltrados);
      setTotalLogs(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar logs:', error);
    } finally {
      stopLoading();
    }
  };

  const logsFiltrados = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.observacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.primer_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
        return <Plus className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return <User className="h-4 w-4 text-purple-600" />;
      case ACCIONES_SOLICITUDES.EDITAR:
        return <Edit className="h-4 w-4 text-orange-600" />;
      case ACCIONES_SOLICITUDES.APROBAR:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.RECHAZAR:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return <Phone className="h-4 w-4 text-blue-600" />;
      case ACCIONES_SOLICITUDES.STAND_BY:
        return <Pause className="h-4 w-4 text-gray-600" />;
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return <Play className="h-4 w-4 text-green-600" />;
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccionLabel = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
        return 'Crear Solicitud';
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
        return 'Cambiar Estado';
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return 'Asignar Analista';
      case ACCIONES_SOLICITUDES.EDITAR:
        return 'Editar Solicitud';
      case ACCIONES_SOLICITUDES.APROBAR:
        return 'Aprobar Solicitud';
      case ACCIONES_SOLICITUDES.RECHAZAR:
        return 'Rechazar Solicitud';
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return 'Contactar Solicitud';
      case ACCIONES_SOLICITUDES.STAND_BY:
        return 'Stand By';
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return 'Reactivar Solicitud';
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return 'Eliminar Solicitud';
      default:
        return accion;
    }
  };

  const getAccionBadgeVariant = (accion: string) => {
    switch (accion) {
      case ACCIONES_SOLICITUDES.CREAR:
      case ACCIONES_SOLICITUDES.APROBAR:
      case ACCIONES_SOLICITUDES.REACTIVAR:
        return 'default';
      case ACCIONES_SOLICITUDES.CAMBIAR_ESTADO:
      case ACCIONES_SOLICITUDES.ASIGNAR_ANALISTA:
        return 'secondary';
      case ACCIONES_SOLICITUDES.EDITAR:
        return 'outline';
      case ACCIONES_SOLICITUDES.CONTACTAR:
        return 'secondary';
      case ACCIONES_SOLICITUDES.STAND_BY:
        return 'outline';
      case ACCIONES_SOLICITUDES.RECHAZAR:
      case ACCIONES_SOLICITUDES.ELIMINAR:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportLogs = () => {
    // Implementar exportación de logs
    console.log('Exportando logs...');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Registro completo de todas las acciones realizadas en el sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportLogs}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda general */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por usuario */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Usuario</label>
              <Select value={usuarioFilter} onValueChange={setUsuarioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {`${usuario.primer_nombre} ${usuario.primer_apellido}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por acción */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Acción</label>
              <Select value={accionFilter} onValueChange={setAccionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {Object.entries(ACCIONES_SOLICITUDES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {getAccionLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contador de resultados */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Resultados</label>
              <div className="flex items-center justify-center h-10 px-3 bg-gray-50 rounded-md border">
                <span className="text-sm font-medium text-gray-700">
                  {logsFiltrados.length} de {totalLogs} logs
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Historial de Acciones
            <Badge variant="secondary" className="ml-2">
              {totalLogs} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando historial del sistema...</p>
              </div>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron logs</p>
              <p className="text-sm">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Acción</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Solicitud</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Estados</TableHead>
                      <TableHead className="w-32">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsFiltrados.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAccionIcon(log.accion)}
                            <Badge variant={getAccionBadgeVariant(log.accion)}>
                              {getAccionLabel(log.accion)}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {log.usuario ? `${log.usuario.primer_nombre} ${log.usuario.primer_apellido}`.trim() : `Usuario ${log.usuario_id}`}
                            </span>
                            <span className="text-sm text-gray-500">
                              {log.usuario?.email || 'Sin email'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            #{log.solicitud_id}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {log.observacion || 'Sin observaciones'}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {log.estado_anterior && log.estado_nuevo ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.estado_anterior}
                              </Badge>
                              <span className="text-gray-400">→</span>
                              <Badge variant="outline" className="text-xs">
                                {log.estado_nuevo}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No aplica</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-gray-900">
                              {formatDateTime(log.fecha_accion)}
                            </span>
                            <span className="text-gray-500">
                              {formatDate(log.fecha_accion)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Mostrando página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsSistemaPage;

