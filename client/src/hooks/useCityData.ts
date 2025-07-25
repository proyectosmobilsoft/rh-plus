import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/services/supabaseClient';

export function useCityData() {
  return useQuery({
    queryKey: ['departamentos_ciudades'],
    queryFn: async () => {
      // Obtener departamentos
      const { data: departamentos, error: depError } = await supabase.from('departamentos').select('id, nombre');
      if (depError) throw depError;
      // Obtener ciudades
      const { data: ciudades, error: ciuError } = await supabase.from('ciudades').select('id, nombre, departamento_id');
      if (ciuError) throw ciuError;
      // Estructura: { departamentoId: { nombre, ciudades: [{id, nombre}] } }
      const depMap: Record<number, { nombre: string, ciudades: { id: number, nombre: string }[] }> = {};
      departamentos.forEach(dep => {
        depMap[dep.id] = { nombre: dep.nombre, ciudades: [] };
      });
      ciudades.forEach(ciudad => {
        if (depMap[ciudad.departamento_id]) {
          depMap[ciudad.departamento_id].ciudades.push({ id: ciudad.id, nombre: ciudad.nombre });
        }
      });
      return depMap;
    }
  });
}