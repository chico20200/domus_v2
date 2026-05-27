// src/api/api.client.ts
const BASE_URL = import.meta.env.VITE_API_URL

// La función central que todos los servicios usan
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> 
{
    const token = localStorage.getItem("token")
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        
        ...options.headers,
        },
    })

  // Si la respuesta no es 2xx, lanza un error con el mensaje del backend
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Error ${response.status}`)
  }

  return response.json() as Promise<T>
}

// Las 4 funciones que usarás en los servicios
export const apiClient = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
}