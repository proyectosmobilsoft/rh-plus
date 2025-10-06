
import { Layers } from "lucide-react";

const EspecialidadesPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Layers className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Especialidades</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de especialidades médicas.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar las especialidades médicas ofrecidas en la clínica.
        </p>
      </div>
    </div>
  );
};

export default EspecialidadesPage;

