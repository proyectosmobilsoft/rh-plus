import React from 'react';
import { AlertTriangle, Building, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalSinEmpresaProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdmin: () => void;
}

export default function ModalSinEmpresa({ 
  isOpen, 
  onClose, 
  onContactAdmin 
}: ModalSinEmpresaProps) {
  console.log('🔍 ModalSinEmpresa renderizado con isOpen:', isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              No se puede crear la solicitud
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Para crear una solicitud, necesitas tener una empresa asociada a tu cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  ¿Por qué necesito una empresa?
                </h4>
                <p className="text-sm text-gray-600">
                  Las solicitudes deben estar asociadas a una empresa específica para poder 
                  procesarlas correctamente y asignar los recursos necesarios.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              ¿Qué puedes hacer?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Contactar al administrador</strong> para que asocie tu cuenta con una empresa
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Verificar tu perfil</strong> para asegurarte de que tienes los permisos correctos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Esperar a que se resuelva</strong> el problema antes de intentar crear la solicitud
                </span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Entendido
          </Button>
          <Button
            onClick={onContactAdmin}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Contactar Administrador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

