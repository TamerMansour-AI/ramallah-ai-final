import { getUser, signIn, signOut } from './auth.js';

const btn    = document.getElementById('login-btn');
const prof   = document.getElementById('profile-link');
const burger = document.getElementById('nav-hamburger');
const links  = document.getElementById('navbar-links');

async function updateUI() {
  const { data } = await getUser();
  if (data.user) {
    btn.textContent = 'Logout';
    prof.hidden = false;
  } else {
    btn.textContent = 'Login';
    prof.hidden = true;
  }
}

btn?.addEventListener('click', async () => {
  const { data } = await getUser();
  if (data.user) {
    await signOut();
  } else {
    await signIn();
  }
  updateUI();
});

burger?.addEventListener('click', () => {
  links.classList.toggle('open');
  burger.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', updateUI);
