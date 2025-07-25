import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Company } from "@/types/company";
  import { BusinessEntityRow } from "@/components/shared/BusinessEntityRow";
  import { handleEntityDelete } from "@/utils/businessEntityUtils";
  import { useCompanies } from "@/hooks/useCompanies";
  import { useCityData } from "@/hooks/useCityData";
  
  interface CompaniesTableProps {
    onEdit?: (company: Company) => void;
    entityType?: 'empresa' | 'prestador';
  }
  
  export function CompaniesTable({ onEdit, entityType = 'empresa' }: CompaniesTableProps) {
    const { data: companies = [] } = useCompanies(entityType);
    const { data: cityData = {} } = useCityData();
  
    const handleEdit = (company: Company) => {
      if (onEdit) {
        onEdit(company);
      }
    };
  
    const handleDelete = async (company: Company) => {
      const success = await handleEntityDelete(company, entityType);
      if (success) {
        // The query will automatically refetch due to React Query's cache invalidation
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
                entity={company}
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