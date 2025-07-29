import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { guardarEmpresaSeleccionada, obtenerEmpresaSeleccionada, limpiarEmpresaSeleccionada, debugLocalStorage } from '@/utils/empresaUtils';
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
    path: "/ordenes/expedicion",
    subItems: [],
  },
  {
    title: "Certificados",
    icon: <FileText className="h-5 w-5" />,
    path: "/certificados/expedicion",
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
      { title: "Tipos", path: "/maestro/tipos-candidatos", icon: <FileText className="h-4 w-4" /> },
      { title: "Plantillas", path: "/maestro/plantillas", icon: <Layers className="h-4 w-4" /> },
      { title: "Ubicaciones", path: "/maestro/ubicaciones", icon: <MapPin className="h-4 w-4" /> },
    ],
  },
];

interface DynamicSidebarProps {
  onNavigate?: (path: string) => void;
}

export function DynamicSidebar({ onNavigate }: DynamicSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [empresaData, setEmpresaData] = useState<any>(null);
  
  // Verificar si AuthProvider está disponible
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.log("AuthProvider no disponible");
  }

  const { user, logout } = authContext || {};
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Verificar si hay datos de usuario en localStorage como fallback
  const [localUserData, setLocalUserData] = useState<any>(null);
  
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setLocalUserData(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    }
  }, []);

  // Usar datos del contexto o localStorage como fallback
  const currentUser = user || localUserData;

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
      
      const empresaSeleccionada = obtenerEmpresaSeleccionada();
      if (empresaSeleccionada) {
        setEmpresaData(empresaSeleccionada);
        console.log('Empresa cargada desde localStorage:', empresaSeleccionada);
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
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full shadow-lg sidebar-container">
      {/* Header con información del usuario */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 sidebar-header">
        <div className="flex items-center space-x-3">
          <div className="user-avatar-large bg-blue-600">
            <User className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {currentUser ? `${currentUser.primerNombre} ${currentUser.primerApellido}` : 'Usuario'}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`text-xs px-2 py-1 ${getRoleColor(currentUser?.role || 'default')} font-medium`}>
                {getRoleLabel(currentUser?.role || 'default')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de navegación */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent sidebar-scroll">
        <div className="p-3">
          <h2 className="text-sm font-bold text-gray-900 mb-4 px-2 uppercase tracking-wide">
            {empresaData?.nombre || empresaData?.razonSocial || 'Sistema'}
          </h2>
          
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
      </div>

      {/* Footer con logout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 sidebar-footer">
        <Button
          onClick={() => {
            // Limpiar todo el localStorage
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('empresaData'); // Borrar también empresaData
            
            // Limpiar empresa seleccionada
            limpiarEmpresaSeleccionada();
            
            console.log('Sesión cerrada desde sidebar - todos los datos eliminados');
            
            // Intentar usar logout del contexto si está disponible
            if (logout) {
              logout();
            }
            
            // Redirigir al login
            window.location.href = '/login';
          }}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50 text-sm py-2.5 font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}