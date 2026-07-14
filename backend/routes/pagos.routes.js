// backend/routes/pagos.routes.js
const express       = require('express');
const router        = express.Router({ mergeParams: true });
const supabaseAdmin = require('../config/supabaseAdmin');
const verifyToken   = require('../middlewares/auth.middleware');
const { generarTablaAmortizacion } = require('../utils/amortizacion');
const { analizarEstadoCredito } = require('../utils/amortizacion');
router.use(verifyToken);

async function verificarRol(userId, cajaId, rolMinimo = 'socio') {
  const jerarquia = { socio: 1, tesorero: 2, admin: 3 };
  const { data } = await supabaseAdmin
    .from('miembros_caja')
    .select('rol')
    .eq('caja_id', cajaId)
    .eq('user_id', userId)
    .eq('activo', true)
    .single();
  if (!data) return null;
  if (jerarquia[data.rol] < jerarquia[rolMinimo]) return null;
  return data.rol;
}

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/creditos/:creditoId/pagos
// Lista los pagos de un crédito
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { cajaId, creditoId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'socio');
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' });

  const { data, error } = await supabaseAdmin
    .from('pagos_credito')
    .select('*')
    .eq('caja_id', cajaId)
    .eq('credito_id', creditoId)
    .order('numero_cuota', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ pagos: data ?? [] });
});

// ─────────────────────────────────────────────
// POST /api/cajas/:cajaId/creditos/:creditoId/pagos
// Registra un pago de cuota separando capital e interés
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { cajaId, creditoId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  const { tipo_pago } = req.body;

  // 1. Lee el crédito
  const { data: credito } = await supabaseAdmin
    .from('creditos')
    .select('*')
    .eq('id', creditoId)
    .eq('caja_id', cajaId)
    .single();

  if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });
  if (credito.estado === 'pagado') {
    return res.status(400).json({ error: 'Este crédito ya está pagado' });
  }

  // 2. Genera la tabla teórica
  const { tabla } = generarTablaAmortizacion(
    parseFloat(credito.monto_solicitado),
    parseFloat(credito.tasa_interes),
    credito.plazo_meses
  );

  // 3. Lee TODOS los pagos ya hechos
  const { data: pagosPrevios } = await supabaseAdmin
    .from('pagos_credito')
    .select('numero_cuota, monto_capital, monto_interes')
    .eq('credito_id', creditoId);

  // 4. Suma lo pagado por cada cuota
  const pagadoPorCuota = {};
  (pagosPrevios ?? []).forEach(p => {
    const n = p.numero_cuota;
    if (!pagadoPorCuota[n]) pagadoPorCuota[n] = { capital: 0, interes: 0 };
    pagadoPorCuota[n].capital += parseFloat(p.monto_capital);
    pagadoPorCuota[n].interes += parseFloat(p.monto_interes);
  });

  // 5. Encuentra la primera cuota que aún debe capital o interés
  let numeroCuota = null;
  let cuotaActual = null;
  let faltaCapital = 0;
  let faltaInteres = 0;

  for (const fila of tabla) {
    const pagado = pagadoPorCuota[fila.numero_cuota] ?? { capital: 0, interes: 0 };
    const pendienteCapital = +(fila.capital - pagado.capital).toFixed(2);
    const pendienteInteres = +(fila.interes - pagado.interes).toFixed(2);

    // Si esta cuota todavía debe algo, es la que toca pagar
    if (pendienteCapital > 0.001 || pendienteInteres > 0.001) {
      numeroCuota  = fila.numero_cuota;
      cuotaActual  = fila;
      faltaCapital = pendienteCapital > 0 ? pendienteCapital : 0;
      faltaInteres = pendienteInteres > 0 ? pendienteInteres : 0;
      break;
    }
  }

  if (!numeroCuota) {
    return res.status(400).json({ error: 'Todas las cuotas ya están pagadas' });
  }

  // 6. Determina cuánto se paga según el tipo — solo lo que falta
  let montoCapital = 0;
  let montoInteres = 0;

  if (tipo_pago === 'solo_capital') {
    if (faltaCapital <= 0) {
      return res.status(400).json({ error: `El capital de la cuota ${numeroCuota} ya está pagado` });
    }
    montoCapital = faltaCapital;

  } else if (tipo_pago === 'solo_interes') {
    if (faltaInteres <= 0) {
      return res.status(400).json({ error: `El interés de la cuota ${numeroCuota} ya está pagado` });
    }
    montoInteres = faltaInteres;

  } else {
    // completo: paga lo que falte de ambos
    montoCapital = faltaCapital;
    montoInteres = faltaInteres;
  }

  const montoPagado = +(montoCapital + montoInteres).toFixed(2);

  if (montoPagado <= 0) {
    return res.status(400).json({ error: 'No hay nada pendiente por pagar en esta cuota' });
  }

  // 7. Saldo del crédito
  const saldoAntes   = parseFloat(credito.saldo_pendiente);
  const saldoDespues = +(saldoAntes - montoPagado).toFixed(2);

  // 8. Registra el pago
  const { data: pago, error } = await supabaseAdmin
    .from('pagos_credito')
    .insert({
      caja_id:        cajaId,
      credito_id:     creditoId,
      numero_cuota:   numeroCuota,
      monto_pagado:   montoPagado,
      monto_capital:  montoCapital,
      monto_interes:  montoInteres,
      saldo_antes:    saldoAntes,
      saldo_despues:  saldoDespues < 0 ? 0 : saldoDespues,
      registrado_por: req.user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // 9. Actualiza el crédito
  const nuevoEstado = saldoDespues <= 0.001 ? 'pagado' : 'activo';
  await supabaseAdmin
    .from('creditos')
    .update({
      saldo_pendiente: saldoDespues < 0 ? 0 : saldoDespues,
      estado:          nuevoEstado,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', creditoId);

  return res.status(201).json({
    message: 'Pago registrado correctamente',
    pago,
    desglose: {
      cuota:   numeroCuota,
      capital: montoCapital,
      interes: montoInteres,
      total:   montoPagado,
    },
    saldo_pendiente: saldoDespues < 0 ? 0 : saldoDespues,
    credito_pagado:  nuevoEstado === 'pagado',
  });
});

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/creditos/:creditoId/pagos/proxima-cuota
// Devuelve exactamente cuánto falta pagar de la cuota actual
// ─────────────────────────────────────────────
router.get('/proxima-cuota', async (req, res) => {
  const { cajaId, creditoId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'socio');
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' });

  const { data: credito } = await supabaseAdmin
    .from('creditos').select('*')
    .eq('id', creditoId).eq('caja_id', cajaId).single();

  if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });
  if (credito.estado === 'pagado') {
    return res.json({ pendiente: false, mensaje: 'Crédito pagado por completo' });
  }

  const { data: pagos } = await supabaseAdmin
    .from('pagos_credito').select('*').eq('credito_id', creditoId);

  const { cuotaCorriente, vencidas, prepagable } = analizarEstadoCredito(credito, pagos);

  if (!cuotaCorriente) {
    return res.json({ pendiente: false, mensaje: 'No hay cuotas pendientes' });
  }

  return res.json({
    pendiente:     true,
    numero_cuota:  cuotaCorriente.numero_cuota,
    total_cuotas:  credito.plazo_meses,
    es_ultima:     cuotaCorriente.numero_cuota === credito.plazo_meses,
    fecha_vencimiento: cuotaCorriente.fecha_vencimiento,
    vencida:       cuotaCorriente.vencida,
    falta_capital: cuotaCorriente.falta_capital,
    falta_interes: cuotaCorriente.falta_interes,
    falta_total:   +(cuotaCorriente.falta_capital + cuotaCorriente.falta_interes).toFixed(2),

    // Cuotas atrasadas
    cuotas_vencidas: vencidas.map(v => ({
      numero_cuota: v.numero_cuota,
      fecha_vencimiento: v.fecha_vencimiento,
      falta_total: +(v.falta_capital + v.falta_interes).toFixed(2),
    })),

    // Prepago disponible (última cuota sin tocar)
    prepago_disponible: prepagable ? {
      numero_cuota:      prepagable.numero_cuota,
      capital:           prepagable.capital,
      interes_a_condonar: prepagable.interes,
    } : null,
  });
});

// POST /api/cajas/:cajaId/creditos/:creditoId/pagos/prepago
// Prepaga el capital de la última cuota disponible — sin interés
router.post('/prepago', async (req, res) => {
  const { cajaId, creditoId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  const { data: credito } = await supabaseAdmin
    .from('creditos').select('*')
    .eq('id', creditoId).eq('caja_id', cajaId).single();

  if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });
  if (credito.estado !== 'activo') {
    return res.status(400).json({ error: 'Solo se puede prepagar un crédito activo' });
  }

  const { data: pagos } = await supabaseAdmin
    .from('pagos_credito').select('*').eq('credito_id', creditoId);

  const { prepagable, cuotaCorriente } = analizarEstadoCredito(credito, pagos);

  if (!prepagable) {
    return res.status(400).json({
      error: 'No hay cuotas disponibles para prepagar. Solo se prepagan cuotas futuras, no la corriente.'
    });
  }

  const montoCapital = prepagable.capital;
  const interesCondonado = prepagable.interes;

  const saldoAntes   = parseFloat(credito.saldo_pendiente);
  // El saldo baja el capital Y el interés condonado (ya no se cobrará)
  const saldoDespues = +(saldoAntes - montoCapital - interesCondonado).toFixed(2);

  const { data: pago, error } = await supabaseAdmin
    .from('pagos_credito')
    .insert({
      caja_id:        cajaId,
      credito_id:     creditoId,
      numero_cuota:   prepagable.numero_cuota,
      monto_pagado:   montoCapital,
      monto_capital:  montoCapital,
      monto_interes:  0,               // ← prepago no paga interés
      es_prepago:     true,
      saldo_antes:    saldoAntes,
      saldo_despues:  saldoDespues < 0 ? 0 : saldoDespues,
      registrado_por: req.user.id,
    })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });

  const nuevoEstado = saldoDespues <= 0.001 ? 'pagado' : 'activo';
  await supabaseAdmin
    .from('creditos')
    .update({
      saldo_pendiente:   saldoDespues < 0 ? 0 : saldoDespues,
      estado:            nuevoEstado,
      interes_condonado: +(parseFloat(credito.interes_condonado ?? 0) + interesCondonado).toFixed(2),
      updated_at:        new Date().toISOString(),
    })
    .eq('id', creditoId);

  return res.status(201).json({
    message: `Prepago de la cuota ${prepagable.numero_cuota} registrado`,
    pago,
    cuota_prepagada:   prepagable.numero_cuota,
    capital_pagado:    montoCapital,
    interes_condonado: interesCondonado,
    saldo_pendiente:   saldoDespues < 0 ? 0 : saldoDespues,
    credito_pagado:    nuevoEstado === 'pagado',
  });
});

// ─────────────────────────────────────────────
// POST /api/cajas/:cajaId/creditos/:creditoId/pagos/abono
// Abono parcial de monto libre — se aplica primero a capital
// ─────────────────────────────────────────────
router.post('/abono', async (req, res) => {
  const { cajaId, creditoId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  const { monto, motivo } = req.body;

  const montoNum = parseFloat(monto);
  if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }
  if (!motivo || !motivo.trim()) {
    return res.status(400).json({ error: 'El motivo del abono es requerido' });
  }

  // 1. Lee el crédito
  const { data: credito } = await supabaseAdmin
    .from('creditos').select('*')
    .eq('id', creditoId).eq('caja_id', cajaId).single();

  if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' });
  if (credito.estado !== 'activo') {
    return res.status(400).json({ error: 'Solo se puede abonar a un crédito activo' });
  }

  // 2. Analiza el estado real
  const { data: pagosPrevios } = await supabaseAdmin
    .from('pagos_credito').select('*').eq('credito_id', creditoId);

  const { cuotaCorriente } = analizarEstadoCredito(credito, pagosPrevios);

  if (!cuotaCorriente) {
    return res.status(400).json({ error: 'No hay cuotas pendientes' });
  }

  // 3. Aplica el abono: PRIMERO a capital, el sobrante a interés
  const faltaCapital = cuotaCorriente.falta_capital;
  const faltaInteres = cuotaCorriente.falta_interes;
  const totalPendienteCuota = +(faltaCapital + faltaInteres).toFixed(2);

  // No permite abonar más de lo que falta en esta cuota
  if (montoNum > totalPendienteCuota + 0.001) {
    return res.status(400).json({
      error: `El abono excede lo pendiente de la cuota ${cuotaCorriente.numero_cuota} ($${totalPendienteCuota.toFixed(2)}). Usa el pago completo de cuota.`
    });
  }

  let montoCapital = 0;
  let montoInteres = 0;

  if (montoNum <= faltaCapital) {
    // Todo va a capital
    montoCapital = +montoNum.toFixed(2);
  } else {
    // Cubre el capital y el resto va a interés
    montoCapital = faltaCapital;
    montoInteres = +(montoNum - faltaCapital).toFixed(2);
  }

  const montoPagado = +(montoCapital + montoInteres).toFixed(2);

  // 4. Saldo
  const saldoAntes   = parseFloat(credito.saldo_pendiente);
  const saldoDespues = +(saldoAntes - montoPagado).toFixed(2);

  // 5. Registra el abono
  const { data: pago, error } = await supabaseAdmin
    .from('pagos_credito')
    .insert({
      caja_id:        cajaId,
      credito_id:     creditoId,
      numero_cuota:   cuotaCorriente.numero_cuota,
      monto_pagado:   montoPagado,
      monto_capital:  montoCapital,
      monto_interes:  montoInteres,
      es_abono:       true,
      motivo:         motivo.trim(),
      saldo_antes:    saldoAntes,
      saldo_despues:  saldoDespues < 0 ? 0 : saldoDespues,
      registrado_por: req.user.id,
    })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });

  // 6. Actualiza el crédito
  const nuevoEstado = saldoDespues <= 0.001 ? 'pagado' : 'activo';
  await supabaseAdmin
    .from('creditos')
    .update({
      saldo_pendiente: saldoDespues < 0 ? 0 : saldoDespues,
      estado:          nuevoEstado,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', creditoId);

  // Cuánto queda pendiente de esa cuota tras el abono
  const restaCapital = +(faltaCapital - montoCapital).toFixed(2);
  const restaInteres = +(faltaInteres - montoInteres).toFixed(2);

  return res.status(201).json({
    message: 'Abono registrado correctamente',
    pago,
    aplicado: {
      cuota:   cuotaCorriente.numero_cuota,
      capital: montoCapital,
      interes: montoInteres,
      total:   montoPagado,
    },
    resta_en_cuota: {
      capital: restaCapital > 0 ? restaCapital : 0,
      interes: restaInteres > 0 ? restaInteres : 0,
      total:   +((restaCapital > 0 ? restaCapital : 0) + (restaInteres > 0 ? restaInteres : 0)).toFixed(2),
    },
    saldo_pendiente: saldoDespues < 0 ? 0 : saldoDespues,
    credito_pagado:  nuevoEstado === 'pagado',
  });
});

module.exports = router;