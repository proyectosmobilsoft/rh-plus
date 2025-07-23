import React, { useContext, useState } from "react";
import FormBuilder from "@/components/FormBuilder";
import FormPreview from "@/components/FormPreview";
import { useNavigate } from "react-router-dom";

interface Plantilla {
  id: number;
  name: string;
  description: string;
  fields: any[];
}

// Contexto global para plantillas
const PlantillasContext = React.createContext<{
  plantillas: Plantilla[];
  addPlantilla: (p: Plantilla) => void;
} | null>(null);

export const usePlantillas = () => {
  const ctx = useContext(PlantillasContext);
  if (!ctx) throw new Error("usePlantillas debe usarse dentro de PlantillasProvider");
  return ctx;
};

export const PlantillasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const addPlantilla = (p: Plantilla) => setPlantillas(prev => [...prev, p]);
  return (
    <PlantillasContext.Provider value={{ plantillas, addPlantilla }}>
      {children}
    </PlantillasContext.Provider>
  );
};

const FormGalleryPage: React.FC = () => {
  const { plantillas } = usePlantillas();
  const [detalle, setDetalle] = useState<Plantilla | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Galería de Formularios</h1>
      <p className="text-gray-600 mb-8">Explora las plantillas de formularios disponibles en el sistema.</p>

      {detalle ? (
        <div className="mb-8 border rounded p-4 bg-white">
          <h2 className="text-xl font-semibold mb-2">{detalle.name}</h2>
          <p className="mb-4 text-gray-600">{detalle.description}</p>
          {/* Renderizar la plantilla solo visualización */}
          <FormPreview fields={detalle.fields} />
          <button className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={() => setDetalle(null)}>Volver a la galería</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantillas.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{form.name}</h2>
                <p className="text-gray-600 text-sm mb-4">{form.description}</p>
                <div className="flex justify-between items-center text-gray-500 text-xs">
                  <span>Campos: {form.fields.length}</span>
                </div>
              </div>
              <div className="bg-gray-100 p-4 border-t border-gray-200 text-right">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setDetalle(form)}
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          ))}
          {plantillas.length === 0 && <div className="text-gray-500">No hay plantillas aún.</div>}
        </div>
      )}
    </div>
  );
};

export default FormGalleryPage; 