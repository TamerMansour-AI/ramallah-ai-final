import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems = [];
const wrap = document.getElementById('gallery-grid');

document.addEventListener('DOMContentLoaded', loadGallery);

async function loadGallery() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`id,title_en,desc_en,type,link,thumb_url,file_path,
             creator_name,creator_slug,likes,created_at,status`)
    .eq('status', 'approved');
  if (error) { console.error(error); return; }

  // newest first client-side
  allItems = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  renderGallery(allItems);
  console.info('Loaded', allItems.length, 'items');
}

function thumbFor(it) {
  if (it.thumb_url) return it.thumb_url;
  if (it.link?.includes('youtu')) {
    const id = it.link.split('v=')[1]?.substring(0, 11);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return 'assets/icons/link.svg';
}

function buildCard(it) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <img loading="lazy" src="${thumbFor(it)}" alt="${it.title_en || 'AI work'}">
    <h3>${it.title_en || '(untitled)'}</h3>
    <p class="creator">By ${it.creator_name || 'Unknown'}</p>
    <span class="badge">${it.type.toUpperCase()}</span>`;
  return card;
}

function renderGallery(list) {
  wrap.innerHTML = '';
  list.forEach(it => wrap.appendChild(buildCard(it)));
}

/* =========  search / filter / sort  ========= */
const q  = document.getElementById('searchInput');
const ft = document.getElementById('filterType');
const ss = document.getElementById('sortSelect');
[q, ft, ss].forEach(el => el?.addEventListener('input', filterRender));

function filterRender() {
  const kw   = (q?.value || '').toLowerCase();
  const type = ft?.value || 'All';
  const sort = ss?.value || 'Newest';

  let list = allItems.filter(it =>
      (type === 'All' || it.type === type) &&
      ((it.title_en || '').toLowerCase().includes(kw) ||
       (it.creator_name || '').toLowerCase().includes(kw)));

  if (sort === 'Oldest') {
    list = [...list].reverse();
  } else if (sort === 'Most Liked') {
    list = [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }
  renderGallery(list);
}
