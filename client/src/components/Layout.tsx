
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./Layout.css";
import { DynamicSidebar } from "./DynamicSidebar";
import { obtenerEmpresaSeleccionada } from "@/utils/empresaUtils";
import {
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente para el header
const Header = () => {
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Obtener función de logout del AuthContext
  let logout: (() => Promise<void>) | null = null;
  let user: any = null;
  try {
    const authContext = useAuth();
    logout = authContext.logout;
    user = authContext.user;
  } catch (error) {
    console.log("AuthProvider no disponible");
  }

  // Obtener información de la empresa y usuario desde localStorage
  useEffect(() => {
    try {
      console.log('=== INICIO: Cargar datos en Header ===');
      
      // Verificar estado actual de localStorage
      const currentUserData = localStorage.getItem('userData');
      const currentAuthToken = localStorage.getItem('authToken');
      const currentEmpresaData = localStorage.getItem('empresaData');
      
      console.log('📊 Estado actual de localStorage en Header:');
      console.log('- userData existe:', !!currentUserData);
      console.log('- authToken existe:', !!currentAuthToken);
      console.log('- empresaData existe:', !!currentEmpresaData);
      
      // Intentar obtener empresa desde authToken primero
      if (currentAuthToken) {
        try {
          const tokenParts = currentAuthToken.split('.');
          if (tokenParts.length === 2) {
            const tokenData = JSON.parse(atob(tokenParts[0]));
            console.log('🔍 Datos del authToken en Header:', tokenData);
            
            if (tokenData.empresaId && tokenData.empresaRazonSocial) {
              const empresaFromToken = {
                id: tokenData.empresaId,
                razon_social: tokenData.empresaRazonSocial
              };
              setEmpresaData(empresaFromToken);
              console.log('✅ Empresa cargada desde authToken en Header:', empresaFromToken);
            }
          }
        } catch (error) {
          console.log('Error parseando authToken en Header:', error);
        }
      }
      
      // Fallback: obtener empresa desde empresaData
      const empresaSeleccionada = obtenerEmpresaSeleccionada();
      if (empresaSeleccionada) {
        setEmpresaData(empresaSeleccionada);
        console.log('✅ Empresa cargada desde empresaData en Header:', empresaSeleccionada);
      }
      
      // Obtener datos del usuario
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        setUserData(user);
        console.log('✅ Datos del usuario cargados en Header:', user);
      }
      
      console.log('=== FIN: Cargar datos en Header ===');
    } catch (error) {
      console.error('Error al obtener datos en Header:', error);
    }
  }, []);

  // Listener para cambios en la empresa
  useEffect(() => {
    const handleEmpresaSelected = (event: CustomEvent) => {
      const empresa = event.detail;
      console.log('Header: Evento empresaSelected recibido:', empresa);
      setEmpresaData(empresa);
    };

    window.addEventListener('empresaSelected', handleEmpresaSelected as EventListener);
    return () => window.removeEventListener('empresaSelected', handleEmpresaSelected as EventListener);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Nombre de la empresa */}
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {empresaData?.razon_social || empresaData?.nombre || 'Sistema'}
        </h1>
      </div>
      
      {/* Información del usuario y botón de logout */}
      <div className="flex items-center space-x-4">
        {/* El avatar del usuario ahora está solo en el sidebar */}
      </div>
      
    </header>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para manejar la navegación sin cerrar el sidebar
  const handleNavigation = (path: string) => {
    // Mantener el sidebar siempre abierto
    setSidebarOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar - Siempre visible */}
      <div className="sidebar-always-visible">
        <DynamicSidebar onNavigate={handleNavigation} />
      </div>

      {/* Contenido principal */}
      <div className="content-with-fixed-sidebar flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>

      {/* Botón para mostrar/ocultar sidebar solo en móviles */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default Layout;
