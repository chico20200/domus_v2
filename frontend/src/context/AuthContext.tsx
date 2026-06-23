// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser } from "../api/auth.types"
import { authService } from "../api/auth.service"

interface AuthContextType {
  user:      AuthUser | null
  login:     (email: string, password: string) => Promise<void>
  logout:    () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = authService.getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))

        // ── Verifica si el token ya expiró ──────────────────
        // payload.exp es la fecha de expiración en segundos Unix
        const ahora      = Math.floor(Date.now() / 1000)
        const expiro     = payload.exp && payload.exp < ahora

        if (expiro) {
          // Token expirado — limpia y manda al login
          authService.logout()
        } else {
          setUser({
            id:    payload.sub,
            email: payload.email,
            token,
          })
        }
      } catch {
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return context
}