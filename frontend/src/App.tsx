// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import  Login    from "./pages/Login"
import  ProfilePage  from "./pages/ProfilePage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p>Cargando...</p>          // espera la verificación
  if (!user)     return <Navigate to="/login" replace />   // sin sesión → login

  return children
}

export default function App() {
  return (
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}