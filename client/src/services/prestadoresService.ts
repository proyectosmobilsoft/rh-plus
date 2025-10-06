import { supabase } from './supabaseClient';
import { prestadoresHorariosService, PrestadorHorarioCreate } from './prestadoresHorariosService';

export interface Prestador {
  id?: number;
  identificacion: string;
  razon_social: string;
  especialidad?: string; // Campo legacy
  especialidad_id?: number;
  telefono?: string;
  correo?: string;
  direccion_laboratorio?: string;
  nombre_laboratorio?: string;
  contacto_laboratorio?: string;
  sucursal_id?: number;
  activo?: boolean;
  // Campos relacionados
  especialidad_nombre?: string;
  sucursal_nombre?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  // Horarios
  horarios?: PrestadorHorarioCreate[];
}

export const prestadoresService = {
  getAll: async (): Promise<Prestador[]> => {
    const { data, error } = await supabase
      .from('prestadores')
      .select(`
        *,
        especialidades:especialidad_id(nombre),
        sucursales:sucursal_id(nombre, ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre)))
      `);
    if (error) throw error;
    
    // Transformar los datos para incluir nombres relacionados
    return (data || []).map(prestador => ({
      ...prestador,
      especialidad_nombre: prestador.especialidades?.nombre,
      sucursal_nombre: prestador.sucursales?.nombre,
      ciudad_nombre: prestador.sucursales?.ciudades?.nombre,
      departamento_nombre: prestador.sucursales?.ciudades?.departamentos?.nombre
    }));
  },
  
  create: async (prestador: Partial<Prestador>): Promise<Prestador | null> => {
    // Extraer horarios del prestador
    const { horarios, ...prestadorData } = prestador;
    
    const { data, error } = await supabase.from('prestadores').insert([prestadorData]).select();
    if (error) throw error;
    
    const prestadorCreado = data ? data[0] : null;
    
    // Si hay horarios y el prestador se creó correctamente, guardar los horarios
    if (prestadorCreado && horarios && horarios.length > 0) {
      try {
        const horariosConPrestadorId = horarios.map(horario => ({
          ...horario,
          prestador_id: prestadorCreado.id!
        }));
        
        await prestadoresHorariosService.createMultiple(horariosConPrestadorId);
      } catch (horarioError) {
        console.error('Error al crear horarios:', horarioError);
        // No lanzamos el error para no interrumpir la creación del prestador
      }
    }
    
    return prestadorCreado;
  },
  
  update: async (id: number, prestador: Partial<Prestador>): Promise<Prestador | null> => {
    // Extraer horarios del prestador
    const { horarios, ...prestadorData } = prestador;
    
    const { data, error } = await supabase.from('prestadores').update(prestadorData).eq('id', id).select();
    if (error) throw error;
    
    const prestadorActualizado = data ? data[0] : null;
    
    // Si hay horarios y el prestador se actualizó correctamente, sincronizar los horarios
    if (prestadorActualizado && horarios !== undefined) {
      try {
        const horariosConPrestadorId = horarios.map(horario => ({
          ...horario,
          prestador_id: id
        }));
        
        await prestadoresHorariosService.syncHorarios(id, horariosConPrestadorId);
      } catch (horarioError) {
        console.error('Error al actualizar horarios:', horarioError);
        // No lanzamos el error para no interrumpir la actualización del prestador
      }
    }
    
    return prestadorActualizado;
  },
  
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  
  activate: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').update({ activo: true }).eq('id', id);
    if (error) throw error;
    return true;
  },
  
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('prestadores').update({ activo: false }).eq('id', id);
    if (error) throw error;
    return true;
  },

  // Obtener un prestador con sus horarios
  getByIdWithHorarios: async (id: number): Promise<Prestador | null> => {
    const { data, error } = await supabase
      .from('prestadores')
      .select(`
        *,
        especialidades:especialidad_id(nombre),
        sucursales:sucursal_id(nombre, ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre)))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) return null;

    // Obtener horarios del prestador
    const horarios = await prestadoresHorariosService.getByPrestadorId(id);

    return {
      ...data,
      especialidad_nombre: data.especialidades?.nombre,
      sucursal_nombre: data.sucursales?.nombre,
      ciudad_nombre: data.sucursales?.ciudades?.nombre,
      departamento_nombre: data.sucursales?.ciudades?.departamentos?.nombre,
      horarios: horarios.map(h => ({
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin
      }))
    };
  }
}; 

