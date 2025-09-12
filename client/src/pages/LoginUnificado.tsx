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
import logo from '/logo2.svg';

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
      console.log('🔍 userData completo recibido:', userData);
      
      // Validar si la contraseña es igual al número de identificación
      console.log('🔍 Validando identificación:');
      console.log('- userData.identificacion:', userData.identificacion);
      console.log('- password ingresada:', password);
      console.log('- ¿Son iguales?:', userData.identificacion && password === userData.identificacion);
      
      if (userData.identificacion && password === userData.identificacion) {
        console.log('⚠️ Contraseña igual a identificación, redirigiendo a cambiar contraseña');
        // Guardar userData temporalmente para la página de cambio de contraseña
        localStorage.setItem('userData', JSON.stringify(userData));
        // Redirigir a la página de cambio de contraseña
        window.location.href = '/cambiar-password';
        return;
      }
      
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
    window.open('/recuperar-password', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lime/5 via-white to-brand-turquoise/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-lime/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-turquoise/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gray/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md animate-slide-in relative z-30 py-8">
        {/* Login Form */}
        <Card className="bg-card text-card-foreground login-card shadow-2xl border-0 bg-gradient-to-br from-white/90 via-brand-lime/5 to-brand-turquoise/10 backdrop-blur-sm rounded-2xl overflow-hidden relative">
          
          
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-lime/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-turquoise/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-brand-gray/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-lime/3 to-brand-turquoise/5"></div>
          
          {/* Header dentro de la tarjeta */}
          <div className="text-center pt-8 pb-0 relative z-10">
            <div className="flex flex-col items-center">
              <div className="logo-login"
                style={{
                  backgroundImage: `url(${logo})`
                }}
              ></div>
            </div>
          </div>

          <CardHeader className="space-y-1 pt-0 pb-6 bg-gradient-to-r from-brand-lime/10 via-brand-turquoise/8 to-brand-lime/10 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <CardTitle className="text-3xl text-center font-bold text-brand-gray relative z-10">Iniciar Sesión</CardTitle>
            <p className="text-base text-brand-gray/80 text-center relative z-10">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-brand-gray flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-lime/60 rounded-full"></div>
                    Usuario
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ingresa tu usuario o email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="h-12 login-input border-2 border-gray-200/50 bg-white/80 backdrop-blur-sm focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 transition-all duration-300 group-hover:border-brand-lime/50"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-brand-lime/5 to-brand-turquoise/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-brand-gray flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-turquoise/60 rounded-full"></div>
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pr-10 login-input border-2 border-gray-200/50 bg-white/80 backdrop-blur-sm focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 transition-all duration-300 group-hover:border-brand-turquoise/50"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-brand-turquoise/5 to-brand-lime/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-turquoise transition-colors duration-200 z-10"
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

                <div className="relative group">
                  <Button
                    type="submit"
                    className="w-full h-12 login-button rounded-xl font-medium text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                    disabled={isLoading}
                  >
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    {isLoading ? (
                      <div className="flex items-center justify-center relative z-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validando credenciales...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center relative z-10">
                        Continuar
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm forgot-password-link hover:underline transition-all duration-200 font-medium"
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

                <div className="mb-6 p-5 bg-gradient-to-r from-brand-turquoise/15 via-brand-lime/10 to-brand-turquoise/15 rounded-xl border border-brand-turquoise/30 relative overflow-hidden group">
                  {/* Elementos decorativos de fondo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -top-2 -right-2 w-16 h-16 bg-brand-turquoise/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-brand-lime/10 rounded-full blur-lg"></div>
                  
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-gradient-to-br from-brand-turquoise/30 to-brand-turquoise/20 rounded-lg shadow-sm">
                      <Building2 className="w-5 h-5 text-brand-turquoise" />
                    </div>
                    <span className="text-sm font-semibold text-brand-gray">
                      Bienvenido, {userValidation?.user.primer_nombre} {userValidation?.user.primer_apellido}
                    </span>
                  </div>
                  <p className="text-sm text-brand-gray/80 ml-11 relative z-10">
                    Selecciona la empresa con la que deseas iniciar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-sm font-medium text-brand-gray flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-gray/60 rounded-full"></div>
                    Empresa
                  </Label>
                  <div className="relative group">
                    <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                      <SelectTrigger className="h-12 border-2 border-gray-200/50 bg-white/80 backdrop-blur-sm focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 transition-all duration-300 group-hover:border-brand-turquoise/50">
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
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-brand-turquoise/5 to-brand-lime/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <div className="relative group flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToCredentials}
                      className="w-full h-12 border-2 border-gray-300/50 text-brand-gray hover:border-brand-gray hover:bg-brand-gray/5 transition-all duration-300 rounded-xl font-medium bg-white/80 backdrop-blur-sm relative overflow-hidden"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-gray/5 to-brand-lime/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">Volver</span>
                    </Button>
                  </div>
                  
                  <div className="relative group flex-1">
                    <Button
                      type="submit"
                      className="w-full h-12 login-button rounded-xl font-medium text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                      disabled={isLoading || !selectedEmpresa}
                    >
                      {/* Efecto de brillo en hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      {isLoading ? (
                        <div className="flex items-center justify-center relative z-10">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Iniciando sesión...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center relative z-10">
                          Iniciar Sesión
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}