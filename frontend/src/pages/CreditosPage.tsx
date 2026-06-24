// src/pages/CreditosPage.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, CheckCircle, CreditCard, ChevronLeft } from "lucide-react"
import { AppLayout } from "../components/layout/AppLayout"
import { Button } from "../components/Button"
import { Field } from "../components/Field"
import { useCaja } from "../context/CajaContext"
import { creditosService } from "../api/creditos.service"
import { pagosService } from "../api/pagos.service"
import { sociosService } from "../api/socios.service"
import type { Credito } from "../api/creditos.types"
import type { PagoCredito } from "../api/pagos.types"
import type { Socio } from "../api/socios.types"

type ModalTipo = "crear" | "detalle" | "pago" | "aprobar" | null

export default function CreditosPage() {
  const navigate = useNavigate()
  const { cajaActiva } = useCaja()

  const [creditos, setCreditos] = useState<Credito[]>([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState<ModalTipo>(null)
  const [socioSel, setSocioSel] = useState("")
  const [monto, setMonto] = useState("")
  const [tasa, setTasa] = useState("")
  const [plazo, setPlazo] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)

  const [socios, setSocios] = useState<Socio[]>([])
  const [creditoActivo, setCreditoActivo] = useState<Credito | null>(null)
  const [pagos, setPagos] = useState<PagoCredito[]>([])
  const [pagoMonto, setPagoMonto] = useState("")

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarDatos()
  }, [cajaActiva])

  async function cargarDatos() {
    setLoading(true)
    try {
      const res = await creditosService.getCreditos(cajaActiva!.id)
      setCreditos(res.creditos)
      const resS = await sociosService.getSocios(cajaActiva!.id)
      setSocios(resS.socios.filter(s => s.activo))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function abrirCrear() {
    setSocioSel("")
    setMonto("")
    setTasa("")
    setPlazo("")
    setError(undefined)
    setModal("crear")
  }

  async function handleCrear() {
    if (!socioSel || !monto || !tasa || !plazo) { setError("Completa los campos"); return }
    setError(undefined)
    try {
      await creditosService.crear(cajaActiva!.id, {
        socio_id: socioSel,
        monto_solicitado: parseFloat(monto),
        tasa_interes: parseFloat(tasa),
        plazo_meses: parseInt(plazo, 10),
      })
      await cargarDatos()
      setModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear crédito")
    }
  }

  async function verDetalle(c: Credito) {
    setCreditoActivo(c)
    setLoading(true)
    try {
      const res = await creditosService.getCredito(cajaActiva!.id, c.id)
      setCreditoActivo(res.credito)
      setPagos(res.pagos)
      setModal("detalle")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cargar detalle")
    } finally {
      setLoading(false)
    }
  }

  async function handleAprobar() {
    if (!creditoActivo) return
    try {
      await creditosService.aprobar(cajaActiva!.id, creditoActivo.id)
      await cargarDatos()
      setModal(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al aprobar")
    }
  }

  async function handlePago() {
    if (!creditoActivo) return
    if (!pagoMonto || isNaN(parseFloat(pagoMonto)) || parseFloat(pagoMonto) <= 0) {
      alert("Monto inválido")
      return
    }
    try {
      const monto = parseFloat(pagoMonto)
      const saldoAntes = Number(creditoActivo.saldo_pendiente)
      const saldoDespues = Math.max(0, saldoAntes - monto)
      const numeroCuota = (pagos?.length ?? 0) + 1

      await pagosService.crear(cajaActiva!.id, {
        credito_id: creditoActivo.id,
        numero_cuota: numeroCuota,
        monto_pagado: monto,
        saldo_antes: saldoAntes,
        saldo_despues: saldoDespues,
      })

      const res = await creditosService.getCredito(cajaActiva!.id, creditoActivo.id)
      setCreditoActivo(res.credito)
      setPagos(res.pagos)
      await cargarDatos()
      setPagoMonto("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar pago")
    }
  }

  const esTesorero = cajaActiva?.rol === "tesorero" || cajaActiva?.rol === "admin"

  return (
    <AppLayout titulo="Créditos">
      <div className="flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Créditos</h2>
          {esTesorero && (
            <Button label="Nueva solicitud" icon={Plus} variant="primary" onClick={abrirCrear} />
          )}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-base)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{creditos.length} crédito{creditos.length !== 1 ? "s" : ""}</p>
          </div>

          {loading && (
            <div className="px-5 py-6 text-center"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando créditos...</p></div>
          )}

          {!loading && creditos.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: "1px solid var(--border-base)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.socios ? `${c.socios.nombre} ${c.socios.apellido}` : c.socio_id}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Monto: {c.monto_solicitado} · Saldo: {c.saldo_pendiente} · Estado: {c.estado}
                </p>
              </div>
              <div className="flex gap-2">
                <Button label="Ver" variant="secondary" icon={CreditCard} onClick={() => verDetalle(c)} />
                {esTesorero && c.estado === 'pendiente' && (
                  <Button label="Aprobar" variant="primary" icon={CheckCircle} onClick={async () => { setCreditoActivo(c); setModal('aprobar') }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modales */}
        {modal === 'crear' && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="rounded-xl p-5 w-96" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
              <h3 className="text-sm font-medium mb-3">Nueva solicitud de crédito</h3>
              <div className="grid gap-2">
                <label className="text-xs">Socio</label>
                <select value={socioSel} onChange={e => setSocioSel(e.target.value)} className="p-2 rounded border">
                  <option value="">Selecciona un socio...</option>
                  {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.apellido} · {s.cedula}</option>)}
                </select>
                <Field label="Monto solicitado" type="number" value={monto} onChange={e => setMonto(e.target.value)} />
                <Field label="Tasa interés (%, anual)" type="number" value={tasa} onChange={e => setTasa(e.target.value)} />
                <Field label="Plazo (meses)" type="number" value={plazo} onChange={e => setPlazo(e.target.value)} />
                {error && <p className="text-xs" style={{ color: 'var(--color-danger_r)' }}>{error}</p>}
                <div className="flex gap-2 mt-3">
                  <Button label="Crear" variant="primary" onClick={handleCrear} />
                  <Button label="Cancelar" variant="secondary" onClick={() => setModal(null)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {modal === 'detalle' && creditoActivo && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="rounded-xl p-5 w-96 shadow-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
              <button className="mb-3 text-sm" onClick={() => setModal(null)}><ChevronLeft size={14} /> Volver</button>
              <h3 className="text-sm font-medium">Detalle de crédito</h3>
              <p className="text-sm">Monto total: {creditoActivo.monto_total} · Cuota: {creditoActivo.cuota_mensual}</p>
              <p className="text-sm">Saldo pendiente: {creditoActivo.saldo_pendiente} · Estado: {creditoActivo.estado}</p>

              <div className="mt-3">
                <h4 className="text-sm font-medium">Pagos</h4>
                {pagos.length === 0 && <p className="text-xs text-muted">Aún no hay pagos</p>}
                {pagos.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1">
                    <div>{p.created_at?.split('T')[0]} · {p.monto_pagado ?? p.monto}</div>
                    <div>{p.registrado_por}</div>
                  </div>
                ))}
              </div>

              {esTesorero && creditoActivo.estado === 'activo' && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium">Registrar pago</h4>
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-base)' }}>
                    <Field label="Monto" type="number" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button label="Registrar pago" variant="primary" onClick={handlePago} />
                      <Button label="Cerrar" variant="secondary" onClick={() => setModal(null)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {modal === 'aprobar' && creditoActivo && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="rounded-xl p-5 w-96" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
              <h3 className="text-sm font-medium mb-3">Aprobar crédito</h3>
              <p className="text-sm">¿Aprobar la solicitud de {creditoActivo.socios ? `${creditoActivo.socios.nombre} ${creditoActivo.socios.apellido}` : creditoActivo.socio_id} por {creditoActivo.monto_solicitado}?</p>
              <div className="flex gap-2 mt-3">
                <Button label="Aprobar" variant="primary" onClick={handleAprobar} />
                <Button label="Cancelar" variant="secondary" onClick={() => setModal(null)} />
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
