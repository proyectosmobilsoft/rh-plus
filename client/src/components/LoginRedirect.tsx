import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente para redirigir automáticamente al login unificado
export const LoginRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirigir inmediatamente al login unificado
    navigate('/', { replace: true });
  }, [navigate]);

  return null; // No renderiza nada
};

export default LoginRedirect;

