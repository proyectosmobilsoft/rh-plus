<<<<<<< HEAD

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Trash2, Search, Filter, MessageSquare, CheckCircle, Lock, Save, Paperclip, Eye, Users, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

import { useMotivosCrud } from '@/hooks/useMotivosCrud';
import { Motivo, MotivoForm } from '@/types/maestro';
import { useEmpresas } from '@/hooks/useDatabaseData';
import { useLoading } from '@/contexts/LoadingContext';
import { Can } from "@/contexts/PermissionsContext";
import { toast } from 'sonner';

const motivoSchema = z.object({
    codigo: z.string().min(1, 'Código requerido'),
    nombre: z.string().min(2, 'Nombre requerido'),
    descripcion: z.string().optional(),
    tipo: z.string().min(1, 'Tipo requerido'),
    empresa_id: z.number({
        required_error: 'Empresa requerida',
        invalid_type_error: 'Empresa requerida',
    }).int().positive('Empresa requerida'),
    requiere_adjunto: z.boolean().default(false),
    adjunto_obligatorio: z.boolean().default(false),
    requiere_observacion: z.boolean().default(false),
    requiere_comite: z.boolean().default(false),
});

export default function MotivosPage() {
    // Estados
    const [activeTab, setActiveTab] = useState("listado");
    const [editingMotivo, setEditingMotivo] = useState<Motivo | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [empresaFilter, setEmpresaFilter] = useState<string>("all");
    const [showInactivateModal, setShowInactivateModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [motivoToAction, setMotivoToAction] = useState<Motivo | null>(null);

    const { startLoading, stopLoading } = useLoading();

    const {
        motivos,
        isLoading: loadingMotivos,
        createMotivo,
        updateMotivo,
        deleteMotivo,
        activateMotivo,
        isCreating,
        isUpdating,
    } = useMotivosCrud();

    const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();

    // Forms
    const motivoForm = useForm<MotivoForm>({
        resolver: zodResolver(motivoSchema),
        defaultValues: { 
            codigo: '', 
            nombre: '', 
            descripcion: '',
            tipo: '',
            empresa_id: undefined,
            requiere_adjunto: false,
            adjunto_obligatorio: false,
            requiere_observacion: false,
            requiere_comite: false,
        },
    });

    // Filtrar motivos
    const filteredMotivos: Motivo[] = (motivos?.filter(motivo => {
        const matchesSearch =
            motivo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            motivo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" ? true :
            statusFilter === "active" ? motivo.activo : !motivo.activo;

        const matchesEmpresa = empresaFilter === "all" ? true :
            String(motivo.empresa_id ?? '') === empresaFilter;

        return matchesSearch && matchesStatus && matchesEmpresa;
    }) || [])
        .sort((a, b) => {
            // Mostrar activos primero
            if (a.activo !== b.activo) {
                return a.activo ? -1 : 1;
            }
            // Luego ordenar por nombre
            return (a.nombre || "").localeCompare(b.nombre || "");
        });

    // Handlers
    const handleEdit = (motivo: Motivo) => {
        setEditingMotivo(motivo);
        motivoForm.reset({
            codigo: motivo.codigo || '',
            nombre: motivo.nombre || '',
            descripcion: motivo.descripcion || '',
            tipo: motivo.tipo || '',
            empresa_id: motivo.empresa_id,
            requiere_adjunto: motivo.requiere_adjunto ?? false,
            adjunto_obligatorio: motivo.adjunto_obligatorio ?? false,
            requiere_observacion: motivo.requiere_observacion ?? false,
            requiere_comite: motivo.requiere_comite ?? false,
        });
        setActiveTab("registro");
    };

    const handleInactivate = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowInactivateModal(true);
    };

    const handleActivate = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowActivateModal(true);
    };

    const handleDelete = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowDeleteModal(true);
    };

    const confirmInactivate = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await deleteMotivo(motivoToAction.id); // soft delete
        } finally {
            stopLoading();
            setShowInactivateModal(false);
            setMotivoToAction(null);
        }
    };

    const confirmActivate = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await activateMotivo(motivoToAction.id);
        } finally {
            stopLoading();
            setShowActivateModal(false);
            setMotivoToAction(null);
        }
    };

    const confirmDelete = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await deleteMotivo(motivoToAction.id);
        } finally {
            stopLoading();
            setShowDeleteModal(false);
            setMotivoToAction(null);
        }
    };

    const handleNewMotivo = () => {
        setEditingMotivo(null);
        motivoForm.reset({ 
            codigo: '', 
            nombre: '', 
            descripcion: '',
            tipo: '',
            empresa_id: undefined,
            requiere_adjunto: false,
            adjunto_obligatorio: false,
            requiere_observacion: false,
            requiere_comite: false,
        });
        setActiveTab("registro");
    };

    const handleMotivoSubmit = async (data: MotivoForm) => {
        startLoading();
        try {
            if (editingMotivo) {
                await updateMotivo({ id: editingMotivo.id, data });
            } else {
                await createMotivo(data);
            }
            motivoForm.reset({ 
                codigo: '', 
                nombre: '', 
                descripcion: '',
                tipo: '',
                empresa_id: undefined,
                requiere_adjunto: false,
                adjunto_obligatorio: false,
                requiere_observacion: false,
                requiere_comite: false,
            });
            setEditingMotivo(null);
            setActiveTab("listado");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-8 h-8 text-cyan-600" />
                    Gestión de Motivos
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
                    <TabsTrigger
                        value="listado"
                        className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                    >
                        Listado de Motivos
                    </TabsTrigger>
                    <TabsTrigger
                        value="registro"
                        className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                    >
                        Registro de Motivos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="listado" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">MOTIVOS</span>
                            </div>
                            <div className="flex space-x-2">
                                <Can action="accion-crear-motivo">
                                    <Button
                                        onClick={handleNewMotivo}
                                        className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                                        size="sm"
                                    >
                                        Adicionar Registro
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar por nombre, descripción..."
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
                                        <SelectItem value="active">Solo activos</SelectItem>
                                        <SelectItem value="inactive">Solo inactivos</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las empresas</SelectItem>
                                        {empresas.map((e: any) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.razon_social || e.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("active");
                                        setEmpresaFilter("all");
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            <Table className="min-w-[800px] w-full text-xs">
                                <TableHeader className="bg-cyan-50">
                                    <TableRow className="text-left font-semibold text-gray-700">
                                        <TableHead className="px-2 py-1 text-teal-600 w-32">Acciones</TableHead>
                                        <TableHead className="px-4 py-3 w-24">Código</TableHead>
                                        <TableHead className="px-4 py-3 w-32">Tipo</TableHead>
                                        <TableHead className="px-4 py-3 w-1/4">Empresa</TableHead>
                                        <TableHead className="px-4 py-3 w-1/4">Nombre</TableHead>
                                        <TableHead className="px-4 py-3 w-1/3">Descripción</TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Adjunto obligatorio"><Paperclip className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Observación requerida"><Eye className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Requiere comité"><Users className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 w-24">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loadingMotivos ? (
                                        filteredMotivos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No hay motivos disponibles.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredMotivos.map((motivo) => (
                                                <TableRow key={motivo.id} className="hover:bg-gray-50">
                                                    <TableCell className="px-2 py-1">
                                                        <div className="flex flex-row gap-1 items-center">
                                                            {motivo.activo && (
                                                                <Can action="accion-editar-motivo">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleEdit(motivo)}
                                                                                    aria-label="Editar motivo"
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
                                                                </Can>
                                                            )}

                                                            {motivo.activo ? (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleInactivate(motivo)}
                                                                                aria-label="Inactivar motivo"
                                                                                className="h-8 w-8"
                                                                            >
                                                                                <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                                                            </Button>
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
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleDelete(motivo)}
                                                                                    aria-label="Eliminar motivo"
                                                                                    className="h-8 w-8"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800 transition-colors" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Eliminar</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleActivate(motivo)}
                                                                                    aria-label="Activar motivo"
                                                                                    className="h-8 w-8"
                                                                                >
                                                                                    <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                                                                </Button>
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
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">{motivo.codigo}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">{motivo.tipo || '-'}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                                                        {motivo.empresa_id 
                                                            ? (empresas.find((e: any) => e.id === motivo.empresa_id)?.razon_social || motivo.empresa_id)
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{motivo.nombre}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500">{motivo.descripcion || '-'}</TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.adjunto_obligatorio
                                                            ? <Check className="w-4 h-4 text-green-600 inline" />
                                                            : motivo.requiere_adjunto
                                                                ? <span className="text-xs text-gray-400">Opc.</span>
                                                                : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.requiere_observacion
                                                            ? <Check className="w-4 h-4 text-green-600 inline" />
                                                            : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.requiere_comite
                                                            ? <Check className="w-4 h-4 text-amber-600 inline" />
                                                            : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge variant={motivo.activo ? "default" : "secondary"} className={motivo.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                                                            {motivo.activo ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Cargando motivos...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="registro" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                {editingMotivo ? "Editar motivo" : "Crear nuevo motivo"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...motivoForm}>
                                <form onSubmit={motivoForm.handleSubmit(handleMotivoSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={motivoForm.control}
                                            name="codigo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Código del Motivo</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="nombre"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre del Motivo</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="tipo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Motivo</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="retiro">Retiro</SelectItem>
                                                            <SelectItem value="licencia">Licencia</SelectItem>
                                                            <SelectItem value="vacaciones">Vacaciones</SelectItem>
                                                            <SelectItem value="incapacidad">Incapacidad</SelectItem>
                                                            <SelectItem value="aumento_plaza">Aumento de plaza</SelectItem>
                                                            <SelectItem value="cambio_centro_costo">Cambio centro de costo</SelectItem>
                                                            <SelectItem value="renuncia">Renuncia</SelectItem>
                                                            <SelectItem value="postulacion_interna">Postulación interna</SelectItem>
                                                            <SelectItem value="otro">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="empresa_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Empresa</FormLabel>
                                                    <Select
                                                        value={field.value ? String(field.value) : ''}
                                                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                                                        disabled={loadingEmpresas}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccione una empresa"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {empresas.map((empresa: any) => (
                                                                <SelectItem key={empresa.id} value={String(empresa.id)}>
                                                                    {empresa.razon_social || empresa.nombre}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="descripcion"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Descripción</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_adjunto"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere adjunto</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Indica si la novedad debe permitir adjuntar archivos.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="adjunto_obligatorio"
                                            render={({ field }) => {
                                                const requiereAdjunto = motivoForm.watch('requiere_adjunto');
                                                return (
                                                    <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 ${!requiereAdjunto ? 'opacity-40 pointer-events-none' : ''}`}>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={(checked) => field.onChange(checked === true)}
                                                                disabled={!requiereAdjunto}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>Adjunto obligatorio</FormLabel>
                                                            <p className="text-xs text-muted-foreground">
                                                                El adjunto será obligatorio al crear la solicitud. Solo disponible si "Requiere adjunto" está activo.
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_observacion"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere observación</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Obliga a diligenciar observaciones en la solicitud.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_comite"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere comité</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Marca las solicitudes de este motivo como sujetas a aprobación de comité.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Can action={editingMotivo ? "accion-actualizar-motivo" : "accion-crear-motivo"}>
                                            <Button
                                                type="submit"
                                                disabled={isCreating || isUpdating}
                                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar
                                            </Button>
                                        </Can>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modales de Confirmación */}
            <AlertDialog open={showInactivateModal} onOpenChange={setShowInactivateModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción inactivará el motivo <strong>{motivoToAction?.nombre}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmInactivate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            Inactivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción activará el motivo <strong>{motivoToAction?.nombre}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmActivate} className="bg-green-600 hover:bg-green-700 text-white">
                            Activar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el motivo <strong>{motivoToAction?.nombre}</strong>. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
=======

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Trash2, Search, Filter, MessageSquare, CheckCircle, Lock, Save, Paperclip, Eye, Users, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

import { useMotivosCrud } from '@/hooks/useMotivosCrud';
import { Motivo, MotivoForm } from '@/types/maestro';
import { useEmpresas } from '@/hooks/useDatabaseData';
import { useLoading } from '@/contexts/LoadingContext';
import { Can } from "@/contexts/PermissionsContext";
import { toast } from 'sonner';

const motivoSchema = z.object({
    codigo: z.string().min(1, 'Código requerido'),
    nombre: z.string().min(2, 'Nombre requerido'),
    descripcion: z.string().optional(),
    tipo: z.string().min(1, 'Tipo requerido'),
    empresa_id: z.number({
        required_error: 'Empresa requerida',
        invalid_type_error: 'Empresa requerida',
    }).int().positive('Empresa requerida'),
    requiere_adjunto: z.boolean().default(false),
    adjunto_obligatorio: z.boolean().default(false),
    requiere_observacion: z.boolean().default(false),
    requiere_comite: z.boolean().default(false),
});

export default function MotivosPage() {
    // Estados
    const [activeTab, setActiveTab] = useState("listado");
    const [editingMotivo, setEditingMotivo] = useState<Motivo | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [empresaFilter, setEmpresaFilter] = useState<string>("all");
    const [showInactivateModal, setShowInactivateModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [motivoToAction, setMotivoToAction] = useState<Motivo | null>(null);

    const { startLoading, stopLoading } = useLoading();

    const {
        motivos,
        isLoading: loadingMotivos,
        createMotivo,
        updateMotivo,
        deleteMotivo,
        activateMotivo,
        isCreating,
        isUpdating,
    } = useMotivosCrud();

    const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();

    // Forms
    const motivoForm = useForm<MotivoForm>({
        resolver: zodResolver(motivoSchema),
        defaultValues: { 
            codigo: '', 
            nombre: '', 
            descripcion: '',
            tipo: '',
            empresa_id: undefined,
            requiere_adjunto: false,
            adjunto_obligatorio: false,
            requiere_observacion: false,
            requiere_comite: false,
        },
    });

    // Filtrar motivos
    const filteredMotivos: Motivo[] = (motivos?.filter(motivo => {
        const matchesSearch =
            motivo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            motivo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" ? true :
            statusFilter === "active" ? motivo.activo : !motivo.activo;

        const matchesEmpresa = empresaFilter === "all" ? true :
            String(motivo.empresa_id ?? '') === empresaFilter;

        return matchesSearch && matchesStatus && matchesEmpresa;
    }) || [])
        .sort((a, b) => {
            // Mostrar activos primero
            if (a.activo !== b.activo) {
                return a.activo ? -1 : 1;
            }
            // Luego ordenar por nombre
            return (a.nombre || "").localeCompare(b.nombre || "");
        });

    // Handlers
    const handleEdit = (motivo: Motivo) => {
        setEditingMotivo(motivo);
        motivoForm.reset({
            codigo: motivo.codigo || '',
            nombre: motivo.nombre || '',
            descripcion: motivo.descripcion || '',
            tipo: motivo.tipo || '',
            empresa_id: motivo.empresa_id,
            requiere_adjunto: motivo.requiere_adjunto ?? false,
            adjunto_obligatorio: motivo.adjunto_obligatorio ?? false,
            requiere_observacion: motivo.requiere_observacion ?? false,
            requiere_comite: motivo.requiere_comite ?? false,
        });
        setActiveTab("registro");
    };

    const handleInactivate = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowInactivateModal(true);
    };

    const handleActivate = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowActivateModal(true);
    };

    const handleDelete = (motivo: Motivo) => {
        setMotivoToAction(motivo);
        setShowDeleteModal(true);
    };

    const confirmInactivate = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await deleteMotivo(motivoToAction.id); // soft delete
        } finally {
            stopLoading();
            setShowInactivateModal(false);
            setMotivoToAction(null);
        }
    };

    const confirmActivate = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await activateMotivo(motivoToAction.id);
        } finally {
            stopLoading();
            setShowActivateModal(false);
            setMotivoToAction(null);
        }
    };

    const confirmDelete = async () => {
        if (!motivoToAction?.id) return;

        startLoading();
        try {
            await deleteMotivo(motivoToAction.id);
        } finally {
            stopLoading();
            setShowDeleteModal(false);
            setMotivoToAction(null);
        }
    };

    const handleNewMotivo = () => {
        setEditingMotivo(null);
        motivoForm.reset({ 
            codigo: '', 
            nombre: '', 
            descripcion: '',
            tipo: '',
            empresa_id: undefined,
            requiere_adjunto: false,
            adjunto_obligatorio: false,
            requiere_observacion: false,
            requiere_comite: false,
        });
        setActiveTab("registro");
    };

    const handleMotivoSubmit = async (data: MotivoForm) => {
        startLoading();
        try {
            if (editingMotivo) {
                await updateMotivo({ id: editingMotivo.id, data });
            } else {
                await createMotivo(data);
            }
            motivoForm.reset({ 
                codigo: '', 
                nombre: '', 
                descripcion: '',
                tipo: '',
                empresa_id: undefined,
                requiere_adjunto: false,
                adjunto_obligatorio: false,
                requiere_observacion: false,
                requiere_comite: false,
            });
            setEditingMotivo(null);
            setActiveTab("listado");
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-8 h-8 text-cyan-600" />
                    Gestión de Motivos
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
                    <TabsTrigger
                        value="listado"
                        className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                    >
                        Listado de Motivos
                    </TabsTrigger>
                    <TabsTrigger
                        value="registro"
                        className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                    >
                        Registro de Motivos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="listado" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">MOTIVOS</span>
                            </div>
                            <div className="flex space-x-2">
                                <Can action="accion-crear-motivo">
                                    <Button
                                        onClick={handleNewMotivo}
                                        className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                                        size="sm"
                                    >
                                        Adicionar Registro
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar por nombre, descripción..."
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
                                        <SelectItem value="active">Solo activos</SelectItem>
                                        <SelectItem value="inactive">Solo inactivos</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las empresas</SelectItem>
                                        {empresas.map((e: any) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.razon_social || e.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("active");
                                        setEmpresaFilter("all");
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            <Table className="min-w-[800px] w-full text-xs">
                                <TableHeader className="bg-cyan-50">
                                    <TableRow className="text-left font-semibold text-gray-700">
                                        <TableHead className="px-2 py-1 text-teal-600 w-32">Acciones</TableHead>
                                        <TableHead className="px-4 py-3 w-24">Código</TableHead>
                                        <TableHead className="px-4 py-3 w-32">Tipo</TableHead>
                                        <TableHead className="px-4 py-3 w-1/4">Empresa</TableHead>
                                        <TableHead className="px-4 py-3 w-1/4">Nombre</TableHead>
                                        <TableHead className="px-4 py-3 w-1/3">Descripción</TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Adjunto obligatorio"><Paperclip className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Observación requerida"><Eye className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 text-center w-14" title="Requiere comité"><Users className="w-3.5 h-3.5 inline" /></TableHead>
                                        <TableHead className="px-4 py-3 w-24">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loadingMotivos ? (
                                        filteredMotivos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No hay motivos disponibles.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredMotivos.map((motivo) => (
                                                <TableRow key={motivo.id} className="hover:bg-gray-50">
                                                    <TableCell className="px-2 py-1">
                                                        <div className="flex flex-row gap-1 items-center">
                                                            {motivo.activo && (
                                                                <Can action="accion-editar-motivo">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleEdit(motivo)}
                                                                                    aria-label="Editar motivo"
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
                                                                </Can>
                                                            )}

                                                            {motivo.activo ? (
                                                                <Can action="accion-inactivar-motivo">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleInactivate(motivo)}
                                                                                    aria-label="Inactivar motivo"
                                                                                    className="h-8 w-8"
                                                                                >
                                                                                    <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Inactivar</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </Can>
                                                            ) : (
                                                                <>
                                                                    <Can action="accion-eliminar-motivo">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={() => handleDelete(motivo)}
                                                                                        aria-label="Eliminar motivo"
                                                                                        className="h-8 w-8"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800 transition-colors" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Eliminar</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </Can>
                                                                    <Can action="accion-activar-motivo">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={() => handleActivate(motivo)}
                                                                                        aria-label="Activar motivo"
                                                                                        className="h-8 w-8"
                                                                                    >
                                                                                        <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-800 transition-colors" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Activar</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </Can>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">{motivo.codigo}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">{motivo.tipo || '-'}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                                                        {motivo.empresa_id 
                                                            ? (empresas.find((e: any) => e.id === motivo.empresa_id)?.razon_social || motivo.empresa_id)
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">{motivo.nombre}</TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500">{motivo.descripcion || '-'}</TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.adjunto_obligatorio
                                                            ? <Check className="w-4 h-4 text-green-600 inline" />
                                                            : motivo.requiere_adjunto
                                                                ? <span className="text-xs text-gray-400">Opc.</span>
                                                                : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.requiere_observacion
                                                            ? <Check className="w-4 h-4 text-green-600 inline" />
                                                            : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-center">
                                                        {motivo.requiere_comite
                                                            ? <Check className="w-4 h-4 text-amber-600 inline" />
                                                            : <X className="w-3.5 h-3.5 text-gray-300 inline" />}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge variant={motivo.activo ? "default" : "secondary"} className={motivo.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                                                            {motivo.activo ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Cargando motivos...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="registro" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                {editingMotivo ? "Editar motivo" : "Crear nuevo motivo"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...motivoForm}>
                                <form onSubmit={motivoForm.handleSubmit(handleMotivoSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={motivoForm.control}
                                            name="codigo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Código del Motivo</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="nombre"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre del Motivo</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="tipo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Motivo</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="retiro">Retiro</SelectItem>
                                                            <SelectItem value="licencia">Licencia</SelectItem>
                                                            <SelectItem value="vacaciones">Vacaciones</SelectItem>
                                                            <SelectItem value="incapacidad">Incapacidad</SelectItem>
                                                            <SelectItem value="aumento_plaza">Aumento de plaza</SelectItem>
                                                            <SelectItem value="cambio_centro_costo">Cambio centro de costo</SelectItem>
                                                            <SelectItem value="renuncia">Renuncia</SelectItem>
                                                            <SelectItem value="postulacion_interna">Postulación interna</SelectItem>
                                                            <SelectItem value="otro">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="empresa_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Empresa</FormLabel>
                                                    <Select
                                                        value={field.value ? String(field.value) : ''}
                                                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                                                        disabled={loadingEmpresas}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccione una empresa"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {empresas.map((empresa: any) => (
                                                                <SelectItem key={empresa.id} value={String(empresa.id)}>
                                                                    {empresa.razon_social || empresa.nombre}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="descripcion"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Descripción</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_adjunto"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere adjunto</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Indica si la novedad debe permitir adjuntar archivos.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="adjunto_obligatorio"
                                            render={({ field }) => {
                                                const requiereAdjunto = motivoForm.watch('requiere_adjunto');
                                                return (
                                                    <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 ${!requiereAdjunto ? 'opacity-40 pointer-events-none' : ''}`}>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={(checked) => field.onChange(checked === true)}
                                                                disabled={!requiereAdjunto}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>Adjunto obligatorio</FormLabel>
                                                            <p className="text-xs text-muted-foreground">
                                                                El adjunto será obligatorio al crear la solicitud. Solo disponible si "Requiere adjunto" está activo.
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_observacion"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere observación</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Obliga a diligenciar observaciones en la solicitud.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={motivoForm.control}
                                            name="requiere_comite"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Requiere comité</FormLabel>
                                                        <p className="text-xs text-muted-foreground">
                                                            Marca las solicitudes de este motivo como sujetas a aprobación de comité.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Can action={editingMotivo ? "accion-actualizar-motivo" : "accion-crear-motivo"}>
                                            <Button
                                                type="submit"
                                                disabled={isCreating || isUpdating}
                                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar
                                            </Button>
                                        </Can>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modales de Confirmación */}
            <AlertDialog open={showInactivateModal} onOpenChange={setShowInactivateModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción inactivará el motivo <strong>{motivoToAction?.nombre}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmInactivate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            Inactivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción activará el motivo <strong>{motivoToAction?.nombre}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmActivate} className="bg-green-600 hover:bg-green-700 text-white">
                            Activar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el motivo <strong>{motivoToAction?.nombre}</strong>. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
>>>>>>> 35fd7af (feat: revision)
