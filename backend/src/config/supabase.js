import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Este cliente usa la SERVICE ROLE KEY: solo se usa en el backend,
// nunca debe exponerse al navegador.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
