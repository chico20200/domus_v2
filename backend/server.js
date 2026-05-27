const express = require('express');
const cors = require('cors');
require('dotenv').config();

//revisar si esta leyendo las claves del .env 
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SERVICE_KEY existe:', !!process.env.SUPABASE_SERVICE_KEY);

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

/*
app.get('/', (req, res) => {
  res.json({ message: 'Backend inventario funcionando' });
});

*/


const profileRoutes = require('./routes/profile.routes');
app.use('/api/profiles', profileRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
