import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Cliente solo para Realtime (mensajes). Las escrituras sensibles van por tu API.
 * Si faltan variables, devuelve null y el chat sigue funcionando con polling.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
