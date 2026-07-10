// backend/routes/reportes.routes.js
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

// GET /api/cajas/:cajaId/reportes/interes-mensual?anio=2026&mes=7
router.get('/interes-mensual', async (req, res) => {
  const { cajaId } = req.params;
  const { anio, mes } = req.query;

  const rol = await verificarRol(req.user.id, cajaId, 'tesorero');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' });

  if (!anio || !mes) {
    return res.status(400).json({ error: 'Se requiere año y mes' });
  }

  const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const finMes = new Date(parseInt(anio), parseInt(mes), 0).getDate();
  const fin    = `${anio}-${String(mes).padStart(2, '0')}-${finMes}`;

  const { data, error } = await supabaseAdmin
    .from('pagos_credito')
    .select('monto_capital, monto_interes, monto_pagado')
    .eq('caja_id', cajaId)
    .gte('fecha_pago', inicio)
    .lte('fecha_pago', fin);

  if (error) return res.status(500).json({ error: error.message });

  const totalInteres = (data ?? []).reduce((s, p) => s + parseFloat(p.monto_interes), 0);
  const totalCapital = (data ?? []).reduce((s, p) => s + parseFloat(p.monto_capital), 0);

  return res.json({
    periodo:        `${anio}-${String(mes).padStart(2, '0')}`,
    total_interes:  +totalInteres.toFixed(2),
    total_capital:  +totalCapital.toFixed(2),
    cantidad_pagos: data?.length ?? 0,
  });
});

module.exports = router;