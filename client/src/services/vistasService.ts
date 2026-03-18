import { supabase } from './supabaseClient';

export interface VistaSistema {
    id: number;
    nombre: string;
    descripcion?: string;
    ruta: string;
    icono?: string;
    orden: number;
    activo: boolean;
}

export const vistasService = {
    /**
     * Obtiene las vistas permitidas para un perfil específico
     * @param perfilId ID del perfil (o array de IDs)
     */
    async getVistasPorPerfil(perfilId: number | number[]): Promise<VistaSistema[]> {
        try {
            const perfiles = Array.isArray(perfilId) ? perfilId : [perfilId];

            const { data, error } = await supabase
                .from('permisos_vista_perfil')
                .select(`
          vista_id,
          vistas_sistema (*)
        `)
                .in('perfil_id', perfiles)
                .eq('activo', true)
                .eq('vistas_sistema.activo', true);

            if (error) {
                console.error('Error obteniendo vistas por perfil:', error);
                return [];
            }

            // Extraer y limpiar las vistas del resultado del join
            const vistas = data
                .map((item: any) => item.vistas_sistema)
                .filter(Boolean) as VistaSistema[];

            // Eliminar duplicados si el usuario tiene múltiples perfiles con acceso a la misma vista
            const vistasUnicas = Array.from(new Map(vistas.map(v => [v.id, v])).values());

            // Ordenar por el campo orden
            return vistasUnicas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        } catch (error) {
            console.error('Error en getVistasPorPerfil:', error);
            return [];
        }
    },

    /**
     * Obtiene todas las vistas registradas
     */
    async getAllVistas(): Promise<VistaSistema[]> {
        const { data, error } = await supabase
            .from('vistas_sistema')
            .select('*')
            .order('orden', { ascending: true });

        if (error) {
            console.error('Error obteniendo todas las vistas:', error);
            return [];
        }

        return data || [];
    }
};
