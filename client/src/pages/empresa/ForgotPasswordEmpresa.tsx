import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordEmpresa() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('/api/empresa/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Error al enviar el enlace de recuperación');
      }
    } catch (error) {
      setError('Error de conexión. Inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-brand-lime" />
            </div>
            <CardTitle className="text-2xl text-brand-lime">
              Enlace enviado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Se ha enviado un enlace de recuperación de contraseña a su email.
            </p>
            <p className="text-sm text-gray-500">
              Revise su bandeja de entrada y carpeta de spam.
            </p>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl text-cyan-800">
            Recuperar contraseña
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Portal de Empresas
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
              <Label htmlFor="email">Email corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empresa@ejemplo.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-700" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
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

