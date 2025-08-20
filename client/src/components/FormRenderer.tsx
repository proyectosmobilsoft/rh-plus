import React from 'react';
import { Users, Activity, User, Brain, TestTube, Clipboard, FileText, Building2, DollarSign, Clock, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormRendererProps {
  estructura: any;
  hideFieldLabels?: boolean;
  initialData?: Record<string, any>; // Datos iniciales para edición
  onSave?: (formData: Record<string, any>) => void; // Callback para guardar
  onCancel?: () => void; // Callback para cancelar
  showButtons?: boolean; // Mostrar botones de acción
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  estructura, 
  hideFieldLabels, 
  initialData = {}, 
  onSave, 
  onCancel, 
  showButtons = false 
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData);

  // Actualizar formData cuando cambien los datos iniciales
  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      return newData;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Componente de botones de acción
  const renderActionButtons = () => {
    if (!showButtons) return null;

    return (
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700"
        >
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    );
  };

  // Función para renderizar opciones de select de manera segura
  const renderSelectOptions = (opciones: any) => {
    if (!opciones || !Array.isArray(opciones)) {
      return null;
    }

    return opciones.map((opcion: any, opcionIndex: number) => {
      // Si la opción es un objeto con label y valor
      if (typeof opcion === 'object' && opcion !== null) {
        const label = opcion.label || opcion.nombre || opcion.valor || String(opcion);
        const value = opcion.valor || opcion.value || opcion.id || String(opcion);
        return (
          <option key={opcionIndex} value={value}>
            {label}
          </option>
        );
      }
      
      // Si la opción es un string o número
      return (
        <option key={opcionIndex} value={String(opcion)}>
          {String(opcion)}
        </option>
      );
    });
  };

  const renderField = (campo: any, index: number) => {
    const fieldName = campo.nombre || `campo_${index}`;
    const value = formData[fieldName] || '';

    // Validar que el campo tenga las propiedades necesarias
    if (!campo || typeof campo !== 'object') {
      return null;
    }

    const label = campo.label || campo.nombre || `Campo ${index}`;
    const tipo = campo.tipo || 'text';
    const required = campo.required || false;
    const placeholder = campo.placeholder || `Ingrese ${label.toLowerCase()}`;

    return (
      <div key={index} className="space-y-2">
        {/* Label del campo */}
        <div className="flex items-center gap-2">
          <label className="font-medium text-sm text-gray-700">
            {String(label)}
            {!hideFieldLabels && required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {!hideFieldLabels && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {String(tipo)}
            </span>
          )}
        </div>

        {/* Renderizado del campo según su tipo */}
        <div className="ml-4">
          {tipo === 'text' && (
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            />
          )}

          {tipo === 'textarea' && (
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            />
          )}

          {tipo === 'date' && (
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            />
          )}

          {tipo === 'select' && (
            <select 
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            >
              <option value="">{String(placeholder)}</option>
              {renderSelectOptions(campo.opciones)}
            </select>
          )}

          {tipo === 'checkbox' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {String(label)}
              </span>
            </div>
          )}

          {tipo === 'number' && (
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            />
          )}

          {tipo === 'email' && (
            <input
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            />
          )}

          {/* Información adicional del campo */}
          <div className="mt-1 text-xs text-gray-500">
            {!hideFieldLabels && required && <span className="text-red-500">Campo requerido</span>}
            {!hideFieldLabels && !required && <span className="text-gray-400">Campo opcional</span>}
            {campo.validacion && (
              <span className="ml-2">
                • Validación: {String(campo.validacion)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSeccion = (seccion: any, seccionIndex: number) => {
    // Validar que la sección tenga las propiedades necesarias
    if (!seccion || typeof seccion !== 'object') {
      return null;
    }

    const titulo = seccion.titulo || `Sección ${seccionIndex}`;
    const icono = seccion.icono || 'FileText';
    const campos = seccion.campos || [];

    return (
      <div key={seccionIndex} className="mb-6 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm w-full">
        {/* Título de la sección */}
        <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
          {icono === 'Users' && <Users className="w-5 h-5 text-blue-600" />}
          {icono === 'Stethoscope' && <Activity className="w-5 h-5 text-green-600" />}
          {icono === 'Activity' && <Activity className="w-5 h-5 text-orange-600" />}
          {icono === 'User' && <User className="w-5 h-5 text-blue-600" />}
          {icono === 'Brain' && <Brain className="w-5 h-5 text-purple-600" />}
          {icono === 'TestTube' && <TestTube className="w-5 h-5 text-red-600" />}
          {icono === 'Clipboard' && <Clipboard className="w-5 h-5 text-green-600" />}
          {icono === 'Building' && <Building2 className="w-5 h-5 text-green-600" />}
          {icono === 'DollarSign' && <DollarSign className="w-5 h-5 text-orange-600" />}
          {icono === 'Clock' && <Clock className="w-5 h-5 text-red-600" />}
          {!icono && <FileText className="w-5 h-5 text-gray-600" />}
          {String(titulo)}
        </h4>

        {/* Campos de la sección con grid dinámico */}
        <div className="grid gap-4 grid-cols-12 w-full">
          {Array.isArray(campos) && campos
            .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ordenar por order
            .map((campo: any, campoIndex: number) => {
            // Calcular el colspan del campo de manera simple y directa
            let fieldWidth = 'col-span-12'; // Por defecto ocupa toda la fila
            let customStyle: { 
              width?: string;
              maxWidth?: string;
            } = {}; // Para valores problemáticos
            
            // Función para calcular el ancho del campo
            const calcularAnchoCampo = (span: number) => {
              if ([5, 6, 7, 9, 10, 11].includes(span)) {
                // Para valores problemáticos, usar width personalizado con un poco menos de ancho
                const porcentaje = (span / 12) * 100 * 0.9; // Reducir un 10% del ancho
                return {
                  fieldWidth: 'col-span-12',
                  customStyle: {
                    width: `${porcentaje}%`,
                    maxWidth: `${porcentaje}%`
                  }
                };
              } else {
                // Para valores que funcionan bien con Tailwind
                return {
                  fieldWidth: `col-span-${span}`,
                  customStyle: {}
                };
              }
            };
            
            if (campo.colspan) {
              if (typeof campo.colspan === 'string') {
                if (campo.colspan.startsWith('col-span-')) {
                  // Extraer el número de la clase col-span-X
                  const match = campo.colspan.match(/col-span-(\d+)/);
                  if (match) {
                    const span = parseInt(match[1]);
                    const resultado = calcularAnchoCampo(span);
                    fieldWidth = resultado.fieldWidth;
                    customStyle = resultado.customStyle;
                  } else {
                    fieldWidth = campo.colspan;
                  }
                } else if (campo.colspan.match(/^\d+$/)) {
                  // Si es un número en string, convertirlo
                  const span = parseInt(campo.colspan);
                  if (span >= 1 && span <= 12) {
                    const resultado = calcularAnchoCampo(span);
                    fieldWidth = resultado.fieldWidth;
                    customStyle = resultado.customStyle;
                  }
                } else {
                  // Si es otro string, intentar usarlo como está
                  fieldWidth = campo.colspan;
                }
              } else if (typeof campo.colspan === 'number') {
                const span = Math.min(Math.max(campo.colspan, 1), 12);
                const resultado = calcularAnchoCampo(span);
                fieldWidth = resultado.fieldWidth;
                customStyle = resultado.customStyle;
              }
            } else if (campo.dimension) {
              const span = Math.min(Math.max(campo.dimension, 1), 12);
              const resultado = calcularAnchoCampo(span);
              fieldWidth = resultado.fieldWidth;
              customStyle = resultado.customStyle;
            } else if (campo.gridColumnSpan) {
              const match = campo.gridColumnSpan.match(/span (\d+)/);
              if (match) {
                const span = Math.min(Math.max(parseInt(match[1]), 1), 12);
                const resultado = calcularAnchoCampo(span);
                fieldWidth = resultado.fieldWidth;
                customStyle = resultado.customStyle;
              }
            }
            
            return (
              <div 
                key={campoIndex} 
                className={`space-y-2 ${fieldWidth}`}
                style={customStyle}
              >
                {/* Label del campo */}
                <div className="flex items-center gap-2">
                  <label className="font-medium text-sm text-gray-700">
                    {String(campo.label || campo.nombre || `Campo ${campoIndex}`)}
                    {!hideFieldLabels && campo.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {!hideFieldLabels && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {String(campo.tipo || 'text')}
                    </span>
                  )}
                  {!hideFieldLabels && (
                    <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                      {campo.colspan || campo.dimension || '12'} cols
                    </span>
                  )}
                </div>

                {/* Renderizado del campo según su tipo */}
                <div className="ml-2">
                  {campo.tipo === 'text' && (
                    <input
                      type="text"
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  )}

                  {campo.tipo === 'textarea' && (
                    <textarea
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  )}

                  {campo.tipo === 'date' && (
                    <input
                      type="date"
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  )}

                  {campo.tipo === 'select' && (
                    <select 
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">{String(campo.placeholder || 'Seleccione una opción')}</option>
                      {renderSelectOptions(campo.opciones)}
                    </select>
                  )}

                  {campo.tipo === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[campo.nombre] || false}
                        onChange={(e) => handleFieldChange(campo.nombre, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">
                        {String(campo.label || campo.nombre)}
                      </span>
                    </div>
                  )}

                  {campo.tipo === 'number' && (
                    <input
                      type="number"
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}

                  {campo.tipo === 'email' && (
                    <input
                      type="email"
                      value={formData[campo.nombre] || ''}
                      onChange={(e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}

                  {/* Información adicional del campo */}
                  <div className="mt-1 text-xs text-gray-500">
                    {!hideFieldLabels && campo.required && <span className="text-red-500">Campo requerido</span>}
                    {!hideFieldLabels && !campo.required && <span className="text-gray-400">Campo opcional</span>}
                    {campo.validacion && (
                      <span className="ml-2">
                        • Validación: {String(campo.validacion)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!estructura) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No hay estructura definida</p>
        <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
      </div>
    );
  }

  // Si tiene secciones, renderizar por secciones
  if (estructura.secciones && Array.isArray(estructura.secciones) && estructura.secciones.length > 0) {
    return (
      <div className="space-y-6">
        {estructura.secciones.map((seccion: any, index: number) => renderSeccion(seccion, index))}
        {renderActionButtons()}
      </div>
    );
  }

  // Si tiene campos directos (estructura antigua)
  if (estructura.campos && Array.isArray(estructura.campos) && estructura.campos.length > 0) {
    return (
      <div className="space-y-6">
        {estructura.campos.map((campo: any, index: number) => renderField(campo, index))}
        {renderActionButtons()}
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium">No hay campos definidos</p>
      <p className="text-sm">Esta plantilla no tiene estructura de formulario configurada</p>
    </div>
  );
};

export default FormRenderer; 