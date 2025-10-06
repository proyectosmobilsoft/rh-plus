import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { solicitudesLogsService } from '@/services/solicitudesLogsService';
import { usuariosService } from '@/services/usuariosService';

const TestSupabaseConnection: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Iniciando pruebas de conexión...');
      
      // Test 1: Obtener usuarios
      addResult('📋 Probando obtener usuarios...');
      const usuarios = await usuariosService.getAll();
      addResult(`✅ Usuarios obtenidos: ${usuarios.length}`);
      
      if (usuarios.length > 0) {
        const primerUsuario = usuarios[0];
        addResult(`📝 Primer usuario: ${primerUsuario.primer_nombre} ${primerUsuario.primer_apellido} (${primerUsuario.email})`);
      }
      
      // Test 2: Crear un log de prueba
      addResult('📝 Probando crear log de prueba...');
      const logCreado = await solicitudesLogsService.crearLog({
        solicitud_id: 1,
        usuario_id: 1,
        accion: 'TEST_CONNECTION',
        observacion: 'Prueba de conexión a Supabase'
      });
      
      if (logCreado) {
        addResult('✅ Log de prueba creado exitosamente');
      } else {
        addResult('❌ Error al crear log de prueba');
      }
      
      addResult('🎉 Pruebas completadas');
      
    } catch (error) {
      addResult(`❌ Error durante las pruebas: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Prueba de Conexión a Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Probando...' : 'Ejecutar Pruebas'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Resultados:</h3>
            <div className="bg-gray-50 p-3 rounded-md max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestSupabaseConnection;

