// src/components/RolRoute.tsx
import { Navigate } from "react-router-dom"
import { useCaja }  from "../context/CajaContext"

interface RolRouteProps {
  children:   React.ReactNode
  rolMinimo:  "socio" | "tesorero" | "admin"
  redirigir?: string
}

export function RolRoute({
  children,
  rolMinimo,
  redirigir = "/ahorros"
}: RolRouteProps) {
  const { cajaActiva } = useCaja()
  const jerarquia = { socio: 1, tesorero: 2, admin: 3 }

  const rolActual = cajaActiva?.rol ?? "socio"

  if (jerarquia[rolActual] < jerarquia[rolMinimo]) {
    return <Navigate to={redirigir} replace />
  }

  return <>{children}</>
}