import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { guardarEmpresaSeleccionadaConConsulta } from '@/utils/empresaUtils';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
// import logo from '/logo2.svg'; // Archivo no encontrado

export default function LoginUnificado() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userValidation, setUserValidation] = useState<any>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [step, setStep] = useState<'credentials' | 'empresa'>('credentials');
  const [validatedCredentials, setValidatedCredentials] = useState<{username: string, password: string} | null>(null);
  // Verificar si AuthProvider está disponible
  let authContext;
  let hasAuthProvider = true;
  try {
    authContext = useAuth();
  } catch (error) {
    hasAuthProvider = false;
    console.warn('AuthProvider no disponible, usando autenticación directa');
  }

  // Funciones de autenticación directa cuando AuthProvider no está disponible
  const directLogin = async (credentials: any) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en las credenciales');
      }

      const data = await response.json();
      
      // Guardar en localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      throw error;
    }
  };

  const directSelectEmpresa = async (empresaId: string) => {
    try {
      console.log('Seleccionando empresa con ID:', empresaId);
      
      // Usar la nueva función que consulta la base de datos y guarda TODO
      const resultado = await guardarEmpresaSeleccionadaConConsulta(parseInt(empresaId));
      
      if (resultado) {
        console.log('Empresa seleccionada y guardada exitosamente');
        
        // Redirigir al dashboard
        window.location.href = '/dashboard';
      } else {
        throw new Error('No se pudo guardar la empresa seleccionada');
      }
    } catch (error: any) {
      console.error('Error al seleccionar empresa:', error);
      throw error;
    }
  };

  // Usar funciones del AuthProvider si está disponible, sino usar las directas
  const login = hasAuthProvider && authContext ? authContext.login : directLogin;
  const selectEmpresa = hasAuthProvider && authContext ? authContext.selectEmpresa : directSelectEmpresa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('🚀 Iniciando login con:', { username, password });

      
      // Validar usuario en la base de datos
      const validation = await authService.validateUser(username);
      
      if (!validation) {
        setError('Usuario no encontrado o inactivo');
        return;
      }

      // Verificar contraseña y obtener datos del usuario
      const passwordResult = await authService.verifyPassword(validation.user.id, password);
      
      if (!passwordResult.success) {
        setError('Contraseña incorrecta');
        return;
      }

      console.log('✅ Verificación de contraseña exitosa, guardando datos de autenticación...');

      // Guardar datos de autenticación en localStorage (SIN authToken por ahora)
      const userData = passwordResult.userData;
      
      // Guardar solo userData en localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      console.log('✅ Datos de autenticación guardados en localStorage:');
      console.log('- userData completo:', userData);
      console.log('- Roles del usuario:', userData.roles);
      console.log('- Empresas del usuario:', userData.empresas);
      console.log('⚠️ authToken NO se guarda aquí, se guardará cuando se seleccione empresa');

      // Verificar que se guardaron correctamente
      const savedUserData = localStorage.getItem('userData');
      console.log('🔍 Verificación localStorage:');
      console.log('- userData existe:', !!savedUserData);
      console.log('- authToken existe:', !!localStorage.getItem('authToken'));

      // Si el usuario tiene empresas asociadas
      if (validation.empresas && validation.empresas.length > 0) {
        // Guardar credenciales validadas
        setValidatedCredentials({ username, password });
        
        // Si tiene solo una empresa, iniciar sesión directamente
        if (validation.empresas.length === 1) {
          console.log('🏢 Usuario tiene una sola empresa, creando authToken automáticamente');
          
          // Crear authToken con información del usuario y la única empresa
          const authToken = btoa(JSON.stringify({
            userId: userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            roles: userData.roles,
            empresaId: userData.empresas[0].id,
            empresaRazonSocial: userData.empresas[0].razon_social,
            empresas: userData.empresas
          })) + '.' + Date.now();

          // Guardar authToken en localStorage
          localStorage.setItem('authToken', authToken);
          
          console.log('✅ authToken creado automáticamente para empresa única:');
          console.log('- authToken:', authToken.substring(0, 50) + '...');
          console.log('- Empresa:', userData.empresas[0]);
          
          await login({ username, password, empresaId: validation.empresas[0].id.toString() });
          return;
        }
        
        // Si tiene múltiples empresas, mostrar selector
        setUserValidation(validation);
        setStep('empresa');
        return;
      }

      // Usar el nuevo servicio de autenticación directamente
      await login({ username, password });

      console.log('✅ Login exitoso');

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmpresaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmpresa) {
      setError('Por favor selecciona una empresa');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔄 Iniciando selección de empresa:', selectedEmpresa);

      // Obtener datos del usuario guardados en localStorage
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        setError('No se encontraron datos de usuario');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('📊 Datos del usuario obtenidos:', userData);

      // Obtener información de la empresa seleccionada
      const empresaSeleccionada = userData.empresas?.find((emp: any) => emp.id.toString() === selectedEmpresa);
      if (!empresaSeleccionada) {
        setError('Empresa no encontrada');
        return;
      }

      console.log('🏢 Empresa seleccionada:', empresaSeleccionada);

      // Crear authToken con información del usuario y empresa seleccionada
      const authToken = btoa(JSON.stringify({
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        roles: userData.roles,
        empresaId: empresaSeleccionada.id,
        empresaRazonSocial: empresaSeleccionada.razon_social,
        empresas: userData.empresas
      })) + '.' + Date.now();

      // Guardar authToken en localStorage
      localStorage.setItem('authToken', authToken);
      
      console.log('✅ authToken creado y guardado con información del usuario y empresa:');
      console.log('- authToken:', authToken.substring(0, 50) + '...');
      console.log('- Información incluida:', {
        userId: userData.id,
        username: userData.username,
        empresaId: empresaSeleccionada.id,
        empresaRazonSocial: empresaSeleccionada.razon_social
      });

      // Verificar que se guardó correctamente
      const savedAuthToken = localStorage.getItem('authToken');
      console.log('🔍 Verificación final localStorage:');
      console.log('- userData existe:', !!localStorage.getItem('userData'));
      console.log('- authToken existe:', !!savedAuthToken);

      // Seleccionar la empresa (ahora puede ser asíncrono)
      await selectEmpresa(selectedEmpresa);
      
      console.log('✅ Empresa seleccionada y authToken guardado exitosamente');

    } catch (error: any) {
      console.error('❌ Error al seleccionar empresa:', error);
      setError(error.message || 'Error al seleccionar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setUserValidation(null);
    setSelectedEmpresa('');
    setError('');
  };

  const handleForgotPassword = () => {
    window.location.href = '/recuperar-password';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lime/10 to-brand-turquoise/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="text-center mb-8">

                     <div className="logo-login-placeholder flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-brand-turquoise rounded-full">
             <Building2 className="w-8 h-8 text-white" />
           </div>
          <p className="text-gray-600 animate-slide-in mt-[-15px] mb-[-15px] pt-[-14px] pb-[-14px]">Sistema de Gestión de Contratación</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </CardHeader>
          <CardContent>
            {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario o email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="h-12 login-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pr-10 login-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 login-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validando credenciales...
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Continuar
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm forgot-password-link hover:underline transition-colors"
                    disabled={isLoading}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmpresaSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="mb-4 p-4 bg-cyan-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm font-medium text-cyan-800">
                      Bienvenido, {userValidation?.user.primer_nombre} {userValidation?.user.primer_apellido}
                    </span>
                  </div>
                                      <p className="text-xs text-cyan-600">
                    Selecciona la empresa con la que deseas iniciar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {userValidation?.empresas.map((empresa: any) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToCredentials}
                    className="flex-1 h-12"
                    disabled={isLoading}
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 login-button"
                    disabled={isLoading || !selectedEmpresa}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Iniciando sesión...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}