import React, { useState, useEffect } from "react";
import { Check, X, Edit, Eye, Plus, Trash2, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import systemViewsData from "@shared/system-views-actions.json";

interface PermissionsFormProps {
  selectedPermissions: {
    viewId: string;
    viewName: string;
    actions: string[];
  }[];
  onPermissionsChange: (permissions: {
    viewId: string;
    viewName: string;
    actions: string[];
  }[]) => void;
}

interface SystemView {
  codigo: string;
  nombre: string;
  acciones: {
    codigo: string;
    nombre: string;
  }[];
}

const actionIcons = {
  view: <Eye className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  edit: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  manage: <Users className="h-4 w-4" />,
  custom: <Filter className="h-4 w-4" />
};

const getActionIcon = (actionCode: string) => {
  if (actionCode.includes('view') || actionCode.includes('ver')) return actionIcons.view;
  if (actionCode.includes('create') || actionCode.includes('crear')) return actionIcons.create;
  if (actionCode.includes('edit') || actionCode.includes('editar')) return actionIcons.edit;
  if (actionCode.includes('delete') || actionCode.includes('eliminar')) return actionIcons.delete;
  if (actionCode.includes('manage') || actionCode.includes('gestionar')) return actionIcons.manage;
  return actionIcons.custom;
};

export function PermissionsForm({ selectedPermissions, onPermissionsChange }: PermissionsFormProps) {
  const [selectedView, setSelectedView] = useState<string>("");
  const [filterText, setFilterText] = useState("");
  
  const systemViews = systemViewsData as SystemView[];

  const addView = () => {
    if (!selectedView) return;

    const view = systemViews.find(v => v.codigo === selectedView);
    if (!view) return;

    // Check if view already exists
    const existingIndex = selectedPermissions.findIndex(p => p.viewId === selectedView);
    if (existingIndex >= 0) return;

    const newPermission = {
      viewId: selectedView,
      viewName: view.nombre,
      actions: []
    };

    onPermissionsChange([...selectedPermissions, newPermission]);
    setSelectedView("");
  };

  const removeView = (viewId: string) => {
    onPermissionsChange(selectedPermissions.filter(p => p.viewId !== viewId));
  };

  const toggleAction = (viewId: string, actionCode: string) => {
    const updatedPermissions = selectedPermissions.map(permission => {
      if (permission.viewId === viewId) {
        const actions = permission.actions.includes(actionCode)
          ? permission.actions.filter(a => a !== actionCode)
          : [...permission.actions, actionCode];
        
        return { ...permission, actions };
      }
      return permission;
    });

    onPermissionsChange(updatedPermissions);
  };

  const filteredViews = systemViews.filter(view => 
    !selectedPermissions.some(p => p.viewId === view.codigo)
  );

  const filteredPermissions = selectedPermissions.filter(permission =>
    permission.viewName.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold text-center">Gestiona los Permisos</h3>
        <p className="text-center text-cyan-50 text-sm mt-1">
          Formularios que se le habilitaran a los usuarios con este rol
        </p>
      </div>

      {/* Add View Section */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nombre de la Vista
            </label>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="bg-yellow-50 border-yellow-200">
                <SelectValue placeholder="Seleccionar vista..." />
              </SelectTrigger>
              <SelectContent>
                {filteredViews.map((view) => (
                  <SelectItem key={view.codigo} value={view.codigo}>
                    {view.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={addView}
            disabled={!selectedView}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6"
          >
            Mas
          </Button>
          <Button 
            onClick={addView}
            disabled={!selectedView}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4"
          >
            +
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {selectedPermissions.length > 0 && (
        <div className="p-2">
          <Input
            placeholder="Filtrar vistas..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Permissions Table */}
      {filteredPermissions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-cyan-100 border-b">
            <div className="grid grid-cols-12 gap-2 p-3 font-medium text-gray-700">
              <div className="col-span-4">Nombre De La Vista</div>
              <div className="col-span-1 text-center">{getActionIcon('edit')}</div>
              <div className="col-span-1 text-center">{getActionIcon('create')}</div>
              <div className="col-span-1 text-center">{getActionIcon('delete')}</div>
              <div className="col-span-1 text-center">{getActionIcon('view')}</div>
              <div className="col-span-1 text-center">{getActionIcon('custom')}</div>
              <div className="col-span-1 text-center">{getActionIcon('manage')}</div>
              <div className="col-span-1 text-center">Mas</div>
              <div className="col-span-1 text-center">Acciones</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredPermissions.map((permission) => {
              const view = systemViews.find(v => v.codigo === permission.viewId);
              if (!view) return null;

              return (
                <div key={permission.viewId} className="bg-white hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-2 p-3 items-center">
                    {/* View Name */}
                    <div className="col-span-4">
                      <div className="bg-yellow-50 p-2 rounded border">
                        <span className="text-sm font-medium">{permission.viewName}</span>
                      </div>
                    </div>

                    {/* Action Checkboxes */}
                    {view.acciones.map((action, index) => {
                      if (index < 6) {
                        const isSelected = permission.actions.includes(action.codigo);
                        return (
                          <div key={action.codigo} className="col-span-1 text-center">
                            <button
                              onClick={() => toggleAction(permission.viewId, action.codigo)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'bg-white border-gray-300 hover:border-green-400'
                              }`}
                              title={action.nombre}
                            >
                              {isSelected && <Check className="h-4 w-4" />}
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Fill remaining columns if less than 6 actions */}
                    {Array.from({ length: 6 - Math.min(view.acciones.length, 6) }).map((_, index) => (
                      <div key={`empty-${index}`} className="col-span-1"></div>
                    ))}

                    {/* More Actions Button */}
                    <div className="col-span-1 text-center">
                      {view.acciones.length > 6 && (
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                          Mas ({view.acciones.length - 6})
                        </Badge>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeView(permission.viewId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Details (if more than 6 actions) */}
                  {view.acciones.length > 6 && (
                    <div className="px-3 pb-3">
                      <div className="text-xs text-gray-600 mb-2">Acciones adicionales:</div>
                      <div className="flex flex-wrap gap-2">
                        {view.acciones.slice(6).map((action) => {
                          const isSelected = permission.actions.includes(action.codigo);
                          return (
                            <button
                              key={action.codigo}
                              onClick={() => toggleAction(permission.viewId, action.codigo)}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                isSelected 
                                  ? 'bg-green-100 border-green-400 text-green-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:border-green-400'
                              }`}
                            >
                              {action.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedPermissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p>No hay vistas agregadas</p>
          <p className="text-sm">Selecciona una vista arriba para comenzar</p>
        </div>
      )}

      {/* Selected Permissions Summary */}
      {selectedPermissions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Resumen de Permisos</h4>
          <div className="text-sm text-blue-700">
            <span className="font-medium">{selectedPermissions.length}</span> vistas seleccionadas con{' '}
            <span className="font-medium">
              {selectedPermissions.reduce((total, p) => total + p.actions.length, 0)}
            </span> acciones habilitadas
          </div>
        </div>
      )}
    </div>
  );
}