/*
 - missing DOMContentLoaded hook
 - bad Supabase select or range
 - undefined variables
 - broken event listeners
 - 404 icon path
*/
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
let allItems = [];
const wrap = document.getElementById('gallery-grid');

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  document.getElementById('searchInput')?.addEventListener('input', filterRender);
  document.getElementById('filterType')?.addEventListener('change', filterRender);
  document.getElementById('sortSelect')?.addEventListener('change', filterRender);
});

async function loadGallery() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`id,title_en,desc_en,type,thumb_url,file_path,link,creator_name,creator_slug,likes,created_at`)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    if (wrap) wrap.textContent = document.documentElement.lang === 'ar' ? 'لا يوجد محتوى بعد' : 'No items yet';
    return;
  }
  allItems = data || [];
  renderGallery(allItems);
}

function renderGallery(list) {
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'gallery-empty';
    p.textContent = document.documentElement.lang === 'ar' ? 'لا يوجد محتوى بعد' : 'No items yet';
    wrap.appendChild(p);
    return;
  }
  list.forEach((item) => wrap.appendChild(buildCard(item)));
}

function buildCard(item) {
  const card = document.createElement('article');
  card.className = 'card';

  let thumb = item.thumb_url;
  if (!thumb) {
    if (item.link && item.link.includes('youtu')) {
      const m = item.link.match(/(?:v=|be\/|embed\/)([\w-]{11})/);
      thumb = m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : 'assets/icons/link.svg';
    } else {
      thumb = 'assets/icons/link.svg';
    }
  }
  if (thumb) {
    const img = document.createElement('img');
    img.src = thumb;
    img.alt = item.title_en || '';
    img.loading = 'lazy';
    card.appendChild(img);
  }

  const title = document.createElement('h3');
  title.textContent = item.title_en || '';
  card.appendChild(title);

  const meta = document.createElement('p');
  const creator = document.createElement('a');
  creator.href = `creator.html?id=${item.creator_slug}`;
  creator.textContent = item.creator_name || '';
  meta.appendChild(creator);
  card.appendChild(meta);

  const likeBtn = document.createElement('button');
  likeBtn.className = 'like-btn';
  likeBtn.textContent = '🔥';
  const cnt = document.createElement('span');
  cnt.textContent = item.likes ?? 0;
  const likeBox = document.createElement('div');
  likeBox.className = 'like-box';
  likeBox.appendChild(likeBtn);
  likeBox.appendChild(cnt);
  card.appendChild(likeBox);

  likeBtn.addEventListener('click', async () => {
    if (likeBtn.dataset.liked) return;
    const { error } = await supabase.from('likes').insert({ submission_id: item.id });
    if (!error) {
      cnt.textContent = parseInt(cnt.textContent) + 1;
      likeBtn.dataset.liked = '1';
      likeBtn.classList.add('liked');
    }
  });

  card.addEventListener('click', (e) => {
    if (e.target === likeBtn) return;
    openModal(item);
  });

  return card;
}

function openModal(item) {
  const modal = document.getElementById('previewModal');
  if (!modal) return;
  modal.innerHTML = '';
  let el;
  if (item.type === 'image' && item.link) {
    el = document.createElement('img');
    el.src = item.link;
    el.alt = item.title_en || '';
  } else if (item.type === 'video' && item.link) {
    el = document.createElement('iframe');
    el.src = item.link;
    el.allowFullscreen = true;
  } else if (item.type === 'music' && item.link) {
    el = document.createElement('audio');
    el.controls = true;
    el.src = item.link;
  } else if (item.link) {
    el = document.createElement('a');
    el.href = item.link;
    el.target = '_blank';
    el.textContent = item.link;
  }
  if (el) {
    el.className = 'modal-media';
    modal.appendChild(el);
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); }, { once: true });
  modal.showModal();
}

function filterRender() {
  const text = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const typeVal = (document.getElementById('filterType')?.value || 'All').toLowerCase();
  const sortVal = document.getElementById('sortSelect')?.value || 'Newest';

  let list = allItems.filter((it) => {
    const matchText = (it.title_en || '').toLowerCase().includes(text) ||
      (it.creator_name || '').toLowerCase().includes(text);
    const matchType = typeVal === 'all' ? true : it.type === typeVal;
    return matchText && matchType;
  });

  if (sortVal === 'Oldest') {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortVal === 'Most Liked') {
    list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  renderGallery(list);
}
