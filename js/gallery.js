import { supabase, getUser } from './auth.js';
import { mountComments }    from './comments.js';

const PAGE_SIZE = 24;
let page = 0, loading = false;

const grid   = document.querySelector('.gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
document.getElementById('closeModal').onclick = () => modal.close();
modal.onclick = e => { if (e.target === modal) modal.close(); };

async function fetchData () {
  if (loading) return; loading = true;
  [...Array(PAGE_SIZE)].forEach(() =>
    grid.appendChild(Object.assign(document.createElement('div'), { className:'skeleton' })));

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved')
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    .order('created_at', { ascending:false });

  page++;
  grid.querySelectorAll('.skeleton').forEach(s => s.remove());
  if (error) { console.error(error); loading = false; return; }

  data.forEach(item => grid.appendChild(createCard(item)));
  loading = false;
}

function createCard (it) {
  const el  = document.createElement('article');
  el.className = 'gallery-card';

  const img = document.createElement('img');
  img.src   = it.thumb || it.link;
  img.alt   = it.title_en || 'Artwork';
  img.loading = 'lazy';
  img.onload = () => { el.style.minHeight = 'unset'; };

  el.appendChild(img);
  el.onclick = () => openModal(it);
  return el;
}

function openModal (it) {
  modalC.innerHTML = `
    <img src="${it.thumb || it.link}" class="modal-media" alt="">
    <button id="likeBtn" class="like-btn">🔥 <span>${it.likes}</span></button>
    <div id="cWrap"></div>`;
  mountComments(modalC.querySelector('#cWrap'), it.id);
  modal.showModal();

  document.getElementById('likeBtn').onclick = async () => {
    const { data:{ user } } = await getUser();
    if (!user) return alert('Please sign in');
    const { error } = await supabase
      .from('likes')
      .insert({ submission_id: it.id, user_id: user.id });
    if (!error) {
      const span = document.querySelector('#likeBtn span');
      span.textContent = Number(span.textContent) + 1;
      document.getElementById('likeBtn').classList.add('liked');
    }
  };
}

window.addEventListener('scroll', () => {
  if (!loading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 600)
    fetchData();
});

fetchData();
