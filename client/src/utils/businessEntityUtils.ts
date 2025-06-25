import { Company } from "@/types/company";
import { toast } from "sonner";

export const checkRelatedContracts = async (entityId: number) => {
  /*const { data: contracts, error } = await supabase
    .from('contratos_prestador')
    .select('id')
    .or(`prestador_id.eq.${entityId},empresa_id.eq.${entityId}`)
    .limit(1);

  if (error) throw error;
  return contracts && contracts.length > 0;*/
};

export const checkRelatedServices = async (entityId: number) => {
 /* const { data: services, error } = await supabase
    .from('servicios_prestador')
    .select('id')
    .eq('empresa_id', entityId)
    .limit(1);

  if (error) throw error;
  return services && services.length > 0;*/
};

export const deleteEntityDocuments = async (entityId: number) => {
 /* const { error } = await supabase
    .from('documentos_empresa')
    .delete()
    .eq('empresa_id', entityId);

  if (error) throw error;*/
};

export const deleteEntity = async (entityId: number) => {
  /*const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', entityId);

  if (error) throw error;*/
};

export const handleEntityDelete = async (entity: Company, entityType: 'empresa' | 'prestador') => {
  try {
   /* const entityId = parseInt(entity.id);

    const hasContracts = await checkRelatedContracts(entityId);
    if (hasContracts) {
      toast.error(`No se puede eliminar ${entityType === 'empresa' ? 'la empresa' : 'el prestador'} porque tiene contratos asociados.`);
      return false;
    }

    const hasServices = await checkRelatedServices(entityId);
    if (hasServices) {
      toast.error(`No se puede eliminar ${entityType === 'empresa' ? 'la empresa' : 'el prestador'} porque tiene servicios asociados.`);
      return false;
    }

    await deleteEntityDocuments(entityId);
    await deleteEntity(entityId);

    toast.success(`${entityType === 'empresa' ? 'Empresa' : 'Prestador'} eliminado correctamente.`);*/
    return true;
  } catch (error) {
    console.error('Error deleting entity:', error);
    toast.error(`No se pudo eliminar ${entityType === 'empresa' ? 'la empresa' : 'el prestador'}. Por favor, intente nuevamente.`);
    return false;
  }
};