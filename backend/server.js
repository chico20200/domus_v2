// backend/server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SERVICE_KEY existe:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('ANON_KEY existe:', !!process.env.SUPABASE_ANON_KEY);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL); // ← agrega esto para verificar

const authRoutes    = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const sociosRoutes = require('./routes/socios.routes');
const cajasRoutes = require('./routes/cajas.routes');
const ahorrosRoutes = require('./routes/ahorros.routes');
const miembrosRoutes = require('./routes/miembros.routes');
const creditosRoutes = require('./routes/creditos.routes');
const pagosRoutes = require('./routes/pagos.routes');
const app = express();

// ── Middlewares ──────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());

// ── Rutas ────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/cajas', cajasRoutes);
app.use('/api/cajas/:cajaId/socios', sociosRoutes);
app.use('/api/cajas/:cajaId/cuentas', ahorrosRoutes);
app.use('/api/cajas/:cajaId/miembros', miembrosRoutes);
app.use('/api/cajas/:cajaId/creditos', creditosRoutes);
app.use('/api/cajas/:cajaId/pagos', pagosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

