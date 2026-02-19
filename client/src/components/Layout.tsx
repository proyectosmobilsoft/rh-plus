
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./Layout.css";
import { DynamicSidebar } from "./DynamicSidebar";
import { obtenerEmpresaSeleccionada } from "@/utils/empresaUtils";
import {
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from '/src/assets/logo.png';

// Componente para el header
const Header = ({ sidebarOpen, toggleSidebar }: { sidebarOpen: boolean; toggleSidebar: () => void }) => {
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
    console.error('Error al obtener el contexto de autenticación:', error);
  }
  // Obtener información de la empresa y usuario desde localStorage
  useEffect(() => {
    try {
      // Verificar estado actual de localStorage
      const currentUserData = localStorage.getItem('userData');
      const currentAuthToken = localStorage.getItem('authToken');
      const currentEmpresaData = localStorage.getItem('empresaData');

      // Intentar obtener empresa desde authToken primero
      if (currentAuthToken) {
        try {
          const tokenParts = currentAuthToken.split('.');
          if (tokenParts.length === 2) {
            const tokenData = JSON.parse(atob(tokenParts[0]));

            if (tokenData.empresaId && tokenData.empresaRazonSocial) {
              const empresaFromToken = {
                id: tokenData.empresaId,
                razon_social: tokenData.empresaRazonSocial
              };
              setEmpresaData(empresaFromToken);
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
      }

      // Obtener datos del usuario
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        setUserData(user);
      }

    } catch (error) {
      console.error('Error al obtener datos en Header:', error);
    }
  }, []);

  // Listener para cambios en la empresa
  useEffect(() => {
    const handleEmpresaSelected = (event: CustomEvent) => {
      const empresa = event.detail;
      setEmpresaData(empresa);
    };

    window.addEventListener('empresaSelected', handleEmpresaSelected as EventListener);
    return () => window.removeEventListener('empresaSelected', handleEmpresaSelected as EventListener);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Botón de toggle del sidebar y nombre de la empresa */}
      <div className="flex items-center space-x-4">
        {/* Botón elegante para ocultar/mostrar sidebar */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 group sidebar-button sidebar-toggle-hover"
        >
          <div className="relative">
            <ChevronLeft
              className={`w-5 h-5 text-gray-600 transition-all duration-300 ${sidebarOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'
                }`}
            />
            <ChevronRight
              className={`w-5 h-5 text-gray-600 absolute inset-0 transition-all duration-300 ${sidebarOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'
                }`}
            />
          </div>
        </Button>

        {/* Nombre de la empresa o Logo */}
        {empresaData?.logo_base64 ? (
          <div className="flex items-center">
            <div
              className="logo-header-empresa"
              style={{
                backgroundImage: `url(${empresaData.logo_base64})`
              }}
            ></div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-cyan-600 to-cyan-800 bg-clip-text text-transparent">
                {empresaData?.razon_social || empresaData?.nombre || 'CoreHuman'}
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                GESTIÓN HUMANA ESTRATÉGICА
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logo CoreHuman del lado derecho */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img
            src={logo}
            alt="CoreHuman Logo"
            className="h-16 w-auto object-contain"
          />
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900">
              CoreHuman
            </h2>
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              GESTIÓN HUMANA ESTRATÉGICA
            </p>
          </div>
        </div>
      </div>

    </header>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para manejar la navegación
  const handleNavigation = (path: string) => {
    // El sidebar permanece expandido después de la navegación
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar fijo que ocupa toda la altura */}
      <div
        className={`sidebar-full-height sidebar-animation ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <DynamicSidebar onNavigate={handleNavigation} />
      </div>

      {/* Contenido principal adaptado al sidebar */}
      <div className={`main-content-with-sidebar sidebar-animation ${sidebarOpen ? 'ml-64' : 'ml-0 sidebar-hidden'
        }`}>
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Contenido */}
        <main className="main-content p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

