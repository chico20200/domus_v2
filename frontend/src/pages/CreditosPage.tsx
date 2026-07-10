// src/pages/CreditosPage.tsx
import { useState, useEffect }  from "react"
import { useNavigate }          from "react-router-dom"
import {
  CreditCard, ChevronRight, ChevronLeft, Plus,
  CheckCircle, Clock, Coins, Wallet
} from "lucide-react"
import { AppLayout }            from "../components/layout/AppLayout"
import { Button }               from "../components/Button"
import { Field }                from "../components/Field"
import { useCaja }              from "../context/CajaContext"
import { creditosService }      from "../api/creditos.service"
import { pagosService }         from "../api/pagos.service"
import { sociosService }        from "../api/socios.service"
import type { Credito }         from "../api/creditos.types"
import type { PagoCredito, TipoPago } from "../api/pagos.types"
import type { Socio }           from "../api/socios.types"

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

// Color y label por estado del crédito
const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "var(--color-primary_y)",   bg: "rgba(221,154,76,0.12)" },
  activo:    { label: "Activo",    color: "var(--color-secondary_g)", bg: "rgba(106,178,62,0.12)" },
  pagado:    { label: "Pagado",    color: "var(--text-muted)",        bg: "rgba(0,0,0,0.06)" },
  mora:      { label: "En mora",   color: "var(--color-danger_r)",    bg: "rgba(217,97,70,0.12)" },
  castigado: { label: "Castigado", color: "var(--color-danger_r)",    bg: "rgba(217,97,70,0.12)" },
  
}

type Vista = "lista" | "detalle"

export default function CreditosPage() {
  const navigate       = useNavigate()
  const { cajaActiva } = useCaja()

  const [vista,        setVista]        = useState<Vista>("lista")
  const [creditos,     setCreditos]     = useState<Credito[]>([])
  const [creditoActivo, setCreditoActivo] = useState<Credito | null>(null)
  const [pagos,        setPagos]        = useState<PagoCredito[]>([])
  const [socios,       setSocios]       = useState<Socio[]>([])
  const [loading,      setLoading]      = useState(true)
  const [procesando,   setProcesando]   = useState(false)

  // Modal nueva solicitud
  const [showForm,     setShowForm]     = useState(false)
  const [socioSel,     setSocioSel]     = useState("")
  const [monto,        setMonto]        = useState("")
  const [tasa,         setTasa]         = useState("")
  const [plazo,        setPlazo]        = useState("")
  const [errorForm,    setErrorForm]    = useState<string | undefined>(undefined)

  //confirmación
  const [confirmacion, setConfirmacion] = useState<TipoPago | null>(null)

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarDatos()
  }, [cajaActiva])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [resCreditos, resSocios] = await Promise.all([
        creditosService.getCreditos(cajaActiva!.id),
        sociosService.getSocios(cajaActiva!.id),
      ])
      setCreditos(resCreditos.creditos)
      setSocios(resSocios.socios.filter(s => s.activo))
    } finally {
      setLoading(false)
    }
  }

  async function verDetalle(credito: Credito) {
    setLoading(true)
    try {
      const res = await creditosService.getCredito(cajaActiva!.id, credito.id)
      setCreditoActivo(res.credito)
      setPagos(res.pagos)
      setVista("detalle")
    } finally {
      setLoading(false)
    }
  }

  async function recargarDetalle() {
    if (!creditoActivo) return
    const res = await creditosService.getCredito(cajaActiva!.id, creditoActivo.id)
    setCreditoActivo(res.credito)
    setPagos(res.pagos)
  }

  async function handleCrear() {
    if (!socioSel || !monto || !tasa || !plazo) {
      setErrorForm("Todos los campos son requeridos")
      return
    }
    setProcesando(true)
    setErrorForm(undefined)
    try {
      await creditosService.crear(cajaActiva!.id, {
        socio_id:         socioSel,
        monto_solicitado: parseFloat(monto),
        tasa_interes:     parseFloat(tasa),
        plazo_meses:      parseInt(plazo),
      })
      setShowForm(false)
      setSocioSel(""); setMonto(""); setTasa(""); setPlazo("")
      await cargarDatos()
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : "Error al crear")
    } finally {
      setProcesando(false)
    }
  }

  async function handleAprobar() {
    if (!creditoActivo) return
    setProcesando(true)
    try {
      await creditosService.aprobar(cajaActiva!.id, creditoActivo.id)
      await recargarDetalle()
      await cargarDatos()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al aprobar")
    } finally {
      setProcesando(false)
    }
  }

  // El clic en el botón ahora solo abre la confirmación
function pedirConfirmacion(tipo: TipoPago) {
  setConfirmacion(tipo)
}

// Esta ejecuta el pago realmente, tras confirmar
async function ejecutarPago() {
  if (!creditoActivo || !confirmacion) return
  const tipo = confirmacion
  setConfirmacion(null)
  setProcesando(true)
  try {
    const res = await pagosService.registrarPago(cajaActiva!.id, creditoActivo.id, tipo)
    await recargarDetalle()
    await cargarDatos()
    if (res.credito_pagado) {
      alert("¡Crédito pagado por completo!")
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : "Error al registrar pago")
  } finally {
    setProcesando(false)
  }
}

  // ── VISTA DETALLE ────────────────────────────────────────────
  if (vista === "detalle" && creditoActivo) {
    const c = creditoActivo
    const socio = c.socios
    const config = estadoConfig[c.estado] ?? estadoConfig.pendiente

    // Totales de capital e interés pagados
    const totalCapital = pagos.reduce((s, p) => s + Number(p.monto_capital), 0)
    const totalInteres = pagos.reduce((s, p) => s + Number(p.monto_interes), 0)

    return (
      <AppLayout titulo="Créditos">
        <div className="flex flex-col gap-4 max-w-2xl">

          <button
            className="flex items-center gap-1 text-sm w-fit"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setVista("lista")}
          >
            <ChevronLeft size={14} /> Volver a créditos
          </button>

          {/* Card del crédito */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {socio ? `${socio.nombre} ${socio.apellido}` : "Sin socio"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {c.plazo_meses} meses · {c.tasa_interes}% interés
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
            </div>

            {/* Cifras */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Monto prestado</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatMonto(c.monto_solicitado)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total a pagar</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatMonto(c.monto_total)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Cuota mensual</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {formatMonto(c.cuota_mensual)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Saldo pendiente</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-danger_r)" }}>
                  {formatMonto(c.saldo_pendiente)}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones según estado */}
          {c.estado === "pendiente" && cajaActiva?.rol !== "socio" && (
            <Button
              label="Aprobar y desembolsar crédito"
              variant="primary"
              icon={CheckCircle}
              loading={procesando}
              onClick={handleAprobar}
            />
          )}

          {/* Botones de pago — solo si está activo */}
          {c.estado === "activo" && cajaActiva?.rol !== "socio" && (
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                Registrar pago de cuota
              </p>
              <div className="flex flex-col gap-2">
                <Button label="Pago completo (capital + interés)" variant="primary" icon={Wallet}
  loading={procesando} onClick={() => pedirConfirmacion("completo")} />
<Button label="Solo capital" variant="secondary" icon={Coins}
  loading={procesando} onClick={() => pedirConfirmacion("solo_capital")} />
<Button label="Solo interés" variant="secondary" icon={Coins}
  loading={procesando} onClick={() => pedirConfirmacion("solo_interes")} />
                </div>
              
            </div>
          )}

          {/* Resumen de pagos */}
          {pagos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(106,178,62,0.08)", border: "1px solid var(--border-base)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Capital pagado</p>
                <p className="text-lg font-semibold" style={{ color: "var(--color-secondary_g)" }}>
                  {formatMonto(totalCapital)}
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(221,154,76,0.08)", border: "1px solid var(--border-base)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Interés pagado</p>
                <p className="text-lg font-semibold" style={{ color: "var(--color-primary_y)" }}>
                  {formatMonto(totalInteres)}
                </p>
              </div>
            </div>
          )}

          {/* Historial de pagos */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-base)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Historial de pagos ({pagos.length})
              </p>
            </div>

            {pagos.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Aún no hay pagos registrados
                </p>
              </div>
            )}

            {pagos.map(p => (
              <div
                key={p.id}
                className="px-5 py-3"
                style={{ borderBottom: "1px solid var(--border-base)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Cuota #{p.numero_cuota}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatMonto(p.monto_pagado)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span>Capital: {formatMonto(p.monto_capital)}</span>
                  <span>Interés: {formatMonto(p.monto_interes)}</span>
                  <span>{formatFecha(p.fecha_pago)}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
        {/* Modal de confirmación de pago */}
{confirmacion && creditoActivo && (() => {
  // Calcula cuánto se pagará para mostrarlo en la confirmación
  const capitalPrestado = Number(creditoActivo.monto_solicitado)
  const montoTotal      = Number(creditoActivo.monto_total)
  const plazo           = creditoActivo.plazo_meses
  const capitalCuota    = +(capitalPrestado / plazo).toFixed(2)
  const interesCuota    = +((montoTotal - capitalPrestado) / plazo).toFixed(2)

  const detalle = {
    completo:     { capital: capitalCuota, interes: interesCuota, titulo: "Pago completo de cuota" },
    solo_capital: { capital: capitalCuota, interes: 0,            titulo: "Pago de solo capital" },
    solo_interes: { capital: 0,            interes: interesCuota, titulo: "Pago de solo interés" },
  }[confirmacion]

  const total = detalle.capital + detalle.interes

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
          {detalle.titulo}
        </h3>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Vas a registrar el siguiente pago. Esta acción no se puede deshacer.
        </p>

        {/* Desglose */}
        <div className="rounded-lg p-3 flex flex-col gap-1"
          style={{ background: "var(--bg-base)" }}
        >
          {detalle.capital > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Capital</span>
              <span style={{ color: "var(--text-primary)" }}>{formatMonto(detalle.capital)}</span>
            </div>
          )}
          {detalle.interes > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Interés</span>
              <span style={{ color: "var(--text-primary)" }}>{formatMonto(detalle.interes)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium pt-1 mt-1"
            style={{ borderTop: "1px solid var(--border-base)", color: "var(--text-primary)" }}
          >
            <span>Total</span>
            <span>{formatMonto(total)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button label="Confirmar pago" variant="primary" onClick={ejecutarPago} />
          <Button label="Cancelar" variant="danger" onClick={() => setConfirmacion(null)} />
        </div>
      </div>
    </div>
  )
})()}
      </AppLayout>
    )
  }

  // ── VISTA LISTA ──────────────────────────────────────────────
  return (
    <AppLayout titulo="Créditos">
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {creditos.length} crédito{creditos.length !== 1 ? "s" : ""}
          </p>
          {cajaActiva?.rol !== "socio" && (
            <Button label="Nueva solicitud" variant="primary" icon={Plus} onClick={() => setShowForm(true)} />
          )}
        </div>

        {/* Formulario nueva solicitud */}
        {showForm && (
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <p className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>
              Nueva solicitud de crédito
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm" style={{ color: "var(--text-secondary)" }}>Socio</label>
                <select
                  value={socioSel}
                  onChange={e => setSocioSel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }}
                >
                  <option value="">Selecciona un socio...</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} {s.apellido} · {s.cedula}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Monto ($)" type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="1000" required />
                <Field label="Tasa (%)"  type="number" value={tasa}  onChange={e => setTasa(e.target.value)}  placeholder="12"   required />
                <Field label="Plazo (meses)" type="number" value={plazo} onChange={e => setPlazo(e.target.value)} placeholder="12" required />
              </div>
            </div>
            {errorForm && <p className="text-xs mt-2" style={{ color: "var(--color-danger_r)" }}>{errorForm}</p>}
            <div className="flex gap-3 mt-4">
              <Button label="Crear solicitud" variant="primary" loading={procesando} onClick={handleCrear} />
              <Button label="Cancelar" variant="secondary" onClick={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {/* Lista */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
        >
          {loading && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando créditos...</p>
            </div>
          )}

          {!loading && creditos.length === 0 && (
            <div className="px-5 py-10 text-center">
              <CreditCard size={32} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aún no hay créditos registrados</p>
            </div>
          )}

          {!loading && creditos.map(c => {
            const socio = c.socios
            const config = estadoConfig[c.estado] ?? estadoConfig.pendiente
            return (
              <button
                key={c.id}
                onClick={() => verDetalle(c)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left"
                style={{ borderBottom: "1px solid var(--border-base)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: config.bg }}
                >
                  <CreditCard size={16} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {socio ? `${socio.nombre} ${socio.apellido}` : "Sin socio"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {formatMonto(c.monto_solicitado)} · {c.plazo_meses}m · {c.tasa_interes}%
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: config.bg, color: config.color }}>
                    {config.label}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Saldo: {formatMonto(c.saldo_pendiente)}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </button>
            )
          })}
        </div>

      </div>
    </AppLayout>
  )
}