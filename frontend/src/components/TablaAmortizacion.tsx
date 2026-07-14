// src/components/TablaAmortizacion.tsx
import { useState, useEffect, Fragment } from "react";
import { Download, X, CheckCircle, Circle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "./Button";
import { creditosService } from "../api/creditos.service";
import type { GetAmortizacionResponse } from "../api/amortizacion.types";
import { HandCoins } from "lucide-react";


function formatMonto(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(m);
}

interface Props {
  cajaId: string;
  creditoId: string;
  nombreCaja: string;
  onCerrar: () => void;
}

export function TablaAmortizacion({
  cajaId,
  creditoId,
  nombreCaja,
  onCerrar,
}: Props) {
  const [data, setData] = useState<GetAmortizacionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await creditosService.getAmortizacion(cajaId, creditoId);
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [cajaId, creditoId]);

  function descargarPDF() {
    if (!data) return;
    const { credito, tabla, resumen } = data;
    const socio = credito.socio;
    const nombreSocio = socio
      ? `${socio.nombre} ${socio.apellido}`
      : "Sin socio";

    const doc = new jsPDF();
    const bodyRows: any[] = [];
    tabla.forEach((f) => {
      bodyRows.push([
        f.numero_cuota,
        f.fecha_vencimiento ?? "—",
        formatMonto(f.capital),
        f.es_prepago
          ? `${formatMonto(f.interes_condonado)} (condonado)`
          : formatMonto(f.interes),
        formatMonto(f.cuota),
        formatMonto(f.saldo_restante),
        f.es_prepago
          ? "Prepagada"
          : f.pagada
            ? "Pagada"
            : f.vencida
              ? "Vencida"
              : f.parcial
                ? "Parcial"
                : "Pendiente",
      ]);

      // Fila de detalle por cada abono
      if (f.es_fraccionada) {
        f.movimientos.forEach(m => {
          const desc = [
            `${m.es_abono ? "Abono" : "Pago"} ${formatMonto(m.monto)}`,
            m.capital > 0 ? `capital ${formatMonto(m.capital)}` : null,
            m.interes > 0 ? `interés ${formatMonto(m.interes)}` : null,
            m.motivo,
            m.fecha_pago,
          ].filter(Boolean).join(" — ")

          bodyRows.push([
            "",
            {
              content: desc,
              colSpan: 6,
              styles: {
                fontStyle: "italic",
                fontSize: 7,
                textColor: m.es_abono ? [150, 110, 50] : [120, 120, 120],
              },
            },
          ])
        })
      }
    });
    // Encabezado
    doc.setFontSize(16);
    doc.text("Tabla de Amortización", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(nombreCaja, 14, 25);

    // Datos del crédito
    doc.setFontSize(9);
    doc.setTextColor(0);
    const inicioY = 34;
    doc.text(`Socio: ${nombreSocio}`, 14, inicioY);
    if (socio?.cedula) doc.text(`Cédula: ${socio.cedula}`, 14, inicioY + 5);
    doc.text(
      `Monto prestado: ${formatMonto(credito.monto_solicitado)}`,
      110,
      inicioY,
    );
    doc.text(`Tasa: ${credito.tasa_interes}% anual`, 110, inicioY + 5);
    doc.text(`Plazo: ${credito.plazo_meses} meses`, 110, inicioY + 10);
    doc.text(
      `Total a pagar: ${formatMonto(credito.monto_total)}`,
      14,
      inicioY + 10,
    );
    if (credito.fecha_desembolso) {
      doc.text(`Desembolso: ${credito.fecha_desembolso}`, 14, inicioY + 15);
    }

    // Tabla
    autoTable(doc, {
      startY: inicioY + 22,
      head: [["#", "Vence", "Capital", "Interés", "Cuota", "Saldo", "Estado"]],
      body: bodyRows,
      foot: [
        [
          "Total",
          "",
          formatMonto(credito.monto_solicitado),
          formatMonto(credito.interes_total),
          formatMonto(credito.monto_total),
          "",
          "",
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [221, 154, 76], textColor: 255, fontSize: 8 },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
    });

    // Pie con resumen
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text(
      `Cuotas pagadas: ${resumen.cuotas_pagadas} de ${resumen.cuotas_totales}`,
      14,
      finalY,
    );
    doc.text(
      `Capital pagado: ${formatMonto(resumen.capital_pagado)}`,
      14,
      finalY + 5,
    );
    doc.text(
      `Interés pagado: ${formatMonto(resumen.interes_pagado)}`,
      14,
      finalY + 10,
    );
    doc.text(
      `Saldo pendiente: ${formatMonto(credito.saldo_pendiente)}`,
      14,
      finalY + 15,
    );

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-EC")} — Domus`,
      14,
      doc.internal.pageSize.height - 10,
    );

    doc.save(`amortizacion-${nombreSocio.replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-3xl rounded-xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-surface)", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-base)" }}
        >
          <div>
            <h3
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Tabla de amortización
            </h3>
            {data?.credito.socio && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {data.credito.socio.nombre} {data.credito.socio.apellido}
              </p>
            )}
          </div>
          <button onClick={onCerrar} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Cargando tabla...
            </p>
          )}

          {data && (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--bg-base)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Prestado
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatMonto(data.credito.monto_solicitado)}
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--bg-base)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Interés total
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-primary_y)" }}
                  >
                    {formatMonto(data.credito.interes_total)}
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--bg-base)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Total a pagar
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatMonto(data.credito.monto_total)}
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--bg-base)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Cuotas
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {data.resumen.cuotas_pagadas} /{" "}
                    {data.resumen.cuotas_totales}
                  </p>
                </div>
              </div>

              {/* Alertas */}
              {data.resumen.cuotas_vencidas > 0 && (
                <div
                  className="rounded-lg px-3 py-2 mb-4 text-xs"
                  style={{
                    background: "rgba(217,97,70,0.1)",
                    border: "1px solid rgba(217,97,70,0.25)",
                    color: "var(--color-danger_r)",
                  }}
                >
                  <strong>
                    {data.resumen.cuotas_vencidas} cuota
                    {data.resumen.cuotas_vencidas > 1 ? "s" : ""} vencida
                    {data.resumen.cuotas_vencidas > 1 ? "s" : ""}.
                  </strong>
                </div>
              )}

              {data.resumen.interes_condonado > 0 && (
                <div
                  className="rounded-lg px-3 py-2 mb-4 text-xs"
                  style={{
                    background: "rgba(106,178,62,0.1)",
                    border: "1px solid rgba(106,178,62,0.25)",
                    color: "var(--color-secondary_g)",
                  }}
                >
                  <strong>
                    Interés condonado por prepago:{" "}
                    {formatMonto(data.resumen.interes_condonado)}
                  </strong>
                </div>
              )}

              {/* Tabla */}

              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border-base)" }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--bg-base)" }}>
                      <th
                        className="px-3 py-2 text-left"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        #
                      </th>
                      <th
                        className="px-3 py-2 text-left"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Vence
                      </th>
                      <th
                        className="px-3 py-2 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Capital
                      </th>
                      <th
                        className="px-3 py-2 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Interés
                      </th>
                      <th
                        className="px-3 py-2 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Cuota
                      </th>
                      <th
                        className="px-3 py-2 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Saldo
                      </th>
                      <th
                        className="px-3 py-2 text-center"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tabla.map((f) => (
                      <Fragment key={f.numero_cuota}>
                        {/* Fila de la cuota */}
                        <tr
                          style={{
                            borderTop: "1px solid var(--border-base)",
                            background: f.vencida
                              ? "rgba(217,97,70,0.06)"
                              : f.es_prepago
                                ? "rgba(106,178,62,0.06)"
                                : "transparent",
                          }}
                        >
                          <td
                            className="px-3 py-2"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {f.numero_cuota}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{
                              color: f.vencida
                                ? "var(--color-danger_r)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {f.fecha_vencimiento ?? "—"}
                          </td>
                          <td
                            className="px-3 py-2 text-right"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatMonto(f.capital)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {f.es_prepago ? (
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {formatMonto(f.interes_condonado)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-primary_y)" }}>
                                {formatMonto(f.interes)}
                              </span>
                            )}
                          </td>
                          <td
                            className="px-3 py-2 text-right font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatMonto(f.cuota)}
                          </td>
                          <td
                            className="px-3 py-2 text-right"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {formatMonto(f.saldo_restante)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {f.es_prepago ? (
                              <span style={{ color: "var(--color-secondary_g)" }}>
                                Prepagada
                              </span>
                            ) : f.pagada ? (
                              <CheckCircle
                                size={14}
                                className="inline"
                                style={{ color: "var(--color-secondary_g)" }}
                              />
                            ) : f.vencida ? (
                              <span style={{ color: "var(--color-danger_r)" }}>
                                Vencida
                              </span>
                            ) : f.parcial ? (
                              <span style={{ color: "var(--color-primary_y)" }}>
                                Parcial
                              </span>
                            ) : (
                              <Circle
                                size={14}
                                className="inline"
                                style={{ color: "var(--text-muted)" }}
                              />
                            )}
                          </td>
                        </tr>

                        {/* Filas de movimientos — HERMANAS, no hijas */}
                        {f.es_fraccionada &&
                          f.movimientos.map((m, i) => (
                            <tr
                              key={`${f.numero_cuota}-mov-${i}`}
                              style={{
                                background: m.es_abono
                                  ? "rgba(221,154,76,0.04)"
                                  : "rgba(0,0,0,0.02)",
                              }}
                            >
                              <td></td>
                              <td colSpan={6} className="px-3 py-1.5">
                                <div className="flex items-start gap-2 text-xs">
                                  <HandCoins
                                    size={11}
                                    style={{
                                      color: m.es_abono
                                        ? "var(--color-primary_y)"
                                        : "var(--text-muted)",
                                      flexShrink: 0,
                                      marginTop: 2,
                                    }}
                                  />
                                  <span style={{ color: "var(--text-secondary)" }}>
                                    <strong
                                      style={{
                                        color: m.es_abono
                                          ? "var(--color-primary_y)"
                                          : "var(--text-secondary)",
                                      }}
                                    >
                                      {m.es_abono ? "Abono" : "Pago"}{" "}
                                      {formatMonto(m.monto)}
                                    </strong>
                                    {m.capital > 0 &&
                                      ` · capital ${formatMonto(m.capital)}`}
                                    {m.interes > 0 &&
                                      ` · interés ${formatMonto(m.interes)}`}
                                    {m.motivo && ` · ${m.motivo}`}
                                    {" · "}
                                    {m.fecha_pago}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </Fragment>
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
                        className="px-3 py-2 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Total
                      </td>
                      <td></td>
                      <td
                        className="px-3 py-2 text-right font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatMonto(data.credito.monto_solicitado)}
                      </td>
                      <td
                        className="px-3 py-2 text-right font-medium"
                        style={{ color: "var(--color-primary_y)" }}
                      >
                        {formatMonto(data.credito.interes_total)}
                      </td>
                      <td
                        className="px-3 py-2 text-right font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatMonto(data.credito.monto_total)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border-base)" }}
        >
          <Button
            label="Descargar PDF"
            variant="primary"
            icon={Download}
            onClick={descargarPDF}
          />
          <Button label="Cerrar" variant="secondary" onClick={onCerrar} />
        </div>
      </div>
    </div>
  );
}
