// src/pages/CajasPage.tsx
import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { Plus, Building2, ChevronRight, Users, Shield, Briefcase } from "lucide-react"
import { cajasService }        from "../api/cajas.service"
import { useCaja }             from "../context/CajaContext"
import { Button }              from "../components/Button"
import { Field }               from "../components/Field"
import type { MiCaja }         from "../api/cajas.types"
import { apiClient } from "../api/api.client"

// Ícono y color según el rol
const rolConfig = {
  admin:    { label: "Administrador", icon: Shield,   color: "var(--color-primary_y)"  },
  tesorero: { label: "Tesorero",      icon: Briefcase, color: "var(--color-secondary_g)" },
  socio:    { label: "Socio",         icon: Users,    color: "var(--text-secondary)"   },
}

export default function CajasPage() {
  const navigate          = useNavigate()
  const { setCajaActiva } = useCaja()

  const [cajas,       setCajas]       = useState<MiCaja[]>([])
  const [loading,     setLoading]     = useState(true)
  const [creando,     setCreando]     = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [nombre,      setNombre]      = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [error,       setError]       = useState<string | undefined>(undefined)
  const [codigo,      setCodigo]      = useState("")
  const [uniendose,   setUniendose]   = useState(false)
  const [showUnirse,  setShowUnirse]  = useState(false)
  const [errorUnirse, setErrorUnirse] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function cargar() {
      try {
        const response = await cajasService.getMisCajas()
        setCajas(response.cajas)
      } catch {
        // Si falla, muestra lista vacía — puede crear su primera caja
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  function seleccionarCaja(caja: MiCaja) {
    setCajaActiva(caja)
    navigate("/dashboard")
  }

 async function handleUnirse() {
  if (!codigo.trim()) {
    setErrorUnirse("Ingresa el código de invitación")
    return
  }
  setUniendose(true)
  setErrorUnirse(undefined)
  try {
    const res = await apiClient.post<{
      message:       string
      socioVinculado: boolean
      caja: { id: string; nombre: string; descripcion?: string; rol: "admin" | "tesorero" | "socio" }
    }>("/cajas/unirse", { codigo })

    const caja = {
      id:          res.caja.id,
      nombre:      res.caja.nombre,
      descripcion: res.caja.descripcion ?? "",
      rol:         res.caja.rol,
    }

    setCajaActiva(caja)

    // Mensaje personalizado si se vinculó a un socio existente
    if (res.socioVinculado) {
      console.log("Tu cuenta fue vinculada a tu registro de socio en esta caja")
    }

    navigate("/dashboard")
  } catch (err) {
    setErrorUnirse(err instanceof Error ? err.message : "Código inválido")
  } finally {
    setUniendose(false)
  }
}

  async function handleCrear() {
    if (!nombre.trim()) {
      setError("El nombre de la caja es requerido")
      return
    }
    setCreando(true)
    setError(undefined)
    try {
      const response = await cajasService.crear({ nombre, descripcion })
      // Agrega la nueva caja a la lista y la selecciona automáticamente
      const nuevaCaja: MiCaja = {
        id:          response.caja.id,
        nombre:      response.caja.nombre,
        descripcion: response.caja.descripcion,
        rol:         "admin",
      }
      setCajaActiva(nuevaCaja)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la caja")
    } finally {
      setCreando(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background:   "var(--bg-surface)",
          borderBottom: "1px solid var(--border-base)",
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo_domus.png" alt="Domus" className="w-8 h-8" />
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Domus
          </span>
        </div>
        <button
          className="text-sm hover:underline"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => navigate("/perfil")}
        >
          Mi perfil
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Título */}
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Mis cajas de ahorro
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Selecciona una caja para continuar
          </p>
        </div>

        {/* Estado de carga */}
        {loading && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Cargando cajas...
          </p>
        )}

        {/* Lista de cajas */}
        {!loading && cajas.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {cajas.map(caja => {
              const config = rolConfig[caja.rol]
              const RolIcon = config.icon
              return (
                <button
                  key={caja.id}
                  onClick={() => seleccionarCaja(caja)}
                  className="w-full text-left rounded-xl p-4 flex items-center gap-4 transition-all"
                  style={{
                    background: "var(--bg-surface)",
                    border:     "1px solid var(--border-base)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary_y)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-base)"
                  }}
                >
                  {/* Ícono de caja */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(221,154,76,0.12)" }}
                  >
                    <Building2 size={22} style={{ color: "var(--color-primary_y)" }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {caja.nombre}
                    </p>
                    {caja.descripcion && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {caja.descripcion}
                      </p>
                    )}
                    {/* Rol */}
                    <div className="flex items-center gap-1 mt-1">
                      <RolIcon size={11} style={{ color: config.color }} />
                      <span className="text-xs" style={{ color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              )
            })}
          </div>
        )}

        {/* Sin cajas — primera vez */}
        {!loading && cajas.length === 0 && !showForm && (
          <div
            className="rounded-xl p-8 text-center mb-6"
            style={{
              background: "var(--bg-surface)",
              border:     "1px dashed var(--border-base)",
            }}
          >
            <Building2
              size={40}
              className="mx-auto mb-3"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Aún no perteneces a ninguna caja
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Crea tu primera caja de ahorro para comenzar
            </p>
          </div>
        )}

        {/* Formulario de nueva caja */}
        {showForm && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <h2
              className="font-medium mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Nueva caja de ahorro
            </h2>
            <div className="flex flex-col gap-3">
              <Field
                label="Nombre de la caja"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Caja Comunitaria Norte"
                required
                error={error}
              />
              <Field
                label="Descripción (opcional)"
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Breve descripción de la caja"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                label="Crear caja"
                variant="primary"
                loading={creando}
                onClick={handleCrear}
              />
              <Button
                label="Cancelar"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setNombre("")
                  setDescripcion("")
                  setError(undefined)
                }}
              />
            </div>
          </div>
        )}
{!showForm && !showUnirse && (

  <button
    className="text-sm hover:underline mr-2"
    style={{ color: "var(--text-secondary)" }}
    onClick={() => setShowUnirse(true)}
  >
    ¿Tienes un código de invitación? Únete aquí
  </button>
)}

  {showUnirse && (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-surface)",
        border:     "1px solid var(--border-base)",
      }}
    >
      <h3 className="text-sm font-medium mb-4"
        style={{ color: "var(--text-primary)" }}>
        Unirse a una caja
      </h3>
      <Field
        label="Código de invitación"
        type="text"
        value={codigo}
        onChange={e => setCodigo(e.target.value.toUpperCase())}
        placeholder="Ej: AXBK73P2"
        error={errorUnirse}
        required
      />
      <div className="flex gap-3 mt-4">
        <Button
          label="Unirse"
          variant="primary"
          loading={uniendose}
          onClick={handleUnirse}
        />
        <Button
          label="Cancelar"
          variant="secondary"
          onClick={() => {
            setShowUnirse(false)
            setCodigo("")
            setErrorUnirse(undefined)
          }}
        />
      </div>
    </div>
  )}
        {/* Botón crear nueva caja */}
        {!showForm && (
          <Button
            label="Crear nueva caja"
            variant="secondary"
            icon={Plus}
            onClick={() => setShowForm(true)}
          />
        )}

      </div>
    </div>
  )
}