import { supabase, getUser } from './auth.js';
import { mountComments }    from './comments.js';

const PAGE_SIZE = 24;
let page = 0, loading = false;
const sections = ['image', 'music', 'video', 'blog', 'article', 'book'];
const searchEl = document.getElementById('searchInput');
const filterEl = document.getElementById('filterType');
const sortEl   = document.getElementById('sortSelect');

const grid   = document.querySelector('.gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
document.getElementById('closeModal').onclick = () => modal.close();
modal.onclick = e => { if (e.target === modal) modal.close(); };

function resetAndFetch() {
  page = 0;
  grid.innerHTML = '';
  fetchData();
}

if (searchEl) searchEl.addEventListener('input', () => { resetAndFetch(); });
if (filterEl) filterEl.addEventListener('change', () => { resetAndFetch(); });
if (sortEl)   sortEl.addEventListener('change', () => { resetAndFetch(); });

async function fetchData () {
  if (loading) return; loading = true;
  [...Array(PAGE_SIZE)].forEach(() =>
    grid.appendChild(Object.assign(document.createElement('div'), { className:'skeleton' })));

  let query = supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved');

  if (filterEl && filterEl.value && filterEl.value !== 'All') {
    query = query.eq('type', filterEl.value);
  }

  const term = searchEl && searchEl.value.trim();
  if (term) {
    const t = term.replace(/,/g, '');
    query = query.or(
      `title_en.ilike.%${t}%,title_ar.ilike.%${t}%,creator_name.ilike.%${t}%`
    );
  }

  query = query
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    .order('created_at', { ascending: sortEl && sortEl.value === 'Oldest' });

  const { data, error } = await query;

  page++;
  grid.querySelectorAll('.skeleton').forEach(s => s.remove());
  if (error) { console.error(error); loading = false; return; }

  data.forEach(item => grid.appendChild(createCard(item)));
  loading = false;
}

function createCard (it) {
  const el  = document.createElement('article');
  el.className = 'gallery-card';

  let thumb = it.thumb;
  if (thumb && !thumb.startsWith('http')) {
    const { data } = supabase
      .storage
      .from('uploads')
      .getPublicUrl(thumb);
    thumb = data.publicUrl;
  }

  const img = document.createElement('img');
  img.src   = thumb || it.link;
  img.alt   = it.title_en || 'Artwork';
  img.loading = 'lazy';
  img.onload = () => { img.style.opacity = 1; el.style.minHeight = 'unset'; };

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
