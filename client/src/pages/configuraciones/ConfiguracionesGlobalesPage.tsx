import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  FileText, 
  Globe,
  Save,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Settings,
  Users,
  Briefcase,
  Shield
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';

interface ConfigEmpresa {
  id: number;
  razon_social: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  representante_legal: string;
  cargo_representante: string;
  ciudad: string;
  departamento: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface Departamento {
  id: number;
  nombre: string;
  codigo_dane: string;
}

interface Ciudad {
  id: number;
  nombre: string;
  codigo_dane: string;
  departamento_id: number;
}

export default function ConfiguracionesGlobalesPage() {
  const [configEmpresa, setConfigEmpresa] = useState<ConfigEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ConfigEmpresa>>({});
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>('');

  useEffect(() => {
    cargarConfiguracionEmpresa();
    cargarDepartamentos();
  }, []);

  useEffect(() => {
    if (departamentoSeleccionado) {
      cargarCiudades(parseInt(departamentoSeleccionado));
    } else {
      setCiudades([]);
    }
  }, [departamentoSeleccionado]);

  const cargarDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .eq('pais_id', 1)
        .order('nombre');

      if (error) {
        console.error('Error al cargar departamentos:', error);
        return;
      }

      setDepartamentos(data || []);
    } catch (err) {
      console.error('Error al cargar departamentos:', err);
    }
  };

  const cargarCiudades = async (departamentoId: number) => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .eq('departamento_id', departamentoId)
        .order('nombre');

      if (error) {
        console.error('Error al cargar ciudades:', error);
        return;
      }

      setCiudades(data || []);
    } catch (err) {
      console.error('Error al cargar ciudades:', err);
    }
  };

  const cargarConfiguracionEmpresa = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('config_empresa')
        .select('*')
        .eq('estado', 'activo')
        .single();

      if (dbError) {
        console.error('Error al cargar configuración de empresa:', dbError);
        setError('Error al cargar la información de Talento Humano');
        return;
      }

      if (!data) {
        setError('No se encontró la configuración de Talento Humano');
        return;
      }

      setConfigEmpresa(data);
      setFormData(data);
      
      if (data.departamento) {
        const dept = departamentos.find(d => d.nombre === data.departamento);
        if (dept) {
          setDepartamentoSeleccionado(dept.id.toString());
        }
      }
    } catch (err) {
      console.error('Error al cargar configuración de empresa:', err);
      setError('Error al cargar la información de Talento Humano');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ConfigEmpresa, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDepartamentoChange = (value: string) => {
    setDepartamentoSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      departamento: '',
      ciudad: ''
    }));
  };

  const handleCiudadChange = (value: string) => {
    const ciudad = ciudades.find(c => c.id.toString() === value);
    const departamento = departamentos.find(d => d.id.toString() === departamentoSeleccionado);
    
    setFormData(prev => ({
      ...prev,
      ciudad: ciudad?.nombre || '',
      departamento: departamento?.nombre || ''
    }));
  };

  const handleSave = async () => {
    if (!configEmpresa) return;

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('config_empresa')
        .update({
          razon_social: formData.razon_social,
          nit: formData.nit,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          departamento: formData.departamento,
          representante_legal: formData.representante_legal,
          cargo_representante: formData.cargo_representante,
          updated_at: new Date().toISOString()
        })
        .eq('id', configEmpresa.id);

      if (updateError) {
        console.error('Error al actualizar configuración de empresa:', updateError);
        toast.error('Error al guardar los cambios');
        return;
      }

      await cargarConfiguracionEmpresa();
      setEditing(false);
      toast.success('Configuraciones guardadas exitosamente');
    } catch (err) {
      console.error('Error al guardar configuraciones:', err);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(configEmpresa || {});
    setEditing(false);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
                     <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando configuraciones...</p>
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
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={cargarConfiguracionEmpresa} 
              className="mt-4"
              variant="outline"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!configEmpresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>No hay configuración disponible</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">No se encontró la configuración de Talento Humano.</p>
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
            <div className="p-3 bg-cyan-100 rounded-xl">
              <Settings className="h-8 w-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración Global</h1>
              <p className="text-gray-600">Gestión de datos empresariales</p>
            </div>
          </div>
          
          {/* Información de la Empresa */}
          <div className="bg-white rounded-2xl shadow-sm border border-black p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{configEmpresa.razon_social}</h2>
                <p className="text-gray-600">Empresa de Servicios de RRHH</p>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-cyan-100 text-cyan-700 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Activa
                </Badge>
                <Badge className="bg-brand-lime/10 text-brand-lime border-0">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Talento Humano
                </Badge>
              </div>
            </div>
            
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <MapPin className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Ubicación</p>
                   <p className="font-medium text-gray-900">{configEmpresa.ciudad}, {configEmpresa.departamento}</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <Phone className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Teléfono</p>
                   <p className="font-medium text-gray-900">{configEmpresa.telefono}</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-3 border border-black rounded-lg" style={{ borderWidth: '0.5px' }}>
                 <div className="p-2 bg-gray-100 rounded-lg">
                   <Mail className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-500">Email</p>
                   <p className="font-medium text-gray-900">{configEmpresa.email}</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <Card className="shadow-sm border border-black bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Información de Configuración</CardTitle>
                <CardDescription className="text-gray-600">
                  {editing ? 'Edita la información de tu empresa' : 'Datos de configuración empresarial'}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {editing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Información Básica */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="razon_social" className="text-sm font-medium text-gray-700">
                      Razón Social
                    </Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social || ''}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      disabled={!editing}
                      className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nit" className="text-sm font-medium text-gray-700">
                      NIT
                    </Label>
                    <Input
                      id="nit"
                      value={formData.nit || ''}
                      onChange={(e) => handleInputChange('nit', e.target.value)}
                      disabled={!editing}
                      className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="representante_legal" className="text-sm font-medium text-gray-700">
                      Representante Legal
                    </Label>
                    <Input
                      id="representante_legal"
                      value={formData.representante_legal || ''}
                      onChange={(e) => handleInputChange('representante_legal', e.target.value)}
                      disabled={!editing}
                      className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cargo_representante" className="text-sm font-medium text-gray-700">
                      Cargo del Representante
                    </Label>
                                         <Input
                       id="cargo_representante"
                       value={formData.cargo_representante || ''}
                       onChange={(e) => handleInputChange('cargo_representante', e.target.value)}
                       disabled={!editing}
                       className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                     />
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Phone className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                      Teléfono
                    </Label>
                                         <Input
                       id="telefono"
                       value={formData.telefono || ''}
                       onChange={(e) => handleInputChange('telefono', e.target.value)}
                       disabled={!editing}
                       className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                     />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Correo Electrónico
                    </Label>
                                         <Input
                       id="email"
                       type="email"
                       value={formData.email || ''}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       disabled={!editing}
                       className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                     />
                  </div>

                  <div>
                    <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">
                      Dirección
                    </Label>
                                         <Textarea
                       id="direccion"
                       value={formData.direccion || ''}
                       onChange={(e) => handleInputChange('direccion', e.target.value)}
                       disabled={!editing}
                       className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                       rows={3}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departamento" className="text-sm font-medium text-gray-700">
                        Departamento
                      </Label>
                      <Select
                        value={departamentoSeleccionado}
                        onValueChange={handleDepartamentoChange}
                        disabled={!editing}
                      >
                        <SelectTrigger className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                          <SelectValue placeholder="Selecciona un departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departamentos.map((departamento) => (
                            <SelectItem key={departamento.id} value={departamento.id.toString()}>
                              {departamento.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ciudad" className="text-sm font-medium text-gray-700">
                        Ciudad
                      </Label>
                      <Select
                        value={ciudades.find(c => c.nombre === formData.ciudad)?.id.toString() || ''}
                        onValueChange={handleCiudadChange}
                        disabled={!editing || !departamentoSeleccionado}
                      >
                        <SelectTrigger className="mt-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
                          <SelectValue placeholder={departamentoSeleccionado ? "Selecciona una ciudad" : "Primero selecciona departamento"} />
                        </SelectTrigger>
                        <SelectContent>
                          {ciudades.map((ciudad) => (
                            <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                              {ciudad.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Información del Sistema */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-5 w-5 text-cyan-600" />
                <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-lime/10 rounded-lg">
                      <FileText className="h-4 w-4 text-brand-lime" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha de Registro</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(configEmpresa.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <FileText className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Última Actualización</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(configEmpresa.updated_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">ID de Configuración</p>
                      <p className="text-gray-900 font-mono font-semibold">#{configEmpresa.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 