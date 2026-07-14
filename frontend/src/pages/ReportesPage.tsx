// src/pages/ReportesPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  TrendingUp,
  Wallet,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  PieChart,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/UI/Card";
import { useCaja } from "../context/CajaContext";
import { useNotif } from "../context/NotifContext";
import { reportesService } from "../api/reportes.service";
import type {
  DistribucionResponse,
  EstadoCajaResponse,
} from "../api/reportes.types";
import { apiClient } from "../api/api.client";

function fm(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(m);
}

function fpct(n: number) {
  return `${n.toFixed(4)}%`;
}

function labelMes(mes: string) {
  const [y, m] = mes.split("-");
  const nombres = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${nombres[parseInt(m) - 1]} ${y.slice(2)}`;
}

type Tab = "resumen" | "mensual" | "socios";

export default function ReportesPage() {
  const navigate = useNavigate();
  const { cajaActiva } = useCaja();
  const { toast } = useNotif();

  const [tab, setTab] = useState<Tab>("resumen");
  const [dist, setDist] = useState<DistribucionResponse | null>(null);
  const [estado, setEstado] = useState<EstadoCajaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cicloSel, setCicloSel] = useState<number | null>(null);

  useEffect(() => {
    if (!cajaActiva) {
      navigate("/cajas", { replace: true });
      return;
    }
    cargar();
  }, [cajaActiva]);

  async function cargar(numeroCiclo?: number) {
    setLoading(true);
    try {
      const [d, e] = await Promise.all([
        reportesService.getDistribucion(cajaActiva!.id, numeroCiclo),
        reportesService.getEstadoCaja(cajaActiva!.id, numeroCiclo), // ← ahora pasa el ciclo
      ]);
      setDist(d);
      setEstado(e);
      setCicloSel(d.ciclo.numero);
    } catch (err) {
      toast(
        "error",
        err instanceof Error ? err.message : "Error al cargar reportes",
      );
    } finally {
      setLoading(false);
    }
  }

  // ── PDF del reporte anual ────────────────────────────────────
  function descargarPDF() {
    if (!dist || !estado) return;

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(15);
    doc.text("Reporte de Distribución de Intereses", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `${dist.caja.nombre} — Ciclo ${dist.ciclo.numero}: ${dist.ciclo.label}`,
      14,
      22,
    );

    // Resumen financiero
    doc.setTextColor(0);
    doc.setFontSize(9);
    let y = 32;
    doc.text(`Total ahorros: ${fm(estado.total_ahorros)}`, 14, y);
    doc.text(`Interés recaudado: ${fm(estado.interes_recaudado)}`, 90, y);
    doc.text(`Por cobrar: ${fm(estado.por_cobrar)}`, 170, y);
    doc.text(`En caja: ${fm(estado.en_caja)}`, 240, y);

    // Tabla mensual
    autoTable(doc, {
      startY: y + 8,
      head: [["Mes", "Capital de la caja", "Interés recaudado", "Rendimiento"]],
      body: dist.meses.map((m) => [
        labelMes(m.mes),
        fm(m.capital_total),
        fm(m.interes_mes),
        fpct(m.tasa_mes),
      ]),
      foot: [["Total", "", fm(dist.interes_total), fpct(dist.tasa_acumulada)]],
      theme: "grid",
      headStyles: { fillColor: [221, 154, 76], textColor: 255, fontSize: 8 },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
    });

    // Tabla por socio
    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text("Interés por socio", 14, y2);

    autoTable(doc, {
      startY: y2 + 4,
      head: [["Socio", ...dist.meses.map((m) => labelMes(m.mes)), "Total"]],
      body: dist.por_socio.map((s) => [
        s.nombre,
        ...s.por_mes.map((p) => p.interes.toFixed(2)),
        s.interes_total.toFixed(2),
      ]),
      foot: [
        [
          "Total repartido",
          ...dist.meses.map((m) => m.interes_mes.toFixed(2)),
          dist.validacion.interes_repartido.toFixed(2),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [221, 154, 76], textColor: 255, fontSize: 7 },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 40 } },
    });

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-EC")} — Domus`,
      14,
      doc.internal.pageSize.height - 8,
    );

    doc.save(`reporte-${dist.caja.nombre.replace(/\s+/g, "-")}.pdf`);
  }

  if (loading) {
    return (
      <AppLayout titulo="Reportes">
        <p
          className="text-sm text-center py-12"
          style={{ color: "var(--text-secondary)" }}
        >
          Calculando reporte...
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout titulo="Reportes">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Distribución de intereses
            </h2>

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ciclo {dist?.ciclo.numero} · {dist?.ciclo.label}
            </p>
          </div>
          <Button
            label="Descargar PDF"
            variant="primary"
            icon={Download}
            onClick={descargarPDF}
          />
          {dist && dist.ciclos_disponibles.length > 1 && (
            <select
              value={cicloSel ?? ""}
              onChange={(e) => cargar(parseInt(e.target.value))}
              className="text-sm px-3 py-2 rounded-lg outline-none"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-base)",
                color: "var(--text-primary)",
              }}
            >
              {dist.ciclos_disponibles.map((c) => (
                <option key={c.numero} value={c.numero}>
                  Ciclo {c.numero} — {c.label} {c.actual ? "(actual)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Validación de cuadre */}
        {dist && (
          <div
            className="rounded-lg px-4 py-3 flex items-center gap-3"
            style={{
              background: dist.validacion.cuadra
                ? "rgba(106,178,62,0.08)"
                : "rgba(217,97,70,0.08)",
              border: `1px solid ${
                dist.validacion.cuadra
                  ? "rgba(106,178,62,0.25)"
                  : "rgba(217,97,70,0.25)"
              }`,
            }}
          >
            {dist.validacion.cuadra ? (
              <CheckCircle
                size={18}
                style={{ color: "var(--color-secondary_g)" }}
              />
            ) : (
              <AlertTriangle
                size={18}
                style={{ color: "var(--color-danger_r)" }}
              />
            )}
            <div className="flex-1 text-sm">
              <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {dist.validacion.cuadra
                  ? "El reparto cuadra"
                  : "Diferencia detectada"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Generado {fm(dist.validacion.interes_generado)} · Repartido{" "}
                {fm(dist.validacion.interes_repartido)}
                {!dist.validacion.cuadra &&
                  ` · Diferencia ${fm(dist.validacion.diferencia)}`}
              </p>
            </div>
          </div>
        )}

        {/* Tarjetas de estado */}
        {estado && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card
              label="Total ahorrado"
              value={fm(estado.total_ahorros)}
              subtext="saldo actual de las cuentas"
              icon={Wallet}
              acento
            />
            <Card
              label="Interés del ciclo"
              value={fm(estado.interes_recaudado)}
              subtext={`Rendimiento ${fpct(dist?.tasa_acumulada ?? 0)}`}
              icon={TrendingUp}
            />
            <Card
              label="Por cobrar"
              value={fm(estado.por_cobrar)}
              subtext={`${estado.creditos.activos} crédito(s) activo(s)`}
              icon={CreditCard}
            />
            <Card
              label="Disponible en caja"
              value={fm(estado.en_caja)}
              subtext="ahorros + interés histórico − prestado"
              icon={PieChart}
            />
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 border-b"
          style={{ borderColor: "var(--border-base)" }}
        >
          {(
            [
              ["resumen", "Resumen mensual"],
              ["socios", "Interés por socio"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-4 py-2 text-sm"
              style={{
                color:
                  tab === id
                    ? "var(--color-primary_y)"
                    : "var(--text-secondary)",
                borderBottom:
                  tab === id
                    ? "2px solid var(--color-primary_y)"
                    : "2px solid transparent",
                fontWeight: tab === id ? 500 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB: Resumen mensual */}
        {tab === "resumen" && dist && (
          <div
            className="rounded-xl overflow-x-auto"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-base)",
            }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-base)" }}>
                  <th
                    className="px-4 py-2 text-left"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Mes
                  </th>
                  <th
                    className="px-4 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Capital de la caja
                  </th>
                  <th
                    className="px-4 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Interés recaudado
                  </th>
                  <th
                    className="px-4 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Rendimiento del mes
                  </th>
                </tr>
              </thead>
              <tbody>
                {dist.meses.map((m) => (
                  <tr
                    key={m.mes}
                    style={{ borderTop: "1px solid var(--border-base)" }}
                  >
                    <td
                      className="px-4 py-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {labelMes(m.mes)}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fm(m.capital_total)}
                    </td>
                    <td
                      className="px-4 py-2 text-right"
                      style={{ color: "var(--color-primary_y)" }}
                    >
                      {fm(m.interes_mes)}
                    </td>
                    <td
                      className="px-4 py-2 text-right font-medium"
                      style={{
                        color:
                          m.tasa_mes > 0
                            ? "var(--color-secondary_g)"
                            : "var(--text-muted)",
                      }}
                    >
                      {fpct(m.tasa_mes)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: "var(--bg-base)",
                    borderTop: "2px solid var(--border-base)",
                  }}
                >
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Total
                  </td>
                  <td></td>
                  <td
                    className="px-4 py-2 text-right font-medium"
                    style={{ color: "var(--color-primary_y)" }}
                  >
                    {fm(dist.interes_total)}
                  </td>
                  <td
                    className="px-4 py-2 text-right font-medium"
                    style={{ color: "var(--color-secondary_g)" }}
                  >
                    {fpct(dist.tasa_acumulada)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB: Interés por socio */}
        {tab === "socios" && dist && (
          <div
            className="rounded-xl overflow-x-auto"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-base)",
            }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-base)" }}>
                  <th
                    className="px-3 py-2 text-left sticky left-0"
                    style={{
                      color: "var(--text-secondary)",
                      background: "var(--bg-base)",
                    }}
                  >
                    Socio
                  </th>
                  <th
                    className="px-3 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Ahorro final
                  </th>
                  {dist.meses.map((m) => (
                    <th
                      key={m.mes}
                      className="px-2 py-2 text-right whitespace-nowrap"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {labelMes(m.mes)}
                    </th>
                  ))}
                  <th
                    className="px-3 py-2 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {dist.por_socio.map((s) => (
                  <tr
                    key={s.socio_id}
                    style={{ borderTop: "1px solid var(--border-base)" }}
                  >
                    <td
                      className="px-3 py-2 sticky left-0"
                      style={{
                        color: "var(--text-primary)",
                        background: "var(--bg-surface)",
                      }}
                    >
                      {s.nombre}
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {fm(s.saldo_final)}
                    </td>
                    {s.por_mes.map((p) => (
                      <td
                        key={p.mes}
                        className="px-2 py-2 text-right"
                        style={{
                          color:
                            p.interes > 0
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {p.interes > 0 ? p.interes.toFixed(2) : "—"}
                      </td>
                    ))}
                    <td
                      className="px-3 py-2 text-right font-medium"
                      style={{ color: "var(--color-secondary_g)" }}
                    >
                      {fm(s.interes_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: "var(--bg-base)",
                    borderTop: "2px solid var(--border-base)",
                  }}
                >
                  <td
                    className="px-3 py-2 font-medium sticky left-0"
                    style={{
                      color: "var(--text-primary)",
                      background: "var(--bg-base)",
                    }}
                  >
                    Total repartido
                  </td>
                  <td></td>
                  {dist.meses.map((m) => (
                    <td
                      key={m.mes}
                      className="px-2 py-2 text-right font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {m.interes_mes.toFixed(2)}
                    </td>
                  ))}
                  <td
                    className="px-3 py-2 text-right font-medium"
                    style={{ color: "var(--color-primary_y)" }}
                  >
                    {fm(dist.validacion.interes_repartido)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
