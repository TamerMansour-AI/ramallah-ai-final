import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// \u062E\u0632\u0651\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0623\u0632\u0650\u0644\u0652\u0647 \u0639\u0646\u062F \u062A\u063A\u064A\u0651\u0631 \u0627\u0644\u062C\u0644\u0633\u0629
supabase.auth.onAuthStateChange((_e, s) => {
  s ? localStorage.setItem('ai_user', JSON.stringify(s.user))
    : localStorage.removeItem('ai_user');
});

// \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A
export const getUser = () => supabase.auth.getUser();

// \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0639\u0628\u0631 Google
export const signIn = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/profile.html' }
  });

// \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C
export const signOut = () => supabase.auth.signOut();
