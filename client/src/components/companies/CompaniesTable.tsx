import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Company } from "@/types/company";
  import { BusinessEntityRow } from "@/components/shared/BusinessEntityRow";
  import { empresasService } from "@/services/empresasService";
  import { prestadoresService } from "@/services/prestadoresService";
  import { useCompanies } from "@/hooks/useCompanies";
  import { useCityData } from "@/hooks/useCityData";
  import { useQueryClient } from "@tanstack/react-query";
  import { toast } from "sonner";
  
  interface CompaniesTableProps {
    onEdit?: (company: Company) => void;
    entityType?: 'empresa' | 'prestador';
  }
  
  export function CompaniesTable({ onEdit, entityType = 'empresa' }: CompaniesTableProps) {
    const { data: companies = [] } = useCompanies(entityType);
    const { data: cityData = {} } = useCityData();
    const queryClient = useQueryClient();

    const handleEdit = (company: Company) => {
      if (onEdit) {
        onEdit(company);
      }
    };

    const handleDelete = async (company: Company) => {
      if (!company.id) return;

      try {
        let success = false;
        
        if (entityType === 'empresa') {
          success = await empresasService.delete(company.id);
        } else if (entityType === 'prestador') {
          success = await prestadoresService.delete(company.id);
        }

        if (success) {
          toast.success(`${entityType === 'empresa' ? 'Empresa' : 'Prestador'} eliminado correctamente`);
          // Refrescar la lista
          queryClient.invalidateQueries({ queryKey: ['companies', entityType] });
        } else {
          toast.error(`No se pudo eliminar ${entityType === 'empresa' ? 'la empresa' : 'el prestador'}`);
        }
      } catch (error) {
        console.error(`Error eliminando ${entityType}:`, error);
        toast.error(`Error al eliminar ${entityType === 'empresa' ? 'la empresa' : 'el prestador'}`);
      }
    };
  
    return (
      <div className="space-y-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="py-1 px-2 text-[11px] font-medium">NIT</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Razón Social</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Dirección</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Ciudad</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Email</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Teléfono</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Representante Legal</TableHead>
              <TableHead className="py-1 px-2 text-[11px] font-medium">Estado</TableHead>
              <TableHead className="text-right py-1 px-2 text-[11px] font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <BusinessEntityRow
                key={company.id}
                entity={company as Company}
                cityData={cityData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                entityType={entityType}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

