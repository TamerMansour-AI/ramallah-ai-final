import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems = [];
const grid = document.getElementById('gallery-grid');

/* ---------- 1. LOAD ---------- */
document.addEventListener('DOMContentLoaded', loadGallery);

async function loadGallery() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`id,title_en,type,link,creator_name,likes,created_at,status`)
    .eq('status', 'approved');         // NO thumb_url / file_path → avoids HTTP 400
  if (error) { console.error(error); return; }

  allItems = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  render(allItems);
}

/* ---------- 2. CARD HELPERS ---------- */
function fallbackThumb(it) {
  if (it.link?.includes('youtu')) {
    const id = it.link.split('v=')[1]?.slice(0, 11);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return 'assets/icons/link.svg';
}

function buildCard(it) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <img loading="lazy" src="${fallbackThumb(it)}" alt="${it.title_en || 'AI work'}">
    <h3>${it.title_en || '(untitled)'}</h3>
    <p>By ${it.creator_name || 'Unknown'}</p>
    <span class="badge">${it.type}</span>`;
  return el;
}

function render(list) {
  grid.innerHTML = '';
  list.forEach(it => grid.appendChild(buildCard(it)));
}

/* ---------- 3. SEARCH / FILTER / SORT ---------- */
const q  = document.getElementById('searchInput');
const ft = document.getElementById('filterType');
const ss = document.getElementById('sortSelect');
[q, ft, ss].forEach(el => el?.addEventListener('input', refresh));

function refresh() {
  const kw   = (q?.value || '').toLowerCase();
  const type = ft?.value || 'All';
  const sort = ss?.value || 'Newest';

  let list = allItems.filter(it =>
    (type === 'All' || it.type === type) &&
    ((it.title_en || '').toLowerCase().includes(kw) ||
     (it.creator_name || '').toLowerCase().includes(kw))
  );

  if (sort === 'Oldest')         list = [...list].reverse();
  if (sort === 'Most Liked')     list = [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));

  render(list);
}

