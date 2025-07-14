import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const types    = ['image','music','video','blog','article','book','podcast','research'];
let   items    = [];

async function fetchData() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status','approved');

  if (error) return console.error('💥 Supabase:', error);
  items = data;  render();
}

function render() {
  const q        = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const f        = document.getElementById('filterType')?.value || 'All';
  const newest   = document.getElementById('sortSelect')?.value !== 'Oldest';

  types.forEach(t => {
    // ensure section/grid exist –- create on first run
    let section   = document.getElementById(t);
    if (!section) {
      const mainGrid = document.querySelector('.gallery-grid');
      section = document.createElement('section');
      section.id = t;
      section.innerHTML = `<h3>${t[0].toUpperCase()+t.slice(1)}</h3><div class="gallery-grid"></div>`;
      mainGrid.parentElement.appendChild(section);
    }
    const grid = section.querySelector('.gallery-grid');
    grid.innerHTML = '';

    let list = items.filter(it => it.type === t);
    if (f !== 'All') list = list.filter(it => it.type === f);
    if (q) list = list.filter(it =>
        (it.title_en||it.title_ar||'').toLowerCase().includes(q) ||
        (it.creator_name||'').toLowerCase().includes(q)
    );
    list.sort((a,b)=> newest
        ? new Date(b.created_at)-new Date(a.created_at)
        : new Date(a.created_at)-new Date(b.created_at));

    list.forEach(it=>{
      const card = document.createElement('div');
      card.className='gallery-card show';
      card.innerHTML = `
        <img src="${it.type==='image'?it.link:'images/gallery/gallery-art.png'}" alt="">
        <div class="gallery-meta">By <b>${it.creator_name||'-'}</b></div>
        <div class="gallery-title">${it.title_en||it.title_ar||''}</div>`;
      grid.appendChild(card);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  ['searchInput','filterType','sortSelect'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',render);
    document.getElementById(id)?.addEventListener('change',render);
  });
});
