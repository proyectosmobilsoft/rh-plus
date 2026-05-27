/** Códigos de permiso para Gestión de Novedades (listado y acciones). */
export const NOVEDADES_PERMISOS = {
  TAB_SOLICITUDES: 'accion-tab-novedades',
  TAB_EMPLEADOS: 'accion-tab-empleados',
  EXPORTAR: 'accion-exportar-novedades',
  CREAR: 'accion-crear-novedad',
  VER_DETALLE: 'accion-ver-detalle-novedad',
  VER_TIMELINE: 'accion-ver-timeline-novedad',
  ASIGNAR_ANALISTA: 'accion-asignar-solicitud',
  CAMBIAR_ESTADO: 'accion-cambiar-estado-novedad',
  CANCELAR: 'accion-cancelar-novedad',
} as const;

/** Códigos de permiso para Módulo de Selección. */
export const SELECCION_PERMISOS = {
  VER_DETALLE: 'accion-ver-detalle-seleccion',
  VER_TIMELINE: 'accion-ver-timeline-seleccion',
  CAMBIAR_ESTADO: 'accion-cambiar-estado-seleccion',
  CANCELAR: 'accion-cancelar-seleccion',
  DESCARGAR_PLANTILLA: 'accion-descargar-plantilla-seleccion',
  CARGA_MASIVA: 'accion-carga-masiva-seleccion',
  PROCESAR_CARGA_MASIVA: 'accion-procesar-carga-masiva-seleccion',
  SOLICITUD_INGRESO: 'accion-solicitud-ingreso-seleccion',
  AGREGAR_CANDIDATO: 'accion-agregar-candidato-seleccion',
  EDITAR_CANDIDATO: 'accion-editar-candidato-seleccion',
  ELIMINAR_CANDIDATO: 'accion-eliminar-candidato-seleccion',
  ADJUNTAR_DOC_CANDIDATO: 'accion-adjuntar-doc-candidato-seleccion',
  CONFIRMAR_CAMBIO_ESTADO: 'accion-confirmar-cambio-estado-seleccion',
} as const;

export const NOVEDADES_LISTADO_MENU_ACCIONES: string[] = [
  NOVEDADES_PERMISOS.VER_DETALLE,
  NOVEDADES_PERMISOS.VER_TIMELINE,
  NOVEDADES_PERMISOS.ASIGNAR_ANALISTA,
  NOVEDADES_PERMISOS.CAMBIAR_ESTADO,
  NOVEDADES_PERMISOS.CANCELAR,
];

export const SELECCION_LISTADO_MENU_ACCIONES: string[] = [
  SELECCION_PERMISOS.VER_DETALLE,
  SELECCION_PERMISOS.VER_TIMELINE,
  SELECCION_PERMISOS.CAMBIAR_ESTADO,
  SELECCION_PERMISOS.CANCELAR,
];

/** Compatibilidad: permisos legacy de novedades en módulo selección. */
export function puedeSeleccionVerDetalle(hasAction: (code: string) => boolean): boolean {
  return hasAction(SELECCION_PERMISOS.VER_DETALLE) || hasAction(NOVEDADES_PERMISOS.VER_DETALLE);
}

export function puedeSeleccionVerTimeline(hasAction: (code: string) => boolean): boolean {
  return hasAction(SELECCION_PERMISOS.VER_TIMELINE) || hasAction(NOVEDADES_PERMISOS.VER_TIMELINE);
}

export function puedeSeleccionCambiarEstado(hasAction: (code: string) => boolean): boolean {
  return hasAction(SELECCION_PERMISOS.CAMBIAR_ESTADO) || hasAction(NOVEDADES_PERMISOS.CAMBIAR_ESTADO);
}

export function puedeSeleccionCancelar(hasAction: (code: string) => boolean): boolean {
  return hasAction(SELECCION_PERMISOS.CANCELAR) || hasAction(NOVEDADES_PERMISOS.CANCELAR);
}
