// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, Users, PiggyBank,
  CreditCard, Receipt, PieChart,
  Settings, ChevronLeft, ChevronRight,
  Building2
} from "lucide-react"

interface SidebarProps {
  abierto:   boolean
  onToggle:  () => void
}

// Cada item del menú
const navItems = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/socios",        icon: Users,           label: "Socios"        },
  { to: "/ahorros",       icon: PiggyBank,       label: "Ahorros"       },
  { to: "/creditos",      icon: CreditCard,      label: "Créditos"      },
  { to: "/pagos",         icon: Receipt,         label: "Pagos"         },
  { to: "/reportes",      icon: PieChart,        label: "Reportes"      },
  { to: "/configuracion", icon: Settings,        label: "Configuración" },
]

export function Sidebar({ abierto, onToggle }: SidebarProps) {
  return (
    <aside
      style={{
        width:           abierto ? "220px" : "56px",
        background:      "var(--sidebar-bg)",
        borderRight:     "1px solid var(--border-base)",
        transition:      "width .2s ease",
        display:         "flex",
        flexDirection:   "column",
        flexShrink:      0,
        overflow:        "hidden",
      }}
    >
      {/* Logo / nombre de caja */}
      <div
        style={{
          height:      "56px",
          display:     "flex",
          alignItems:  "center",
          gap:         "10px",
          padding:     "0 14px",
          borderBottom:"1px solid var(--border-base)",
          flexShrink:  0,
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
          <span
            style={{
              fontSize:    "13px",
              fontWeight:  500,
              color:       "var(--text-primary)",
              whiteSpace:  "nowrap",
              overflow:    "hidden",
              textOverflow:"ellipsis",
            }}
          >
            Mi caja
          </span>
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
              borderLeft:     isActive ? `3px solid var(--color-primary_y)` : "3px solid transparent",
              transition:     "background .15s",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  style={{
                    color:    isActive ? "var(--color-primary_y)" : "var(--text-secondary)",
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

      {/* Botón colapsar */}
      <div
        style={{
          padding:     "8px",
          borderTop:   "1px solid var(--border-base)",
          flexShrink:  0,
        }}
      >
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
          {abierto
            ? <ChevronLeft  size={16} />
            : <ChevronRight size={16} />
          }
        </button>
      </div>
    </aside>
  )
}