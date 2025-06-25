
import { Settings } from "lucide-react";

const PerfilesPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Perfiles</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de perfiles y roles de usuario.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar los perfiles y roles de usuario que determinan los permisos en el sistema.
        </p>
      </div>
    </div>
  );
};

export default PerfilesPage;
