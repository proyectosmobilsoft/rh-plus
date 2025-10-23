
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDatePicker } from '@/components/ui/date-picker';

interface Aspirante {
  identificacion?: string;
  tipoDocumento?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  empresa?: string;
  ciudad?: string;
  direccion?: string;
  horarioTrabajo?: string;
  cargoAspira?: string;
  actividadEconomica?: string;
  eps?: string;
  arl?: string;
  fondoPensiones?: string;
  nivelEducativo?: string;
  remuneracionSalarial?: string | number;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  grupoSanguineo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaCelular?: string;
  contactoEmergenciaCorreo?: string;
}

interface DatosPersonalesFormProps {
  formData: Partial<Aspirante>;
  onChange: (field: string, value: any) => void;
}

export const DatosPersonalesForm: React.FC<DatosPersonalesFormProps> = ({ formData, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const tiposDocumento = [
    { id: 'CC', label: 'Cédula de Ciudadanía' },
    { id: 'CE', label: 'Cédula de Extranjería' },
    { id: 'TI', label: 'Tarjeta de Identidad' },
    { id: 'NIT', label: 'NIT' },
    { id: 'PP', label: 'Pasaporte' },
  ];

  const sexoOpciones = [
    { id: 'M', label: 'Masculino' },
    { id: 'F', label: 'Femenino' },
    { id: 'O', label: 'Otro' },
  ];

  const estadoCivilOpciones = [
    { id: 'soltero', label: 'Soltero/a' },
    { id: 'casado', label: 'Casado/a' },
    { id: 'union_libre', label: 'Unión Libre' },
    { id: 'divorciado', label: 'Divorciado/a' },
    { id: 'viudo', label: 'Viudo/a' },
  ];

  const grupoSanguineoOpciones = [
    { id: 'A+', label: 'A+' },
    { id: 'A-', label: 'A-' },
    { id: 'B+', label: 'B+' },
    { id: 'B-', label: 'B-' },
    { id: 'AB+', label: 'AB+' },
    { id: 'AB-', label: 'AB-' },
    { id: 'O+', label: 'O+' },
    { id: 'O-', label: 'O-' },
  ];

  // Opciones comunes en el área de salud ocupacional
  const epsOpciones = [
    { id: 'nueva_eps', label: 'Nueva EPS' },
    { id: 'compensar', label: 'Compensar EPS' },
    { id: 'sanitas', label: 'EPS Sanitas' },
    { id: 'sura', label: 'EPS Sura' },
    { id: 'salud_total', label: 'Salud Total' },
    { id: 'famisanar', label: 'Famisanar' },
    { id: 'coomeva', label: 'Coomeva EPS' },
    { id: 'medimas', label: 'Medimás' },
    { id: 'aliansalud', label: 'Aliansalud' },
    { id: 'coosalud', label: 'Coosalud' },
    { id: 'otra', label: 'Otra' },
  ];

  const arlOpciones = [
    { id: 'positiva', label: 'Positiva' },
    { id: 'sura', label: 'ARL Sura' },
    { id: 'bolivar', label: 'Seguros Bolívar' },
    { id: 'colmena', label: 'Colmena Seguros' },
    { id: 'axa_colpatria', label: 'AXA Colpatria' },
    { id: 'liberty', label: 'Liberty Seguros' },
    { id: 'equidad', label: 'La Equidad Seguros' },
    { id: 'mapfre', label: 'Mapfre' },
    { id: 'otra', label: 'Otra' },
  ];

  const fondoPensionesOpciones = [
    { id: 'colpensiones', label: 'Colpensiones' },
    { id: 'porvenir', label: 'Porvenir' },
    { id: 'proteccion', label: 'Protección' },
    { id: 'colfondos', label: 'Colfondos' },
    { id: 'old_mutual', label: 'Old Mutual' },
    { id: 'otra', label: 'Otra' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label htmlFor="tipoDocumento" className="text-sm font-medium">
            Tipo Documento
          </label>
          <Select
            value={formData.tipoDocumento || ''}
            onValueChange={(value) => onChange('tipoDocumento', value)}
          >
            <SelectTrigger id="tipoDocumento">
              <SelectValue placeholder="Tipo Documento" />
            </SelectTrigger>
            <SelectContent>
              {tiposDocumento.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="identificacion" className="text-sm font-medium">
            Número Documento
          </label>
          <Input
            id="identificacion"
            name="identificacion"
            placeholder="Ingrese documento"
            value={formData.identificacion || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombres
          </label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ingrese nombres"
            value={formData.nombre || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="apellido" className="text-sm font-medium">
            Apellidos
          </label>
          <Input
            id="apellido"
            name="apellido"
            placeholder="Ingrese apellidos"
            value={formData.apellido || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <Input
            id="telefono"
            name="telefono"
            placeholder="Ingrese teléfono"
            value={formData.telefono || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="correo" className="text-sm font-medium">
            Correo Electrónico
          </label>
          <Input
            id="correo"
            name="correo"
            type="email"
            placeholder="Ingrese email"
            value={formData.correo || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ciudad" className="text-sm font-medium">
            Ciudad
          </label>
          <Select
            value={formData.ciudad || ''}
            onValueChange={(value) => onChange('ciudad', value)}
          >
            <SelectTrigger id="ciudad">
              <SelectValue placeholder="Seleccione una ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bogota">Bogotá</SelectItem>
              <SelectItem value="medellin">Medellín</SelectItem>
              <SelectItem value="cali">Cali</SelectItem>
              <SelectItem value="barranquilla">Barranquilla</SelectItem>
              <SelectItem value="cartagena">Cartagena</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="direccion" className="text-sm font-medium">
            Dirección
          </label>
          <Input
            id="direccion"
            name="direccion"
            placeholder="Ingrese dirección"
            value={formData.direccion || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="empresa" className="text-sm font-medium">
            Empresa Actual
          </label>
          <Input
            id="empresa"
            name="empresa"
            placeholder="Ingrese empresa"
            value={formData.empresa || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="horarioTrabajo" className="text-sm font-medium">
            Horario de Trabajo
          </label>
          <Select
            value={formData.horarioTrabajo || ''}
            onValueChange={(value) => onChange('horarioTrabajo', value)}
          >
            <SelectTrigger id="horarioTrabajo">
              <SelectValue placeholder="Seleccione horario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diurno">Diurno</SelectItem>
              <SelectItem value="nocturno">Nocturno</SelectItem>
              <SelectItem value="rotativo">Rotativo</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="cargoAspira" className="text-sm font-medium">
            Cargo al que Aspira
          </label>
          <Input
            id="cargoAspira"
            name="cargoAspira"
            placeholder="Ingrese cargo"
            value={formData.cargoAspira || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="actividadEconomica" className="text-sm font-medium">
            Actividad Económica (CIIU)
          </label>
          <Input
            id="actividadEconomica"
            name="actividadEconomica"
            placeholder="Ingrese código CIIU"
            value={formData.actividadEconomica || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="eps" className="text-sm font-medium">
            EPS
          </label>
          <Select
            value={formData.eps || ''}
            onValueChange={(value) => onChange('eps', value)}
          >
            <SelectTrigger id="eps">
              <SelectValue placeholder="Seleccione EPS" />
            </SelectTrigger>
            <SelectContent>
              {epsOpciones.map(eps => (
                <SelectItem key={eps.id} value={eps.id}>
                  {eps.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="arl" className="text-sm font-medium">
            ARL
          </label>
          <Select
            value={formData.arl || ''}
            onValueChange={(value) => onChange('arl', value)}
          >
            <SelectTrigger id="arl">
              <SelectValue placeholder="Seleccione ARL" />
            </SelectTrigger>
            <SelectContent>
              {arlOpciones.map(arl => (
                <SelectItem key={arl.id} value={arl.id}>
                  {arl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="fondoPensiones" className="text-sm font-medium">
            Fondo de Pensiones
          </label>
          <Select
            value={formData.fondoPensiones || ''}
            onValueChange={(value) => onChange('fondoPensiones', value)}
          >
            <SelectTrigger id="fondoPensiones">
              <SelectValue placeholder="Seleccione Fondo" />
            </SelectTrigger>
            <SelectContent>
              {fondoPensionesOpciones.map(fondo => (
                <SelectItem key={fondo.id} value={fondo.id}>
                  {fondo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="nivelEducativo" className="text-sm font-medium">
            Nivel Educativo
          </label>
          <Select
            value={formData.nivelEducativo || ''}
            onValueChange={(value) => onChange('nivelEducativo', value)}
          >
            <SelectTrigger id="nivelEducativo">
              <SelectValue placeholder="Seleccione nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bachiller">Bachiller</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="tecnologo">Tecnólogo</SelectItem>
              <SelectItem value="profesional">Profesional</SelectItem>
              <SelectItem value="postgrado">Postgrado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="remuneracionSalarial" className="text-sm font-medium">
            Remuneración Salarial
          </label>
          <Input
            id="remuneracionSalarial"
            name="remuneracionSalarial"
            placeholder="Ingrese salario esperado"
            value={formData.remuneracionSalarial || ''}
            onChange={handleInputChange}
            type="number"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fechaNacimiento" className="text-sm font-medium">
            Fecha Nacimiento
          </label>
          <CustomDatePicker
            value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : null}
            onChange={(date) => {
              if (date) {
                // Crear fecha local sin problemas de zona horaria
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const fechaString = `${year}-${month}-${day}`;
                handleInputChange({ target: { name: 'fechaNacimiento', value: fechaString } });
              } else {
                handleInputChange({ target: { name: 'fechaNacimiento', value: '' } });
              }
            }}
            placeholder="Seleccionar fecha de nacimiento"
            maxDate={new Date()} // No permitir fechas futuras
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sexo" className="text-sm font-medium">
            Sexo
          </label>
          <Select
            value={formData.sexo || ''}
            onValueChange={(value) => onChange('sexo', value)}
          >
            <SelectTrigger id="sexo">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {sexoOpciones.map(opcion => (
                <SelectItem key={opcion.id} value={opcion.id}>{opcion.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="estadoCivil" className="text-sm font-medium">
            Estado Civil
          </label>
          <Select
            value={formData.estadoCivil || ''}
            onValueChange={(value) => onChange('estadoCivil', value)}
          >
            <SelectTrigger id="estadoCivil">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {estadoCivilOpciones.map(opcion => (
                <SelectItem key={opcion.id} value={opcion.id}>{opcion.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="grupoSanguineo" className="text-sm font-medium">
            Grupo Sanguíneo
          </label>
          <Select
            value={formData.grupoSanguineo || ''}
            onValueChange={(value) => onChange('grupoSanguineo', value)}
          >
            <SelectTrigger id="grupoSanguineo">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {grupoSanguineoOpciones.map(opcion => (
                <SelectItem key={opcion.id} value={opcion.id}>{opcion.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Contacto de Emergencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="contactoEmergenciaNombre" className="text-sm font-medium">
              Nombre y Apellido
            </label>
            <Input
              id="contactoEmergenciaNombre"
              name="contactoEmergenciaNombre"
              placeholder="Ingrese Nombre y Apellido"
              value={formData.contactoEmergenciaNombre || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactoEmergenciaCelular" className="text-sm font-medium">
              Celular de Emergencia
            </label>
            <Input
              id="contactoEmergenciaCelular"
              name="contactoEmergenciaCelular"
              placeholder="Ingrese Celular"
              value={formData.contactoEmergenciaCelular || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactoEmergenciaCorreo" className="text-sm font-medium">
              Correo Electrónico Emergencia
            </label>
            <Input
              id="contactoEmergenciaCorreo"
              name="contactoEmergenciaCorreo"
              placeholder="Ingrese Correo"
              value={formData.contactoEmergenciaCorreo || ''}
              onChange={handleInputChange}
              type="email"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

