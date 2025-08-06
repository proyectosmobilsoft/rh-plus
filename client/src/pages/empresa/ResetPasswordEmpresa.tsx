import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordEmpresa() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setError("Token de recuperación no válido");
      setIsLoading(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, [location.search]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`/api/empresa/validate-reset-token/${tokenToValidate}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setEmail(data.email);
        setUsername(data.username);
      } else {
        setError(data.message || "Token inválido o expirado");
      }
    } catch (error) {
      setError("Error de conexión. Inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError("La contraseña debe contener al menos una letra mayúscula, una minúscula y un número");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/empresa/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      setError('Error de conexión. Inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Validando token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">
              Token inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">{error}</p>
            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/empresa/login')}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-brand-lime" />
            </div>
            <CardTitle className="text-2xl text-brand-lime">
              Contraseña actualizada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Su contraseña ha sido actualizada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Ya puede iniciar sesión con su nueva contraseña.
            </p>
            <div className="pt-4">
                             <Button 
                 className="w-full bg-cyan-600 hover:bg-cyan-700"
                 onClick={() => navigate('/empresa/login')}
               >
                Iniciar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl text-cyan-800">
            Nueva contraseña
          </CardTitle>
          <p className="text-sm text-gray-600">
            Empresa: <strong>{username}</strong> ({email})
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mínimo 8 caracteres, incluya mayúsculas, minúsculas y números
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

                         <Button 
               type="submit" 
               className="w-full bg-cyan-600 hover:bg-cyan-700" 
               disabled={isSubmitting}
             >
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </Button>

            <div className="text-center">
                             <button 
                 type="button"
                 onClick={() => navigate('/empresa/login')} 
                 className="text-sm text-cyan-600 hover:text-cyan-800"
               >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}