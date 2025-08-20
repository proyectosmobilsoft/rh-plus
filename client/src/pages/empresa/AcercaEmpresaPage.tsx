import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Target,
  Building
} from 'lucide-react';
import { obtenerEmpresaSeleccionada } from '@/utils/empresaUtils';
import { supabase } from '@/services/supabaseClient';
import { useRegisterView } from '@/hooks/useRegisterView';

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
  // Registrar vista informativa (sin acciones CRUD)
  const { addAction } = useRegisterView('AcercaEmpresa', 'listado', 'Acerca de la Empresa');
  useEffect(() => {
    addAction('ver', 'Ver Información de la Empresa');
    addAction('refrescar', 'Refrescar Información');
  }, [addAction]);
  
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("informacion");

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
      <Badge className="bg-brand-lime/10 text-brand-lime border-0">
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
        color: 'bg-cyan-100 text-cyan-700',
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-cyan-600 mx-auto"></div>
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
    <div className="p-4 max-w-full mx-auto">
      {/* Header con el mismo estilo que la página de empresas */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Building className="w-8 h-8 text-cyan-600" />
          Acerca de la Empresa
        </h1>
      </div>

      {/* Tabs con el mismo estilo que la página de empresas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="informacion"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Información de la Empresa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">INFORMACIÓN DE LA EMPRESA</span>
              </div>
              <div className="flex space-x-2">
                {getEstadoBadge(empresa.activo)}
                {getTipoEmpresaBadge(empresa.tipo_empresa)}
              </div>
            </div>

            {/* Información principal de la empresa */}
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{empresa.razon_social}</h2>
                <p className="text-gray-600">Empresa registrada en el sistema</p>
              </div>
              
              {/* Grid de información rápida */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tipo de Empresa</Label>
                  <Input 
                    value={empresa.tipo_empresa} 
                    disabled 
                    className="bg-gray-50 text-gray-900 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
                  <Input 
                    value={empresa.ciudad_nombre || empresa.ciudad} 
                    disabled 
                    className="bg-gray-50 text-gray-900 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                  <Input 
                    value={empresa.telefono} 
                    disabled 
                    className="bg-gray-50 text-gray-900 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    value={empresa.email} 
                    disabled 
                    className="bg-gray-50 text-gray-900 font-bold"
                  />
                </div>
              </div>

              {/* Sección: Información General */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 text-cyan-600 mr-2" />
                  Información General
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Tipo de Documento</Label>
                    <Input 
                      value={empresa.tipo_documento} 
                      disabled 
                      className="bg-gray-50 text-gray-900 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">NIT</Label>
                    <Input 
                      value={empresa.nit} 
                      disabled 
                      className="bg-gray-50 text-gray-900 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Régimen Tributario</Label>
                    <Input 
                      value={empresa.regimen_tributario} 
                      disabled 
                      className="bg-gray-50 text-gray-900 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Número de Empleados</Label>
                    <Input 
                      value={empresa.numero_empleados.toString()} 
                      disabled 
                      className="bg-gray-50 text-gray-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Sección: Actividad Económica e Información del Sistema en una fila */}
              <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Actividad Económica */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="h-5 w-5 text-cyan-600 mr-2" />
                      Actividad Económica
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Código de Actividad</Label>
                        <Input 
                          value={empresa.actividad_economica} 
                          disabled 
                          className="bg-gray-50 text-gray-900 font-bold"
                        />
                      </div>
                      
                      {empresa.actividad_nombre && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Descripción de Actividad</Label>
                          <Input 
                            value={empresa.actividad_nombre} 
                            disabled 
                            className="bg-gray-50 text-gray-900 font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del Sistema */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 text-cyan-600 mr-2" />
                      Información del Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Fecha de Registro</Label>
                        <Input 
                          value={formatearFecha(empresa.created_at)} 
                          disabled 
                          className="bg-gray-50 text-gray-900 font-bold"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Última Actualización</Label>
                        <Input 
                          value={formatearFecha(empresa.updated_at)} 
                          disabled 
                          className="bg-gray-50 text-gray-900 font-bold"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">ID de Empresa</Label>
                        <Input 
                          value={`#${empresa.id}`} 
                          disabled 
                          className="bg-gray-50 text-gray-900 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Sección: Información de Contacto */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 text-cyan-600 mr-2" />
                  Información de Contacto
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                      <Input 
                        value={empresa.telefono} 
                        disabled 
                        className="bg-gray-50 text-gray-900 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Correo Electrónico</Label>
                      <Input 
                        value={empresa.email} 
                        disabled 
                        className="bg-gray-50 text-gray-900 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Representante Legal</Label>
                      <Input 
                        value={empresa.representante_legal} 
                        disabled 
                        className="bg-gray-50 text-gray-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Dirección</Label>
                    <Textarea 
                      value={empresa.direccion} 
                      disabled 
                      className="bg-gray-50 text-gray-900 font-bold resize-none"
                      rows={2}
                    />
                    <div className="text-sm text-gray-500">
                      {empresa.ciudad_nombre}, {empresa.departamento_nombre}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 