import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testConnection, testAnalistas } from '@/services/testConnection';

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [analistasStatus, setAnalistasStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [analistasResult, setAnalistasResult] = useState<any>(null);

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await testConnection();
      setConnectionResult(result);
      setConnectionStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setConnectionResult({ success: false, error });
      setConnectionStatus('error');
    }
  };

  const handleTestAnalistas = async () => {
    setAnalistasStatus('testing');
    try {
      const result = await testAnalistas();
      setAnalistasResult(result);
      setAnalistasStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setAnalistasResult({ success: false, error });
      setAnalistasStatus('error');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Test de Conexión Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              variant={connectionStatus === 'success' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'outline'}
            >
              {connectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
            </Button>
            
            <Button 
              onClick={handleTestAnalistas}
              disabled={analistasStatus === 'testing'}
              variant={analistasStatus === 'success' ? 'default' : analistasStatus === 'error' ? 'destructive' : 'outline'}
            >
              {analistasStatus === 'testing' ? 'Probando...' : 'Probar Analistas'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado de Conexión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={connectionStatus === 'success' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                      {connectionStatus === 'idle' && 'Sin probar'}
                      {connectionStatus === 'testing' && 'Probando...'}
                      {connectionStatus === 'success' && '✅ Exitoso'}
                      {connectionStatus === 'error' && '❌ Error'}
                    </Badge>
                  </div>
                  {connectionResult && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(connectionResult, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado de Analistas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={analistasStatus === 'success' ? 'default' : analistasStatus === 'error' ? 'destructive' : 'secondary'}>
                      {analistasStatus === 'idle' && 'Sin probar'}
                      {analistasStatus === 'testing' && 'Probando...'}
                      {analistasStatus === 'success' && '✅ Exitoso'}
                      {analistasStatus === 'error' && '❌ Error'}
                    </Badge>
                  </div>
                  {analistasResult && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(analistasResult, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>URL de Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL || 'https://vlmeifyldcgfmhppynir.supabase.co'}</p>
            <p><strong>Clave Anónima:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 

