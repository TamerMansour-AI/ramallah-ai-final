import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems = [];
const grid   = document.getElementById('gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
document.getElementById('closeModal')?.addEventListener('click', ()=>modal.close());

const q  = document.getElementById('searchInput');
const ft = document.getElementById('filterType');
const ss = document.getElementById('sortSelect');
[q,ft,ss].forEach(el=>el?.addEventListener('input', refresh));

/* --------------- LOAD --------------- */
document.addEventListener('DOMContentLoaded', loadGallery);

async function loadGallery(){
  const { data:subs, error } = await supabase
    .from('submissions')
    .select(`id,title_en,type,link,creator_name,creator_slug,status,created_at`)
    .eq('status','approved');
  if(error){console.error(error);return;}

  const { data:lk } = await supabase
    .from('likes')
    .select('slug,count');

  const likeMap = Object.fromEntries((lk||[]).map(r=>[r.slug,r.count]));
  allItems = subs.map(it=>({...it, likes: likeMap[it.id] || 0}))
                 .sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  render(allItems);
}

/* ---------- HELPERS ---------- */
function isImage(url){
  return /(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url)
      || url.startsWith('https://cdn.midjourney.com');
}
function thumb(it){
  if(it.type==='image' && it.link && isImage(it.link)) return it.link;
  if(it.link?.includes('youtu')){
    const id = it.link.split('v=')[1]?.slice(0,11);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return 'assets/icons/link.svg';
}
function openModal(it){
  let body='';
  if(it.type==='image' && isImage(it.link)){
    body = `<img src="${it.link}" style="max-width:80vw;max-height:80vh;object-fit:contain">`;
  }else if(it.link?.includes('youtu')){
    const id = it.link.split('v=')[1]?.slice(0,11);
    body = `<iframe width="640" height="360" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
  }else{
    body = `<a href="${it.link}" target="_blank">Open link</a>`;
  }
  modalC.innerHTML = body;
  modal.showModal();
}

/* ---------- LIKE HANDLER ---------- */
async function handleLike(it, btn){
  // prevent double-like per browser
  const key = `liked_${it.id}`;
  if(localStorage.getItem(key)) return;

  const { data, error } = await supabase
    .from('likes')
    .upsert({ slug: it.id, count: it.likes + 1 }, { onConflict:'slug' })
    .select('count')
    .single();

  if(error){console.error(error);return;}
  it.likes = data.count;
  btn.querySelector('span').textContent = it.likes;
  btn.classList.add('liked');
  localStorage.setItem(key,'1');
}

function card(it){
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
    <img loading="lazy" src="${thumb(it)}" alt="${it.title_en||'AI work'}">
    <div class="inner">
      <h3>${it.title_en||'(untitled)'}</h3>
      <p>
        By ${
          it.creator_slug
           ? `<a href="creator.html?slug=${it.creator_slug}">${it.creator_name}</a>`
           : (it.creator_name||'Unknown')
        }
      </p>
      <span class="badge">${it.type}</span>
      <button class="like-btn" aria-label="like">
        🔥 <span>${it.likes}</span>
      </button>
    </div>`;
  el.querySelector('.like-btn')
    .addEventListener('click', e=>{
        e.stopPropagation();
        handleLike(it, e.currentTarget);
     });
  el.addEventListener('click', ()=>openModal(it));
  return el;
}

function render(list){
  grid.innerHTML=''; list.forEach(it=>grid.appendChild(card(it)));
}

function refresh(){
  const kw=(q.value||'').toLowerCase();
  const t=ft.value, s=ss.value;
  let list=allItems.filter(it=>
    (t==='All'||it.type===t) &&
    ((it.title_en||'').toLowerCase().includes(kw) ||
     (it.creator_name||'').toLowerCase().includes(kw)));
  if(s==='Oldest') list=[...list].reverse();
  render(list);
}
