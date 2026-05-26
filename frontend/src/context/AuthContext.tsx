// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser } from "../api/auth.types"
import { authService } from "../api/auth.service"

// Define qué expone el contexto
interface AuthContextType {
  user:    AuthUser | null   // null = no hay sesión
  login:   (email: string, password: string) => Promise<void>
  logout:  () => void
  isLoading: boolean         // mientras verifica el token inicial
}

// 1. Crea el contexto
const AuthContext = createContext<AuthContextType | null>(null)

// 2. El Provider — envuelve tu app y comparte el estado
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al cargar la app, revisa si ya hay token guardado
  useEffect(() => {
    const token = authService.getToken()
    if (token) {
      // Reconstruye el usuario mínimo desde el token
      // Cuando tengas GET /me, aquí harías la llamada para obtener datos completos
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser({
          id:    payload.sub,
          email: payload.email,
          token,
        })
      } catch {
        // Token inválido o expirado — limpia todo
        authService.logout()
      }
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const response = await authService.login({ email, password })
    setUser({
      id:    response.user.id,
      email: response.user.email,
      token: response.token,
    })
  }

  function logout() {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. El hook — forma limpia de usar el contexto en cualquier componente
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  }
  return context
}