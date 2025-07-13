import {getUser,signIn,signOut} from './auth.js';
const btn=document.getElementById('login-btn'),prof=document.getElementById('profile-link'),
      burger=document.getElementById('nav-hamburger'),links=document.getElementById('navbar-links');
async function ui(){
  const {data}=await getUser(); if(data.user){btn.textContent='Logout';prof.hidden=false;}
  else {btn.textContent='Login';prof.hidden=true;}
}
btn?.addEventListener('click',async()=>{
  const {data}=await getUser(); data.user?await signOut():await signIn(); ui();
});
burger?.addEventListener('click',()=>{links.classList.toggle('open');burger.classList.toggle('open');});
document.addEventListener('DOMContentLoaded',ui);
