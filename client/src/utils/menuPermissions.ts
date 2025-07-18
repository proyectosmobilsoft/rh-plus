// Mapeo de rutas del menú con sus permisos requeridos basado en system-views-actions.json
export const menuPermissions = {
  // Dashboard
  "/dashboard": {
    viewCode: "001",
    actionCode: "dashboard_view",
    requiredPermission: "dashboard_view"
  },
  
  // Registros
  "/registros/empresas": {
    viewCode: "006",
    actionCode: "empresas_view",
    requiredPermission: "empresas_view"
  },
  "/registros/candidatos": {
    viewCode: "005",
    actionCode: "candidatos_view",
    requiredPermission: "candidatos_view"
  },
  "/registros/prestadores": {
    viewCode: "007",
    actionCode: "prestadores_view",
    requiredPermission: "prestadores_view"
  },
  "/registros/qr": {
    viewCode: "008",
    actionCode: "qr_view",
    requiredPermission: "qr_view"
  },
  
  // Órdenes
  "/ordenes/expedicion": {
    viewCode: "008",
    actionCode: "ordenes_view",
    requiredPermission: "ordenes_view"
  },
  
  // Certificados
  "/certificados/expedicion": {
    viewCode: "009",
    actionCode: "certificados_view",
    requiredPermission: "certificados_view"
  },
  
  // Analistas
  "/analistas": {
    viewCode: "012",
    actionCode: "analistas_view",
    requiredPermission: "analistas_view"
  },
  
  // Maestro
  "/maestro/tipos-candidatos": {
    viewCode: "010",
    actionCode: "maestro_view",
    requiredPermission: "maestro_view"
  },
  
  // Seguridad
  "/seguridad/usuarios": {
    viewCode: "002",
    actionCode: "usuarios_view",
    requiredPermission: "usuarios_view"
  },
  "/seguridad/perfiles": {
    viewCode: "003",
    actionCode: "perfiles_view",
    requiredPermission: "perfiles_view"
  },
  "/seguridad/permisos": {
    viewCode: "004",
    actionCode: "permisos_view",
    requiredPermission: "permisos_view"
  },
  
  // Reportes
  "/reportes/dashboard": {
    viewCode: "011",
    actionCode: "reportes_view",
    requiredPermission: "reportes_view"
  }
};

// Función para verificar si el usuario tiene permisos para una ruta específica
export const hasMenuPermission = (userPermissions: string[], menuPath: string): boolean => {
  const pathPermission = menuPermissions[menuPath as keyof typeof menuPermissions];
  
  if (!pathPermission) {
    // Si no hay permisos definidos para la ruta, permitir acceso por defecto
    return true;
  }
  
  // Si no hay permisos de usuario definidos, permitir acceso por defecto (desarrollo)
  if (!userPermissions || userPermissions.length === 0) {
    return true;
  }
  
  return userPermissions.includes(pathPermission.requiredPermission);
};

// Función para filtrar elementos de menú basado en permisos del usuario
export const filterMenuByPermissions = (menuItems: any[], userPermissions: string[]): any[] => {
  return menuItems.map(item => {
    // Si tiene subItems, filtrar los subItems
    if (item.subItems && item.subItems.length > 0) {
      const filteredSubItems = item.subItems.filter((subItem: any) => 
        hasMenuPermission(userPermissions, subItem.path)
      );
      
      // Solo mostrar el grupo si tiene al menos un subItem visible
      if (filteredSubItems.length > 0) {
        return {
          ...item,
          subItems: filteredSubItems
        };
      }
      return null;
    }
    
    // Para elementos sin subItems, verificar permisos directamente
    if (item.path) {
      return hasMenuPermission(userPermissions, item.path) ? item : null;
    }
    
    return item;
  }).filter(Boolean);
};