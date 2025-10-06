
import React, { useRef } from 'react';
import { Orden } from '@/services/ordenesService';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrdenPDFProps {
  orden: Orden;
}

const OrdenPDF = ({ orden }: OrdenPDFProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Calculate total
  const calculateTotal = () => {
    return orden.servicios?.reduce((sum, servicio) => sum + (servicio.precio || 0), 0) || 0;
  };

  // Function to generate PDF
  const generatePDF = async () => {
    if (!pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Orden-${orden.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={generatePDF} 
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
      
      <div ref={pdfRef} className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ORDEN DE SERVICIOS</h1>
            <p className="text-gray-600">N° Orden: {orden.id}</p>
            <p className="text-gray-600">Fecha: {formatDate(orden.fecha || orden.fecha_orden)}</p>
            <p className="text-gray-600">Tipo: {orden.tipoOrden || orden.type_order}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">ESTADO</p>
            <p className={`text-lg font-semibold ${
              orden.estado?.toLowerCase() === 'aprobada' ? 'text-green-600' : 
              orden.estado?.toLowerCase() === 'anulada' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {orden.estado || 'PENDIENTE'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Empresa Info */}
          <Card className="p-4 border border-gray-200 bg-gray-50 rounded-md">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="bg-primary/10 p-1 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              EMPRESA
            </h2>
            <div className="grid gap-1 text-sm">
              <p className="font-medium text-gray-800">
                {orden.empresa?.razonSocial || orden.empresa_name || 'N/A'}
              </p>
              {orden.empresa?.nit && (
                <p className="text-gray-600">NIT: {orden.empresa.nit}-{orden.empresa.dv || '0'}</p>
              )}
              {orden.empresa?.direccion && (
                <p className="text-gray-600">Dirección: {orden.empresa.direccion}</p>
              )}
              {orden.empresa?.telefono && (
                <p className="text-gray-600">Teléfono: {orden.empresa.telefono}</p>
              )}
              {orden.empresa?.correoElectronico && (
                <p className="text-gray-600">Email: {orden.empresa.correoElectronico}</p>
              )}
            </div>
          </Card>

          {/* Aspirante Info */}
          <Card className="p-4 border border-gray-200 bg-gray-50 rounded-md">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="bg-primary/10 p-1 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              ASPIRANTE
            </h2>
            <div className="grid gap-1 text-sm">
              <p className="font-medium text-gray-800">
                {orden.aspirante ? 
                  `${orden.aspirante.nombres || ''} ${orden.aspirante.apellidos || ''}` : 
                  orden.aspirante_name || 'N/A'}
              </p>
              {orden.aspirante?.numeroDocumento && (
                <p className="text-gray-600">
                  Doc: {orden.aspirante.tipoDocumento || 'CC'}: {orden.aspirante.numeroDocumento}
                </p>
              )}
              {orden.aspirante?.direccion && (
                <p className="text-gray-600">Dirección: {orden.aspirante.direccion}</p>
              )}
              {orden.aspirante?.telefono && (
                <p className="text-gray-600">Teléfono: {orden.aspirante.telefono}</p>
              )}
              {orden.aspirante?.correoElectronico && (
                <p className="text-gray-600">Email: {orden.aspirante.correoElectronico}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Servicios */}
        <div className="mb-8">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center">
            <span className="bg-primary/10 p-1 rounded-full mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            SERVICIOS
          </h2>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orden.servicios && orden.servicios.length > 0 ? (
                  orden.servicios.map((servicio, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {servicio.codigo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                        {servicio.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${servicio.precio?.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay servicios registrados
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                    ${calculateTotal().toLocaleString('es-CO')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Firma */}
        {orden.firma && (
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="bg-primary/10 p-1 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
              FIRMA
            </h2>
            <div className="border border-gray-200 bg-gray-50 p-4 rounded-md">
              <img 
                src={orden.firma} 
                alt="Firma" 
                className="max-h-32 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Este documento es generado automáticamente por el sistema.</p>
          <p>Fecha de impresión: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
        </div>
      </div>
    </div>
  );
};

export default OrdenPDF;

