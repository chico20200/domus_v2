// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const verifyToken = require('../middlewares/auth.middleware');



// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,password });

  if (error) {
  console.log("SUPABASE ERROR FULL:", error);
  return res.status(400).json({ error: error.message, full: error });
}

  return res.status(201).json({
    message: 'Usuario creado exitosamente',
    user: { id: data.user.id, email: data.user.email },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  return res.json({
    message: 'Login exitoso',
    token: data.session.access_token, // JWT generado por Supabase
    user: { id: data.user.id, email: data.user.email },
  });
});

// POST /api/auth/resend-confirmation
// Reenvía el correo de confirmación si el usuario no lo recibió
router.post('/resend-confirmation', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Correo de confirmación reenviado' });
});


// POST /api/auth/forgot-password
// Envía el correo de recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    // ↑ Supabase redirige aquí después de que el usuario haga clic en el correo.
    // Tu frontend en esa ruta debe leer el token de la URL y llamar al siguiente endpoint.
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Correo de recuperación enviado' });
});


// POST /api/auth/update-password  ← requiere estar autenticado
// El usuario manda su nueva contraseña (ya tiene sesión activa o token de recovery)
router.post('/update-password', verifyToken, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const { createClient } = require('@supabase/supabase-js');
  const userSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Extraer el token del header
  const token = req.headers['authorization'].split(' ')[1];

  // Primero establecer la sesión manualmente
  const { error: sessionError } = await userSupabase.auth.setSession({
    access_token: token,
    refresh_token: token  
  });

  if (sessionError) {
    return res.status(401).json({ error: sessionError.message });
  }

  // Ahora sí actualizar la contraseña
  const { error } = await userSupabase.auth.updateUser({ password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Contraseña actualizada correctamente' });
});

// POST /api/auth/test-email
// Solo para verificar que el SMTP está funcionando
router.post('/test-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  if (error) {
    return res.status(500).json({ 
      error: 'Falló el envío',
      detalle: error.message  // así ves exactamente qué falló
    });
  }

  return res.json({ 
    message: '✅ Correo enviado correctamente, revisa tu Gmail' 
  });
});

module.exports = router;
// crear productos 