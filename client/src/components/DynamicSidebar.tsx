import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    icon: <Settings className="h-5 w-5" />,
    subItems: [
      { title: "Usuarios", path: "/seguridad/usuarios", icon: <Users className="h-4 w-4" /> },
      { title: "Perfiles", path: "/seguridad/perfiles", icon: <Settings className="h-4 w-4" /> },
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
    icon: <FileText className="h-5 w-5" />,
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
    title: "Maestro",
    icon: <Settings className="h-5 w-5" />,
    subItems: [
      { title: "Tipos de Cargos", path: "/maestro/tipos-candidatos", icon: <FileText className="h-4 w-4" /> },
      { title: "Tipos de Documentos", path: "/maestro/tipos-documentos", icon: <FileText className="h-4 w-4" /> },
      { title: "Plantillas", path: "/maestro/plantillas", icon: <Layers className="h-4 w-4" /> },
      { title: "Ubicaciones", path: "/maestro/ubicaciones", icon: <MapPin className="h-4 w-4" /> },
      { title: "Estructura Financiera", path: "/maestro/estructura-financiera", icon: <Building className="h-4 w-4" /> },
      { title: "Correos Masivos", path: "/maestro/correos-masivos", icon: <Mail className="h-4 w-4" /> },
    ],
  },
  {
    title: "Acerca de la Empresa",
    icon: <Info className="h-5 w-5" />,
    path: "/empresa/acerca",
    subItems: [],
  },
     {
     title: "Configuración",
     icon: <Globe className="h-5 w-5" />,
     path: "/configuraciones/globales",
     subItems: [],
   },
];

interface DynamicSidebarProps {
  onNavigate?: (path: string) => void;
}

export function DynamicSidebar({ onNavigate }: DynamicSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [showUserOverlay, setShowUserOverlay] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  
  // Verificar si AuthProvider está disponible
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log("AuthProvider no disponible");
  }

  const { user, logout } = authContext || {};
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Obtener información de la empresa desde localStorage
  useEffect(() => {
    try {
      console.log('=== INICIO: Cargar empresa en DynamicSidebar ===');
      
      // Verificar estado actual de localStorage
      const currentUserData = localStorage.getItem('userData');
      const currentAuthToken = localStorage.getItem('authToken');
      const currentEmpresaData = localStorage.getItem('empresaData');
      
      console.log('📊 Estado actual de localStorage en DynamicSidebar:');
      console.log('- userData existe:', !!currentUserData);
      console.log('- authToken existe:', !!currentAuthToken);
      console.log('- empresaData existe:', !!currentEmpresaData);
      
      debugLocalStorage();
      
      // Cargar datos reales del usuario desde localStorage
      if (currentUserData) {
        try {
          const parsedUserData = JSON.parse(currentUserData);
          setUserData(parsedUserData);
          console.log('✅ Datos del usuario cargados desde localStorage:', parsedUserData);
        } catch (error) {
          console.error('Error parseando userData:', error);
        }
      }
      
      // Intentar obtener empresa desde authToken primero
      if (currentAuthToken) {
        try {
          const tokenParts = currentAuthToken.split('.');
          if (tokenParts.length === 2) {
            const tokenData = JSON.parse(atob(tokenParts[0]));
            console.log('🔍 Datos del authToken:', tokenData);
            
            if (tokenData.empresaId && tokenData.empresaRazonSocial) {
              const empresaFromToken = {
                id: tokenData.empresaId,
                razon_social: tokenData.empresaRazonSocial
              };
              setEmpresaData(empresaFromToken);
              console.log('✅ Empresa cargada desde authToken:', empresaFromToken);
              return;
            }
          }
        } catch (error) {
          console.log('Error parseando authToken:', error);
        }
      }
      
      // Fallback: obtener empresa desde empresaData
      const empresaSeleccionada = obtenerEmpresaSeleccionada();
      if (empresaSeleccionada) {
        setEmpresaData(empresaSeleccionada);
        console.log('✅ Empresa cargada desde empresaData:', empresaSeleccionada);
      } else {
        console.log('No se encontró empresa seleccionada');
      }
      
      console.log('=== FIN: Cargar empresa en DynamicSidebar ===');
    } catch (error) {
      console.error('Error al obtener datos de la empresa:', error);
    }
  }, []);

  // Listener para el evento personalizado de selección de empresa
  useEffect(() => {
    const handleEmpresaSelected = (event: CustomEvent) => {
      const empresa = event.detail;
      console.log('Evento empresaSelected recibido:', empresa);
      setEmpresaData(empresa);
    };

    window.addEventListener('empresaSelected', handleEmpresaSelected as EventListener);
    return () => window.removeEventListener('empresaSelected', handleEmpresaSelected as EventListener);
  }, []);

  // Listener para detectar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('🔄 Cambio detectado en localStorage:');
      console.log('- Key:', e.key);
      console.log('- Old value:', e.oldValue);
      console.log('- New value:', e.newValue);
      
      if (e.key === 'empresaData') {
        try {
          const newEmpresaData = e.newValue ? JSON.parse(e.newValue) : null;
          if (newEmpresaData) {
            setEmpresaData(newEmpresaData);
            console.log('Empresa actualizada desde localStorage:', newEmpresaData);
          }
        } catch (error) {
          console.error('Error al procesar cambio en localStorage:', error);
        }
      }
      
      // Detectar cambios en userData
      if (e.key === 'userData') {
        try {
          const newUserData = e.newValue ? JSON.parse(e.newValue) : null;
          if (newUserData) {
            setUserData(newUserData);
            console.log('✅ Datos del usuario actualizados desde localStorage:', newUserData);
          }
        } catch (error) {
          console.error('Error al procesar cambio en userData:', error);
        }
      }
      
      // Detectar si se borran datos de autenticación
      if (e.key === 'userData' || e.key === 'authToken') {
        console.log('⚠️ ATENCIÓN: Se modificó dato de autenticación:', e.key);
        console.log('- Valor anterior:', e.oldValue ? 'existe' : 'null');
        console.log('- Valor nuevo:', e.newValue ? 'existe' : 'null');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Verificar periódicamente si se borran datos de autenticación
  useEffect(() => {
    const checkAuthData = () => {
      const userData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('authToken');
      
      if (!userData || !authToken) {
        console.log('🚨 ALERTA: Datos de autenticación faltantes:');
        console.log('- userData:', !!userData);
        console.log('- authToken:', !!authToken);
        console.log('Stack trace:', new Error().stack);
      }
    };

    // Verificar cada 2 segundos
    const interval = setInterval(checkAuthData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Función global para manejar la selección de empresa (llamar desde el login)
  const handleEmpresaSelection = (empresa: any) => {
    const resultado = guardarEmpresaSeleccionada(empresa);
    if (resultado) {
      setEmpresaData(empresa);
    }
  };

  // Exponer la función globalmente para que se pueda llamar desde el login
  useEffect(() => {
    (window as any).handleEmpresaSelection = handleEmpresaSelection;
    return () => {
      delete (window as any).handleEmpresaSelection;
    };
  }, []);

  // Función para actualizar la empresa seleccionada
  const updateSelectedEmpresa = (empresa: any) => {
    handleEmpresaSelection(empresa);
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
      // Usar navigate para navegar sin recargar la página
      navigate(path);
      
      // Llamar a onNavigate si está disponible
      if (onNavigate) {
        onNavigate(path);
      }
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
        {/* Información del usuario */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowUserOverlay(!showUserOverlay)}
            className="user-avatar-large bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            <User className="text-white" />
          </button>
          
          {/* Información del usuario (siempre visible) */}
          <div className="flex-1 min-w-0">
            {/* Nombre completo del usuario */}
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userData ? `${userData.primerNombre} ${userData.primerApellido}` : 'Usuario'}
            </p>
            
            {/* Perfiles/Roles del usuario */}
            {userData?.roles && userData.roles.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {userData.roles.map((role: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0.5">
                      {role.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
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
                    <div className="user-avatar-large bg-blue-600">
                      <User className="text-white" />
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
      </div>

      {/* Sistema de navegación con Flexbox perfecto */}
      <div className="sidebar-scroll">
        <nav className="space-y-1">
          {menuItems.map((menu, index) => {
            const hasChildren = menu.subItems && menu.subItems.length > 0;
            const isExpanded = expandedMenus.has(index.toString());
            const isMenuActive = isActive(menu.path);

            return (
              <div key={index} className="mb-1">
                {hasChildren ? (
                  // Menú con submenús
                  <button
                    onClick={() => toggleMenu(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${
                      isMenuActive ? 'menu-item-active' : ''
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
                  // Menú directo
                  <button
                    onClick={() => handleNavigate(menu.path || '#')}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${
                      isMenuActive
                        ? 'menu-item-active'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {menu.icon}
                      <span>{menu.title}</span>
                    </div>
                  </button>
                )}

                {/* Submenús */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                    {menu.subItems?.map((subItem, subIndex) => {
                      const isSubItemActive = isActive(subItem.path);

                      return (
                        <button
                          key={subIndex}
                          onClick={() => handleNavigate(subItem.path || '#')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 menu-item-animation sidebar-menu-item ${
                            isSubItemActive
                              ? 'menu-item-active'
                              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </div>
                        </button>
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