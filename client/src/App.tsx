
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, PublicRoute } from './components/AuthGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryInvalidator } from "@/components/QueryInvalidator";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useLoading } from "@/contexts/LoadingContext";

// Páginas de autenticación
import LoginUnificado from './pages/LoginUnificado';
import LoginAdmin from './pages/LoginAdmin';
import RecuperarPasswordPage from './pages/auth/RecuperarPasswordPage';
import VerificarCodigoPage from './pages/auth/VerificarCodigoPage';
import SelectEmpresa from './pages/SelectEmpresa';

// Páginas protegidas
import Index from './pages/Index';
import CandidatosPage from './pages/registros/CandidatosPage';
import AspirantesPage from './pages/registros/AspirantesPage';
import EmpresasPage from './pages/registros/EmpresasPage';
import PrestadoresPage from './pages/registros/PrestadoresPage';
import QrPage from './pages/registros/QrPage';
import QrPageMejorado from './pages/registros/QrPageMejorado';

// Páginas de seguridad
import UsuariosPage from './pages/seguridad/UsuariosPage';
import CrearUsuarioPage from './pages/seguridad/CrearUsuarioPage';
import EditarUsuarioPage from './pages/seguridad/EditarUsuarioPage';
import PerfilesPage from './pages/seguridad/PerfilesPage';
import GestionPermisosPage from './pages/seguridad/GestionPermisosPage';
import MenuPage from './pages/seguridad/MenuPage';
import CrearCandidatoAdmin from './pages/admin/CrearCandidatoAdmin';
// Páginas para cada sección
import ExpedicionOrdenPage from "./pages/ordenes/ExpedicionOrdenPage";
import AgendaMedicaPage from "./pages/clinica/AgendaMedicaPage";
import HistoriaMedicaPage from "./pages/clinica/HistoriaMedicaPage";
import HistoriaLaboralPage from "./pages/clinica/HistoriaLaboralPage";
import ConsultoriosPage from "./pages/clinica/ConsultoriosPage";
import EspecialidadesPage from "./pages/clinica/EspecialidadesPage";
import EspecialistasPage from "./pages/clinica/EspecialistasPage";
import CitasProgramadasPage from "./pages/clinica/CitasProgramadasPage";
import ExpedicionCertificadosPage from "./pages/certificados/ExpedicionCertificadosPage";
import CrearCandidatoPage from "./pages/seguridad/CrearCandidatoPage";
import CrearAdministradorPage from "./pages/seguridad/CrearAdministradorPage";
import CrearCoordinadorPage from "./pages/seguridad/CrearCoordinadorPage";
import CrearAdminGeneralPage from "./pages/seguridad/CrearAdminGeneralPage";
import CrearClientePage from "./pages/seguridad/CrearClientePage";

// Maestro pages
import PlantillasPage from "./pages/maestro/PlantillasPage";
import UbicacionesPage from "./pages/maestro/UbicacionesPage";

// Páginas de reportes
import DashboardReportes from './pages/reportes/DashboardReportes';

// Páginas de candidatos
import LoginCandidato from './pages/candidatos/LoginCandidato';
import RegistroCandidato from './pages/candidatos/RegistroCandidato';
import PerfilCandidato from './pages/candidatos/PerfilCandidato';
import CambiarPassword from './pages/candidatos/CambiarPassword';
import ForgotPasswordCandidato from './pages/candidatos/ForgotPasswordCandidato';
import ResetPasswordCandidato from './pages/candidatos/ResetPasswordCandidato';

// Páginas de empresa
import LoginEmpresa from './pages/empresa/LoginEmpresa';
import DashboardEmpresaSimple from './pages/empresa/DashboardEmpresaSimple';
import CandidatosEmpresa from './pages/empresa/CandidatosEmpresa';
import CandidatosEmpresaMejorado from './pages/empresa/CandidatosEmpresaMejorado';
import CrearCandidatoEmpresa from './pages/empresa/CrearCandidatoEmpresa';
import CrearCandidatoSimple from './pages/empresa/CrearCandidatoSimple';
import DetalleCandidatoEmpresa from './pages/empresa/DetalleCandidatoEmpresa';
import ForgotPasswordEmpresa from './pages/empresa/ForgotPasswordEmpresa';
import ResetPasswordEmpresa from './pages/empresa/ResetPasswordEmpresa';
import TestConnection from "./components/TestConnection";

// Páginas de analistas
import AnalistasPage from './pages/analistas/AnalistasPage';
import CrearAnalistaPage from './pages/analistas/CrearAnalistaPage';
import EditarAnalistaPage from './pages/analistas/EditarAnalistaPage';

// Páginas de maestro
import TiposCandidatosPage from './pages/maestro/TiposCandidatosPage';

// Páginas de admin
import TemplatesPage from './pages/admin/ordenes/TemplatesPage';

// Páginas de certificados

// Páginas de QR
import QrConfiguracionPage from './pages/empresa/QrConfiguracionPage';
import QrEmailPage from './pages/empresa/QrEmailPage';
import QrGenerarPage from './pages/empresa/QrGenerarPage';
import QrWhatsAppPage from './pages/empresa/QrWhatsAppPage';
import AcercaEmpresaPage from './pages/empresa/AcercaEmpresaPage';
import ConfiguracionesGlobalesPage from './pages/configuraciones/ConfiguracionesGlobalesPage';
import EmailMasivoPage from './pages/maestro/EmailMasivoPage';

// Página pública para visualizar QR
import QRViewer from './pages/QRViewer';

import NotFound from './pages/NotFound';

import './App.css';

function App() {
  const { isLoading } = useLoading();

  return (
    <Router>
      <div className="App">
        <LoadingOverlay isLoading={isLoading} />
        <Routes>
          {/* Ruta de prueba para verificar providers */}
          <Route path="/test" element={
            <div>
              <h1>Test Route - Providers OK</h1>
              <p>Si puedes ver esto, los providers están funcionando correctamente.</p>
            </div>
          } />
            {/* Rutas públicas */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginUnificado />
              </PublicRoute>
            } />
            <Route path="/login-admin" element={
              <PublicRoute>
                <LoginAdmin />
              </PublicRoute>
            } />

            <Route path="/recuperar-password" element={
              <PublicRoute>
                <RecuperarPasswordPage />
              </PublicRoute>
            } />
            <Route path="/verificar-codigo" element={
              <PublicRoute>
                <VerificarCodigoPage />
              </PublicRoute>
            } />
            <Route path="/login-candidato" element={
              <PublicRoute>
                <LoginCandidato />
              </PublicRoute>
            } />
            <Route path="/registro-candidato" element={
              <PublicRoute>
                <RegistroCandidato />
              </PublicRoute>
            } />
            <Route path="/forgot-password-candidato" element={
              <PublicRoute>
                <ForgotPasswordCandidato />
              </PublicRoute>
            } />
            <Route path="/reset-password-candidato" element={
              <PublicRoute>
                <ResetPasswordCandidato />
              </PublicRoute>
            } />
            <Route path="/login-empresa" element={
              <PublicRoute>
                <LoginEmpresa />
              </PublicRoute>
            } />
            <Route path="/forgot-password-empresa" element={
              <PublicRoute>
                <ForgotPasswordEmpresa />
              </PublicRoute>
            } />
            <Route path="/reset-password-empresa" element={
              <PublicRoute>
                <ResetPasswordEmpresa />
              </PublicRoute>
            } />
            
            {/* Ruta pública para visualizar QR */}
            <Route path="/qr/:qrId" element={<QRViewer />} />
            
            <Route path="/select-empresa" element={
              <ProtectedRoute>
                <SelectEmpresa />
              </ProtectedRoute>
            } />

            {/* Rutas de candidatos (sin layout) */}
            <Route path="/perfil-candidato" element={
              <ProtectedRoute>
                <PerfilCandidato />
              </ProtectedRoute>
            } />
            <Route path="/cambiar-password" element={
              <ProtectedRoute>
                <CambiarPassword />
              </ProtectedRoute>
            } />

            {/* Layout con menú para rutas protegidas */}
            <Route element={<Layout />}>
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />

            {/* Rutas de registros */}
            <Route path="/candidatos" element={
              <ProtectedRoute>
                <CandidatosPage />
              </ProtectedRoute>
            } />
            <Route path="/registros/candidatos" element={
              <ProtectedRoute>
                <CandidatosPage />
              </ProtectedRoute>
            } />
            <Route path="/aspirantes" element={
              <ProtectedRoute>
                <AspirantesPage />
              </ProtectedRoute>
            } />
            <Route path="/registros/aspirantes" element={
              <ProtectedRoute>
                <AspirantesPage />
              </ProtectedRoute>
            } />
            <Route path="/empresas" element={
              <ProtectedRoute>
                <EmpresasPage />
              </ProtectedRoute>
            } />
            <Route path="/registros/empresas" element={
              <ProtectedRoute>
                <EmpresasPage />
              </ProtectedRoute>
            } />
            <Route path="/prestadores" element={
              <ProtectedRoute>
                <PrestadoresPage />
              </ProtectedRoute>
            } />
            <Route path="/registros/prestadores" element={
              <ProtectedRoute>
                <PrestadoresPage />
              </ProtectedRoute>
            } />
            <Route path="/qr" element={
              <ProtectedRoute>
                <QrPage />
              </ProtectedRoute>
            } />
            <Route path="/registros/qr" element={
              <ProtectedRoute>
                <QrPage />
              </ProtectedRoute>
            } />
            <Route path="/qr-mejorado" element={
              <ProtectedRoute>
                <QrPageMejorado />
              </ProtectedRoute>
            } />
            <Route path="/registros/qr-mejorado" element={
              <ProtectedRoute>
                <QrPageMejorado />
              </ProtectedRoute>
            } />

            {/* Rutas de admin */}
            <Route path="/admin/crear-candidato" element={
              <ProtectedRoute>
                <CrearCandidatoAdmin />
              </ProtectedRoute>
            } />

            {/* Rutas de seguridad */}
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <UsuariosPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/usuarios" element={
              <ProtectedRoute>
                <UsuariosPage />
              </ProtectedRoute>
            } />
            <Route path="/crear-usuario" element={
              <ProtectedRoute>
                <CrearUsuarioPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/crear-usuario" element={
              <ProtectedRoute>
                <CrearUsuarioPage />
              </ProtectedRoute>
            } />
            <Route path="/editar-usuario/:id" element={
              <ProtectedRoute>
                <EditarUsuarioPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/editar-usuario/:id" element={
              <ProtectedRoute>
                <EditarUsuarioPage />
              </ProtectedRoute>
            } />
            <Route path="/perfiles" element={
              <ProtectedRoute>
                <PerfilesPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/perfiles" element={
              <ProtectedRoute>
                <PerfilesPage />
              </ProtectedRoute>
            } />
            <Route path="/gestion-permisos" element={
              <ProtectedRoute>
                <GestionPermisosPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/gestion-permisos" element={
              <ProtectedRoute>
                <GestionPermisosPage />
              </ProtectedRoute>
            } />
            <Route path="/menu" element={
              <ProtectedRoute>
                <MenuPage />
              </ProtectedRoute>
            } />
            <Route path="/seguridad/menu" element={
              <ProtectedRoute>
                <MenuPage />
              </ProtectedRoute>
            } />

            {/* Rutas de reportes */}
            <Route path="/reportes" element={
              <ProtectedRoute>
                <DashboardReportes />
              </ProtectedRoute>
            } />
            <Route path="/reportes/dashboard" element={
              <ProtectedRoute>
                <DashboardReportes />
              </ProtectedRoute>
            } />



            {/* Rutas de empresa */}
            <Route path="/dashboard-empresa" element={
              <ProtectedRoute>
                <DashboardEmpresaSimple />
              </ProtectedRoute>
            } />
            <Route path="/candidatos-empresa" element={
              <ProtectedRoute>
                <CandidatosEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/candidatos-empresa-mejorado" element={
              <ProtectedRoute>
                <CandidatosEmpresaMejorado />
              </ProtectedRoute>
            } />
            <Route path="/crear-candidato-empresa" element={
              <ProtectedRoute>
                <CrearCandidatoEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/crear-candidato-simple" element={
              <ProtectedRoute>
                <CrearCandidatoSimple />
              </ProtectedRoute>
            } />
            <Route path="/detalle-candidato-empresa/:id" element={
              <ProtectedRoute>
                <DetalleCandidatoEmpresa />
              </ProtectedRoute>
            } />
            <Route path="/empresa/acerca" element={
              <ProtectedRoute>
                <AcercaEmpresaPage />
              </ProtectedRoute>
            } />
            <Route path="/configuraciones/globales" element={
              <ProtectedRoute>
                <ConfiguracionesGlobalesPage />
              </ProtectedRoute>
            } />

            {/* Rutas de maestro */}
            <Route path="/maestro/correos-masivos" element={
              <ProtectedRoute>
                <EmailMasivoPage />
              </ProtectedRoute>
            } />

            {/* Rutas de analistas */}
            <Route path="/analistas" element={
              <ProtectedRoute>
                <AnalistasPage />
              </ProtectedRoute>
            } />
            <Route path="/analistas/lista" element={
              <ProtectedRoute>
                <AnalistasPage />
              </ProtectedRoute>
            } />
            <Route path="/crear-analista" element={
              <ProtectedRoute>
                <CrearAnalistaPage />
              </ProtectedRoute>
            } />
            <Route path="/analistas/crear" element={
              <ProtectedRoute>
                <CrearAnalistaPage />
              </ProtectedRoute>
            } />
            <Route path="/editar-analista/:id" element={
              <ProtectedRoute>
                <EditarAnalistaPage />
              </ProtectedRoute>
            } />
            <Route path="/analistas/editar/:id" element={
              <ProtectedRoute>
                <EditarAnalistaPage />
              </ProtectedRoute>
            } />

            {/* Rutas de maestro */}
            <Route path="/tipos-candidatos" element={
              <ProtectedRoute>
                <TiposCandidatosPage />
              </ProtectedRoute>
            } />
            <Route path="/maestro/tipos-candidatos" element={
              <ProtectedRoute>
                <TiposCandidatosPage />
              </ProtectedRoute>
            } />

            <Route path="/maestro/ubicaciones" element={
              <ProtectedRoute>
                <UbicacionesPage />
              </ProtectedRoute>
            } />

           
            <Route path="/plantillas" element={
              <ProtectedRoute>
                <PlantillasPage />
              </ProtectedRoute>
            } />
            <Route path="/maestro/plantillas" element={
              <ProtectedRoute>
                <PlantillasPage />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/ordenes/templates" element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            } />

            {/* Rutas de certificados */}
            <Route path="/expedicion-certificados" element={
              <ProtectedRoute>
                <ExpedicionCertificadosPage />
              </ProtectedRoute>
            } />

            {/* Rutas de órdenes */}
            <Route path="/expedicion-orden" element={
              <ProtectedRoute>
                <ExpedicionOrdenPage />
              </ProtectedRoute>
            } />

            {/* Rutas de clínica */}
            <Route path="/agenda-medica" element={
              <ProtectedRoute>
                <AgendaMedicaPage />
              </ProtectedRoute>
            } />
            <Route path="/citas-programadas" element={
              <ProtectedRoute>
                <CitasProgramadasPage />
              </ProtectedRoute>
            } />
            <Route path="/consultorios" element={
              <ProtectedRoute>
                <ConsultoriosPage />
              </ProtectedRoute>
            } />
            <Route path="/especialidades" element={
              <ProtectedRoute>
                <EspecialidadesPage />
              </ProtectedRoute>
            } />
            <Route path="/especialistas" element={
              <ProtectedRoute>
                <EspecialistasPage />
              </ProtectedRoute>
            } />
            <Route path="/historia-laboral" element={
              <ProtectedRoute>
                <HistoriaLaboralPage />
              </ProtectedRoute>
            } />
            <Route path="/historia-medica" element={
              <ProtectedRoute>
                <HistoriaMedicaPage />
              </ProtectedRoute>
            } />

            {/* Rutas de QR */}
            <Route path="/qr-configuracion" element={
              <ProtectedRoute>
                <QrConfiguracionPage />
              </ProtectedRoute>
            } />
            <Route path="/qr-email" element={
              <ProtectedRoute>
                <QrEmailPage />
              </ProtectedRoute>
            } />
            <Route path="/qr-generar" element={
              <ProtectedRoute>
                <QrGenerarPage />
              </ProtectedRoute>
            } />
            <Route path="/qr-whatsapp" element={
              <ProtectedRoute>
                <QrWhatsAppPage />
              </ProtectedRoute>
            } />


            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;
