import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Download,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { analystsService, Analyst } from '@/services/analystsService';
import { testConnection, testAnalistas } from '@/services/testConnection';

export default function AnalistasPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegional, setFilterRegional] = useState('todas');
  const [filterNivel, setFilterNivel] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const queryClient = useQueryClient();

  // Usar React Query para cargar analistas
  const { data: analistas = [], isLoading, error } = useQuery({
    queryKey: ['analistas'],
    queryFn: async () => {
      try {
        // Primero probar la conexión
        console.log('🔍 Iniciando test de conexión...');
        const connectionTest = await testConnection();
        console.log('Resultado test conexión:', connectionTest);
        
        if (!connectionTest.success) {
          throw new Error('No se pudo conectar a Supabase');
        }
        
        // Luego probar cargar analistas
        console.log('🔍 Probando carga de analistas...');
        const analistasTest = await testAnalistas();
        console.log('Resultado test analistas:', analistasTest);
        
        // Finalmente cargar con el servicio normal
        const data = await analystsService.getAll();
        console.log('Analistas cargados con servicio:', data);
        return data || [];
      } catch (error) {
        console.error('Error cargando analistas:', error);
        toast.error('Error al cargar analistas de Supabase');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Mapear los datos recibidos para que coincidan con la estructura esperada
  const analistasMapeados = analistas.map((a: any) => ({
    id: a.id,
    username: a.username || '',
    email: a.email || '',
    primer_nombre: a.primer_nombre || '',
    segundo_nombre: a.segundo_nombre || '',
    primer_apellido: a.primer_apellido || '',
    segundo_apellido: a.segundo_apellido || '',
    activo: a.activo !== false ? 'activo' : 'inactivo' as 'activo' | 'inactivo',
    regional: a.regional || 'N/A',
    nivelPrioridad: a.nivel_prioridad || 'bajo'
  }));

  // Aplicar filtros usando useMemo para mejor rendimiento
  const filteredAnalistas = React.useMemo(() => {
    let filtered = analistasMapeados;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(analista =>
        analista.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.segundo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.primer_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analista.segundo_apellido.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(analista => analista.activo === filterEstado);
    }

    return filtered;
  }, [analistasMapeados, searchTerm, filterEstado]);

  const handleEliminarAnalista = async (id: number) => {
    try {
      await analystsService.remove(id);
      toast.success('Analista eliminado exitosamente');
      // Invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['analistas'] });
    } catch (error) {
      console.error('Error eliminando analista:', error);
      toast.error('Error al eliminar analista');
    }
  };

  const handleExportarExcel = () => {
    // Función para exportar a Excel - implementación simplificada
    const csvContent = [
      ['Usuario', 'Email', 'Primer Nombre', 'Segundo Nombre', 'Primer Apellido', 'Segundo Apellido', 'Estado'].join(','),
      ...filteredAnalistas.map(analista => [
        analista.username,
        analista.email,
        analista.primer_nombre,
        analista.segundo_nombre,
        analista.primer_apellido,
        analista.segundo_apellido,
        analista.activo
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analistas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Lista de analistas exportada exitosamente');
  };

  const getNivelBadge = (nivel: string) => {
    const badges = {
      alto: <Badge variant="destructive">Alto</Badge>,
      medio: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medio</Badge>,
      bajo: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Bajo</Badge>,
    };
    return badges[nivel as keyof typeof badges] || <Badge variant="outline">{nivel}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activo: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>,
      inactivo: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactivo</Badge>,
    };
    return badges[estado as keyof typeof badges] || <Badge variant="outline">{estado}</Badge>;
  };

  // Obtener regionales únicas para el filtro
  const regionalesUnicas = Array.from(new Set(analistasMapeados.map(a => a.regional)));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Analistas</h1>
          <p className="text-gray-600 mt-2">
            Administra el equipo de analistas del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportarExcel}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            onClick={() => navigate('/analistas/crear')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Analista
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analistas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analistasMapeados.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analistas Activos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analistasMapeados.filter(a => a.activo === 'activo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridad Alta</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analistasMapeados.filter(a => a.nivelPrioridad === 'alto').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regionales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionalesUnicas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email, regional o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterRegional} onValueChange={setFilterRegional}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por regional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las regionales</SelectItem>
                {regionalesUnicas.filter(r => r).map(regional => (
                  <SelectItem key={regional} value={regional}>{regional}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="bajo">Bajo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Analistas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Analistas</CardTitle>
          <CardDescription>
            Gestiona el equipo de analistas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando analistas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Primer Nombre</TableHead>
                  <TableHead>Segundo Nombre</TableHead>
                  <TableHead>Primer Apellido</TableHead>
                  <TableHead>Segundo Apellido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalistas.map((analista) => (
                  <TableRow key={analista.id}>
                    <TableCell>{analista.username}</TableCell>
                    <TableCell>{analista.email}</TableCell>
                    <TableCell>{analista.primer_nombre}</TableCell>
                    <TableCell>{analista.segundo_nombre}</TableCell>
                    <TableCell>{analista.primer_apellido}</TableCell>
                    <TableCell>{analista.segundo_apellido}</TableCell>
                    <TableCell>{analista.activo === 'activo' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactivo</Badge>
                    )}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate(`/analistas/${analista.id}/editar`, { replace: true });
                            window.location.reload();
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar analista?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el analista {analista.username}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleEliminarAnalista(analista.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredAnalistas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterRegional !== 'todas' || filterNivel !== 'todos' || filterEstado !== 'todos'
                ? "No se encontraron analistas con los filtros aplicados"
                : "No hay analistas registrados"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}