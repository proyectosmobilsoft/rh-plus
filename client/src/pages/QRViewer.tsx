import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, Calendar, FileText, CheckCircle, XCircle, Clock, 
  MapPin, Cake, Users, Shield, AlertTriangle, Heart, Droplets, UserCheck
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { qrService } from '@/services/qrService';
import { supabase } from '@/services/supabaseClient';

interface QRData {
  id: number;
  candidato_id: number;
  fecha_generacion: string;
  fecha_vencimiento: string;
  activo: boolean;
}

interface CandidatoInfo {
  id: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  numero_documento: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  genero?: string;
  estado_civil?: string;
  direccion?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  fotografia?: string;
  grupo_sanguineo?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_relacion?: string;
  usuario_id?: number;
}

export default function QRViewer() {
  const { qrId } = useParams();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [candidatoInfo, setCandidatoInfo] = useState<CandidatoInfo | null>(null);
  const [candidatoFoto, setCandidatoFoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRegenerated, setIsRegenerated] = useState(false);

  useEffect(() => {
    const loadQRData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!qrId) {
          setError('Código QR no válido');
          return;
        }

        const decodedQRId = atob(qrId);
        const qrInfo = JSON.parse(decodedQRId);
        
        // Verificar si el QR existe en la base de datos
        const qrFromDB = await qrService.getQRByCandidato(qrInfo.id);
        if (!qrFromDB) {
          setError('Este código QR ya no existe o ha sido eliminado');
          return;
        }

        // Verificar si el QR está activo
        if (!qrFromDB.activo) {
          setError('Este código QR ha sido desactivado');
          return;
        }

        // El QR regenerado es válido si existe en la BD y está activo
        // No necesitamos comparar fechas de generación

        // Verificar vencimiento
        const now = new Date();
        const expirationDate = new Date(qrFromDB.fecha_vencimiento);
        if (now > expirationDate) {
          setIsExpired(true);
          setError('Este código QR ha vencido');
          return;
        }

        setQrData(qrFromDB);

        // Obtener información completa del candidato
        const { data: candidatoData, error: candidatoError } = await supabase
          .from('candidatos')
          .select(`
            id,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            numero_documento,
            email,
            telefono,
            fecha_nacimiento,
            genero,
            estado_civil,
            direccion,
            ciudad_id,
            fotografia,
            grupo_sanguineo,
            contacto_emergencia_nombre,
            contacto_emergencia_telefono,
            contacto_emergencia_relacion,
            usuario_id,
            ciudades:ciudad_id(nombre, departamentos:departamento_id(nombre))
          `)
          .eq('id', qrInfo.id)
          .single();

        if (candidatoError) {
          console.error('Error cargando candidato:', candidatoError);
          setError('Error al cargar la información del candidato');
          return;
        }

        if (candidatoData) {
          console.log('👤 Datos del candidato obtenidos:', {
            id: candidatoData.id,
            usuario_id: candidatoData.usuario_id,
            fotografia: candidatoData.fotografia,
            nombre: `${candidatoData.primer_nombre} ${candidatoData.primer_apellido}`
          });

          const candidatoInfo: CandidatoInfo = {
            id: candidatoData.id,
            primer_nombre: candidatoData.primer_nombre,
            segundo_nombre: candidatoData.segundo_nombre,
            primer_apellido: candidatoData.primer_apellido,
            segundo_apellido: candidatoData.segundo_apellido,
            numero_documento: candidatoData.numero_documento,
            email: candidatoData.email,
            telefono: candidatoData.telefono,
            fecha_nacimiento: candidatoData.fecha_nacimiento,
            genero: candidatoData.genero,
            estado_civil: candidatoData.estado_civil,
            direccion: candidatoData.direccion,
            ciudad_nombre: candidatoData.ciudades?.nombre,
            departamento_nombre: candidatoData.ciudades?.departamentos?.nombre,
            fotografia: candidatoData.fotografia,
            grupo_sanguineo: candidatoData.grupo_sanguineo,
            contacto_emergencia_nombre: candidatoData.contacto_emergencia_nombre,
            contacto_emergencia_telefono: candidatoData.contacto_emergencia_telefono,
            contacto_emergencia_relacion: candidatoData.contacto_emergencia_relacion,
            usuario_id: candidatoData.usuario_id,
          };
          setCandidatoInfo(candidatoInfo);

          // Usar la fotografía del candidato si está disponible
          if (candidatoData.fotografia && candidatoData.fotografia.trim() !== '') {
            setCandidatoFoto(candidatoData.fotografia);
          } else if (candidatoData.usuario_id) {
            // Si no hay fotografía en candidatos, intentar obtenerla del usuario relacionado
            console.log('🔍 Buscando foto del usuario con ID:', candidatoData.usuario_id);
            
            const { data: usuarioData, error: usuarioError } = await supabase
              .from('gen_usuarios')
              .select('*')
              .eq('id', candidatoData.usuario_id)
              .single();

            console.log('📸 Datos del usuario obtenidos:', { usuarioData, usuarioError });

            if (!usuarioError && usuarioData) {
              // Buscar foto en diferentes campos posibles
              const posiblesCamposFoto = [
                'foto_base64',
                'foto',
                'imagen',
                'avatar',
                'photo',
                'image',
                'fotografia'
              ];

              let fotoEncontrada = null;
              let campoEncontrado = null;

              for (const campo of posiblesCamposFoto) {
                const valor = usuarioData[campo];
                if (valor && 
                    valor !== null && 
                    valor !== undefined && 
                    valor.toString().trim() !== '') {
                  fotoEncontrada = valor;
                  campoEncontrado = campo;
                  break;
                }
              }

              if (fotoEncontrada) {
                console.log(`✅ Foto del usuario encontrada en campo '${campoEncontrado}':`, {
                  campo: campoEncontrado,
                  longitud: fotoEncontrada.toString().length,
                  preview: fotoEncontrada.toString().substring(0, 50) + '...'
                });
                setCandidatoFoto(fotoEncontrada);
              } else {
                console.log('❌ No se encontró foto del usuario en ningún campo:', {
                  camposDisponibles: Object.keys(usuarioData),
                  valoresFoto: posiblesCamposFoto.map(campo => ({
                    campo,
                    valor: usuarioData[campo],
                    esNull: usuarioData[campo] === null,
                    esUndefined: usuarioData[campo] === undefined,
                    esStringVacio: usuarioData[campo] === '',
                    longitud: usuarioData[campo]?.toString()?.length
                  }))
                });
              }
            } else {
              console.log('❌ Error al obtener datos del usuario:', usuarioError);
            }
          } else {
            console.log('❌ No hay usuario_id asociado al candidato');
          }
        }

      } catch (err) {
        console.error('Error al decodificar QR:', err);
        setError('Error al cargar la información del QR');
      } finally {
        setIsLoading(false);
      }
    };

    if (qrId) {
      loadQRData();
    }
  }, [qrId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !qrData || !candidatoInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            {isRegenerated ? (
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isRegenerated ? 'QR Regenerado' : 'Error de Acceso'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {isRegenerated && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-sm text-amber-800">
                <strong>¿Por qué ocurre esto?</strong><br />
                El código QR que estás intentando escanear ha sido regenerado por el sistema. 
                Esto puede ocurrir cuando se actualiza la información del candidato o por motivos de seguridad.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const nombreCompleto = `${candidatoInfo.primer_nombre} ${candidatoInfo.segundo_nombre || ''} ${candidatoInfo.primer_apellido} ${candidatoInfo.segundo_apellido || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-cyan-100 rounded-full mb-4 overflow-hidden shadow-lg">
            {candidatoFoto ? (
              <img 
                src={candidatoFoto}
                alt="Foto del candidato"
                className="w-full h-full object-cover"
                onError={() => setCandidatoFoto(null)}
              />
            ) : (
              <User className="h-12 w-12 text-cyan-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Información del Candidato
          </h1>
          <p className="text-gray-600">
            Código QR verificado y válido
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <Badge className="bg-green-100 text-green-700 border-green-200 px-6 py-3 text-sm font-medium">
            <CheckCircle className="w-5 h-5 mr-2" />
            QR Válido y Activo
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Información Personal */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="flex items-center text-xl text-gray-800">
                <User className="w-6 h-6 mr-3 text-cyan-600" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nombre Completo</label>
                  <p className="text-lg text-gray-800 mt-1 font-medium">{nombreCompleto}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Documento</label>
                    <p className="text-gray-800 mt-1 font-medium">{candidatoInfo.numero_documento}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Género</label>
                    <p className="text-gray-800 mt-1">{candidatoInfo.genero || 'No especificado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fecha de Nacimiento</label>
                    <p className="text-gray-800 mt-1 flex items-center">
                      <Cake className="w-4 h-4 mr-2 text-gray-400" />
                      {candidatoInfo.fecha_nacimiento ? 
                        new Date(candidatoInfo.fecha_nacimiento).toLocaleDateString() : 
                        'No especificado'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Estado Civil</label>
                    <p className="text-gray-800 mt-1">{candidatoInfo.estado_civil || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center text-xl text-gray-800">
                <Phone className="w-6 h-6 mr-3 text-blue-600" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Correo Electrónico</label>
                  <p className="text-gray-800 mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {candidatoInfo.email || 'No especificado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Teléfono</label>
                  <p className="text-gray-800 mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {candidatoInfo.telefono || 'No especificado'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Dirección</label>
                  <p className="text-gray-800 mt-1 flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{candidatoInfo.direccion || 'No especificada'}</span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ubicación</label>
                  <p className="text-gray-800 mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {candidatoInfo.ciudad_nombre && candidatoInfo.departamento_nombre ? 
                      `${candidatoInfo.ciudad_nombre}, ${candidatoInfo.departamento_nombre}` : 
                      'No especificada'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Médica y de Emergencia */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-pink-50">
              <CardTitle className="flex items-center text-xl text-gray-800">
                <Heart className="w-6 h-6 mr-3 text-red-600" />
                Información Médica y de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Grupo Sanguíneo</label>
                    <p className="text-gray-800 mt-1 flex items-center">
                      <Droplets className="w-4 h-4 mr-2 text-red-400" />
                      {candidatoInfo.grupo_sanguineo || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Estado de Salud</label>
                    <p className="text-gray-800 mt-1 flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-green-400" />
                      Información disponible
                    </p>
                  </div>
                </div>

                {(candidatoInfo.contacto_emergencia_nombre || candidatoInfo.contacto_emergencia_telefono) && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                      Contacto de Emergencia
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nombre</label>
                        <p className="text-gray-800 mt-1 font-medium">
                          {candidatoInfo.contacto_emergencia_nombre || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Relación</label>
                        <p className="text-gray-800 mt-1">
                          {candidatoInfo.contacto_emergencia_relacion || 'No especificada'}
                        </p>
                      </div>
                    </div>
                    {candidatoInfo.contacto_emergencia_telefono && (
                      <div className="mt-4">
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Teléfono de Emergencia</label>
                        <p className="text-gray-800 mt-1 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-red-500" />
                          <span className="font-mono text-lg font-semibold text-red-600">
                            {candidatoInfo.contacto_emergencia_telefono}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información del QR */}
        <Card className="mt-6 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center text-xl text-gray-800">
              <Shield className="w-6 h-6 mr-3 text-gray-600" />
              Información del Código QR
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Estado</label>
                <p className="text-gray-800 mt-1 font-medium">Activo y Válido</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fecha de Generación</label>
                <p className="text-gray-800 mt-1">
                  {new Date(qrData.fecha_generacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fecha de Vencimiento</label>
                <p className="text-gray-800 mt-1">
                  {new Date(qrData.fecha_vencimiento).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-gray-400 mr-2" />
            <p className="text-sm text-gray-500 font-medium">
              Información verificada y segura
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Generado por el sistema de Gestión de Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  );
}