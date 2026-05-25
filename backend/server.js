const express = require('express');
const cors = require('cors');
require('dotenv').config();


// Agrega estas líneas justo después
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SERVICE_KEY existe:', !!process.env.SUPABASE_SERVICE_KEY);

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend inventario funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
