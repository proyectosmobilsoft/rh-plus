import { supabase } from './supabaseClient';

export interface Candidato {
  id?: number;
  usuario_id?: number; // Relación con gen_usuarios
  tipo_documento: string;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  empresa_id?: number; // Relación con empresa (opcional)
  tipo_candidato_id?: number; // Relación con tipo de candidato
  activo?: boolean; // Estado del candidato
}

export interface DocumentoCandidato {
  id: number;
  candidato_id: number;
  tipo: string;
  nombre_archivo: string;
  url_archivo: string;
  created_at: string;
  updated_at: string;
}

export const candidatosService = {
  getAll: async (): Promise<Candidato[]> => {
    const { data, error } = await supabase
      .from('candidatos')
      .select(`
        *,
        usuario:gen_usuarios!usuario_id(
          id,
          username,
          primer_nombre,
          primer_apellido,
          email,
          activo
        )
      `);
    if (error) throw error;
    return data || [];
  },

  // Obtener candidato por número de documento (cédula)
  getByDocumento: async (numeroDocumento: string): Promise<Candidato | null> => {
    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('numero_documento', numeroDocumento)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Obtener documentos de un candidato
  getDocumentos: async (candidatoId: number): Promise<DocumentoCandidato[]> => {
    const { data, error } = await supabase
      .from('documentos_candidato')
      .select('*')
      .eq('candidato_id', candidatoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (candidato: Partial<Candidato>): Promise<Candidato | null> => {
    try {
      // 1. Crear usuario en gen_usuarios con campos disponibles
      const usuarioData: any = { activo: true };
      if (candidato.email) usuarioData.username = candidato.email;
      if (candidato.email) usuarioData.email = candidato.email;
      if (candidato.primer_nombre) usuarioData.primer_nombre = candidato.primer_nombre;
      if (candidato.primer_apellido) usuarioData.primer_apellido = candidato.primer_apellido;
      // Password inicial basado en documento si existe
      if (candidato.numero_documento) usuarioData.password_hash = btoa(candidato.numero_documento);

      const { data: usuario, error: usuarioError } = await supabase
        .from('gen_usuarios')
        .insert([usuarioData])
        .select()
        .single();

      if (usuarioError) throw usuarioError;

      // 2. Asignar rol de candidato
      const { error: rolError } = await supabase
        .from('gen_usuario_roles')
        .insert([{ usuario_id: usuario.id, rol_id: 15 }]); // ID del rol "Candidato"

      if (rolError) throw rolError;

      // 3. Crear candidato en tabla candidatos con campos disponibles
      const candidatoData: any = { usuario_id: usuario.id, activo: true };
      // Asegurar valores NOT NULL requeridos por la tabla
      candidatoData.tipo_documento = candidato.tipo_documento || 'CC';
      candidatoData.primer_nombre = candidato.primer_nombre || 'SIN_NOMBRE';
      candidatoData.primer_apellido = candidato.primer_apellido || 'SIN_APELLIDO';
      const copyProps: (keyof Candidato)[] = [
        'numero_documento', 'segundo_nombre',
        'segundo_apellido', 'email', 'telefono', 'direccion',
        'ciudad', 'empresa_id', 'tipo_candidato_id'
      ];
      for (const k of copyProps) {
        const v = (candidato as any)[k];
        if (v !== undefined) candidatoData[k] = v;
      }

      const { data: candidatoCreado, error: candidatoError } = await supabase
        .from('candidatos')
        .insert([candidatoData])
        .select()
        .single();

      if (candidatoError) throw candidatoError;

      return candidatoCreado;
    } catch (error) {
      console.error('Error creando candidato:', error);
      throw error;
    }
  },
  
  update: async (id: number, candidato: Partial<Candidato>): Promise<Candidato | null> => {
    try {
      // Obtener el candidato actual para saber el usuario_id
      const { data: candidatoActual, error: fetchError } = await supabase
        .from('candidatos')
        .select('usuario_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Actualizar datos del candidato
      const { data: candidatoActualizado, error: updateError } = await supabase
        .from('candidatos')
        .update(candidato)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Si hay cambios en datos básicos, actualizar también gen_usuarios
      if (candidatoActual?.usuario_id && (candidato.email || candidato.primer_nombre || candidato.primer_apellido)) {
        const usuarioUpdates: any = {};
        if (candidato.email) usuarioUpdates.email = candidato.email;
        if (candidato.primer_nombre) usuarioUpdates.primer_nombre = candidato.primer_nombre;
        if (candidato.primer_apellido) usuarioUpdates.primer_apellido = candidato.primer_apellido;

        if (Object.keys(usuarioUpdates).length > 0) {
          await supabase
            .from('gen_usuarios')
            .update(usuarioUpdates)
            .eq('id', candidatoActual.usuario_id);
        }
      }

      return candidatoActualizado;
    } catch (error) {
      console.error('Error actualizando candidato:', error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase.from('candidatos').delete().eq('id', id);
    if (error) throw error;
  },

  // Activar candidato
  activate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('candidatos')
      .update({ activo: true })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Inactivar candidato
  deactivate: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('candidatos')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};