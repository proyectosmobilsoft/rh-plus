import { useQuery } from "@tanstack/react-query";

export function useCityData() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
     /* const { data } = await supabase
        .from('ciudades')
        .select(`
          codigo,
          nombre,
          departamentos (
            nombre
          )
        `);

      if (!data) return {};

      return data.reduce((acc, city) => {
        acc[city.nombre] = `${city.codigo} - ${city.nombre}${city.departamentos ? `, ${city.departamentos.nombre}` : ''}`;
        return acc;
      }, {} as Record<string, string>);*/
    }
  });
}