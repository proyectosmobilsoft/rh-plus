import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Edit, Trash2, CheckCircle, Lock, Loader2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/services/supabaseClient';
import { Can } from '@/contexts/PermissionsContext';

interface JornadaLaboral {
  id: number;
  nombre_jornada: string;
  horas_laborales: number;
  activo: boolean;
  created_at?: string;
}

const EMPTY_FORM = { nombre_jornada: '', horas_laborales: '' };

export default function JornadasLaboralesPage() {
  const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listado');
  const [editing, setEditing] = useState<JornadaLaboral | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jornadas_laborales')
      .select('*')
      .order('nombre_jornada');
    if (error) toast.error('Error al cargar jornadas');
    else setJornadas(data || []);
    setLoading(false);
  };

  const filtered = jornadas
    .filter(j => {
      const matchSearch = j.nombre_jornada.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? j.activo : !j.activo;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => (a.activo === b.activo ? 0 : a.activo ? -1 : 1));

  const handleNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setActiveTab('formulario');
  };

  const handleEdit = (j: JornadaLaboral) => {
    setEditing(j);
    setForm({ nombre_jornada: j.nombre_jornada, horas_laborales: String(j.horas_laborales) });
    setActiveTab('formulario');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_jornada.trim() || !form.horas_laborales) {
      toast.error('Nombre y horas son obligatorios');
      return;
    }
    setSaving(true);
    const payload = {
      nombre_jornada: form.nombre_jornada.trim(),
      horas_laborales: parseFloat(form.horas_laborales),
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from('jornadas_laborales').update(payload).eq('id', editing.id)
      : await supabase.from('jornadas_laborales').insert([{ ...payload, activo: true }]);

    if (error) {
      toast.error('Error al guardar la jornada');
    } else {
      toast.success(editing ? 'Jornada actualizada' : 'Jornada creada');
      setForm(EMPTY_FORM);
      setEditing(null);
      setActiveTab('listado');
      load();
    }
    setSaving(false);
  };

  const handleToggle = async (j: JornadaLaboral) => {
    const { error } = await supabase
      .from('jornadas_laborales')
      .update({ activo: !j.activo, updated_at: new Date().toISOString() })
      .eq('id', j.id);
    if (error) toast.error('Error al cambiar estado');
    else { toast.success(j.activo ? 'Jornada inactivada' : 'Jornada activada'); load(); }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('jornadas_laborales').delete().eq('id', id);
    if (error) toast.error('Error al eliminar');
    else { toast.success('Jornada eliminada'); load(); }
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2">
          <Clock className="w-8 h-8 text-cyan-600" />
          Jornadas Laborales
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger value="listado" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">
            Listado de Jornadas
          </TabsTrigger>
          <TabsTrigger value="formulario" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300">
            Registro de Jornada
          </TabsTrigger>
        </TabsList>

        {/* LISTADO */}
        <TabsContent value="listado" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">JORNADAS LABORALES</span>
                <Badge variant="secondary">{filtered.length}</Badge>
              </div>
              <Can action="accion-crear-jornada-laboral">
                <Button onClick={handleNew} className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1" size="sm">
                  Adicionar Registro
                </Button>
              </Can>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-wrap gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                  <option value="all">Todos</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('active'); }} className="flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Limpiar
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[500px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow>
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Nombre de Jornada</TableHead>
                    <TableHead className="px-4 py-3">Horas Laborales</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="inline animate-spin mr-2" />Cargando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-gray-400">No hay jornadas disponibles.</TableCell></TableRow>
                  ) : filtered.map(j => (
                    <TableRow key={j.id} className="hover:bg-gray-50">
                      <TableCell className="px-2 py-1">
                        <div className="flex gap-1">
                          <Can action="accion-editar-jornada-laboral">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(j)}>
                                    <Edit className="h-4 w-4 text-cyan-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Can>
                          {j.activo ? (
                            <Can action="accion-inactivar-jornada-laboral">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Lock className="h-4 w-4 text-yellow-600" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Inactivar jornada?</AlertDialogTitle>
                                          <AlertDialogDescription>La jornada no aparecerá en los selects hasta reactivarla.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleToggle(j)}>Sí, inactivar</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TooltipTrigger>
                                  <TooltipContent>Inactivar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>
                          ) : (
                            <>
                              <Can action="accion-activar-jornada-laboral">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8"><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Activar jornada?</AlertDialogTitle>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleToggle(j)}>Sí, activar</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>Activar</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Can>
                              <Can action="accion-eliminar-jornada-laboral">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar jornada?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(j.id)}>Sí, eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>Eliminar</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Can>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium text-gray-900">{j.nombre_jornada}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-600">{j.horas_laborales}h</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={j.activo ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}>
                          {j.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* FORMULARIO */}
        <TabsContent value="formulario" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {editing ? 'Editar Jornada Laboral' : 'Nueva Jornada Laboral'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_jornada">Nombre de Jornada *</Label>
                    <Input
                      id="nombre_jornada"
                      value={form.nombre_jornada}
                      onChange={e => setForm(f => ({ ...f, nombre_jornada: e.target.value }))}
                      placeholder="Ej: Tiempo completo, Medio tiempo..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas_laborales">Horas Laborales *</Label>
                    <Input
                      id="horas_laborales"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={form.horas_laborales}
                      onChange={e => setForm(f => ({ ...f, horas_laborales: e.target.value }))}
                      placeholder="Ej: 8, 4, 6..."
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setActiveTab('listado'); setEditing(null); setForm(EMPTY_FORM); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : editing ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
