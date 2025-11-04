import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { plantillasService } from '@/services/plantillasService';
import { useLoading } from '@/contexts/LoadingContext';
import { useTiposCandidatos } from '@/hooks/useTiposCandidatos';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Plus, Edit3, Trash2, Save, X, Eye, FileText, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Normaliza opciones desde string | string[] a string[] seguro
const toOptionsArray = (options?: string | string[]): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options.map((o) => String(o).trim()).filter(Boolean);
  return String(options)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
};

// Tipos fuertes para evitar never[] e implícitos any
type FormField = {
  id: string;
  type: string;
  label: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  order: number;
  dimension: number;
  options?: string | string[];
  dataSource?: 'static' | 'database';
  databaseTable?: string;
  databaseField?: string;
  databaseValueField?: string;
  activo?: boolean;
  // Nueva propiedad para campos de fecha
  diasMinimos?: number;
  [key: string]: any;
};

type FormSection = {
  id: string;
  titulo: string;
  layout?: string;
  campos: FormField[];
  activo?: boolean;
  [key: string]: any;
};

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'date', label: 'Fecha' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'title', label: 'Título' },
  { value: 'foreignKey', label: 'Llave Foránea (FK)' },
  { value: 'percent', label: 'Porcentaje (%)' },
];

// Tablas disponibles para campos select con datos dinámicos
const DATABASE_TABLES = [
  { value: 'tipos_candidatos', label: 'Tipos de Candidatos', displayField: 'nombre', valueField: 'id' },
  { value: 'gen_sucursales', label: 'Sucursales', displayField: 'nombre', valueField: 'id' },
  { value: 'centros_costo', label: 'Centros de Costo', displayField: 'nombre', valueField: 'id' },
  { value: 'ciudades', label: 'Ciudades', displayField: 'nombre', valueField: 'id' },
];

const createDefaultField = (): FormField => ({
  id: uuidv4(),
  type: 'text',
  label: '',
  nombre: '', // Se generará automáticamente cuando se escriba el label
  placeholder: '',
  required: false,
  order: 1,
  dimension: 12,
  options: '',
  dataSource: 'static',
  databaseTable: '',
  databaseField: 'nombre',
  databaseValueField: 'nombre',
  activo: true,
  diasMinimos: undefined,
});

const createTemporalField = (): FormField => ({
  id: uuidv4(),
  type: 'select',
  label: 'Temporal',
  nombre: 'temporalaingresar',
  placeholder: 'Seleccione una opción',
  required: false,
  order: 4,
  dimension: 6,
  options: '', // Sin opciones por defecto - el usuario las agregará
  dataSource: 'static',
  databaseTable: '',
  databaseField: 'nombre',
  databaseValueField: 'nombre',
  activo: true,
  diasMinimos: undefined,
  disabled: false, // Campo habilitado - completamente funcional
  isSystemField: true, // Campo del sistema - no editable
  allowOptionsEdit: true, // Permitir editar opciones
});

const createDefaultSection = (): FormSection => ({
  id: uuidv4(),
  titulo: '',
  layout: 'grid-cols-12',
  campos: [],
  activo: true,
});

function reorder(list: any[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((f: any, i: number) => ({ ...f, order: i + 1 }));
}

const FormBuilder: React.FC<{ 
  precargados?: any[], 
  readOnly?: boolean,
  onSave?: (data: { nombre: string, descripcion: string, estructura_formulario: any }) => Promise<void>,
  initialName?: string,
  initialDescription?: string,
  onFieldsChange?: (fields: any[]) => void,
  hideInternalSaveButton?: boolean,
  isEditing?: boolean,
  onNameChange?: (name: string) => void,
  onDescriptionChange?: (description: string) => void
}> = ({ precargados, readOnly = false, onSave, initialName = '', initialDescription = '', onFieldsChange, hideInternalSaveButton = false, isEditing = false, onNameChange, onDescriptionChange }) => {
  const [formName, setFormName] = useState(initialName);
  const [formDesc, setFormDesc] = useState(initialDescription);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [currentSection, setCurrentSection] = useState<FormSection>(createDefaultSection());
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [currentField, setCurrentField] = useState<FormField>(createDefaultField());
  const [showJson, setShowJson] = useState(false);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number | null>(null);
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null);
  const [selectedFieldForMove, setSelectedFieldForMove] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("seccion");
  const { startLoading, stopLoading } = useLoading();
  
  // Hook para obtener tipos de candidatos
  const { data: tiposCandidatos = [], isLoading: isLoadingTiposCandidatos } = useTiposCandidatos();

  const navigate = !readOnly ? (() => { try { return useNavigate(); } catch { return () => { }; } })() : null;

  // Función para detectar y marcar campos del sistema
  const markSystemFields = (campos: any[]) => {
    return campos.map((campo: any) => {
      const fieldName = campo.name || campo.nombre || '';
      const fieldLabel = campo.label || '';
      
      // Detectar campos del sistema por nombre o label
      const isSystemField = 
        fieldName === 'documento' || 
        fieldName === 'correo_electronico' || 
        fieldName === 'cargo' ||
        fieldName === 'temporalaingresar' ||
        fieldName === 'temporal' ||
        fieldLabel.toLowerCase().includes('documento') ||
        fieldLabel.toLowerCase().includes('correo') ||
        fieldLabel.toLowerCase().includes('cargo') ||
        fieldLabel.toLowerCase().includes('temporal');
      
      if (isSystemField && !campo.isSystemField) {
        return {
          ...campo,
          isSystemField: true,
          // Si es campo temporal, agregar allowOptionsEdit
          allowOptionsEdit: (fieldName === 'temporalaingresar' || fieldName === 'temporal') ? true : campo.allowOptionsEdit
        };
      }
      
      // Si ya es campo del sistema pero es temporal y no tiene allowOptionsEdit, agregarlo
      if (campo.isSystemField && (fieldName === 'temporalaingresar' || fieldName === 'temporal') && !campo.allowOptionsEdit) {
        return {
          ...campo,
          allowOptionsEdit: true
        };
      }
      
      return campo;
    });
  };

  // Función para migrar campos "cargo" existentes a select con tipos_candidatos
  const migrateCargoFields = (campos: any[]) => {
    return campos.map((campo: any) => {
      // Detectar campos "cargo" y asegurar que tengan la configuración correcta
      if (
        campo.name === 'cargo' || campo.nombre === 'cargo' || 
        campo.label?.toLowerCase().includes('cargo')
      ) {
        
        // Si es de tipo texto, convertirlo a select
        if (campo.type === 'text' || campo.tipo === 'text') {
          return {
            ...campo,
            type: 'select',
            tipo: 'select',
            options: 'tipos_candidatos',
            opciones: 'tipos_candidatos',
            dataSource: 'database',
            databaseTable: 'tipos_candidatos',
            databaseField: 'nombre',
            databaseValueField: 'id',
            placeholder: 'Seleccione su cargo',
            isSystemField: true // Campo del sistema - solo editable tamaño y orden
          };
        }
        
        // Si ya es select pero no tiene configuración de base de datos, actualizarlo
        if (campo.type === 'select' || campo.tipo === 'select') {
          return {
            ...campo,
            dataSource: 'database',
            databaseTable: 'tipos_candidatos',
            databaseField: 'nombre',
            databaseValueField: 'id',
            options: 'tipos_candidatos', // Compatibilidad hacia atrás
            opciones: 'tipos_candidatos',
            placeholder: 'Seleccione su cargo',
            isSystemField: true // Campo del sistema - solo editable tamaño y orden
          };
        }
      }
      return campo;
    });
  };

  // Inicializar campos precargados con IDs únicos
  useEffect(() => {
    if (isInitialized) return; // Evitar ejecución múltiple
    
    let dataToProcess: any[] | null = null;
    if (Array.isArray(precargados)) {
      dataToProcess = precargados;
    } else if (precargados && typeof precargados === 'object' && (precargados as any).secciones) {
      dataToProcess = (precargados as any).secciones as any[];
    }


    if (dataToProcess && dataToProcess.length > 0) {
      // Si los datos precargados ya tienen estructura de secciones, usarlos directamente
      if (dataToProcess[0] && (dataToProcess[0] as any).campos) {
        const processedSections = dataToProcess.map((section: any) => ({
          ...section,
          id: section.id || uuidv4(),
          activo: section.activo !== false,
          campos: markSystemFields(migrateCargoFields(section.campos.map((f: any) => {
            let dimension = f.dimension;
            if (!dimension && f.gridColumnSpan) {
              const match = f.gridColumnSpan.match(/span (\d+)/);
              dimension = match ? parseInt(match[1]) : 12;
            }
            if (!dimension) dimension = 12;

            // Validar que la dimensión no exceda 12
            if (dimension > 12) {
              dimension = 12;
            } else if (dimension < 1) {
              dimension = 1;
            }
            return {
              ...f,
              id: f.id || uuidv4(),
              activo: f.activo !== false,
              order: f.order || 1,
              dimension,
              type: f.tipo || f.type || 'text',
              label: f.label || '',
              name: f.nombre || f.name || '',
              placeholder: f.placeholder || '',
              required: f.required || false,
              options: f.opciones || f.options || ''
            };
          })))
        }));
        // Aplicar corrección de nombres duplicados
        const fixedSections = fixDuplicateNames(processedSections);
        setSections(fixedSections);
      } else {
        // Migración: convertir campos planos a una sección por defecto
        const camposActivos = dataToProcess.filter((f: any) => f.activo !== false);
        if (camposActivos.length > 0) {
          const defaultSection = createDefaultSection();
          defaultSection.titulo = 'Campos del Formulario';
          defaultSection.campos = markSystemFields(migrateCargoFields(camposActivos.map((f: any) => ({
            ...f,
            id: f.id || uuidv4(),
            activo: f.activo !== false,
            order: f.order || 1
          }))));
          // Aplicar corrección de nombres duplicados
          const fixedSections = fixDuplicateNames([defaultSection]);
          setSections(fixedSections);
        }
      }
    } else {
      // Si no hay datos, crear sección por defecto con campos básicos
      const defaultSection = createDefaultSection();
      defaultSection.titulo = 'Datos Personales';
      defaultSection.campos = [
        {
          id: uuidv4(),
          type: 'number',
          label: 'Documento',
          name: 'documento',
          placeholder: 'Ingrese su número de documento',
          required: true,
          order: 1,
          dimension: 6,
          options: '',
          activo: true,
          isSystemField: true // Campo del sistema - no editable
        },
        {
          id: uuidv4(),
          type: 'email',
          label: 'Correo Electrónico',
          name: 'correo_electronico',
          placeholder: 'Ingrese su correo electrónico',
          required: true,
          order: 2,
          dimension: 6,
          options: '',
          activo: true,
          isSystemField: true // Campo del sistema - no editable
        },
        {
          id: uuidv4(),
          type: 'select',
          label: 'Cargo',
          name: 'cargo',
          placeholder: 'Seleccione su cargo',
          required: true,
          order: 3,
          dimension: 12,
          options: 'tipos_candidatos', // Compatibilidad hacia atrás
          dataSource: 'database',
          databaseTable: 'tipos_candidatos',
          databaseField: 'nombre',
          databaseValueField: 'id',
          activo: true,
          isSystemField: true // Campo del sistema - solo editable tamaño y orden
        },
        createTemporalField() // Campo temporal por defecto - ahora debajo de cargo
      ];
      setSections([defaultSection]);
    }
    
    setIsInitialized(true); // Marcar como inicializado
  }, [precargados, isInitialized]);

  // Inicializar nombre y descripción cuando cambien las props
  useEffect(() => {
    setFormName(initialName);
    setFormDesc(initialDescription);
  }, [initialName, initialDescription]);

  // Notificar cambios en el nombre y descripción al componente padre
  useEffect(() => {
    if (onNameChange && formName !== initialName) {
      onNameChange(formName);
    }
  }, [formName, onNameChange, initialName]);

  useEffect(() => {
    if (onDescriptionChange && formDesc !== initialDescription) {
      onDescriptionChange(formDesc);
    }
  }, [formDesc, onDescriptionChange, initialDescription]);

  // Notificar cambios en los campos
  useEffect(() => {
    if (onFieldsChange && sections.length > 0 && isInitialized) {
      // Solo notificar cambios si hay secciones, no es la inicialización y ya se inicializó
      const allFields = sections.flatMap(section => 
        section.campos.filter(f => f.activo !== false)
      );
      onFieldsChange(allFields);
    }
  }, [sections, onFieldsChange, isInitialized]);

  // Función para generar nombre automático basado en el label
  const generateFieldName = (label: string): string => {
    return label
      .trim()
      // Convertir tildes y caracteres especiales
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/Á/g, 'a')
      .replace(/É/g, 'e')
      .replace(/Í/g, 'i')
      .replace(/Ó/g, 'o')
      .replace(/Ú/g, 'u')
      .replace(/Ñ/g, 'n')
      // Convertir a minúsculas
      .toLowerCase()
      // Remover caracteres especiales que no sean letras, números o espacios
      .replace(/[^a-z0-9\s]/g, '')
      // Reemplazar espacios con guiones bajos
      .replace(/\s+/g, '_')
      // Reemplazar múltiples guiones bajos con uno solo
      .replace(/_{2,}/g, '_')
      // Remover guiones bajos al inicio y final
      .replace(/^_|_$/g, '');
  };

  // Función para corregir nombres duplicados en una plantilla
  const fixDuplicateNames = (sections: FormSection[]): FormSection[] => {
    const usedNames = new Set<string>();
    
    return sections.map(section => ({
      ...section,
      campos: section.campos.map(field => {
        let finalName = field.nombre || '';
        
        // Si no tiene nombre o está vacío, generarlo del label
        if (!finalName && field.label) {
          finalName = generateFieldName(field.label);
        }
        
        // Si el nombre ya está en uso, agregar un sufijo numérico
        let counter = 1;
        let uniqueName = finalName;
        while (usedNames.has(uniqueName)) {
          uniqueName = `${finalName}_${counter}`;
          counter++;
        }
        
        usedNames.add(uniqueName);
        
        return {
          ...field,
          nombre: uniqueName
        };
      })
    }));
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    // Si se está cambiando el tipo de campo a 'number' y es un campo de documento, agregar minLength automáticamente
    if (name === 'type' && newValue === 'number') {
      const fieldName = currentField.nombre?.toLowerCase() || currentField.label?.toLowerCase() || '';
      if (fieldName.includes('documento') || fieldName.includes('cedula') || fieldName.includes('document')) {
        setCurrentField(prev => ({
          ...prev,
          [name]: newValue,
          minLength: 10
        }));
        return;
      }
    }
    
    // Si se está cambiando el nombre o label del campo y ya es tipo number, agregar minLength si es documento
    if ((name === 'nombre' || name === 'label') && currentField.type === 'number') {
      const newValueLower = String(newValue).toLowerCase();
      if (newValueLower.includes('documento') || newValueLower.includes('cedula') || newValueLower.includes('document')) {
        setCurrentField(prev => ({
          ...prev,
          [name]: newValue,
          minLength: 10
        }));
        return;
      }
    }

    // Validación especial para el campo dimension
    if (name === 'dimension') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        // Si el valor es mayor a 12, lo ajustamos automáticamente a 12
        if (numValue > 12) {
          newValue = 12;
        } else if (numValue < 1) {
          // También aseguramos que no sea menor a 1
          newValue = 1;
        } else {
          newValue = numValue;
        }
      }
    }

    // Si se está cambiando el label, generar automáticamente el nombre
    if (name === 'label' && value) {
      const generatedName = generateFieldName(value);
      setCurrentField(f => ({
        ...f,
        [name]: newValue,
        nombre: f.isSystemField ? f.name : generatedName, // Preservar nombre original para campos del sistema
      }));
    } else {
      setCurrentField(f => {
        // Para campos del sistema, preservar propiedades críticas
        if (f.isSystemField) {
          return {
        ...f,
        [name]: newValue,
            // Preservar propiedades críticas que no deben cambiar
            type: f.type,
            name: f.name,
            // Permitir actualizar opciones si allowOptionsEdit es true
            options: (name === 'options' && f.allowOptionsEdit) ? newValue : f.options,
            dataSource: f.dataSource,
            databaseTable: f.databaseTable,
            databaseField: f.databaseField,
            databaseValueField: f.databaseValueField,
            isSystemField: true,
            allowOptionsEdit: f.allowOptionsEdit // Preservar allowOptionsEdit
          };
        } else {
          return {
            ...f,
            [name]: newValue,
          };
        }
      });
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSection(s => ({
      ...s,
      [name]: value,
    }));
  };

  // Función para exportar la vista previa como imagen
  const exportAsImage = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Mejor calidad
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: previewRef.current.scrollWidth,
        height: previewRef.current.scrollHeight
      });
      
      // Crear un enlace de descarga
      const link = document.createElement('a');
      link.download = `plantilla-${formName || 'formulario'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('Error al exportar como imagen:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsExporting(false);
    }
  };

  const addSection = (e: React.FormEvent) => {
    e.preventDefault();
    setSections(prev => [...prev, { 
      ...currentSection, 
      id: uuidv4(),
      campos: []
    }]);
    setCurrentSection(createDefaultSection());
  };

  const addField = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSectionIdx !== null) {
      setSections(prev => {
        const updated = [...prev];
        updated[selectedSectionIdx] = {
          ...updated[selectedSectionIdx],
          campos: [...updated[selectedSectionIdx].campos, { 
            ...currentField, 
            id: uuidv4(), 
            order: updated[selectedSectionIdx].campos.length + 1,
            activo: true
          }]
        };
        return updated;
      });
      setCurrentField(createDefaultField());
    }
  };

  const selectSection = (idx: number) => {
    setSelectedSectionIdx(idx);
    setCurrentSection({ ...sections[idx] });
    setSelectedFieldIdx(null);
    setActiveTab("seccion"); // Cambiar al tab de edición de sección
  };

  const selectField = (sectionIdx: number, fieldIdx: number) => {
    setSelectedSectionIdx(sectionIdx);
    setSelectedFieldIdx(fieldIdx);
    const field = { ...sections[sectionIdx].campos[fieldIdx] };
    
    // Si el campo no tiene nombre o está vacío, generarlo automáticamente basado en el label
    if (!field.nombre && field.label) {
      field.nombre = generateFieldName(field.label);
    }
    
    setCurrentField(field);
    setActiveTab("campo"); // Cambiar al tab de edición de campo
  };

  const saveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSectionIdx !== null) {
      setSections(prev => {
        const updated = [...prev];
        updated[selectedSectionIdx] = { 
          ...currentSection,
          activo: currentSection.activo !== false
        };
        return updated;
      });
      setSelectedSectionIdx(null);
      setCurrentSection(createDefaultSection());
    }
  };

  const saveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSectionIdx !== null && selectedFieldIdx !== null) {
      setSections(prev => {
        const updated = [...prev];
        updated[selectedSectionIdx] = {
          ...updated[selectedSectionIdx],
          campos: updated[selectedSectionIdx].campos.map((f, i) => 
            i === selectedFieldIdx ? { 
              ...currentField,
              activo: currentField.activo !== false,
              // Para campos del sistema, preservar propiedades críticas
              ...(currentField.isSystemField && {
                type: f.type, // No permitir cambiar el tipo
                name: f.name, // No permitir cambiar el nombre
                options: currentField.allowOptionsEdit ? currentField.options : f.options, // Permitir cambiar opciones si allowOptionsEdit es true
                isSystemField: true, // Mantener la marca de campo del sistema
                allowOptionsEdit: currentField.allowOptionsEdit // Preservar allowOptionsEdit
              })
            } : f
          )
        };
        return updated;
      });
      setSelectedFieldIdx(null);
      setCurrentField(createDefaultField());
    }
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
    setSelectedSectionIdx(null);
    setCurrentSection(createDefaultSection());
  };

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => {
      const updated = [...prev];
      updated[sectionIdx] = {
        ...updated[sectionIdx],
        campos: updated[sectionIdx].campos.filter((_, i) => i !== fieldIdx)
          .map((f, i) => ({ ...f, order: i + 1 }))
      };
      return updated;
    });
    setSelectedFieldIdx(null);
    setCurrentField(createDefaultField());
  };

  const moveFieldToSection = (sourceSectionIdx: number, fieldIdx: number, targetSectionIdx: number) => {
    if (sourceSectionIdx === targetSectionIdx) return;
    
    setSections(prev => {
      const updated = [...prev];
      const fieldToMove = updated[sourceSectionIdx].campos[fieldIdx];
      
      // Remover el campo de la sección origen
      updated[sourceSectionIdx] = {
        ...updated[sourceSectionIdx],
        campos: updated[sourceSectionIdx].campos.filter((_, i) => i !== fieldIdx)
          .map((f, i) => ({ ...f, order: i + 1 }))
      };
      
      // Agregar el campo a la sección destino
      updated[targetSectionIdx] = {
        ...updated[targetSectionIdx],
        campos: [
          ...updated[targetSectionIdx].campos,
          {
            ...fieldToMove,
            order: updated[targetSectionIdx].campos.length + 1
          }
        ]
      };
      
      // Actualizar la selección para mostrar el campo en la nueva sección
      setSelectedSectionIdx(targetSectionIdx);
      setSelectedFieldIdx(updated[targetSectionIdx].campos.length - 1);
      
      return updated;
    });
  };

  // Estados para drag and drop mejorado
  const [draggedItem, setDraggedItem] = useState<{
    type: 'section' | 'field';
    sectionIdx: number;
    fieldIdx?: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    type: 'section' | 'field';
    sectionIdx: number;
    fieldIdx?: number;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSections, setPreviewSections] = useState<FormSection[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  // Función para calcular la posición de inserción basada en la posición del mouse
  const calculateInsertPosition = (e: React.DragEvent, sectionIdx: number): number => {
    const gridContainer = e.currentTarget.closest('.grid-container');
    if (!gridContainer) return 0;
    
    const rect = gridContainer.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Obtener todos los elementos de campo en el DOM actual
    const fieldElements = gridContainer.querySelectorAll('.field-draggable');
    
    let insertPos = 0;
    
    for (let i = 0; i < fieldElements.length; i++) {
      const fieldElement = fieldElements[i] as HTMLElement;
      const fieldRect = fieldElement.getBoundingClientRect();
      const fieldTop = fieldRect.top - rect.top;
      const fieldBottom = fieldRect.bottom - rect.top;
      const fieldCenter = fieldTop + (fieldRect.height / 2);
      
      // Si el mouse está en la mitad superior del campo, insertar antes
      if (mouseY >= fieldTop && mouseY < fieldCenter) {
        insertPos = i;
        break;
      }
      // Si el mouse está en la mitad inferior del campo, insertar después
      else if (mouseY >= fieldCenter && mouseY < fieldBottom) {
        insertPos = i + 1;
        break;
      }
      // Si el mouse está después de este campo, continuar
      else if (mouseY > fieldBottom) {
        insertPos = i + 1;
      }
    }
    
    return Math.min(insertPos, fieldElements.length);
  };

  // Función para generar preview de secciones con reorganización en tiempo real
  const generatePreview = (sourceSectionIdx: number, sourceFieldIdx: number, targetSectionIdx: number, targetFieldIdx?: number) => {
    const updated = [...sections];
    const sourceSection = updated[sourceSectionIdx];
    const targetSection = updated[targetSectionIdx];
    
    // Obtener el campo a mover
    const fieldToMove = sourceSection.campos[sourceFieldIdx];
    
    if (sourceSectionIdx === targetSectionIdx) {
      // Mover dentro de la misma sección - reorganizar en tiempo real
      const campos = [...sourceSection.campos];
      
      // Remover el campo de su posición actual
      const [draggedField] = campos.splice(sourceFieldIdx, 1);
      
      // Usar la posición exacta del mouse (targetFieldIdx ya viene calculada correctamente)
      let newPosition = targetFieldIdx || 0;
      
      // Asegurar que la posición esté dentro de los límites válidos
      newPosition = Math.max(0, Math.min(newPosition, campos.length));
      
      // Insertar en la nueva posición exacta
      campos.splice(newPosition, 0, {
        ...draggedField,
        isPreviewField: true, // Marcar como campo de preview
        isDragging: true // Marcar como campo siendo arrastrado
      });
      
      // Actualizar el orden de todos los campos
      const reorderedCampos = campos.map((campo, index) => ({
        ...campo,
        order: index + 1
      }));
      
      updated[sourceSectionIdx] = {
        ...sourceSection,
        campos: reorderedCampos
      };
    } else {
      // Mover entre secciones diferentes
      // Remover de la sección origen
      const newSourceCampos = sourceSection.campos.filter((_, i) => i !== sourceFieldIdx)
        .map((f, i) => ({ ...f, order: i + 1 }));
      
      // Agregar a la sección destino
      let newTargetCampos = [...targetSection.campos];
      if (targetFieldIdx !== undefined) {
        // Calcular la nueva posición correcta
        let newPosition = targetFieldIdx;
        
        // Asegurar que la posición esté dentro de los límites válidos
        newPosition = Math.max(0, Math.min(newPosition, newTargetCampos.length));
        
        // Insertar en posición específica
        newTargetCampos.splice(newPosition, 0, {
          ...fieldToMove,
          order: newPosition + 1,
          isPreviewField: true, // Marcar como campo de preview
          isDragging: true // Marcar como campo siendo arrastrado
        });
      } else {
        // Agregar al final
        newTargetCampos.push({
          ...fieldToMove,
          order: targetSection.campos.length + 1,
          isPreviewField: true, // Marcar como campo de preview
          isDragging: true // Marcar como campo siendo arrastrado
        });
      }
      
      // Actualizar el orden de todos los campos en la sección destino
      const reorderedTargetCampos = newTargetCampos.map((campo, index) => ({
        ...campo,
        order: index + 1
      }));
      
      updated[sourceSectionIdx] = {
        ...sourceSection,
        campos: newSourceCampos
      };
      
      updated[targetSectionIdx] = {
        ...targetSection,
        campos: reorderedTargetCampos
      };
    }
    
    return updated;
  };

  const onDragStart = (idx: number, isSection: boolean = false, sectionIdx?: number) => {
    if (isSection) {
      setDraggedItem({ type: 'section', sectionIdx: idx });
    } else {
      setDraggedItem({ 
        type: 'field', 
        sectionIdx: sectionIdx ?? selectedSectionIdx ?? 0, 
        fieldIdx: idx 
      });
    }
  };

  const onDragOver = (e: React.DragEvent, idx: number, isSection: boolean = false, sectionIdx?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Actualizar posición del mouse
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    if (isSection) {
      setDragOverTarget({ type: 'section', sectionIdx: idx });
      
      // Generar preview para campo moviéndose a sección
      if (draggedItem?.type === 'field') {
        const preview = generatePreview(
          draggedItem.sectionIdx, 
          draggedItem.fieldIdx!, 
          idx
        );
        setPreviewSections(preview);
        setPreviewMode(true);
      }
    } else {
      const targetSectionIdx = sectionIdx ?? selectedSectionIdx ?? 0;
      
      // Calcular posición exacta basada en el mouse
      const exactPosition = calculateInsertPosition(e, targetSectionIdx);
      setInsertPosition(exactPosition);
      
      setDragOverTarget({ 
        type: 'field', 
        sectionIdx: targetSectionIdx, 
        fieldIdx: exactPosition 
      });
      
      // Generar preview para campo moviéndose a posición específica
      if (draggedItem?.type === 'field') {
        const preview = generatePreview(
          draggedItem.sectionIdx, 
          draggedItem.fieldIdx!, 
          targetSectionIdx, 
          exactPosition
        );
        setPreviewSections(preview);
        setPreviewMode(true);
      }
    }
  };

  const onDrop = (e: React.DragEvent, idx: number, isSection: boolean = false, sectionIdx?: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    if (isSection) {
      if (draggedItem.type === 'section') {
        // Mover sección
        if (draggedItem.sectionIdx !== idx) {
          setSections(prev => {
            const updated = [...prev];
            const [removed] = updated.splice(draggedItem.sectionIdx, 1);
            updated.splice(idx, 0, removed);
            return updated;
          });
        }
      } else if (draggedItem.type === 'field') {
        // Mover campo a una sección (al final de la sección)
        const sourceSectionIdx = draggedItem.sectionIdx;
        const sourceFieldIdx = draggedItem.fieldIdx!;
        const targetSectionIdx = idx;
        
        if (sourceSectionIdx !== targetSectionIdx) {
          setSections(prev => {
            const updated = [...prev];
            const sourceSection = updated[sourceSectionIdx];
            const targetSection = updated[targetSectionIdx];
            
            // Obtener el campo a mover
            const fieldToMove = sourceSection.campos[sourceFieldIdx];
            
            // Remover de la sección origen
            const newSourceCampos = sourceSection.campos.filter((_, i) => i !== sourceFieldIdx)
              .map((f, i) => ({ ...f, order: i + 1 }));
            
            // Agregar al final de la sección destino
            const newTargetCampos = [...targetSection.campos, {
              ...fieldToMove,
              order: targetSection.campos.length + 1
            }];
            
            // Actualizar el orden de todos los campos en la sección destino
            const reorderedTargetCampos = newTargetCampos.map((campo, index) => ({
              ...campo,
              order: index + 1
            }));
            
            updated[sourceSectionIdx] = {
              ...sourceSection,
              campos: newSourceCampos
            };
            
            updated[targetSectionIdx] = {
              ...targetSection,
              campos: reorderedTargetCampos
            };
            
            return updated;
          });
          
          // Actualizar la selección para mostrar el campo en la nueva sección
          setSelectedSectionIdx(targetSectionIdx);
          // El campo se agrega al final, así que será el último campo
          setSelectedFieldIdx(sections[targetSectionIdx].campos.length);
        }
      }
    } else {
      // Mover campo a una posición específica usando la posición exacta del mouse
      const targetSectionIdx = sectionIdx ?? selectedSectionIdx ?? 0;
      
      if (draggedItem.type === 'field') {
        const sourceSectionIdx = draggedItem.sectionIdx;
        const sourceFieldIdx = draggedItem.fieldIdx!;
        
        // Usar la posición exacta calculada o la posición del campo si no hay posición exacta
        const targetFieldIdx = insertPosition !== null ? insertPosition : idx;
        
        if (sourceSectionIdx === targetSectionIdx) {
          // Mover dentro de la misma sección
          if (sourceFieldIdx !== targetFieldIdx) {
          setSections(prev => {
            const updated = [...prev];
              const section = updated[targetSectionIdx];
            const campos = [...section.campos];
            
            // Remover el campo arrastrado
              const [draggedField] = campos.splice(sourceFieldIdx, 1);
              
              // Calcular la nueva posición correcta
              let newPosition = targetFieldIdx;
              
              // Si el campo se movió hacia abajo, ajustar la posición porque ya removimos un elemento
              if (sourceFieldIdx < targetFieldIdx) {
                newPosition = targetFieldIdx - 1;
              }
              
              // Asegurar que la posición esté dentro de los límites válidos
              newPosition = Math.max(0, Math.min(newPosition, campos.length));
            
            // Insertar en la nueva posición
              campos.splice(newPosition, 0, draggedField);
            
            // Actualizar el orden de todos los campos
            const reorderedCampos = campos.map((campo, index) => ({
              ...campo,
              order: index + 1
            }));
            
              updated[targetSectionIdx] = {
              ...section,
              campos: reorderedCampos
            };
            
            return updated;
          });
          }
        } else {
          // Mover entre secciones a una posición específica
          setSections(prev => {
            const updated = [...prev];
            const sourceSection = updated[sourceSectionIdx];
            const targetSection = updated[targetSectionIdx];
            
            // Obtener el campo a mover
            const fieldToMove = sourceSection.campos[sourceFieldIdx];
            
            // Remover de la sección origen
            const newSourceCampos = sourceSection.campos.filter((_, i) => i !== sourceFieldIdx)
              .map((f, i) => ({ ...f, order: i + 1 }));
            
            // Agregar a la sección destino en la posición específica
            const newTargetCampos = [...targetSection.campos];
            newTargetCampos.splice(targetFieldIdx, 0, {
              ...fieldToMove,
              order: targetFieldIdx + 1
            });
            
            // Actualizar el orden de todos los campos en la sección destino
            const reorderedTargetCampos = newTargetCampos.map((campo, index) => ({
              ...campo,
              order: index + 1
            }));
            
            updated[sourceSectionIdx] = {
              ...sourceSection,
              campos: newSourceCampos
            };
            
            updated[targetSectionIdx] = {
              ...targetSection,
              campos: reorderedTargetCampos
            };
            
            return updated;
          });
          
          // Actualizar la selección para mostrar el campo en la nueva sección
          setSelectedSectionIdx(targetSectionIdx);
          setSelectedFieldIdx(targetFieldIdx);
        }
      }
    }
    
    // Limpiar estados de drag y selección
    setDraggedItem(null);
    setDragOverTarget(null);
    setInsertPosition(null);
    setMousePosition(null);
    setPreviewMode(false);
    setPreviewSections([]);
    
    // Limpiar toda la selección después de soltar el campo
    setSelectedFieldForMove(null);
    setSelectedSectionIdx(null);
    setSelectedFieldIdx(null);
  };

  const onDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setPreviewMode(false);
    setPreviewSections([]);
    setInsertPosition(null);
    setMousePosition(null);
    
    // Limpiar toda la selección después de terminar el drag
    setSelectedFieldForMove(null);
    setSelectedSectionIdx(null);
    setSelectedFieldIdx(null);
  };

  // Función para redimensionar campos
  const handleFieldResize = (fieldId: string, newDimension: number) => {
    setSections(prev => {
      const updated = [...prev];
      for (let sectionIdx = 0; sectionIdx < updated.length; sectionIdx++) {
        const section = updated[sectionIdx];
        const fieldIdx = section.campos.findIndex(f => f.id === fieldId);
        if (fieldIdx !== -1) {
          // Validar que la nueva dimensión esté entre 1 y 12
          const clampedDimension = Math.max(1, Math.min(12, newDimension));
          updated[sectionIdx] = {
            ...section,
            campos: section.campos.map((f, i) =>
              i === fieldIdx ? { ...f, dimension: clampedDimension } : f
            )
          };
          break;
        }
      }
      return updated;
    });
  };

  const renderField = (f: FormField, i: number) => {
    const gridColumnSpan = `span ${f.dimension}`;
    
         // Crear el contenedor del campo con estado de redimensionamiento
     const renderFieldContainer = (children: React.ReactNode) => (
              <div 
          key={f.id} 
           className={`field-container ${resizingFieldId === f.id ? 'field-resizing' : ''} ${(f as any).isPreviewField ? 'preview-field' : ''} ${(f as any).isDragging ? 'field-dragging' : ''}`}
                     style={{ 
             gridColumn: gridColumnSpan, 
             padding: 6,
             minWidth: 0,
             position: 'relative',
             border: resizingFieldId === f.id ? '2px solid #3b82f6' : '1px solid transparent',
             borderRadius: '6px',
             backgroundColor: resizingFieldId === f.id ? '#eff6ff' : 'transparent',
             boxShadow: resizingFieldId === f.id ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
             cursor: 'pointer',
             transition: 'all 0.2s ease-in-out'
           }}
          
                     onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             
             // Si ya está seleccionado, deseleccionarlo
             if (selectedFieldForMove === f.id) {
               setSelectedFieldForMove(null);
             } else {
               // Seleccionar este campo y deseleccionar otros
               setSelectedFieldForMove(f.id);
             }
           }}
        >
        {/* Contenido del campo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
          {/* Indicador de campo del sistema */}
          {f.isSystemField && (
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: f.allowOptionsEdit ? '#10b981' : '#f59e0b',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold',
              zIndex: 2
            }}>
              {f.allowOptionsEdit ? 'OPCIONES' : 'SISTEMA'}
            </div>
          )}
        </div>
        
                          {/* Icono de selección para mover (solo visible cuando se hace clic) */}
         {selectedFieldForMove === f.id && (
           <div 
             className="move-handle"
             draggable
             onDragStart={(e) => {
               e.dataTransfer.effectAllowed = 'move';
               const fieldIdx = sections[selectedSectionIdx || 0]?.campos.findIndex(campo => campo.id === f.id);
               if (fieldIdx !== -1) {
                 onDragStart(fieldIdx, false, selectedSectionIdx || 0);
               }
             }}
             onDragEnd={onDragEnd}
             style={{
               position: 'absolute',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               width: '32px',
               height: '32px',
               backgroundColor: 'rgba(59, 130, 246, 0.95)',
               borderRadius: '50%',
               cursor: 'grab',
               zIndex: 15,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               border: '3px solid white',
               boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
               animation: 'pulse 2s infinite'
             }}
           >
             {/* Icono de mover */}
             <svg 
               width="16" 
               height="16" 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="white" 
               strokeWidth="2"
             >
               <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
             </svg>
           </div>
         )}

         {/* Handle de redimensionamiento izquierdo */}
         <div 
           className="resize-handle-left"
           style={{
             position: 'absolute',
             top: '50%',
             left: '2px',
             transform: 'translateY(-50%)',
             width: '16px',
             height: '24px',
             backgroundColor: 'rgba(239, 68, 68, 0.9)',
             borderRadius: '4px 0 0 4px',
             cursor: 'w-resize',
             zIndex: 10,
             opacity: selectedFieldForMove === f.id ? 1 : 0,
             transition: 'all 0.2s ease-in-out',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             border: '2px solid white',
             boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
           }}
           onMouseDown={(e) => {
             e.preventDefault();
             e.stopPropagation();
             
             setResizingFieldId(f.id);
             
             const startX = e.clientX;
             const startDimension = f.dimension;
             const gridWidth = 12;
             const containerWidth = e.currentTarget.closest('.grid-container')?.clientWidth || 800;
             const columnWidth = containerWidth / gridWidth;
             
             const handleMouseMove = (moveEvent: MouseEvent) => {
               const deltaX = startX - moveEvent.clientX; // Invertido para el lado izquierdo
               const deltaColumns = Math.round(deltaX / columnWidth);
               const newDimension = Math.max(1, Math.min(12, startDimension + deltaColumns));
               
               if (newDimension !== f.dimension) {
                 handleFieldResize(f.id, newDimension);
               }
             };
             
             const handleMouseUp = () => {
               document.removeEventListener('mousemove', handleMouseMove);
               document.removeEventListener('mouseup', handleMouseUp);
               setResizingFieldId(null);
             };
             
             document.addEventListener('mousemove', handleMouseMove);
             document.addEventListener('mouseup', handleMouseUp);
           }}
         >
           {/* Icono de redimensionar izquierdo */}
           <svg 
             width="8" 
             height="8" 
             viewBox="0 0 24 24" 
             fill="none" 
             stroke="white" 
             strokeWidth="2"
           >
             <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
           </svg>
         </div>

         {/* Handle de redimensionamiento derecho */}
         <div 
           className="resize-handle-right"
           style={{
             position: 'absolute',
             top: '50%',
             right: '2px',
             transform: 'translateY(-50%)',
             width: '16px',
             height: '24px',
             backgroundColor: 'rgba(34, 197, 94, 0.9)',
             borderRadius: '0 4px 4px 0',
             cursor: 'e-resize',
             zIndex: 10,
             opacity: selectedFieldForMove === f.id ? 1 : 0,
             transition: 'all 0.2s ease-in-out',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             border: '2px solid white',
             boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
           }}
           onMouseDown={(e) => {
             e.preventDefault();
             e.stopPropagation();
             
             setResizingFieldId(f.id);
             
             const startX = e.clientX;
             const startDimension = f.dimension;
             const gridWidth = 12;
             const containerWidth = e.currentTarget.closest('.grid-container')?.clientWidth || 800;
             const columnWidth = containerWidth / gridWidth;
             
             const handleMouseMove = (moveEvent: MouseEvent) => {
               const deltaX = moveEvent.clientX - startX;
               const deltaColumns = Math.round(deltaX / columnWidth);
               const newDimension = Math.max(1, Math.min(12, startDimension + deltaColumns));
               
               if (newDimension !== f.dimension) {
                 handleFieldResize(f.id, newDimension);
               }
             };
             
             const handleMouseUp = () => {
               document.removeEventListener('mousemove', handleMouseMove);
               document.removeEventListener('mouseup', handleMouseUp);
               setResizingFieldId(null);
             };
             
             document.addEventListener('mousemove', handleMouseMove);
             document.addEventListener('mouseup', handleMouseUp);
           }}
         >
           {/* Icono de redimensionar derecho */}
           <svg 
             width="8" 
             height="8" 
             viewBox="0 0 24 24" 
             fill="none" 
             stroke="white" 
             strokeWidth="2"
           >
             <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
           </svg>
         </div>
          

        </div>
      );

    switch (f.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <input 
              type={f.type} 
              className="form-builder-input"
              style={{ 
                width: '100%', 
                padding: 6, 
                borderRadius: 6, 
                border: '1px solid #e0e7ef', 
                fontSize: 13
              }} 
            />
          </>
        );
      case 'textarea':
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <textarea 
              className="form-builder-input"
              style={{ 
                width: '100%', 
                padding: 6, 
                borderRadius: 6, 
                border: '1px solid #e0e7ef', 
                fontSize: 13,
                minHeight: '60px'
              }} 
            />
          </>
        );
      case 'select':
        // Determinar las opciones a mostrar
        let selectOptions: string[] = [];
        if (f.options === 'tipos_candidatos') {
          // Cargar opciones desde la base de datos
          selectOptions = tiposCandidatos.map(tipo => tipo.nombre);
        } else {
          // Usar opciones estáticas
          selectOptions = toOptionsArray(f.options);
        }
        
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} style={{ 
              width: '100%', 
              padding: 6, 
              borderRadius: 6, 
              border: '1px solid #e0e7ef', 
              fontSize: 13,
              backgroundColor: f.disabled ? '#f5f5f5' : 'white',
              cursor: f.disabled ? 'not-allowed' : 'default'
            }} disabled={f.disabled}>
              <option value="">{f.placeholder || 'Seleccione una opción'}</option>
              {selectOptions.map((opt: string, idx: number) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </>
        );
      case 'checkbox':
        return renderFieldContainer(
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: '100%' }}>
                  <input 
                    type="checkbox" 
                    name={f.name}
                    checked={f.required || false}
                  style={{ margin: 0 }}
                />
                <span style={{ fontWeight: 500, fontSize: 13 }}>{f.label}{f.required && ' *'}</span>
              </label>
          </div>
        );
      case 'radio':
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label><br />
            {toOptionsArray(f.options).map((opt: string, idx: number) => (
              <label key={idx} style={{ marginRight: 8, fontSize: 12 }}>
                <input type="radio" name={f.name} value={opt} style={{ marginRight: 4 }} /> {opt}
              </label>
            ))}
          </>
        );
      case 'title':
        return renderFieldContainer(
          <h3 style={{ fontSize: 18, color: '#000', fontWeight: 700, margin: 0, textAlign: 'center' }}>{f.label}</h3>
        );
      case 'foreignKey':
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} style={{ 
              width: '100%', 
              padding: 6, 
              borderRadius: 6, 
              border: '1px solid #e0e7ef', 
              fontSize: 13 
            }}>
              {toOptionsArray(f.options).map((opt: string, idx: number) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </>
        );
      case 'percent':
        return renderFieldContainer(
          <>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="number" name={f.name} min={0} max={100} style={{ 
                width: '100%', 
                padding: 6, 
                borderRadius: 6, 
                border: '1px solid #e0e7ef', 
                fontSize: 13 
              }} />
              <span style={{ marginLeft: 4, fontWeight: 600, color: '#000', fontSize: 13 }}>%</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const formJson = {
    secciones: sections.filter(s => s.activo !== false).map(section => ({
      titulo: section.titulo,
      layout: 'grid-cols-12',
      campos: section.campos.filter(f => f.activo !== false).map(field => ({
        tipo: field.type,
        label: field.label,
        nombre: field.name || field.label?.toLowerCase().replace(/\s+/g, '') || 'campo',
        colspan: `col-span-${Math.min(field.dimension, 12)}`,
        gridColumnSpan: `span ${Math.min(field.dimension, 12)}`,
        required: field.required,
        dimension: field.dimension,
        order: field.order,
        placeholder: field.placeholder,
        // Configuración de opciones (compatibilidad hacia atrás)
        opciones: field.type === 'select' || field.type === 'radio'
          ? toOptionsArray(field.options)
          : undefined,
        // Configuración de datos dinámicos
        dataSource: field.dataSource,
        databaseTable: field.databaseTable,
        databaseField: field.databaseField,
        databaseValueField: field.databaseValueField,
        // Campos adicionales para compatibilidad
        options: field.options,
        activo: field.activo,
        isSystemField: field.isSystemField,
        // Configuración específica para campos de fecha
        diasMinimos: field.diasMinimos
      }))
    }))
  };

  return (
    <>
      <style>
        {`
          .form-builder-input::placeholder {
            color: #9d9d9d !important;
            opacity: 1 !important;
          }
          .form-builder-input::-webkit-input-placeholder {
            color: #9d9d9d !important;
            opacity: 1 !important;
          }
          .form-builder-input::-moz-placeholder {
            color: #9d9d9d !important;
            opacity: 1 !important;
          }
          .form-builder-input:-ms-input-placeholder {
            color: #9d9d9d !important;
            opacity: 1 !important;
          }
          
          /* Estilos para el JSON formateado */
          .json-container pre {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #374151 !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            white-space: pre !important;
            overflow-x: auto !important;
            overflow-y: auto !important;
          }
          
          .json-container {
            max-height: 400px !important;
            overflow: auto !important;
          }

          /* Estilos para drag & drop en vista previa */
          .field-draggable {
            transition: all 0.2s ease-in-out;
          }
          
          .field-draggable:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .field-draggable:active {
            cursor: grabbing !important;
          }
          
          .field-dragging {
            opacity: 0.5;
            transform: scale(0.95);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          }
          
          .field-drag-over {
            border: 2px dashed #3b82f6 !important;
            background-color: #eff6ff !important;
            transform: scale(1.02);
          }
          
          .section-drag-over {
            border: 2px dashed #10b981 !important;
            background-color: #ecfdf5 !important;
          }
          
          .preview-mode {
            opacity: 0.7;
            filter: grayscale(0.3);
          }
          
        .preview-field {
          border: 2px dashed #3b82f6 !important;
          background-color: #eff6ff !important;
          opacity: 0.9;
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
          z-index: 10;
          position: relative;
        }
        
        .field-dragging {
          border: 2px solid #3b82f6 !important;
          background-color: #dbeafe !important;
          opacity: 0.8;
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
          z-index: 20;
          position: relative;
          animation: drag-pulse 1.5s infinite;
        }
        
        @keyframes drag-pulse {
          0%, 100% { 
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            transform: scale(1.05);
          }
          50% { 
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.6);
            transform: scale(1.08);
          }
        }
           
           .preview-mode .field-container:not(.preview-field) {
             opacity: 0.6;
             transform: scale(0.98);
             transition: all 0.2s ease-in-out;
           }
           
           .insertion-indicator {
             position: absolute;
             left: 0;
             right: 0;
             height: 3px;
             background: linear-gradient(90deg, #3b82f6, #10b981);
             border-radius: 2px;
             z-index: 20;
             box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
             animation: pulse-indicator 1.5s infinite;
           }
           
           @keyframes pulse-indicator {
             0%, 100% {
               opacity: 0.8;
               transform: scaleY(1);
             }
             50% {
               opacity: 1;
               transform: scaleY(1.2);
             }
          }
          
                     /* Estilos para los handles de redimensionamiento */
           .resize-handle-left,
           .resize-handle-right {
             transition: all 0.2s ease-in-out;
           }
           
           .resize-handle-left:hover,
           .resize-handle-right:hover {
             transform: scale(1.1);
             box-shadow: 0 2px 8px rgba(0,0,0,0.3);
           }
           
           /* Estilos para el handle de mover */
           .move-handle {
             transition: all 0.2s ease-in-out;
           }
           
           .move-handle:hover {
             transform: translate(-50%, -50%) scale(1.1);
             box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
           }
           
           /* Animación de pulso para el handle de mover */
           @keyframes pulse {
             0%, 100% {
               transform: translate(-50%, -50%) scale(1);
               opacity: 1;
             }
             50% {
               transform: translate(-50%, -50%) scale(1.05);
               opacity: 0.8;
             }
           }
          
                     /* Grid de fondo mejorado y más visible */
           .grid-container {
             background: #ffffff;
             position: relative;
           }
           
           /* Campo en modo redimensionamiento */
           .field-resizing {
             border: 2px solid #3b82f6 !important;
             background-color: #eff6ff !important;
             box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
             transform: scale(1.02);
           }
           
           /* Líneas de columnas sin números */
           .column-line {
             position: absolute;
             top: 0;
             height: 100%;
             border-left: 2px solid rgba(59, 130, 246, 0.2);
             pointer-events: none;
             z-index: 1;
          }
        `}
      </style>
      <div style={{ 
        background: '#f8fafc', 
        display: 'flex', 
        minHeight: '100vh',
        overflow: 'visible'
      }}>
      {!readOnly && (
        <div style={{ 
          width: 260, 
          background: '#fff', 
          borderRight: '1px solid #e0e7ef', 
          padding: '2rem 1rem', 
          borderRadius: '0 24px 24px 0', 
          boxShadow: '2px 0 12px 0 rgba(0,0,0,0.03)',
          height: 'auto',
          overflow: 'visible'
        }}>
          <h3 style={{ color: '#000', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Secciones</h3>
          
          {/* Lista de secciones */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: '#666', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Secciones del Formulario</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sections.filter(s => s.activo !== false).map((section, i) => (
              <li
                  key={section.id}
                draggable
                  onDragStart={() => onDragStart(i, true)}
                  onDragOver={(e) => onDragOver(e, i, true)}
                  onDrop={(e) => onDrop(e, i, true)}
                onDragEnd={onDragEnd}
                  onClick={() => selectSection(i)}
                style={{
                    background: selectedSectionIdx === i ? '#a5d8ff' : '#f0f4f8',
                  color: '#2d3142',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                  cursor: 'pointer',
                    border: selectedSectionIdx === i ? '2px solid #339af0' : '1px solid #e0e7ef',
                  fontWeight: 500,
                    boxShadow: draggedItem?.type === 'section' && draggedItem?.sectionIdx === i ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                    opacity: draggedItem?.type === 'section' && draggedItem?.sectionIdx === i ? 0.7 : 1,
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span>{section.titulo || '(Sin título)'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {section.campos.filter(f => f.activo !== false).length} campos
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista de campos de la sección seleccionada */}
          {selectedSectionIdx !== null && (
            <div>
              <h4 style={{ color: '#666', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Campos de "{sections[selectedSectionIdx]?.titulo}"</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sections[selectedSectionIdx]?.campos.filter(f => f.activo !== false).map((field, i) => (
                  <li
                    key={field.id}
                    draggable
                    onDragStart={() => onDragStart(i, false, selectedSectionIdx)}
                    onDragOver={(e) => onDragOver(e, i, false, selectedSectionIdx)}
                    onDrop={(e) => onDrop(e, i, false, selectedSectionIdx)}
                    onDragEnd={onDragEnd}
                    onClick={() => selectField(selectedSectionIdx, i)}
                    style={{
                      background: selectedFieldIdx === i ? '#e8f5e8' : '#f8f9fa',
                      color: '#2d3142',
                      borderRadius: 8,
                      padding: '8px 10px',
                      marginBottom: 6,
                      cursor: 'pointer',
                      border: selectedFieldIdx === i ? '2px solid #28a745' : '1px solid #dee2e6',
                      fontWeight: 400,
                      fontSize: 13,
                      boxShadow: draggedItem?.type === 'field' && draggedItem?.sectionIdx === selectedSectionIdx && draggedItem?.fieldIdx === i ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                      opacity: draggedItem?.type === 'field' && draggedItem?.sectionIdx === selectedSectionIdx && draggedItem?.fieldIdx === i ? 0.7 : 1,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                    {field.label || '(Sin label)'} <span style={{ fontSize: 11, color: '#000' }}>({field.type})</span>
              </li>
            ))}
          </ul>
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        flex: 1, 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: '2rem',
        height: 'auto',
        overflow: 'visible'
      }}>
        {!readOnly && (
          <>
            {/* Tabs de navegación */}
            <div className="mb-6">
              <div className="grid w-full grid-cols-3 bg-cyan-100/60 p-1 rounded-lg">
                <button
                     onClick={() => {
                       setActiveTab("seccion");
                       setSelectedFieldForMove(null); // Limpiar selección al cambiar de tab
                     }}
                     className={`px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium ${activeTab === "seccion"
                      ? "bg-cyan-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Agregar Sección
                </button>
                <button
                     onClick={() => {
                       setActiveTab("campo");
                       setSelectedFieldForMove(null); // Limpiar selección al cambiar de tab
                     }}
                     className={`px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium ${activeTab === "campo"
                      ? "bg-cyan-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Agregar Campo
                </button>
                <button
                     onClick={() => {
                       setActiveTab("vista");
                       setSelectedFieldForMove(null); // Limpiar selección al cambiar de tab
                     }}
                     className={`px-4 py-2 rounded-md transition-all duration-300 text-sm font-medium ${activeTab === "vista"
                      ? "bg-cyan-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Vista Previa
                </button>
              </div>
            </div>

            {/* Tab: Agregar/Editar Sección */}
            {activeTab === "seccion" && (
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🏢</span>
                    {selectedSectionIdx === null ? 'Agregar Nueva Sección' : 'Editar Sección'}
                  </h3>
                  
                  {sections.length === 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        💡 <strong>Primer paso:</strong> Crea una sección para organizar los campos de tu formulario
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        📐 <strong>Sistema de columnas:</strong> Cada sección usa un grid de 12 columnas. Configura el ancho de cada campo (1-12) para controlar su tamaño.
                      </p>
                    </div>
                  )}
                  
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Título de la Sección</label>
                      <input 
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm" 
                        name="titulo" 
                        value={currentSection.titulo} 
                        onChange={handleSectionChange} 
                        autoComplete="off"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-3 justify-end">
                      {selectedSectionIdx === null ? (
                        <button 
                          type="button"
                          onClick={(e) => addSection(e as any)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          {sections.length === 0 ? 'Crear Primera Sección' : 'Agregar Sección'}
                        </button>
                      ) : (
                        <>
                          <button 
                            type="button"
                            onClick={saveSection} 
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                          >
                            <Save className="h-3 w-3" />
                            Guardar Sección
                          </button>
                          <button 
                            type="button" 
                            onClick={() => removeSection(selectedSectionIdx)} 
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar Sección
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { 
                              setSelectedSectionIdx(null); 
                              setCurrentSection(createDefaultSection()); 
                            }} 
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tab: Agregar/Editar Campo */}
            {activeTab === "campo" && (
              <div className="mb-4">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">📋</span>
                    {selectedFieldIdx === null ? 'Agregar Nuevo Campo' : 'Editar Campo'}
                  </h3>
                  
                  {selectedSectionIdx === null ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-gray-600 mb-2">No hay sección seleccionada</p>
                      <p className="text-gray-500 text-sm">Selecciona una sección del panel izquierdo para agregar campos</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                        {/* Fila: Tipo de Campo + Orden + Label + Requerido (12 cols) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tipo
                            {currentField.isSystemField && <span className="text-xs text-orange-600 ml-1">(Lectura)</span>}
                          </label>
                          <Select 
                            onValueChange={(value) => setCurrentField(f => ({ ...f, type: value }))} 
                            value={currentField.type}
                            disabled={currentField.isSystemField}
                          >
                            <SelectTrigger className={`w-full h-8 text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map(ft => (
                                <SelectItem key={ft.value} value={ft.value} className="flex items-center gap-2 text-sm">
                                  <span className="text-sm font-medium">{ft.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Orden
                          </label>
                          <input 
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                            name="order" 
                            type="number" 
                            min={1} 
                            max={99} 
                            value={currentField.order} 
                            onChange={handleFieldChange} 
                            autoComplete="off"
                          />
                        </div>
                          <div className="md:col-span-5">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Label
                            {currentField.isSystemField && <span className="text-xs text-orange-600 ml-1">(Lectura)</span>}
                          </label>
                          <input 
                            className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            name="label" 
                            value={currentField.label} 
                            onChange={handleFieldChange} 
                            autoComplete="off"
                            disabled={currentField.isSystemField}
                          />
                        </div>
                          <div className="md:col-span-2 flex items-end">
                            <div className="w-full space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Requerido
                                {currentField.isSystemField && <span className="text-xs text-orange-600 ml-1">(Lectura)</span>}
                              </label>
                              <button
                                type="button"
                                onClick={() => setCurrentField(f => ({ ...f, required: !f.required }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${currentField.required ? 'bg-cyan-600' : 'bg-gray-200'
                                  } ${currentField.isSystemField ? 'cursor-not-allowed opacity-50' : ''}`}
                                disabled={currentField.isSystemField}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${currentField.required ? 'translate-x-6' : 'translate-x-1'
                                  }`} />
                              </button>
                            </div>
                        </div>
                      </div>

                        {/* Segunda fila: Placeholder/Opciones + Tamaño (12 cols) */}
                      {currentField.type !== 'title' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="md:col-span-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'foreignKey' ? 'Configuración de Opciones' : 
                               currentField.type === 'date' ? 'Configuración de Fecha' : 'Placeholder'}
                            </label>
                            {currentField.type === 'date' ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Placeholder</label>
                                  <input 
                                    className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    name="placeholder" 
                                    placeholder="Seleccione una fecha" 
                                    value={currentField.placeholder} 
                                    onChange={handleFieldChange} 
                                    autoComplete="off"
                                    disabled={currentField.isSystemField}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Días mínimos después de hoy
                                    <span className="text-gray-400 ml-1">(opcional)</span>
                                  </label>
                                  <input 
                                    className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    name="diasMinimos" 
                                    type="number"
                                    min="0"
                                    max="365"
                                    placeholder="0" 
                                    value={currentField.diasMinimos || ''} 
                                    onChange={handleFieldChange} 
                                    autoComplete="off"
                                    disabled={currentField.isSystemField}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Ejemplo: 3 = la fecha más próxima será dentro de 3 días
                                  </p>
                                </div>
                              </div>
                            ) : currentField.type === 'number' ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Placeholder</label>
                                  <input 
                                    className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    name="placeholder" 
                                    placeholder="Ingrese un número" 
                                    value={currentField.placeholder} 
                                    onChange={handleFieldChange} 
                                    autoComplete="off"
                                    disabled={currentField.isSystemField}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Longitud mínima (dígitos)
                                    <span className="text-gray-400 ml-1">(opcional)</span>
                                  </label>
                                  <input 
                                    className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm`}
                                    name="minLength" 
                                    type="number"
                                    min="1"
                                    max="20"
                                    placeholder="10" 
                                    value={(currentField as any).minLength || ''} 
                                    onChange={handleFieldChange} 
                                    autoComplete="off"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Ejemplo: 10 = el número debe tener al menos 10 dígitos
                                  </p>
                                </div>
                              </div>
                            ) : currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'foreignKey' ? (
                              <div className="space-y-2">
                                {/* Selector de fuente de datos */}
                                <Select 
                                  onValueChange={(value: 'static' | 'database') => {
                                    // Usar la misma lógica de actualización que handleFieldChange
                                    setCurrentField(f => {
                                      if (f.isSystemField && f.allowOptionsEdit) {
                                        return { ...f, dataSource: value };
                                      } else if (!f.isSystemField) {
                                        return { ...f, dataSource: value };
                                      }
                                      return f; // No actualizar si es campo del sistema sin allowOptionsEdit
                                    });
                                  }} 
                                  value={currentField.dataSource || 'static'}
                                  disabled={(() => {
                                    const isDisabled = currentField.isSystemField && !currentField.allowOptionsEdit;
                                    return isDisabled;
                                  })()}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Seleccionar fuente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="static">Opciones estáticas</SelectItem>
                                    <SelectItem value="database">Base de datos</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                {/* Opciones estáticas */}
                                {(currentField.dataSource === 'static' || !currentField.dataSource) && (
                              <input 
                                  className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${(currentField.isSystemField && !currentField.allowOptionsEdit) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                name="options" 
                                placeholder="Opciones (separadas por coma)" 
                                value={currentField.options as any} 
                                onChange={handleFieldChange} 
                                autoComplete="off"
                                disabled={(() => {
                                  const isDisabled = currentField.isSystemField && !currentField.allowOptionsEdit;
                                  return isDisabled;
                                })()}
                              />
                                )}
                                
                                {/* Configuración de base de datos */}
                                {currentField.dataSource === 'database' && (
                                  <div className="space-y-2">
                                    <Select 
                                      onValueChange={(value) => {
                                        const table = DATABASE_TABLES.find(t => t.value === value);
                                        setCurrentField(f => ({ 
                                          ...f, 
                                          databaseTable: value,
                                          databaseField: table?.displayField || 'nombre',
                                          databaseValueField: table?.valueField || 'nombre'
                                        }));
                                      }} 
                                      value={currentField.databaseTable || ''}
                                      disabled={currentField.isSystemField}
                                    >
                                      <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Seleccionar tabla" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DATABASE_TABLES.map((table) => (
                                          <SelectItem key={table.value} value={table.value}>
                                            {table.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Campo a mostrar</label>
                                        <input 
                                          className={`w-full px-2 py-1 border border-gray-300 rounded text-xs ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          name="databaseField" 
                                          placeholder="nombre" 
                                          value={currentField.databaseField || 'nombre'} 
                                          onChange={handleFieldChange} 
                                          disabled={currentField.isSystemField}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Campo de valor</label>
                                        <input 
                                          className={`w-full px-2 py-1 border border-gray-300 rounded text-xs ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          name="databaseValueField" 
                                          placeholder="nombre" 
                                          value={currentField.databaseValueField || 'nombre'} 
                                          onChange={handleFieldChange} 
                                          disabled={currentField.isSystemField}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input 
                                className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm ${currentField.isSystemField ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                name="placeholder" 
                                value={currentField.placeholder} 
                                onChange={handleFieldChange} 
                                autoComplete="off"
                                disabled={currentField.isSystemField}
                              />
                            )}
                          </div>
                            <div className="md:col-span-7">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tamaño (1-12)
                              </label>
                              <div className="space-y-2">
                            <input 
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-colors duration-200"
                              name="dimension" 
                              type="number" 
                              min={1} 
                              max={12} 
                              value={currentField.dimension} 
                              onChange={handleFieldChange} 
                              autoComplete="off" 
                                  placeholder="1-12"
                            />
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Mín: 1</span>
                                  <span className="text-cyan-600 font-medium">Actual: {currentField.dimension}</span>
                                  <span>Máx: 12</span>
                          </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  Determina cuántas columnas ocupa el campo.
                                </p>
                              </div>
                          </div>
                        </div>
                      )}

                      {/* Selector de Sección para Mover Campo */}
                      {selectedFieldIdx !== null && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-3 border-t border-gray-200">
                          <div className="md:col-span-12">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Mover Campo a Sección
                            </label>
                            <div className="flex items-center gap-3">
                              <Select 
                                onValueChange={(value) => {
                                  const targetSectionIdx = parseInt(value);
                                  if (targetSectionIdx !== selectedSectionIdx) {
                                    moveFieldToSection(selectedSectionIdx, selectedFieldIdx, targetSectionIdx);
                                  }
                                }}
                                value={selectedSectionIdx?.toString() || ''}
                              >
                                <SelectTrigger className="w-full h-8 text-sm">
                                  <SelectValue placeholder="Seleccionar sección destino" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sections.map((section, idx) => (
                                    <SelectItem key={section.id} value={idx.toString()} className="flex items-center gap-2 text-sm">
                                      <span className="text-sm font-medium">{section.titulo || `Sección ${idx + 1}`}</span>
                                      {idx === selectedSectionIdx && <span className="text-xs text-cyan-600">(Actual)</span>}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                Mover campo a otra sección
                              </div>
                              </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-3">
                        {selectedFieldIdx === null ? (
                          <button 
                            type="button"
                            onClick={(e) => addField(e as any)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            Agregar Campo
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={saveField} 
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                            >
                              <Save className="h-3 w-3" />
                              Guardar
                            </button>
                            {/* Solo mostrar botón de eliminar si no es un campo del sistema */}
                            {!currentField.isSystemField && (
                              <button 
                                type="button" 
                                onClick={() => removeField(selectedSectionIdx, selectedFieldIdx)} 
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                              >
                                <Trash2 className="h-3 w-3" />
                                Eliminar
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => { 
                                setSelectedFieldIdx(null); 
                                setCurrentField(createDefaultField()); 
                              }} 
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Vista Previa */}
            {activeTab === "vista" && (
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">👁️</span>
                    Vista Previa del Formulario
                  </h3>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsExporting(true);
                          const element = document.getElementById('form-preview');
                          if (element) {
                            const canvas = await html2canvas(element, {
                              backgroundColor: '#ffffff',
                              scale: 2,
                              useCORS: true,
                              allowTaint: true
                            });
                            
                            const link = document.createElement('a');
                            link.download = `plantilla-${formName || 'formulario'}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          }
                        } catch (error) {
                          console.error('Error al exportar:', error);
                          alert('Error al exportar la imagen');
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      disabled={isExporting || sections.filter(s => s.activo !== false).length === 0}
                      className="p-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Exportar como imagen"
                    >
                      {isExporting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                     
                  
                  {sections.filter(s => s.activo !== false).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay secciones configuradas
                      </h4>
                      <p className="text-gray-600">
                        Crea tu primera sección para ver la vista previa del formulario
                      </p>
                    </div>
                  ) : (
                    <div ref={previewRef} className={`space-y-6 ${previewMode ? 'preview-mode' : ''}`}>
                      {(previewMode ? previewSections : sections).filter(s => s.activo !== false).map((section, sectionIdx) => (
                        <div 
                          key={section.id} 
                          className={`border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                            dragOverTarget?.type === 'section' && 
                            dragOverTarget?.sectionIdx === sectionIdx ? 'section-drag-over' : ''
                          }`}
                          onDragOver={(e) => onDragOver(e, sectionIdx, true)}
                          onDrop={(e) => onDrop(e, sectionIdx, true)}
                        >
                          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                            <span className="text-xl">📋</span>
                            <h4 className="font-semibold text-gray-900">
                              {section.titulo || 'Sección sin título'}
                            </h4>
                          </div>
                          
                          {section.campos.filter(f => f.activo !== false).length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              Esta sección no tiene campos configurados
                            </div>
                          ) : (
                                                                <div className="relative">
                                   {/* Grid de fondo sin números, solo líneas visuales */}
                                   <div className="absolute inset-0 grid grid-cols-12 gap-4 pointer-events-none z-0">
                                     {Array.from({ length: 12 }, (_, colIndex) => (
                                       <div
                                         key={colIndex}
                                         className="column-line"
                                         style={{ gridColumn: `${colIndex + 1} / span 1` }}
                                       />
                                     ))}
                                   </div>
                                 
                                 {/* Contenedor de campos con drag & drop */}
                                 <div className="grid grid-cols-12 gap-4 relative z-10 grid-container">
                              {(() => {
                                const camposActivos = section.campos.filter(f => f.activo !== false).sort((a, b) => a.order - b.order);
                                     return camposActivos.map((field, fieldIdx) => (
                                       <div
                                         key={field.id}
                                         draggable
                                         onDragStart={(e) => {
                                           e.dataTransfer.effectAllowed = 'move';
                                           onDragStart(fieldIdx, false, sectionIdx);
                                         }}
                                         onDragOver={(e) => onDragOver(e, fieldIdx, false, sectionIdx)}
                                         onDrop={(e) => onDrop(e, fieldIdx, false, sectionIdx)}
                                         onDragEnd={onDragEnd}
                                         className={`field-draggable transition-all duration-200 ${
                                           draggedItem?.type === 'field' && 
                                           draggedItem?.sectionIdx === sectionIdx && 
                                           draggedItem?.fieldIdx === fieldIdx ? 'field-dragging' : ''
                                         } ${
                                           dragOverTarget?.type === 'field' && 
                                           dragOverTarget?.sectionIdx === sectionIdx && 
                                           dragOverTarget?.fieldIdx === fieldIdx ? 'field-drag-over' : ''
                                         } ${
                                           (field as any).isPreviewField ? 'preview-field' : ''
                                         }`}
                                         style={{
                                           gridColumn: `span ${field.dimension}`,
                                           cursor: 'grab'
                                         }}
                                       >
                                         {renderField(field, fieldIdx)}
                                       </div>
                                     ));
                              })()}
                                 </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}


        {/* Botones de acción */}
        {!hideInternalSaveButton && (
          <div className="flex justify-end mb-6">
            {/* Botón de guardar plantilla */}
            <button
              type="button"
              onClick={async () => {
                try {
                  startLoading();
                  
                  if (formName.trim() && sections.length > 0) {
                    if (onSave) {
                      await onSave({
                        nombre: formName,
                        descripcion: formDesc,
                        estructura_formulario: formJson
                      });
                    } else {
                      await plantillasService.create({
                        nombre: formName,
                        descripcion: formDesc,
                        estructura_formulario: formJson,
                        es_default: false,
                        activa: true,
                      });
                      if (navigate) {
                        navigate("/maestro/plantillas");
                      } else {
                        alert('Plantilla guardada exitosamente');
                      }
                    }
                  } else {
                    if (!formName.trim()) {
                      alert('Por favor complete el nombre de la plantilla');
                    } else if (sections.length === 0) {
                      alert('Por favor agregue al menos una sección');
                    } else {
                      alert('Por favor complete el nombre de la plantilla y agregue al menos una sección');
                    }
                  }
                } catch (error) {
                  console.error('Error al guardar la plantilla:', error);
                  alert('Error al guardar la plantilla');
                } finally {
                  stopLoading();
                }
              }}
              className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-md hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default FormBuilder; 

