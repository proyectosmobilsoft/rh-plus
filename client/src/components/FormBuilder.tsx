import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { plantillasService } from '@/services/plantillasService';
import { useLoading } from '@/contexts/LoadingContext';
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
  activo?: boolean;
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

const createDefaultField = (): FormField => ({
  id: uuidv4(),
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  order: 1,
  dimension: 12,
  activo: true,
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
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null);
  const [selectedFieldForMove, setSelectedFieldForMove] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("seccion");
  const { startLoading, stopLoading } = useLoading();


  const navigate = !readOnly ? (() => { try { return useNavigate(); } catch { return () => { }; } })() : null;

  // Inicializar campos precargados con IDs únicos
  useEffect(() => {
    if (isInitialized) return; // Evitar ejecución múltiple
    
    let dataToProcess: any[] | null = null;
    if (Array.isArray(precargados)) {
      dataToProcess = precargados;
    } else if (precargados && typeof precargados === 'object' && (precargados as any).secciones) {
      dataToProcess = (precargados as any).secciones as any[];
    }

    console.log('🔍 FormBuilder - precargados:', precargados);
    console.log('🔍 FormBuilder - dataToProcess:', dataToProcess);

    if (dataToProcess && dataToProcess.length > 0) {
      // Si los datos precargados ya tienen estructura de secciones, usarlos directamente
      if (dataToProcess[0] && (dataToProcess[0] as any).campos) {
        const processedSections = dataToProcess.map((section: any) => ({
          ...section,
          id: section.id || uuidv4(),
          activo: section.activo !== false,
          campos: section.campos.map((f: any) => {
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
          })
        }));
        setSections(processedSections);
      } else {
        // Migración: convertir campos planos a una sección por defecto
        const camposActivos = dataToProcess.filter((f: any) => f.activo !== false);
        if (camposActivos.length > 0) {
          const defaultSection = createDefaultSection();
          defaultSection.titulo = 'Campos del Formulario';
          defaultSection.campos = camposActivos.map((f: any) => ({
            ...f,
            id: f.id || uuidv4(),
            activo: f.activo !== false,
            order: f.order || 1
          }));
          setSections([defaultSection]);
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
          activo: true
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
          activo: true
        }
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

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
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

    setCurrentField(f => ({
      ...f,
      [name]: newValue,
    }));
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
    setCurrentField({ ...sections[sectionIdx].campos[fieldIdx] });
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
              activo: currentField.activo !== false
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

  const onDragStart = (idx: number, isSection: boolean = false) => {
    if (isSection) {
      setDraggedSectionIdx(idx);
    } else {
      setDraggedFieldIdx(idx);
    }
  };

  const onDragOver = (idx: number, isSection: boolean = false) => {
    if (isSection) {
      if (draggedSectionIdx === null || draggedSectionIdx === idx) return;
      setSections(f => {
        const result = Array.from(f);
        const [removed] = result.splice(draggedSectionIdx, 1);
        result.splice(idx, 0, removed);
        return result;
      });
      setDraggedSectionIdx(idx);
    } else {
      if (draggedFieldIdx === null || draggedFieldIdx === idx) return;
        
        // Implementar drag and drop de campos dentro de secciones
        if (selectedSectionIdx !== null) {
          setSections(prev => {
            const updated = [...prev];
            const section = updated[selectedSectionIdx];
            const campos = [...section.campos];
            
            // Remover el campo arrastrado
            const [draggedField] = campos.splice(draggedFieldIdx, 1);
            
            // Insertar en la nueva posición
            campos.splice(idx, 0, draggedField);
            
            // Actualizar el orden de todos los campos
            const reorderedCampos = campos.map((campo, index) => ({
              ...campo,
              order: index + 1
            }));
            
            updated[selectedSectionIdx] = {
              ...section,
              campos: reorderedCampos
            };
            
            return updated;
          });
          setDraggedFieldIdx(idx);
        }
    }
  };

  const onDragEnd = () => {
    setDraggedSectionIdx(null);
    setDraggedFieldIdx(null);
    // No limpiar la selección del campo para mantener la funcionalidad de edición
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
          className={`field-container ${resizingFieldId === f.id ? 'field-resizing' : ''}`}
                     style={{ 
             gridColumn: gridColumnSpan, 
             padding: 6,
             minWidth: 0,
             position: 'relative',
             border: resizingFieldId === f.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
             borderRadius: '6px',
             backgroundColor: resizingFieldId === f.id ? '#eff6ff' : '#ffffff',
             boxShadow: resizingFieldId === f.id ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
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
        </div>
        
                          {/* Icono de selección para mover (solo visible cuando se hace clic) */}
         {selectedFieldForMove === f.id && (
           <div 
             className="move-handle"
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
             onMouseDown={(e) => {
               e.preventDefault();
               e.stopPropagation();
               // Aquí se activaría el drag & drop para mover
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
        opciones: field.type === 'select' || field.type === 'radio'
          ? toOptionsArray(field.options)
          : undefined
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
             background-image: 
               linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
             background-size: calc(100% / 12) 100%, 100% 100%;
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
                  onDragOver={e => { e.preventDefault(); onDragOver(i, true); }}
                onDragEnd={onDragEnd}
                onDrop={onDragEnd}
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
                    boxShadow: draggedSectionIdx === i ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                    opacity: draggedSectionIdx === i ? 0.7 : 1,
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
                    onDragStart={() => onDragStart(i, false)}
                    onDragOver={e => { e.preventDefault(); onDragOver(i, false); }}
                    onDragEnd={onDragEnd}
                    onDrop={onDragEnd}
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
                      boxShadow: draggedFieldIdx === i ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                      opacity: draggedFieldIdx === i ? 0.7 : 1,
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
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📋</span>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Campo</label>
                          <Select onValueChange={(value) => setCurrentField(f => ({ ...f, type: value }))} value={currentField.type}>
                            <SelectTrigger className="w-full h-8 text-sm">
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
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Orden</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                          <input 
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm" 
                            name="label" 
                            value={currentField.label} 
                            onChange={handleFieldChange} 
                            autoComplete="off"
                          />
                        </div>
                          <div className="md:col-span-2 flex items-end">
                            <div className="w-full space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Requerido</label>
                              <button
                                type="button"
                                onClick={() => setCurrentField(f => ({ ...f, required: !f.required }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${currentField.required ? 'bg-cyan-600' : 'bg-gray-200'
                                  }`}
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
                              {currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'foreignKey' ? 'Opciones (separadas por coma)' : 'Placeholder'}
                            </label>
                            {currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'foreignKey' ? (
                              <input 
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                name="options" 
                                placeholder="Opciones (separadas por coma)" 
                                value={currentField.options as any} 
                                onChange={handleFieldChange} 
                                autoComplete="off" 
                              />
                            ) : (
                              <input 
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm" 
                                name="placeholder" 
                                value={currentField.placeholder} 
                                onChange={handleFieldChange} 
                                autoComplete="off"
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
                            <button 
                              type="button" 
                              onClick={() => removeField(selectedSectionIdx, selectedFieldIdx)} 
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium flex items-center gap-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              Eliminar
                            </button>
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
                    <Button
                      onClick={exportAsImage}
                      disabled={isExporting || sections.filter(s => s.activo !== false).length === 0}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
                      size="sm"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Exportar como Imagen
                        </>
                      )}
                    </Button>
                  </div>
                     
                     <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                       <p className="text-blue-800 text-sm mb-2">
                         💡 <strong>Funcionalidades disponibles:</strong>
                       </p>
                       <ul className="text-blue-700 text-xs space-y-1">
                         <li>🖱️ <strong>Seleccionar campo:</strong> Haz clic en cualquier campo para mostrar los controles de edición</li>
                         <li>📏 <strong>Redimensionar:</strong> Usa los iconos rojo (izquierda) y verde (derecha) para cambiar el tamaño del campo</li>
                         <li>🔄 <strong>Mover:</strong> Usa el icono azul del centro para arrastrar y reorganizar campos</li>
                         <li>📐 <strong>Grid visual:</strong> Las líneas azules muestran las 12 columnas disponibles</li>
                       </ul>
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
                    <div ref={previewRef} className="space-y-6">
                      {sections.filter(s => s.activo !== false).map((section, sectionIdx) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4">
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
                                           onDragStart(fieldIdx, false);
                                         }}
                                         onDragOver={(e) => {
                                           e.preventDefault();
                                           e.dataTransfer.dropEffect = 'move';
                                         }}
                                         onDrop={(e) => {
                                           e.preventDefault();
                                           if (draggedFieldIdx !== null && selectedSectionIdx === sectionIdx) {
                                             onDragOver(fieldIdx, false);
                                           }
                                         }}
                                         className={`field-draggable transition-all duration-200 ${
                                           draggedFieldIdx === fieldIdx ? 'field-dragging' : ''
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

        {/* Botón para mostrar JSON */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setShowJson(!showJson)} 
              className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm font-medium flex items-center justify-between transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Estructura JSON de la Plantilla
              </div>
              <div className={`transform transition-transform duration-200 ${showJson ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {showJson && (
              <div className="p-4 bg-gray-50 border-t-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Estructura de Datos</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(formJson, null, 2));
                        // Aquí podrías mostrar un toast de confirmación
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors duration-200"
                    >
                      Copiar JSON
                    </button>
                  </div>
                  <pre className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(formJson, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón de guardar */}
        {!hideInternalSaveButton && (
          <div className="flex justify-end mb-6">
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