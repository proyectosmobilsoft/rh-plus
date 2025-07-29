
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./Layout.css";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Users,
  User,
  Briefcase,
  FileText,
  Calendar,
  Building,
  Layers,
  Settings,
  Menu,
  LogOut,
  UserCheck,
  BarChart3,
  Activity,
  ChevronRight,
  QrCode,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/logo2.svg";

// Define los menús y submenús
const menuItems = [
  {
    title: "Dashboard",
    icon: <Activity className="h-5 w-5" />,
    path: "/dashboard",
    subItems: [],
  },
  {
    title: "Registros",
    icon: <Users className="h-5 w-5" />,
    subItems: [
      { title: "Empresas Afiliadas", path: "/registros/empresas", icon: <Building className="h-4 w-4" /> },
      { title: "Candidatos", path: "/registros/candidatos", icon: <User className="h-4 w-4" /> },
      { title: "Prestadores", path: "/registros/prestadores", icon: <Briefcase className="h-4 w-4" /> },
      { title: "Códigos QR", path: "/registros/qr", icon: <QrCode className="h-4 w-4" /> },
    ],
  },
  {
    title: "Expedicion de Orden",
    icon: <FileText className="h-5 w-5" />,
    path: "/ordenes/expedicion",
    subItems: [],
  },

  {
    title: "Expedicion de Certificados",
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
      { title: "Tipos de Documentos", path: "/maestro/tipos-candidatos", icon: <FileText className="h-4 w-4" /> },
      { title: "Plantillas", path: "/maestro/plantillas", icon: <Layers className="h-4 w-4" /> },
      { title: "Ubicaciones", path: "/maestro/ubicaciones", icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    title: "Seguridad",
    icon: <Settings className="h-5 w-5" />,
    subItems: [
      { title: "Usuarios", path: "/seguridad/usuarios", icon: <Users className="h-4 w-4" /> },
      { title: "Perfiles", path: "/seguridad/perfiles", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

// Componente para el header
const Header = () => {
  // Obtener función de logout del AuthContext
  let logout: (() => Promise<void>) | null = null;
  try {
    const auth = useAuth();
    logout = auth.logout;
  } catch (error) {
    console.warn('AuthProvider no disponible para logout en header');
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4">
      <SidebarTrigger />
      <div className="ml-4">
        <h1 className="text-lg font-semibold text-gray-800">Sistema de Recursos Humanos</h1>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        {/* ThemeSwitcher temporalmente removido */}
        <div className="flex items-center bg-brand-lime/10 text-brand-lime px-3 py-1 rounded-full text-sm font-medium border border-brand-lime/20 hover-lift">
          <User className="w-4 h-4 mr-2" />
          Administrador
        </div>
        {/* Botón de cerrar sesión en header */}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={async () => {
            if (logout) {
              await logout();
            } else {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              window.location.href = '/login';
            }
          }}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Cerrar
        </Button>
      </div>
    </header>
  );
};

// Componente para el sidebar
const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  // Obtener función de logout del AuthContext
  let logout: (() => Promise<void>) | null = null;
  try {
    const auth = useAuth();
    logout = auth.logout;
  } catch (error) {
    console.warn('AuthProvider no disponible para logout');
  }
  
  // Control state for each menu group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Initialize open state based on current path
    const initialState: Record<string, boolean> = {};
    menuItems.forEach((item, index) => {
      if (item.subItems.some(subItem => currentPath.startsWith(subItem.path))) {
        initialState[index] = true;
      } else {
        initialState[index] = false;
      }
    });
    return initialState;
  });

  const toggleGroup = (index: number) => {
    setOpenGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Sidebar
      className={`border-r h-screen sidebar-transition ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}
      collapsible="offcanvas"
    >
      <div className="p-4 flex justify-center items-center">
        {!collapsed && (
          <div className="logo-sidebar"
            style={{
              backgroundImage: `url(${logo})`
            }}
          ></div>
        )}
      </div>
      <SidebarContent className="p-2 sidebar-compact">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.title}>
            {item.subItems.length === 0 ? (
              // Elemento sin subítems
              (<Link
                to={item.path || "/"}
                className={`flex items-center space-x-2 rounded-md px-3 py-1.5 mb-1 sidebar-item sidebar-menu-group ${
                  currentPath === item.path
                    ? "active"
                    : ""
                }`}
              >
                {item.icon}
                {!collapsed && <span className="text-base font-medium">{item.title}</span>}
              </Link>)
            ) : (
              // Grupo con subítems
              (<SidebarGroup>
                <SidebarGroupLabel 
                  className={`flex items-center justify-between cursor-pointer sidebar-item sidebar-menu-group px-3 py-1.5 rounded-md ${
                    item.subItems.some(subItem => currentPath.startsWith(subItem.path))
                      ? "active"
                      : ""
                  }`}
                  onClick={() => toggleGroup(index)}
                >
                  <span className="flex items-center space-x-2">
                    {item.icon}
                    {!collapsed && (
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <ChevronRight className={`w-5 h-5 dropdown-arrow transition-transform duration-200 ${openGroups[index] ? 'open' : ''}`} />
                  )}
                </SidebarGroupLabel>
                {openGroups[index] && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton asChild>
                            <Link
                              to={subItem.path}
                              className={`flex items-center space-x-2 w-full py-1.5 rounded-md sidebar-item sidebar-submenu-item ${
                                currentPath === subItem.path
                                  ? "active"
                                  : ""
                              }`}
                            >
                              {subItem.icon}
                              {!collapsed && <span className="ml-1 text-sm font-medium">{subItem.title}</span>}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>)
            )}
          </React.Fragment>
        ))}
        
        {/* Logout Button at Bottom */}
        <div className="mt-auto p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={async () => {
              if (logout) {
                // Usar función de logout del AuthContext
                await logout();
              } else {
                // Fallback: limpiar localStorage y redirigir
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = '/login';
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
