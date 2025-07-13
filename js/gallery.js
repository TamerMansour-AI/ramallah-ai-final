import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const sections = ['image','music','video','blog','book']; let all=[];
async function load(){
  const {data} = await supabase.from('submissions').select('*').eq('status','approved');
  all=data||[]; render();
}
function render(){
  const q=document.getElementById('search-input')?.value?.toLowerCase()||'';
  const t=document.getElementById('type-filter')?.value||'';
  sections.forEach(s=>{
    const c=document.querySelector('#'+s+' .gallery-grid'); if(!c)return; c.innerHTML='';
    all.filter(it=>{
      const mT=t?it.type===t:true;
      const mS=(it.title_en||it.title_ar||'').toLowerCase().includes(q)||
               (it.creator_name||'').toLowerCase().includes(q);
      return it.type===s && mT && mS;
    }).forEach(it=>{
      const card=document.createElement('div'); card.className='gallery-card show';
      card.innerHTML=`<img src="${it.type==='image'?it.link:''}" alt="">
        <div class="gallery-meta">By <b>${it.creator_name||'-'}</b></div>
        <div class="gallery-title">${it.title_en||it.title_ar||''}</div>`;
      c.appendChild(card);
    });
  });
}
document.addEventListener('DOMContentLoaded',()=>{load();
  document.getElementById('search-input')?.addEventListener('input',render);
  document.getElementById('type-filter')?.addEventListener('change',render);
});
