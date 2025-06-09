import { supabase } from './auth.js';
const PAGE_SIZE=24;let page=0,loading=false;
const grid=document.querySelector('.gallery-grid');
const modal=document.getElementById('previewModal');
const modalC=document.getElementById('modalContent');
document.getElementById('closeModal').onclick=()=>modal.close();
modal.onclick=e=>{if(e.target===modal)modal.close();};

async function fetchData(){
  if(loading)return;loading=true;
  [...Array(PAGE_SIZE)].forEach(()=>grid.appendChild(Object.assign(document.createElement('div'),{className:'skeleton'})));
  const {data,error}=await supabase.from('submissions').select('*').eq('status','approved')
    .range(page*PAGE_SIZE,page*PAGE_SIZE+PAGE_SIZE-1).order('created_at',{ascending:false});
  page++;grid.querySelectorAll('.skeleton').forEach(s=>s.remove());
  if(error){console.error(error);loading=false;return;}
  data.forEach(it=>grid.appendChild(createCard(it)));loading=false;
}
function createCard(it){
  const el=document.createElement('article');el.className='gallery-card';
  const img=document.createElement('img');img.src=it.link;img.alt=it.title_en||'art';img.loading='lazy';
  img.onload=()=>el.style.minHeight='unset';el.appendChild(img);
  el.onclick=()=>openModal(it);return el;
}
function openModal(it){
  modalC.innerHTML=`<img src="${it.link}" class="modal-media" alt="">`;modal.showModal();
}
window.addEventListener('scroll',()=>{if(!loading&&window.innerHeight+window.scrollY>=document.body.offsetHeight-600)fetchData();});
fetchData();
