import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Settings, Eye } from "lucide-react";

interface ViewAction {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  tipo: string;
  orden: number;
  activo: boolean;
}

interface SystemView {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  ruta: string;
  modulo: string;
  icono: string;
  orden: number;
  activo: boolean;
  acciones: ViewAction[];
}

const GestionPermisosPage: React.FC = () => {
  const [selectedVistaId, setSelectedVistaId] = useState<number | null>(null);
  const [showMockData, setShowMockData] = useState(false);

  // Query para obtener todas las vistas con sus acciones
  const { data: viewsWithActions, isLoading: viewsLoading } = useQuery<SystemView[]>({
    queryKey: ['/api/views-with-actions'],
    select: (data: SystemView[]) => {
      console.log('Views with actions received:', data);
      return data || [];
    }
  });

  // Data mock completa con todas las vistas y acciones
  const mockViewsWithActions: SystemView[] = [
    {
      id: 1,
      nombre: "dashboard",
      displayName: "Dashboard Principal",
      descripcion: "Panel de control principal del sistema",
      ruta: "/dashboard",
      modulo: "general",
      icono: "LayoutDashboard",
      orden: 1,
      activo: true,
      acciones: [
        { id: 1, nombre: "ver_dashboard", displayName: "Ver Dashboard", descripcion: "Visualizar el panel principal", tipo: "visualizacion", orden: 1, activo: true },
        { id: 2, nombre: "ver_estadisticas", displayName: "Ver Estadísticas", descripcion: "Acceder a métricas y estadísticas", tipo: "visualizacion", orden: 2, activo: true },
        { id: 3, nombre: "exportar_dashboard", displayName: "Exportar Dashboard", descripcion: "Exportar datos del dashboard", tipo: "exportacion", orden: 3, activo: true }
      ]
    },
    {
      id: 2,
      nombre: "usuarios",
      displayName: "Gestión de Usuarios",
      descripcion: "Administración completa de usuarios del sistema",
      ruta: "/usuarios",
      modulo: "seguridad",
      icono: "Users",
      orden: 2,
      activo: true,
      acciones: [
        { id: 4, nombre: "ver_usuarios", displayName: "Ver Usuarios", descripcion: "Visualizar lista de usuarios", tipo: "visualizacion", orden: 1, activo: true },
        { id: 5, nombre: "crear_usuario", displayName: "Crear Usuario", descripcion: "Registrar nuevos usuarios", tipo: "creacion", orden: 2, activo: true },
        { id: 6, nombre: "editar_usuario", displayName: "Editar Usuario", descripcion: "Modificar datos de usuarios", tipo: "edicion", orden: 3, activo: true },
        { id: 7, nombre: "eliminar_usuario", displayName: "Eliminar Usuario", descripcion: "Eliminar usuarios del sistema", tipo: "eliminacion", orden: 4, activo: true },
        { id: 8, nombre: "resetear_password", displayName: "Resetear Contraseña", descripcion: "Restablecer contraseñas de usuarios", tipo: "edicion", orden: 5, activo: true }
      ]
    },
    {
      id: 3,
      nombre: "perfiles",
      displayName: "Gestión de Perfiles",
      descripcion: "Configuración de perfiles y roles de usuario",
      ruta: "/perfiles",
      modulo: "seguridad",
      icono: "UserCheck",
      orden: 3,
      activo: true,
      acciones: [
        { id: 9, nombre: "ver_perfiles", displayName: "Ver Perfiles", descripcion: "Visualizar perfiles de usuario", tipo: "visualizacion", orden: 1, activo: true },
        { id: 10, nombre: "crear_perfil", displayName: "Crear Perfil", descripcion: "Crear nuevos perfiles", tipo: "creacion", orden: 2, activo: true },
        { id: 11, nombre: "editar_perfil", displayName: "Editar Perfil", descripcion: "Modificar perfiles existentes", tipo: "edicion", orden: 3, activo: true },
        { id: 12, nombre: "eliminar_perfil", displayName: "Eliminar Perfil", descripcion: "Eliminar perfiles del sistema", tipo: "eliminacion", orden: 4, activo: true },
        { id: 13, nombre: "asignar_permisos", displayName: "Asignar Permisos", descripcion: "Configurar permisos de perfiles", tipo: "edicion", orden: 5, activo: true }
      ]
    },
    {
      id: 4,
      nombre: "candidatos",
      displayName: "Gestión de Candidatos",
      descripcion: "Administración completa de candidatos",
      ruta: "/candidatos",
      modulo: "registros",
      icono: "Users",
      orden: 4,
      activo: true,
      acciones: [
        { id: 14, nombre: "ver_candidatos", displayName: "Ver Candidatos", descripcion: "Visualizar lista de candidatos", tipo: "visualizacion", orden: 1, activo: true },
        { id: 15, nombre: "crear_candidato", displayName: "Crear Candidato", descripcion: "Registrar nuevos candidatos", tipo: "creacion", orden: 2, activo: true },
        { id: 16, nombre: "editar_candidato", displayName: "Editar Candidato", descripcion: "Modificar datos de candidatos", tipo: "edicion", orden: 3, activo: true },
        { id: 17, nombre: "eliminar_candidato", displayName: "Eliminar Candidato", descripcion: "Eliminar candidatos del sistema", tipo: "eliminacion", orden: 4, activo: true },
        { id: 18, nombre: "aprobar_candidato", displayName: "Aprobar Candidato", descripcion: "Aprobar candidatos para contratación", tipo: "aprobacion", orden: 5, activo: true },
        { id: 19, nombre: "exportar_candidatos", displayName: "Exportar Candidatos", descripcion: "Exportar datos de candidatos", tipo: "exportacion", orden: 6, activo: true }
      ]
    },
    {
      id: 5,
      nombre: "empresas",
      displayName: "Gestión de Empresas",
      descripcion: "Administración de empresas clientes",
      ruta: "/empresas",
      modulo: "empresa",
      icono: "Building",
      orden: 5,
      activo: true,
      acciones: [
        { id: 20, nombre: "ver_empresas", displayName: "Ver Empresas", descripcion: "Visualizar empresas registradas", tipo: "visualizacion", orden: 1, activo: true },
        { id: 21, nombre: "crear_empresa", displayName: "Crear Empresa", descripcion: "Registrar nuevas empresas", tipo: "creacion", orden: 2, activo: true },
        { id: 22, nombre: "editar_empresa", displayName: "Editar Empresa", descripcion: "Modificar datos de empresas", tipo: "edicion", orden: 3, activo: true },
        { id: 23, nombre: "eliminar_empresa", displayName: "Eliminar Empresa", descripcion: "Eliminar empresas del sistema", tipo: "eliminacion", orden: 4, activo: true },
        { id: 24, nombre: "activar_empresa", displayName: "Activar/Desactivar", descripcion: "Cambiar estado de empresas", tipo: "edicion", orden: 5, activo: true }
      ]
    },
    {
      id: 6,
      nombre: "analistas",
      displayName: "Gestión de Analistas",
      descripcion: "Administración de analistas del sistema",
      ruta: "/analistas",
      modulo: "recursos",
      icono: "UserCheck",
      orden: 6,
      activo: true,
      acciones: [
        { id: 25, nombre: "ver_analistas", displayName: "Ver Analistas", descripcion: "Visualizar lista de analistas", tipo: "visualizacion", orden: 1, activo: true },
        { id: 26, nombre: "crear_analista", displayName: "Crear Analista", descripcion: "Registrar nuevos analistas", tipo: "creacion", orden: 2, activo: true },
        { id: 27, nombre: "editar_analista", displayName: "Editar Analista", descripcion: "Modificar datos de analistas", tipo: "edicion", orden: 3, activo: true },
        { id: 28, nombre: "eliminar_analista", displayName: "Eliminar Analista", descripcion: "Eliminar analistas del sistema", tipo: "eliminacion", orden: 4, activo: true },
        { id: 29, nombre: "asignar_casos", displayName: "Asignar Casos", descripcion: "Asignar casos a analistas", tipo: "edicion", orden: 5, activo: true }
      ]
    },
    {
      id: 7,
      nombre: "ordenes",
      displayName: "Expedición de Órdenes",
      descripcion: "Creación y gestión de órdenes de servicio",
      ruta: "/ordenes",
      modulo: "ordenes",
      icono: "FileText",
      orden: 7,
      activo: true,
      acciones: [
        { id: 30, nombre: "ver_ordenes", displayName: "Ver Órdenes", descripcion: "Visualizar órdenes de servicio", tipo: "visualizacion", orden: 1, activo: true },
        { id: 31, nombre: "crear_orden", displayName: "Crear Orden", descripcion: "Generar nuevas órdenes", tipo: "creacion", orden: 2, activo: true },
        { id: 32, nombre: "editar_orden", displayName: "Editar Orden", descripcion: "Modificar órdenes existentes", tipo: "edicion", orden: 3, activo: true },
        { id: 33, nombre: "cancelar_orden", displayName: "Cancelar Orden", descripcion: "Cancelar órdenes de servicio", tipo: "eliminacion", orden: 4, activo: true },
        { id: 34, nombre: "imprimir_orden", displayName: "Imprimir Orden", descripcion: "Generar PDF de órdenes", tipo: "exportacion", orden: 5, activo: true }
      ]
    },
    {
      id: 8,
      nombre: "certificados",
      displayName: "Expedición de Certificados",
      descripcion: "Generación y gestión de certificados médicos",
      ruta: "/certificados",
      modulo: "certificados",
      icono: "Award",
      orden: 8,
      activo: true,
      acciones: [
        { id: 35, nombre: "ver_certificados", displayName: "Ver Certificados", descripcion: "Visualizar certificados emitidos", tipo: "visualizacion", orden: 1, activo: true },
        { id: 36, nombre: "generar_certificado", displayName: "Generar Certificado", descripcion: "Crear nuevos certificados", tipo: "creacion", orden: 2, activo: true },
        { id: 37, nombre: "editar_certificado", displayName: "Editar Certificado", descripcion: "Modificar certificados", tipo: "edicion", orden: 3, activo: true },
        { id: 38, nombre: "anular_certificado", displayName: "Anular Certificado", descripcion: "Anular certificados emitidos", tipo: "eliminacion", orden: 4, activo: true },
        { id: 39, nombre: "imprimir_certificado", displayName: "Imprimir Certificado", descripcion: "Imprimir certificados en PDF", tipo: "exportacion", orden: 5, activo: true },
        { id: 40, nombre: "firmar_certificado", displayName: "Firmar Certificado", descripcion: "Aplicar firma digital", tipo: "aprobacion", orden: 6, activo: true }
      ]
    },
    {
      id: 9,
      nombre: "maestro",
      displayName: "Configuración Maestro",
      descripcion: "Configuración de tipos y documentos del sistema",
      ruta: "/maestro",
      modulo: "configuracion",
      icono: "Settings",
      orden: 9,
      activo: true,
      acciones: [
        { id: 41, nombre: "ver_configuracion", displayName: "Ver Configuración", descripcion: "Visualizar configuraciones maestro", tipo: "visualizacion", orden: 1, activo: true },
        { id: 42, nombre: "editar_configuracion", displayName: "Editar Configuración", descripcion: "Modificar configuraciones del sistema", tipo: "edicion", orden: 2, activo: true },
        { id: 43, nombre: "backup_configuracion", displayName: "Backup Configuración", descripcion: "Respaldar configuraciones", tipo: "exportacion", orden: 3, activo: true }
      ]
    },
    {
      id: 10,
      nombre: "reportes",
      displayName: "Reportes y Análisis",
      descripcion: "Generación de reportes y análisis estadísticos",
      ruta: "/reportes",
      modulo: "reportes",
      icono: "BarChart",
      orden: 10,
      activo: true,
      acciones: [
        { id: 44, nombre: "ver_reportes", displayName: "Ver Reportes", descripcion: "Visualizar reportes disponibles", tipo: "visualizacion", orden: 1, activo: true },
        { id: 45, nombre: "generar_reporte", displayName: "Generar Reporte", descripcion: "Crear reportes personalizados", tipo: "creacion", orden: 2, activo: true },
        { id: 46, nombre: "exportar_datos", displayName: "Exportar Datos", descripcion: "Exportar información en Excel/PDF", tipo: "exportacion", orden: 3, activo: true },
        { id: 47, nombre: "programar_reporte", displayName: "Programar Reporte", descripcion: "Agendar reportes automáticos", tipo: "edicion", orden: 4, activo: true }
      ]
    },
    {
      id: 11,
      nombre: "gestion_permisos",
      displayName: "Gestión de Permisos",
      descripcion: "Configuración avanzada de permisos dinámicos",
      ruta: "/gestion-permisos",
      modulo: "seguridad",
      icono: "Shield",
      orden: 11,
      activo: true,
      acciones: [
        { id: 48, nombre: "ver_permisos", displayName: "Ver Permisos", descripcion: "Visualizar configuración de permisos", tipo: "visualizacion", orden: 1, activo: true },
        { id: 49, nombre: "configurar_permisos", displayName: "Configurar Permisos", descripcion: "Modificar permisos de perfiles", tipo: "edicion", orden: 2, activo: true },
        { id: 50, nombre: "exportar_permisos", displayName: "Exportar Permisos", descripcion: "Exportar configuración de permisos", tipo: "exportacion", orden: 3, activo: true }
      ]
    }
  ];

  // Decidir qué datos usar
  const dataToUse = showMockData ? mockViewsWithActions : (viewsWithActions || []);

  const getModuleColor = (modulo: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'seguridad': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'registros': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'empresa': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'recursos': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'ordenes': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'certificados': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'configuracion': 'bg-brand-gray/10 text-brand-gray border-brand-gray/20',
      'reportes': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20'
    };
    return colors[modulo] || 'bg-brand-gray/10 text-brand-gray border-brand-gray/20';
  };

  const getActionTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'visualizacion': 'bg-blue-100 text-blue-800',
      'creacion': 'bg-green-100 text-green-800',
      'edicion': 'bg-yellow-100 text-yellow-800',
      'eliminacion': 'bg-red-100 text-red-800',
      'exportacion': 'bg-purple-100 text-purple-800',
      'aprobacion': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (viewsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando vistas del sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-brand-lime" />
          <h1 className="text-3xl font-bold text-gray-800">Explorador de Vistas y Acciones</h1>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Sistema completo de permisos con {dataToUse.length} vistas y {dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)} acciones totales organizadas por módulos.
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Fuente de datos:</label>
            <Select value={showMockData ? "mock" : "database"} onValueChange={(value) => setShowMockData(value === "mock")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="database">Base de datos</SelectItem>
                <SelectItem value="mock">Datos Mock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selector de vista para explorar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Explorar Vistas y Acciones del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vista específica:</label>
              <Select 
                onValueChange={(value) => setSelectedVistaId(value === "all" ? null : parseInt(value))} 
                value={selectedVistaId?.toString() || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una vista..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las vistas</SelectItem>
                  {dataToUse.map((vista) => (
                    <SelectItem key={vista.id} value={vista.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded bg-brand-lime/10 text-brand-lime">
                          {vista.modulo.toUpperCase()}
                        </span>
                        <span className="font-medium">{vista.displayName}</span>
                        <span className="text-xs text-gray-500">
                          ({vista.acciones.length} acciones)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Total de vistas: {dataToUse.length}
              </div>
              <div className="text-sm text-gray-600">
                Total de acciones: {dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)}
              </div>
            </div>
            
            <div className="space-y-2">
              {selectedVistaId && (
                <div className="text-sm text-brand-lime font-medium">
                  Vista seleccionada: {dataToUse.find(v => v.id === selectedVistaId)?.displayName}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exploración de vistas y acciones */}
      {viewsWithActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Eye className="h-5 w-5" />
              <span>
                {selectedVistaId 
                  ? `Acciones disponibles en: ${dataToUse.find(v => v.id === selectedVistaId)?.displayName}`
                  : `Todas las Vistas y Acciones del Sistema ${showMockData ? '(MOCK DATA)' : '(BASE DE DATOS)'}`
                }
              </span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              {selectedVistaId 
                ? 'Estas son todas las acciones disponibles en esta vista del sistema.'
                : 'Explore todas las vistas disponibles y sus acciones correspondientes en el sistema ZEUS.'
              }
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumen ejecutivo */}
            <div className="mb-6 p-4 bg-gradient-to-r from-brand-lime/10 to-brand-turquoise/10 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">📋 Resumen del Sistema de Permisos ZEUS {showMockData ? '(DATOS MOCK)' : '(BASE DE DATOS)'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-lime">{dataToUse.length}</div>
                  <div className="text-sm text-gray-600">Vistas Totales</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-turquoise">{dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)}</div>
                  <div className="text-sm text-gray-600">Acciones Totales</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-brand-gray">{new Set(dataToUse.map(v => v.modulo)).size}</div>
                  <div className="text-sm text-gray-600">Módulos</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0)}</div>
                  <div className="text-sm text-gray-600">Vista/Lectura</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(selectedVistaId 
                ? dataToUse.filter(v => v.id === selectedVistaId)
                : dataToUse
              ).map((vista) => (
                <div key={vista.id} className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
                  {/* Vista header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getModuleColor(vista.modulo)}>
                        {vista.modulo.toUpperCase()}
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-lg">{vista.displayName}</h3>
                        <p className="text-sm text-gray-600">{vista.descripcion}</p>
                        <p className="text-xs text-gray-500">Ruta: {vista.ruta} • ID: {vista.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {vista.acciones.length} acciones
                      </div>
                      <div className="text-xs text-gray-500">
                        Orden: {vista.orden}
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas de acciones por tipo */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['visualizacion', 'creacion', 'edicion', 'eliminacion', 'exportacion', 'aprobacion'].map(tipo => {
                      const count = vista.acciones.filter(a => a.tipo === tipo).length;
                      if (count > 0) {
                        return (
                          <Badge key={tipo} className={getActionTypeColor(tipo)}>
                            {tipo}: {count}
                          </Badge>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Acciones de la vista */}
                  {vista.acciones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vista.acciones
                        .sort((a, b) => a.orden - b.orden)
                        .map((accion) => (
                          <div key={accion.id} className="border rounded-md p-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{accion.displayName}</h4>
                              <Badge className={getActionTypeColor(accion.tipo)}>
                                {accion.tipo}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{accion.descripcion}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Código: <code className="bg-gray-200 px-1 rounded">{accion.nombre}</code></span>
                              <span>ID: {accion.id}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50/50 rounded-lg">
                      ⚠️ No hay acciones definidas para esta vista
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tabla resumen al final */}
            {!selectedVistaId && (
              <div className="mt-8 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800">📊 Tabla Resumen de Todas las Acciones por Vista</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Vista</th>
                        <th className="px-4 py-2 text-left">Módulo</th>
                        <th className="px-4 py-2 text-center">Total</th>
                        <th className="px-4 py-2 text-center">Ver</th>
                        <th className="px-4 py-2 text-center">Crear</th>
                        <th className="px-4 py-2 text-center">Editar</th>
                        <th className="px-4 py-2 text-center">Eliminar</th>
                        <th className="px-4 py-2 text-center">Otros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataToUse.map((vista) => {
                        const ver = vista.acciones.filter(a => a.tipo === 'visualizacion').length;
                        const crear = vista.acciones.filter(a => a.tipo === 'creacion').length;
                        const editar = vista.acciones.filter(a => a.tipo === 'edicion').length;
                        const eliminar = vista.acciones.filter(a => a.tipo === 'eliminacion').length;
                        const otros = vista.acciones.filter(a => !['visualizacion', 'creacion', 'edicion', 'eliminacion'].includes(a.tipo)).length;
                        
                        return (
                          <tr key={vista.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{vista.displayName}</td>
                            <td className="px-4 py-2">
                              <Badge className={getModuleColor(vista.modulo)} variant="outline">
                                {vista.modulo}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center font-semibold">{vista.acciones.length}</td>
                            <td className="px-4 py-2 text-center">{ver || '-'}</td>
                            <td className="px-4 py-2 text-center">{crear || '-'}</td>
                            <td className="px-4 py-2 text-center">{editar || '-'}</td>
                            <td className="px-4 py-2 text-center">{eliminar || '-'}</td>
                            <td className="px-4 py-2 text-center">{otros || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold">
                      <tr>
                        <td className="px-4 py-2">TOTALES</td>
                        <td className="px-4 py-2">{new Set(dataToUse.map(v => v.modulo)).size} módulos</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)}</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'creacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'edicion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'eliminacion').length, 0)}</td>
                        <td className="px-4 py-2 text-center">{dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => !['visualizacion', 'creacion', 'edicion', 'eliminacion'].includes(a.tipo)).length, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestionPermisosPage;