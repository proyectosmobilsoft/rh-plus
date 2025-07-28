import { supabase } from './supabaseClient';

export interface PlantillaMensaje {
  id: number;
  nombre: string;
  tipo: 'whatsapp' | 'email';
  asunto?: string;
  mensaje: string;
  variables_disponibles: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const plantillasMensajesService = {
  getAll: async (): Promise<PlantillaMensaje[]> => {
    const { data, error } = await supabase
      .from('plantillas_mensajes')
      .select('*')
      .eq('activo', true)
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  getByTipo: async (tipo: 'whatsapp' | 'email'): Promise<PlantillaMensaje[]> => {
    const { data, error } = await supabase
      .from('plantillas_mensajes')
      .select('*')
      .eq('tipo', tipo)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<PlantillaMensaje | null> => {
    const { data, error } = await supabase
      .from('plantillas_mensajes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (plantilla: Partial<PlantillaMensaje>): Promise<PlantillaMensaje | null> => {
    const { data, error } = await supabase
      .from('plantillas_mensajes')
      .insert([plantilla])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: number, plantilla: Partial<PlantillaMensaje>): Promise<PlantillaMensaje | null> => {
    const { data, error } = await supabase
      .from('plantillas_mensajes')
      .update({ ...plantilla, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('plantillas_mensajes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Función para reemplazar variables en el mensaje
  reemplazarVariables: (mensaje: string, variables: Record<string, string>): string => {
    let mensajeFinal = mensaje;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      mensajeFinal = mensajeFinal.replace(regex, value);
    });
    
    return mensajeFinal;
  }
}; 