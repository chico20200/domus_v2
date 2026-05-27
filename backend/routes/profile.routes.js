const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const verifyToken = require('../middlewares/auth.middleware');

router.use(verifyToken);

// GET /api/profiles/me
// Devuelve el perfil del usuario autenticado

router.get('/me', async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  return res.json({ profile: data });
});

// PUT /api/profiles/me
// El usuario actualiza su propio perfil


router.put('/me', async (req, res) => {
  const userId = req.user.id;
  const { nombre, telefono, foto_url } = req.body;

  const updates = {};
  if (nombre !== undefined)    updates.nombre    = nombre;
  if (telefono !== undefined)  updates.telefono  = telefono;
  if (foto_url !== undefined)  updates.foto_url  = foto_url;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Error al actualizar el perfil', detalle: error.message });
  }

  return res.json({ message: 'Perfil actualizado correctamente', profile: data });
});

module.exports = router;
