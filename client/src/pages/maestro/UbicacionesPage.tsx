import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Globe, MapPin, Building2, Loader2, Edit, Trash2 } from "lucide-react";
import { ubicacionesService, Pais, Departamento, Ciudad } from "@/services/ubicacionesService";
import { setupUbicaciones } from "@/services/setupUbicaciones";

export default function UbicacionesPage() {
  const { toast } = useToast();
  
  // Estados para los datos
  const [paises, setPaises] = useState<Pais[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para los formularios
  const [nuevoPais, setNuevoPais] = useState('');
  const [codigoIsoPais, setCodigoIsoPais] = useState('');
  const [paisSeleccionado, setPaisSeleccionado] = useState<string>('');
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const [codigoDaneDepartamento, setCodigoDaneDepartamento] = useState('');
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>('');
  const [nuevoCiudad, setNuevoCiudad] = useState('');
  const [codigoDaneCiudad, setCodigoDaneCiudad] = useState('');
  const [ciudadPaisSeleccionado, setCiudadPaisSeleccionado] = useState<string>('');

  // Estados para edición
  const [editandoPais, setEditandoPais] = useState<number | null>(null);
  const [editandoDepartamento, setEditandoDepartamento] = useState<number | null>(null);
  const [editandoCiudad, setEditandoCiudad] = useState<number | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Configurar tablas si no existen
        console.log('🔧 Configurando tablas de ubicaciones...');
        const setupResult = await setupUbicaciones();
        if (!setupResult.success) {
          console.warn('⚠️ Advertencia: No se pudo configurar las tablas completamente');
        }
        
        // Cargar países
        const paisesData = await ubicacionesService.getPaises();
        setPaises(paisesData);

        // Cargar departamentos
        const departamentosData = await ubicacionesService.getDepartamentos();
        setDepartamentos(departamentosData);

        // Cargar ciudades
        const ciudadesData = await ubicacionesService.getCiudades();
        setCiudades(ciudadesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Obtener departamentos filtrados por país
  const departamentosFiltrados = departamentos.filter(
    dept => dept.pais_id === parseInt(ciudadPaisSeleccionado)
  );

  // Función para agregar país
  const agregarPais = async () => {
    if (!nuevoPais.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese el nombre del país",
        variant: "destructive",
      });
      return;
    }

    try {
      const nuevoPaisData = await ubicacionesService.createPais({
        nombre: nuevoPais.trim(),
        codigo_iso: codigoIsoPais.trim() || null
      });
      
      if (nuevoPaisData) {
        setPaises(prev => [...prev, nuevoPaisData]);
        setNuevoPais('');
        setCodigoIsoPais('');
        toast({
          title: "Éxito",
          description: "País agregado correctamente",
        });
      }
    } catch (error) {
      console.error('Error al agregar país:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el país",
        variant: "destructive",
      });
    }
  };

  // Función para editar país
  const editarPais = async (id: number, nombre: string, codigoIso?: string) => {
    try {
      const paisActualizado = await ubicacionesService.updatePais(id, {
        nombre: nombre.trim(),
        codigo_iso: codigoIso?.trim() || null
      });
      
      if (paisActualizado) {
        setPaises(prev => prev.map(p => p.id === id ? paisActualizado : p));
        setEditandoPais(null);
        toast({
          title: "Éxito",
          description: "País actualizado correctamente",
        });
      }
    } catch (error) {
      console.error('Error al editar país:', error);
      toast({
        title: "Error",
        description: "No se pudo editar el país",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar país
  const eliminarPais = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este país?')) return;
    
    try {
      await ubicacionesService.deletePais(id);
      setPaises(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Éxito",
        description: "País eliminado correctamente",
      });
    } catch (error) {
      console.error('Error al eliminar país:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el país",
        variant: "destructive",
      });
    }
  };

  // Función para agregar departamento
  const agregarDepartamento = async () => {
    if (!paisSeleccionado || !nuevoDepartamento.trim()) {
      toast({
        title: "Error",
        description: "Por favor seleccione un país e ingrese el nombre del departamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const nuevoDepartamentoData = await ubicacionesService.createDepartamento({
        nombre: nuevoDepartamento.trim(),
        pais_id: parseInt(paisSeleccionado),
        codigo_dane: codigoDaneDepartamento.trim() || null
      });
      
      if (nuevoDepartamentoData) {
        setDepartamentos(prev => [...prev, nuevoDepartamentoData]);
        setNuevoDepartamento('');
        setCodigoDaneDepartamento('');
        setPaisSeleccionado('');
        toast({
          title: "Éxito",
          description: "Departamento agregado correctamente",
        });
      }
    } catch (error) {
      console.error('Error al agregar departamento:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el departamento",
        variant: "destructive",
      });
    }
  };

  // Función para editar departamento
  const editarDepartamento = async (id: number, nombre: string, codigoDane?: string) => {
    try {
      const departamentoActualizado = await ubicacionesService.updateDepartamento(id, {
        nombre: nombre.trim(),
        codigo_dane: codigoDane?.trim() || null
      });
      
      if (departamentoActualizado) {
        setDepartamentos(prev => prev.map(d => d.id === id ? departamentoActualizado : d));
        setEditandoDepartamento(null);
        toast({
          title: "Éxito",
          description: "Departamento actualizado correctamente",
        });
      }
    } catch (error) {
      console.error('Error al editar departamento:', error);
      toast({
        title: "Error",
        description: "No se pudo editar el departamento",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar departamento
  const eliminarDepartamento = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este departamento?')) return;
    
    try {
      await ubicacionesService.deleteDepartamento(id);
      setDepartamentos(prev => prev.filter(d => d.id !== id));
      toast({
        title: "Éxito",
        description: "Departamento eliminado correctamente",
      });
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el departamento",
        variant: "destructive",
      });
    }
  };

  // Función para agregar ciudad
  const agregarCiudad = async () => {
    if (!ciudadPaisSeleccionado || !departamentoSeleccionado || !nuevoCiudad.trim()) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const nuevaCiudadData = await ubicacionesService.createCiudad({
        nombre: nuevoCiudad.trim(),
        departamento_id: parseInt(departamentoSeleccionado),
        codigo_dane: codigoDaneCiudad.trim() || null
      });
      
      if (nuevaCiudadData) {
        setCiudades(prev => [...prev, nuevaCiudadData]);
        setNuevoCiudad('');
        setCodigoDaneCiudad('');
        setCiudadPaisSeleccionado('');
        setDepartamentoSeleccionado('');
        toast({
          title: "Éxito",
          description: "Ciudad agregada correctamente",
        });
      }
    } catch (error) {
      console.error('Error al agregar ciudad:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la ciudad",
        variant: "destructive",
      });
    }
  };

  // Función para editar ciudad
  const editarCiudad = async (id: number, nombre: string, codigoDane?: string) => {
    try {
      const ciudadActualizada = await ubicacionesService.updateCiudad(id, {
        nombre: nombre.trim(),
        codigo_dane: codigoDane?.trim() || null
      });
      
      if (ciudadActualizada) {
        setCiudades(prev => prev.map(c => c.id === id ? ciudadActualizada : c));
        setEditandoCiudad(null);
        toast({
          title: "Éxito",
          description: "Ciudad actualizada correctamente",
        });
      }
    } catch (error) {
      console.error('Error al editar ciudad:', error);
      toast({
        title: "Error",
        description: "No se pudo editar la ciudad",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar ciudad
  const eliminarCiudad = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta ciudad?')) return;
    
    try {
      await ubicacionesService.deleteCiudad(id);
      setCiudades(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Éxito",
        description: "Ciudad eliminada correctamente",
      });
    } catch (error) {
      console.error('Error al eliminar ciudad:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la ciudad",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Ubicaciones</h1>
        <p className="text-muted-foreground">
          Administra países, departamentos y ciudades del sistema
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando datos...</span>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="paises" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paises" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Países
          </TabsTrigger>
          <TabsTrigger value="departamentos" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="ciudades" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Ciudades
          </TabsTrigger>
        </TabsList>

        {/* Sección Países */}
        <TabsContent value="paises" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Agregar País
              </CardTitle>
              <CardDescription>
                Ingresa la información del nuevo país
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="codigo-pais">Código</Label>
                  <Input
                    id="codigo-pais"
                    value="Auto-incrementable"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="nombre-pais">Nombre del País *</Label>
                  <Input
                    id="nombre-pais"
                    value={nuevoPais}
                    onChange={(e) => setNuevoPais(e.target.value)}
                    placeholder="Ej: Colombia"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo-iso-pais">Código ISO</Label>
                  <Input
                    id="codigo-iso-pais"
                    value={codigoIsoPais}
                    onChange={(e) => setCodigoIsoPais(e.target.value)}
                    placeholder="Ej: CO"
                  />
                </div>
              </div>
              <Button onClick={agregarPais} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Guardar País
              </Button>
            </CardContent>
          </Card>

          {/* Lista de países */}
          <Card>
            <CardHeader>
              <CardTitle>Países Registrados</CardTitle>
              <CardDescription>
                Lista de todos los países en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paises.map((pais) => (
                  <div key={pais.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      {editandoPais === pais.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={pais.nombre}
                            onChange={(e) => {
                              const nuevosPaises = paises.map(p => 
                                p.id === pais.id ? { ...p, nombre: e.target.value } : p
                              );
                              setPaises(nuevosPaises);
                            }}
                            className="w-32"
                          />
                          <Input
                            value={pais.codigo_iso || ''}
                            onChange={(e) => {
                              const nuevosPaises = paises.map(p => 
                                p.id === pais.id ? { ...p, codigo_iso: e.target.value } : p
                              );
                              setPaises(nuevosPaises);
                            }}
                            placeholder="ISO"
                            className="w-20"
                          />
                          <Button
                            size="sm"
                            onClick={() => editarPais(pais.id, pais.nombre, pais.codigo_iso)}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditandoPais(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">{pais.nombre}</span>
                          {pais.codigo_iso && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({pais.codigo_iso})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ID: {pais.id}</span>
                      {editandoPais !== pais.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditandoPais(pais.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarPais(pais.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {paises.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay países registrados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección Departamentos */}
        <TabsContent value="departamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Agregar Departamento
              </CardTitle>
              <CardDescription>
                Selecciona un país e ingresa la información del departamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="codigo-departamento">Código</Label>
                  <Input
                    id="codigo-departamento"
                    value="Auto-incrementable"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="pais-departamento">País *</Label>
                  <Select value={paisSeleccionado} onValueChange={setPaisSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      {paises.map((pais) => (
                        <SelectItem key={pais.id} value={pais.id.toString()}>
                          {pais.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nombre-departamento">Nombre del Departamento *</Label>
                  <Input
                    id="nombre-departamento"
                    value={nuevoDepartamento}
                    onChange={(e) => setNuevoDepartamento(e.target.value)}
                    placeholder="Ej: Antioquia"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo-dane-departamento">Código DANE</Label>
                  <Input
                    id="codigo-dane-departamento"
                    value={codigoDaneDepartamento}
                    onChange={(e) => setCodigoDaneDepartamento(e.target.value)}
                    placeholder="Ej: 05"
                  />
                </div>
              </div>
              <Button onClick={agregarDepartamento} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Guardar Departamento
              </Button>
            </CardContent>
          </Card>

          {/* Lista de departamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Departamentos Registrados</CardTitle>
              <CardDescription>
                Lista de todos los departamentos en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {departamentos.map((departamento) => {
                  const pais = paises.find(p => p.id === departamento.pais_id);
                  return (
                    <div key={departamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        {editandoDepartamento === departamento.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={departamento.nombre}
                              onChange={(e) => {
                                const nuevosDepartamentos = departamentos.map(d => 
                                  d.id === departamento.id ? { ...d, nombre: e.target.value } : d
                                );
                                setDepartamentos(nuevosDepartamentos);
                              }}
                              className="w-32"
                            />
                            <Input
                              value={departamento.codigo_dane || ''}
                              onChange={(e) => {
                                const nuevosDepartamentos = departamentos.map(d => 
                                  d.id === departamento.id ? { ...d, codigo_dane: e.target.value } : d
                                );
                                setDepartamentos(nuevosDepartamentos);
                              }}
                              placeholder="DANE"
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              onClick={() => editarDepartamento(departamento.id, departamento.nombre, departamento.codigo_dane)}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditandoDepartamento(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium">{departamento.nombre}</span>
                            {departamento.codigo_dane && (
                              <span className="text-sm text-muted-foreground ml-2">
                                DANE: {departamento.codigo_dane}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground ml-2">
                              País: {pais?.nombre || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">ID: {departamento.id}</span>
                        {editandoDepartamento !== departamento.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditandoDepartamento(departamento.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarDepartamento(departamento.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {departamentos.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay departamentos registrados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección Ciudades */}
        <TabsContent value="ciudades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Agregar Ciudad
              </CardTitle>
              <CardDescription>
                Selecciona país y departamento, luego ingresa la información de la ciudad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="codigo-ciudad">Código</Label>
                  <Input
                    id="codigo-ciudad"
                    value="Auto-incrementable"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="pais-ciudad">País *</Label>
                  <Select value={ciudadPaisSeleccionado} onValueChange={setCiudadPaisSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      {paises.map((pais) => (
                        <SelectItem key={pais.id} value={pais.id.toString()}>
                          {pais.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="departamento-ciudad">Departamento *</Label>
                  <Select 
                    value={departamentoSeleccionado} 
                    onValueChange={setDepartamentoSeleccionado}
                    disabled={!ciudadPaisSeleccionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentosFiltrados.map((departamento) => (
                        <SelectItem key={departamento.id} value={departamento.id.toString()}>
                          {departamento.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nombre-ciudad">Nombre de la Ciudad *</Label>
                  <Input
                    id="nombre-ciudad"
                    value={nuevoCiudad}
                    onChange={(e) => setNuevoCiudad(e.target.value)}
                    placeholder="Ej: Medellín"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo-dane-ciudad">Código DANE</Label>
                  <Input
                    id="codigo-dane-ciudad"
                    value={codigoDaneCiudad}
                    onChange={(e) => setCodigoDaneCiudad(e.target.value)}
                    placeholder="Ej: 05001"
                  />
                </div>
              </div>
              <Button onClick={agregarCiudad} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Guardar Ciudad
              </Button>
            </CardContent>
          </Card>

          {/* Lista de ciudades */}
          <Card>
            <CardHeader>
              <CardTitle>Ciudades Registradas</CardTitle>
              <CardDescription>
                Lista de todas las ciudades en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ciudades.map((ciudad) => {
                  const departamento = departamentos.find(d => d.id === ciudad.departamento_id);
                  return (
                    <div key={ciudad.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        {editandoCiudad === ciudad.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={ciudad.nombre}
                              onChange={(e) => {
                                const nuevasCiudades = ciudades.map(c => 
                                  c.id === ciudad.id ? { ...c, nombre: e.target.value } : c
                                );
                                setCiudades(nuevasCiudades);
                              }}
                              className="w-32"
                            />
                            <Input
                              value={ciudad.codigo_dane || ''}
                              onChange={(e) => {
                                const nuevasCiudades = ciudades.map(c => 
                                  c.id === ciudad.id ? { ...c, codigo_dane: e.target.value } : c
                                );
                                setCiudades(nuevasCiudades);
                              }}
                              placeholder="DANE"
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              onClick={() => editarCiudad(ciudad.id, ciudad.nombre, ciudad.codigo_dane)}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditandoCiudad(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium">{ciudad.nombre}</span>
                            {ciudad.codigo_dane && (
                              <span className="text-sm text-muted-foreground ml-2">
                                DANE: {ciudad.codigo_dane}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground ml-2">
                              {departamento?.nombre}, {departamento?.paises?.nombre}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">ID: {ciudad.id}</span>
                        {editandoCiudad !== ciudad.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditandoCiudad(ciudad.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarCiudad(ciudad.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {ciudades.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay ciudades registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
} 