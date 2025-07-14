import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// cache session ↔️ localStorage
supabase.auth.onAuthStateChange((_evt, sess) => {
  if (sess?.user) {
    localStorage.setItem('ai_user', JSON.stringify(sess.user));
  } else {
    localStorage.removeItem('ai_user');
  }
});

export const getUser  = () => supabase.auth.getUser();
export const signOut  = () => supabase.auth.signOut();

/** Google OAuth → يرجع إلى الصفحة الرئيسية (والمسار مسجَّل في Google) */
export const signIn   = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    /* NB: must be whitelisted فى Google Cloud & Supabase */
    options: { redirectTo: `${window.location.origin}/` }
  });
