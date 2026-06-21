// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import  Login    from "./pages/Login"
import  ProfilePage  from "./pages/ProfilePage"
import  ForgotPasswordPage  from "./pages/ForgotPasswordPage"
import  ResetPasswordPage   from "./pages/ResetPasswordPage"
import Register from "./pages/Register"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p>Cargando...</p>          // espera la verificación
  if (!user)     return <Navigate to="/login" replace />   // sin sesión → login

  return children
}

export default function App() {
  return (
    <ThemeProvider> 
      <AuthProvider>           {/* ← envuelve todo para que useAuth funcione */}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }/>
            <Route path="/" element={<Navigate to="/perfil" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider> 
  )
}