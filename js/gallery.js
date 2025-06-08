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

document.addEventListener('DOMContentLoaded', loadGallery);

async function loadGallery(){
  const { data, error } = await supabase
    .from('submissions')
    .select(`id,title_en,type,link,creator_name,creator_slug,status,created_at`)
    .eq('status','approved');
  if(error){console.error(error);return;}
  allItems = data.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  render(allItems);
}

/* ------------ helpers ------------- */
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
  let content='';
  if(it.type==='image' && it.link && isImage(it.link)){
      content=`<img src="${it.link}" style="max-width:90vw;max-height:80vh">`;
  }else if(it.link?.includes('youtu')){
      const id=it.link.split('v=')[1]?.slice(0,11);
      content=`<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
  }else{
      content=`<a href="${it.link}" target="_blank">Open link</a>`;
  }
  modalC.innerHTML = content;
  modal.showModal();
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
    </div>`;
  el.addEventListener('click', ()=>openModal(it));
  return el;
}
function render(list){
  grid.innerHTML='';
  list.forEach(it=>grid.appendChild(card(it)));
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
