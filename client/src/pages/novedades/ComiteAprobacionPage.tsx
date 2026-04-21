import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Scale, MoreHorizontal, Eye, CheckCircle, XCircle, FileText, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { ESTADO_COLORS, ESTADO_LABELS, ESTADOS_NOVEDAD, novedadesService, type NovedadFiltros, type NovedadMotivo, type NovedadSolicitud } from '@/services/novedadesService';

const ComiteAprobacionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<NovedadFiltros>({});
  const [busqueda, setBusqueda] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<NovedadSolicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<'aprobar' | 'rechazar' | null>(null);
  const [observacion, setObservacion] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionTargetIds, setActionTargetIds] = useState<number[]>([]);

  const empresaId: number | undefined = (() => {
    try {
      const raw = localStorage.getItem('empresaData') || localStorage.getItem('userData');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed?.empresa?.id ?? parsed?.empresas?.[0]?.id ?? undefined;
    } catch {
      return undefined;
    }
  })();

  const { data: motivos = [] } = useQuery<NovedadMotivo[]>({
    queryKey: ['novedades-motivos', empresaId],
    queryFn: async () => (await novedadesService.getMotivos(empresaId)).filter(m => m.requiere_comite),
  });
  const { data: solicitudes = [], isLoading: solicitudesLoading } = useQuery<NovedadSolicitud[]>({
    queryKey: ['novedades-solicitudes', filtros],
    queryFn: () => novedadesService.getSolicitudes(filtros),
  });
  const { data: sucursales = [] } = useQuery<string[]>({
    queryKey: ['novedades-sucursales'],
    queryFn: () => novedadesService.getSucursales(),
  });

  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(s => {
      if (!s.motivo?.requiere_comite) return false;
      const esPendiente = s.estado === 'solicitada';
      const matchesEstado = filtros.estado ? s.estado === filtros.estado : esPendiente;
      const matchesBusqueda = !busqueda || [
        s.empleado?.nombre,
        s.empleado?.apellido,
        s.motivo?.nombre,
        String(s.id || ''),
      ].some(v => v?.toLowerCase().includes(busqueda.toLowerCase()));
      return matchesEstado && matchesBusqueda;
    });
  }, [solicitudes, filtros.estado, busqueda]);

  const historialSolicitudes = useMemo(() => {
    const texto = busquedaHistorial.trim().toLowerCase();
    return solicitudes.filter(s => {
      if (!s.motivo?.requiere_comite) return false;
      const esHistorial = s.estado === ESTADOS_NOVEDAD.APROBADO_COMITE || s.estado === ESTADOS_NOVEDAD.RECHAZADA;
      if (!esHistorial) return false;
      if (!texto) return true;
      return [
        s.empleado?.nombre,
        s.empleado?.apellido,
        s.empleado?.cargo,
        s.motivo?.nombre,
        String(s.id || ''),
      ].some(v => v?.toLowerCase().includes(texto));
    });
  }, [solicitudes, busquedaHistorial]);

  const decisionMutation = useMutation({
    mutationFn: async ({ ids, aprobado, obs }: { ids: number[]; aprobado: boolean; obs: string }) => {
      for (const id of ids) {
        if (aprobado) await novedadesService.aprobarComite(id, obs);
        else await novedadesService.rechazarSolicitud(id, obs);
      }
      return { ids, aprobado };
    },
    onSuccess: ({ ids, aprobado }) => {
      toast.success(`${ids.length} solicitud(es) ${aprobado ? 'aprobadas' : 'rechazadas'} correctamente`);
      queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
      setSelectedIds([]);
      setActionTargetIds([]);
      setShowActionModal(null);
      setShowDetailModal(false);
      setObservacion('');
    },
    onError: (err: Error) => toast.error(err?.message || 'Error al procesar la acción'),
  });

  const handleViewDetail = async (solicitud: NovedadSolicitud) => {
    const detail = await novedadesService.getSolicitudById(solicitud.id!);
    setSelectedSolicitud(detail || solicitud);
    setShowDetailModal(true);
  };

  const openSingleAction = (sol: NovedadSolicitud, action: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(sol);
    setActionTargetIds([sol.id!]);
    setShowActionModal(action);
  };
  const openBulkAction = (action: 'aprobar' | 'rechazar') => {
    if (!selectedIds.length) return;
    setActionTargetIds(selectedIds);
    setShowActionModal(action);
  };

  const pendingIds = filteredSolicitudes.filter(s => s.estado === ESTADOS_NOVEDAD.SOLICITADA).map(s => s.id!).filter(Boolean);
  const allVisibleSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.includes(id));

  const handleToggleAllVisible = (checked: boolean) => {
    if (checked) {
      const merged = new Set([...selectedIds, ...pendingIds]);
      setSelectedIds(Array.from(merged));
    } else {
      setSelectedIds(prev => prev.filter(id => !pendingIds.includes(id)));
    }
  };

  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comite');
    worksheet.addRow(['ID', 'Empleado', 'Cargo', 'Motivo', 'Estado', 'Sucursal', 'Fecha']);
    filteredSolicitudes.forEach(s => {
      worksheet.addRow([
        s.id,
        `${s.empleado?.nombre || ''} ${s.empleado?.apellido || ''}`.trim(),
        s.empleado?.cargo || '',
        s.motivo?.nombre || '',
        ESTADO_LABELS[s.estado || ''] || s.estado || '',
        s.sucursal || '',
        s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '',
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comite_aprobacion.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/25"><Scale className="h-7 w-7 text-white" /></div>
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-800">Módulo Comité</h1>
          <p className="text-sm text-gray-500">Gestión de aprobaciones de solicitudes</p>
        </div>
      </div>

      <Tabs defaultValue="solicitudes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger value="solicitudes" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Solicitudes</TabsTrigger>
          <TabsTrigger value="historial" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Historial de solicitudes</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes" className="mt-6 space-y-4">
          <Card className="bg-white rounded-lg border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-orange-600" />SOLICITUDES DE COMITE</span>
                <div className="flex gap-2">
                  {selectedIds.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => openBulkAction('aprobar')}>Aprobar ({selectedIds.length})</Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => openBulkAction('rechazar')}>Rechazar ({selectedIds.length})</Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={exportarExcel} className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
                </div>
              </CardTitle>
              <div className="mt-3 p-3 border rounded-md bg-gray-50">
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
                  <div className="relative w-[220px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="h-8 pl-8 text-xs border-gray-200" />
                  </div>
                  <Select value={filtros.motivo_id?.toString() || 'all'} onValueChange={(v) => setFiltros(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v, 10) }))}>
                    <SelectTrigger className="h-8 w-[180px] text-xs border-gray-200"><SelectValue placeholder="Motivo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los motivos</SelectItem>
                      {motivos.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filtros.sucursal || 'all'} onValueChange={(v) => setFiltros(prev => ({ ...prev, sucursal: v === 'all' ? undefined : v }))}>
                    <SelectTrigger className="h-8 w-[180px] text-xs border-gray-200"><SelectValue placeholder="Sucursal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las sucursales</SelectItem>
                      {sucursales.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {solicitudesLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredSolicitudes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400"><FileText className="w-10 h-10 mb-2" /><p className="text-sm">No hay solicitudes para comité</p></div>
              ) : (
                <div className="overflow-x-auto rounded-lg shadow-sm">
                  <table className="min-w-[1000px] w-full text-[11px]">
                    <thead className="bg-cyan-50">
                      <tr className="text-left font-semibold text-gray-700">
                        <th className="px-3 py-2"><Checkbox checked={allVisibleSelected} onCheckedChange={(v) => handleToggleAllVisible(Boolean(v))} /></th>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Empleado / Cargo</th>
                        <th className="px-3 py-2">Motivo</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2 w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSolicitudes.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2">
                            <Checkbox
                              disabled={s.estado !== ESTADOS_NOVEDAD.SOLICITADA}
                              checked={selectedIds.includes(s.id!)}
                              onCheckedChange={(checked) => {
                                const id = s.id!;
                                setSelectedIds(prev => checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-500 font-mono">#{s.id}</td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900">{s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}` : '—'}</p>
                            <p className="text-xs text-gray-500">{s.empleado?.cargo || '—'}</p>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{s.motivo?.nombre || '—'}</td>
                          <td className="px-3 py-2"><Badge className={`text-xs ${ESTADO_COLORS[s.estado || ''] || 'bg-gray-100 text-gray-800'}`}>{ESTADO_LABELS[s.estado || ''] || s.estado}</Badge></td>
                          <td className="px-3 py-2 text-gray-600">{s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '—'}</td>
                          <td className="px-3 py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4 text-gray-600" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuItem onClick={() => handleViewDetail(s)} className="cursor-pointer"><Eye className="mr-2 h-4 w-4 text-cyan-600" />Ver</DropdownMenuItem>
                                {s.estado === ESTADOS_NOVEDAD.SOLICITADA && (
                                  <>
                                    <DropdownMenuItem onClick={() => openSingleAction(s, 'aprobar')} className="cursor-pointer"><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Aprobar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openSingleAction(s, 'rechazar')} className="cursor-pointer"><XCircle className="mr-2 h-4 w-4 text-red-600" />Rechazar</DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <Card className="bg-white rounded-lg border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" />HISTORIAL DE SOLICITUDES</span>
                <div className="relative w-[260px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input placeholder="Buscar solicitud..." value={busquedaHistorial} onChange={e => setBusquedaHistorial(e.target.value)} className="h-8 pl-8 text-xs border-gray-200" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-[11px]">
                  <thead className="bg-cyan-50"><tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Empleado</th><th className="px-3 py-2 text-left">Cargo</th><th className="px-3 py-2 text-left">Motivo</th><th className="px-3 py-2 text-left">Estado</th><th className="px-3 py-2 text-left">Fecha</th></tr></thead>
                  <tbody className="divide-y">
                    {historialSolicitudes.map(s => (
                      <tr key={s.id}>
                        <td className="px-3 py-2 text-gray-500 font-mono">#{s.id}</td>
                        <td className="px-3 py-2">{s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}` : '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.empleado?.cargo || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.motivo?.nombre || '-'}</td>
                        <td className="px-3 py-2">
                          <Badge className={`text-xs ${ESTADO_COLORS[s.estado || ''] || 'bg-gray-100 text-gray-800'}`}>
                            {ESTADO_LABELS[s.estado || ''] || s.estado}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitud #{selectedSolicitud?.id}</DialogTitle>
            <DialogDescription>{selectedSolicitud?.motivo?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Empleado:</strong> {selectedSolicitud?.empleado?.nombre} {selectedSolicitud?.empleado?.apellido || ''}</p>
            <p><strong>Cargo:</strong> {selectedSolicitud?.empleado?.cargo || '—'}</p>
            <p><strong>Observaciones:</strong> {selectedSolicitud?.observaciones || '—'}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selectedSolicitud?.datos_formulario || {}).map(([k, v]) => (
                <div key={k} className="border rounded p-2"><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{String(v)}</p></div>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setShowDetailModal(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showActionModal} onOpenChange={(open) => !open && setShowActionModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showActionModal === 'aprobar' ? 'Aprobar' : 'Rechazar'} solicitud(es)</DialogTitle>
            <DialogDescription>Se aplicará a {actionTargetIds.length} registro(s)</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Observación *</Label>
            <Textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Detalle de la decisión..." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowActionModal(null)}>Cancelar</Button>
            <Button
              disabled={decisionMutation.isPending || !observacion.trim() || actionTargetIds.length === 0}
              onClick={() => decisionMutation.mutate({ ids: actionTargetIds, aprobado: showActionModal === 'aprobar', obs: observacion })}
            >
              {decisionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComiteAprobacionPage;
