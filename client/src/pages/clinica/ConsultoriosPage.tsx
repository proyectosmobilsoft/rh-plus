
import { Building } from "lucide-react";

const ConsultoriosPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Building className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Consultorios</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de consultorios médicos.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar los consultorios disponibles en la clínica.
        </p>
      </div>
    </div>
  );
};

export default ConsultoriosPage;

