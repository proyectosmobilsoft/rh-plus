import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Shield, LogOut, Settings } from 'lucide-react';

interface Sede {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  estado: string;
}

interface Perfil {
  id: number;
  nombre: string;
  descripcion: string;
}

export function UserDropdown() {
  const { user, logout, currentSedeId } = useAuth();
  const [userSedes, setUserSedes] = useState<Sede[]>([]);
  const [userPerfiles, setUserPerfiles] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserDetails();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      
      // Obtener sedes del usuario
      if (user?.sedeIds && user.sedeIds.length > 0) {
        const sedesResponse = await fetch('/api/sedes', {
          credentials: 'include'
        });
        
        if (sedesResponse.ok) {
          const allSedes = await sedesResponse.json();
          const filteredSedes = allSedes.filter((sede: Sede) => 
            user.sedeIds?.includes(sede.id)
          );
          setUserSedes(filteredSedes);
        }
      }

      // Obtener perfiles del usuario
      const perfilesResponse = await fetch(`/api/usuarios/${user?.id}/perfiles`, {
        credentials: 'include'
      });
      
      if (perfilesResponse.ok) {
        const perfiles = await perfilesResponse.json();
        setUserPerfiles(perfiles);
      }

    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (!user) return null;

  const userInitials = `${user.primerNombre?.charAt(0) || ''}${user.primerApellido?.charAt(0) || ''}`;
  const currentSede = userSedes.find(sede => sede.id === currentSedeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-10 w-10 rounded-full bg-brand-lime text-white hover:bg-brand-lime/90 font-medium"
        >
          {userInitials}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-brand-lime rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  {user.primerNombre} {user.primerApellido}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Sede Actual */}
        {currentSede && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Sede Actual
            </DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <Building2 className="mr-2 h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentSede.nombre}</span>
                <span className="text-xs text-muted-foreground">{currentSede.descripcion}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Sedes Asignadas */}
        {userSedes.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Sedes Asignadas ({userSedes.length})
            </DropdownMenuLabel>
            <div className="px-2 py-1 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {userSedes.map((sede) => (
                  <Badge 
                    key={sede.id} 
                    variant={sede.id === currentSedeId ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {sede.nombre}
                  </Badge>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Perfiles Asignados */}
        {userPerfiles.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Perfiles Asignados ({userPerfiles.length})
            </DropdownMenuLabel>
            <div className="px-2 py-1 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {userPerfiles.map((perfil) => (
                  <Badge 
                    key={perfil.id} 
                    variant="outline" 
                    className="text-xs"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {perfil.nombre}
                  </Badge>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Acciones */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}