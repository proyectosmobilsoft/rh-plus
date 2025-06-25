
import { Menu } from "lucide-react";

const MenuPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-2">
          <Menu className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Menú</h1>
        </div>
      </div>
      
      <div className="dashboard-card">
        <p>Gestión de opciones de menú.</p>
        <p className="text-muted-foreground mt-2">
          En esta sección podrá administrar la configuración y permisos del menú del sistema.
        </p>
      </div>
    </div>
  );
};

export default MenuPage;
