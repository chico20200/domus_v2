// src/components/layout/TopBar.tsx
import { Sun, Moon, Bell, LogOut, Heart  } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { useAuth }  from "../../context/AuthContext"
import { useNavigate } from 'react-router-dom'
import { DonacionModal } from "../DonacionModal"
import { useState } from "react"

interface TopBarProps {
  titulo: string
}

export function TopBar({ titulo }: TopBarProps) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout }        = useAuth()
  const [showDonacion, setShowDonacion] = useState(false)
  const navigate = useNavigate()

  // Iniciales del usuario para el avatar
  const iniciales = user?.email?.[0].toUpperCase() ?? "U"

  return (
    <header
      style={{
        height:      "56px",
        background:  "var(--bg-surface)",
        borderBottom:"1px solid var(--border-base)",
        display:     "flex",
        alignItems:  "center",
        padding:     "0 20px",
        gap:         "12px",
        flexShrink:  0,
      }}
    >
      {/* Título de la página */}
      <h1
        style={{
          flex:      1,
          fontSize:  "15px",
          fontWeight:500,
          color:     "var(--text-primary)",
          margin:    0,
        }}
      >
        {titulo}
      </h1>

      {/* Acciones */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

         {/* Botón donar — nuevo */}
        <button
          onClick={() => setShowDonacion(true)}
          aria-label="Donar"
          style={{
            ...iconBtnStyle,
            width:  "auto",
            gap:    "6px",
            padding: "0 12px",
            color:  "var(--color-danger_r)",
            borderColor: "var(--color-danger_r)",
          }}
        >
          <Heart size={15} />
          <span style={{ fontSize: "13px" }}>Donar</span>
        </button>

      
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          style={iconBtnStyle}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notificaciones */}
        <button aria-label="Notificaciones" style={iconBtnStyle}>
          <Bell size={16} />
        </button>

          {/* Avatar: clic para ir a perfil */}
          <button
            onClick={() => navigate('/perfil')}
            title={user?.email}
            aria-label="Ir al perfil"
            style={{
              width:          "32px",
              height:         "32px",
              borderRadius:   "50%",
              background:     "var(--color-primary_y)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "13px",
              fontWeight:     500,
              color:          "white",
              flexShrink:     0,
              border:         "none",
              cursor:         "pointer",
            }}
          >
            {iniciales}
          </button>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          style={iconBtnStyle}
        >
          <LogOut size={16} />
        </button>
      </div>
        {/* Modal de donación */}
      {showDonacion && <DonacionModal onCerrar={() => setShowDonacion(false)} />}
    </header>
  )
}

// Estilo base de los botones de ícono
const iconBtnStyle: React.CSSProperties = {
  width:          "32px",
  height:         "32px",
  border:         "1px solid var(--border-base)",
  borderRadius:   "8px",
  background:     "transparent",
  cursor:         "pointer",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  color:          "var(--text-secondary)",
}