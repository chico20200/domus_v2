// src/pages/SociosPage.tsx
import { useState, useEffect }   from "react"
import { useNavigate }           from "react-router-dom"
import { UserPlus, Search, Eye, Pencil, UserX, Phone, Mail, IdCard } from "lucide-react"
import { AppLayout }             from "../components/layout/AppLayout"
import { Button }                from "../components/Button"
import { Field }                 from "../components/Field"
import { useCaja }               from "../context/CajaContext"
import { sociosService }         from "../api/socios.service"
import type { Socio }            from "../api/socios.types"

// ── Formulario de socio ───────────────────────────────────────
interface FormSocio {
  nombre:        string
  apellido:      string
  cedula:        string
  telefono:      string
  email:         string
  direccion:     string
  fecha_ingreso: string
}

const formVacio: FormSocio = {
  nombre:        "",
  apellido:      "",
  cedula:        "",
  telefono:      "",
  email:         "",
  direccion:     "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
}

export default function SociosPage() {
  const navigate          = useNavigate()
  const { cajaActiva }    = useCaja()

  const [socios,     setSocios]     = useState<Socio[]>([])
  const [loading,    setLoading]    = useState(true)
  const [guardando,  setGuardando]  = useState(false)
  const [busqueda,   setBusqueda]   = useState("")
  const [showForm,   setShowForm]   = useState(false)
  const [editando,   setEditando]   = useState<Socio | null>(null)
  const [form,       setForm]       = useState<FormSocio>(formVacio)
  const [error,      setError]      = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarSocios()
  }, [cajaActiva])

  async function cargarSocios() {
    setLoading(true)
    try {
      const response = await sociosService.getSocios(cajaActiva!.id)
      setSocios(response.socios)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar socios")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(campo: keyof FormSocio) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [campo]: e.target.value }))
    }
  }

  function abrirFormNuevo() {
    setForm(formVacio)
    setEditando(null)
    setError(undefined)
    setShowForm(true)
  }

  function abrirFormEditar(socio: Socio) {
    setForm({
      nombre:        socio.nombre,
      apellido:      socio.apellido,
      cedula:        socio.cedula,
      telefono:      socio.telefono ?? "",
      email:         socio.email    ?? "",
      direccion:     socio.direccion ?? "",
      fecha_ingreso: socio.fecha_ingreso,
    })
    setEditando(socio)
    setError(undefined)
    setShowForm(true)
  }

  function cerrarForm() {
    setShowForm(false)
    setEditando(null)
    setForm(formVacio)
    setError(undefined)
  }

  async function handleGuardar() {
    if (!form.nombre || !form.apellido || !form.cedula) {
      setError("Nombre, apellido y cédula son requeridos")
      return
    }
    setGuardando(true)
    setError(undefined)
    try {
      if (editando) {
        await sociosService.actualizar(cajaActiva!.id, editando.id, form)
      } else {
        await sociosService.crear(cajaActiva!.id, form)
      }
      await cargarSocios()
      cerrarForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  async function handleDesactivar(socio: Socio) {
    if (!confirm(`¿Desactivar a ${socio.nombre} ${socio.apellido}?`)) return
    try {
      await sociosService.desactivar(cajaActiva!.id, socio.id)
      await cargarSocios()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al desactivar")
    }
  }

  // Filtro de búsqueda
  const sociosFiltrados = socios.filter(s =>
    `${s.nombre} ${s.apellido} ${s.cedula}`.toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  return (
    <AppLayout titulo="Socios">
      <div className="flex flex-col gap-6">

        {/* Header con buscador y botón nuevo */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
              style={{
                background: "var(--bg-surface)",
                border:     "1px solid var(--border-base)",
                color:      "var(--text-primary)",
              }}
            />
          </div>
          <Button
            label="Nuevo socio"
            variant="primary"
            icon={UserPlus}
            onClick={abrirFormNuevo}
          />
        </div>

        {/* Formulario nuevo/editar */}
        {showForm && (
          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <h3
              className="text-sm font-medium mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {editando ? "Editar socio" : "Nuevo socio"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange("nombre")}
                placeholder="Ana"
                required
              />
              <Field
                label="Apellido"
                type="text"
                value={form.apellido}
                onChange={handleChange("apellido")}
                placeholder="Torres"
                required
              />
              <Field
                label="Cédula"
                type="text"
                value={form.cedula}
                onChange={handleChange("cedula")}
                placeholder="1712345678"
                icon={IdCard}
                required
              />
              <Field
                label="Teléfono"
                type="tel"
                value={form.telefono}
                onChange={handleChange("telefono")}
                placeholder="09XXXXXXXX"
                icon={Phone}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="ana@email.com"
                icon={Mail}
              />
              <Field
                label="Fecha de ingreso"
                type="date"
                value={form.fecha_ingreso}
                onChange={handleChange("fecha_ingreso")}
              />
            </div>

            <div className="mt-3">
              <Field
                label="Dirección"
                type="text"
                value={form.direccion}
                onChange={handleChange("direccion")}
                placeholder="Calle, número, sector"
              />
            </div>

            {error && (
              <p className="text-xs mt-2" style={{ color: "var(--color-danger_r)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                label={editando ? "Guardar cambios" : "Registrar socio"}
                variant="primary"
                loading={guardando}
                onClick={handleGuardar}
              />
              <Button
                label="Cancelar"
                variant="secondary"
                onClick={cerrarForm}
              />
            </div>
          </div>
        )}

        {/* Tabla de socios */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border:     "1px solid var(--border-base)",
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-base)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {sociosFiltrados.length} socio{sociosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Cargando */}
          {loading && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Cargando socios...
              </p>
            </div>
          )}

          {/* Sin socios */}
          {!loading && sociosFiltrados.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {busqueda
                  ? "No se encontraron socios con esa búsqueda"
                  : "Aún no hay socios registrados en esta caja"
                }
              </p>
            </div>
          )}

          {/* Lista */}
          {!loading && sociosFiltrados.map(socio => (
            <div
              key={socio.id}
              className="flex items-center gap-4 px-5 py-3"
              style={{ borderBottom: "1px solid var(--border-base)" }}
            >
              {/* Avatar inicial */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                style={{
                  background: "rgba(221,154,76,0.12)",
                  color:      "var(--color-primary_y)",
                }}
              >
                {socio.nombre[0]}{socio.apellido[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {socio.nombre} {socio.apellido}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  CI: {socio.cedula}
                  {socio.telefono && ` · ${socio.telefono}`}
                </p>
              </div>

              {/* Badge activo */}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: socio.activo ? "rgba(106,178,62,0.12)" : "rgba(0,0,0,0.06)",
                  color:      socio.activo ? "var(--color-secondary_g)" : "var(--text-muted)",
                }}
              >
                {socio.activo ? "Activo" : "Inactivo"}
              </span>

              {/* Acciones */}
              <div className="flex gap-1">
                <button
                  onClick={() => abrirFormEditar(socio)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: "var(--text-secondary)" }}
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                {cajaActiva?.rol === "admin" && (
                  <button
                    onClick={() => handleDesactivar(socio)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: "var(--color-danger_r)" }}
                    title="Desactivar"
                  >
                    <UserX size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  )
}