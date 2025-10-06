import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailService } from '@/services/emailService';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const TestSendGrid: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testSendGrid = async () => {
    if (!email.trim()) {
      setResult({ success: false, message: 'Por favor ingresa un email válido' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Generar código de prueba
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Enviar email de prueba
      const emailResult = await emailService.sendVerificationCode(
        email,
        codigo,
        'Usuario de Prueba',
        email
      );

      setResult(emailResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'Error inesperado al enviar el email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Prueba SendGrid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email de destino
          </label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
        </div>

        <Button
          onClick={testSendGrid}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Probar SendGrid
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Nota:</strong> Asegúrate de configurar la variable de entorno:</p>
          <code className="block bg-gray-100 p-2 rounded text-xs">
            VITE_SENDGRID_API_KEY=SG.tu_api_key_aqui
          </code>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestSendGrid;

