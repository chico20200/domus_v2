// backend/config/supabase.js

const { createClient } = require('@supabase/supabase-js');

console.log(
  'SERVICE KEY:',
  process.env.SUPABASE_SERVICE_KEY?.slice(0, 30)
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


module.exports = supabase;