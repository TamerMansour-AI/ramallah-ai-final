 import { supabase, signIn, signOut, getUser } from './auth.js';
 const loginBtn = document.getElementById('login-btn');
 const profileLink = document.getElementById('profile-link');
+const hamburger = document.getElementById('nav-hamburger');
+const navLinks = document.getElementById('navbar-links');
 
 updateUI();
 async function updateUI(){
   const { data } = await getUser();
   if(data.user){
     loginBtn.textContent = 'Logout';
     profileLink.hidden = false;
   }else{
     loginBtn.textContent = 'Login';
     profileLink.hidden = true;
   }
 }
 
 loginBtn?.addEventListener('click', async () => {
   const { data } = await getUser();
   if(data.user){
     await signOut();
     updateUI();
   }else{
-    const email = prompt('Enter your e-mail to receive a login link:');
-    if(email) await signIn(email);
-    alert('Check your inbox for the magic link!');
+    // Trigger Google OAuth login
+    await signIn();
   }
 });
+
+// Mobile menu toggle for small screens
+hamburger?.addEventListener('click', () => {
+  navLinks.classList.toggle('open');
+  hamburger.classList.toggle('open');
+});
