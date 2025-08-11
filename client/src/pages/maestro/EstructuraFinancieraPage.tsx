import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Briefcase, 
  Target, 
  Loader2, 
  Edit, 
  Trash2,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { 
  estructuraFinancieraService,
  Regional,
  Sucursal,
  Proyecto,
  CentroCosto,
  EstructuraFinancieraCompleta
} from "@/services/estructuraFinancieraService";

export default function EstructuraFinancieraPage() {
  // Estados para los datos
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [estructuraCompleta, setEstructuraCompleta] = useState<EstructuraFinancieraCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [showProyectoModal, setShowProyectoModal] = useState(false);
  const [showCentroCostoModal, setShowCentroCostoModal] = useState(false);
  const [showEstructuraModal, setShowEstructuraModal] = useState(false);

  // Estados para formularios
  const [editingRegional, setEditingRegional] = useState<Regional | null>(null);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [editingCentroCosto, setEditingCentroCosto] = useState<CentroCosto | null>(null);

  // Estados para filtros
  const [filtroRegional, setFiltroRegional] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [regionalesData, sucursalesData, proyectosData, centrosCostoData] = await Promise.all([
        estructuraFinancieraService.getRegionales(),
        estructuraFinancieraService.getSucursales(),
        estructuraFinancieraService.getProyectos(),
        estructuraFinancieraService.getCentrosCosto()
      ]);

      setRegionales(regionalesData);
      setSucursales(sucursalesData);
      setProyectos(proyectosData);
      setCentrosCosto(centrosCostoData);

      // Cargar estructura completa
      const estructuraData = await estructuraFinancieraService.getEstructuraCompleta();
      setEstructuraCompleta(estructuraData);

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos de estructura financiera');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar regionales
  const handleSaveRegional = async (formData: FormData) => {
    try {
      const regionalData = {
        codigo: formData.get('codigo') as string,
        nombre: formData.get('nombre') as string,
        activo: formData.get('activo') === 'true'
      };

      if (editingRegional) {
        await estructuraFinancieraService.updateRegional(editingRegional.id, regionalData);
        toast.success('Regional actualizada exitosamente');
      } else {
        await estructuraFinancieraService.createRegional(regionalData);
        toast.success('Regional creada exitosamente');
      }

      setShowRegionalModal(false);
      setEditingRegional(null);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando regional:', error);
      toast.error('Error al guardar la regional');
    }
  };

  const handleDeleteRegional = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta regional?')) {
      try {
        await estructuraFinancieraService.deleteRegional(id);
        toast.success('Regional eliminada exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando regional:', error);
        toast.error('Error al eliminar la regional');
      }
    }
  };

  // Funciones para manejar sucursales
  const handleSaveSucursal = async (formData: FormData) => {
    try {
      const sucursalData = {
        codigo: formData.get('codigo') as string,
        nombre: formData.get('nombre') as string,
        direccion: formData.get('direccion') as string,
        regional_id: parseInt(formData.get('regional_id') as string),
        activo: formData.get('activo') === 'true'
      };

      if (editingSucursal) {
        await estructuraFinancieraService.updateSucursal(editingSucursal.id, sucursalData);
        toast.success('Sucursal actualizada exitosamente');
      } else {
        await estructuraFinancieraService.createSucursal(sucursalData);
        toast.success('Sucursal creada exitosamente');
      }

      setShowSucursalModal(false);
      setEditingSucursal(null);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando sucursal:', error);
      toast.error('Error al guardar la sucursal');
    }
  };

  const handleDeleteSucursal = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta sucursal?')) {
      try {
        await estructuraFinancieraService.deleteSucursal(id);
        toast.success('Sucursal eliminada exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando sucursal:', error);
        toast.error('Error al eliminar la sucursal');
      }
    }
  };

  // Funciones para manejar proyectos
  const handleSaveProyecto = async (formData: FormData) => {
    try {
      const proyectoData = {
        codigo: formData.get('codigo') as string,
        nombre: formData.get('nombre') as string,
        regional_id: parseInt(formData.get('regional_id') as string),
        activo: formData.get('activo') === 'true'
      };

      if (editingProyecto) {
        await estructuraFinancieraService.updateProyecto(editingProyecto.id, proyectoData);
        toast.success('Proyecto actualizado exitosamente');
      } else {
        await estructuraFinancieraService.createProyecto(proyectoData);
        toast.success('Proyecto creado exitosamente');
      }

      setShowProyectoModal(false);
      setEditingProyecto(null);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      toast.error('Error al guardar el proyecto');
    }
  };

  const handleDeleteProyecto = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este proyecto?')) {
      try {
        await estructuraFinancieraService.deleteProyecto(id);
        toast.success('Proyecto eliminado exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando proyecto:', error);
        toast.error('Error al eliminar el proyecto');
      }
    }
  };

  // Funciones para manejar centros de costo
  const handleSaveCentroCosto = async (formData: FormData) => {
    try {
      const centroCostoData = {
        codigo: formData.get('codigo') as string,
        nombre: formData.get('nombre') as string,
        proyecto_id: parseInt(formData.get('proyecto_id') as string),
        area_negocio: formData.get('area_negocio') as string,
        porcentaje_estructura: parseFloat(formData.get('porcentaje_estructura') as string),
        activo: formData.get('activo') === 'true'
      };

      if (editingCentroCosto) {
        await estructuraFinancieraService.updateCentroCosto(editingCentroCosto.id, centroCostoData);
        toast.success('Centro de costo actualizado exitosamente');
      } else {
        await estructuraFinancieraService.createCentroCosto(centroCostoData);
        toast.success('Centro de costo creado exitosamente');
      }

      setShowCentroCostoModal(false);
      setEditingCentroCosto(null);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando centro de costo:', error);
      toast.error('Error al guardar el centro de costo');
    }
  };

  const handleDeleteCentroCosto = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este centro de costo?')) {
      try {
        await estructuraFinancieraService.deleteCentroCosto(id);
        toast.success('Centro de costo eliminado exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando centro de costo:', error);
        toast.error('Error al eliminar el centro de costo');
      }
    }
  };

  // Filtrar datos
  const filtrarDatos = (datos: any[], campo: string) => {
    return datos.filter(item => 
      item[campo].toLowerCase().includes(busqueda.toLowerCase()) ||
      item.codigo.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  // Filtrar por regional
  const filtrarPorRegional = (datos: any[]) => {
    return datos.filter(item => 
      filtroRegional === 'todas' || !filtroRegional || item.regional_id?.toString() === filtroRegional
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando estructura financiera...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maestro de Estructura Financiera</h1>
          <p className="text-muted-foreground">
            Gestiona la estructura organizacional: regionales, sucursales, proyectos y centros de costo
          </p>
        </div>
        <Button 
          onClick={() => setShowEstructuraModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Estructura Completa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroRegional} onValueChange={setFiltroRegional}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por regional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las regionales</SelectItem>
                {regionales.map(regional => (
                  <SelectItem key={regional.id} value={regional.id.toString()}>
                    {regional.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="regionales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regionales" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regionales
          </TabsTrigger>
          <TabsTrigger value="sucursales" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Sucursales
          </TabsTrigger>
          <TabsTrigger value="proyectos" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="centros-costo" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Centros de Costo
          </TabsTrigger>
        </TabsList>

        {/* Tab Regionales */}
        <TabsContent value="regionales" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Regionales
                  </CardTitle>
                  <CardDescription>
                    Gestiona las regionales de la empresa
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingRegional(null);
                    setShowRegionalModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Regional
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarDatos(regionales, 'nombre').map((regional) => (
                  <div key={regional.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{regional.nombre}</h3>
                        <p className="text-sm text-muted-foreground">Código: {regional.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={regional.activo ? "default" : "secondary"}>
                        {regional.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRegional(regional);
                          setShowRegionalModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRegional(regional.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtrarDatos(regionales, 'nombre').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron regionales
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sucursales */}
        <TabsContent value="sucursales" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Sucursales
                  </CardTitle>
                  <CardDescription>
                    Gestiona las sucursales por regional
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingSucursal(null);
                    setShowSucursalModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sucursal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarPorRegional(filtrarDatos(sucursales, 'nombre')).map((sucursal) => (
                  <div key={sucursal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{sucursal.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          Código: {sucursal.codigo} | Regional: {sucursal.regional?.nombre}
                        </p>
                        {sucursal.direccion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {sucursal.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={sucursal.activo ? "default" : "secondary"}>
                        {sucursal.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSucursal(sucursal);
                          setShowSucursalModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSucursal(sucursal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtrarPorRegional(filtrarDatos(sucursales, 'nombre')).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron sucursales
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Proyectos */}
        <TabsContent value="proyectos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Proyectos
                  </CardTitle>
                  <CardDescription>
                    Gestiona los proyectos por regional
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingProyecto(null);
                    setShowProyectoModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarPorRegional(filtrarDatos(proyectos, 'nombre')).map((proyecto) => (
                  <div key={proyecto.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Briefcase className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{proyecto.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          Código: {proyecto.codigo} | Regional: {proyecto.regional?.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={proyecto.activo ? "default" : "secondary"}>
                        {proyecto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProyecto(proyecto);
                          setShowProyectoModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProyecto(proyecto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtrarPorRegional(filtrarDatos(proyectos, 'nombre')).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron proyectos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Centros de Costo */}
        <TabsContent value="centros-costo" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Centros de Costo
                  </CardTitle>
                  <CardDescription>
                    Gestiona los centros de costo por proyecto
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingCentroCosto(null);
                    setShowCentroCostoModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Centro de Costo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarDatos(centrosCosto, 'nombre').map((centroCosto) => (
                  <div key={centroCosto.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Target className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{centroCosto.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          Código: {centroCosto.codigo} | Proyecto: {centroCosto.proyecto?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Área: {centroCosto.area_negocio} | Estructura: {centroCosto.porcentaje_estructura}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={centroCosto.activo ? "default" : "secondary"}>
                        {centroCosto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCentroCosto(centroCosto);
                          setShowCentroCostoModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCentroCosto(centroCosto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filtrarDatos(centrosCosto, 'nombre').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron centros de costo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Regional */}
      <Dialog open={showRegionalModal} onOpenChange={setShowRegionalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRegional ? 'Editar Regional' : 'Nueva Regional'}
            </DialogTitle>
            <DialogDescription>
              Complete la información de la regional
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveRegional(new FormData(e.target as HTMLFormElement));
          }} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={editingRegional?.codigo || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={editingRegional?.nombre || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="activo">Estado</Label>
              <Select name="activo" defaultValue={editingRegional?.activo !== undefined ? (editingRegional.activo ? 'true' : 'false') : 'true'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRegionalModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRegional ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Sucursal */}
      <Dialog open={showSucursalModal} onOpenChange={setShowSucursalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
            <DialogDescription>
              Complete la información de la sucursal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveSucursal(new FormData(e.target as HTMLFormElement));
          }} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={editingSucursal?.codigo || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={editingSucursal?.nombre || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                defaultValue={editingSucursal?.direccion || ''}
                placeholder="Ingrese la dirección de la sucursal"
              />
            </div>
            <div>
              <Label htmlFor="regional_id">Regional</Label>
              <Select name="regional_id" defaultValue={editingSucursal?.regional_id?.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una regional" />
                </SelectTrigger>
                <SelectContent>
                  {regionales.map(regional => (
                    <SelectItem key={regional.id} value={regional.id.toString()}>
                      {regional.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activo">Estado</Label>
              <Select name="activo" defaultValue={editingSucursal?.activo !== undefined ? (editingSucursal.activo ? 'true' : 'false') : 'true'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowSucursalModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSucursal ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Proyecto */}
      <Dialog open={showProyectoModal} onOpenChange={setShowProyectoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </DialogTitle>
            <DialogDescription>
              Complete la información del proyecto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveProyecto(new FormData(e.target as HTMLFormElement));
          }} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={editingProyecto?.codigo || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={editingProyecto?.nombre || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="regional_id">Regional</Label>
              <Select name="regional_id" defaultValue={editingProyecto?.regional_id?.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una regional" />
                </SelectTrigger>
                <SelectContent>
                  {regionales.map(regional => (
                    <SelectItem key={regional.id} value={regional.id.toString()}>
                      {regional.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activo">Estado</Label>
              <Select name="activo" defaultValue={editingProyecto?.activo !== undefined ? (editingProyecto.activo ? 'true' : 'false') : 'true'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowProyectoModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProyecto ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Centro de Costo */}
      <Dialog open={showCentroCostoModal} onOpenChange={setShowCentroCostoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCentroCosto ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
            </DialogTitle>
            <DialogDescription>
              Complete la información del centro de costo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveCentroCosto(new FormData(e.target as HTMLFormElement));
          }} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={editingCentroCosto?.codigo || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={editingCentroCosto?.nombre || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="proyecto_id">Proyecto</Label>
              <Select name="proyecto_id" defaultValue={editingCentroCosto?.proyecto_id?.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {proyectos.map(proyecto => (
                    <SelectItem key={proyecto.id} value={proyecto.id.toString()}>
                      {proyecto.nombre} ({proyecto.regional?.nombre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="area_negocio">Área de Negocio</Label>
              <Select name="area_negocio" defaultValue={editingCentroCosto?.area_negocio || 'Administrativo'}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Operaciones">Operaciones</SelectItem>
                  <SelectItem value="Tecnología">Tecnología</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Finanzas">Finanzas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="porcentaje_estructura">Porcentaje de Estructura (%)</Label>
              <Input
                id="porcentaje_estructura"
                name="porcentaje_estructura"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={editingCentroCosto?.porcentaje_estructura || 0}
                required
              />
            </div>
            <div>
              <Label htmlFor="activo">Estado</Label>
              <Select name="activo" defaultValue={editingCentroCosto?.activo !== undefined ? (editingCentroCosto.activo ? 'true' : 'false') : 'true'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCentroCostoModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCentroCosto ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Estructura Completa */}
      <Dialog open={showEstructuraModal} onOpenChange={setShowEstructuraModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Estructura Financiera Completa
            </DialogTitle>
            <DialogDescription>
              Vista completa de la estructura organizacional por regionales
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {estructuraCompleta.map((estructura) => (
              <Card key={estructura.regional.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {estructura.regional.nombre}
                    <Badge variant="outline" className="ml-2">
                      {estructura.regional.codigo}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sucursales */}
                  {estructura.sucursales.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-purple-700 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Sucursales ({estructura.sucursales.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {estructura.sucursales.map(sucursal => (
                          <div key={sucursal.id} className="bg-purple-50 p-2 rounded text-sm">
                            <div className="font-medium">{sucursal.nombre}</div>
                            <div className="text-xs text-muted-foreground">{sucursal.codigo}</div>
                            {sucursal.direccion && sucursal.direccion !== 'Dirección por definir' && (
                              <div className="text-xs text-muted-foreground">📍 {sucursal.direccion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proyectos */}
                  {estructura.proyectos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-orange-700 mb-2 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Proyectos ({estructura.proyectos.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {estructura.proyectos.map(proyecto => (
                          <div key={proyecto.id} className="bg-orange-50 p-2 rounded text-sm">
                            <div className="font-medium">{proyecto.nombre}</div>
                            <div className="text-xs text-muted-foreground">{proyecto.codigo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Centros de Costo */}
                  {estructura.centrosCosto.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Centros de Costo ({estructura.centrosCosto.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {estructura.centrosCosto.map(centro => (
                          <div key={centro.id} className="bg-red-50 p-2 rounded text-sm">
                            <div className="font-medium">{centro.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {centro.codigo} | {centro.area_negocio} | {centro.porcentaje_estructura}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {estructura.sucursales.length === 0 && 
                   estructura.proyectos.length === 0 && 
                   estructura.centrosCosto.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No hay elementos configurados para esta regional
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {estructuraCompleta.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay estructura financiera configurada
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowEstructuraModal(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
