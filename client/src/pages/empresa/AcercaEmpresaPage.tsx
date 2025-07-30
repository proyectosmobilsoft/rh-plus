import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  FileText, 
  Calendar, 
  Users, 
  Activity, 
  Globe,
  Award,
  Shield,
  TrendingUp,
  Clock,
  Hash
} from 'lucide-react';
import { obtenerEmpresaSeleccionada } from '@/utils/empresaUtils';
import { supabase } from '@/services/supabaseClient';

interface EmpresaInfo {
  id: number;
  tipo_documento: string;
  nit: string;
  regimen_tributario: string;
  razon_social: string;
  direccion: string;
  ciudad: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  telefono: string;
  email: string;
  representante_legal: string;
  actividad_economica: string;
  actividad_nombre?: string;
  numero_empleados: number;
  activo: boolean;
  tipo_empresa: string;
  created_at: string;
  updated_at: string;
}

export default function AcercaEmpresaPage() {
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEmpresa = async () => {
      try {
        setLoading(true);
        
        const empresaSeleccionada = obtenerEmpresaSeleccionada();
        
        if (!empresaSeleccionada || !empresaSeleccionada.id) {
          setError('No hay una empresa seleccionada');
          setLoading(false);
          return;
        }

        const { data, error: dbError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', empresaSeleccionada.id)
          .single();

        if (dbError) {
          setError('Error al cargar la información de la empresa');
          return;
        }

        setEmpresa(data);
      } catch (err) {
        setError('Error al cargar la información de la empresa');
      } finally {
        setLoading(false);
      }
    };

    cargarEmpresa();
  }, []);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (activo: boolean) => {
    return activo ? (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
        <Shield className="w-3 h-3 mr-1" />
        Activa
      </Badge>
    ) : (
      <Badge variant="destructive" className="shadow-lg">
        <Shield className="w-3 h-3 mr-1" />
        Inactiva
      </Badge>
    );
  };

  const getTipoEmpresaBadge = (tipo: string) => {
    const tipos = {
      'prestador': { 
        label: 'Prestador de Servicios', 
        color: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
        icon: <TrendingUp className="w-3 h-3 mr-1" />
      },
      'cliente': { 
        label: 'Cliente', 
        color: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white',
        icon: <Award className="w-3 h-3 mr-1" />
      },
      'ambos': { 
        label: 'Prestador y Cliente', 
        color: 'bg-gradient-to-r from-orange-500 to-red-600 text-white',
        icon: <Globe className="w-3 h-3 mr-1" />
      }
    };

    const tipoInfo = tipos[tipo as keyof typeof tipos] || { 
      label: tipo, 
      color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
      icon: <Building2 className="w-3 h-3 mr-1" />
    };

    return (
      <Badge className={`${tipoInfo.color} border-0 shadow-lg`}>
        {tipoInfo.icon}
        {tipoInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Cargando información de la empresa...</p>
          <div className="mt-2 text-sm text-gray-500">Preparando datos para ti</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600 text-xl">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>No hay empresa seleccionada</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">Por favor, selecciona una empresa para ver su información.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Acerca de la Empresa</h1>
                <p className="text-blue-100 text-lg">Información detallada de tu empresa</p>
              </div>
            </div>
            
            {/* Información principal de la empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{empresa.razon_social}</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {getEstadoBadge(empresa.activo)}
                  {getTipoEmpresaBadge(empresa.tipo_empresa)}
                </div>
                <div className="flex items-center text-blue-100">
                  <Hash className="w-4 h-4 mr-2" />
                  <span className="font-mono">#{empresa.id}</span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Empleados</span>
                </div>
                <div className="text-3xl font-bold">{empresa.numero_empleados}</div>
                <p className="text-blue-100 text-sm">Personal activo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid principal de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información General */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-6 w-6" />
                <span>Información General</span>
              </CardTitle>
              <CardDescription className="text-blue-100">Datos básicos de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tipo de Documento</p>
                      <p className="text-gray-900 font-semibold">{empresa.tipo_documento}</p>
                    </div>
                  </div>
                </div>

                                 <div className="space-y-3">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                       <FileText className="h-4 w-4 text-green-600" />
                     </div>
                     <div className="text-center flex-1">
                       <p className="text-sm font-medium text-gray-700">NIT</p>
                       <p className="text-gray-900 font-mono font-semibold">{empresa.nit}</p>
                     </div>
                   </div>
                 </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Régimen Tributario</p>
                      <p className="text-gray-900 font-semibold">{empresa.regimen_tributario}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Empleados</p>
                      <p className="text-gray-900 font-semibold">{empresa.numero_empleados}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-6 w-6" />
                <span>Información de Contacto</span>
              </CardTitle>
              <CardDescription className="text-green-100">Datos de contacto de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                                 <div className="flex items-start space-x-4">
                   <div className="p-3 bg-green-100 rounded-xl">
                     <MapPin className="h-5 w-5 text-green-600" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="text-sm font-medium text-gray-700 mb-1">Dirección</p>
                     <p className="text-gray-900 font-semibold text-left">{empresa.direccion}</p>
                     <p className="text-gray-600 text-sm text-left">
                       {empresa.ciudad_nombre}, {empresa.departamento_nombre}
                     </p>
                   </div>
                 </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Teléfono</p>
                    <p className="text-gray-900 font-semibold">{empresa.telefono}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Correo Electrónico</p>
                    <p className="text-gray-900 font-semibold">{empresa.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Representante Legal</p>
                    <p className="text-gray-900 font-semibold">{empresa.representante_legal}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actividad Económica */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>Actividad Económica</span>
              </CardTitle>
              <CardDescription className="text-orange-100">Información sobre la actividad de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Hash className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Código de Actividad</p>
                      <p className="text-gray-900 font-mono font-semibold">{empresa.actividad_economica}</p>
                    </div>
                  </div>
                </div>
                
                {empresa.actividad_nombre && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Descripción de Actividad</p>
                        <p className="text-gray-900 font-semibold">{empresa.actividad_nombre}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-6 w-6" />
                <span>Información del Sistema</span>
              </CardTitle>
              <CardDescription className="text-gray-200">Datos de registro y actualización</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                                 <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                       <Calendar className="h-4 w-4 text-green-600" />
                     </div>
                     <div className="text-center flex-1">
                       <p className="text-sm font-medium text-gray-700">Fecha de Registro</p>
                       <p className="text-gray-900 font-semibold">{formatearFecha(empresa.created_at)}</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-blue-100 rounded-lg">
                       <Clock className="h-4 w-4 text-blue-600" />
                     </div>
                     <div className="text-center flex-1">
                       <p className="text-sm font-medium text-gray-700">Última Actualización</p>
                       <p className="text-gray-900 font-semibold">{formatearFecha(empresa.updated_at)}</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-purple-100 rounded-lg">
                       <Hash className="h-4 w-4 text-purple-600" />
                     </div>
                     <div className="text-center flex-1">
                       <p className="text-sm font-medium text-gray-700">ID de Empresa</p>
                       <p className="text-gray-900 font-mono font-semibold">#{empresa.id}</p>
                     </div>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 