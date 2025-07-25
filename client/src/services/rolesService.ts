import { supabase } from './supabaseClient';

export const rolesService = {
  // Listar roles
  async listRoles() {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data;
  },

  // Crear rol
  async createRole({ nombre, descripcion }: { nombre: string; descripcion?: string }) {
    const { data, error } = await supabase.from('roles').insert([{ nombre, descripcion }]).select().single();
    if (error) throw error;
    return data;
  },

  // Editar rol
  async updateRole(id: number, { nombre, descripcion }: { nombre: string; descripcion?: string }) {
    const { data, error } = await supabase.from('roles').update({ nombre, descripcion }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Eliminar rol
  async deleteRole(id: number) {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Eliminar métodos de roles_permisos
  // Listar permisos de un rol (ya no se usa)
  // async listPermisosByRol(rol_id: number) { ... }
  // Asignar permisos a un rol (ya no se usa)
  // async setPermisosToRol(rol_id: number, permiso_ids: number[]) { ... }

  // Listar permisos completos de un rol
  async listPermisosDetalleByRol(rol_id: number) {
    const { data, error } = await supabase
      .from('roles_acciones')
      .select('permiso_id, modulo_permisos(id, nombre, descripcion, modulos(nombre))');
    if (error) throw error;

    return data.map((ra: any) => {
      // Supabase devuelve el objeto relacionado directamente cuando no hay ambigüedad o array si hay multiples
      const moduloPermiso = ra.modulo_permisos;
      const moduloInfo = moduloPermiso?.modulos;
      
      return {
        permiso_id: moduloPermiso?.id || null, // Asegurar un valor por defecto si es null
        nombre: moduloPermiso?.nombre || '',
        descripcion: moduloPermiso?.descripcion || '',
        modulo: moduloInfo?.nombre || ''
      };
    }).filter(p => p.permiso_id !== null); // Filtrar entradas sin permiso_id válido
  },

  // Guardar acciones por permiso para un rol
  async setAccionesToRol(rol_id: number, permisos: { permiso_id: number, acciones: string[] }[]) {
    // Eliminar acciones actuales
    await supabase.from('roles_acciones').delete().eq('rol_id', rol_id);
    // Insertar nuevas acciones
    const inserts = permisos.flatMap(p => p.acciones.map(accion => ({ rol_id, permiso_id: p.permiso_id, accion_codigo: accion })));
    if (inserts.length > 0) {
      const { error } = await supabase.from('roles_acciones').insert(inserts);
      if (error) throw error;
    }
    return true;
  },

  // Consultar acciones por permiso para un rol
  async getAccionesByRol(rol_id: number) {
    const { data, error } = await supabase.from('roles_acciones').select('*').eq('rol_id', rol_id);
    if (error) throw error;
    return data;
  },

  // Listar módulos con sus permisos
  async listModulosConPermisos() {
    const { data, error } = await supabase
      .from('modulos')
      .select('id, nombre, descripcion, modulo_permisos(id, nombre, descripcion)');
    if (error) throw error;
    return data;
  },

  // Listar permisos (con nombre de módulo)
  async listPermisos() {
    const { data, error } = await supabase
      .from('modulo_permisos')
      .select('*, modulos(nombre)');
    if (error) throw error;
    return data.map(p => ({
      ...p,
      modulo: p.modulos?.nombre || ''
    }));
  }
}; 