import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { PlusCircle, Building, Edit, Trash2, Lock, CheckCircle, Eye, Search, Filter } from "lucide-react";
import { Company } from "@/types/company";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCompanies } from "@/hooks/useCompanies";
import { useCityData } from "@/hooks/useCityData";
import { handleEntityDelete } from "@/utils/businessEntityUtils";
import { BusinessEntityRow } from "@/components/shared/BusinessEntityRow";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { empresasService } from "@/services/empresasService";
import { empresaService } from "@/services/empresaService";
import { useLoading } from "@/contexts/LoadingContext";

export default function RegistroEmpresas() {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState("empresas");
  const { data: companies = [], isLoading, fetchData } = useCompanies('empresa');
  const { data: cityData = {} } = useCityData();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const handleEdit = async (company: Company) => {
    try {
      startLoading();
      console.log('Editando empresa con ID:', company.id);
      
      // Obtener datos completos de la empresa incluyendo plantillas asociadas
      const empresaCompleta = await empresaService.getById(company.id!);
      
      if (empresaCompleta) {
        console.log('Empresa completa obtenida:', empresaCompleta);
        console.log('Plantillas asociadas:', empresaCompleta.plantillas);
        setEditingCompany(empresaCompleta);
        setActiveTab("registro");
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo obtener la información completa de la empresa",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al obtener datos completos de la empresa:', error);
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos de la empresa",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleDelete = async (company: Company) => {
    if (!company.id) return;

    try {
      startLoading();
      const success = await empresasService.delete(company.id);
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Empresa eliminada correctamente",
          variant: "default"
        });
        await fetchData(); // Recargar datos
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo eliminar la empresa",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al eliminar la empresa",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleActivate = async (company: Company) => {
    if (!company.id) return;

    try {
      startLoading();
      const success = await empresasService.activate(company.id);
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Empresa activada correctamente",
          variant: "default"
        });
        await fetchData(); // Recargar datos
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo activar la empresa",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al activar la empresa",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleDeactivate = async (company: Company) => {
    if (!company.id) return;

    try {
      startLoading();
      const success = await empresasService.deactivate(company.id);
      if (success) {
        toast({
          title: "✅ Éxito",
          description: "Empresa inactivada correctamente",
          variant: "default"
        });
        await fetchData(); // Recargar datos
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo inactivar la empresa",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al inactivar la empresa",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  const handleSaved = () => {
    setActiveTab("empresas");
    setEditingCompany(null);
    fetchData(); // Recargar datos después de guardar
  };

  const handleNewCompany = () => {
    setEditingCompany(null);
    setActiveTab("registro");
  };

  // Filtrar empresas
  const filteredCompanies = companies
    .filter(company => {
      const matchesSearch =
        company.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.direccion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true :
        statusFilter === "active" ? company.active : !company.active;

      const matchesCity = cityFilter === "all" ? true :
        company.ciudad === cityFilter;

      return matchesSearch && matchesStatus && matchesCity;
    })
    .sort((a, b) => {
      // Mostrar empresas activas primero
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      // Luego ordenar por razón social
      return (a.razonSocial || "").localeCompare(b.razonSocial || "");
    });

  // Obtener ciudades únicas para el filtro
  const uniqueCities = [...new Set(companies.map(c => c.ciudad).filter(Boolean))].sort();

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Building className="w-8 h-8 text-cyan-600" />
          Gestión de Empresas Afiliadas
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="empresas"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Empresas
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Empresa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="mt-6">
          {/* Header similar al diseño de perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">EMPRESAS AFILIADAS</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleNewCompany}
                  className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                  size="sm"
                >
                  Adicionar Registro
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por NIT, razón social..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Solo activas</SelectItem>
                    <SelectItem value="inactive">Solo inactivas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {uniqueCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("active");
                    setCityFilter("all");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla de empresas */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">NIT</TableHead>
                    <TableHead className="px-4 py-3">Razón Social</TableHead>
                    <TableHead className="px-4 py-3">Dirección</TableHead>
                    <TableHead className="px-4 py-3">Ciudad</TableHead>
                    <TableHead className="px-4 py-3">Teléfono</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Cargando empresas...
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay empresas disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(company)}
                                    aria-label="Editar empresa"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {company.active ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Inactivar empresa"
                                          className="h-8 w-8"
                                        >
                                          <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Inactivar empresa?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción inactivará la empresa y no podrá ser usada hasta que se reactive. ¿Estás seguro?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeactivate(company)}>
                                            Sí, inactivar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Inactivar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Eliminar empresa"
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción eliminará la empresa de forma permanente. ¿Estás seguro?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(company)}>
                                              Sí, eliminar
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Activar empresa"
                                            className="h-8 w-8"
                                          >
                                            <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Activar empresa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción reactivará la empresa y estará disponible para su uso. ¿Estás seguro?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleActivate(company)}>
                                              Sí, activar
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Activar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{company.nit}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{company.razonSocial}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{company.direccion}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{cityData[company.ciudad] || company.ciudad}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{company.telefono}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={company.active ? "default" : "secondary"} className={company.active ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                            {company.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingCompany ? 'Editar Empresa Afiliada' : 'Registro de Nueva Empresa Afiliada'}
            </h2>
          </div>

          {/* Formulario de empresa en el tab de registro */}
          <Card>
            <CompanyForm
              initialData={editingCompany}
              onSaved={handleSaved}
              entityType="afiliada"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}