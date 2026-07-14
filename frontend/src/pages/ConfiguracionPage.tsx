// src/pages/ConfiguracionPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  RefreshCw,
  Shield,
  Briefcase,
  Users,
  UserMinus,
  CalendarClock,
  Check,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { useCaja } from "../context/CajaContext";
import { useNotif } from "../context/NotifContext";
import { apiClient } from "../api/api.client";
import { ciclosService } from "../api/ciclos.service";
import type { GetCiclosResponse } from "../api/ciclos.types";

// ── Constantes ────────────────────────────────────────────────
const MESES = [
  { n: 1,  nombre: "Enero" },      { n: 2,  nombre: "Febrero" },
  { n: 3,  nombre: "Marzo" },      { n: 4,  nombre: "Abril" },
  { n: 5,  nombre: "Mayo" },       { n: 6,  nombre: "Junio" },
  { n: 7,  nombre: "Julio" },      { n: 8,  nombre: "Agosto" },
  { n: 9,  nombre: "Septiembre" }, { n: 10, nombre: "Octubre" },
  { n: 11, nombre: "Noviembre" },  { n: 12, nombre: "Diciembre" },
];

const rolConfig = {
  admin:    { label: "Admin",    icon: Shield,    color: "var(--color-primary_y)"   },
  tesorero: { label: "Tesorero", icon: Briefcase, color: "var(--color-secondary_g)" },
  socio:    { label: "Socio",    icon: Users,     color: "var(--text-secondary)"    },
};

// ── Tipos ─────────────────────────────────────────────────────
interface Miembro {
  id: string;
  rol: "admin" | "tesorero" | "socio";
  activo: boolean;
  email: string;
  profiles: { nombre: string } | null;
}

interface Invitacion {
  codigo: string;
  expira_at: string;
  rol: string;
}

// ══════════════════════════════════════════════════════════════
export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const { cajaActiva } = useCaja();
  const { toast, confirm } = useNotif();

  const esAdmin = cajaActiva?.rol === "admin";

  // Estado general
  const [miembros, setMiembros]     = useState<Miembro[]>([]);
  const [invitacion, setInvitacion] = useState<Invitacion | null>(null);
  const [loading, setLoading]       = useState(true);

  // Invitaciones
  const [generando, setGenerando]     = useState(false);
  const [copiado, setCopiado]         = useState(false);
  const [rolInvitado, setRolInvitado] = useState<"socio" | "tesorero">("socio");

  // Periodo / ciclos
  const [ciclos, setCiclos]       = useState<GetCiclosResponse | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando]   = useState(false);
  const [fundacion, setFundacion] = useState("");
  const [mesInicio, setMesInicio] = useState(1);
  const [duracion, setDuracion]   = useState(12);

  // ── Carga inicial ───────────────────────────────────────────
  useEffect(() => {
    if (!cajaActiva) {
      navigate("/cajas", { replace: true });
      return;
    }
    cargarDatos();
  }, [cajaActiva]);

  async function cargarDatos() {
  setLoading(true);

  // Cada petición se maneja por separado — si una falla, las otras siguen
  try {
    const resCiclos = await ciclosService.getCiclos(cajaActiva!.id);
    setCiclos(resCiclos);
    if (resCiclos.config) {
      setFundacion(resCiclos.config.fecha_fundacion);
      setMesInicio(resCiclos.config.mes_inicio_ciclo);
      setDuracion(resCiclos.config.duracion_ciclo);
    }
  } catch (err) {
    console.error("Error al cargar ciclos:", err);
    toast("error", "Error al cargar el periodo");
  }

  try {
    const resMiembros = await apiClient.get<{ miembros: Miembro[] }>(
      `/cajas/${cajaActiva!.id}/miembros`
    );
    setMiembros(resMiembros.miembros);
  } catch (err) {
    console.error("Error al cargar miembros:", err);
    toast("error", "Error al cargar miembros");
  }

  if (esAdmin) {
    try {
      const resInv = await apiClient.get<{ invitacion: Invitacion | null }>(
        `/cajas/${cajaActiva!.id}/miembros/invitaciones`
      );
      setInvitacion(resInv.invitacion);
    } catch (err) {
      console.error("Error al cargar invitación:", err);
    }
  }

  setLoading(false);
}

  // ── Periodo ─────────────────────────────────────────────────
  async function handleGuardarCiclo() {
    if (!fundacion) {
      toast("error", "Selecciona la fecha de fundación de la caja");
      return;
    }
    setGuardando(true);
    try {
      await ciclosService.guardarConfig(cajaActiva!.id, {
        fecha_fundacion:  fundacion,
        mes_inicio_ciclo: mesInicio,
        duracion_ciclo:   duracion,
      });
      await cargarDatos();
      setEditando(false);
      toast("exito", "Periodo configurado correctamente");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  function cancelarEdicion() {
    setEditando(false);
    if (ciclos?.config) {
      setFundacion(ciclos.config.fecha_fundacion);
      setMesInicio(ciclos.config.mes_inicio_ciclo);
      setDuracion(ciclos.config.duracion_ciclo);
    }
  }

  // ── Invitaciones ────────────────────────────────────────────
  async function handleGenerarCodigo() {
    setGenerando(true);
    try {
      const res = await apiClient.post<{
        codigo: string;
        expira: string;
        rol: string;
      }>(`/cajas/${cajaActiva!.id}/miembros/invitaciones`, { rolInvitado });

      setInvitacion({
        codigo:    res.codigo,
        expira_at: res.expira,
        rol:       res.rol,
      });
      toast("exito", "Código generado");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error al generar código");
    } finally {
      setGenerando(false);
    }
  }

  function copiarCodigo() {
    if (!invitacion) return;
    navigator.clipboard.writeText(invitacion.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast("exito", "Código copiado al portapapeles");
  }

  // ── Miembros ────────────────────────────────────────────────
  async function handleCambiarRol(userId: string, nuevoRol: string) {
    try {
      await apiClient.put(`/cajas/${cajaActiva!.id}/miembros/${userId}`, {
        nuevoRol,
      });
      await cargarDatos();
      toast("exito", "Rol actualizado");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error al cambiar rol");
    }
  }

  async function handleRemover(userId: string) {
    const ok = await confirm({
      titulo:    "¿Remover miembro?",
      mensaje:   "Perderá el acceso a esta caja.",
      labelOk:   "Remover",
      peligroso: true,
    });
    if (!ok) return;

    try {
      await apiClient.delete(`/cajas/${cajaActiva!.id}/miembros/${userId}`);
      await cargarDatos();
      toast("exito", "Miembro removido");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error al remover miembro");
    }
  }

  function formatExpira(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-EC", {
      day:   "numeric",
      month: "long",
      year:  "numeric",
    });
  }

  // ══════════════════════════════════════════════════════════
  return (
    <AppLayout titulo="Configuración">
      <div className="flex flex-col gap-6 max-w-2xl">

        {/* ── Info de la caja ────────────────────────────── */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--bg-surface)",
            border:     "1px solid var(--border-base)",
          }}
        >
          <h2
            className="text-sm font-medium mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {cajaActiva?.nombre}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tu rol en esta caja: <strong>{cajaActiva?.rol}</strong>
          </p>
        </div>

        {/* ── Periodo de la caja — solo admin ────────────── */}
        {esAdmin && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <div className="flex items-center gap-2">
              <CalendarClock size={18} style={{ color: "var(--color-primary_y)" }} />
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Periodo de la caja
              </h3>
            </div>

            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Define cuándo inicia y cuánto dura cada ciclo. Al terminar un ciclo se
              reparten los intereses entre los socios. El sistema calcula
              automáticamente en qué ciclo se encuentra la caja.
            </p>

            {/* Sin configurar */}
            {!loading && ciclos && !ciclos.configurado && !editando && (
              <div
                className="rounded-lg px-3 py-3 text-xs"
                style={{
                  background: "rgba(221,154,76,0.1)",
                  border:     "1px solid rgba(221,154,76,0.25)",
                  color:      "var(--color-primary_y)",
                }}
              >
                <strong>Periodo no configurado.</strong> Los reportes de distribución
                de intereses no estarán disponibles hasta configurarlo.
              </div>
            )}

            {/* Configurado — vista resumen */}
            {!loading && ciclos?.configurado && !editando && (
              <>
                <div
                  className="rounded-lg p-3 flex flex-col gap-2"
                  style={{ background: "var(--bg-base)" }}
                >
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>Fundación</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {ciclos.config?.fecha_fundacion}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Cada ciclo inicia en
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {MESES.find(m => m.n === ciclos.config?.mes_inicio_ciclo)?.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>Duración</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {ciclos.config?.duracion_ciclo} meses
                    </span>
                  </div>
                </div>

                {/* Ciclo actual */}
                {ciclos.ciclo_actual && (
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "rgba(106,178,62,0.08)",
                      border:     "1px solid rgba(106,178,62,0.25)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Ciclo actual
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-secondary_g)" }}
                    >
                      Ciclo {ciclos.ciclo_actual.numero} · {ciclos.ciclo_actual.label}
                    </p>
                  </div>
                )}

                {/* Ciclos cerrados */}
                {ciclos.ciclos.filter(c => c.cerrado).length > 0 && (
                  <div>
                    <p
                      className="text-xs mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Ciclos cerrados
                    </p>
                    <div className="flex flex-col gap-1">
                      {ciclos.ciclos
                        .filter(c => c.cerrado)
                        .map(c => (
                          <div
                            key={c.numero}
                            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                            style={{ background: "var(--bg-base)" }}
                          >
                            <Check
                              size={12}
                              style={{ color: "var(--color-secondary_g)" }}
                            />
                            <span style={{ color: "var(--text-primary)" }}>
                              Ciclo {c.numero}
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {c.label}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <Button
                  label="Cambiar configuración"
                  variant="secondary"
                  onClick={() => setEditando(true)}
                />
              </>
            )}

            {/* Formulario de edición */}
            {!loading && (editando || (ciclos && !ciclos.configurado)) && (
              <div className="flex flex-col gap-3">
                <Field
                  label="Fecha de fundación de la caja"
                  type="date"
                  value={fundacion}
                  onChange={e => setFundacion(e.target.value)}
                  required
                />

                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Mes en que inicia cada ciclo
                  </label>
                  <select
                    value={mesInicio}
                    onChange={e => setMesInicio(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                    style={{
                      background: "var(--bg-base)",
                      border:     "1px solid var(--border-base)",
                      color:      "var(--text-primary)",
                    }}
                  >
                    {MESES.map(m => (
                      <option key={m.n} value={m.n}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Ej: si eliges Abril, los ciclos van de abril a marzo del año
                    siguiente.
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Duración del ciclo
                  </label>
                  <select
                    value={duracion}
                    onChange={e => setDuracion(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                    style={{
                      background: "var(--bg-base)",
                      border:     "1px solid var(--border-base)",
                      color:      "var(--text-primary)",
                    }}
                  >
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses (un año)</option>
                    <option value={24}>24 meses (dos años)</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button
                    label="Guardar periodo"
                    variant="primary"
                    loading={guardando}
                    onClick={handleGuardarCiclo}
                  />
                  {ciclos?.configurado && (
                    <Button
                      label="Cancelar"
                      variant="secondary"
                      onClick={cancelarEdicion}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Código de invitación — solo admin ──────────── */}
        {esAdmin && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Código de invitación
            </h3>

            {invitacion ? (
              <div className="flex flex-col gap-3">
                {/* Código copiable */}
                <div
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{
                    background: "var(--bg-base)",
                    border:     "1px dashed var(--border-base)",
                  }}
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
                      color: copiado
                        ? "var(--color-secondary_g)"
                        : "var(--text-secondary)",
                    }}
                  >
                    <Copy size={12} />
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                </div>

                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Rol: <strong>{invitacion.rol}</strong> · Expira:{" "}
                  {formatExpira(invitacion.expira_at)}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Comparte este código con la persona que quieres agregar. El código
                  expira en 7 días o cuando sea usado.
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
                  <label
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Rol del invitado:
                  </label>
                  <select
                    value={rolInvitado}
                    onChange={e =>
                      setRolInvitado(e.target.value as "socio" | "tesorero")
                    }
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

        {/* ── Lista de miembros ──────────────────────────── */}
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
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
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

          {!loading &&
            miembros.map(m => {
              const config  = rolConfig[m.rol];
              const RolIcon = config.icon;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border-base)" }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                    style={{
                      background: "rgba(221,154,76,0.12)",
                      color:      "var(--color-primary_y)",
                    }}
                  >
                    {m.email?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
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

                  {/* Remover */}
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
              );
            })}
        </div>
      </div>
    </AppLayout>
  );
}
