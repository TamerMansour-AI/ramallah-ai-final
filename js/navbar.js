import { getUser, signIn, signOut } from './auth.js';

const btn     = document.getElementById('login-btn');
const profile = document.getElementById('profile-link');
const burger  = document.getElementById('nav-hamburger');
const links   = document.getElementById('navbar-links');

async function renderState() {
  const { data } = await getUser();
  if (data?.user) {
    btn.textContent   = 'Logout';
    profile.hidden    = false;
  } else {
    btn.textContent   = 'Login';
    profile.hidden    = true;
  }
}

btn?.addEventListener('click', async () => {
  (await getUser()).data.user ? await signOut() : await signIn();
  renderState();
});

burger?.addEventListener('click', () => {
  burger.classList.toggle('open');
  links.classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', renderState);
