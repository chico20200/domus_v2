// backend/routes/reportes.routes.js
const express       = require('express');
const router        = express.Router({ mergeParams: true });
const supabaseAdmin = require('../config/supabaseAdmin');
const verifyToken   = require('../middlewares/auth.middleware');
const { generarMesesPeriodo, calcularDistribucionInteres } = require('../utils/reportes');
const { calcularCiclos } = require('../utils/ciclos');

router.use(verifyToken);

async function verificarRol(userId, cajaId, rolMinimo = 'socio') {
  const jerarquia = { socio: 1, tesorero: 2, admin: 3 };
  const { data } = await supabaseAdmin
    .from('miembros_caja').select('rol')
    .eq('caja_id', cajaId).eq('user_id', userId).eq('activo', true).single();
  if (!data) return null;
  if (jerarquia[data.rol] < jerarquia[rolMinimo]) return null;
  return data.rol;
}

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/reportes/distribucion-interes
// El reporte completo del periodo
// ─────────────────────────────────────────────
router.get('/distribucion-interes', async (req, res) => {
  const { cajaId } = req.params;
  const { ciclo } = req.query;   // ?ciclo=2 → ver un ciclo pasado

  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  try {
    const { data: caja } = await supabaseAdmin
      .from('cajas')
      .select('id, nombre, fecha_fundacion, mes_inicio_ciclo, duracion_ciclo')
      .eq('id', cajaId).single();

    if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });

    // Si no está configurado el ciclo, no se puede calcular
    if (!caja.fecha_fundacion) {
      return res.status(400).json({
        error: 'Configura el periodo de la caja antes de generar reportes',
        requiere_configuracion: true,
      });
    }

    const { ciclos, cicloActual } = calcularCiclos(
      caja.fecha_fundacion,
      caja.mes_inicio_ciclo,
      caja.duracion_ciclo
    );

    // Si pidió un ciclo específico, úsalo; si no, el actual
    const cicloSel = ciclo
      ? ciclos.find(c => c.numero === parseInt(ciclo))
      : cicloActual;

    if (!cicloSel) {
      return res.status(404).json({ error: 'Ciclo no encontrado' });
    }

    const meses  = cicloSel.meses;
    const mesFin = meses[meses.length - 1];

    // Socios activos
    const { data: socios } = await supabaseAdmin
      .from('socios')
      .select('id, nombre, apellido, cedula')
      .eq('caja_id', cajaId)
      .eq('activo', true)
      .order('apellido');

    // Transacciones de ahorro
    const { data: transacciones } = await supabaseAdmin
      .from('transacciones')
      .select('tipo, monto, created_at, cuentas_ahorro!inner ( socio_id )')
      .eq('caja_id', cajaId)
      .order('created_at');

    const txPlanas = (transacciones ?? []).map(t => ({
      socio_id:   t.cuentas_ahorro.socio_id,
      tipo:       t.tipo,
      monto:      t.monto,
      created_at: t.created_at,
    }));

    // Pagos de interés dentro del ciclo — con la fecha fin correcta
    const { data: pagosInteres } = await supabaseAdmin
      .from('pagos_credito')
      .select('monto_interes, fecha_pago')
      .eq('caja_id', cajaId)
      .gte('fecha_pago', cicloSel.inicio)
      .lte('fecha_pago', cicloSel.fin);

    const resultado = calcularDistribucionInteres({
      meses,
      socios:        socios ?? [],
      transacciones: txPlanas,
      pagosInteres:  pagosInteres ?? [],
    });

    return res.json({
      caja: {
        id:     caja.id,
        nombre: caja.nombre,
      },
      ciclo: cicloSel,
      ciclos_disponibles: ciclos.map(c => ({
        numero:  c.numero,
        label:   c.label,
        cerrado: c.cerrado,
        actual:  c.actual,
      })),
      ...resultado,
    });

  } catch (err) {
    console.error('Error en distribución:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/reportes/estado-caja?ciclo=2
// Resumen financiero del ciclo (o el actual por defecto)
// ─────────────────────────────────────────────
router.get('/estado-caja', async (req, res) => {
  const { cajaId } = req.params;
  const { ciclo }  = req.query;

  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  // 1. Configuración del ciclo
  const { data: caja } = await supabaseAdmin
    .from('cajas')
    .select('fecha_fundacion, mes_inicio_ciclo, duracion_ciclo')
    .eq('id', cajaId).single();

  if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });
  if (!caja.fecha_fundacion) {
    return res.status(400).json({
      error: 'Configura el periodo de la caja antes de generar reportes',
      requiere_configuracion: true,
    });
  }

  const { ciclos, cicloActual } = calcularCiclos(
    caja.fecha_fundacion,
    caja.mes_inicio_ciclo,
    caja.duracion_ciclo
  );

  const cicloSel = ciclo
    ? ciclos.find(c => c.numero === parseInt(ciclo))
    : cicloActual;

  if (!cicloSel) return res.status(404).json({ error: 'Ciclo no encontrado' });

  // 2. Ahorros — saldo actual de las cuentas (no depende del ciclo)
  const { data: cuentas } = await supabaseAdmin
    .from('cuentas_ahorro').select('saldo')
    .eq('caja_id', cajaId).eq('estado', 'activa');

  const totalAhorros = +(cuentas ?? [])
    .reduce((s, c) => s + parseFloat(c.saldo), 0).toFixed(2);

  // 3. Créditos — estado actual de la cartera
  const { data: creditos } = await supabaseAdmin
    .from('creditos')
    .select('estado, monto_solicitado, saldo_pendiente, interes_condonado')
    .eq('caja_id', cajaId);

  const activos = (creditos ?? []).filter(c => c.estado === 'activo');
  const porCobrar = +activos
    .reduce((s, c) => s + parseFloat(c.saldo_pendiente), 0).toFixed(2);

  const condonado = +(creditos ?? [])
    .reduce((s, c) => s + parseFloat(c.interes_condonado ?? 0), 0).toFixed(2);

  // 4. Interés y capital — SOLO DEL CICLO SELECCIONADO
  const { data: pagosCiclo } = await supabaseAdmin
    .from('pagos_credito')
    .select('monto_interes, monto_capital')
    .eq('caja_id', cajaId)
    .gte('fecha_pago', cicloSel.inicio)
    .lte('fecha_pago', cicloSel.fin);

  const interesRecaudado = +(pagosCiclo ?? [])
    .reduce((s, p) => s + parseFloat(p.monto_interes ?? 0), 0).toFixed(2);
  const capitalRecuperado = +(pagosCiclo ?? [])
    .reduce((s, p) => s + parseFloat(p.monto_capital ?? 0), 0).toFixed(2);

  // 5. Interés histórico total — para contexto
  const { data: pagosTodos } = await supabaseAdmin
    .from('pagos_credito').select('monto_interes')
    .eq('caja_id', cajaId);

  const interesHistorico = +(pagosTodos ?? [])
    .reduce((s, p) => s + parseFloat(p.monto_interes ?? 0), 0).toFixed(2);

  // 6. Dinero disponible en caja
  const enCaja = +(totalAhorros + interesHistorico - porCobrar).toFixed(2);

  return res.json({
    ciclo: {
      numero: cicloSel.numero,
      label:  cicloSel.label,
      inicio: cicloSel.inicio,
      fin:    cicloSel.fin,
    },
    total_ahorros:      totalAhorros,
    interes_recaudado:  interesRecaudado,     // ← del ciclo
    capital_recuperado: capitalRecuperado,    // ← del ciclo
    interes_historico:  interesHistorico,     // ← de toda la vida de la caja
    por_cobrar:         porCobrar,
    interes_condonado:  condonado,
    en_caja:            enCaja,
    creditos: {
      total:      creditos?.length ?? 0,
      activos:    activos.length,
      pagados:    (creditos ?? []).filter(c => c.estado === 'pagado').length,
      pendientes: (creditos ?? []).filter(c => c.estado === 'pendiente').length,
      vencidos:   (creditos ?? []).filter(c => c.estado === 'vencido').length,
    },
  });
});

module.exports = router;