// backend/routes/cajas.routes.js
const express    = require('express');
const router     = express.Router();
const supabase   = require('../config/supabaseAdmin');
const supabaseAdmin = require('../config/supabaseAdmin');  
const verifyToken = require('../middlewares/auth.middleware');

router.use(verifyToken);

// ─────────────────────────────────────────────
// GET /api/cajas/mis-cajas
// Devuelve todas las cajas del usuario autenticado con su rol
// ─────────────────────────────────────────────
router.get('/mis-cajas', async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from('miembros_caja')
    .select(`
      rol,
      cajas (
        id,
        nombre,
        descripcion,
        activa
      )
    `)
    .eq('user_id', userId)
    .eq('activo', true);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Transforma el resultado para aplanar la estructura
  const cajas = data
    .filter(m => m.cajas && m.cajas.activa)
    .map(m => ({
      id:          m.cajas.id,
      nombre:      m.cajas.nombre,
      descripcion: m.cajas.descripcion ?? '',
      rol:         m.rol,
    }));

  return res.json({ cajas });
});

// ─────────────────────────────────────────────
// POST /api/cajas
// Crea una nueva caja y registra al creador como admin
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { nombre, descripcion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la caja es requerido' });
  }

  // 1. Crea la caja
  const { data: caja, error: errorCaja } = await supabaseAdmin
    .from('cajas')
    .insert({
      nombre:      nombre.trim(),
      descripcion: descripcion?.trim() ?? '',
      creado_por:  userId,
    })
    .select()
    .single();

  if (errorCaja) {
    return res.status(500).json({ error: errorCaja.message });
  }

  // 2. Registra al creador como admin
  const { error: errorMiembro } = await supabase
    .from('miembros_caja')
    .insert({
      caja_id: caja.id,
      user_id: userId,
      rol:     'admin',
    });

  if (errorMiembro) {
    // Si falla el miembro, elimina la caja para no dejar datos huérfanos
    await supabase.from('cajas').delete().eq('id', caja.id);
    return res.status(500).json({ error: errorMiembro.message });
  }

  return res.status(201).json({
    message: 'Caja creada correctamente',
    caja,
  });
});

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId
// Detalle de una caja — solo miembros
// ─────────────────────────────────────────────
// backend/routes/cajas.routes.js — en GET /:cajaId/resumen
router.get('/:cajaId/resumen', async (req, res) => {
  const userId  = req.user.id;
  const { cajaId } = req.params;

  try {
    // Verifica membresía
    const { data: miembro, error: errorMiembro } = await supabaseAdmin
      .from('miembros_caja')
      .select('rol')
      .eq('caja_id', cajaId)
      .eq('user_id', userId)
      .eq('activo', true)
      .single();

    console.log('miembro:', miembro, 'error:', errorMiembro?.message);

    if (!miembro) {
      return res.status(403).json({ error: 'No perteneces a esta caja' });
    }

    const { data: caja, error: errorCaja } = await supabaseAdmin
      .from('cajas')
      .select('id, nombre, descripcion, created_at')
      .eq('id', cajaId)
      .single();

    console.log('caja:', caja?.nombre, 'error:', errorCaja?.message);

    const { count: totalMiembros, error: errorMiembros } = await supabaseAdmin
      .from('miembros_caja')
      .select('*', { count: 'exact', head: true })
      .eq('caja_id', cajaId)
      .eq('activo', true);

    console.log('totalMiembros:', totalMiembros, 'error:', errorMiembros?.message);

    const { count: totalSocios, error: errorSocios } = await supabaseAdmin
      .from('socios')
      .select('*', { count: 'exact', head: true })
      .eq('caja_id', cajaId)
      .eq('activo', true);

    console.log('totalSocios:', totalSocios, 'error:', errorSocios?.message);

    const { data: cuentas, error: errorCuentas } = await supabaseAdmin
      .from('cuentas_ahorro')
      .select('saldo')
      .eq('caja_id', cajaId)
      .eq('estado', 'activa');

    console.log('cuentas:', cuentas?.length, 'error:', errorCuentas?.message);

    const { data: creditos, error: errorCreditos } = await supabaseAdmin
      .from('creditos')
      .select('saldo_pendiente')
      .eq('caja_id', cajaId)
      .eq('estado', 'activo');

    console.log('creditos:', creditos?.length, 'error:', errorCreditos?.message);

    const { data: transacciones, error: errorTx } = await supabaseAdmin
      .from('transacciones')
      .select(`
        id,
        tipo,
        monto,
        descripcion,
        created_at,
        cuentas_ahorro (
          socios ( nombre, apellido )
        )
      `)
      .eq('caja_id', cajaId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('transacciones:', transacciones?.length, 'error:', errorTx?.message);

    const saldoTotal     = (cuentas  ?? []).reduce((sum, c) => sum + parseFloat(c.saldo          ?? 0), 0);
    const saldoPendiente = (creditos ?? []).reduce((sum, c) => sum + parseFloat(c.saldo_pendiente ?? 0), 0);

    return res.json({
      caja,
      rol: miembro.rol,
      resumen: {
        totalMiembros:   totalMiembros  ?? 0,
        totalSocios:     totalSocios    ?? 0,
        saldoTotal,
        creditosActivos: creditos?.length ?? 0,
        saldoPendiente,
      },
      transaccionesRecientes: transacciones ?? [],
    });

  } catch (err) {
    console.error('Error en resumen:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/cajas/:cajaId
// Edita nombre/descripción — solo admin
// ─────────────────────────────────────────────
router.put('/:cajaId', async (req, res) => {
  const userId = req.user.id;
  const { cajaId } = req.params;
  const { nombre, descripcion } = req.body;

  // Verifica que sea admin
  const { data: miembro } = await supabase
    .from('miembros_caja')
    .select('rol')
    .eq('caja_id', cajaId)
    .eq('user_id', userId)
    .eq('activo', true)
    .single();

  if (!miembro || miembro.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el admin puede editar la caja' });
  }

  const updates = {};
  if (nombre)      updates.nombre      = nombre.trim();
  if (descripcion !== undefined) updates.descripcion = descripcion.trim();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  const { data, error } = await supabase
    .from('cajas')
    .update(updates)
    .eq('id', cajaId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ message: 'Caja actualizada correctamente', caja: data });
});

// backend/routes/cajas.routes.js — agrega al final antes de module.exports

// GET /api/cajas/:cajaId/resumen
router.get('/:cajaId/resumen', async (req, res) => {
  const userId  = req.user.id;
  const { cajaId } = req.params;

  // Verifica membresía
  const { data: miembro } = await supabaseAdmin
    .from('miembros_caja')
    .select('rol')
    .eq('caja_id', cajaId)
    .eq('user_id', userId)
    .eq('activo', true)
    .single();

  if (!miembro) {
    return res.status(403).json({ error: 'No perteneces a esta caja' });
  }

  // Datos de la caja
  const { data: caja } = await supabaseAdmin
    .from('cajas')
    .select('id, nombre, descripcion, created_at')
    .eq('id', cajaId)
    .single();

  // Total de miembros activos
  const { count: totalMiembros } = await supabaseAdmin
    .from('miembros_caja')
    .select('*', { count: 'exact', head: true })
    .eq('caja_id', cajaId)
    .eq('activo', true);

  // Total de socios activos
  const { count: totalSocios } = await supabaseAdmin
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('caja_id', cajaId)
    .eq('activo', true);

  // Saldo total en cuentas de ahorro
  const { data: cuentas } = await supabaseAdmin
    .from('cuentas_ahorro')
    .select('saldo')
    .eq('caja_id', cajaId)
    .eq('estado', 'activa');

  const saldoTotal = (cuentas ?? [])
    .reduce((sum, c) => sum + parseFloat(c.saldo ?? 0), 0);

  // Créditos activos y saldo pendiente
  const { data: creditos } = await supabaseAdmin
    .from('creditos')
    .select('saldo_pendiente')
    .eq('caja_id', cajaId)
    .eq('estado', 'activo');

  const saldoPendiente = (creditos ?? [])
    .reduce((sum, c) => sum + parseFloat(c.saldo_pendiente ?? 0), 0);

  // Transacciones recientes
  const { data: transacciones } = await supabaseAdmin
    .from('transacciones')
    .select(`
      id,
      tipo,
      monto,
      descripcion,
      created_at,
      cuentas_ahorro (
        socios ( nombre, apellido )
      )
    `)
    .eq('caja_id', cajaId)
    .order('created_at', { ascending: false })
    .limit(5);

  return res.json({
    caja,
    rol: miembro.rol,
    resumen: {
      totalMiembros:   totalMiembros  ?? 0,
      totalSocios:     totalSocios    ?? 0,
      saldoTotal:      saldoTotal,
      creditosActivos: creditos?.length ?? 0,
      saldoPendiente:  saldoPendiente,
    },
    transaccionesRecientes: transacciones ?? [],
  });
});

module.exports = router;