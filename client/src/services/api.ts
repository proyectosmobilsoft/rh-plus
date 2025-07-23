
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api/v1/";

// Función auxiliar para manejar errores
const handleError = (error: unknown) => {
  console.error("API Error:", error);
  toast.error("Error al conectar con el servidor");
  throw error;
};

// Función genérica para realizar peticiones
const fetchAPI = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`Fetching: ${url}`, options.method || 'GET');
    
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }

    // Para peticiones que no devuelven JSON (como DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    console.log("API Response data:", data);
    return data as T;
  } catch (error) {
    return handleError(error) as T;
  }
};

// Exportamos funciones para cada método HTTP
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    fetchAPI<T>(endpoint, { ...options, method: "GET" }),
  
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { 
      ...options, 
      method: "POST",
      body: data ? JSON.stringify(data) : undefined
    }),
  
  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data)
    }),
  
  patch: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: "DELETE" })
};
