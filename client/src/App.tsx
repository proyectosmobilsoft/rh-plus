
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SedeSelector from "@/components/SedeSelector";

import Index from "./pages/Index";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

// Páginas para cada sección
import EmpresasPage from "./pages/registros/EmpresasPage";
import CandidatosPage from "./pages/registros/CandidatosPage";
import PrestadoresPage from "./pages/registros/PrestadoresPage";
import QrPage from "./pages/registros/QrPage";
import QrPageMejorado from "./pages/registros/QrPageMejorado";
import ExpedicionOrdenPage from "./pages/ordenes/ExpedicionOrdenPage";
import AgendaMedicaPage from "./pages/clinica/AgendaMedicaPage";
import HistoriaMedicaPage from "./pages/clinica/HistoriaMedicaPage";
import HistoriaLaboralPage from "./pages/clinica/HistoriaLaboralPage";
import ConsultoriosPage from "./pages/clinica/ConsultoriosPage";
import EspecialidadesPage from "./pages/clinica/EspecialidadesPage";
import EspecialistasPage from "./pages/clinica/EspecialistasPage";
import CitasProgramadasPage from "./pages/clinica/CitasProgramadasPage";
import ExpedicionCertificadosPage from "./pages/certificados/ExpedicionCertificadosPage";
import UsuariosPage from "./pages/seguridad/UsuariosPage";
import CrearUsuarioPage from "./pages/seguridad/CrearUsuarioPage";
import EditarUsuarioPage from "./pages/seguridad/EditarUsuarioPage";
import PerfilesPage from "./pages/seguridad/PerfilesPage";
import CrearCandidatoPage from "./pages/seguridad/CrearCandidatoPage";
import CrearAdministradorPage from "./pages/seguridad/CrearAdministradorPage";
import CrearCoordinadorPage from "./pages/seguridad/CrearCoordinadorPage";
import CrearAdminGeneralPage from "./pages/seguridad/CrearAdminGeneralPage";
import CrearClientePage from "./pages/seguridad/CrearClientePage";
import MenuPage from "./pages/seguridad/MenuPage";
import GestionPermisosPage from "./pages/seguridad/GestionPermisosPage";

// Maestro pages
import TiposCandidatosPage from "./pages/maestro/TiposCandidatosPage";

// Analistas pages
import AnalistasPage from "./pages/analistas/AnalistasPage";
import CrearAnalistaPage from "./pages/analistas/CrearAnalistaPage";
import EditarAnalistaPage from "./pages/analistas/EditarAnalistaPage";

// Reportes pages
import DashboardReportes from "./pages/reportes/DashboardReportes";

// Test pages
import TestCascadingSelects from "./pages/TestCascadingSelects";

// Candidate portal pages
import LoginCandidato from "./pages/candidatos/LoginCandidato";
import RegistroCandidato from "./pages/candidatos/RegistroCandidato";
import PerfilCandidato from "./pages/candidatos/PerfilCandidato";
import CambiarPassword from "./pages/candidatos/CambiarPassword";

// Admin login and Auth components
import LoginAdmin from "./pages/LoginAdmin";
import LoginUnificado from "./pages/LoginUnificado";
import LoginRedirect from "./components/LoginRedirect";

// Empresa portal pages
import LoginEmpresa from "./pages/empresa/LoginEmpresa";
import DashboardEmpresa from "./pages/empresa/DashboardEmpresaSimple";
import CandidatosEmpresa from "./pages/empresa/CandidatosEmpresaMejorado";
import CrearCandidatoEmpresa from "./pages/empresa/CrearCandidatoEmpresa";
import CrearCandidatoSimple from "./pages/empresa/CrearCandidatoSimple";
import DetalleCandidatoEmpresa from "./pages/empresa/DetalleCandidatoEmpresa";
import QrGenerarPage from "./pages/empresa/QrGenerarPage";
import QrConfiguracionPage from "./pages/empresa/QrConfiguracionPage";
import QrWhatsAppPage from "./pages/empresa/QrWhatsAppPage";
import QrEmailPage from "./pages/empresa/QrEmailPage";
import EmpresaLayout from "./components/EmpresaLayout";

// Auth pages
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ForgotPasswordEmpresa from "./pages/empresa/ForgotPasswordEmpresa";
import ResetPasswordEmpresa from "./pages/empresa/ResetPasswordEmpresa";
import ForgotPasswordCandidato from "./pages/candidatos/ForgotPasswordCandidato";
import ResetPasswordCandidato from "./pages/candidatos/ResetPasswordCandidato";



const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading, needsSedeSelection, selectSede } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-lime mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (needsSedeSelection && user?.sedeIds) {
    return <SedeSelector userSedes={user.sedeIds} onSedeSelected={selectSede} />;
  }

  return (
    <Routes>
          {/* Login Unificado - Única entrada al sistema */}
          <Route path="/" element={<LoginUnificado />} />
          
          {/* Auth Routes - No Layout */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Redirecciones automáticas al login unificado */}
          <Route path="/admin" element={<LoginRedirect />} />
          <Route path="/candidato/login" element={<LoginRedirect />} />
          <Route path="/empresa/login" element={<LoginRedirect />} />
          
          {/* Rutas de registro y funcionalidades específicas sin login */}
          <Route path="/candidato/registro" element={<RegistroCandidato />} />
          <Route path="/candidato/cambiar-password" element={<CambiarPassword />} />
          <Route path="/candidato/perfil" element={<PerfilCandidato />} />
          
          {/* Empresa Portal Routes - With Layout */}
          <Route element={<SidebarProvider><EmpresaLayout /></SidebarProvider>}>
            <Route path="/empresa/dashboard" element={<DashboardEmpresa />} />
            <Route path="/empresa/candidatos" element={<CandidatosEmpresa />} />
            <Route path="/empresa/candidatos/crear" element={<CrearCandidatoSimple />} />
            <Route path="/empresa/candidatos/crear-completo" element={<CrearCandidatoEmpresa />} />
            <Route path="/empresa/candidatos/:id" element={<DetalleCandidatoEmpresa />} />
            <Route path="/empresa/qr/generar" element={<QrGenerarPage />} />
            <Route path="/empresa/qr/configuracion" element={<QrConfiguracionPage />} />
            <Route path="/empresa/qr/whatsapp" element={<QrWhatsAppPage />} />
            <Route path="/empresa/qr/email" element={<QrEmailPage />} />
          </Route>
          
          {/* Admin Portal Routes - With Layout (Protected) */}
          <Route element={<ProtectedRoute><SidebarProvider><Layout /></SidebarProvider></ProtectedRoute>}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Index />} />
            
            {/* Registros */}
            <Route path="/registros/empresas" element={<EmpresasPage />} />
            <Route path="/registros/candidatos" element={<CandidatosPage />} />
            <Route path="/registros/prestadores" element={<PrestadoresPage />} />
            <Route path="/registros/qr" element={<QrPageMejorado />} />
            
            {/* Ordenes */}
            <Route path="/ordenes/expedicion" element={<ExpedicionOrdenPage />} />
            
            {/* Clinica */}
            <Route path="/clinica/agenda" element={<AgendaMedicaPage />} />
            <Route path="/clinica/historia-medica" element={<HistoriaMedicaPage />} />
            <Route path="/clinica/historia-laboral" element={<HistoriaLaboralPage />} />
            <Route path="/clinica/consultorios" element={<ConsultoriosPage />} />
            <Route path="/clinica/especialidades" element={<EspecialidadesPage />} />
            <Route path="/clinica/especialistas" element={<EspecialistasPage />} />
            <Route path="/clinica/citas" element={<CitasProgramadasPage />} />
            
            {/* Certificados */}
            <Route path="/certificados/expedicion" element={<ExpedicionCertificadosPage />} />
            
            {/* Seguridad */}
            <Route path="/seguridad/usuarios" element={<UsuariosPage />} />
            <Route path="/seguridad/usuarios/crear" element={<CrearUsuarioPage />} />
            <Route path="/seguridad/usuarios/editar/:id" element={<EditarUsuarioPage />} />
            <Route path="/seguridad/perfiles" element={<PerfilesPage />} />
            <Route path="/seguridad/perfiles/crear-candidato" element={<CrearCandidatoPage />} />
            <Route path="/seguridad/perfiles/crear-administrador" element={<CrearAdministradorPage />} />
            <Route path="/seguridad/perfiles/crear-coordinador" element={<CrearCoordinadorPage />} />
            <Route path="/seguridad/perfiles/crear-admin-general" element={<CrearAdminGeneralPage />} />
            <Route path="/seguridad/perfiles/crear-cliente" element={<CrearClientePage />} />
            <Route path="/seguridad/menu" element={<MenuPage />} />
            <Route path="/seguridad/permisos" element={<GestionPermisosPage />} />
            
            {/* Maestro */}
            <Route path="/maestro/tipos-candidatos" element={<TiposCandidatosPage />} />
            
            {/* Analistas */}
            <Route path="/analistas" element={<AnalistasPage />} />
            <Route path="/analistas/crear" element={<CrearAnalistaPage />} />
            <Route path="/analistas/:id/editar" element={<EditarAnalistaPage />} />
            
            {/* Reportes */}
            <Route path="/reportes/dashboard" element={<DashboardReportes />} />
            
            {/* Test page for cascading selects */}
            <Route path="/test-cascading" element={<TestCascadingSelects />} />
          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
