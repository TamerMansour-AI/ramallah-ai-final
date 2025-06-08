import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems=[];
const grid   = document.getElementById('gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
const btnX   = document.getElementById('closeModal');
btnX?.addEventListener('click', ()=>modal.close());
modal.addEventListener('click', e=>{ if(e.target===modal) modal.close(); });

const q  = document.getElementById('searchInput');
const ft = document.getElementById('filterType');
const ss = document.getElementById('sortSelect');
[q,ft,ss].forEach(el=>el?.addEventListener('input', refresh));

document.addEventListener('DOMContentLoaded', loadGallery);

async function loadGallery(){
  const { data:subs } = await supabase
       .from('submissions')
       .select('id,title_en,type,link,creator_name,creator_slug,status,created_at')
       .eq('status','approved');
  const { data:lk } = await supabase
       .from('likes')
       .select('slug,count');

  const likeMap=Object.fromEntries((lk||[]).map(r=>[r.slug,r.count]));
  allItems=subs.map(it=>({...it,likes:likeMap[it.id]||0}))
               .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  render(allItems);
}

/* helpers */
const imgExt=/\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;
function isImg(url){ return imgExt.test(url)||url.startsWith('https://cdn.midjourney.com'); }
function thumb(it){
  if(it.type==='image'&&it.link&&isImg(it.link)) return it.link;
  if(it.link?.includes('youtu')){
     const id=it.link.split('v=')[1]?.slice(0,11);
     return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return 'assets/icons/link.svg';
}

/* like */
async function like(it, btn){
  const key=`liked_${it.id}`;
  if(localStorage.getItem(key)) return;
  const { data } = await supabase
     .from('likes')
     .upsert({slug:it.id,count:it.likes+1},{onConflict:'slug'})
     .select('count').single();
  it.likes=data.count;
  btn.querySelector('span').textContent=it.likes;
  btn.classList.add('liked');
  localStorage.setItem(key,'1');
}

/* modal builder */
function openModal(it){
  const likedKey=`liked_${it.id}`;
  const media = it.type==='image' && isImg(it.link)
      ? `<img src="${it.link}" class="modal-media">`
      : it.link?.includes('youtu')
          ? `<iframe class="modal-media" src="https://www.youtube.com/embed/${it.link.split('v=')[1]?.slice(0,11)}" allowfullscreen></iframe>`
          : `<a href="${it.link}" target="_blank">Open link</a>`;

  modalC.innerHTML = `
      ${media}
      <button class="like-btn ${localStorage.getItem(likedKey)?'liked':''}">
         🔥 <span>${it.likes}</span>
      </button>`;
  const likeBtn = modalC.querySelector('.like-btn');
  likeBtn.addEventListener('click', e=>{ e.stopPropagation(); like(it,likeBtn); });
  modal.showModal();
}

function buildCard(it){
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
     <img src="${thumb(it)}" loading="lazy">
     <div class="inner">
       <h3>${it.title_en||'(untitled)'}</h3>
       <p>By ${
          it.creator_slug
            ? `<a href="creator.html?slug=${it.creator_slug}">${it.creator_name}</a>`
            : (it.creator_name||'Unknown')
       }</p>
       <span class="badge">${it.type}</span>
       <button class="like-btn ${localStorage.getItem(`liked_${it.id}`)?'liked':''}">
         🔥 <span>${it.likes}</span>
       </button>
     </div>`;
  const likeBtn=el.querySelector('.like-btn');
  likeBtn.addEventListener('click', e=>{ e.stopPropagation(); like(it,likeBtn); });
  el.addEventListener('click', ()=>openModal(it));
  return el;
}
function render(list){ grid.innerHTML=''; list.forEach(it=>grid.appendChild(buildCard(it))); }
function refresh(){
  const kw=(q.value||'').toLowerCase(), t=ft.value, s=ss.value;
  let list=allItems.filter(it=>
    (t==='All'||it.type===t)&&
    ((it.title_en||'').toLowerCase().includes(kw)||(it.creator_name||'').toLowerCase().includes(kw)));
  if(s==='Oldest') list=[...list].reverse();
  render(list);
}
