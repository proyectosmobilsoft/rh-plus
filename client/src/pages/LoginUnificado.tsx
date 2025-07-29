import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { authService, UserValidation } from '@/services/authService';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
import logo from '/logo2.svg';

export default function LoginUnificado() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userValidation, setUserValidation] = useState<UserValidation | null>(null);
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
      // Usar las credenciales ya validadas
      if (!validatedCredentials) {
        throw new Error('No hay credenciales validadas');
      }

      // Crear un token JWT válido usando el servidor
      const response = await fetch('/api/auth/login-with-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: validatedCredentials.username,
          password: validatedCredentials.password,
          empresaId: parseInt(empresaId)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al seleccionar empresa');
      }

      const data = await response.json();
      
      // Guardar en localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Redirigir al dashboard
      window.location.href = '/dashboard';
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

      // Validar usuario en la base de datos
      const validation = await authService.validateUser(username);
      
      if (!validation) {
        setError('Usuario no encontrado o inactivo');
        return;
      }

      // Verificar contraseña
      const isPasswordValid = await authService.verifyPassword(validation.user.id, password);
      
      if (!isPasswordValid) {
        setError('Contraseña incorrecta');
        return;
      }

      // Si el usuario tiene empresas asociadas
      if (validation.empresas && validation.empresas.length > 0) {
        // Guardar credenciales validadas
        setValidatedCredentials({ username, password });
        
        // Si tiene solo una empresa, iniciar sesión directamente
        if (validation.empresas.length === 1) {
          await login({ username, password, empresaId: validation.empresas[0].id.toString() });
          return;
        }
        
        // Si tiene múltiples empresas, mostrar selector
        setUserValidation(validation);
        setStep('empresa');
        return;
      }

      // Si no tiene empresas, proceder con el login normal
      await login({ username, password });

    } catch (error: any) {
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

      // Seleccionar la empresa (ahora puede ser asíncrono)
      await selectEmpresa(selectedEmpresa);

    } catch (error: any) {
      console.error('Error al seleccionar empresa:', error);
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

          <div className="logo-login"
            style={{
              backgroundImage: `url(${logo})`
            }}
          ></div>
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

                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Bienvenido, {userValidation?.user.primer_nombre} {userValidation?.user.primer_apellido}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
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
                      {userValidation?.empresas.map((empresa) => (
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