// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, PiggyBank,
  CreditCard, Receipt, PieChart,
  Settings, ChevronLeft, ChevronRight,
  Building2, ArrowLeftRight
} from "lucide-react"
import { useCaja }  from "../../context/CajaContext"
import { useAuth }  from "../../context/AuthContext"

interface SidebarProps {
  abierto:  boolean
  onToggle: () => void
}

export function Sidebar({ abierto, onToggle }: SidebarProps) {
  const navigate           = useNavigate()
  const { cajaActiva, salirDeCaja } = useCaja()
  const { user }           = useAuth()

  const rol = cajaActiva?.rol ?? "socio"
  const esSocio    = rol === "socio"
  const esTesorero = rol === "tesorero" || rol === "admin"
  const esAdmin    = rol === "admin"

  // Cada item define quién puede verlo
  const navItems = [
    {
      to:      "/dashboard",
      icon:    LayoutDashboard,
      label:   "Dashboard",
      visible: esTesorero,       // ← socio no ve dashboard
    },
    {
      to:      "/socios",
      icon:    Users,
      label:   "Socios",
      visible: esTesorero,       // ← socio no ve socios
    },
    {
      to:      "/ahorros",
      icon:    PiggyBank,
      label:   "Ahorros",
      visible: true,             // ← todos ven ahorros
    },
    {
      to:      "/creditos",
      icon:    CreditCard,
      label:   "Créditos",
      visible: esTesorero,       // ← socio no ve créditos
    },
    {
      to:      "/pagos",
      icon:    Receipt,
      label:   "Pagos",
      visible: esTesorero,
    },
    {
      to:      "/reportes",
      icon:    PieChart,
      label:   "Reportes",
      visible: esTesorero,
    },
    {
      to:      "/configuracion",
      icon:    Settings,
      label:   "Configuración",
      visible: true,             // ← todos ven configuración (contenido varía)
    },
  ].filter(item => item.visible)

  return (
    <aside
      style={{
        width:         abierto ? "220px" : "56px",
        background:    "var(--sidebar-bg)",
        borderRight:   "1px solid var(--border-base)",
        transition:    "width .2s ease",
        display:       "flex",
        flexDirection: "column",
        flexShrink:    0,
        overflow:      "hidden",
      }}
    >
      {/* Logo / nombre de caja */}
      <div
        style={{
          height:       "56px",
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
          padding:      "0 14px",
          borderBottom: "1px solid var(--border-base)",
          flexShrink:   0,
        }}
      >
        <div
          style={{
            width:          "28px",
            height:         "28px",
            borderRadius:   "6px",
            background:     "var(--color-primary_y)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
          }}
        >
          <Building2 size={16} color="white" />
        </div>
        {abierto && (
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontSize:     "13px",
                fontWeight:   500,
                color:        "var(--text-primary)",
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cajaActiva?.nombre ?? "Sin caja"}
            </p>
            <p
              style={{
                fontSize:  "10px",
                color:     "var(--text-muted)",
                whiteSpace:"nowrap",
              }}
            >
              {rol}
            </p>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display:        "flex",
              alignItems:     "center",
              gap:            "10px",
              padding:        "9px 14px",
              textDecoration: "none",
              background:     isActive ? "rgba(221,154,76,0.12)" : "transparent",
              borderLeft:     isActive
                ? "3px solid var(--color-primary_y)"
                : "3px solid transparent",
              transition:     "background .15s",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  style={{
                    color:     isActive ? "var(--color-primary_y)" : "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                />
                {abierto && (
                  <span
                    style={{
                      fontSize:   "13px",
                      color:      isActive ? "var(--color-primary_y)" : "var(--sidebar-text)",
                      whiteSpace: "nowrap",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Cambiar de caja */}
      <div
        style={{
          padding:    "8px",
          borderTop:  "1px solid var(--border-base)",
          flexShrink: 0,
          display:    "flex",
          flexDirection: "column",
          gap:        "4px",
        }}
      >
        {/* Botón cambiar caja */}
        <button
          onClick={() => { salirDeCaja(); navigate("/cajas") }}
          title="Cambiar de caja"
          style={{
            width:          "100%",
            padding:        "6px",
            border:         "1px solid var(--border-base)",
            borderRadius:   "8px",
            background:     "transparent",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: abierto ? "flex-start" : "center",
            gap:            "8px",
            color:          "var(--text-secondary)",
          }}
        >
          <ArrowLeftRight size={14} />
          {abierto && (
            <span style={{ fontSize: "12px" }}>Cambiar caja</span>
          )}
        </button>

        {/* Botón colapsar */}
        <button
          onClick={onToggle}
          aria-label={abierto ? "Colapsar sidebar" : "Expandir sidebar"}
          style={{
            width:          "100%",
            padding:        "6px",
            border:         "1px solid var(--border-base)",
            borderRadius:   "8px",
            background:     "transparent",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color:          "var(--text-secondary)",
          }}
        >
          {abierto ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </aside>
  )
}