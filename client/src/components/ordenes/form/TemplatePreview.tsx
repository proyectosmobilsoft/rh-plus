import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplatePreviewProps {
  configuracion: Record<string, { visible: boolean; required: boolean }>;
}

const CAMPOS_DISPONIBLES = [
  { key: "nombreTrabajador", label: "Nombre del Trabajador", type: "text" },
  { key: "cedulaTrabajador", label: "Cédula del Trabajador", type: "text" },
  { key: "empresaSeleccionada", label: "Empresa", type: "select", options: ["Empresa A", "Empresa B", "Empresa C"] },
  { key: "cargoTrabajador", label: "Cargo", type: "text" },
  { key: "fechaIngreso", label: "Fecha de Ingreso", type: "date" },
  { key: "jornadaLaboral", label: "Jornada Laboral", type: "text" },
  { key: "salario", label: "Salario", type: "text" },
  { key: "celular", label: "Celular", type: "text" },
  { key: "correo", label: "Correo Electrónico", type: "email" },
  { key: "direccion", label: "Dirección", type: "textarea" },
  { key: "tipoExamen", label: "Tipo de Examen", type: "select", options: ["Preocupacional", "Periódico", "Retiro", "Especial"] },
  { key: "observaciones", label: "Observaciones", type: "textarea" }
];

export function TemplatePreview({ configuracion }: TemplatePreviewProps) {
  const renderField = (campo: any) => {
    const config = configuracion[campo.key];
    if (!config?.visible) return null;

    const isRequired = config.required;

    switch (campo.type) {
      case "text":
      case "email":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key}>
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.key}
              type={campo.type}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50"
            />
          </div>
        );

      case "date":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key}>
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.key}
              type="date"
              disabled
              className="bg-gray-50"
            />
          </div>
        );

      case "select":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key}>
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select disabled>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder={`Seleccione ${campo.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {campo.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "textarea":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key}>
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={campo.key}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50"
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">Vista Previa del Formulario</h3>
        <p className="text-sm text-gray-600">
          Campos configurados para esta plantilla
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPOS_DISPONIBLES.map(renderField)}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>* Campos obligatorios</p>
        <p>Los campos están deshabilitados en la vista previa</p>
      </div>
    </div>
  );
} 