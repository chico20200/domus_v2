// backend/routes/miembros.routes.js
const express       = require('express');
const router        = express.Router({ mergeParams: true });
const supabaseAdmin = require('../config/supabaseAdmin');
const verifyToken   = require('../middlewares/auth.middleware');

router.use(verifyToken);

// ── Helper de rol ─────────────────────────────────────────────
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

// ── Helper: genera código legible ────────────────────────────
function generarCodigo() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo   = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/miembros
// Lista miembros de la caja
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { cajaId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'socio');
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' });

  // 1. Trae los miembros con su user_id
  const { data: miembros, error } = await supabaseAdmin
    .from('miembros_caja')
    .select('id, user_id, rol, activo, created_at')
    .eq('caja_id', cajaId)
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al leer miembros:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!miembros || miembros.length === 0) {
    return res.json({ miembros: [] });
  }

  // 2. Trae los perfiles de esos usuarios
  const userIds = miembros.map(m => m.user_id);

  const { data: perfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, telefono, foto_url')
    .in('id', userIds);

  const perfilPorId = {};
  (perfiles ?? []).forEach(p => { perfilPorId[p.id] = p; });

  // 3. Trae los emails desde auth.users
  const emailPorId = {};
  await Promise.all(
    userIds.map(async uid => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        emailPorId[uid] = data?.user?.email ?? '';
      } catch {
        emailPorId[uid] = '';
      }
    })
  );

  // 4. Arma la respuesta
  const resultado = miembros.map(m => ({
    id:       m.user_id,        // ← el frontend usa este id para cambiar rol / remover
    rol:      m.rol,
    activo:   m.activo,
    email:    emailPorId[m.user_id] ?? '',
    profiles: perfilPorId[m.user_id]
      ? { nombre: perfilPorId[m.user_id].nombre }
      : null,
  }));

  return res.json({ miembros: resultado });
});
// ─────────────────────────────────────────────
// PUT /api/cajas/:cajaId/miembros/:userId
// Cambia el rol de un miembro — solo admin
// ─────────────────────────────────────────────
router.put('/:userId', async (req, res) => {
  const { cajaId, userId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'admin');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol admin' });

  const { nuevoRol } = req.body;
  const rolesValidos = ['admin', 'tesorero', 'socio'];
  if (!rolesValidos.includes(nuevoRol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  // No puede cambiar su propio rol
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  }

  const { data, error } = await supabaseAdmin
    .from('miembros_caja')
    .update({ rol: nuevoRol })
    .eq('caja_id', cajaId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ message: 'Rol actualizado correctamente', miembro: data });
});

// ─────────────────────────────────────────────
// DELETE /api/cajas/:cajaId/miembros/:userId
// Remueve un miembro — solo admin
// ─────────────────────────────────────────────
router.delete('/:userId', async (req, res) => {
  const { cajaId, userId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'admin');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol admin' });

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'No puedes removerte a ti mismo' });
  }

  const { error } = await supabaseAdmin
    .from('miembros_caja')
    .update({ activo: false })
    .eq('caja_id', cajaId)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ message: 'Miembro removido correctamente' });
});

// ─────────────────────────────────────────────
// POST /api/cajas/:cajaId/invitaciones
// Genera un código de invitación — solo admin
// ─────────────────────────────────────────────
router.post('/invitaciones', async (req, res) => {
  const { cajaId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'admin');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol admin' });

  const { rolInvitado = 'socio' } = req.body;

  // Desactiva códigos anteriores no usados de esta caja
  await supabaseAdmin
    .from('invitaciones_caja')
    .update({ activo: false })
    .eq('caja_id', cajaId)
    .eq('activo', true)
    .is('usado_por', null);

  const codigo   = generarCodigo();
  const expiraAt = new Date();
  expiraAt.setDate(expiraAt.getDate() + 7); // expira en 7 días

  const { data, error } = await supabaseAdmin
    .from('invitaciones_caja')
    .insert({
      caja_id:    cajaId,
      codigo,
      rol:        rolInvitado,
      creado_por: req.user.id,
      expira_at:  expiraAt.toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({
    message: 'Código generado correctamente',
    codigo:  data.codigo,
    expira:  data.expira_at,
    rol:     data.rol,
  });
});

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/invitaciones
// Ver código activo de la caja — solo admin
// ─────────────────────────────────────────────
router.get('/invitaciones', async (req, res) => {
  const { cajaId } = req.params;
  const rol = await verificarRol(req.user.id, cajaId, 'admin');
  if (!rol) return res.status(403).json({ error: 'Se requiere rol admin' });

  const { data } = await supabaseAdmin
    .from('invitaciones_caja')
    .select('*')
    .eq('caja_id', cajaId)
    .eq('activo', true)
    .is('usado_por', null)
    .gt('expira_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return res.json({ invitacion: data ?? null });
});

module.exports = router;