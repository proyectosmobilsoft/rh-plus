import React from 'react';

interface FormPreviewProps {
  fields: any[];
}

const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  if (!fields || fields.length === 0) {
    return <div className="text-gray-500">No hay campos para mostrar.</div>;
  }

  const renderField = (f: any) => {
    const width = `${(f.dimension / 12) * 100}%`;
    
    switch (f.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'date':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="w-full p-2 rounded border bg-gray-50 text-sm truncate">{f.defaultValue || ''}</div>
          </div>
        );
      case 'textarea':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="w-full p-2 rounded border bg-gray-50 min-h-[60px] text-sm break-words">{f.defaultValue || ''}</div>
          </div>
        );
      case 'select':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="w-full p-2 rounded border bg-gray-50 text-sm">
              {f.options?.split(',').map((opt: string) => (
                <div key={opt.trim()} className="px-2 py-1 text-gray-600 text-xs">{opt.trim()}</div>
              ))}
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <div className="flex items-center">
              <input type="checkbox" disabled className="mr-2" />
              <label className="font-medium text-sm">{f.label}{f.required && ' *'}</label>
            </div>
          </div>
        );
      case 'radio':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="space-y-1">
              {f.options?.split(',').map((opt: string) => (
                <div key={opt.trim()} className="flex items-center">
                  <input type="radio" disabled className="mr-2" />
                  <span className="text-sm">{opt.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'title':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="flex items-center justify-center min-w-0">
            <h3 className="text-lg font-bold text-blue-500 text-center break-words">{f.label}</h3>
          </div>
        );
      case 'foreignKey':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="w-full p-2 rounded border bg-gray-50 text-sm">
              {f.options?.split(',').map((opt: string) => (
                <div key={opt.trim()} className="px-2 py-1 text-gray-600 text-xs">{opt.trim()}</div>
              ))}
            </div>
          </div>
        );
      case 'percent':
        return (
          <div key={f.id} style={{ width, padding: 8 }} className="min-w-0">
            <label className="block font-medium mb-1 text-sm">{f.label}{f.required && ' *'}</label>
            <div className="flex items-center">
              <div className="flex-1 p-2 rounded border bg-gray-50 text-sm">{f.defaultValue || '0'}</div>
              <span className="ml-2 font-semibold text-gray-600 text-sm">%</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Agrupar campos en filas según dimension
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

  return (
    <div className="bg-white rounded-lg p-4 max-w-full overflow-hidden">
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={idx} className="flex flex-wrap gap-2 md:gap-4">
            {row.map(renderField)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormPreview; 

