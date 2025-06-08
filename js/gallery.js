/*
 - missing DOMContentLoaded hook
 - bad Supabase select or range query
 - undefined variables
 - broken event listeners
 - 404 icon path
*/
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
let allItems = [];

function isArabic(){
  return document.documentElement.lang === 'ar';
}

async function loadGallery(){
  const { data, error } = await supabase
    .from('submissions')
    .select('id,title,type,thumb_url,file_path,link,created_at,likes,creator:creators!inner(name,slug)')
    .order('created_at',{ ascending:false });
  if(error){
    console.error(error);
    return;
  }
  allItems = data || [];
  renderGallery(allItems);
}

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  const s = document.getElementById('searchInput') || document.getElementById('searchInput-ar');
  const f = document.getElementById('filterType') || document.getElementById('filterType-ar');
  const sort = document.getElementById('sortSelect') || document.getElementById('sortSelect-ar');
  if(s) s.addEventListener('input', filterRender);
  if(f) f.addEventListener('change', filterRender);
  if(sort) sort.addEventListener('change', filterRender);
});

function filterRender(){
  const text = (document.getElementById('searchInput')?.value || document.getElementById('searchInput-ar')?.value || '').toLowerCase();
  const typeVal = (document.getElementById('filterType')?.value || document.getElementById('filterType-ar')?.value || '');
  const sortVal = (document.getElementById('sortSelect')?.value || document.getElementById('sortSelect-ar')?.value || 'newest');

  let items = allItems.filter(it => {
    const matchText = (it.title || '').toLowerCase().includes(text) ||
      (it.creator?.name || '').toLowerCase().includes(text);
    const matchType = !typeVal || typeVal === 'All' ? true : it.type === typeVal;
    return matchText && matchType;
  });

  if(sortVal === 'oldest'){
    items.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  }else if(sortVal === 'likes'){
    items.sort((a,b)=>(b.likes||0)-(a.likes||0));
  }else{
    items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }

  renderGallery(items);
}

const sectionEls = {
  image: document.querySelector('#images .gallery-grid'),
  music: document.querySelector('#music .gallery-grid'),
  video: document.querySelector('#videos .gallery-grid'),
  blog: document.querySelector('#blogs .gallery-grid'),
  book: document.querySelector('#books .gallery-grid')
};

function renderGallery(list){
  Object.values(sectionEls).forEach(c=>{if(c) c.innerHTML='';});
  list.forEach(item=>{
    const cont = sectionEls[item.type];
    if(!cont) return;
    cont.appendChild(buildCard(item));
  });
}

function youtubeThumb(url){
  const m = url.match(/(?:v=|be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : 'assets/icons/link.svg';
}

function buildCard(item){
  const card = document.createElement('article');
  card.className = 'gallery-card';

  let thumb = item.thumb_url;
  if(!thumb){
    if(item.link && item.link.includes('youtu')){
      thumb = youtubeThumb(item.link);
    }else{
      thumb = 'assets/icons/link.svg';
    }
  }
  if(thumb){
    const img = document.createElement('img');
    img.src = thumb;
    img.alt = item.title || '';
    img.loading = 'lazy';
    card.appendChild(img);
  }

  if(item.creator){
    const meta = document.createElement('div');
    meta.className = 'gallery-meta';
    meta.textContent = isArabic() ? 'بواسطة ' : 'By ';
    const a = document.createElement('a');
    a.href = `creator.html?id=${item.creator.slug}`;
    a.textContent = item.creator.name;
    meta.appendChild(a);
    card.appendChild(meta);
  }

  if(item.title){
    const t = document.createElement('div');
    t.className = 'gallery-title';
    t.textContent = item.title;
    card.appendChild(t);
  }

  const likeBox = document.createElement('div');
  likeBox.className = 'like-box';
  const btn = document.createElement('button');
  btn.className = 'like-btn';
  btn.textContent = '👍';
  const cnt = document.createElement('span');
  cnt.className = 'like-count';
  cnt.textContent = item.likes || 0;
  if(localStorage.getItem('liked_'+item.id)){
    btn.classList.add('liked');
  }
  btn.addEventListener('click', async ()=>{
    if(btn.classList.contains('liked')) return;
    const { error } = await supabase.rpc('increment_likes',{ id:item.id });
    if(!error){
      cnt.textContent = parseInt(cnt.textContent)+1;
      btn.classList.add('liked');
      localStorage.setItem('liked_'+item.id,'1');
    }
  });
  likeBox.appendChild(btn);
  likeBox.appendChild(cnt);
  card.appendChild(likeBox);

  if(item.link && item.type !== 'image'){
    const a = document.createElement('a');
    a.href = item.link;
    a.target = '_blank';
    a.textContent = 'Open';
    card.appendChild(a);
  }

  return card;
}
