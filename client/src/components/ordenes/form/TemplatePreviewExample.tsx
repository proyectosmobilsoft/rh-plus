import React from "react";
import { TemplatePreview } from "./TemplatePreview";

// Ejemplo de uso del TemplatePreview con la estructura de plantilla
export function TemplatePreviewExample() {
  // Esta es la estructura de plantilla que proporcionaste
  const estructuraPlantilla = {
    "id": 35,
    "nombre": "Orden de ingreso",
    "descripcion": "Plantilla para solicitud de ingreso de colaboradores",
    "es_default": false,
    "estructura_formulario": {
      "secciones": [
        {
          "campos": [
            {
              "tipo": "number",
              "label": "Documento",
              "order": 1,
              "nombre": "documento",
              "colspan": "col-span-6",
              "required": true,
              "dimension": 6,
              "gridColumnSpan": "span 6"
            },
            {
              "tipo": "email",
              "label": "Correo Electrónico",
              "order": "3",
              "nombre": "correo_electronico",
              "colspan": "col-span-6",
              "required": true,
              "dimension": 6,
              "gridColumnSpan": "span 6"
            },
            {
              "tipo": "text",
              "label": "Nombre Completo",
              "order": "2",
              "nombre": "correo_electronico",
              "colspan": "col-span-12",
              "required": true,
              "dimension": "20",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "text",
              "label": "Dirección",
              "order": 4,
              "nombre": "dirección",
              "colspan": "col-span-12",
              "required": false,
              "dimension": "20",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "text",
              "label": "Tipo de Sangre y Factor ",
              "order": 5,
              "nombre": "tipodesangreyfactor",
              "colspan": "col-span-4",
              "required": false,
              "dimension": "4",
              "gridColumnSpan": "span 4"
            }
          ],
          "layout": "grid-cols-12",
          "titulo": "Datos Personales"
        },
        {
          "campos": [
            {
              "tipo": "text",
              "label": "Cargo a Desempeñar",
              "order": 1,
              "nombre": "cargoadesempeñar",
              "colspan": "col-span-12",
              "required": false,
              "dimension": "20",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "textarea",
              "label": "Función principal a desempeñar",
              "order": 2,
              "nombre": "funciónprincipaladesempeñar",
              "colspan": "col-span-12",
              "required": false,
              "dimension": "200",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "checkbox",
              "label": "Trabajo de altura",
              "order": 3,
              "nombre": "trabajodealtura",
              "colspan": "col-span-12",
              "required": false,
              "dimension": 12,
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "date",
              "label": "Fecha de Incio",
              "order": 4,
              "nombre": "fechadeincio",
              "colspan": "col-span-12",
              "required": false,
              "dimension": "12",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "select",
              "label": "Tipo de ARL",
              "order": 5,
              "nombre": "tipodearl",
              "colspan": "col-span-12",
              "opciones": [
                "I",
                "II",
                "III",
                "IV",
                "V"
              ],
              "required": false,
              "dimension": "12",
              "gridColumnSpan": "span 12"
            },
            {
              "tipo": "text",
              "label": "Jornada de Trabajo",
              "order": 6,
              "nombre": "jornadadetrabajo",
              "colspan": "col-span-12",
              "required": false,
              "dimension": "12",
              "gridColumnSpan": "span 12"
            }
          ],
          "layout": "grid-cols-12",
          "titulo": "Desarrollo de actividades"
        }
      ]
    },
    "activa": true,
    "created_at": "2025-08-26T20:49:36.266643+00:00",
    "updated_at": "2025-08-26T21:33:13.202+00:00"
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vista Previa de Plantilla: {estructuraPlantilla.nombre}
        </h1>
        <p className="text-gray-600">{estructuraPlantilla.descripcion}</p>
      </div>

      {/* Aquí se renderiza la vista previa usando el nuevo TemplatePreview */}
      <TemplatePreview 
        estructuraFormulario={estructuraPlantilla.estructura_formulario}
      />
    </div>
  );
}
