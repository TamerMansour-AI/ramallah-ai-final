import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems = [];
const grid = document.getElementById('gallery-grid');
const q  = document.getElementById('searchInput');
const ft = document.getElementById('filterType');
const ss = document.getElementById('sortSelect');

document.addEventListener('DOMContentLoaded', loadGallery);
[q,ft,ss].forEach(el=>el?.addEventListener('input', refresh));

async function loadGallery(){
  /* 1. submissions */
  const { data, error } = await supabase
    .from('submissions')
    .select(`id,title_en,type,link,creator_name,creator_slug,status,created_at`)
    .eq('status','approved');
  if(error){console.error(error);return;}
  allItems = data;

  /* 2. likes */
  const { data:lk } = await supabase
    .from('likes')
    .select('slug,count');
  const likeMap = Object.fromEntries((lk||[]).map(r=>[r.slug,r.count]));
  allItems.forEach(it=> it.likes = likeMap[it.id] || 0);

  /* 3. initial render (newest first) */
  allItems.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  render(allItems);
}

function fallbackThumb(it){
  // If an image row and link looks like a direct image URL → use it
  if(it.type === 'image' && it.link &&
     /(\.png|jpe?g|gif|webp|avif)$/i.test(it.link)){
    return it.link;
  }
  // If YouTube link
  if(it.link?.includes('youtu')){
    const id = it.link.split('v=')[1]?.slice(0,11);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  // Fallback generic icon
  return 'assets/icons/link.svg';
}
function buildCard(it){
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
    <img src="${fallbackThumb(it)}" loading="lazy" alt="${it.title_en||'AI work'}">
    <div style="padding:8px">
      <h3>${it.title_en||'(untitled)'}</h3>
      <p>By ${it.creator_name||'Unknown'}</p>
      <span class="badge">${it.type}</span>
      <div class="likes">🔥 ${it.likes}</div>
    </div>`;
  return el;
}
function render(list){
  grid.innerHTML='';
  list.forEach(it=>grid.appendChild(buildCard(it)));
}
function refresh(){
  const kw=(q.value||'').toLowerCase();
  const t = ft.value;
  const s = ss.value;
  let list = allItems.filter(it=>
      (t==='All'||it.type===t) &&
      ((it.title_en||'').toLowerCase().includes(kw) ||
       (it.creator_name||'').toLowerCase().includes(kw)));
  if(s==='Oldest') list=[...list].reverse();
  render(list);
}
