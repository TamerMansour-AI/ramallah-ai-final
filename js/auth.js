import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
export { supabase };

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
