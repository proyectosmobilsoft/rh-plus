import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Globe, MapPin, Building2, Loader2 } from "lucide-react";

interface Pais {
  id: number;
  nombre: string;
  codigo_iso?: string;
  created_at?: string;
  updated_at?: string;
}

interface Departamento {
  id: number;
  nombre: string;
  codigo_dane?: string;
  pais_id: number;
  created_at?: string;
  updated_at?: string;
  paises?: Pais;
}

interface Ciudad {
  id: number;
  nombre: string;
  codigo_dane?: string;
  departamento_id: number;
  created_at?: string;
  updated_at?: string;
  departamentos?: Departamento;
}

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

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar países
        const responsePaises = await fetch('/api/paises');
        if (responsePaises.ok) {
          const paisesData = await responsePaises.json();
          setPaises(paisesData);
        }

        // Cargar departamentos
        const responseDepartamentos = await fetch('/api/departamentos');
        if (responseDepartamentos.ok) {
          const departamentosData = await responseDepartamentos.json();
          setDepartamentos(departamentosData);
        }

        // Cargar ciudades
        const responseCiudades = await fetch('/api/ciudades');
        if (responseCiudades.ok) {
          const ciudadesData = await responseCiudades.json();
          setCiudades(ciudadesData);
        }
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
      const response = await fetch('/api/paises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombre: nuevoPais.trim(),
          codigo_iso: codigoIsoPais.trim() || null
        }),
      });

      if (response.ok) {
        const nuevoPaisData = await response.json();
        setPaises(prev => [...prev, nuevoPaisData]);
        setNuevoPais('');
        setCodigoIsoPais('');
        toast({
          title: "Éxito",
          description: "País agregado correctamente",
        });
      } else {
        throw new Error('Error al agregar país');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el país",
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
      const response = await fetch('/api/departamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombre: nuevoDepartamento.trim(),
          pais_id: parseInt(paisSeleccionado),
          codigo_dane: codigoDaneDepartamento.trim() || null
        }),
      });

      if (response.ok) {
        const nuevoDepartamentoData = await response.json();
        setDepartamentos(prev => [...prev, nuevoDepartamentoData]);
        setNuevoDepartamento('');
        setCodigoDaneDepartamento('');
        setPaisSeleccionado('');
        toast({
          title: "Éxito",
          description: "Departamento agregado correctamente",
        });
      } else {
        throw new Error('Error al agregar departamento');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el departamento",
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
      const response = await fetch('/api/ciudades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombre: nuevoCiudad.trim(),
          departamento_id: parseInt(departamentoSeleccionado),
          codigo_dane: codigoDaneCiudad.trim() || null
        }),
      });

      if (response.ok) {
        const nuevaCiudadData = await response.json();
        setCiudades(prev => [...prev, nuevaCiudadData]);
        setNuevoCiudad('');
        setCodigoDaneCiudad('');
        setCiudadPaisSeleccionado('');
        setDepartamentoSeleccionado('');
        toast({
          title: "Éxito",
          description: "Ciudad agregada correctamente",
        });
      } else {
        throw new Error('Error al agregar ciudad');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la ciudad",
        variant: "destructive",
      });
    }
  };

  // Cargar datos al montar el componente
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar países
        const paisesResponse = await fetch('/api/paises');
        if (paisesResponse.ok) {
          const paisesData = await paisesResponse.json();
          setPaises(paisesData);
        }

        // Cargar departamentos
        const departamentosResponse = await fetch('/api/departamentos');
        if (departamentosResponse.ok) {
          const departamentosData = await departamentosResponse.json();
          setDepartamentos(departamentosData);
        }

        // Cargar ciudades
        const ciudadesResponse = await fetch('/api/ciudades');
        if (ciudadesResponse.ok) {
          const ciudadesData = await ciudadesResponse.json();
          setCiudades(ciudadesData);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    cargarDatos();
  }, []);

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
                    <div>
                      <span className="font-medium">{pais.nombre}</span>
                      {pais.codigo_iso && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({pais.codigo_iso})
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">ID: {pais.id}</span>
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
                      <span className="text-sm text-muted-foreground">ID: {departamento.id}</span>
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
                      <div>
                        <span className="font-medium">{ciudad.nombre}</span>
                        {ciudad.codigo_dane && (
                          <span className="text-sm text-muted-foreground ml-2">
                            DANE: {ciudad.codigo_dane}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground ml-2">
                          {ciudad.departamentos?.nombre}, {ciudad.departamentos?.paises?.nombre}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">ID: {ciudad.id}</span>
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