// backend/utils/reportes.js

/**
 * Genera la lista de meses del periodo: ['2024-05', '2024-06', ...]
 */
function generarMesesPeriodo(inicioISO, cantidadMeses) {
  const meses = [];
  const base = new Date(inicioISO + 'T00:00:00');
  for (let i = 0; i < cantidadMeses; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    meses.push(`${y}-${m}`);
  }
  return meses;
}

/** Último día del mes en formato ISO */
function finDeMes(mesISO) {
  const [y, m] = mesISO.split('-').map(Number);
  const d = new Date(y, m, 0);   // día 0 del mes siguiente
  return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Primer día del mes */
function inicioDeMes(mesISO) {
  return `${mesISO}-01`;
}

/**
 * CÁLCULO PRINCIPAL — replica el modelo del Excel.
 *
 * Para cada mes del periodo:
 *   1. saldo acumulado de cada socio al cierre del mes
 *   2. capital total de la caja = suma de esos saldos
 *   3. interés recaudado ese mes (de pagos_credito)
 *   4. tasa del mes = interés / capital × 100
 *   5. interés de cada socio = tasa × su saldo / 100
 */
function calcularDistribucionInteres({ meses, socios, transacciones, pagosInteres }) {
  // ── Índice de transacciones por socio ────────────────────────
  // Cada transacción tiene: socio_id, tipo (deposito/retiro), monto, created_at
  const txPorSocio = {};
  socios.forEach(s => { txPorSocio[s.id] = []; });

  transacciones.forEach(t => {
    if (!txPorSocio[t.socio_id]) txPorSocio[t.socio_id] = [];
    txPorSocio[t.socio_id].push({
      fecha: t.created_at.split('T')[0],
      signo: t.tipo === 'deposito' ? 1 : -1,
      monto: parseFloat(t.monto),
    });
  });

  // ── Índice de interés recaudado por mes ──────────────────────
  const interesPorMes = {};
  meses.forEach(m => { interesPorMes[m] = 0; });

  pagosInteres.forEach(p => {
    const mes = p.fecha_pago.slice(0, 7);   // '2024-05-13' → '2024-05'
    if (interesPorMes[mes] !== undefined) {
      interesPorMes[mes] += parseFloat(p.monto_interes ?? 0);
    }
  });

  // ── Cálculo mes a mes ────────────────────────────────────────
  const filasMes = [];          // una fila por mes
  const acumSocio = {};         // interés total acumulado por socio

  socios.forEach(s => { acumSocio[s.id] = 0; });

  meses.forEach(mes => {
    const corte = finDeMes(mes);

    // 1. Saldo acumulado de cada socio al cierre de este mes
    const saldos = {};
    let capitalTotal = 0;

    socios.forEach(s => {
      const movimientos = txPorSocio[s.id] ?? [];
      const saldo = movimientos
        .filter(t => t.fecha <= corte)              // todo lo anterior al corte
        .reduce((acc, t) => acc + t.signo * t.monto, 0);
      saldos[s.id] = +saldo.toFixed(2);
      capitalTotal += saldo;
    });

    capitalTotal = +capitalTotal.toFixed(2);

    // 2. Interés recaudado en este mes
    const interesMes = +(interesPorMes[mes] ?? 0).toFixed(2);

    // 3. Tasa del mes — el corazón del modelo
    //    Si no hay capital, la tasa es 0 (evita división por cero)
    const tasaMes = capitalTotal > 0
      ? +((interesMes / capitalTotal) * 100).toFixed(6)
      : 0;

    // 4. Reparto a cada socio
    const reparto = {};
    socios.forEach(s => {
      const cuota = +((tasaMes * saldos[s.id]) / 100).toFixed(6);
      reparto[s.id] = cuota;
      acumSocio[s.id] += cuota;
    });

    filasMes.push({
      mes,
      capital_total:   capitalTotal,
      interes_mes:     interesMes,
      tasa_mes:        tasaMes,          // % de rendimiento de ese mes
      saldos,                            // saldo de cada socio
      reparto,                           // interés que le tocó a cada socio
    });
  });

  // ── Totales del periodo ──────────────────────────────────────
  const interesTotal = +filasMes.reduce((s, f) => s + f.interes_mes, 0).toFixed(2);
  const tasaAcumulada = +filasMes.reduce((s, f) => s + f.tasa_mes, 0).toFixed(4);

  // Tabla por socio con su acumulado
  const porSocio = socios.map(s => ({
    socio_id: s.id,
    nombre:   `${s.nombre} ${s.apellido}`,
    cedula:   s.cedula,
    // Saldo final del socio (último mes del periodo)
    saldo_final: filasMes.length ? filasMes[filasMes.length - 1].saldos[s.id] : 0,
    // Interés mes a mes
    por_mes: filasMes.map(f => ({ mes: f.mes, interes: +f.reparto[s.id].toFixed(2) })),
    // Total del periodo
    interes_total: +acumSocio[s.id].toFixed(2),
  }));

  // ── Validación de cuadre ─────────────────────────────────────
  const sumaRepartida = +porSocio.reduce((s, p) => s + p.interes_total, 0).toFixed(2);
  const diferencia    = +(interesTotal - sumaRepartida).toFixed(2);

  return {
    meses:          filasMes,
    por_socio:      porSocio,
    interes_total:  interesTotal,
    tasa_acumulada: tasaAcumulada,
    validacion: {
      interes_generado:  interesTotal,
      interes_repartido: sumaRepartida,
      diferencia,                       // debe ser ~0
      cuadra: Math.abs(diferencia) < 0.05,
    },
  };
}

module.exports = { generarMesesPeriodo, calcularDistribucionInteres, finDeMes, inicioDeMes };