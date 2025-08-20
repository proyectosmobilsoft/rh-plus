import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Settings className="w-8 h-8 text-cyan-600" />
          Configuración Global
        </h1>
      </div>

      <Tabs value="configuracion" className="w-full">
        <TabsList className="grid w-full grid-cols-1 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="configuracion"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Configuración de Empresa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="mt-6">
          {/* Header similar al diseño de empresas */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">CONFIGURACIÓN GLOBAL</span>
              </div>
              <div className="flex space-x-2">
                {editing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                      size="sm"
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                    size="sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Información de la Empresa */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ubicación</p>
                    <p className="font-medium text-gray-900">{configEmpresa.ciudad}, {configEmpresa.departamento}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-900">{configEmpresa.telefono}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
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

            {/* Formulario de Configuración */}
            <div className="p-6">
              {/* Primera sección - Información Básica */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="razon_social" className="text-sm font-medium text-gray-700">
                      Razón Social <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social || ''}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese la razón social"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nit" className="text-sm font-medium text-gray-700">
                      NIT <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nit"
                      value={formData.nit || ''}
                      onChange={(e) => handleInputChange('nit', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese el NIT"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_legal" className="text-sm font-medium text-gray-700">
                      Representante Legal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="representante_legal"
                      value={formData.representante_legal || ''}
                      onChange={(e) => handleInputChange('representante_legal', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese el representante legal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo_representante" className="text-sm font-medium text-gray-700">
                      Cargo del Representante <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cargo_representante"
                      value={formData.cargo_representante || ''}
                      onChange={(e) => handleInputChange('cargo_representante', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese el cargo"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 my-8" />

              {/* Segunda sección - Información de Contacto */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <Phone className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese el teléfono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white"
                      placeholder="Ingrese el correo electrónico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">
                      Dirección <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion || ''}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      disabled={!editing}
                      className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 placeholder:text-gray-400 bg-white resize-none"
                      placeholder="Ingrese la dirección completa"
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 my-8" />

              {/* Tercera sección - Ubicación y Sistema */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Ubicación y Sistema</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="departamento" className="text-sm font-medium text-gray-700">
                      Departamento <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={departamentoSeleccionado}
                      onValueChange={handleDepartamentoChange}
                      disabled={!editing}
                    >
                      <SelectTrigger className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 bg-white">
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

                  <div className="space-y-2">
                    <Label htmlFor="ciudad" className="text-sm font-medium text-gray-700">
                      Ciudad <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={ciudades.find(c => c.nombre === formData.ciudad)?.id.toString() || ''}
                      onValueChange={handleCiudadChange}
                      disabled={!editing || !departamentoSeleccionado}
                    >
                      <SelectTrigger className="w-full border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 text-gray-900 bg-white">
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      ID de Configuración
                    </Label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono font-medium text-gray-900">
                      #{configEmpresa.id}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 my-8" />

              {/* Cuarta sección - Información del Sistema */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Fecha de Registro
                    </Label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-medium text-gray-900">
                      {formatearFecha(configEmpresa.created_at)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Última Actualización
                    </Label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-medium text-gray-900">
                      {formatearFecha(configEmpresa.updated_at)}
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