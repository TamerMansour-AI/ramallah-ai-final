import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { mountComments } from './comments.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems=[];
let currentList=[];
let visible=0;
const PAGE=20;
const grid   = document.getElementById('gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
document.getElementById('closeModal')?.addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal) modal.close();});
modal.addEventListener('close', ()=>{ modalC.innerHTML=''; });   // clears stuck content

const q=document.getElementById('searchInput'),
      ft=document.getElementById('filterType'),
      ss=document.getElementById('sortSelect');
[q,ft,ss].forEach(el=>el?.addEventListener('input',refresh));

document.addEventListener('DOMContentLoaded',loadGallery);

/* ------------ DB LOAD ------------- */
async function loadGallery(){
  const { data:subs } = await supabase
    .from('submissions')
    .select('id,title_en,type,link,creator_name,creator_slug,status,created_at')
    .eq('status','approved');

  const { data:lk } = await supabase.from('likes').select('slug,count');
  const likeMap = Object.fromEntries((lk||[]).map(r=>[r.slug,r.count]));

  allItems=subs.map(x=>({...x,likes:likeMap[x.id]||0}))
               .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  render(allItems);
}

/* ------------ HELPERS ------------- */
const imgExt=/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i;
const isImg=u=>imgExt.test(u)||u.startsWith('https://cdn.midjourney.com');
const ytId=u=>(u.match(/(?:v=|youtu\.be\/)([\w-]{11})/)||[])[1];
const ytThumb=u=>`https://img.youtube.com/vi/${ytId(u)}/hqdefault.jpg`;
function thumb(it){
  if(it.type==='image' && it.link && isImg(it.link)) return it.link;
  if(it.type==='podcast') return 'assets/icons/podcast.svg';
  if(it.type==='research' || /\.pdf(\?.*)?$/i.test(it.link||'')) return 'assets/icons/pdf.svg';
  if(it.link?.includes('youtu')) return ytThumb(it.link);
  return 'assets/icons/link.svg';
}

/* ------------ LIKE ------------ */
async function like(it,btn){
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

/* ------------ MODAL ------------ */
function openModal(it){
  const likedKey=`liked_${it.id}`;
  let media='';
  if(it.type==='image' && isImg(it.link)){
    media=`<img src="${it.link}" class="modal-media" loading="lazy" alt="${it.title_en||''}">`;
  }else if(it.type==='podcast'){
    if(/\.(mp3|ogg)(\?.*)?$/i.test(it.link||''))
      media=`<audio controls class="modal-media" src="${it.link}"></audio>`;
    else if(it.link?.includes('youtu'))
      media=`<iframe class="modal-media" src="https://www.youtube.com/embed/${ytId(it.link)}" allowfullscreen></iframe>`;
    else
      media=`<a href="${it.link}" target="_blank">Open link</a>`;
  }else if(it.type==='research' || /\.pdf(\?.*)?$/i.test(it.link||'')){
    media=`<iframe class="modal-media" src="${it.link}"></iframe>`;
  }else if(it.link?.includes('youtu')){
    media=`<iframe class="modal-media" src="https://www.youtube.com/embed/${ytId(it.link)}" allowfullscreen></iframe>`;
  }else{
    media=`<a href="${it.link}" target="_blank">Open link</a>`;
  }

  modalC.innerHTML = `
    ${media}
    <button class="like-btn ${localStorage.getItem(likedKey)?'liked':''}">
      🔥 <span>${it.likes}</span>
    </button>
    <div id="cWrap"></div>`;
  const likeBtn = modalC.querySelector('.like-btn');
  likeBtn.addEventListener('click',e=>{ e.stopPropagation(); like(it,likeBtn); });

  mountComments(modalC.querySelector('#cWrap'), it.id);
  modal.showModal();
}

/* ------------ CARDS ------------ */
function card(it){
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
    <img src="${thumb(it)}" loading="lazy" alt="${it.title_en||''}" class="loading">
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
  likeBtn.addEventListener('click',e=>{ e.stopPropagation(); like(it,likeBtn); });
  const img=el.querySelector('img');
  img.addEventListener('load',()=>img.classList.remove('loading'));
  el.addEventListener('click',()=>openModal(it));
  return el;
}
function render(list){
  grid.innerHTML='';
  currentList=list;
  visible=0;
  renderMore();
}
function renderMore(){
  const slice=currentList.slice(visible,visible+PAGE);
  slice.forEach(it=>grid.appendChild(card(it)));
  visible+=slice.length;
}
function refresh(){
  const kw=(q.value||'').toLowerCase(), t=ft.value, s=ss.value;
  let list=allItems.filter(it=>
    (t==='All'||it.type===t) &&
    ((it.title_en||'').toLowerCase().includes(kw) ||
     (it.creator_name||'').toLowerCase().includes(kw)));
  if(s==='Oldest') list=[...list].reverse();
  render(list);
}

window.addEventListener('scroll',()=>{
  if(window.innerHeight+window.scrollY>document.body.offsetHeight-200){
    renderMore();
  }
});

