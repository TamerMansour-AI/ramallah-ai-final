import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers
export const signIn = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({ email });
  return error;
};
export const signOut = () => supabase.auth.signOut();
export const getUser = () => supabase.auth.getUser();
supabase.auth.onAuthStateChange((_event, session) => {
  document.body.dataset.auth = session ? 'in' : 'out';
});
