import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    ClipboardCheck,
    Plus,
    Search,
    Download,
    Filter,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Users,
    FileText,
    Clock,
    Eye,
    XCircle,
    CheckCircle,
    Loader2,
    AlertCircle,
    MoreHorizontal,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Snowflake,
    Briefcase,
    ArrowRightCircle,
    UserPlus,
    Upload,
    UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    novedadesService,
    novedadesLogsService,
    ESTADOS_NOVEDAD,
    ESTADO_LABELS,
    ESTADO_COLORS,
    TRANSICIONES_VALIDAS,
    ACCIONES_NOVEDADES,
    type NovedadSolicitud,
    type NovedadEmpleado,
    type NovedadMotivo,
    type NovedadFiltros,
    type NovedadLog,
    type SolicitudCandidato,
} from '@/services/novedadesService';
import { supabase } from '@/services/supabaseClient';
import { analistaAsignacionService } from '@/services/analistaAsignacionService';
import { emailService } from '@/services/emailService';
import { Can, usePermissions } from '@/contexts/PermissionsContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useRegisterView } from '@/hooks/useRegisterView';
import { NOVEDADES_PERMISOS } from '@/constants/novedadesPermisos';
import { SelectWithSearch } from '@/components/ui/select-with-search';

// ============================================================
// TIPOS DE FORMULARIO POR MOTIVO
// ============================================================

const FORM_FIELDS_BY_MOTIVO: Record<string, { label: string; name: string; type: string; required?: boolean; options?: string[]; helperText?: string; defaultToday?: boolean; minToday?: boolean; rowSpan?: boolean; colStart?: 1 | 2 | 3 | 4; rowStart?: number; multiple?: boolean; colSpan?: 'full' | number }[]> = {
    incapacidades: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true },
    ],
    retiros: [
        { label: 'Fecha de solicitud', name: 'fecha_solicitud', type: 'date', required: true, defaultToday: true, colStart: 1, rowStart: 1 },
        { label: 'Último día de trabajo', name: 'fecha_retiro', type: 'date', required: true, colStart: 2, rowStart: 1 },
        { label: 'Tiempo Antigüedad', name: 'tiempo_antiguedad', type: 'text', colStart: 1, rowStart: 2 },
        { label: 'Tipo de contratación', name: 'tipo_contratacion', type: 'text', colStart: 2, rowStart: 2 },
        { label: '¿Requiere reemplazo?', name: 'requiere_reemplazo', type: 'checkbox', colSpan: 'full', rowStart: 3 },
        { label: 'Motivo del retiro', name: 'motivo_retiro', type: 'textarea', required: true, colSpan: 'full', rowStart: 4 },
    ],
    aumento_plaza: [
        { label: 'Cargo', name: 'cargo', type: 'cargo-select', required: true },
        { label: 'Salario', name: 'salario', type: 'number' },
        { label: 'Auxilio no prestacional', name: 'auxilio', type: 'number' },
        { label: 'Horas laborales', name: 'horas', type: 'jornada-select', required: true },
        { label: 'Jornada', name: 'jornada', type: 'select', options: ['Diurna', 'Nocturna', 'Mixta', 'Flexible'], required: true },
        { label: 'Unidad de negocio', name: 'negocio', type: 'text', required: true },
        { label: 'Centro de costo', name: 'centro_costo', type: 'centro-costo-select', required: true },
        { label: 'Área', name: 'area', type: 'area-select', required: true },
        { label: 'Proyecto', name: 'proyecto', type: 'proyecto-select', required: true },
        { label: 'Sucursal', name: 'sucursal', type: 'sucursal-select', required: true },
        { label: 'Sede Labor', name: 'sede_labor', type: 'sede-labor-select', required: true },
        { label: 'Ciudad', name: 'ciudad', type: 'ciudad-select', required: true },
        { label: 'Fecha de ingreso', name: 'fecha_ingreso', type: 'date', required: true, minToday: true },
    ],
    cambio_centro_costo: [
        { label: 'Sucursal anterior', name: 'sucursal_anterior', type: 'sucursal-anterior-select', required: true },
        { label: 'Sucursal nueva', name: 'sucursal_nueva', type: 'sucursal-select', required: true },
        { label: 'Fecha inicio del cambio', name: 'fecha_inicio_cambio', type: 'date', required: true },
    ],
    vacaciones: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true, helperText: 'Mínimo 30 días entre fechas' },
    ],
    licencias: [
        { label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true },
        { label: 'Fecha final', name: 'fecha_fin', type: 'date', required: true },
        { label: 'Tipo de licencia', name: 'tipo_licencia', type: 'select', options: ['Maternidad', 'Paternidad', 'Luto', 'Calamidad doméstica', 'Sin goce de sueldo', 'Otra'], required: true },
        { label: 'Duración (días)', name: 'duracion', type: 'duracion-auto' },
    ],
    renuncias: [
        { label: 'Fecha de solicitud', name: 'fecha_renuncia', type: 'date', required: true, defaultToday: true },
        { label: 'Motivo de la renuncia', name: 'motivo_renuncia', type: 'motivo-renuncia-select', required: true },
        { label: 'Último día de trabajo', name: 'fecha_finalizacion', type: 'date', required: true },
        { label: '¿Requiere reemplazo?', name: 'requiere_reemplazo', type: 'checkbox' },
    ],
    postulaciones_internas: [
        { label: 'Cargo al que postula', name: 'cargo_postulacion', type: 'cargo-select', required: true, colStart: 1, rowStart: 1 },
        { label: 'Salario esperado', name: 'salario_esperado', type: 'number', colStart: 2, rowStart: 1 },
        { label: '¿Genera reemplazo?', name: 'genera_reemplazo', type: 'checkbox', colStart: 3, rowStart: 1 },
        { label: 'Motivo de la postulación', name: 'motivo_postulacion', type: 'textarea', required: true, colStart: 1, rowStart: 2, colSpan: 'full' },
    ],
};

// ID del módulo de Comité en gen_modulos
const MODULO_COMITE_ID = 33;

// Aliases en singular para compatibilidad con códigos de BD
FORM_FIELDS_BY_MOTIVO.incapacidad = FORM_FIELDS_BY_MOTIVO.incapacidades;
FORM_FIELDS_BY_MOTIVO.retiro = FORM_FIELDS_BY_MOTIVO.retiros;
FORM_FIELDS_BY_MOTIVO.renuncia = FORM_FIELDS_BY_MOTIVO.renuncias;
FORM_FIELDS_BY_MOTIVO.licencia = FORM_FIELDS_BY_MOTIVO.licencias;
FORM_FIELDS_BY_MOTIVO.postulacion_interna = FORM_FIELDS_BY_MOTIVO.postulaciones_internas;

/** Etiqueta del menú para pasar a un estado destino (nombres de acción solicitados). */
const getLabelAccionCambioEstado = (estadoDestino: string): string => {
    if (estadoDestino === ESTADOS_NOVEDAD.CONGELADA) return 'Congelar';
    if (estadoDestino === ESTADOS_NOVEDAD.CANCELADA) return 'Cancelar';
    if (estadoDestino === ESTADOS_NOVEDAD.EN_RECLUTAMIENTO) return 'En Reclutamiento';
    return ESTADO_LABELS[estadoDestino] || estadoDestino;
};

const iconAccionCambioEstado = (estadoDestino: string) => {
    if (estadoDestino === ESTADOS_NOVEDAD.CONGELADA) return Snowflake;
    if (estadoDestino === ESTADOS_NOVEDAD.CANCELADA) return XCircle;
    if (estadoDestino === ESTADOS_NOVEDAD.EN_RECLUTAMIENTO) return Briefcase;
    return ArrowRightCircle;
};

// La aprobación de novedades solo está permitida los viernes
const esViernes = () => new Date().getDay() === 5;

// Días sin gestión antes de notificar al coordinador
const DIAS_LIMITE_NOTIFICACION = 15;

// Estados que se consideran finales (no generan alerta)
const ESTADOS_FINALES = [ESTADOS_NOVEDAD.EJECUTADA, ESTADOS_NOVEDAD.RECHAZADA, ESTADOS_NOVEDAD.CANCELADA];

const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CURRENCY_FIELDS = new Set(['salario', 'auxilio', 'salario_esperado']);
const formatCurrency = (value: string | number) => {
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    if (!numeric) return '';
    return new Intl.NumberFormat('es-CO').format(numeric);
};

const calcularAntiguedad = (fechaIngreso?: string): string => {
    if (!fechaIngreso) return '';
    const inicio = new Date(fechaIngreso);
    if (Number.isNaN(inicio.getTime())) return '';

    const hoy = new Date();
    let anios = hoy.getFullYear() - inicio.getFullYear();
    let meses = hoy.getMonth() - inicio.getMonth();

    if (meses < 0) {
        anios -= 1;
        meses += 12;
    }

    if (anios < 0) return '';

    const partes: string[] = [];
    if (anios > 0) {
        partes.push(`${anios} año${anios !== 1 ? 's' : ''}`);
    }
    if (meses > 0) {
        partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
    }

    if (!partes.length) {
        return 'Menos de 1 mes';
    }

    return partes.join(' ');
};

const CurrencyInput = React.memo(({ value, onChange, className }: { value: string; onChange: (raw: string) => void; className?: string }) => {
    const [display, setDisplay] = React.useState(() => formatCurrency(value));
    const externalRef = React.useRef(value);

    React.useEffect(() => {
        if (externalRef.current !== value) {
            externalRef.current = value;
            setDisplay(formatCurrency(value));
        }
    }, [value]);

    return (
        <Input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                const formatted = raw ? new Intl.NumberFormat('es-CO').format(Number(raw)) : '';
                externalRef.current = raw;
                setDisplay(formatted);
                onChange(raw);
            }}
            className={className}
            placeholder="0"
        />
    );
});

// ============================================================
// ETAPA STEPPER — pipeline de selección
// ============================================================

const ETAPAS_PIPELINE = [
    { key: ESTADOS_NOVEDAD.EN_RECLUTAMIENTO, label: 'En Reclutamiento', icon: Search },
    { key: ESTADOS_NOVEDAD.ENTREVISTA_CLIENTE, label: 'Entrevista Cliente', icon: Users },
    { key: ESTADOS_NOVEDAD.SELECCIONADO, label: 'Seleccionado', icon: UserCheck },
    { key: ESTADOS_NOVEDAD.EJECUTADA, label: 'Contratado', icon: CheckCircle },
];

const EtapaStepper = ({ estadoActual }: { estadoActual: string }) => {
    const etapaActualIdx = ETAPAS_PIPELINE.findIndex(e => e.key === estadoActual);
    return (
        <div className="flex items-center gap-1 w-full py-2">
            {ETAPAS_PIPELINE.map((etapa, idx) => {
                const completada = idx < etapaActualIdx || estadoActual === ESTADOS_NOVEDAD.EJECUTADA;
                const activa = etapa.key === estadoActual;
                const Icon = etapa.icon;
                return (
                    <React.Fragment key={etapa.key}>
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                                completada ? 'bg-emerald-500 border-emerald-500 text-white' :
                                activa ? 'bg-blue-500 border-blue-500 text-white' :
                                'bg-gray-100 border-gray-300 text-gray-400'
                            }`}>
                                {completada ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                            </div>
                            <span className={`text-[10px] mt-0.5 text-center font-medium leading-tight ${
                                activa ? 'text-blue-600' : completada ? 'text-emerald-600' : 'text-gray-400'
                            }`}>{etapa.label}</span>
                        </div>
                        {idx < ETAPAS_PIPELINE.length - 1 && (
                            <div className={`h-0.5 flex-1 mb-3.5 ${idx < etapaActualIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface NovedadesPageProps {
    forcedTab?: 'solicitudes' | 'empleados';
    hideInternalTabs?: boolean;
    headerTitle?: string;
    headerDescription?: string;
    /** Cuando coincide con la pestaña activa del padre (p.ej. "novedades"), la sección de filtros del listado se contrae. */
    collapseFiltersSignal?: string;
}

const NovedadesPage: React.FC<NovedadesPageProps> = ({ forcedTab, hideInternalTabs = false, headerTitle, headerDescription, collapseFiltersSignal }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Empresa del usuario actual
    const empresaId: number | undefined = (() => {
        try {
            const raw = localStorage.getItem('empresaData') || localStorage.getItem('userData');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.empresa?.id ?? parsed?.empresas?.[0]?.id ?? undefined;
        } catch { return undefined; }
    })();

    const empresaNombre: string | undefined = (() => {
        try {
            const raw = localStorage.getItem('empresaData');
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.razon_social || parsed?.razonSocial || parsed?.nombre || undefined;
        } catch { return undefined; }
    })();

    // Jornadas laborales para el select de horas
    const [jornadasLaborales, setJornadasLaborales] = useState<{ id: number; nombre_jornada: string; horas_laborales: number }[]>([]);
    useEffect(() => {
        supabase.from('jornadas_laborales').select('id, nombre_jornada, horas_laborales').order('nombre_jornada')
            .then(({ data }) => { if (data) setJornadasLaborales(data); });
    }, []);

    const [motivosRenunciaSelect, setMotivosRenunciaSelect] = useState<{ id: number; nombre: string }[]>([]);
    useEffect(() => {
        supabase.from('gen_motivos_renuncia').select('id, nombre').eq('activo', true).order('nombre')
            .then(({ data }) => { if (data) setMotivosRenunciaSelect(data); });
    }, []);

    // Datos para selects del formulario
    const [centrosCostoSelect, setCentrosCostoSelect] = useState<{ id: number; nombre: string; codigo: string; area_negocio?: string; sucursal_ids?: number[]; area_negocio_ids?: number[]; proyecto_ids?: number[] }[]>([]);
    const [areasSelect, setAreasSelect] = useState<{ id: number; nombre: string }[]>([]);
    const [ciudadesSelect, setCiudadesSelect] = useState<{ id: number; nombre: string }[]>([]);
    const [cargosSelect, setCargosSelect] = useState<{ id: number; nombre: string }[]>([]);
    const [proyectosSelect, setProyectosSelect] = useState<{ id: number; nombre: string }[]>([]);
    const [sucursalesFormSelect, setSucursalesFormSelect] = useState<{ id: number; nombre: string }[]>([]);
    useEffect(() => {
        Promise.all([
            supabase.from('centros_costo').select('id, nombre, codigo, area_negocio').eq('activo', true).order('nombre'),
            supabase.from('centros_costo_sucursales').select('centro_costo_id, sucursal_id'),
            supabase.from('centros_costo_areas_negocios').select('centro_costo_id, area_negocio_id'),
            supabase.from('centros_costo_proyectos').select('centro_costo_id, proyecto_id'),
        ]).then(([centrosRes, sucRes, areaRes, proyRes]) => {
            const centros = centrosRes.data || [];
            const sucRows = sucRes.data || [];
            const areaRows = areaRes.data || [];
            const proyRows = proyRes.data || [];

            const sucMap = new Map<number, number[]>();
            const areaMap = new Map<number, number[]>();
            const proyMap = new Map<number, number[]>();

            sucRows.forEach((row: any) => {
                const list = sucMap.get(row.centro_costo_id) || [];
                list.push(row.sucursal_id);
                sucMap.set(row.centro_costo_id, list);
            });
            areaRows.forEach((row: any) => {
                const list = areaMap.get(row.centro_costo_id) || [];
                list.push(row.area_negocio_id);
                areaMap.set(row.centro_costo_id, list);
            });
            proyRows.forEach((row: any) => {
                const list = proyMap.get(row.centro_costo_id) || [];
                list.push(row.proyecto_id);
                proyMap.set(row.centro_costo_id, list);
            });

            setCentrosCostoSelect(centros.map((c: any) => ({
                ...c,
                sucursal_ids: sucMap.get(c.id) || [],
                area_negocio_ids: areaMap.get(c.id) || [],
                proyecto_ids: proyMap.get(c.id) || [],
            })));
        });
        supabase.from('gen_areas_negocios').select('id, nombre').eq('activo', true).order('nombre')
            .then(({ data }) => { if (data) setAreasSelect(data); });
        supabase.from('ciudades').select('id, nombre').order('nombre')
            .then(({ data }) => { if (data) setCiudadesSelect(data); });
        supabase.from('tipos_candidatos').select('id, nombre').eq('activo', true).order('nombre')
            .then(({ data }) => { if (data) setCargosSelect(data); });
        supabase.from('proyectos').select('id, nombre').eq('activo', true).order('nombre')
            .then(({ data }) => { if (data) setProyectosSelect(data); });
        supabase.from('gen_sucursales').select('id, nombre').eq('activo', true).order('nombre')
            .then(({ data }) => { if (data) setSucursalesFormSelect(data); });
    }, []);

    const { hasAction } = usePermissions();
    const { startLoading, stopLoading } = useLoading();
    const { addAction: addListadoNovedades } = useRegisterView('Gestión de Novedades', 'listado', 'Listado de Gestión de Novedades');

    useEffect(() => {
        addListadoNovedades('tab-novedades', 'Pestaña solicitudes');
        addListadoNovedades('tab-empleados', 'Pestaña empleados');
        addListadoNovedades('exportar-novedades', 'Exportar novedades');
        addListadoNovedades('crear-novedad', 'Crear novedad');
        addListadoNovedades('ver-detalle-novedad', 'Ver detalle de solicitud');
        addListadoNovedades('ver-timeline-novedad', 'Ver timeline de solicitud');
        addListadoNovedades('asignar-solicitud', 'Asignar analista');
        addListadoNovedades('cambiar-estado-novedad', 'Cambiar estado de solicitud');
        addListadoNovedades('cancelar-novedad', 'Cancelar solicitud');
    }, [addListadoNovedades]);

    const puedeVerMenuAccionesFila = useCallback((sol: NovedadSolicitud) => {
        if (hasAction(NOVEDADES_PERMISOS.VER_DETALLE)) return true;
        if (hasAction(NOVEDADES_PERMISOS.VER_TIMELINE)) return true;
        if (hasAction(NOVEDADES_PERMISOS.ASIGNAR_ANALISTA) && !sol.analista_id) return true;
        const transiciones = TRANSICIONES_VALIDAS[sol.estado || ''] || [];
        const puedeCambiar = hasAction(NOVEDADES_PERMISOS.CAMBIAR_ESTADO);
        const puedeCancelar = hasAction(NOVEDADES_PERMISOS.CANCELAR);
        return transiciones.some((est) =>
            est === ESTADOS_NOVEDAD.CANCELADA ? (puedeCancelar || puedeCambiar) : puedeCambiar
        );
    }, [hasAction]);

    const esAnalistaSeleccion = hasAction('rol_analista_seleccion');
    const currentUserId = useMemo(() => {
        try {
            const raw = localStorage.getItem('userData');
            return raw ? (JSON.parse(raw).id as number | null) : null;
        } catch { return null; }
    }, []);

    // Estado de filtros
    const [filtros, setFiltros] = useState<NovedadFiltros>({});
    const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
    const [kaptusPage, setKaptusPage] = useState(1);
    const KAPTUS_PAGE_SIZE = 20;
    const [filtroCargoEmp, setFiltroCargoEmp] = useState('');
    const [filtrosPanelAbierto, setFiltrosPanelAbierto] = useState(false);

    useEffect(() => {
        if (collapseFiltersSignal === 'novedades') {
            setFiltrosPanelAbierto(false);
        }
    }, [collapseFiltersSignal]);
    /** Búsqueda solo en nombre del empleado (primer nombre) dentro del listado de solicitudes. */
    const [busquedaNombreListaSolicitudes, setBusquedaNombreListaSolicitudes] = useState('');
    const [filtroJornada, setFiltroJornada] = useState('');

    const defaultTab = forcedTab || (hasAction(NOVEDADES_PERMISOS.TAB_SOLICITUDES) ? 'solicitudes' : hasAction(NOVEDADES_PERMISOS.TAB_EMPLEADOS) ? 'empleados' : 'solicitudes');

    // Empresas para el filtro
    const [empresasFiltro, setEmpresasFiltro] = useState<{ id: number; razon_social: string }[]>([]);
    useEffect(() => {
        supabase.from('empresas').select('id, razon_social').order('razon_social')
            .then(({ data }) => { if (data) setEmpresasFiltro(data); });
    }, []);

    // Analistas para el filtro
    const [analistasFilter, setAnalistasFilter] = useState<{ id: number; nombre: string }[]>([]);
    useEffect(() => {
        if (esAnalistaSeleccion && currentUserId) {
            // Analista de selección: solo se ve a sí mismo
            try {
                const raw = localStorage.getItem('userData');
                if (raw) {
                    const u = JSON.parse(raw);
                    setAnalistasFilter([{ id: u.id, nombre: `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.username }]);
                }
            } catch {}
            setFiltros(prev => ({ ...prev, analista_id: currentUserId }));
            return;
        }
        // Otros roles: todos los analistas de selección
        supabase
            .from('gen_usuario_roles')
            .select('usuario_id, gen_usuarios!inner(id, primer_nombre, primer_apellido, activo)')
            .eq('rol_id', 20)
            .then(({ data }) => {
                if (!data) return;
                const vistos = new Set<number>();
                const lista: { id: number; nombre: string }[] = [];
                data.forEach((row: any) => {
                    const u = row.gen_usuarios;
                    if (u && u.activo && !vistos.has(u.id)) {
                        vistos.add(u.id);
                        lista.push({ id: u.id, nombre: `${u.primer_nombre} ${u.primer_apellido}`.trim() });
                    }
                });
                setAnalistasFilter(lista.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            });
    }, [esAnalistaSeleccion, currentUserId]);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [prevTab, setPrevTab] = useState(defaultTab);

    useEffect(() => {
        if (forcedTab && activeTab !== 'nueva_novedad') {
            setActiveTab(forcedTab);
            setPrevTab(forcedTab);
        }
    }, [forcedTab, activeTab]);

    // Formulario de nueva solicitud
    const [selectedMotivo, setSelectedMotivo] = useState<NovedadMotivo | null>(null);
    const [selectedEmpleado, setSelectedEmpleado] = useState<NovedadEmpleado | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [observaciones, setObservaciones] = useState('');

    // Modal de detalle
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<NovedadSolicitud | null>(null);

    // Candidatos de la solicitud (visible cuando estado === EN_RECLUTAMIENTO)
    const [candidatosSolicitud, setCandidatosSolicitud] = useState<SolicitudCandidato[]>([]);
    const [candidatoForm, setCandidatoForm] = useState({ identificacion: '', nombre_completo: '', celular: '', correo: '' });
    const [editandoCandidatoId, setEditandoCandidatoId] = useState<number | null>(null);
    const [cargandoCandidatos, setCargandoCandidatos] = useState(false);

    useEffect(() => {
        if (!selectedSolicitud?.id || selectedSolicitud.estado !== ESTADOS_NOVEDAD.EN_RECLUTAMIENTO) {
            setCandidatosSolicitud([]);
            return;
        }
        setCargandoCandidatos(true);
        novedadesService.getCandidatosBySolicitud(selectedSolicitud.id).then(data => {
            setCandidatosSolicitud(data);
            setCargandoCandidatos(false);
        });
    }, [selectedSolicitud?.id, selectedSolicitud?.estado]);

    // Modal de timeline
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [timelineSolicitudId, setTimelineSolicitudId] = useState<number | null>(null);

    // Selección múltiple (vacaciones)
    const [selectedEmpleados, setSelectedEmpleados] = useState<number[]>([]);

    // Flags del motivo seleccionado
    const [adjuntoFiles, setAdjuntoFiles] = useState<File[]>([]);
    const [cedulaAprobador, setCedulaAprobador] = useState('');

    // Expanded rows
    const [sortFecha, setSortFecha] = useState<'asc' | 'desc'>('desc');
    const [sortEstado, setSortEstado] = useState<null | 'asc' | 'desc'>(null);
    const [sortMotivo, setSortMotivo] = useState<null | 'asc' | 'desc'>(null);
    const resolvedHeaderTitle = headerTitle || (forcedTab === 'empleados' ? 'Listado de Empleados' : 'Gestión de Novedades');
    const resolvedHeaderDescription = headerDescription || (forcedTab === 'empleados'
        ? 'Consulta y seguimiento de empleados relacionados con novedades'
        : 'Gestión integral de solicitudes de novedades');

    // ============================================================
    // QUERIES
    // ============================================================

    const { data: diasCongelamiento = 30 } = useQuery({
        queryKey: ['config-congelamiento'],
        queryFn: () => novedadesService.getCongelamientoConfig(),
        staleTime: 5 * 60_000,
    });

    const puedeCongelarSolicitud = (s: NovedadSolicitud): boolean => {
        const fecha = s.created_at;
        if (!fecha) return true;
        const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
        return dias <= diasCongelamiento;
    };

    const { data: motivos = [], isLoading: motivosLoading } = useQuery<NovedadMotivo[]>({
        queryKey: ['novedades-motivos', empresaId],
        queryFn: () => novedadesService.getMotivos(empresaId),
    });

    const { data: solicitudes = [], isLoading: solicitudesLoading, refetch: refetchSolicitudes } = useQuery<NovedadSolicitud[]>({
        queryKey: ['novedades-solicitudes', filtros],
        queryFn: () => novedadesService.getSolicitudes(filtros),
    });

    const { data: empleadosRaw = [], isLoading: empleadosLoading } = useQuery<NovedadEmpleado[]>({
        queryKey: ['novedades-empleados-kaptus'],
        queryFn: () => novedadesService.getEmpleadosKaptus({ all: true }),
    });

    const empleados = useMemo(() => {
        const seen = new Set<string | number>();
        return empleadosRaw.filter(emp => {
            const key = emp.numero_documento || emp.id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [empleadosRaw]);

    const { data: empleadosKaptusRaw = [], isLoading: kaptusLoading } = useQuery<NovedadEmpleado[]>({
        queryKey: ['empleados-kaptus', kaptusPage],
        queryFn: () => novedadesService.getEmpleadosKaptus({ page: kaptusPage, pageSize: KAPTUS_PAGE_SIZE }),
        enabled: activeTab === 'empleados',
    });

    const empleadosKaptus = useMemo(() => {
        if (!busquedaEmpleado) return empleadosKaptusRaw;
        const term = busquedaEmpleado.toLowerCase();
        return empleadosKaptusRaw.filter(emp =>
            emp.nombre?.toLowerCase().includes(term) ||
            emp.apellido?.toLowerCase().includes(term) ||
            emp.cargo?.toLowerCase().includes(term) ||
            emp.numero_documento?.includes(term)
        );
    }, [empleadosKaptusRaw, busquedaEmpleado]);

    const { data: sucursales = [] } = useQuery<string[]>({
        queryKey: ['novedades-sucursales'],
        queryFn: () => novedadesService.getSucursales(),
    });

    const { data: timeline = [] } = useQuery<NovedadLog[]>({
        queryKey: ['novedades-timeline', timelineSolicitudId],
        queryFn: () => timelineSolicitudId ? novedadesLogsService.getLogsBySolicitud(timelineSolicitudId) : Promise.resolve([]),
        enabled: !!timelineSolicitudId,
    });

    // Notificación automática al coordinador cuando una novedad supera el límite de días
    const notificacionEnviadaRef = useRef(false);
    useEffect(() => {
        if (!solicitudes.length || notificacionEnviadaRef.current) return;

        // Calcular días una sola vez por solicitud (map → filter)
        const ahora = Date.now();
        const vencidas = solicitudes
            .filter(s => (s.fecha_inicio_vacante || s.created_at) && !ESTADOS_FINALES.includes(s.estado || ''))
            .map(s => ({
                ...s,
                diasSinGestion: Math.floor((ahora - new Date((s.fecha_inicio_vacante || s.created_at)!).getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .filter(s => s.diasSinGestion >= DIAS_LIMITE_NOTIFICACION);

        if (!vencidas.length) return;
        notificacionEnviadaRef.current = true;

        (async () => {
            try {
                const { data: rolesCoord } = await supabase
                    .from('gen_roles')
                    .select('id')
                    .ilike('nombre', '%coordinador%');
                const rolIds = rolesCoord?.map((r: any) => r.id) ?? [];
                if (!rolIds.length) return;

                const { data: coordinadores } = await supabase
                    .from('gen_usuarios')
                    .select('email, primer_nombre, primer_apellido')
                    .in('rol_id', rolIds)
                    .eq('activo', true);

                if (!coordinadores?.length) return;

                const from = (import.meta as any).env?.VITE_GMAIL_USER || 'noreply@rhplus.co';
                const subject = `⚠️ Alerta: ${vencidas.length} novedad(es) superaron ${DIAS_LIMITE_NOTIFICACION} días sin gestión`;

                const filas = vencidas.map(s => {
                    const nombre = s.empleado
                        ? escapeHtml(`${s.empleado.nombre} ${s.empleado.apellido || ''}`.trim())
                        : `ID ${s.empleado_id}`;
                    return `<tr>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${s.id}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(s.motivo?.nombre || String(s.motivo_id))}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${nombre}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600">${s.diasSinGestion} días</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb">${s.estado || 'solicitada'}</td>
                    </tr>`;
                }).join('');

                // Enviar a todos los coordinadores en paralelo
                await Promise.all(coordinadores.map(coord => emailService.sendEmail({
                    to: coord.email,
                    from,
                    subject,
                    html: `
                        <div style="font-family:sans-serif;max-width:680px;margin:0 auto">
                            <h2 style="color:#b45309">⚠️ Novedades sin gestión — Alerta de tiempo</h2>
                            <p>Estimado/a <strong>${escapeHtml(coord.primer_nombre)} ${escapeHtml(coord.primer_apellido)}</strong>,</p>
                            <p>Las siguientes solicitudes llevan más de <strong>${DIAS_LIMITE_NOTIFICACION} días</strong> sin ser gestionadas:</p>
                            <table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
                                <thead>
                                    <tr style="background:#fef3c7">
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">#</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Motivo</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Empleado</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Días</th>
                                        <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>${filas}</tbody>
                            </table>
                            <p>Por favor gestione estas solicitudes a la brevedad.</p>
                        </div>
                    `,
                })));
            } catch (_) {
                // No bloquear la UI si el email falla
            }
        })();
    }, [solicitudes.length]);

    // ============================================================
    // MUTATIONS
    // ============================================================

    const createMutation = useMutation({
        mutationFn: (data: any) => novedadesService.createSolicitud(data),
        onSuccess: () => {
            toast.success('Solicitud de novedad creada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
            resetForm();
        },
        onError: () => toast.error('Error al crear la solicitud'),
    });

    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, estado, obs }: { id: number; estado: string; obs?: string }) =>
            novedadesService.cambiarEstado(id, estado, obs),
        onSuccess: () => {
            toast.success('Estado actualizado correctamente');
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
        },
        onError: (err: Error) => toast.error(err?.message || 'Error al cambiar el estado'),
    });

    const asignarAnalistaMutation = useMutation({
        mutationFn: async (sol: NovedadSolicitud) => {
            startLoading('Asignando analista...');
            const sucursalId = sol.empleado?.sucursal_id;
            const analistaAsignado = await analistaAsignacionService.asignarAnalistaSeleccionAutomatico(
                sol.empresa_id, sucursalId
            );
            if (!analistaAsignado) throw new Error('No se encontró analista de selección disponible');
            const { error } = await supabase
                .from('novedades_solicitudes')
                .update({ analista_id: analistaAsignado.analista_id })
                .eq('id', sol.id!);
            if (error) throw new Error(error.message);
            return analistaAsignado;
        },
        onSuccess: (data) => {
            stopLoading();
            toast.success(`Analista ${data.analista_nombre} asignado correctamente`);
            queryClient.invalidateQueries({ queryKey: ['novedades-solicitudes'] });
        },
        onError: (err: Error) => {
            stopLoading();
            toast.error(err?.message || 'Error al asignar analista');
        },
    });

    // ============================================================
    // HANDLERS
    // ============================================================

    const buildDefaultFormData = (motivo: NovedadMotivo | null) => {
        if (!motivo) return {};
        const fields = FORM_FIELDS_BY_MOTIVO[motivo.codigo] || [];
        const defaults: Record<string, any> = {};
        const today = new Date().toISOString().split('T')[0];
        for (const f of fields) {
            if (f.defaultToday && f.type === 'date') defaults[f.name] = today;
        }
        if (motivo.codigo === 'aumento_plaza') {
            defaults['negocio'] = empresaNombre || '';
        }
        return defaults;
    };

    const goToRegistro = () => {
        setPrevTab(activeTab);
        setSelectedMotivo(null);
        setSelectedEmpleado(null);
        setFormData({});
        setObservaciones('');
        setSelectedEmpleados([]);
        setAdjuntoFiles([]);
        setCedulaAprobador('');
        setActiveTab('nueva_novedad');
    };

    const resetForm = () => {
        setSelectedMotivo(null);
        setSelectedEmpleado(null);
        setFormData({});
        setObservaciones('');
        setSelectedEmpleados([]);
        setAdjuntoFiles([]);
        setCedulaAprobador('');
        setActiveTab(prevTab);
    };

    const handleSubmitForm = async () => {
        if (!selectedMotivo) {
            toast.error('Selecciona un motivo de novedad');
            return;
        }

        // Validar campos requeridos del formulario dinámico
        const fields = FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || [];
        for (const field of fields) {
            if (field.required && !formData[field.name] && field.type !== 'checkbox') {
                toast.error(`El campo "${field.label}" es requerido`);
                return;
            }
        }

        // Validación de vacaciones: mínimo 30 días
        if (selectedMotivo.codigo === 'vacaciones' && formData.fecha_inicio && formData.fecha_fin) {
            const inicio = new Date(formData.fecha_inicio);
            const fin = new Date(formData.fecha_fin);
            const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 30) {
                toast.error('Para vacaciones, debe haber mínimo 30 días entre las fechas');
                return;
            }
        }

        // Validar observación obligatoria
        if (selectedMotivo.requiere_observacion && !observaciones.trim()) {
            toast.error('Las observaciones son obligatorias para este motivo');
            return;
        }

        // Validar adjunto obligatorio
        if (selectedMotivo.adjunto_obligatorio && adjuntoFiles.length === 0) {
            toast.error('Debe adjuntar un documento obligatorio para este motivo');
            return;
        }

        // Cuando requiere comité se usa la cédula aprobador asignada automáticamente (quemada por ahora)

        // Para vacaciones con selección múltiple
        if (selectedMotivo.permite_seleccion_multiple && selectedEmpleados.length === 0 && !selectedEmpleado) {
            toast.error('Selecciona al menos un empleado');
            return;
        }

        // Para otros motivos, verificar que hay empleado seleccionado
        if (!selectedMotivo.permite_seleccion_multiple && selectedMotivo.codigo !== 'aumento_plaza' && !selectedEmpleado) {
            toast.error('Selecciona un empleado');
            return;
        }

        if (selectedMotivo.codigo === 'aumento_plaza' && formData.fecha_ingreso) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const ingreso = new Date(`${formData.fecha_ingreso}T00:00:00`);
            if (ingreso < hoy) {
                toast.error('La fecha de ingreso no puede ser anterior a la fecha actual');
                return;
            }
        }

        const datosForm = { ...formData };
        if (selectedMotivo.codigo === 'renuncias') {
            datosForm.fecha_renuncia = new Date().toISOString().split('T')[0];
        }
        const solicitudData = {
            motivo_id: selectedMotivo.id,
            empleado_id: selectedEmpleado?.id,
            empresa_id: selectedEmpleado?.empresa_id || filtros.empresa_id,
            datos_formulario: {
                ...datosForm,
                ...(adjuntoFiles.length > 0 ? {
                    adjunto_nombres: adjuntoFiles.map(file => file.name),
                    adjunto_tipos: adjuntoFiles.map(file => file.type),
                } : {}),
                ...(selectedMotivo.requiere_comite ? { requiere_aprobacion_comite: true } : {}),
            },
            observaciones,
            requiere_reemplazo: formData.requiere_reemplazo || formData.genera_reemplazo || false,
            empleados_ids: selectedMotivo.permite_seleccion_multiple ? selectedEmpleados : [],
            ...(selectedMotivo.codigo === 'aumento_plaza' && formData.sede_labor
                ? { sede_labor_id: parseInt(formData.sede_labor, 10) }
                : {}),
        };

        createMutation.mutate(solicitudData, {
            onSuccess: async (nuevaSolicitud) => {
                // Si requiere comité, buscar dinámicamente usuarios con permiso accion-aprobar-comite
                if (selectedMotivo.requiere_comite) {
                    try {
                        // 1. Roles que tienen el permiso en el módulo comité
                        // Se excluye el rol Administrador (id=1) porque tiene todos los permisos
                        // por defecto y no es un aprobador designado de comité.
                        // .filter con JSON.stringify porque selected_actions_codes es jsonb, no array nativo
                        const { data: rolesConPermiso } = await supabase
                            .from('gen_roles_modulos')
                            .select('rol_id')
                            .eq('modulo_id', MODULO_COMITE_ID)
                            .filter('selected_actions_codes', 'cs', JSON.stringify(['accion-aprobar-comite']))
                            .neq('rol_id', 1);

                        const roleIds = (rolesConPermiso || []).map((r: any) => r.rol_id);

                        let aprobadores: { email: string; primer_nombre: string; primer_apellido: string }[] = [];
                        if (roleIds.length > 0) {
                            // 2. Usuarios asignados a esos roles
                            const { data: usuariosConRol } = await supabase
                                .from('gen_usuario_roles')
                                .select('usuario_id')
                                .in('rol_id', roleIds);

                            const usuarioIds = (usuariosConRol || []).map((u: any) => u.usuario_id);

                            if (usuarioIds.length > 0) {
                                // 3. Datos de contacto de esos usuarios
                                // Se excluyen emails de sistema/placeholder (ej: @sistema.com)
                                const { data: usuarios } = await supabase
                                    .from('gen_usuarios')
                                    .select('email, primer_nombre, primer_apellido')
                                    .in('id', usuarioIds)
                                    .eq('activo', true)
                                    .not('email', 'is', null)
                                    .not('email', 'ilike', '%@sistema%');
                                aprobadores = usuarios || [];
                            }
                        }

                        if (aprobadores.length > 0) {
                            const empleadoNombre = selectedEmpleado
                                ? escapeHtml(`${selectedEmpleado.nombre} ${selectedEmpleado.apellido || ''}`.trim())
                                : 'Empleado';
                            for (const aprobador of aprobadores) {
                                await emailService.sendEmail({
                                    to: aprobador.email,
                                    from: (import.meta as any).env?.VITE_GMAIL_USER || 'noreply@rhplus.co',
                                    subject: `Solicitud de comité: ${selectedMotivo.nombre}`,
                                    html: `
                                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                                            <h2 style="color:#0e7490">Solicitud requiere su aprobación de comité</h2>
                                            <p>Estimado/a <strong>${escapeHtml(aprobador.primer_nombre)} ${escapeHtml(aprobador.primer_apellido)}</strong>,</p>
                                            <p>Se ha creado una solicitud de novedad que requiere su aprobación:</p>
                                            <table style="border-collapse:collapse;width:100%;margin:16px 0">
                                                <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Motivo</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(selectedMotivo.nombre)}</td></tr>
                                                <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Empleado</td><td style="padding:8px;border:1px solid #e5e7eb">${empleadoNombre}</td></tr>
                                                ${observaciones ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Observaciones</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(observaciones)}</td></tr>` : ''}
                                            </table>
                                            <p>Ingrese al sistema para <strong>aprobar o rechazar</strong> esta solicitud en el módulo de Comité de Aprobación.</p>
                                        </div>
                                    `,
                                });
                            }
                            toast.info(`Notificación enviada a ${aprobadores.length} aprobador(es) de comité`);
                        } else {
                            toast.warning('Solicitud creada, pero no se encontraron aprobadores con permiso de comité');
                        }
                    } catch (_) {
                        toast.warning('Solicitud creada, pero no se pudo enviar el correo al aprobador');
                    }
                }
            },
        });
    };

    const handleViewDetail = async (solicitud: NovedadSolicitud) => {
        const detail = await novedadesService.getSolicitudById(solicitud.id!);
        setSelectedSolicitud(detail || solicitud);
        setShowDetailModal(true);
    };

    const handleViewTimeline = (solicitudId: number) => {
        setTimelineSolicitudId(solicitudId);
        setShowTimelineModal(true);
    };

    const handleAgregarCandidatoNovedades = async () => {
        if (!selectedSolicitud?.id) return;
        if (!candidatoForm.identificacion.trim() || !candidatoForm.nombre_completo.trim()) {
            toast.error('Identificación y nombre completo son obligatorios');
            return;
        }
        if (editandoCandidatoId) {
            const result = await novedadesService.updateCandidato(editandoCandidatoId, {
                solicitud_id: selectedSolicitud.id,
                ...candidatoForm,
            });
            if (result) {
                setCandidatosSolicitud(prev => prev.map(c => c.id === editandoCandidatoId ? { ...c, ...candidatoForm } : c));
                toast.success('Candidato actualizado');
            } else toast.error('Error al actualizar candidato');
        } else {
            const result = await novedadesService.addCandidatoToSolicitud({
                solicitud_id: selectedSolicitud.id,
                ...candidatoForm,
            });
            if (result) {
                setCandidatosSolicitud(prev => [...prev, result]);
                toast.success('Candidato agregado');
            } else toast.error('Error al agregar candidato');
        }
        setCandidatoForm({ identificacion: '', nombre_completo: '', celular: '', correo: '' });
        setEditandoCandidatoId(null);
    };

    const handleEditarCandidatoNovedades = (c: SolicitudCandidato) => {
        setCandidatoForm({
            identificacion: c.identificacion,
            nombre_completo: c.nombre_completo,
            celular: c.celular || '',
            correo: c.correo || '',
        });
        setEditandoCandidatoId(c.id);
    };

    const handleEliminarCandidatoNovedades = async (id: number) => {
        const ok = await novedadesService.deleteCandidato(id);
        if (ok) {
            setCandidatosSolicitud(prev => prev.filter(c => c.id !== id));
            toast.success('Candidato eliminado');
        } else toast.error('Error al eliminar candidato');
    };

    const toggleEmpleadoSelection = (empId: number) => {
        setSelectedEmpleados(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        );
    };

    // ============================================================
    // ESTADÍSTICAS
    // ============================================================

    // Motivos que pertenecen al Módulo de Selección — se excluyen de esta vista
    const MOTIVOS_SELECCION = [
        'retiros',
        'cambio_centro_costo',
        'postulaciones_internas',
        'vacaciones',
        'renuncias',
        'licencias',
    ];

    // Base filtrada: solo motivos de Gestión de Novedades (excluye los de Selección)
    const solicitudesGestion = useMemo(() =>
        solicitudes.filter(s => !MOTIVOS_SELECCION.includes(s.motivo?.codigo ?? '')),
        [solicitudes],
    );

    const stats = useMemo(() => {
        const s: Record<string, number> = {};
        solicitudesGestion.forEach(sol => {
            s[sol.estado || 'solicitada'] = (s[sol.estado || 'solicitada'] || 0) + 1;
        });
        return s;
    }, [solicitudesGestion]);

    const chartMotivos = useMemo(() => {
        const m: Record<string, number> = {};
        solicitudesGestion.forEach(s => {
            const nombre = s.motivo?.nombre || 'Sin motivo';
            m[nombre] = (m[nombre] || 0) + 1;
        });
        return Object.entries(m)
            .map(([nombre, total]) => ({ nombre: nombre.length > 14 ? nombre.slice(0, 13) + '…' : nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 7);
    }, [solicitudesGestion]);

    // Filtros cliente: cargo y política de tiempo
    const cargosEmpleadoOpciones = useMemo(() => {
        const set = new Set<string>();
        solicitudesGestion.forEach(s => { if (s.empleado?.cargo) set.add(s.empleado.cargo); });
        return Array.from(set).sort();
    }, [solicitudesGestion]);

    const jornadaOpciones = useMemo(() => {
        const set = new Set<string>();
        solicitudesGestion.forEach(s => { if ((s.empleado as any)?.jornada) set.add((s.empleado as any).jornada); });
        ['Diurna', 'Nocturna', 'Mixta', 'Flexible'].forEach(j => set.add(j));
        return Array.from(set).sort();
    }, [solicitudesGestion]);

    const solicitudesMostradas = useMemo(() => {
        let result = solicitudesGestion;
        if (filtros.sucursal) result = result.filter(s => s.empleado?.sucursal?.nombre === filtros.sucursal);
        if (filtroCargoEmp) result = result.filter(s => s.empleado?.cargo === filtroCargoEmp);
        if (filtroJornada) result = result.filter(s => (s.empleado as any)?.jornada === filtroJornada);
        const bn = busquedaNombreListaSolicitudes.trim().toLowerCase();
        if (bn) {
            result = result.filter(s =>
                (s.empleado?.nombre || '').toLowerCase().includes(bn));
        }
        return result;
    }, [solicitudesGestion, filtros.sucursal, filtroCargoEmp, filtroJornada, busquedaNombreListaSolicitudes]);

    const cantidadFiltrosActivosLista = useMemo(() => {
        let n = 0;
        if (filtros.empresa_id) n++;
        if (filtros.motivo_id) n++;
        if (filtros.sucursal) n++;
        if (filtros.estado) n++;
        if (filtros.analista_id) n++;
        if (filtroCargoEmp) n++;
        if (filtroJornada) n++;
        if (busquedaNombreListaSolicitudes.trim()) n++;
        return n;
    }, [
        filtros.empresa_id,
        filtros.motivo_id,
        filtros.sucursal,
        filtros.estado,
        filtros.analista_id,
        filtroCargoEmp,
        filtroJornada,
        busquedaNombreListaSolicitudes,
    ]);

    const centroCostoSeleccionado = useMemo(
        () => centrosCostoSelect.find(c => String(c.id) === String(formData.centro_costo)),
        [centrosCostoSelect, formData.centro_costo],
    );
    const areasDisponiblesCentro = useMemo(() => {
        if (!centroCostoSeleccionado) return areasSelect;
        if (!centroCostoSeleccionado.area_negocio_ids?.length) return [];
        return areasSelect.filter(a => centroCostoSeleccionado.area_negocio_ids!.includes(a.id));
    }, [areasSelect, centroCostoSeleccionado]);
    const proyectosDisponiblesCentro = useMemo(() => {
        if (!centroCostoSeleccionado) return proyectosSelect;
        if (!centroCostoSeleccionado.proyecto_ids?.length) return [];
        return proyectosSelect.filter(p => centroCostoSeleccionado.proyecto_ids!.includes(p.id));
    }, [proyectosSelect, centroCostoSeleccionado]);
    const sucursalesDisponiblesCentro = useMemo(() => {
        if (!centroCostoSeleccionado) return sucursalesFormSelect;
        if (!centroCostoSeleccionado.sucursal_ids?.length) return [];
        return sucursalesFormSelect.filter(s => centroCostoSeleccionado.sucursal_ids!.includes(s.id));
    }, [sucursalesFormSelect, centroCostoSeleccionado]);

    const ESTADO_CHART_COLORS: Record<string, string> = {
        solicitada: '#38bdf8',
        en_proceso: '#fb923c',
        aprobado_comite: '#34d399',
        rechazada: '#f87171',
        congelada: '#a78bfa',
        ejecutada: '#6b7280',
        cancelada: '#d1d5db',
    };

    const chartEstados = useMemo(() =>
        Object.entries(stats)
            .filter(([, v]) => v > 0)
            .map(([estado, value]) => ({
                name: ESTADO_LABELS[estado] || estado,
                value,
                color: ESTADO_CHART_COLORS[estado] || '#94a3b8',
            })),
        [stats]
    );

    // ============================================================
    // RENDER
    // ============================================================

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="p-4 max-w-full mx-auto">
            {activeTab !== 'nueva_novedad' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-3 rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/25">
                                <ClipboardCheck className="h-7 w-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-cyan-800">
                                {resolvedHeaderTitle}
                            </h1>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                                {resolvedHeaderDescription}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {!hideInternalTabs && activeTab !== 'nueva_novedad' && (hasAction(NOVEDADES_PERMISOS.TAB_SOLICITUDES) || hasAction(NOVEDADES_PERMISOS.TAB_EMPLEADOS)) && (
                    <TabsList className={`grid w-full bg-cyan-100/60 p-1 rounded-lg ${hasAction(NOVEDADES_PERMISOS.TAB_SOLICITUDES) && hasAction(NOVEDADES_PERMISOS.TAB_EMPLEADOS) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {hasAction(NOVEDADES_PERMISOS.TAB_SOLICITUDES) && (
                            <TabsTrigger
                                value="solicitudes"
                                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                            >
                                Listado de Solicitudes
                            </TabsTrigger>
                        )}
                        {hasAction(NOVEDADES_PERMISOS.TAB_EMPLEADOS) && (
                            <TabsTrigger
                                value="empleados"
                                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                            >
                                Empleados
                            </TabsTrigger>
                        )}
                    </TabsList>
                )}

                {/* TAB: SOLICITUDES */}
                <TabsContent value="solicitudes" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">SOLICITUDES</span>
                                <Badge variant="secondary" className="ml-1">{solicitudesMostradas.length}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Can action={NOVEDADES_PERMISOS.EXPORTAR}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (!solicitudesMostradas.length) { toast.error('No hay datos para exportar'); return; }
                                            const dataToExport = solicitudesMostradas.map(s => ({
                                                ID: s.id,
                                                Empleado: s.empleado ? `${s.empleado.nombre} ${s.empleado.apellido || ''}`.trim() : 'N/A',
                                                Documento: s.empleado?.documento || 'N/A',
                                                Cargo: s.empleado?.cargo || 'N/A',
                                                Motivo: s.motivo?.nombre || 'N/A',
                                                Estado: ESTADO_LABELS[s.estado || 'solicitada'] || s.estado,
                                                'Inicio vacante': formatDate(s.fecha_inicio_vacante),
                                                'Fecha Solicitud': formatDate(s.created_at),
                                                Sucursal: s.empleado?.sucursal?.nombre || 'N/A',
                                                'Creado Por': s.creador ? `${s.creador.primer_nombre} ${s.creador.primer_apellido}`.trim() : 'Sistema',
                                                Observaciones: s.observaciones || '',
                                                'Requiere Reemplazo': s.requiere_reemplazo ? 'Sí' : 'No',
                                            }));
                                            import('@/utils/exportUtils').then(({ exportToExcel }) => {
                                                exportToExcel(dataToExport, `Solicitudes_Novedades_${new Date().toISOString().split('T')[0]}`, 'Solicitudes')
                                                    .then(() => toast.success('Exportación generada exitosamente'))
                                                    .catch(() => toast.error('Error al generar el archivo Excel'));
                                            }).catch(() => toast.error('Error al generar el archivo Excel'));
                                        }}
                                        className="h-9 gap-2 rounded-md border-emerald-200 bg-emerald-50 px-4 text-emerald-900 shadow-sm hover:bg-emerald-100 hover:text-emerald-950"
                                    >
                                        <Download className="h-4 w-4 text-emerald-700" />
                                        Exportar Excel
                                    </Button>
                                </Can>
                                <Can action={NOVEDADES_PERMISOS.CREAR}>
                                    <Button
                                        onClick={goToRegistro}
                                        size="sm"
                                        className="h-9 gap-2 rounded-md bg-cyan-600 px-4 font-medium text-white shadow-md hover:bg-cyan-700"
                                    >
                                        <Plus className="h-4 w-4 shrink-0" />
                                        Adicionar registro
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Filtros — plegables, búsqueda primero */}
                        <div className="border-b bg-gray-50">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-gray-100/70 transition-colors"
                                onClick={() => setFiltrosPanelAbierto(v => !v)}
                                aria-expanded={filtrosPanelAbierto}
                            >
                                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <Filter className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                                    Filtros
                                    {cantidadFiltrosActivosLista > 0 && (
                                        <span className="rounded-full bg-gray-200 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-gray-600">
                                            {cantidadFiltrosActivosLista}
                                        </span>
                                    )}
                                </span>
                                {filtrosPanelAbierto ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" aria-hidden />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" aria-hidden />
                                )}
                            </button>
                            {filtrosPanelAbierto && (
                                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                                        <div className="min-w-0 space-y-1">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Buscar nombre empleado</Label>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <Input
                                                    placeholder="Únicamente primer nombre..."
                                                    value={busquedaNombreListaSolicitudes}
                                                    onChange={e => setBusquedaNombreListaSolicitudes(e.target.value)}
                                                    className="h-7 pl-8 text-xs bg-white border-gray-200"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setFiltros({}); setBusquedaNombreListaSolicitudes(''); setFiltroCargoEmp(''); setFiltroJornada(''); }}
                                            className="h-7 w-full shrink-0 gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto"
                                        >
                                            <Filter className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                            Limpiar filtros
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Empresa</Label>
                                            <Select
                                                value={filtros.empresa_id?.toString() || 'all'}
                                                onValueChange={(v) => setFiltros(prev => ({ ...prev, empresa_id: v === 'all' ? undefined : parseInt(v) }))}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todas las empresas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas las empresas</SelectItem>
                                                    {empresasFiltro.map(e => (
                                                        <SelectItem key={e.id} value={e.id.toString()}>{e.razon_social}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Motivo</Label>
                                            <Select
                                                value={filtros.motivo_id?.toString() || 'all'}
                                                onValueChange={(v) => setFiltros(prev => ({ ...prev, motivo_id: v === 'all' ? undefined : parseInt(v) }))}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todos los motivos" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los motivos</SelectItem>
                                                    {motivos.map(m => (
                                                        <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Sucursal</Label>
                                            <Select
                                                value={filtros.sucursal || 'all'}
                                                onValueChange={(v) => setFiltros(prev => ({ ...prev, sucursal: v === 'all' ? undefined : v }))}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todas las sucursales" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas las sucursales</SelectItem>
                                                    {sucursales.map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Estado</Label>
                                            <Select
                                                value={filtros.estado || 'all'}
                                                onValueChange={(v) => setFiltros(prev => ({ ...prev, estado: v === 'all' ? undefined : v }))}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todos los estados" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los estados</SelectItem>
                                                    {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Analista</Label>
                                            <Select
                                                value={filtros.analista_id?.toString() || 'all'}
                                                onValueChange={(v) => setFiltros(prev => ({ ...prev, analista_id: v === 'all' ? undefined : parseInt(v) }))}
                                                disabled={esAnalistaSeleccion}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todos los analistas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {!esAnalistaSeleccion && <SelectItem value="all">Todos los analistas</SelectItem>}
                                                    {analistasFilter.map(a => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Cargo empleado</Label>
                                            <Select
                                                value={filtroCargoEmp || 'all'}
                                                onValueChange={(v) => setFiltroCargoEmp(v === 'all' ? '' : v)}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todos los cargos" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los cargos</SelectItem>
                                                    {cargosEmpleadoOpciones.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Jornada</Label>
                                            <Select
                                                value={filtroJornada || 'all'}
                                                onValueChange={(v) => setFiltroJornada(v === 'all' ? '' : v)}
                                            >
                                                <SelectTrigger className="h-7 w-full text-xs bg-white">
                                                    <SelectValue placeholder="Todas las jornadas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas las jornadas</SelectItem>
                                                    {jornadaOpciones.map(j => (
                                                        <SelectItem key={j} value={j}>{j}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            {solicitudesLoading ? (
                                <Table className="min-w-[960px] w-full text-xs">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                                Cargando solicitudes...
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            ) : solicitudesMostradas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <FileText className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600">No hay solicitudes</p>
                                    <p className="text-sm text-gray-400 mt-1">Crea una nueva novedad para comenzar</p>
                                    <Can action={NOVEDADES_PERMISOS.CREAR}>
                                        <Button
                                            size="sm"
                                            onClick={goToRegistro}
                                            className="mt-4 bg-teal-400 hover:bg-teal-500 text-white"
                                        >
                                            Crear primera solicitud
                                        </Button>
                                    </Can>
                                </div>
                            ) : (
                                <Table className="min-w-[960px] w-full text-xs">
                                    <TableHeader className="bg-cyan-50">
                                        <TableRow className="text-left font-semibold text-gray-700">
                                            <TableHead className="w-11 px-1 py-2" aria-label="Menú de acciones" />
                                            <TableHead className="px-3 py-3 w-14">ID</TableHead>
                                            <TableHead className="px-4 py-3 min-w-[240px] w-[28%]">Empleado</TableHead>
                                            <TableHead className="px-4 py-3 min-w-[180px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setSortMotivo(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null)}
                                                    className="flex flex-col gap-0 leading-tight hover:text-cyan-700 transition-colors text-left"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        Motivo
                                                        {sortMotivo === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-cyan-600" />}
                                                        {sortMotivo === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-cyan-600" />}
                                                        {sortMotivo === null && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
                                                    </span>
                                                    <span className="text-[10px] font-normal capitalize tracking-normal text-gray-500 whitespace-normal">
                                                        Inicio de vacante
                                                    </span>
                                                </button>
                                            </TableHead>
                                            <TableHead className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setSortEstado(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null)}
                                                    className="flex items-center gap-1 hover:text-cyan-700 transition-colors"
                                                >
                                                    Estado
                                                    {sortEstado === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-cyan-600" />}
                                                    {sortEstado === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-cyan-600" />}
                                                    {sortEstado === null && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
                                                </button>
                                            </TableHead>
                                            <TableHead
                                                className="px-4 py-3 cursor-pointer select-none whitespace-nowrap"
                                                onClick={() => setSortFecha(d => d === 'desc' ? 'asc' : 'desc')}
                                            >
                                                <span className="flex items-center gap-1">
                                                    Fecha / Sucursal
                                                    {sortFecha === 'desc'
                                                        ? <ArrowDown className="h-3 w-3" />
                                                        : <ArrowUp className="h-3 w-3" />
                                                    }
                                                </span>
                                            </TableHead>
                                            <TableHead className="px-4 py-3 whitespace-nowrap">Analista</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...solicitudesMostradas].sort((a, b) => {
                                            if (sortEstado) {
                                                const lA = ESTADO_LABELS[a.estado || ''] || a.estado || '';
                                                const lB = ESTADO_LABELS[b.estado || ''] || b.estado || '';
                                                const cmp = lA.localeCompare(lB, 'es');
                                                if (cmp !== 0) return sortEstado === 'asc' ? cmp : -cmp;
                                            }
                                            if (sortMotivo) {
                                                const mA = a.motivo?.nombre || '';
                                                const mB = b.motivo?.nombre || '';
                                                const cmp = mA.localeCompare(mB, 'es');
                                                if (cmp !== 0) return sortMotivo === 'asc' ? cmp : -cmp;
                                            }
                                            const ta = new Date(a.created_at || 0).getTime();
                                            const tb = new Date(b.created_at || 0).getTime();
                                            return sortFecha === 'desc' ? tb - ta : ta - tb;
                                        }).map(sol => {
                                            const rowTransitions = TRANSICIONES_VALIDAS[sol.estado || ''] || [];
                                            return (
                                                <TableRow key={sol.id} className="hover:bg-gray-50 border-b border-gray-100">
                                                    <TableCell className="w-11 px-1 py-2 align-middle text-center">
                                                        {puedeVerMenuAccionesFila(sol) ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Más acciones"
                                                                    className="h-8 w-8 shrink-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-56 max-h-[min(70vh,24rem)] overflow-y-auto">
                                                                {hasAction(NOVEDADES_PERMISOS.VER_DETALLE) && (
                                                                    sol.estado === ESTADOS_NOVEDAD.ENTREVISTA_CLIENTE ? (
                                                                        <DropdownMenuItem onClick={() => navigate('/novedades/entrevista', { state: { solicitudEntrevista: sol } })} className="cursor-pointer">
                                                                            <Users className="mr-2 h-4 w-4 text-purple-600" />
                                                                            Entrevistas
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem onClick={() => handleViewDetail(sol)} className="cursor-pointer">
                                                                            <Eye className="mr-2 h-4 w-4 text-cyan-600" />
                                                                            Ver detalle
                                                                        </DropdownMenuItem>
                                                                    )
                                                                )}
                                                                {hasAction(NOVEDADES_PERMISOS.VER_TIMELINE) && (
                                                                    <DropdownMenuItem onClick={() => handleViewTimeline(sol.id!)} className="cursor-pointer">
                                                                        <Clock className="mr-2 h-4 w-4 text-indigo-600" />
                                                                        Ver timeline
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {hasAction(NOVEDADES_PERMISOS.ASIGNAR_ANALISTA) && !sol.analista_id && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => asignarAnalistaMutation.mutate(sol)}
                                                                            disabled={asignarAnalistaMutation.isPending}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <UserPlus className="mr-2 h-4 w-4 text-teal-600" />
                                                                            Asignar Analista
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {(() => {
                                                                    const puedeCambiarEstado = hasAction(NOVEDADES_PERMISOS.CAMBIAR_ESTADO);
                                                                    const puedeCancelar = hasAction(NOVEDADES_PERMISOS.CANCELAR);
                                                                    const transicionesVisibles = rowTransitions.filter((est) => {
                                                                        if (est === ESTADOS_NOVEDAD.CANCELADA) return puedeCancelar || puedeCambiarEstado;
                                                                        return puedeCambiarEstado;
                                                                    });
                                                                    if (!transicionesVisibles.length) return null;
                                                                    return (
                                                                        <>
                                                                            <DropdownMenuSeparator />
                                                                            {transicionesVisibles.map(nextEstado => {
                                                                                const soloViernes = nextEstado === 'aprobado_comite' && !esViernes();
                                                                                const IconTrans = iconAccionCambioEstado(nextEstado);
                                                                                const destructive = nextEstado === ESTADOS_NOVEDAD.CANCELADA;
                                                                                return (
                                                                                    <DropdownMenuItem
                                                                                        key={nextEstado}
                                                                                        disabled={soloViernes || cambiarEstadoMutation.isPending || (nextEstado === ESTADOS_NOVEDAD.CONGELADA && !puedeCongelarSolicitud(sol))}
                                                                                        title={
                                                                                            soloViernes ? 'La aprobación solo está permitida los viernes'
                                                                                            : nextEstado === ESTADOS_NOVEDAD.CONGELADA && !puedeCongelarSolicitud(sol)
                                                                                                ? `No se puede congelar: han transcurrido más de ${diasCongelamiento} días desde la creación de la solicitud`
                                                                                            : undefined
                                                                                        }
                                                                                        onClick={() => cambiarEstadoMutation.mutate({ id: sol.id!, estado: nextEstado })}
                                                                                        className={destructive ? 'cursor-pointer text-red-600 focus:text-red-700' : 'cursor-pointer'}
                                                                                    >
                                                                                        <IconTrans className={`mr-2 h-4 w-4 shrink-0 ${destructive ? 'text-red-500' : 'text-gray-600'}`} />
                                                                                        {getLabelAccionCambioEstado(nextEstado)}
                                                                                    </DropdownMenuItem>
                                                                                );
                                                                            })}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-sm text-gray-900 font-mono whitespace-nowrap">#{sol.id}</TableCell>
                                                    <TableCell className="min-w-[240px] px-4 py-3 text-sm">
                                                        <p className="font-medium leading-snug text-gray-900">
                                                            {sol.empleado ? `${sol.empleado.nombre} ${sol.empleado.apellido || ''}`.trim() : '-'}
                                                        </p>
                                                        {sol.empleado?.cargo && (
                                                            <p className="mt-0.5 text-xs text-gray-500">{sol.empleado.cargo}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 align-top">
                                                        <div className="space-y-1">
                                                            <p className="text-sm leading-snug text-gray-900">
                                                                {sol.motivo?.nombre || '—'}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500">
                                                                Vacante desde: <span className="font-medium text-gray-700">{formatDate(sol.fecha_inicio_vacante)}</span>
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 whitespace-nowrap">
                                                        <Badge className={`text-xs font-semibold ${ESTADO_COLORS[sol.estado || 'solicitada']}`}>
                                                            {ESTADO_LABELS[sol.estado || 'solicitada']}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                        <p>{formatDate(sol.created_at)}</p>
                                                        {sol.empleado?.sucursal?.nombre && <p className="text-[11px] text-gray-400 mt-0.5 max-w-[130px] truncate" title={sol.empleado.sucursal.nombre}>{sol.empleado.sucursal.nombre}</p>}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                        {sol.analista
                                                            ? `${sol.analista.primer_nombre} ${sol.analista.primer_apellido}`.trim() || sol.analista.username
                                                            : <span className="text-gray-300 italic text-xs">Sin asignar</span>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* Stats + Gráficas */}
                    {solicitudesMostradas.length > 0 && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-5 divide-x divide-gray-100 bg-white border border-gray-100 rounded-xl overflow-hidden">
                                {[
                                    { label: 'Total', value: solicitudesMostradas.length, color: 'text-gray-900' },
                                    { label: 'Solicitadas', value: stats.solicitada || 0, color: 'text-sky-600' },
                                    { label: 'En proceso', value: stats.en_proceso || 0, color: 'text-amber-600' },
                                    { label: 'Aprobadas', value: stats.aprobado_comite || 0, color: 'text-emerald-600' },
                                    { label: 'Rechazadas', value: stats.rechazada || 0, color: 'text-rose-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="flex flex-col items-center justify-center py-5">
                                        <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                                        <span className="text-xs text-gray-400 mt-1">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Solicitudes por motivo</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={chartMotivos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px #0001' }} cursor={{ fill: '#f9fafb' }} />
                                            <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-xl p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Distribución por estado</p>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={chartEstados} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                                {chartEstados.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px #0001' }} />
                                            <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* TAB: NUEVA NOVEDAD */}
                <TabsContent value="nueva_novedad" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetForm}
                                    className="h-8 w-8 rounded-full hover:bg-cyan-100"
                                >
                                    <ArrowLeft className="h-5 w-5 text-cyan-700" />
                                </Button>
                                <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-cyan-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">NUEVA SOLICITUD DE NOVEDAD</span>
                            </div>
                        </div>

                        {/* Paso 1: Motivo — siempre visible */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo de Novedad *</Label>
                                    <Select
                                        value={selectedMotivo?.id?.toString() || ''}
                                        onValueChange={(v) => {
                                            const motivo = motivos.find(m => m.id === parseInt(v)) || null;
                                            setSelectedMotivo(motivo);
                                            setFormData(buildDefaultFormData(motivo));
                                            setSelectedEmpleado(null);
                                            setSelectedEmpleados([]);
                                            setObservaciones('');
                                            setAdjuntoFiles([]);
                                            setCedulaAprobador('');
                                        }}
                                    >
                                        <SelectTrigger className="mt-1.5 bg-white">
                                            <SelectValue placeholder="Seleccionar motivo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {motivos.map(m => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.nombre}
                                                    {m.requiere_comite && ' (Requiere Comité)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedMotivo?.requiere_comite && (
                                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Esta novedad requiere evaluación del comité
                                        </p>
                                    )}
                                </div>

                                {selectedMotivo && (
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {selectedMotivo.codigo === 'aumento_plaza'
                                                ? 'Vacante empleado'
                                                : selectedMotivo.permite_seleccion_multiple ? 'Empleados *' : 'Empleado *'}
                                        </Label>
                                        {selectedMotivo.codigo === 'aumento_plaza' ? (
                                            <div className="mt-1.5 h-10 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600">
                                                Vacante empleado
                                            </div>
                                        ) : selectedMotivo.permite_seleccion_multiple ? (
                                            <div className="mt-1.5 border rounded-md max-h-40 overflow-y-auto p-2 space-y-1 bg-white">
                                                {empleados.map(emp => (
                                                    <label key={emp.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                                        <Checkbox
                                                            checked={selectedEmpleados.includes(emp.id!)}
                                                            onCheckedChange={() => toggleEmpleadoSelection(emp.id!)}
                                                        />
                                                        {emp.nombre} {emp.apellido} — {emp.cargo || 'Sin cargo'}
                                                    </label>
                                                ))}
                                                {empleados.length === 0 && <p className="text-xs text-gray-400 py-2">No hay empleados disponibles</p>}
                                            </div>
                                        ) : (
                                            <SelectWithSearch
                                                value={selectedEmpleado?.id?.toString() || ''}
                                                onValueChange={(v) => {
                                                    const emp = empleados.find(e => e.id === parseInt(v));
                                                    setSelectedEmpleado(emp || null);

                                                    if (!emp) {
                                                        return;
                                                    }

                                                    if (selectedMotivo?.codigo === 'cambio_centro_costo') {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            sucursal_anterior: emp.sucursal_id ? String(emp.sucursal_id) : '',
                                                        }));
                                                    }

                                                    if (selectedMotivo?.codigo === 'retiros' || selectedMotivo?.codigo === 'retiro') {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tiempo_antiguedad: calcularAntiguedad(emp.fecha_ingreso),
                                                            tipo_contratacion: emp.duracion_contrato || '',
                                                        }));
                                                    }
                                                }}
                                                placeholder="Seleccionar empleado..."
                                                options={empleados.map(emp => ({
                                                    value: emp.id!.toString(),
                                                    label: `${emp.nombre} ${emp.apellido || ''} — ${emp.cargo || 'Sin cargo'}`,
                                                    searchText: `${emp.nombre} ${emp.apellido || ''} ${emp.cargo || ''} ${emp.numero_documento || ''}`,
                                                }))}
                                                maxItems={100}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paso 2: Formulario dinámico — solo cuando hay motivo + empleado */}
                        {selectedMotivo && (selectedMotivo.codigo === 'aumento_plaza' || selectedEmpleado || selectedEmpleados.length > 0) && (
                            <div className="p-5 space-y-4">
                                {/* Sección: Datos del motivo */}
                                {(FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || []).length > 0 && (
                                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white">
                                            <div className="w-1 h-5 rounded-full bg-cyan-500 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-gray-700 tracking-wide">
                                                Datos de {selectedMotivo.nombre}
                                            </span>
                                        </div>
                                        <div className="p-5 bg-gray-50/40">
                                            {(() => {
                                                const motFields = FORM_FIELDS_BY_MOTIVO[selectedMotivo.codigo] || [];
                                                const gridCols = motFields.some(f => (f.colStart ?? 1) >= 3) ? 3 : 2;
                                                return (
                                            <div className={`grid grid-cols-1 ${gridCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-x-8 gap-y-5 items-start`}>
                                                {motFields.map(field => (
                                                    <div key={field.name} style={{
                                                        ...(field.colSpan === 'full' ? { gridColumn: '1 / -1' } : field.colStart ? { gridColumnStart: field.colStart } : {}),
                                                        ...(field.rowStart ? { gridRowStart: field.rowStart } : {}),
                                                        ...(field.rowSpan ? { gridRowEnd: `span 2` } : {}),
                                                    }} className={[
                                                        'space-y-1.5',
                                                        field.rowSpan ? 'flex flex-col' : '',
                                                        !field.rowSpan && field.type === 'textarea' && !field.colStart && field.colSpan !== 'full' ? 'md:col-span-2' : '',
                                                    ].join(' ').trim()}>
                                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                            {field.label} {field.required && <span className="text-cyan-500">*</span>}
                                                        </Label>
                                                        {field.type === 'text' && (() => {
                                                            const isReadOnlyText =
                                                                (field.name === 'area' && !!formData['centro_costo']) ||
                                                                (field.name === 'negocio' && selectedMotivo?.codigo === 'aumento_plaza') ||
                                                                field.name === 'tiempo_antiguedad' ||
                                                                field.name === 'tipo_contratacion';
                                                            return (
                                                                <Input
                                                                    value={formData[field.name] || ''}
                                                                    onChange={e => !isReadOnlyText && setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                    readOnly={isReadOnlyText}
                                                                    className={`border-gray-200 h-9 text-sm ${
                                                                        isReadOnlyText
                                                                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                                                                            : 'bg-white focus:border-cyan-400 focus:ring-cyan-100'
                                                                    }`}
                                                                    placeholder={
                                                                        field.name === 'area' && !formData['centro_costo']
                                                                            ? 'Se autocompleta al elegir centro de costo'
                                                                            : field.label
                                                                    }
                                                                />
                                                            );
                                                        })()}
                                                        {field.type === 'number' && (
                                                            CURRENCY_FIELDS.has(field.name) ? (
                                                                <CurrencyInput
                                                                    key={field.name}
                                                                    value={formData[field.name] || ''}
                                                                    onChange={raw => setFormData(prev => ({ ...prev, [field.name]: raw }))}
                                                                    className="bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100 h-9 text-sm"
                                                                />
                                                            ) : (
                                                                <Input
                                                                    type="number"
                                                                    value={formData[field.name] || ''}
                                                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                    onKeyDown={e => { if (!/[\d\b\t]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                                                                    className="bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100 h-9 text-sm"
                                                                    placeholder="0"
                                                                    min="0"
                                                                />
                                                            )
                                                        )}
                                                        {field.type === 'date' && (
                                                            <Input
                                                                type="date"
                                                                value={formData[field.name] || ''}
                                                                onChange={e => !field.defaultToday && setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className={`h-9 text-sm border-gray-200 focus:border-cyan-400 focus:ring-cyan-100 ${field.defaultToday ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                                                readOnly={field.defaultToday}
                                                                min={field.minToday ? new Date().toISOString().split('T')[0] : undefined}
                                                            />
                                                        )}
                                                        {field.type === 'textarea' && (
                                                            <Textarea
                                                                value={formData[field.name] || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                className={`bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100 text-sm resize-none ${field.rowSpan ? 'flex-1 min-h-[100px]' : ''}`}
                                                                rows={field.rowSpan ? undefined : 3}
                                                                placeholder={field.label}
                                                            />
                                                        )}
                                                        {field.type === 'motivo-renuncia-select' && (
                                                            <Select
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar motivo de renuncia..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {motivosRenunciaSelect.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin motivos registrados</SelectItem>
                                                                        : motivosRenunciaSelect.map(m => (
                                                                            <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'select' && (
                                                            <Select
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(field.options || []).map(opt => (
                                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'jornada-select' && (() => {
                                                            const jornadasVisibles = jornadasLaborales;
                                                            return (
                                                            <Select
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar jornada..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {jornadasVisibles.length === 0 ? (
                                                                        <SelectItem value="__none__" disabled>Sin jornadas registradas</SelectItem>
                                                                    ) : jornadasVisibles.map(j => (
                                                                        <SelectItem key={j.id} value={String(j.id)}>
                                                                            {j.nombre_jornada} — {j.horas_laborales}h
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            );
                                                        })()}
                                                        {field.type === 'centro-costo-select' && (
                                                            <SelectWithSearch
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => {
                                                                    const cc = centrosCostoSelect.find(c => String(c.id) === v);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        [field.name]: v,
                                                                        area: cc?.area_negocio_ids?.length === 1 ? String(cc.area_negocio_ids[0]) : '',
                                                                        proyecto: '',
                                                                        sucursal: '',
                                                                    }));
                                                                }}
                                                                placeholder="Seleccionar centro de costo..."
                                                                emptyText="Sin centros registrados"
                                                                className="h-9 text-sm border-gray-200"
                                                                options={centrosCostoSelect.map(c => ({
                                                                    value: String(c.id),
                                                                    label: `${c.codigo} — ${c.nombre}`,
                                                                    searchText: `${c.codigo} ${c.nombre}`,
                                                                }))}
                                                            />
                                                        )}
                                                        {field.type === 'area-select' && (
                                                            <Select value={formData[field.name] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}>
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar área..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {areasDisponiblesCentro.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin áreas registradas</SelectItem>
                                                                        : areasDisponiblesCentro.map(a => (
                                                                            <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'ciudad-select' && (
                                                            <SelectWithSearch
                                                                value={formData[field.name] || ''}
                                                                onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                                                                placeholder="Seleccionar ciudad..."
                                                                emptyText="Sin ciudades registradas"
                                                                className="h-9 text-sm border-gray-200"
                                                                options={ciudadesSelect.map(c => ({
                                                                    value: String(c.id),
                                                                    label: c.nombre,
                                                                }))}
                                                            />
                                                        )}
                                                        {field.type === 'duracion-auto' && (() => {
                                                            const fi = formData['fecha_inicio'] ? new Date(formData['fecha_inicio']) : null;
                                                            const ff = formData['fecha_fin'] ? new Date(formData['fecha_fin']) : null;
                                                            const dias = fi && ff ? Math.max(0, Math.round((ff.getTime() - fi.getTime()) / 86400000) + 1) : null;
                                                            if (dias !== null && formData['duracion'] !== String(dias)) {
                                                                setTimeout(() => setFormData(prev => ({ ...prev, duracion: String(dias) })), 0);
                                                            }
                                                            return (
                                                                <div className="flex items-center h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                                                                    {dias !== null ? <><span className="font-semibold text-cyan-700">{dias}</span>&nbsp;día{dias !== 1 ? 's' : ''}</> : <span className="text-gray-400 italic">Complete fechas de inicio y fin</span>}
                                                                </div>
                                                            );
                                                        })()}
                                                        {field.type === 'cargo-select' && (
                                                            <Select value={formData[field.name] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}>
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar cargo..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {cargosSelect.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin cargos registrados</SelectItem>
                                                                        : cargosSelect.map(c => (
                                                                            <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'proyecto-select' && (
                                                            <Select value={formData[field.name] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}>
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar proyecto..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {proyectosDisponiblesCentro.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin proyectos registrados</SelectItem>
                                                                        : proyectosDisponiblesCentro.map(p => (
                                                                            <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'sucursal-select' && (
                                                            <Select value={formData[field.name] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}>
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar sucursal..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {sucursalesDisponiblesCentro.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin sucursales registradas</SelectItem>
                                                                        : sucursalesDisponiblesCentro.map(s => (
                                                                            <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'sede-labor-select' && (
                                                            <Select value={formData[field.name] || ''} onValueChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}>
                                                                <SelectTrigger className="h-9 text-sm bg-white border-gray-200 focus:border-cyan-400 focus:ring-cyan-100">
                                                                    <SelectValue placeholder="Seleccionar sede labor..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {sucursalesFormSelect.length === 0
                                                                        ? <SelectItem value="__none__" disabled>Sin sedes registradas</SelectItem>
                                                                        : sucursalesFormSelect.map(s => (
                                                                            <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'sucursal-anterior-select' && (
                                                            <Select value={formData[field.name] || ''} disabled>
                                                                <SelectTrigger className="h-9 text-sm bg-gray-50 border-gray-200 text-gray-500">
                                                                    <SelectValue placeholder="Sucursal actual del empleado" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {sucursalesFormSelect.map(s => (
                                                                        <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {field.type === 'checkbox' && (
                                                            <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                                                                <Checkbox
                                                                    checked={!!formData[field.name]}
                                                                    onCheckedChange={checked => setFormData(prev => ({ ...prev, [field.name]: checked }))}
                                                                    className="border-gray-300 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                                                />
                                                                <span className="text-sm text-gray-600">{field.label}</span>
                                                            </div>
                                                        )}
                                                        {field.type === 'file' && (
                                                            <div className="flex flex-col gap-2">
                                                                <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 hover:border-cyan-400 rounded-lg px-3 py-2.5 transition-colors bg-white hover:bg-cyan-50/40">
                                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                                    <span className="text-xs text-gray-500">Seleccionar {field.multiple ? 'archivos' : 'archivo'}</span>
                                                                    <Input
                                                                        type="file"
                                                                        multiple
                                                                        className="hidden"
                                                                        onChange={e => {
                                                                            const files = Array.from(e.target.files || []).map(f => f.name);
                                                                            if (files.length) setFormData(prev => ({
                                                                                ...prev,
                                                                                [field.name]: [...(Array.isArray(prev[field.name]) ? prev[field.name] : []), ...files],
                                                                            }));
                                                                        }}
                                                                    />
                                                                </label>
                                                                {Array.isArray(formData[field.name]) && (formData[field.name] as string[]).length > 0 && (
                                                                    <div className="border border-gray-100 rounded-lg bg-white divide-y divide-gray-50">
                                                                        {(formData[field.name] as string[]).map((name, i) => (
                                                                            <div key={i} className="flex items-center justify-between px-3 py-1.5 gap-2">
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <FileText className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                                                                                    <span className="text-xs text-gray-600 truncate">{name}</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setFormData(prev => ({
                                                                                        ...prev,
                                                                                        [field.name]: (prev[field.name] as string[]).filter((_, j) => j !== i),
                                                                                    }))}
                                                                                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-base leading-none"
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {field.helperText && (
                                                            <p className="text-xs text-gray-400 mt-1">{field.helperText}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Observaciones */}
                                {selectedMotivo.requiere_observacion && (
                                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white">
                                            <div className="w-1 h-5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-gray-700 tracking-wide">
                                                Observaciones <span className="text-cyan-500 text-xs">*</span>
                                            </span>
                                        </div>
                                        <div className="p-5 bg-gray-50/40">
                                            <Textarea
                                                value={observaciones}
                                                onChange={e => setObservaciones(e.target.value)}
                                                className="bg-white text-sm resize-none border-gray-200 focus:ring-cyan-100 focus:border-amber-400 border-amber-200"
                                                placeholder="Observaciones obligatorias para este motivo..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Adjunto */}
                                {selectedMotivo.requiere_adjunto && (
                                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white">
                                            <div className="w-1 h-5 rounded-full bg-violet-400 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-gray-700 tracking-wide">
                                                Documento adjunto{' '}
                                                {selectedMotivo.adjunto_obligatorio
                                                    ? <span className="text-cyan-500 text-xs">* obligatorio</span>
                                                    : <span className="text-gray-400 text-xs font-normal">(opcional)</span>}
                                            </span>
                                        </div>
                                        <div className="p-5 bg-gray-50/40 flex flex-col gap-2">
                                            <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 hover:border-cyan-400 rounded-lg px-3 py-3 transition-colors bg-white hover:bg-cyan-50/40">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <span className="text-xs text-gray-500">Seleccionar archivos</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={e => {
                                                        const nuevos = Array.from(e.target.files || []);
                                                        if (nuevos.length) setAdjuntoFiles(prev => [...prev, ...nuevos]);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                            {adjuntoFiles.length > 0 && (
                                                <div className="border border-gray-100 rounded-lg bg-white divide-y divide-gray-50">
                                                    {adjuntoFiles.map((file, idx) => (
                                                        <div key={`${file.name}-${idx}`} className="flex items-center justify-between px-3 py-1.5 gap-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <FileText className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                                                                <span className="text-xs text-gray-600 truncate">{file.name}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAdjuntoFiles(prev => prev.filter((_, j) => j !== idx))}
                                                                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 text-base leading-none"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Sección: Comité */}
                                {selectedMotivo.requiere_comite && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 overflow-hidden">
                                        <div className="bg-amber-100/60 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                                Aprobación de Comité
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <p className="text-sm text-amber-700">
                                                Esta solicitud requiere aprobación de comité. Al guardar, se notificará automáticamente por correo al aprobador designado para que gestione su aprobación. El tiempo de respuesta es de 8 días hábiles.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Botones */}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                    <Button variant="outline" onClick={resetForm}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSubmitForm}
                                        disabled={createMutation.isPending || !selectedMotivo}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                    >
                                        {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {selectedMotivo?.requiere_comite ? 'Enviar a Comité' : 'Guardar'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* TAB: EMPLEADOS */}
                <TabsContent value="empleados" className="mt-6">
                    <div className="bg-white rounded-lg border">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center">
                                    <Users className="w-5 h-5 text-violet-600" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">EMPLEADOS</span>
                                <Badge variant="secondary" className="ml-1">{empleadosKaptus.length}</Badge>
                            </div>
                        </div>

                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
                                <div className="relative w-[220px]">
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    <Input
                                        placeholder="Buscar por nombre o cargo..."
                                        value={busquedaEmpleado}
                                        onChange={e => { setBusquedaEmpleado(e.target.value); setKaptusPage(1); }}
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => { setBusquedaEmpleado(''); setKaptusPage(1); }}
                                    className="h-8 px-2 text-xs flex items-center gap-1.5"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-sm">
                            {kaptusLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <span className="text-sm text-gray-500">Cargando empleados...</span>
                                </div>
                            ) : empleadosKaptus.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-gray-50 mb-4">
                                        <Users className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600">No hay empleados registrados</p>
                                    <p className="text-sm text-gray-400 mt-1">Los empleados aparecerán aquí cuando se registren</p>
                                </div>
                            ) : (
                                <Table className="min-w-[800px] w-full text-xs">
                                    <TableHeader className="bg-cyan-50">
                                        <TableRow className="text-left font-semibold text-gray-700">
                                            <TableHead className="px-4 py-3">Nombre</TableHead>
                                            <TableHead className="px-4 py-3">Documento</TableHead>
                                            <TableHead className="px-4 py-3">Cargo</TableHead>
                                            <TableHead className="px-4 py-3">Empresa</TableHead>
                                            <TableHead className="px-4 py-3">Fecha Ingreso</TableHead>
                                            <TableHead className="px-4 py-3">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {empleadosKaptus.map(emp => (
                                            <TableRow key={emp.numero_documento} className="hover:bg-gray-50">
                                                <TableCell className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                    {emp.nombre} {emp.apellido || ''}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-500">{emp.numero_documento || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-600">{emp.cargo || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-600">{emp.empresa?.razon_social || '-'}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-500">{formatDate(emp.fecha_ingreso)}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge variant="default" className="bg-brand-lime/10 text-brand-lime border-brand-lime/20">
                                                        {emp.estado || 'Activo'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
                            <span>Página {kaptusPage}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={kaptusPage === 1 || kaptusLoading}
                                    onClick={() => setKaptusPage(p => Math.max(1, p - 1))}
                                    className="h-7 px-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={empleadosKaptusRaw.length < KAPTUS_PAGE_SIZE || kaptusLoading}
                                    onClick={() => setKaptusPage(p => p + 1)}
                                    className="h-7 px-2"
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

        </Tabs>

            {/* ================================================================ */}
            {/* MODAL: Detalle de Solicitud */}
            {/* ================================================================ */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { setShowDetailModal(open); if (!open) { setCandidatoForm({ identificacion: '', nombre_completo: '', celular: '', correo: '' }); setEditandoCandidatoId(null); } }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                                <Eye className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                                <span className="text-base">Solicitud #{selectedSolicitud?.id} — {selectedSolicitud?.motivo?.nombre}</span>
                                <p className="text-[11px] font-normal text-gray-500 mt-0">{selectedSolicitud?.empresa?.razon_social} · {selectedSolicitud?.empleado?.cargo}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSolicitud && (
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                            <div className="space-y-3 p-1">
                                {/* Stepper de etapas */}
                                <EtapaStepper estadoActual={selectedSolicitud.estado || ''} />

                                <Separator />

                                {/* Info principal compacta */}
                                <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                                    <div className="col-span-2 min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Empleado</p>
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                            {selectedSolicitud.empleado ? `${selectedSolicitud.empleado.nombre} ${selectedSolicitud.empleado.apellido || ''}` : '-'}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Estado</p>
                                        <Badge className={`text-[10px] px-1.5 py-0 ${ESTADO_COLORS[selectedSolicitud.estado || 'solicitada']}`}>
                                            {ESTADO_LABELS[selectedSolicitud.estado || 'solicitada']}
                                        </Badge>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Motivo</p>
                                        <p className="text-xs text-gray-700 truncate">{selectedSolicitud.motivo?.nombre || '-'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Sucursal</p>
                                        <p className="text-xs text-gray-700 truncate">{selectedSolicitud.empleado?.sucursal?.nombre || '-'}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Fecha creación</p>
                                        <p className="text-xs text-gray-700">{formatDate(selectedSolicitud.created_at)}</p>
                                    </div>
                                    {selectedSolicitud.empleado?.cargo && (
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Cargo</p>
                                            <p className="text-xs text-gray-700 truncate">{selectedSolicitud.empleado.cargo}</p>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Reemplazo</p>
                                        <p className="text-xs text-gray-700">{selectedSolicitud.requiere_reemplazo ? 'Sí' : 'No'}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Tabs: Candidatos (si EN_RECLUTAMIENTO) + Información */}
                                <Tabs defaultValue="candidatos">
                                    <TabsList>
                                        <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
                                        <TabsTrigger value="informacion">Información</TabsTrigger>
                                    </TabsList>

                                    {/* Tab Candidatos */}
                                    <TabsContent value="candidatos" className="pt-2">
                                            <div className="space-y-2">
                                                {/* Fila campos + botón */}
                                                <div className="flex items-end gap-1.5">
                                                    <div className="w-28 shrink-0">
                                                        <Label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Identificación *</Label>
                                                        <Input value={candidatoForm.identificacion} onChange={e => setCandidatoForm(f => ({ ...f, identificacion: e.target.value }))} className="h-7 text-xs" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Nombre completo *</Label>
                                                        <Input value={candidatoForm.nombre_completo} onChange={e => setCandidatoForm(f => ({ ...f, nombre_completo: e.target.value }))} className="h-7 text-xs" />
                                                    </div>
                                                    <div className="w-28 shrink-0">
                                                        <Label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Celular</Label>
                                                        <Input value={candidatoForm.celular} onChange={e => setCandidatoForm(f => ({ ...f, celular: e.target.value }))} className="h-7 text-xs" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Correo</Label>
                                                        <Input value={candidatoForm.correo} onChange={e => setCandidatoForm(f => ({ ...f, correo: e.target.value }))} className="h-7 text-xs" />
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {editandoCandidatoId && (
                                                            <Button variant="outline" size="icon" className="h-7 w-7 border-gray-300 text-gray-500 hover:bg-gray-100" onClick={() => { setCandidatoForm({ identificacion: '', nombre_completo: '', celular: '', correo: '' }); setEditandoCandidatoId(null); }} title="Cancelar edición">
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button size="icon" className="h-7 w-7 bg-cyan-600 hover:bg-cyan-700 shadow-sm" onClick={handleAgregarCandidatoNovedades} title={editandoCandidatoId ? 'Guardar cambios' : 'Agregar candidato'}>
                                                            {editandoCandidatoId
                                                                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                : <UserPlus className="w-3.5 h-3.5" />
                                                            }
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Tabla */}
                                                <div className="border rounded-md overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-cyan-50">
                                                            <tr>
                                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600">Identificación</th>
                                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600">Nombre</th>
                                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600">Celular</th>
                                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600">Correo</th>
                                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600">Estado</th>
                                                                <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-14">Docs</th>
                                                                <th className="px-2 py-1.5 text-center font-medium text-gray-600 w-16">Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {cargandoCandidatos ? (
                                                                <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400"><Loader2 className="inline animate-spin h-3 w-3 mr-1" /> Cargando...</td></tr>
                                                            ) : candidatosSolicitud.length === 0 ? (
                                                                <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400">No hay candidatos registrados</td></tr>
                                                            ) : candidatosSolicitud.map(c => (
                                                                <tr key={c.id} className="hover:bg-gray-50">
                                                                    <td className="px-2 py-1.5 font-mono">{c.identificacion}</td>
                                                                    <td className="px-2 py-1.5 font-medium">{c.nombre_completo}</td>
                                                                    <td className="px-2 py-1.5 text-gray-500">{c.celular || '—'}</td>
                                                                    <td className="px-2 py-1.5 text-gray-500">{c.correo || '—'}</td>
                                                                    <td className="px-2 py-1.5">
                                                                        {(() => {
                                                                            const est = c.estado || 'activo';
                                                                            const cfg: Record<string, string> = {
                                                                                activo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                                                                entrevista: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                                                                                seleccionado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                                                                descartado: 'bg-red-100 text-red-800 border-red-200',
                                                                                en_espera: 'bg-amber-100 text-amber-800 border-amber-200',
                                                                            };
                                                                            const labels: Record<string, string> = {
                                                                                activo: 'Activo', entrevista: 'Entrevista',
                                                                                seleccionado: 'Seleccionado', descartado: 'Descartado', en_espera: 'En Espera',
                                                                            };
                                                                            return (
                                                                                <Badge className={`text-[10px] font-semibold border ${cfg[est] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                                                    {labels[est] || est}
                                                                                </Badge>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-center">
                                                                        <button type="button" className="inline-flex items-center justify-center rounded p-0.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors" title="Adjuntar documento">
                                                                            <Upload className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-center">
                                                                        <div className="flex justify-center gap-0.5">
                                                                            <button type="button" onClick={() => handleEditarCandidatoNovedades(c)} className="rounded p-0.5 text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 transition-colors" title="Editar">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                            </button>
                                                                            <button type="button" onClick={() => handleEliminarCandidatoNovedades(c.id)} className="rounded p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors" title="Eliminar">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </TabsContent>

                                    {/* Tab Información */}
                                    <TabsContent value="informacion" className="pt-2 space-y-3">
                                        {selectedSolicitud.datos_formulario && Object.keys(selectedSolicitud.datos_formulario).length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Datos del Formulario</p>
                                                <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                                                    {Object.entries(selectedSolicitud.datos_formulario).map(([key, value]) => (
                                                        <div key={key} className="min-w-0">
                                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide capitalize">{key.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-gray-700 truncate">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value || '-')}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedSolicitud.observaciones && (
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Observaciones</p>
                                                <p className="text-xs text-gray-700 leading-relaxed">{selectedSolicitud.observaciones}</p>
                                            </div>
                                        )}
                                        {!selectedSolicitud.datos_formulario && !selectedSolicitud.observaciones && (
                                            <p className="text-xs text-gray-400 text-center py-4">Sin información adicional</p>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================================================================ */}
            {/* MODAL: Timeline */}
            {/* ================================================================ */}
            <Dialog open={showTimelineModal} onOpenChange={(open) => { setShowTimelineModal(open); if (!open) setTimelineSolicitudId(null); }}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <span className="text-lg">Timeline</span>
                                <p className="text-xs font-normal text-gray-500 mt-0.5">Historial de solicitud #{timelineSolicitudId}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-0">
                        {timeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="p-3 rounded-full bg-gray-50 mb-3">
                                    <Clock className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">No hay registros en el timeline</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-4">
                                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-gray-200"></div>
                                {timeline.map((log, index) => (
                                    <div key={log.id || index} className="relative">
                                        <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow ${index === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gray-300'}`}></div>
                                        <div className={`rounded-lg p-3 ${index === 0 ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">{log.accion?.replace(/_/g, ' ')}</span>
                                                <span className="text-xs text-gray-400">
                                                    {log.fecha_accion ? new Date(log.fecha_accion).toLocaleString('es-CO') : '-'}
                                                </span>
                                            </div>
                                            {log.estado_anterior && log.estado_nuevo && (
                                                <div className="flex items-center gap-2 mt-1 text-xs">
                                                    <Badge variant="outline" className="text-[10px]">{ESTADO_LABELS[log.estado_anterior] || log.estado_anterior}</Badge>
                                                    <span>→</span>
                                                    <Badge className={`text-[10px] ${ESTADO_COLORS[log.estado_nuevo]}`}>{ESTADO_LABELS[log.estado_nuevo] || log.estado_nuevo}</Badge>
                                                </div>
                                            )}
                                            {log.observacion && <p className="text-xs text-gray-500 mt-1">{log.observacion}</p>}
                                            {log.usuario && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Por: {log.usuario.primer_nombre} {log.usuario.primer_apellido}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NovedadesPage;
