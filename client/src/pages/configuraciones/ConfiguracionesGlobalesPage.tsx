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
  Users
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
        .eq('pais_id', 1) // Solo departamentos de Colombia
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

      // Cargar la configuración de la empresa principal (Talento Humano)
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
      
      // Si hay departamento guardado, cargar las ciudades correspondientes
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

      // Recargar datos actualizados
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Cargando configuraciones...</p>
          <div className="mt-2 text-sm text-gray-500">Preparando datos de Talento Humano</div>
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
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600 text-xl">Error</CardTitle>
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>No hay configuración disponible</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">No se encontró la configuración de Talento Humano. Por favor, contacta al administrador del sistema.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Banner informativo */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Configuración</h3>
              <p className="text-blue-100 text-sm">Aquí configuras los datos de tu empresa de servicios de RRHH que presta servicios a otras empresas</p>
            </div>
          </div>
        </div>

        {/* Header con gradiente */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Configuración</h1>
                <p className="text-green-100 text-lg">Configura los datos de tu empresa de servicios de RRHH</p>
              </div>
            </div>
            
            {/* Información principal de la empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{configEmpresa.razon_social}</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Empresa de Servicios RRHH
                  </Badge>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
                    <Users className="w-3 h-3 mr-1" />
                    Talento Humano
                  </Badge>
                </div>
                <div className="flex items-center text-green-100">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="font-mono">#{configEmpresa.id}</span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Ubicación</span>
                </div>
                <div className="text-lg font-bold">{configEmpresa.ciudad}</div>
                <p className="text-green-100 text-sm">{configEmpresa.departamento}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de configuración */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-6 w-6" />
                  <span>Información de Configuración</span>
                </CardTitle>
                <CardDescription className="text-green-100">
                  {editing ? 'Edita la información de tu empresa de servicios de RRHH' : 'Datos de tu empresa de servicios de RRHH'}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {editing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-white text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Información Básica
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="razon_social" className="text-sm font-medium text-gray-700">
                      Razón Social
                    </Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social || ''}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      disabled={!editing}
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-purple-600" />
                  Información de Contacto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      disabled={!editing}
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="departamento" className="text-sm font-medium text-gray-700">
                        Departamento
                      </Label>
                      <Select
                        value={departamentoSeleccionado}
                        onValueChange={handleDepartamentoChange}
                        disabled={!editing}
                      >
                        <SelectTrigger className="mt-1">
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
                        <SelectTrigger className="mt-1">
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

            <Separator className="my-6" />

            {/* Información del Sistema */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Información del Sistema
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fecha de Registro</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(configEmpresa.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Última Actualización</p>
                      <p className="text-gray-900 font-semibold">{formatearFecha(configEmpresa.updated_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
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