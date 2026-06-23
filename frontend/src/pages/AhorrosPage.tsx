// src/pages/AhorrosPage.tsx
import { useState, useEffect }        from "react"
import { useNavigate }                from "react-router-dom"
import {
  ArrowDownCircle, ArrowUpCircle,
  PiggyBank, ChevronRight, ChevronLeft, Plus
} from "lucide-react"
import { AppLayout }                  from "../components/layout/AppLayout"
import { Button }                     from "../components/Button"
import { Field }                      from "../components/Field"
import { useCaja }                    from "../context/CajaContext"
import { ahorrosService }             from "../api/ahorros.service"
import { sociosService }              from "../api/socios.service"
import type { CuentaAhorro, Transaccion } from "../api/ahorros.types"
import type { Socio }                 from "../api/socios.types"

function formatMonto(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency", currency: "USD", minimumFractionDigits: 2
  }).format(m)
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString("es-EC", {
    day: "numeric", month: "short", year: "numeric"
  })
}

type Vista = "lista" | "detalle"
type ModalTipo = "deposito" | "retiro" | "nueva" | null

export default function AhorrosPage() {
  const navigate       = useNavigate()
  const { cajaActiva } = useCaja()

  // ── Estado principal ─────────────────────────────────────────
  const [vista,         setVista]         = useState<Vista>("lista")
  const [cuentas,       setCuentas]       = useState<CuentaAhorro[]>([])
  const [cuentaActiva,  setCuentaActiva]  = useState<CuentaAhorro | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [socios,        setSocios]        = useState<Socio[]>([])
  const [loading,       setLoading]       = useState(true)
  const [procesando,    setProcesando]    = useState(false)

  // ── Modal ────────────────────────────────────────────────────
  const [modal,       setModal]       = useState<ModalTipo>(null)
  const [monto,       setMonto]       = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [socioSel,    setSocioSel]    = useState("")
  const [errorModal,  setErrorModal]  = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarDatos()
  }, [cajaActiva])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [resCuentas, resSocios] = await Promise.all([
        ahorrosService.getCuentas(cajaActiva!.id),
        sociosService.getSocios(cajaActiva!.id),
      ])
      setCuentas(resCuentas.cuentas)
      setSocios(resSocios.socios.filter(s => s.activo))
    } finally {
      setLoading(false)
    }
  }

  async function verDetalle(cuenta: CuentaAhorro) {
    setCuentaActiva(cuenta)
    setLoading(true)
    try {
      const res = await ahorrosService.getCuenta(cajaActiva!.id, cuenta.id)
      setCuentaActiva(res.cuenta)
      setTransacciones(res.transacciones)
      setVista("detalle")
    } finally {
      setLoading(false)
    }
  }

  function abrirModal(tipo: ModalTipo) {
    setMonto("")
    setDescripcion("")
    setSocioSel("")
    setErrorModal(undefined)
    setModal(tipo)
  }

  function cerrarModal() {
    setModal(null)
    setMonto("")
    setDescripcion("")
    setSocioSel("")
    setErrorModal(undefined)
  }

  async function handleNuevaCuenta() {
    if (!socioSel) { setErrorModal("Selecciona un socio"); return }
    setProcesando(true)
    setErrorModal(undefined)
    try {
      await ahorrosService.abrirCuenta(cajaActiva!.id, socioSel)
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : "Error al abrir cuenta")
    } finally {
      setProcesando(false)
    }
  }

  async function handleOperacion(tipo: "deposito" | "retiro") {
    const montoNum = parseFloat(monto)
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setErrorModal("Ingresa un monto válido mayor a 0")
      return
    }
    setProcesando(true)
    setErrorModal(undefined)
    try {
      const fn = tipo === "deposito" ? ahorrosService.depositar : ahorrosService.retirar
      await fn(cajaActiva!.id, cuentaActiva!.id, montoNum, descripcion)
      // Recarga el detalle para ver el nuevo saldo y transacción
      const res = await ahorrosService.getCuenta(cajaActiva!.id, cuentaActiva!.id)
      setCuentaActiva(res.cuenta)
      setTransacciones(res.transacciones)
      // Actualiza también la lista
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : "Error al procesar operación")
    } finally {
      setProcesando(false)
    }
  }

  // ── VISTA DETALLE ────────────────────────────────────────────
  if (vista === "detalle" && cuentaActiva) {
    const socio = cuentaActiva.socios
    return (
      <AppLayout titulo="Ahorros">
        <div className="flex flex-col gap-4 max-w-2xl">

          {/* Botón volver */}
          <button
            className="flex items-center gap-1 text-sm w-fit"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setVista("lista")}
          >
            <ChevronLeft size={14} /> Volver a cuentas
          </button>

          {/* Card de la cuenta */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--color-primary_y)" }}
          >
            <p className="text-xs text-white opacity-80 mb-1">
              {cuentaActiva.numero_cuenta}
            </p>
            <p className="text-2xl font-semibold text-white mb-1">
              {formatMonto(cuentaActiva.saldo)}
            </p>
            <p className="text-sm text-white opacity-80">
              {socio ? `${socio.nombre} ${socio.apellido}` : ""}
              {" · "}{cuentaActiva.estado}
            </p>
          </div>

          {/* Acciones */}
          {cajaActiva?.rol !== "socio" && cuentaActiva.estado === "activa" && (
            <div className="flex gap-3">
              <Button
                label="Depósito"
                variant="secondary"
                icon={ArrowDownCircle}
                onClick={() => abrirModal("deposito")}
              />
              <Button
                label="Retiro"
                variant="danger"
                icon={ArrowUpCircle}
                onClick={() => abrirModal("retiro")}
              />
            </div>
          )}

          {/* Historial */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: "1px solid var(--border-base)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Historial de movimientos
              </p>
            </div>

            {transacciones.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Aún no hay movimientos en esta cuenta
                </p>
              </div>
            )}

            {transacciones.map(tx => {
              const esDeposito = tx.tipo === "deposito"
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border-base)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: esDeposito
                        ? "rgba(106,178,62,0.12)"
                        : "rgba(217,97,70,0.12)"
                    }}
                  >
                    {esDeposito
                      ? <ArrowDownCircle size={15} style={{ color: "var(--color-secondary_g)" }} />
                      : <ArrowUpCircle   size={15} style={{ color: "var(--color-danger_r)" }} />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {esDeposito ? "Depósito" : "Retiro"}
                      {tx.descripcion && ` · ${tx.descripcion}`}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatFecha(tx.created_at)} · Saldo: {formatMonto(tx.saldo_posterior)}
                    </p>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: esDeposito ? "var(--color-secondary_g)" : "var(--color-danger_r)" }}
                  >
                    {esDeposito ? "+" : "-"}{formatMonto(tx.monto)}
                  </span>
                </div>
              )
            })}
          </div>

        </div>

        {/* Modal depósito/retiro */}
        {(modal === "deposito" || modal === "retiro") && (
          <ModalOperacion
            tipo={modal}
            monto={monto}
            descripcion={descripcion}
            error={errorModal}
            procesando={procesando}
            onMonto={setMonto}
            onDescripcion={setDescripcion}
            onConfirmar={() => handleOperacion(modal)}
            onCerrar={cerrarModal}
          />
        )}
      </AppLayout>
    )
  }

  // ── VISTA LISTA ──────────────────────────────────────────────
  return (
    <AppLayout titulo="Ahorros">
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""} registradas
          </p>
          {cajaActiva?.rol !== "socio" && (
            <Button
              label="Nueva cuenta"
              variant="primary"
              icon={Plus}
              onClick={() => abrirModal("nueva")}
            />
          )}
        </div>

        {/* Lista */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border:     "1px solid var(--border-base)",
          }}
        >
          {loading && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Cargando cuentas...
              </p>
            </div>
          )}

          {!loading && cuentas.length === 0 && (
            <div className="px-5 py-10 text-center">
              <PiggyBank size={32} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Aún no hay cuentas de ahorro registradas
              </p>
            </div>
          )}

          {!loading && cuentas.map(cuenta => {
            const socio = cuenta.socios
            return (
              <button
                key={cuenta.id}
                onClick={() => verDetalle(cuenta)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left"
                style={{ borderBottom: "1px solid var(--border-base)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
                  style={{ background: "rgba(221,154,76,0.12)", color: "var(--color-primary_y)" }}
                >
                  {socio ? `${socio.nombre[0]}${socio.apellido[0]}` : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {socio ? `${socio.nombre} ${socio.apellido}` : "Sin socio"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {cuenta.numero_cuenta} · {cuenta.estado}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatMonto(cuenta.saldo)}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </button>
            )
          })}
        </div>

      </div>

      {/* Modal nueva cuenta */}
      {modal === "nueva" && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-surface)" }}
          >
            <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Nueva cuenta de ahorro
            </h3>
            <div>
              <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Socio
              </label>
              <select
                value={socioSel}
                onChange={e => setSocioSel(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  background: "var(--bg-base)",
                  border:     "1px solid var(--border-base)",
                  color:      "var(--text-primary)",
                }}
              >
                <option value="">Selecciona un socio...</option>
                {socios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.apellido} · {s.cedula}
                  </option>
                ))}
              </select>
            </div>
            {errorModal && (
              <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>{errorModal}</p>
            )}
            <div className="flex gap-3">
              <Button label="Abrir cuenta" variant="primary" loading={procesando} onClick={handleNuevaCuenta} />
              <Button label="Cancelar" variant="secondary" onClick={cerrarModal} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

// ── Componente modal de depósito/retiro ───────────────────────
interface ModalProps {
  tipo:         "deposito" | "retiro"
  monto:        string
  descripcion:  string
  error?:       string
  procesando:   boolean
  onMonto:      (v: string) => void
  onDescripcion:(v: string) => void
  onConfirmar:  () => void
  onCerrar:     () => void
}

function ModalOperacion({ tipo, monto, descripcion, error, procesando, onMonto, onDescripcion, onConfirmar, onCerrar }: ModalProps) {
  const esDeposito = tipo === "deposito"
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
          {esDeposito ? "Registrar depósito" : "Registrar retiro"}
        </h3>
        <Field
          label="Monto ($)"
          type="number"
          value={monto}
          onChange={e => onMonto(e.target.value)}
          placeholder="0.00"
          required
          icon={esDeposito ? ArrowDownCircle : ArrowUpCircle}
        />
        <Field
          label="Descripción (opcional)"
          type="text"
          value={descripcion}
          onChange={e => onDescripcion(e.target.value)}
          placeholder="Ej: Aporte mensual"
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>{error}</p>
        )}
        <div className="flex gap-3">
          <Button
            label={esDeposito ? "Depositar" : "Retirar"}
            variant={esDeposito ? "secondary" : "danger"}
            loading={procesando}
            onClick={onConfirmar}
          />
          <Button label="Cancelar" variant="secondary" onClick={onCerrar} />
        </div>
      </div>
    </div>
  )
}