
import { User } from "lucide-react";

const EspecialistasPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Especialistas</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de especialistas médicos.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar los especialistas y profesionales médicos de la clínica.
        </p>
      </div>
    </div>
  );
};

export default EspecialistasPage;
