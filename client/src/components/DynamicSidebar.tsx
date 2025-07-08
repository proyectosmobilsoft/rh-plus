import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredMenus } from '@/config/permissions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Shield,
  Settings,
  Building2,
  UserCheck,
  FileText,
  Award,
  BarChart,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building
} from 'lucide-react';

const iconMap = {
  BarChart3,
  Shield,
  Settings,
  Building2,
  UserCheck,
  FileText,
  Award,
  BarChart,
  Users,
  User,
  Building
};

interface DynamicSidebarProps {
  onNavigate?: (path: string) => void;
}

export function DynamicSidebar({ onNavigate }: DynamicSidebarProps) {
  const [location] = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  if (!user) return null;

  const userMenus = getFilteredMenus(user.permissions);

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location === path || location.startsWith(path + '/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'analista':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      case 'candidato':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'analista':
        return 'Analista';
      case 'cliente':
        return 'Cliente';
      case 'candidato':
        return 'Candidato';
      default:
        return role;
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header con información del usuario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.primerNombre} {user.primerApellido}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de navegación */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h2 className="text-xl font-medium text-gray-900 mb-4 px-2">
            Plataforma ZEUS
          </h2>
          
          <nav className="space-y-1">
            {userMenus.map((menu) => {
              const IconComponent = iconMap[menu.icon as keyof typeof iconMap] || Settings;
              const hasChildren = menu.children && menu.children.length > 0;
              const isExpanded = expandedMenus.has(menu.id);
              const isMenuActive = isActive(menu.path);

              return (
                <div key={menu.id}>
                  {hasChildren ? (
                    // Menú con submenús
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-base text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <span>{menu.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    // Menú directo
                    <Link
                      href={menu.path || '#'}
                      onClick={() => handleNavigate(menu.path || '#')}
                      className={`block px-3 py-2 text-base rounded-md transition-colors ${
                        isMenuActive
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <span>{menu.label}</span>
                      </div>
                    </Link>
                  )}

                  {/* Submenús */}
                  {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {menu.children?.map((child) => {
                        const ChildIconComponent = iconMap[child.icon as keyof typeof iconMap] || Settings;
                        const isChildActive = isActive(child.path);

                        return (
                          <Link
                            key={child.id}
                            href={child.path || '#'}
                            onClick={() => handleNavigate(child.path || '#')}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              isChildActive
                                ? 'bg-blue-100 text-blue-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <ChildIconComponent className="w-4 h-4" />
                              <span>{child.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer con logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}