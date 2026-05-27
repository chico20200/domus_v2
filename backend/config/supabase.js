
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
/*
// Verificar conexión
const testConnection = async () => {
  try {

    const { error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    // Supabase responde aunque la tabla no exista
    if (error && error.code !== 'PGRST116') {
      console.log('❌ Error conectando a Supabase:', error.message);
    } else {
      console.log('✅ Supabase conectado correctamente');
    }

  } catch (err) {
    console.log('❌ Error de conexión:', err.message);
  }
};

testConnection();*/

module.exports = supabase;