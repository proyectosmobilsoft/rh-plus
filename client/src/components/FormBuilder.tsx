import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { plantillasService } from '@/services/plantillasService';
import { useLoading } from '@/contexts/LoadingContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const SECTION_ICONS = [
  { value: 'User', label: 'Usuario' },
  { value: 'Building', label: 'Edificio' },
  { value: 'DollarSign', label: 'Dinero' },
  { value: 'Briefcase', label: 'Maletín' },
  { value: 'Home', label: 'Casa' },
  { value: 'Car', label: 'Carro' },
  { value: 'Phone', label: 'Teléfono' },
  { value: 'Mail', label: 'Correo' },
  { value: 'MapPin', label: 'Ubicación' },
  { value: 'Calendar', label: 'Calendario' },
  { value: 'FileText', label: 'Documento' },
  { value: 'Shield', label: 'Escudo' },
  { value: 'Heart', label: 'Corazón' },
  { value: 'Star', label: 'Estrella' },
  { value: 'Settings', label: 'Configuración' },
];

const createDefaultField = () => ({
  id: uuidv4(),
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  order: 1,
  dimension: 12,
  options: '',
  activo: true,
});

const createDefaultSection = () => ({
  id: uuidv4(),
  titulo: '',
  icono: 'User',
  layout: 'grid-cols-12',
  campos: [],
  activo: true,
});

function reorder(list: any[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((f, i) => ({ ...f, order: i + 1 }));
}

const FormBuilder: React.FC<{ 
  precargados?: any[], 
  readOnly?: boolean,
  onSave?: (data: { nombre: string, descripcion: string, fields: any[] }) => Promise<void>,
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
  const [sections, setSections] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState(createDefaultSection());
  const [currentField, setCurrentField] = useState(createDefaultField());
  const [showJson, setShowJson] = useState(false);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number | null>(null);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);
  const { startLoading, stopLoading } = useLoading();


  const navigate = !readOnly ? (() => { try { return useNavigate(); } catch { return () => {}; } })() : null;

  // Inicializar campos precargados con IDs únicos
  useEffect(() => {
    if (precargados) {
      let dataToProcess = precargados;
      
      // Si precargados es un objeto (JSON parseado), extraer las secciones
      if (precargados && typeof precargados === 'object' && !Array.isArray(precargados) && precargados.secciones) {
        dataToProcess = precargados.secciones;
      }
      
      console.log('🔍 FormBuilder - precargados:', precargados);
      console.log('🔍 FormBuilder - dataToProcess:', dataToProcess);
      
      if (dataToProcess && dataToProcess.length > 0) {
        // Si los datos precargados ya tienen estructura de secciones, usarlos directamente
        if (dataToProcess[0] && dataToProcess[0].campos) {
          const processedSections = dataToProcess.map(section => ({
            ...section,
            id: section.id || uuidv4(),
            activo: section.activo !== false, // Asegurar que las secciones estén activas
            campos: section.campos.map(f => {
              // Extraer dimension del gridColumnSpan si existe
              let dimension = f.dimension;
              if (!dimension && f.gridColumnSpan) {
                const match = f.gridColumnSpan.match(/span (\d+)/);
                dimension = match ? parseInt(match[1]) : 12;
              }
              // Si no hay dimension, usar 12 por defecto
              if (!dimension) dimension = 12;
              
              return {
                ...f,
                id: f.id || uuidv4(),
                activo: f.activo !== false, // Asegurar que los campos estén activos
                order: f.order || 1, // Asegurar que tengan orden
                dimension: dimension, // Asegurar que tengan dimension
                type: f.tipo || f.type || 'text', // Asegurar que tengan tipo
                label: f.label || f.label || '', // Asegurar que tengan label
                name: f.nombre || f.name || '', // Asegurar que tengan nombre
                placeholder: f.placeholder || '', // Asegurar que tengan placeholder
                required: f.required || false, // Asegurar que tengan required
                options: f.opciones || f.options || '' // Asegurar que tengan options
              };
            })
          }));
          
          console.log('🔍 FormBuilder - processedSections:', processedSections);
          setSections(processedSections);
        } else {
          // Migración: convertir campos planos a una sección por defecto
          const camposActivos = dataToProcess.filter(f => f.activo !== false);
          if (camposActivos.length > 0) {
            const defaultSection = createDefaultSection();
            defaultSection.titulo = 'Campos del Formulario';
            defaultSection.campos = camposActivos.map(f => ({
        ...f,
        id: f.id || uuidv4(),
              activo: f.activo !== false,
              order: f.order || 1
            }));
            setSections([defaultSection]);
          }
        }
      }
    }
  }, [precargados]);

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
    if (onFieldsChange) {
      // Extraer todos los campos de todas las secciones
      const allFields = sections.flatMap(section => 
        section.campos.filter(f => f.activo !== false)
      );
      onFieldsChange(allFields);
    }
  }, [sections, onFieldsChange]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
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
  };

  const selectField = (sectionIdx: number, fieldIdx: number) => {
    setSelectedSectionIdx(sectionIdx);
    setSelectedFieldIdx(fieldIdx);
    setCurrentField({ ...sections[sectionIdx].campos[fieldIdx] });
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
      // Implementar drag and drop de campos dentro de secciones si es necesario
    }
  };

  const onDragEnd = () => {
    setDraggedSectionIdx(null);
    setDraggedFieldIdx(null);
  };

  const renderField = (f: any, i: number) => {
    const gridColumnSpan = `span ${f.dimension}`;
    switch (f.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <input 
              type={f.type} 
              placeholder={f.placeholder} 
              className="form-builder-input"
              style={{ 
                width: '100%', 
                padding: 6, 
                borderRadius: 6, 
                border: '1px solid #e0e7ef', 
                fontSize: 13
              }} 
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <textarea 
              placeholder={f.placeholder} 
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
          </div>
        );
      case 'select':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} style={{ 
              width: '100%', 
              padding: 6, 
              borderRadius: 6, 
              border: '1px solid #e0e7ef', 
              fontSize: 13 
            }}>
              {f.options.split(',').map((opt: string, idx: number) => <option key={idx} value={opt.trim()}>{opt.trim()}</option>)}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
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
          </div>
        );
      case 'radio':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label><br />
            {f.options.split(',').map((opt: string, idx: number) => (
              <label key={idx} style={{ marginRight: 8, fontSize: 12 }}>
                <input type="radio" name={f.name} value={opt.trim()} style={{ marginRight: 4 }} /> {opt.trim()}
              </label>
            ))}
          </div>
        );
      case 'title':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minWidth: 0
          }}>
            <h3 style={{ fontSize: 18, color: '#000', fontWeight: 700, margin: 0 }}>{f.label}</h3>
          </div>
        );
      case 'foreignKey':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
            <label style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, display: 'block' }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} style={{ 
              width: '100%', 
              padding: 6, 
              borderRadius: 6, 
              border: '1px solid #e0e7ef', 
              fontSize: 13 
            }}>
              {f.options.split(',').map((opt: string, idx: number) => <option key={idx} value={opt.trim()}>{opt.trim()}</option>)}
            </select>
          </div>
        );
      case 'percent':
        return (
          <div key={f.id} style={{ 
            gridColumn: gridColumnSpan, 
            padding: 6,
            minWidth: 0
          }}>
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
          </div>
        );
      default:
        return null;
    }
  };

  const formJson = {
    secciones: sections.filter(s => s.activo !== false).map(section => ({
      icono: section.icono,
      titulo: section.titulo,
      layout: 'grid-cols-12',
      campos: section.campos.filter(f => f.activo !== false).map(field => ({
        tipo: field.type,
        label: field.label,
        nombre: field.name || field.label?.toLowerCase().replace(/\s+/g, '') || 'campo',
        colspan: `col-span-${Math.min(field.dimension, 12)}`,
        gridColumnSpan: `span ${Math.min(field.dimension, 12)}`,
        required: field.required,
        placeholder: field.placeholder,
        dimension: field.dimension,
        order: field.order,
        opciones: field.type === 'select' || field.type === 'radio' ?
          (field.options ? 
            (Array.isArray(field.options) ? 
              field.options : 
              field.options.split(',').map((opt: string) => opt.trim())
            ) : 
            []
          ) :
          undefined
      }))
    }))
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'User': '👤',
      'Building': '🏢',
      'DollarSign': '💰',
      'Briefcase': '💼',
      'Home': '🏠',
      'Car': '🚗',
      'Phone': '📱',
      'Mail': '📧',
      'MapPin': '📍',
      'Calendar': '📅',
      'FileText': '📄',
      'Shield': '🛡️',
      'Heart': '❤️',
      'Star': '⭐',
      'Settings': '⚙️'
    };
    return iconMap[iconName] || '📋';
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
        `}
      </style>
      <div style={{ 
        background: '#f8fafc', 
        display: 'flex', 
        height: '100vh',
        overflow: 'hidden'
      }}>
      {!readOnly && (
        <div style={{ 
          width: 260, 
          background: '#fff', 
          borderRight: '1px solid #e0e7ef', 
          padding: '2rem 1rem', 
          borderRadius: '0 24px 24px 0', 
          boxShadow: '2px 0 12px 0 rgba(0,0,0,0.03)',
          height: '100vh',
          overflowY: 'auto'
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
                    <span style={{ fontSize: 16 }}>{getIconEmoji(section.icono)}</span>
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
        height: '100vh',
        overflowY: 'auto'
      }}>
        {!readOnly && (
          <>
            {/* Formulario de sección */}
            <form style={{ 
              display: 'flex', 
              gap: 24, 
              marginBottom: 32, 
              flexWrap: 'wrap',
              background: '#f0f9ff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <fieldset style={{ 
                  border: '1px solid #0ea5e9', 
                  borderRadius: 12, 
                  padding: 20, 
                  marginBottom: 8,
                  background: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <legend style={{ 
                    color: '#0ea5e9', 
                    fontWeight: '600', 
                    padding: '0 8px',
                    fontSize: '16px'
                  }}>{selectedSectionIdx === null ? 'Agregar sección' : 'Editar sección'}</legend>
                  
                  {sections.length === 0 && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: 14 }}>
                        💡 <strong>Primer paso:</strong> Crea una sección para organizar los campos de tu formulario
                      </p>
                      <p style={{ margin: '8px 0 0 0', color: '#0c4a6e', fontSize: 12 }}>
                        📐 <strong>Sistema de columnas:</strong> Cada sección usa un grid de 12 columnas. Configura el ancho de cada campo (1-12) para controlar su tamaño.
                      </p>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                      <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Título de la Sección</label>
                      <input 
                        className="borde-input" 
                        name="titulo" 
                        value={currentSection.titulo} 
                        onChange={handleSectionChange} 
                        autoComplete="off"
                        placeholder="Ej: Datos del Trabajador"
                        style={{ 
                          width: '100%',
                          fontSize: 16, 
                          borderRadius: 8, 
                          padding: 8, 
                          border: '1px solid #c1c1c1',
                          boxSizing: 'border-box'
                        }} 
                      />
                    </div>
                    <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                      <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Icono</label>
                      <select 
                        name="icono" 
                        value={currentSection.icono} 
                        onChange={handleSectionChange}
                        style={{ 
                          width: '100%',
                          fontSize: 16, 
                          borderRadius: 8, 
                          padding: 8, 
                          border: '1px solid #c1c1c1'
                        }}
                      >
                        {SECTION_ICONS.map(icon => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', marginTop: 8 }}>
                      {selectedSectionIdx === null ? (
                        <button 
                          onClick={addSection} 
                          style={{ 
                            fontSize: 14, 
                            borderRadius: 6, 
                            padding: '6px 12px', 
                            background: '#a5d8ff', 
                            border: 'none', 
                            color: '#2d3142', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sections.length === 0 ? 'Crear Primera Sección' : 'Agregar Sección'}
                        </button>
                      ) : (
                        <>
                          <button onClick={saveSection} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#b6e2d3', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Guardar Sección</button>
                          <button type="button" onClick={() => removeSection(selectedSectionIdx)} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#ffd6e0', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Eliminar Sección</button>
                          <button type="button" onClick={() => { setSelectedSectionIdx(null); setCurrentSection(createDefaultSection()); }} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#f0f4f8', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancelar</button>
                        </>
                      )}
                    </div>
                  </div>
                </fieldset>
              </div>
            </form>

            {/* Formulario de campo (solo si hay una sección seleccionada) */}
            {selectedSectionIdx !== null && (
              <form style={{ 
                display: 'flex', 
                gap: 24, 
                marginBottom: 32, 
                flexWrap: 'wrap',
                background: '#f0f9ff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ flex: 1, minWidth: 320 }}>
                  <fieldset style={{ 
                    border: '1px solid #0ea5e9', 
                    borderRadius: 12, 
                    padding: 20, 
                    marginBottom: 8,
                    background: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <legend style={{ 
                      color: '#0ea5e9', 
                      fontWeight: '600', 
                      padding: '0 8px',
                      fontSize: '16px'
                    }}>{selectedFieldIdx === null ? 'Agregar campo' : 'Editar campo'}</legend>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                        <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Tipo de Campo</label>
                        <Select onValueChange={(value) => setCurrentField(f => ({ ...f, type: value }))} value={currentField.type}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(ft => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                        <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Label</label>
                      <input 
                        className="borde-input" 
                        name="label" 
                          value={currentField.label} 
                        onChange={handleFieldChange} 
                          autoComplete="off"
                        style={{ 
                          width: '100%',
                          fontSize: 16, 
                          borderRadius: 8, 
                          padding: 8, 
                          border: '1px solid #c1c1c1',
                          boxSizing: 'border-box'
                        }} 
                      />
                    </div>
                      {currentField.type !== 'title' && (
                        <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                        <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Placeholder</label>
                        <input 
                          className="borde-input" 
                          name="placeholder" 
                            value={currentField.placeholder} 
                          onChange={handleFieldChange} 
                            autoComplete="off"
                            style={{ 
                              width: '100%',
                              fontSize: 16, 
                              borderRadius: 8, 
                              padding: 8, 
                              border: '1px solid #c1c1c1',
                              boxSizing: 'border-box'
                            }} 
                        />
                      </div>
                    )}
                      <div style={{ display: 'flex', flexDirection: 'column', width: 80 }}>
                      <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Orden</label>
                        <input className="borde-input" name="order" type="number" min={1} max={99} value={currentField.order} onChange={handleFieldChange} autoComplete="off" style={{ width: 80, fontSize: 16, borderRadius: 8, padding: 8, border: '1px solid #c1c1c1' }} />
                    </div>
                      <div style={{ display: 'flex', flexDirection: 'column', width: 80 }}>
                      <label style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Tamaño (1-12)</label>
                        <input className="borde-input" name="dimension" type="number" min={1} max={12} value={currentField.dimension} onChange={handleFieldChange} autoComplete="off" style={{ width: 80, fontSize: 16, borderRadius: 8, padding: 8, border: '1px solid #c1c1c1' }} />
                    </div>
                      {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'foreignKey') && (
                        <input className="borde-input" name="options" placeholder="Opciones (separadas por coma)" value={currentField.options} onChange={handleFieldChange} autoComplete="off" style={{ fontSize: 16, borderRadius: 8, padding: 8, minWidth: 180, border: '1px solid #c1c1c1' }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginTop: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1 }}>
                        <div className="toggle-switch">
                          <input className="borde-input" 
                            name="required" 
                            type="checkbox" 
                              checked={currentField.required} 
                            onChange={handleFieldChange}
                            style={{ border: '1px solid #c1c1c1' }}
                          />
                          <span className="toggle-slider"></span>
                        </div>
                        <span className="toggle-label">Requerido</span>
                      </label>
                        {selectedFieldIdx === null ? (
                        <div style={{ marginLeft: 'auto' }}>
                          <button 
                            onClick={addField} 
                            style={{ 
                                fontSize: 14, 
                                borderRadius: 6, 
                                padding: '6px 12px', 
                              background: '#a5d8ff', 
                              border: 'none', 
                              color: '#2d3142', 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              width: 'auto',
                                minWidth: '90px',
                                whiteSpace: 'nowrap'
                            }}
                          >
                              Agregar Campo
                          </button>
                        </div>
                      ) : (
                          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                            <button onClick={saveField} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#b6e2d3', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Guardar</button>
                            <button type="button" onClick={() => removeField(selectedSectionIdx, selectedFieldIdx)} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#ffd6e0', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Eliminar</button>
                            <button type="button" onClick={() => { setSelectedFieldIdx(null); setCurrentField(createDefaultField()); }} style={{ fontSize: 14, borderRadius: 6, padding: '6px 12px', background: '#f0f4f8', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Cancelar</button>
                        </div>
                      )}
                    </div>
                  </div>
                </fieldset>
              </div>
            </form>
            )}
          </>
        )}

        {/* Vista previa del formulario */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 24,
          border: '1px solid #f59e0b',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#92400e', 
            margin: '0 0 20px 0',
            textAlign: 'center',
            padding: '8px 16px',
            background: '#fef3c7',
            borderRadius: 8,
            border: '1px solid #f59e0b'
          }}>
            📋 Vista Previa del Formulario
          </h3>
          
          {sections.filter(s => s.activo !== false).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h4 style={{ fontSize: 18, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
                No hay secciones configuradas
              </h4>
              <p style={{ color: '#92400e', fontSize: 14, margin: 0 }}>
                Crea tu primera sección para ver la vista previa del formulario
              </p>
            </div>
          ) : (
            sections.filter(s => s.activo !== false).map((section, sectionIdx) => (
              <div key={section.id} style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #fbbf24' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#fef3c7', borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>{getIconEmoji(section.icono)}</span>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#92400e', margin: 0 }}>
                    {section.titulo || 'Sección sin título'}
                  </h4>
                </div>
                
                {section.campos.filter(f => f.activo !== false).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#92400e', fontSize: 14 }}>
                    Esta sección no tiene campos configurados
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gap: 12,
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    width: '100%'
                  }}>
                    {(() => {
                      const camposActivos = section.campos.filter(f => f.activo !== false).sort((a, b) => a.order - b.order);
                      console.log(`🔍 Vista previa - Sección "${section.titulo}":`, section);
                      console.log(`🔍 Vista previa - Campos activos:`, camposActivos);
                      return camposActivos.map(renderField);
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Botón para mostrar JSON */}
        <div style={{ marginBottom: 24 }}>
          <button 
            type="button" 
            onClick={() => setShowJson(!showJson)} 
            style={{ 
              fontSize: 14, 
              borderRadius: 6, 
              padding: '8px 16px', 
              background: '#6366f1', 
              border: 'none', 
              color: '#fff', 
              fontWeight: 600, 
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {showJson ? 'Ocultar estructura JSON' : 'Mostrar estructura JSON'}
          </button>
          {showJson && (
            <div className="json-container" style={{ 
              background: '#f8fafc', 
              borderRadius: 12, 
              padding: 20, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginTop: 16,
              width: '100%'
            }}>
              <pre style={{ 
                margin: 0,
                padding: 0,
                fontSize: 14, 
                lineHeight: '1.6',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                width: '100%'
              }}>
                {JSON.stringify(formJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

            {!hideInternalSaveButton && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: 24,
                padding: '16px 0',
                borderTop: '1px solid #e2e8f0'
              }}>
              <button
                  type="button"
                onClick={async () => {
                  try {
                      startLoading();
                      
                      // Debug: mostrar información sobre el estado actual
                      console.log('🔍 Debug validación guardar:');
                      console.log('- formName:', formName);
                      console.log('- formName.trim():', formName.trim());
                      console.log('- sections:', sections);
                      console.log('- sections.length:', sections.length);
                      console.log('- sections activas:', sections.filter(s => s.activo !== false));
                      console.log('- sections con campos:', sections.filter(s => s.campos && s.campos.length > 0));
                      console.log('- total campos:', sections.reduce((acc, s) => acc + (s.campos?.length || 0), 0));
                      
                      if (formName.trim() && sections.length > 0) {
                      if (onSave) {
                          // Usar callback personalizado - solo pasar el JSON formateado
                        await onSave({
                          nombre: formName,
                          descripcion: formDesc,
                            estructura_formulario: formJson // Enviar objeto JSON directamente, no como string
                            // fields: sections.flatMap(section => // This was removed
                            //   section.campos.filter(f => f.activo !== false)
                            // )
                        });
                      } else {
                          // Comportamiento original - guardar JSON completo como string
                        await plantillasService.create({
                          nombre: formName,
                          descripcion: formDesc,
                            estructura_formulario: formJson, // Enviar objeto JSON directamente, no como string
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
                        // Validación más específica
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
                  style={{ 
                    fontSize: 14, 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    background: '#339af0', 
                    border: 'none', 
                    color: '#fff', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#339af0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
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