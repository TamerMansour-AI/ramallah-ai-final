import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// On auth state change, store or clear user info in localStorage
supabase.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) {
    localStorage.setItem('ai_user', JSON.stringify(session.user));
  } else {
    localStorage.removeItem('ai_user');
  }
});

// Get current user session
async function getUser() {
  return await supabase.auth.getUser();
}

// Sign-in: if email provided, use magic link, otherwise use Google OAuth
async function signIn(email) {
  if (email) {
    return await supabase.auth.signInWithOtp({ email });
  } else {
    const redirectTo = window.location.origin + '/profile.html';
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
  }
}

// Sign-out
async function signOut() {
  return await supabase.auth.signOut();
}

export { supabase, getUser, signIn, signOut };
