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
  Hash,
  Briefcase,
  Target
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
      <Badge className="bg-green-100 text-green-700 border-0">
        <Shield className="w-3 h-3 mr-1" />
        Activa
      </Badge>
    ) : (
      <Badge variant="destructive" className="shadow-sm">
        <Shield className="w-3 h-3 mr-1" />
        Inactiva
      </Badge>
    );
  };

  const getTipoEmpresaBadge = (tipo: string) => {
    const tipos = {
      'prestador': { 
        label: 'Prestador de Servicios', 
        color: 'bg-blue-100 text-blue-700',
        icon: <TrendingUp className="w-3 h-3 mr-1" />
      },
      'cliente': { 
        label: 'Cliente', 
        color: 'bg-purple-100 text-purple-700',
        icon: <Award className="w-3 h-3 mr-1" />
      },
      'ambos': { 
        label: 'Prestador y Cliente', 
        color: 'bg-orange-100 text-orange-700',
        icon: <Globe className="w-3 h-3 mr-1" />
      }
    };

    const tipoInfo = tipos[tipo as keyof typeof tipos] || { 
      label: tipo, 
      color: 'bg-gray-100 text-gray-700',
      icon: <Building2 className="w-3 h-3 mr-1" />
    };

    return (
      <Badge className={`${tipoInfo.color} border-0`}>
        {tipoInfo.icon}
        {tipoInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Error</CardTitle>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-yellow-600" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-8 space-y-8">
        {/* Header Minimalista */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Acerca de la Empresa</h1>
              <p className="text-gray-600">Información detallada de tu empresa</p>
            </div>
          </div>
          
          {/* Información de la Empresa */}
          <div className="bg-white rounded-2xl shadow-sm border border-black p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{empresa.razon_social}</h2>
                <p className="text-gray-600">Empresa registrada en el sistema</p>
              </div>
              <div className="flex space-x-2">
                {getEstadoBadge(empresa.activo)}
                {getTipoEmpresaBadge(empresa.tipo_empresa)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                             <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <Users className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Empleados</p>
                   <p className="font-medium text-gray-900">{empresa.numero_empleados}</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <MapPin className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Ubicación</p>
                   <p className="font-medium text-gray-900">{empresa.ciudad_nombre || empresa.ciudad}</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <Phone className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Teléfono</p>
                   <p className="font-medium text-gray-900">{empresa.telefono}</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <Mail className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Email</p>
                   <p className="font-medium text-gray-900">{empresa.email}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Grid principal de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información General */}
          <Card className="shadow-sm border border-black bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span>Información General</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Datos básicos de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tipo de Documento</p>
                      <p className="text-gray-900 font-semibold">{empresa.tipo_documento}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">NIT</p>
                      <p className="text-gray-900 font-mono font-semibold">{empresa.nit}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Régimen Tributario</p>
                      <p className="text-gray-900 font-semibold">{empresa.regimen_tributario}</p>
                    </div>
                  </div>

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
          <Card className="shadow-sm border border-black bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <Phone className="h-6 w-6 text-blue-600" />
                <span>Información de Contacto</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Datos de contacto de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Dirección</p>
                    <p className="text-gray-900 font-semibold">{empresa.direccion}</p>
                    <p className="text-gray-600 text-sm">
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
          <Card className="shadow-sm border border-black bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <Activity className="h-6 w-6 text-blue-600" />
                <span>Actividad Económica</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Información sobre la actividad de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
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
                  <div className="bg-gray-50 rounded-xl p-4">
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
          <Card className="shadow-sm border border-black bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                <Calendar className="h-6 w-6 text-blue-600" />
                <span>Información del Sistema</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Datos de registro y actualización</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha de Registro</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(empresa.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Última Actualización</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(empresa.updated_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Hash className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
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