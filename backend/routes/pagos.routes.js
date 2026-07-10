// backend/routes/pagos.routes.js
const express       = require('express');
const router        = express.Router({ mergeParams: true });
const supabaseAdmin = require('../config/supabaseAdmin');
const verifyToken   = require('../middlewares/auth.middleware');

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

  // El tesorero puede pagar la cuota completa, o solo capital, o solo interés
  const { tipo_pago } = req.body;  // "completo" | "solo_capital" | "solo_interes"

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

  // 2. Calcula capital e interés por cuota
  const capitalPrestado = parseFloat(credito.monto_solicitado);
  const montoTotal      = parseFloat(credito.monto_total);
  const plazo           = credito.plazo_meses;

  const interesTotal    = montoTotal - capitalPrestado;
  const capitalPorCuota = +(capitalPrestado / plazo).toFixed(2);
  const interesPorCuota = +(interesTotal / plazo).toFixed(2);

  // 3. Determina cuánto se paga según el tipo
  let montoCapital = 0;
  let montoInteres = 0;

  if (tipo_pago === 'solo_capital') {
    montoCapital = capitalPorCuota;
  } else if (tipo_pago === 'solo_interes') {
    montoInteres = interesPorCuota;
  } else {
    // completo (por defecto)
    montoCapital = capitalPorCuota;
    montoInteres = interesPorCuota;
  }

  const montoPagado = +(montoCapital + montoInteres).toFixed(2);

  // 4. Calcula el número de cuota siguiente
  const { count } = await supabaseAdmin
    .from('pagos_credito')
    .select('*', { count: 'exact', head: true })
    .eq('credito_id', creditoId);

  const numeroCuota = (count ?? 0) + 1;

  // 5. Calcula el nuevo saldo pendiente
  const saldoAntes   = parseFloat(credito.saldo_pendiente);
  const saldoDespues = +(saldoAntes - montoPagado).toFixed(2);

  // 6. Registra el pago
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

  // 7. Actualiza el crédito
  const nuevoEstado = saldoDespues <= 0 ? 'pagado' : 'activo';
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
      capital: montoCapital,
      interes: montoInteres,
      total:   montoPagado,
    },
    saldo_pendiente: saldoDespues < 0 ? 0 : saldoDespues,
    credito_pagado:  nuevoEstado === 'pagado',
  });
});

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/interes-mensual
// Suma de intereses recaudados en un mes específico
// ─────────────────────────────────────────────
// router.get('/interes-mensual', async (req, res) => {
//   const { cajaId } = req.params;
//   const { anio, mes } = req.query;  // ?anio=2026&mes=7

//   const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
//   if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

//   if (!anio || !mes) {
//     return res.status(400).json({ error: 'Se requiere año y mes' });
//   }

//   // Rango del mes
//   const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
//   const finMes = new Date(parseInt(anio), parseInt(mes), 0).getDate();
//   const fin    = `${anio}-${String(mes).padStart(2, '0')}-${finMes}`;

//   const { data, error } = await supabaseAdmin
//     .from('pagos_credito')
//     .select('monto_capital, monto_interes, monto_pagado')
//     .eq('caja_id', cajaId)
//     .gte('fecha_pago', inicio)
//     .lte('fecha_pago', fin);

//   if (error) return res.status(500).json({ error: error.message });

//   const totalInteres = (data ?? []).reduce((s, p) => s + parseFloat(p.monto_interes), 0);
//   const totalCapital = (data ?? []).reduce((s, p) => s + parseFloat(p.monto_capital), 0);

//   return res.json({
//     periodo:        `${anio}-${String(mes).padStart(2, '0')}`,
//     total_interes:  +totalInteres.toFixed(2),
//     total_capital:  +totalCapital.toFixed(2),
//     cantidad_pagos: data?.length ?? 0,
//   });
// });

module.exports = router;