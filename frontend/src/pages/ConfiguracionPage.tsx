// src/pages/ConfiguracionPage.tsx
import { useState, useEffect }  from "react"
import { useNavigate }          from "react-router-dom"
import { Copy, RefreshCw, Shield, Briefcase, Users, UserMinus } from "lucide-react"
import { AppLayout }            from "../components/layout/AppLayout"
import { Button }               from "../components/Button"
import { useCaja }              from "../context/CajaContext"
import { apiClient }            from "../api/api.client"

interface Miembro {
  id:        string
  rol:       "admin" | "tesorero" | "socio"
  activo:    boolean
  email:     string
  profiles:  { nombre: string } | null
}

interface Invitacion {
  codigo:    string
  expira_at: string
  rol:       string
}

const rolConfig = {
  admin:    { label: "Admin",    icon: Shield,    color: "var(--color-primary_y)"  },
  tesorero: { label: "Tesorero", icon: Briefcase, color: "var(--color-secondary_g)" },
  socio:    { label: "Socio",    icon: Users,     color: "var(--text-secondary)"   },
}

export default function ConfiguracionPage() {
  const navigate       = useNavigate()
  const { cajaActiva } = useCaja()

  const [miembros,     setMiembros]     = useState<Miembro[]>([])
  const [invitacion,   setInvitacion]   = useState<Invitacion | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [generando,    setGenerando]    = useState(false)
  const [copiado,      setCopiado]      = useState(false)
  const [rolInvitado,  setRolInvitado]  = useState<"socio"|"tesorero">("socio")

  const esAdmin = cajaActiva?.rol === "admin"

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarDatos()
  }, [cajaActiva])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [resMiembros, resInv] = await Promise.all([
        apiClient.get<{ miembros: Miembro[] }>(`/cajas/${cajaActiva!.id}/miembros`),
        esAdmin
          ? apiClient.get<{ invitacion: Invitacion | null }>(`/cajas/${cajaActiva!.id}/miembros/invitaciones`)
          : Promise.resolve({ invitacion: null }),
      ])
      setMiembros(resMiembros.miembros)
      setInvitacion(resInv.invitacion)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerarCodigo() {
    setGenerando(true)
    try {
      const res = await apiClient.post<{ codigo: string; expira: string; rol: string }>(
        `/cajas/${cajaActiva!.id}/miembros/invitaciones`,
        { rolInvitado }
      )
      setInvitacion({ codigo: res.codigo, expira_at: res.expira, rol: res.rol })
    } finally {
      setGenerando(false)
    }
  }

  async function handleCambiarRol(userId: string, nuevoRol: string) {
    try {
      await apiClient.put(`/cajas/${cajaActiva!.id}/miembros/${userId}`, { nuevoRol })
      await cargarDatos()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cambiar rol")
    }
  }

  async function handleRemover(userId: string) {
    if (!confirm("¿Remover este miembro de la caja?")) return
    try {
      await apiClient.delete(`/cajas/${cajaActiva!.id}/miembros/${userId}`)
      await cargarDatos()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al remover miembro")
    }
  }

  function copiarCodigo() {
    if (!invitacion) return
    navigator.clipboard.writeText(invitacion.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function formatExpira(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-EC", {
      day: "numeric", month: "long", year: "numeric"
    })
  }

  return (
    <AppLayout titulo="Configuración">
      <div className="flex flex-col gap-6 max-w-2xl">

        {/* Info de la caja */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
        >
          <h2 className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            {cajaActiva?.nombre}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tu rol en esta caja: <strong>{cajaActiva?.rol}</strong>
          </p>
        </div>

        {/* Código de invitación — solo admin */}
        {esAdmin && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Código de invitación
            </h3>

            {invitacion ? (
              <div className="flex flex-col gap-3">
                {/* Código grande y copiable */}
                <div
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ background: "var(--bg-base)", border: "1px dashed var(--border-base)" }}
                >
                  <span
                    className="text-2xl font-mono font-bold tracking-widest"
                    style={{ color: "var(--color-primary_y)" }}
                  >
                    {invitacion.codigo}
                  </span>
                  <button
                    onClick={copiarCodigo}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: "var(--bg-surface)",
                      border:     "1px solid var(--border-base)",
                      color:      copiado ? "var(--color-secondary_g)" : "var(--text-secondary)",
                    }}
                  >
                    <Copy size={12} />
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Rol: <strong>{invitacion.rol}</strong> · Expira: {formatExpira(invitacion.expira_at)}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Comparte este código con la persona que quieres agregar. El código expira en 7 días o cuando sea usado.
                </p>
                <Button
                  label="Generar nuevo código"
                  variant="secondary"
                  icon={RefreshCw}
                  loading={generando}
                  onClick={handleGenerarCodigo}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No hay código activo. Genera uno para invitar a alguien.
                </p>
                <div className="flex items-center gap-3">
                  <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Rol del invitado:
                  </label>
                  <select
                    value={rolInvitado}
                    onChange={e => setRolInvitado(e.target.value as "socio"|"tesorero")}
                    className="text-sm px-3 py-1.5 rounded-lg outline-none"
                    style={{
                      background: "var(--bg-base)",
                      border:     "1px solid var(--border-base)",
                      color:      "var(--text-primary)",
                    }}
                  >
                    <option value="socio">Socio</option>
                    <option value="tesorero">Tesorero</option>
                  </select>
                </div>
                <Button
                  label="Generar código de invitación"
                  variant="primary"
                  loading={generando}
                  onClick={handleGenerarCodigo}
                />
              </div>
            )}
          </div>
        )}

        {/* Lista de miembros */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
        >
          <div
            className="px-5 py-3"
            style={{ borderBottom: "1px solid var(--border-base)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Miembros del sistema ({miembros.length})
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Usuarios con acceso al sistema para esta caja
            </p>
          </div>

          {loading && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Cargando miembros...
              </p>
            </div>
          )}

          {!loading && miembros.map(m => {
            const config  = rolConfig[m.rol]
            const RolIcon = config.icon
            const esSelf  = false // puedes comparar con user.id del AuthContext si lo necesitas

            return (
              <div
                key={m.id}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border-base)" }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ background: "rgba(221,154,76,0.12)", color: "var(--color-primary_y)" }}
                >
                  {m.email?.[0]?.toUpperCase() ?? "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {m.profiles?.nombre || m.email}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {m.email}
                  </p>
                </div>

                {/* Rol */}
                {esAdmin ? (
                  <select
                    value={m.rol}
                    onChange={e => handleCambiarRol(m.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg outline-none"
                    style={{
                      background: "var(--bg-base)",
                      border:     "1px solid var(--border-base)",
                      color:      config.color,
                    }}
                  >
                    <option value="socio">Socio</option>
                    <option value="tesorero">Tesorero</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1">
                    <RolIcon size={12} style={{ color: config.color }} />
                    <span className="text-xs" style={{ color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                )}

                {/* Remover — solo admin, no a sí mismo */}
                {esAdmin && (
                  <button
                    onClick={() => handleRemover(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: "var(--color-danger_r)" }}
                    title="Remover miembro"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </AppLayout>
  )
}