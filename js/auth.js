import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// خزّن المستخدم أو أزِلْه عند تغيّر الجلسة
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    localStorage.setItem('ai_user', JSON.stringify(session.user));
  } else {
    localStorage.removeItem('ai_user');
  }
});

// جلب بيانات المستخدم الحالي
export const getUser = () => supabase.auth.getUser();

// تسجيل الدخول عبر Google
export const signIn = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/profile.html' }
  });

// تسجيل الخروج
export const signOut = () => supabase.auth.signOut();
