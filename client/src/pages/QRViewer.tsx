import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Building, Calendar, FileText, Shield, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { qrService } from '@/services/qrService';
import { empresasService } from '@/services/empresasService';

interface QRData {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  empresa_id: number;
  fecha_generacion: string;
  fecha_vencimiento: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export default function QRViewer() {
  const { qrId } = useParams();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const loadQRData = async () => {
      try {
        setIsLoading(true);
        const decodedQRId = atob(qrId || '');
        const qrInfo = JSON.parse(decodedQRId);
        
        // Verificar si el QR existe en la base de datos
        const qrFromDB = await qrService.getQRByCandidato(qrInfo.id);
        if (!qrFromDB) {
          setError('Este código QR ya no existe o ha sido eliminado');
          setIsLoading(false);
          return;
        }

        // Verificar si el QR está activo
        if (!qrFromDB.activo) {
          setError('Este código QR ha sido desactivado');
          setIsLoading(false);
          return;
        }

        setQrData(qrInfo);
        
        const now = new Date();
        const expirationDate = new Date(qrInfo.fecha_vencimiento);
        setIsExpired(now > expirationDate);
        
        try {
          const empresas = await empresasService.getAll();
          const empresaEncontrada = empresas.find(emp => emp.id === qrInfo.empresa_id);
          if (empresaEncontrada) {
            setEmpresa({
              id: empresaEncontrada.id,
              razonSocial: empresaEncontrada.razonSocial,
              nit: empresaEncontrada.nit || 'No especificado',
              direccion: empresaEncontrada.direccion || 'No especificada',
              telefono: empresaEncontrada.telefono || 'No especificado',
              email: empresaEncontrada.email || 'No especificado'
            });
          } else {
            setEmpresa({
              id: 0,
              razonSocial: 'Empresa no encontrada',
              nit: 'N/A',
              direccion: 'N/A',
              telefono: 'N/A',
              email: 'N/A'
            });
          }
        } catch (empresaError) {
          console.error('Error al cargar empresa:', empresaError);
          setEmpresa({
            id: 0,
            razonSocial: 'Error al cargar empresa',
            nit: 'N/A',
            direccion: 'N/A',
            telefono: 'N/A',
            email: 'N/A'
          });
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

  if (error || !qrData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'No se pudo cargar la información'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
            <User className="h-8 w-8 text-cyan-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Información del Candidato
          </h1>
          <p className="text-gray-600">
            Código QR verificado - {empresa?.razonSocial}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {isExpired ? (
            <Badge className="bg-red-100 text-red-700 border-red-200 px-4 py-2">
              <XCircle className="w-4 h-4 mr-2" />
              QR Vencido
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              QR Válido
            </Badge>
          )}
        </div>

        {/* Información Personal */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-gray-800">
              <User className="w-5 h-5 mr-2 text-cyan-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="text-gray-800 mt-1">{qrData.nombre_completo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Documento</label>
                <p className="text-gray-800 mt-1">{qrData.tipo_documento}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Número de Documento</label>
                <p className="text-gray-800 mt-1">{qrData.numero_documento}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {qrData.email || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Teléfono</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {qrData.telefono || 'No especificado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la Empresa */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-gray-800">
              <Building className="w-5 h-5 mr-2 text-cyan-600" />
              Información de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Razón Social</label>
                <p className="text-gray-800 mt-1">{empresa?.razonSocial}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">NIT</label>
                <p className="text-gray-800 mt-1">{empresa?.nit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Dirección</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {empresa?.direccion}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Teléfono</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {empresa?.telefono}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del QR */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-gray-800">
              <FileText className="w-5 h-5 mr-2 text-cyan-600" />
              Información del QR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Generación</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(qrData.fecha_generacion).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Vencimiento</label>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(qrData.fecha_vencimiento).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Este código QR contiene información verificada del candidato
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Generado por el sistema de Gestión de Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  );
} 