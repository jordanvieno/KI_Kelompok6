const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Client (Server-side)
 * 
 * Menggunakan Service Role Key agar memiliki akses penuh ke Storage.
 * JANGAN pernah expose SUPABASE_SERVICE_KEY ke frontend.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY is not set. File uploads will not work.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
