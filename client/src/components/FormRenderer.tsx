import React from 'react';
import { Users, Activity, User, Brain, TestTube, Clipboard, FileText, Building2, DollarSign, Clock, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';
import { useDatabaseData } from '@/hooks/useDatabaseData';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';

interface FormRendererProps {
  estructura: any;
  hideFieldLabels?: boolean;
  initialData?: Record<string, any>; // Datos iniciales para edición
  onSave?: (formData: Record<string, any>) => void; // Callback para guardar
  onCancel?: () => void; // Callback para cancelar
  showButtons?: boolean; // Mostrar botones de acción
  readOnly?: boolean; // Nuevo: modo solo lectura
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  estructura, 
  hideFieldLabels, 
  initialData = {}, 
  onSave,
  onCancel, 
  showButtons = false,
  readOnly = false 
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData);

  // Función helper para calcular la fecha mínima
  const calculateMinDate = (diasMinimos: number | string): Date | undefined => {
    // Convertir a número si viene como string
    const diasMinimosNum = typeof diasMinimos === 'string' ? parseInt(diasMinimos, 10) : diasMinimos;
    
    if (!diasMinimosNum || diasMinimosNum <= 0 || isNaN(diasMinimosNum)) return undefined;
    
    const today = new Date();
    // Crear la fecha mínima sumando los días, normalizada al inicio del día
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diasMinimosNum);
    
    return minDate;
  };

  // Función helper para verificar si un día específico debe estar desactivado
  const isDateDisabled = (day: Date, diasMinimos: number | string): boolean => {
    // Convertir a número si viene como string
    const diasMinimosNum = typeof diasMinimos === 'string' ? parseInt(diasMinimos, 10) : diasMinimos;
    
    if (!diasMinimosNum || diasMinimosNum <= 0 || isNaN(diasMinimosNum)) return false;
    
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    
    // Desactivar días anteriores a hoy Y días del rango configurado
    const maxDisabledDate = new Date(todayOnly);
    maxDisabledDate.setDate(todayOnly.getDate() + diasMinimosNum); // +diasMinimos (no -1)
    
    // Desactivar si es anterior a hoy O está en el rango de días mínimos
    return dayOnly < todayOnly || (dayOnly >= todayOnly && dayOnly <= maxDisabledDate);
  };
  
  
  // Hook para obtener tipos de candidatos
  const { data: tiposCandidatos = [], isLoading: isLoadingTiposCandidatos } = useTiposCandidatos();
  
  // Hook para obtener datos dinámicos de la base de datos
  const { data: sucursales = [], isLoading: isLoadingSucursales } = useDatabaseData('gen_sucursales');
  const { data: centrosCosto = [], isLoading: isLoadingCentrosCosto } = useDatabaseData('centros_costo');
  const { data: ciudades = [], isLoading: isLoadingCiudades } = useDatabaseData('ciudades');

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
      case 'ciudades':
        return { data: ciudades, isLoading: isLoadingCiudades };
      default:
        return { data: [], isLoading: false };
    }
  };

  // Actualizar formData cuando cambien los datos iniciales
  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    if (readOnly) return; // No permitir cambios si está en modo de solo lectura
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      return newData;
    });
  };

  const handleSave = () => {
    // Validar campos antes de guardar
    const validationErrors: string[] = [];
    
    // Obtener los campos de la estructura
    const campos = estructura?.secciones?.flatMap((seccion: any) => seccion.campos || []) || [];
    
    // Validar cada campo
    campos.forEach((campo: any) => {
      const fieldName = campo.nombre;
      const value = formData[fieldName];
      
      // Validar campos requeridos
      if (campo.required && (!value || String(value).trim() === '')) {
        validationErrors.push(`El campo "${campo.label}" es requerido`);
      }
      
      // Validar minLength para campos tipo number o text (especialmente documento)
      if (campo.minLength && value) {
        const valueLength = String(value).length;
        if (valueLength < campo.minLength) {
          validationErrors.push(`El campo "${campo.label}" debe tener al menos ${campo.minLength} dígitos`);
        }
      }
      
      // Validar campos de tipo email
      if (campo.tipo === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          validationErrors.push(`El campo "${campo.label}" debe ser un email válido`);
        }
      }
    });
    
    // Si hay errores, mostrarlos y no guardar
    if (validationErrors.length > 0) {
      toast.error('Errores de validación', {
        description: validationErrors.map((error, index) => (
          <div key={index}>• {error}</div>
        )) as any,
        duration: 6000,
      });
      return;
    }
    
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
          {tipo === 'text' && !(fieldName === 'cargo' || label.toLowerCase().includes('cargo')) && (
            <input
              type="text"
              value={value}
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
            />
          )}

          {tipo === 'textarea' && (
            <textarea
              value={value}
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
            />
          )}

          {tipo === 'date' && (
            <CustomDatePicker
              value={value ? new Date(value + 'T00:00:00') : null}
              onChange={(date) => {
                if (date) {
                  // Crear fecha local sin problemas de zona horaria
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateString = `${year}-${month}-${day}`;
                  handleFieldChange(fieldName, dateString);
                } else {
                  handleFieldChange(fieldName, '');
                }
              }}
              placeholder={String(placeholder)}
              className="w-full max-w-md"
              disabled={readOnly}
              minDate={calculateMinDate(campo.diasMinimos)}
              diasMinimos={campo.diasMinimos}
              isDateDisabled={isDateDisabled}
            />
          )}

          {tipo === 'select' && (
            <select 
              value={value}
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
            >
              <option value="">{String(placeholder)}</option>
              {campo.dataSource === 'database' ? (
                // Cargar opciones desde la base de datos usando la nueva configuración
                (() => {
                  const { data: dynamicData, isLoading: isLoadingDynamic } = getDynamicData(campo);
                  if (isLoadingDynamic) {
                    return <option value="" disabled>Cargando opciones...</option>;
                  }
                  return dynamicData.map((item: any) => {
                    const displayValue = item[campo.databaseField || 'nombre'];
                    const selectValue = item[campo.databaseValueField || 'nombre'];
                    return (
                      <option key={item.id} value={selectValue}>
                        {displayValue}
                      </option>
                    );
                  });
                })()
              ) : campo.options === 'tipos_candidatos' ? (
                // Compatibilidad hacia atrás: carga desde tipos_candidatos
                tiposCandidatos.map((tipo) => (
                  <option key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </option>
                ))
              ) : (
                // Usar opciones estáticas
                renderSelectOptions(campo.opciones)
              )}
            </select>
          )}

          {/* Campo cargo como texto - convertirlo automáticamente a select */}
          {tipo === 'text' && (fieldName === 'cargo' || label.toLowerCase().includes('cargo')) && (
            <select 
              value={value}
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
            >
              <option value="">Seleccione su cargo</option>
              {tiposCandidatos.map((tipo) => (
                <option key={tipo.id} value={tipo.nombre}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          )}

          {tipo === 'checkbox' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                disabled={readOnly}
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
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
            />
          )}

          {tipo === 'email' && (
            <input
              type="email"
              value={value}
              onChange={readOnly ? undefined : (e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={String(placeholder)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              disabled={readOnly}
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
                      onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={readOnly}
                    />
                  )}

                  {campo.tipo === 'textarea' && (
                    <textarea
                      value={formData[campo.nombre] || ''}
                      onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={readOnly}
                    />
                  )}

                  {campo.tipo === 'date' && (
                    <CustomDatePicker
                      value={formData[campo.nombre] ? new Date(formData[campo.nombre] + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          // Crear fecha local sin problemas de zona horaria
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateString = `${year}-${month}-${day}`;
                          handleFieldChange(campo.nombre, dateString);
                        } else {
                          handleFieldChange(campo.nombre, '');
                        }
                      }}
                      placeholder={String(campo.placeholder || 'Seleccione una fecha')}
                      className="w-full"
                      disabled={readOnly}
                      minDate={calculateMinDate(campo.diasMinimos)}
                      diasMinimos={campo.diasMinimos}
                      isDateDisabled={isDateDisabled}
                    />
                  )}

                  {campo.tipo === 'select' && (
                    <select 
                      value={formData[campo.nombre] || ''}
                      onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={readOnly}
                    >
                      <option value="">{String(campo.placeholder || 'Seleccione una opción')}</option>
                      {campo.dataSource === 'database' ? (
                        // Cargar opciones desde la base de datos usando la nueva configuración
                        (() => {
                          const { data: dynamicData, isLoading: isLoadingDynamic } = getDynamicData(campo);
                          if (isLoadingDynamic) {
                            return <option value="" disabled>Cargando opciones...</option>;
                          }
                          return dynamicData.map((item: any) => {
                            const displayValue = item[campo.databaseField || 'nombre'];
                            const selectValue = item[campo.databaseValueField || 'nombre'];
                            return (
                              <option key={item.id} value={selectValue}>
                                {displayValue}
                              </option>
                            );
                          });
                        })()
                      ) : campo.opciones === 'tipos_candidatos' ? (
                        // Compatibilidad hacia atrás: carga desde tipos_candidatos
                        tiposCandidatos.map((tipo) => (
                          <option key={tipo.id} value={tipo.nombre}>
                            {tipo.nombre}
                          </option>
                        ))
                      ) : (
                        // Usar opciones estáticas
                        renderSelectOptions(campo.opciones)
                      )}
                    </select>
                  )}

                  {campo.tipo === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[campo.nombre] || false}
                        onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        disabled={readOnly}
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
                      onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={readOnly}
                    />
                  )}

                  {campo.tipo === 'email' && (
                    <input
                      type="email"
                      value={formData[campo.nombre] || ''}
                      onChange={readOnly ? undefined : (e) => handleFieldChange(campo.nombre, e.target.value)}
                      placeholder={String(campo.placeholder || `Ingrese ${(campo.label || '').toLowerCase()}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={readOnly}
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

