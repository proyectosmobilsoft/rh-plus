import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink, matchPath } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { guardarEmpresaSeleccionada, obtenerEmpresaSeleccionada, limpiarEmpresaSeleccionada, debugLocalStorage } from '@/utils/empresaUtils';
import { createPortal } from 'react-dom';
import {
  Activity,
  Users,
  Building,
  User,
  Briefcase,
  QrCode,
  FileText,
  UserCheck,
  Settings,
  Layers,
  MapPin,
  ChevronDown,
  ChevronRight,
  LogOut,
  Info,
  Globe,
  Mail,
  Shield,
  ClipboardList,
  Award,
  Key,
  ClipboardCheck,
  FileCheck,
  Database,
  Lock,
} from 'lucide-react';

const menuItems = [
  {
    title: "Dashboard",
    icon: <Activity className="h-5 w-5" />,
    path: "/dashboard",
    subItems: [],
  },
  {
    title: "Seguridad",
    icon: <Shield className="h-5 w-5" />,
    subItems: [
      { title: "Usuarios", path: "/seguridad/usuarios", icon: <Users className="h-4 w-4" /> },
      { title: "Perfiles", path: "/seguridad/perfiles", icon: <Key className="h-4 w-4" /> },
      { title: "Permisos", path: "/seguridad/permisos", icon: <Lock className="h-4 w-4" /> },
      { title: "Logs del Sistema", path: "/seguridad/logs-sistema", icon: <Activity className="h-4 w-4" /> },
    ],
  },
  {
    title: "Maestros",
    icon: <Database className="h-5 w-5" />,
    subItems: [
      { title: "Tipos de Documentos", path: "/maestro/tipos-documentos", icon: <FileText className="h-4 w-4" /> },
      { title: "Tipos de Cargos", path: "/maestro/tipos-candidatos", icon: <Award className="h-4 w-4" /> },
      { title: "Plantillas", path: "/maestro/plantillas", icon: <Layers className="h-4 w-4" /> },
      { title: "Ubicaciones", path: "/maestro/ubicaciones", icon: <MapPin className="h-4 w-4" /> },
      { title: "Centros de Costos", path: "/maestro/centros-costo", icon: <Building className="h-4 w-4" /> },
      { title: "Correos Masivos", path: "/maestro/correos-masivos", icon: <Mail className="h-4 w-4" /> },
    ],
  },
  {
    title: "Registros",
    icon: <Users className="h-5 w-5" />,
    subItems: [
      { title: "Empresas", path: "/registros/empresas", icon: <Building className="h-4 w-4" /> },
      { title: "Candidatos", path: "/registros/candidatos", icon: <User className="h-4 w-4" /> },
      { title: "Prestadores", path: "/registros/prestadores", icon: <Briefcase className="h-4 w-4" /> },
      { title: "Códigos QR", path: "/registros/qr", icon: <QrCode className="h-4 w-4" /> },
    ],
  },
  {
    title: "Solicitudes",
    icon: <ClipboardList className="h-5 w-5" />,
    path: "/expedicion-orden",
    subItems: [],
  },
  {
    title: "Certificados",
    icon: <FileText className="h-5 w-5" />,
    path: "/expedicion-certificados",
    subItems: [],
  },
  {
    title: "Analistas",
    icon: <UserCheck className="h-5 w-5" />,
    path: "/analistas",
    subItems: [],
  },

  {
    title: "Configuración",
    icon: <Settings className="h-5 w-5" />,
    path: "/configuraciones/globales",
    subItems: [],
  }, {
    title: "Acerca de la Empresa",
    icon: <Info className="h-5 w-5" />,
    path: "/empresa/acerca",
    subItems: [],
  },
];

interface DynamicSidebarProps {
  onNavigate?: (path: string) => void;
}

export function DynamicSidebar({ onNavigate }: DynamicSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log("AuthProvider no disponible");
  }

  const { user, logout } = authContext || {};
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [showUserOverlay, setShowUserOverlay] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Cargar userData de localStorage
  useEffect(() => {
    const currentUserData = localStorage.getItem('userData');
    if (currentUserData) {
      try {
        const parsed = JSON.parse(currentUserData);
        setUserData(parsed);
      } catch { }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'userData') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUserData(parsed);
        } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const accionesSet = React.useMemo(() => new Set<string>(Array.isArray(userData?.acciones) ? userData.acciones : []), [userData]);

  // Mapeo dinámico de rutas -> acciones requeridas (OR entre códigos listados)
  const pathToActions: Record<string, string[]> = React.useMemo(() => ({
    // Dashboard
    '/dashboard': ['vista-dashboard'],

    // Seguridad
    '/seguridad/usuarios': ['vista_usuarios'],
    '/seguridad/perfiles': ['vista_perfiles'],
    '/seguridad/permisos': ['vista_permisos'],
    '/seguridad/logs-sistema': ['vista_logs'],

    // Maestro (subsecciones)
    '/maestro/tipos-documentos': ['vista-tipo-documentos'],
    '/maestro/tipos-candidatos': ['vista-tipo-cargos'],
    '/maestro/plantillas': ['vista-plantillas'],
    '/maestro/ubicaciones': ['vista-ubicaciones'],
    '/maestro/centros-costo': ['vista-centros-costo'],
    '/maestro/correos-masivos': ['vista-correos-masivos'],

    // Registros
    '/registros/candidatos': ['vista-candidatos'],
    '/candidatos': ['vista-candidatos'],
    '/registros/empresas': ['vista-empresas'],
    '/registros/prestadores': ['vista-prestadores'],
    // QR (oculto si no hay permiso específico)
    '/registros/qr': ['vista-qr'],


    // Órdenes / Solicitudes
    '/expedicion-orden': ['vista-solicitudes'],

    // Certificados
    '/expedicion-certificados': ['vista-certificados'],

    // Analistas
    '/analistas': ['vista-analistas'],

    // Acerca de la Empresa
    '/empresa/acerca': ['vista-acerca-empresa'],

    // Acerca de la Empresa
    '/configuraciones/globales': ['vista-configuracion'],

    // Reportes
    '/reportes': ['reportes_view', 'ver_reportes'],
    '/reportes/dashboard': ['reportes_view', 'ver_reportes'],
  }), []);

  const isAllowedPath = (path?: string) => {
    if (!path) return false;
    const required = pathToActions[path];
    if (!required) return false; // si no está mapeado, ocultar por defecto
    // OR: basta con que el usuario tenga uno de los códigos listados
    return required.some(code => accionesSet.has(code));
  };

  const toggleMenu = (index: number) => {
    const newExpanded = new Set(expandedMenus);
    const menuKey = index.toString();
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey);
    } else {
      newExpanded.add(menuKey);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavigate = (path: string) => {
    if (path && path !== '#') {
      // Colapsar menús y cerrar overlays para evitar estados pegados
      setExpandedMenus(new Set());
      setShowUserOverlay(false);
      navigate(path);
      if (onNavigate) onNavigate(path);
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    // Por defecto, exact match
    return !!matchPath({ path, end: true }, location.pathname);
  };

  // Filtrado por permisos de acciones
  const filteredMenus = React.useMemo(() => {
    return menuItems
      .map((menu) => {
        const hasChildren = menu.subItems && menu.subItems.length > 0;
        if (hasChildren) {
          const children = (menu.subItems || []).filter((si: any) => isAllowedPath(si.path));
          if (children.length === 0) return null;
          return { ...menu, subItems: children };
        }
        // Menú directo
        return isAllowedPath(menu.path) ? menu : null;
      })
      .filter(Boolean) as typeof menuItems;
  }, [accionesSet]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'analista':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      case 'candidato':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'analista':
        return 'Analista';
      case 'cliente':
        return 'Cliente';
      case 'candidato':
        return 'Candidato';
      default:
        return role;
    }
  };

  return (
    <div className="sidebar-container" ref={sidebarRef}>
      {/* Header con información del usuario */}
      <div className="sidebar-header">
        {/* Indicador de estado en línea en la esquina superior derecha */}

        <div className="flex justify-between space-x-3">
          <button
            onClick={() => setShowUserOverlay(!showUserOverlay)}
            className="user-avatar-large bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer overflow-hidden flex-shrink-0"
          >
            {userData?.foto_base64 ? (
              <img src={userData.foto_base64} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="text-white" />
            )}
          </button>
          {/* Información adicional del usuario */}
          <div className="mt-3 space-y-2">
            {/* Estado de conexión */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${userData?.activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 font-medium">
                  {userData?.activo ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>

            {/* Última actividad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 group relative">

                <span className="text-xs text-gray-600">
                  {userData?.ultimoAcceso
                    ? new Date(userData.ultimoAcceso).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : 'No disponible'
                  }
                </span>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                  {userData?.ultimoAcceso
                    ? ((new Date().getTime() - new Date(userData.ultimoAcceso).getTime()) < 5 * 60 * 1000)
                      ? 'Acceso reciente (últimos 5 min)'
                      : 'Acceso anterior (más de 5 min)'
                    : 'Información no disponible'
                  }
                  <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Información del usuario */}
        <div className="flex items-start space-x-3">

          {/* Información del usuario: nombre y detalles adicionales */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userData ? `${userData.primerNombre} ${userData.primerApellido}` : 'Usuario'}
            </p>

            {/* Información adicional del usuario */}
            <div className="user-info-section">
              {/* Email */}
              <div className="user-info-item">
                <Mail className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">{userData?.email || ''}</p>
              </div>

              {/* Rol/Perfil */}
              {userData?.roles && userData.roles.length > 0 && (
                <div className="user-info-item">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {userData.roles[0]?.nombre || userData?.role || 'Rol'}
                  </p>
                </div>
              )}

              {/* Empresa asociada */}
              {userData?.empresas && userData.empresas.length > 0 && (
                <div className="user-info-item">
                  <Building className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {userData.empresas[0]?.razon_social || 'Empresa'}
                  </p>
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="mt-3 border-t border-gray-200"></div>



        {/* Overlay del usuario */}
        {showUserOverlay && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-start">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-25"
              onClick={() => setShowUserOverlay(false)}
            ></div>

            {/* Modal */}
            <div className="relative mt-16 ml-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[400px] max-w-[500px] max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Header del overlay */}
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                  <div className="user-avatar-large bg-blue-600 overflow-hidden">
                    {userData?.foto_base64 ? (
                      <img src={userData.foto_base64} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {userData ? `${userData.primerNombre} ${userData.primerApellido}` : 'Usuario'}
                    </h3>
                    <p className="text-sm text-gray-500">{userData?.email}</p>
                    <p className="text-xs text-blue-600 font-medium">{userData?.role}</p>
                  </div>
                  <button
                    onClick={() => setShowUserOverlay(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Información detallada */}
                <div className="space-y-4">
                  {/* Perfiles */}
                  {userData?.roles && userData.roles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Perfiles asignados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.roles.map((role: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                            {role.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empresas */}
                  {userData?.empresas && userData.empresas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Empresas asociadas:</h4>
                      <div className="space-y-2">
                        {userData.empresas.map((empresa: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-900">{empresa.razon_social}</p>
                            <p className="text-xs text-gray-500">ID: {empresa.id}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Usuario ID:</p>
                        <p className="font-medium">{userData?.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Estado:</p>
                        <p className="font-medium">{userData?.activo ? 'Activo' : 'Inactivo'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de cerrar sesión */}
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowUserOverlay(false);
                      // Limpiar todo el localStorage
                      localStorage.removeItem('userData');
                      localStorage.removeItem('token');
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('empresaData');

                      // Limpiar empresa seleccionada
                      limpiarEmpresaSeleccionada();

                      console.log('Sesión cerrada desde overlay - todos los datos eliminados');

                      // Intentar usar logout del contexto si está disponible
                      if (logout) {
                        logout();
                      }

                      // Redirigir al login
                      window.location.href = '/login';
                    }}
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Sistema de navegación con filtrado por permisos */}
      <div className="sidebar-scroll">
        <nav className="space-y-1">

          {filteredMenus.map((menu, index) => {
            const hasChildren = menu.subItems && menu.subItems.length > 0;
            const isExpanded = expandedMenus.has(index.toString());
            const isMenuActive = isActive((menu as any).path);

            return (
              <div key={index} className="mb-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${isMenuActive ? 'menu-item-active' : ''
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {menu.icon}
                      <span>{menu.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={(menu as any).path || '#'}
                    onClick={() => handleNavigate((menu as any).path || '#')}
                    className={({ isActive: active }) => `w-full block text-left px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${active ? 'menu-item-active' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {menu.icon}
                      <span>{menu.title}</span>
                    </div>
                  </NavLink>
                )}

                {/* Submenús */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                    {menu.subItems?.map((subItem: any, subIndex: number) => {
                      const isSubItemActive = isActive(subItem.path);
                      return (
                        <NavLink
                          key={subIndex}
                          to={subItem.path || '#'}
                          onClick={() => handleNavigate(subItem.path || '#')}
                          className={({ isActive: active }) => `w-full block text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 menu-item-animation sidebar-menu-item ${active ? 'menu-item-active' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        {/* El botón de logout ahora está en el overlay del usuario */}
      </div>
    </div>
  );
}