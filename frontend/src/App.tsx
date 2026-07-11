// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import  Login    from "./pages/Login"
import  ProfilePage  from "./pages/ProfilePage"
import  ForgotPasswordPage  from "./pages/ForgotPasswordPage"
import  ResetPasswordPage   from "./pages/ResetPasswordPage"
import Register from "./pages/Register"
import { CajaProvider } from "./context/CajaContext"
import CajasPage        from "./pages/CajasPage"
import DashboardPage from "./pages/DashboardPage"
import SociosPage from "./pages/SociosPage"
import AhorrosPage from "./pages/AhorrosPage"
import ConfiguracionPage from "./pages/ConfiguracionPage"
import CreditosPage from "./pages/CreditosPage"
import PagosPage from "./pages/PagosPage"
import { RolRoute } from "./components/RolRoute"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p>Cargando...</p>          // espera la verificación
  if (!user)     return <Navigate to="/login" replace />   // sin sesión → login

  return children
}

export default function App() {
  return (
    <ThemeProvider> 
      <AuthProvider>     
        <CajaProvider>       {/* ← envuelve todo para que useAuth funcione */}
        <BrowserRouter>
          <Routes>
              {/* Rutas públicas */}
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password"  element={<ResetPasswordPage />} />

              {/* Selección de caja — protegida pero sin layout */}
              <Route path="/cajas" element={
                <ProtectedRoute><CajasPage /></ProtectedRoute>
              }/>

              {/* Rutas dentro de una caja */}
               <Route path="/perfil"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={
  <ProtectedRoute>
    <RolRoute rolMinimo="tesorero">    {/* socio → redirige a /ahorros */}
      <DashboardPage />
    </RolRoute>
  </ProtectedRoute>
}/>
             
              <Route path="/socios" element={
  <ProtectedRoute>
    <RolRoute rolMinimo="tesorero">
      <SociosPage />
    </RolRoute>
  </ProtectedRoute>
}/>
              <Route path="/ahorros" element={<ProtectedRoute><AhorrosPage /></ProtectedRoute>}/>
              <Route path="/creditos" element={<ProtectedRoute><CreditosPage /></ProtectedRoute>} />
              <Route path="/pagos" element={<ProtectedRoute><PagosPage /></ProtectedRoute>}/>
              <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>}/>

              {/* Redirige la raíz a /cajas */}
              <Route path="/" element={<Navigate to="/cajas" replace />} />
            </Routes>
        </BrowserRouter>
      </CajaProvider>
    </AuthProvider>
    </ThemeProvider> 
  )
}