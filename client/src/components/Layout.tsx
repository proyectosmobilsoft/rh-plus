
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
  
  // Obtener función de logout del AuthContext
  let logout: (() => Promise<void>) | null = null;
  try {
    const authContext = useAuth();
    logout = authContext.logout;
  } catch (error) {
    console.log("AuthProvider no disponible");
  }

  // Obtener información de la empresa desde localStorage usando las utilidades
  useEffect(() => {
    try {
      console.log('=== INICIO: Cargar empresa en Header ===');
      
      // Verificar estado actual de localStorage
      const currentUserData = localStorage.getItem('userData');
      const currentAuthToken = localStorage.getItem('authToken');
      const currentEmpresaData = localStorage.getItem('empresaData');
      
      console.log('📊 Estado actual de localStorage en Header:');
      console.log('- userData existe:', !!currentUserData);
      console.log('- authToken existe:', !!currentAuthToken);
      console.log('- empresaData existe:', !!currentEmpresaData);
      
      const empresaSeleccionada = obtenerEmpresaSeleccionada();
      if (empresaSeleccionada) {
        setEmpresaData(empresaSeleccionada);
        console.log('Header: Empresa cargada:', empresaSeleccionada);
      }
      
      console.log('=== FIN: Cargar empresa en Header ===');
    } catch (error) {
      console.error('Error al obtener datos de la empresa en Header:', error);
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
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between header-with-large-logo">
      <div className="flex items-center space-x-4 header-logo-container">
        <svg 
          className="logo-svg" 
          viewBox="0 0 200 60" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <text x="10" y="35" fontSize="24" fontWeight="bold" fill="#3b82f6">
            ZEUS
          </text>
          <text x="10" y="50" fontSize="12" fill="#6b7280">
            PLATFORM
          </text>
        </svg>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-900">
            {empresaData?.nombre || empresaData?.razonSocial || ''}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {logout && (
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        )}
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
