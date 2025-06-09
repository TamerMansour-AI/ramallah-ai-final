import { mountComments } from './comments.js';
import { supabase, getUser } from './auth.js';

const PAGE_SIZE = 24;
let currentPage = 0;
let loading = false;

const grid   = document.querySelector('.gallery-grid');
const modal  = document.getElementById('previewModal');
const modalC = document.getElementById('modalContent');
document.getElementById('closeModal')?.addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal) modal.close();});
modal.addEventListener('close', ()=>{ modalC.innerHTML=''; });   // clears stuck content

/* ------------ DB LOAD ------------- */
async function fetchData(){
  if(loading) return;
  loading = true;

  // إنشاء هياكل Skeleton
  [...Array(PAGE_SIZE)].forEach(()=>grid.appendChild(Object.assign(document.createElement('div'),{className:'skeleton'})));

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .range(currentPage*PAGE_SIZE, currentPage*PAGE_SIZE + PAGE_SIZE - 1)
    .order('created_at', { ascending:false });

  console.log('Fetched', data?.length);

  currentPage++;
  if(error){ console.error(error); loading=false; return; }

  // استبدال الـSkeleton بالبطاقات الحقيقية
  grid.querySelectorAll('.skeleton').forEach(el=>el.remove());
  grid.append(...data.map(createCard));

  loading = false;
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
  const { data:{user} } = await getUser();
  if(!user){ alert('Please login first!'); return; }

  const { error } = await supabase
    .from('likes')
    .insert({ submission_id: it.id, user_id: user.id });
  if(!error){
    it.likes++;
    btn.querySelector('span').textContent=it.likes;
    btn.classList.add('liked');
    localStorage.setItem(key,'1');
  }
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
      media=`<a href="${it.link}" target="_blank" rel="noopener">Open link</a>`;
  }else if(it.type==='research' || /\.pdf(\?.*)?$/i.test(it.link||'')){
    media=`<iframe class="modal-media" src="${it.link}"></iframe>`;
  }else if(it.link?.includes('youtu')){
    media=`<iframe class="modal-media" src="https://www.youtube.com/embed/${ytId(it.link)}" allowfullscreen></iframe>`;
  }else{
    media=`<a href="${it.link}" target="_blank" rel="noopener">Open link</a>`;
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
function createCard(it){
  const el  = document.createElement('article');
  el.className = 'gallery-card';

  const img = document.createElement('img');
  img.src  = it.link;
  img.alt  = it.title_en || 'AI artwork';
  img.loading = 'lazy';
  img.classList.add('loading');

  img.addEventListener('load',()=>{       // يحذف min-height عند انتهاء التحميل
    el.style.minHeight = 'unset';
  });

  const inner = document.createElement('div');
  inner.className = 'inner';
  inner.innerHTML = `
    <h3>${it.title_en||'(untitled)'}</h3>
    <p>By ${
      it.creator_slug
        ? `<a href="creator.html?slug=${it.creator_slug}">${it.creator_name}</a>`
        : (it.creator_name||'Unknown')
    }</p>
    <span class="badge">${it.type}</span>
    <button class="like-btn ${localStorage.getItem(`liked_${it.id}`)?'liked':''}">
      🔥 <span>${it.likes}</span>
    </button>`;

  el.appendChild(img);
  el.appendChild(inner);

  const likeBtn = inner.querySelector('.like-btn');
  likeBtn.addEventListener('click', e => { e.stopPropagation(); like(it, likeBtn); });
  img.addEventListener('load', () => img.classList.remove('loading'));
  el.addEventListener('click', () => openModal(it));
  return el;
}

window.addEventListener('scroll', () => {
  if(!loading && window.innerHeight + window.scrollY >= document.body.offsetHeight - 800){
    fetchData();
  }
});

// استدعاء أولي
fetchData();

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
    document.body.classList.remove('modal-open');
  }
});

