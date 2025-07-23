import React, { useState } from "react";
import FormBuilder from "@/components/FormBuilder";

interface Plantilla {
  id: number;
  name: string;
  description: string;
  json: any;
}

const PlantillasPage: React.FC = () => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState<Plantilla | null>(null);

  // Simulación: Recibe la plantilla del builder
  const handleSavePlantilla = (json: any) => {
    if (editing) {
      setPlantillas(prev => prev.map(p => p.id === editing.id ? { ...editing, ...json } : p));
      setEditing(null);
    } else {
      setPlantillas(prev => [
        ...prev,
        { id: Date.now(), ...json }
      ]);
    }
    setShowBuilder(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Plantillas Globales</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => { setShowBuilder(true); setEditing(null); }}
      >
        Nueva Plantilla
      </button>
      {showBuilder && (
        <div className="mb-8 border rounded p-4 bg-white">
          {/* Aquí podrías pasar props para guardar la plantilla */}
          <FormBuilder />
          {/*
          <FormBuilder
            initialData={editing}
            onSave={handleSavePlantilla}
            onCancel={() => { setShowBuilder(false); setEditing(null); }}
          />
          */}
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">Plantillas existentes</h2>
      <ul className="space-y-2">
        {plantillas.map(p => (
          <li key={p.id} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
            <div>
              <div className="font-bold">{p.name}</div>
              <div className="text-gray-600 text-sm">{p.description}</div>
            </div>
            <button
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => { setEditing(p); setShowBuilder(true); }}
            >
              Editar
            </button>
          </li>
        ))}
        {plantillas.length === 0 && <li className="text-gray-500">No hay plantillas aún.</li>}
      </ul>
    </div>
  );
};

export default PlantillasPage; 