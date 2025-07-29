import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import logo from '../../../public/logo2.svg';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const navigate = useNavigate();

  const handleSolicitarCodigo = async () => {
    if (!email.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    try {
      const resultado = await authService.generarCodigoVerificacion(email);
      
      if (resultado.success) {
        setCodigoEnviado(true);
        toast.success(resultado.message);
        // Redirigir a la página de verificación
        navigate('/verificar-codigo', { 
          state: { email } 
        });
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Error solicitando código:', error);
      toast.error('Error al enviar el código de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lime/10 to-brand-turquoise/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-login"
            style={{
              backgroundImage: `url(${logo})`
            }}
          ></div>
          <p className="text-gray-600 animate-slide-in mt-[-15px] mb-[-15px] pt-[-14px] pb-[-14px]">Sistema de Gestión de Contratación</p>
        </div>

        {/* Recovery Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-12 w-12 text-brand-lime" />
            </div>
            <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-sm text-gray-600 text-center">
              Ingresa tu correo electrónico para recibir un código de verificación
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSolicitarCodigo()}
                disabled={isLoading}
                className="h-12 login-input"
              />
            </div>

            <Button
              onClick={handleSolicitarCodigo}
              disabled={isLoading || !email.trim()}
              className="w-full h-12 login-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Código de Verificación
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-sm forgot-password-link hover:underline transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 