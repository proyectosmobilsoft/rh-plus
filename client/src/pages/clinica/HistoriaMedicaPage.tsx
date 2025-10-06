
import { FileText } from "lucide-react";

const HistoriaMedicaPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Historia Médica</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de historias clínicas médicas de pacientes.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá consultar y gestionar las historias clínicas médicas de los pacientes registrados.
        </p>
      </div>
    </div>
  );
};

export default HistoriaMedicaPage;

