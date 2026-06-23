// src/context/CajaContext.tsx
import { createContext, useContext, useState } from "react"

interface Caja {
  id:          string
  nombre:      string
  descripcion: string
  rol:         "admin" | "tesorero" | "socio"
}

interface CajaContextType {
  cajaActiva:    Caja | null
  setCajaActiva: (caja: Caja) => void
  salirDeCaja:   () => void
}

const CajaContext = createContext<CajaContextType | null>(null)

export function CajaProvider({ children }: { children: React.ReactNode }) {
  const [cajaActiva, setCajaActivaState] = useState<Caja | null>(() => {
    // Recupera la caja activa del localStorage si existe
    const guardada = localStorage.getItem("cajaActiva")
    return guardada ? JSON.parse(guardada) : null
  })

  function setCajaActiva(caja: Caja) {
    localStorage.setItem("cajaActiva", JSON.stringify(caja))
    setCajaActivaState(caja)
  }

  function salirDeCaja() {
    localStorage.removeItem("cajaActiva")
    setCajaActivaState(null)
  }

  return (
    <CajaContext.Provider value={{ cajaActiva, setCajaActiva, salirDeCaja }}>
      {children}
    </CajaContext.Provider>
  )
}

export function useCaja() {
  const context = useContext(CajaContext)
  if (!context) throw new Error("useCaja debe usarse dentro de CajaProvider")
  return context
}