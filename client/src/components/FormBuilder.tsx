import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePlantillas } from "@/pages/admin/FormGalleryPage";
import { useNavigate } from "react-router-dom";

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

const defaultField = {
  id: uuidv4(), // Siempre inicializar con un ID único
  type: 'text',
  label: '',
  name: '',
  required: false,
  order: 1,
  dimension: 12,
  options: '',
};

function reorder(list: any[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((f, i) => ({ ...f, order: i + 1 }));
}

const FormBuilder: React.FC<{ precargados?: any[], readOnly?: boolean }> = ({ precargados, readOnly = false }) => {
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [field, setField] = useState({ ...defaultField });
  const [showJson, setShowJson] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const plantillasCtx = !readOnly ? (() => { try { return usePlantillas(); } catch { return null; } })() : null;
  const navigate = !readOnly ? (() => { try { return useNavigate(); } catch { return () => {}; } })() : null;

  // Inicializar campos precargados con IDs únicos
  useEffect(() => {
    if (precargados) {
      setFields(precargados.map(f => ({
        ...f,
        id: f.id || uuidv4()
      })));
    }
  }, [precargados]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setField(f => ({
      ...f,
      [name]: newValue,
    }));
  };

  const addField = (e: React.FormEvent) => {
    e.preventDefault();
    setFields(prev => [...prev, { ...field, id: uuidv4(), order: fields.length + 1 }]);
    setField({ ...defaultField, id: '' });
  };

  const selectField = (idx: number) => {
    setSelectedIdx(idx);
    setField({ ...fields[idx] });
  };

  const saveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIdx !== null) {
      const updated = [...fields];
      updated[selectedIdx] = { ...field };
      setFields(updated);
      setSelectedIdx(null);
      setField({ ...defaultField, id: '' });
    }
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i + 1 })));
    setSelectedIdx(null);
    setField({ ...defaultField, id: '' });
  };

  const onDragStart = (idx: number) => setDraggedIdx(idx);
  const onDragOver = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    setFields(f => reorder(f, draggedIdx, idx));
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  const renderField = (f: any, i: number) => {
    const width = `${(f.dimension / 12) * 100}%`;
    switch (f.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
            <input type={f.type} name={f.name} required={f.required} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }} />
          </div>
        );
      case 'textarea':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
            <textarea name={f.name} required={f.required} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }} />
          </div>
        );
      case 'select':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} required={f.required} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }}>
              {f.options.split(',').map((opt: string, idx: number) => <option key={idx} value={opt.trim()}>{opt.trim()}</option>)}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={f.id} style={{ width, padding: 8, display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" name={f.name} required={f.required} style={{ marginRight: 8 }} />
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
          </div>
        );
      case 'radio':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label><br />
            {f.options.split(',').map((opt: string, idx: number) => (
              <label key={idx} style={{ marginRight: 12 }}>
                <input type="radio" name={f.name} value={opt.trim()} required={f.required} /> {opt.trim()}
              </label>
            ))}
          </div>
        );
      case 'title':
        return (
          <div key={f.id} style={{ width, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ fontSize: 22, color: '#339af0', fontWeight: 700, margin: 0 }}>{f.label}</h3>
          </div>
        );
      case 'foreignKey':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
            <select name={f.name} required={f.required} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }}>
              {f.options.split(',').map((opt: string, idx: number) => <option key={idx} value={opt.trim()}>{opt.trim()}</option>)}
            </select>
          </div>
        );
      case 'percent':
        return (
          <div key={f.id} style={{ width, padding: 8 }}>
            <label style={{ fontWeight: 500 }}>{f.label}{f.required && ' *'}</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="number" name={f.name} min={0} max={100} required={f.required} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }} />
              <span style={{ marginLeft: 6, fontWeight: 600, color: '#7b8794' }}>%</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const formJson = {
    name: formName,
    description: formDesc,
    fields: fields.map(f => ({
      type: f.type,
      label: f.label,
      name: f.name,
      required: f.required,
      order: f.order,
      dimension: f.dimension,
      options: f.options || undefined,
    })),
  };

  return (
    <div style={{ background: '#f8fafc', display: 'flex', height: '100%' }}>
      {!readOnly && (
        <div style={{ width: 260, background: '#fff', borderRight: '1px solid #e0e7ef', padding: '2rem 1rem', borderRadius: '0 24px 24px 0', boxShadow: '2px 0 12px 0 rgba(0,0,0,0.03)' }}>
          <h3 style={{ color: '#7b8794', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Campos</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {fields.map((f, i) => (
              <li
                key={f.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => { e.preventDefault(); onDragOver(i); }}
                onDragEnd={onDragEnd}
                onDrop={onDragEnd}
                onClick={() => selectField(i)}
                style={{
                  background: selectedIdx === i ? '#a5d8ff' : '#f0f4f8',
                  color: '#2d3142',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  border: selectedIdx === i ? '2px solid #339af0' : '1px solid #e0e7ef',
                  fontWeight: 500,
                  boxShadow: draggedIdx === i ? '0 2px 8px 0 rgba(0,0,0,0.08)' : undefined,
                  opacity: draggedIdx === i ? 0.7 : 1,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                {f.label || '(Sin label)'} <span style={{ fontSize: 13, color: '#7b8794' }}>({f.type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
        {!readOnly && (
          <>
            <h2 style={{ textAlign: 'center', color: '#7b8794', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Generador de órdenes de servicio</h2>
            <form style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Nombre de la plantilla</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16, marginBottom: 8 }} />
                <label>Descripción</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e0e7ef', fontSize: 16 }} />
              </div>
              <div style={{ flex: 2, minWidth: 320 }}>
                <fieldset style={{ border: '1px solid #e0e7ef', borderRadius: 12, padding: 16, marginBottom: 8 }}>
                  <legend>{selectedIdx === null ? 'Agregar campo' : 'Editar campo'}</legend>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <select name="type" value={field.type} onChange={handleFieldChange} style={{ fontSize: 16, borderRadius: 8, padding: 8 }}>
                      {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                    <input name="label" placeholder="Label" value={field.label} onChange={handleFieldChange} style={{ fontSize: 16, borderRadius: 8, padding: 8 }} />
                    <input name="name" placeholder="Name" value={field.name} onChange={handleFieldChange} style={{ fontSize: 16, borderRadius: 8, padding: 8 }} />
                    <input name="order" type="number" min={1} max={99} value={field.order} onChange={handleFieldChange} style={{ width: 60, fontSize: 16, borderRadius: 8, padding: 8 }} />
                    <input name="dimension" type="number" min={1} max={12} value={field.dimension} onChange={handleFieldChange} style={{ width: 60, fontSize: 16, borderRadius: 8, padding: 8 }} />
                    {(field.type === 'select' || field.type === 'radio' || field.type === 'foreignKey') && (
                      <input name="options" placeholder="Opciones (separadas por coma)" value={field.options} onChange={handleFieldChange} style={{ fontSize: 16, borderRadius: 8, padding: 8, minWidth: 180 }} />
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input name="required" type="checkbox" checked={field.required} onChange={handleFieldChange} /> Requerido
                    </label>
                    {selectedIdx === null ? (
                      <button onClick={addField} style={{ fontSize: 16, borderRadius: 8, padding: '8px 16px', background: '#a5d8ff', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer' }}>Agregar</button>
                    ) : (
                      <>
                        <button onClick={saveField} style={{ fontSize: 16, borderRadius: 8, padding: '8px 16px', background: '#b6e2d3', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                        <button type="button" onClick={() => removeField(selectedIdx)} style={{ fontSize: 16, borderRadius: 8, padding: '8px 16px', background: '#ffd6e0', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>Eliminar</button>
                        <button type="button" onClick={() => { setSelectedIdx(null); setField({ ...defaultField, id: '' }); }} style={{ fontSize: 16, borderRadius: 8, padding: '8px 16px', background: '#f0f4f8', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>Cancelar</button>
                      </>
                    )}
                  </div>
                </fieldset>
              </div>
            </form>
            <button
              onClick={() => {
                if (plantillasCtx && navigate) {
                  plantillasCtx.addPlantilla({
                    id: Date.now(),
                    name: formName,
                    description: formDesc,
                    fields: fields,
                  });
                  navigate("/admin/form-gallery");
                } else {
                  alert(JSON.stringify(formJson, null, 2));
                }
              }}
              style={{ fontSize: 16, borderRadius: 8, padding: '10px 18px', background: '#339af0', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
            >
              Guardar plantilla
            </button>
          </>
        )}
        
        <h3 style={{ color: '#7b8794', fontWeight: 600, fontSize: 22, margin: '24px 0 12px' }}>{readOnly ? 'Vista previa' : 'Preview'}</h3>
        <form style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          {(() => {
            const sortedFields = [...fields].sort((a, b) => a.order - b.order);
            const rows: any[][] = [];
            let currentRow: any[] = [];
            let currentSum = 0;
            sortedFields.forEach(f => {
              const dim = Number(f.dimension) || 1;
              if (currentSum + dim > 12) {
                rows.push(currentRow);
                currentRow = [];
                currentSum = 0;
              }
              currentRow.push(f);
              currentSum += dim;
            });
            if (currentRow.length > 0) rows.push(currentRow);
            return rows.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', flexWrap: 'nowrap', gap: 15 }}>
                {row.map(renderField)}
              </div>
            ));
          })()}
        </form>
        
        {!readOnly && (
          <>
            <button onClick={() => setShowJson(s => !s)} style={{ fontSize: 16, borderRadius: 8, padding: '10px 18px', background: '#b6e2d3', border: 'none', color: '#2d3142', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
              {showJson ? 'Ocultar JSON' : 'Mostrar estructura JSON'}
            </button>
            {showJson && (
              <pre style={{ background: '#f0f4f8', borderRadius: 12, padding: 16, fontSize: 15, overflowX: 'auto' }}>{JSON.stringify(formJson, null, 2)}</pre>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FormBuilder; 