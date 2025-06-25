
import { Users } from "lucide-react";

const UsuariosPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Usuarios</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de usuarios del sistema.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar los usuarios que tienen acceso al sistema.
        </p>
      </div>
    </div>
  );
};

export default UsuariosPage;
