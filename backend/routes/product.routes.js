const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const verifyToken = require('../middlewares/auth.middleware');

// Todas las rutas de productos requieren autenticación
router.use(verifyToken);

// GET /api/products - listar todos los productos del usuario
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Error al obtener productos' });
  }

  return res.json({ products: data });
});

// POST /api/products - crear un nuevo producto
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name, description, quantity, price } = req.body;

  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'Nombre, cantidad y precio son requeridos' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, description, quantity, price, user_id: userId }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Error al crear el producto' });
  }

  return res.status(201).json({ message: 'Producto creado', product: data });
});

// DELETE /api/products/:id - eliminar un producto
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Verificar que el producto pertenece al usuario antes de eliminar
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Producto no encontrado o no autorizado' });
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Error al eliminar el producto' });
  }

  return res.json({ message: 'Producto eliminado correctamente' });
});

module.exports = router;
