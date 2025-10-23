import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTiposCandidatos } from "@/hooks/useTiposCandidatos";
import { useDatabaseData } from "@/hooks/useDatabaseData";
import { CustomDatePicker } from "@/components/ui/date-picker";

interface TemplatePreviewProps {
  configuracion?: Record<string, { visible: boolean; required: boolean }>;
  estructuraFormulario?: any;
}

export function TemplatePreview({ configuracion, estructuraFormulario }: TemplatePreviewProps) {
  // Si tenemos estructura_formulario, la usamos; si no, usamos la configuración antigua
  if (estructuraFormulario?.secciones) {
    return <TemplateFormPreview estructuraFormulario={estructuraFormulario} />;
  }

  // Fallback a la vista previa antigua
  return <LegacyTemplatePreview configuracion={configuracion || {}} />;
}

// Componente para la nueva estructura de plantilla
function TemplateFormPreview({ estructuraFormulario }: { estructuraFormulario: any }) {
  // Hook para obtener tipos de candidatos
  const { data: tiposCandidatos = [], isLoading: isLoadingTiposCandidatos } = useTiposCandidatos();
  
  // Hook para obtener datos dinámicos de la base de datos
  const { data: sucursales = [], isLoading: isLoadingSucursales } = useDatabaseData('gen_sucursales');
  const { data: centrosCosto = [], isLoading: isLoadingCentrosCosto } = useDatabaseData('centros_costo');

  // Función helper para obtener datos dinámicos según configuración del campo
  const getDynamicData = (campo: any) => {
    if (!campo.dataSource || campo.dataSource === 'static') {
      return { data: [], isLoading: false };
    }

    switch (campo.databaseTable) {
      case 'tipos_candidatos':
        return { data: tiposCandidatos, isLoading: isLoadingTiposCandidatos };
      case 'gen_sucursales':
        return { data: sucursales, isLoading: isLoadingSucursales };
      case 'centros_costo':
        return { data: centrosCosto, isLoading: isLoadingCentrosCosto };
      default:
        return { data: [], isLoading: false };
    }
  };

  const renderField = (campo: any) => {
    const isRequired = campo.required;
    const fieldId = campo.nombre || campo.id || `field-${Math.random()}`;

    switch (campo.tipo) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <Label htmlFor={fieldId} className="text-sm font-medium block">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={campo.tipo}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50 text-sm w-full"
            />
          </div>
        );

      case "date":
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <Label htmlFor={fieldId} className="text-sm font-medium block">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <CustomDatePicker
              value={null}
              onChange={() => {}}
              placeholder="Seleccionar fecha"
              disabled={true}
              className="bg-gray-50 text-sm w-full"
            />
          </div>
        );

      case "select":
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <Label htmlFor={fieldId} className="text-sm font-medium block">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select disabled>
              <SelectTrigger className="bg-gray-50 text-sm w-full">
                <SelectValue placeholder={`Seleccione ${campo.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {campo.dataSource === 'database' ? (
                  // Cargar opciones desde la base de datos usando la nueva configuración
                  (() => {
                    const { data: dynamicData, isLoading: isLoadingDynamic } = getDynamicData(campo);
                    if (isLoadingDynamic) {
                      return (
                        <SelectItem value="loading" disabled>
                          Cargando opciones...
                        </SelectItem>
                      );
                    }
                    return dynamicData.map((item: any) => {
                      const displayValue = item[campo.databaseField || 'nombre'];
                      const selectValue = item[campo.databaseValueField || 'nombre'];
                      return (
                        <SelectItem key={item.id} value={selectValue}>
                          {displayValue}
                        </SelectItem>
                      );
                    });
                  })()
                ) : campo.options === 'tipos_candidatos' ? (
                  // Compatibilidad hacia atrás: carga desde tipos_candidatos
                  isLoadingTiposCandidatos ? (
                    <SelectItem value="loading" disabled>
                      Cargando opciones...
                    </SelectItem>
                  ) : (
                    tiposCandidatos.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.nombre}>
                        {tipo.nombre}
                      </SelectItem>
                    ))
                  )
                ) : (
                  // Usar opciones estáticas
                  campo.opciones?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case "textarea":
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <Label htmlFor={fieldId} className="text-sm font-medium block">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50 text-sm min-h-[60px] max-h-[100px] resize-none w-full"
              rows={2}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <div className="flex items-center space-x-2">
              <Checkbox id={fieldId} disabled />
              <Label htmlFor={fieldId} className="text-sm font-medium">
                {campo.label} {isRequired && <span className="text-red-500">*</span>}
              </Label>
            </div>
          </div>
        );

      default:
        return (
          <div key={fieldId} className="space-y-2 w-full">
            <Label htmlFor={fieldId} className="text-sm font-medium block">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="text"
              placeholder={`Campo ${campo.tipo}`}
              disabled
              className="bg-gray-50 text-sm w-full"
            />
          </div>
        );
    }
  };

  const renderSection = (seccion: any) => {
    return (
      <div key={seccion.titulo || seccion.id} className="space-y-4 p-4 border rounded-lg bg-gray-50 w-full">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          {seccion.titulo}
        </h3>
        
        <div className="flex flex-wrap gap-4 w-full">
          {seccion.campos?.map((campo: any) => {
            // Normalizar dimensiones grandes a valores manejables
            let dimension = parseInt(campo.dimension) || 1;
            
            // Si la dimensión es muy grande, la normalizamos
            if (dimension > 12) {
              if (dimension >= 200) {
                dimension = 12; // Ancho completo para campos muy grandes
              } else if (dimension >= 100) {
                dimension = 8; // 2/3 del ancho para campos grandes
              } else if (dimension >= 50) {
                dimension = 6; // 1/2 del ancho para campos medianos
              } else if (dimension >= 20) {
                dimension = 6; // 1/2 del ancho para campos pequeños-grandes
              }
            }

            // Calcular el ancho del campo basado en la dimensión normalizada
            let fieldWidth = "w-full";
            if (dimension >= 12) {
              fieldWidth = "w-full";
            } else if (dimension >= 8) {
              fieldWidth = "w-full md:w-2/3 lg:w-2/3";
            } else if (dimension >= 6) {
              fieldWidth = "w-full md:w-1/2 lg:w-1/2";
            } else if (dimension >= 4) {
              fieldWidth = "w-full md:w-1/3 lg:w-1/3";
            } else {
              fieldWidth = "w-full md:w-1/4 lg:w-1/4";
            }

            return (
              <div 
                key={campo.nombre || campo.id} 
                className={`${fieldWidth} flex-shrink-0`}
              >
                {renderField(campo)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">Vista Previa del Formulario</h3>
        <p className="text-sm text-gray-600">
          Estructura de la plantilla con secciones
        </p>
      </div>

      <div className="space-y-6 w-full">
        {estructuraFormulario.secciones?.map(renderSection)}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>* Campos obligatorios</p>
        <p>Los campos están deshabilitados en la vista previa</p>
      </div>
    </div>
  );
}

// Componente legacy para compatibilidad
function LegacyTemplatePreview({ configuracion }: { configuracion: Record<string, { visible: boolean; required: boolean }> }) {
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

  const renderField = (campo: any) => {
    const config = configuracion[campo.key];
    if (!config?.visible) return null;

    const isRequired = config.required;

    switch (campo.type) {
      case "text":
      case "email":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.key}
              type={campo.type}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50 text-sm"
            />
          </div>
        );

      case "date":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <CustomDatePicker
              value={null}
              onChange={() => {}}
              placeholder="Seleccionar fecha"
              disabled={true}
              className="bg-gray-50 text-sm"
            />
          </div>
        );

      case "select":
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select disabled>
              <SelectTrigger className="bg-gray-50 text-sm">
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
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={campo.key}
              placeholder={`Ingrese ${campo.label.toLowerCase()}`}
              disabled
              className="bg-gray-50 text-sm min-h-[60px] max-h-[100px] resize-none"
              rows={2}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">Vista Previa del Formulario</h3>
        <p className="text-sm text-gray-600">
          Campos configurados para esta plantilla
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {CAMPOS_DISPONIBLES.map(renderField)}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>* Campos obligatorios</p>
        <p>Los campos están deshabilitados en la vista previa</p>
      </div>
    </div>
  );
} 

