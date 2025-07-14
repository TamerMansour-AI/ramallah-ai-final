import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const sections = ['image', 'music', 'video', 'blog', 'article', 'book', 'podcast', 'research'];
let all = [];

async function load() {
  const { data, error } = await supabase.from('submissions').select('*').eq('status', 'approved');
  if (error) {
    console.error('Error loading submissions:', error);
    return;
  }
  all = data || [];
  render();
}

function render() {
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterType');
  const sortSelect = document.getElementById('sortSelect');
  const query = searchInput?.value.toLowerCase() || '';
  const filterValue = filterSelect?.value;
  const activeType = (filterValue && filterValue !== 'All') ? filterValue : '';

  sections.forEach(type => {
    const container = document.querySelector(`#${type} .gallery-grid`);
    if (!container) return;
    container.innerHTML = '';

    // Filter items by type and search query
    let results = all.filter(item => {
      const matchesType = activeType ? item.type === activeType && item.type === type : item.type === type;
      const titleText = (item.title_en || item.title_ar || '').toLowerCase();
      const creatorText = (item.creator_name || '').toLowerCase();
      const matchesSearch = titleText.includes(query) || creatorText.includes(query);
      return matchesType && matchesSearch;
    });
    if (!activeType && filterValue === 'All') {
      // When showing all types, include all items of this section type
      results = results.filter(item => item.type === type);
    }

    // Sort results by date
    results.sort((a, b) => {
      if (sortSelect?.value === 'Oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    // Create and append cards for each result
    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gallery-card show';
      card.innerHTML = `
        <img src="${item.type === 'image' ? item.link : 'images/gallery/gallery-art.png'}" alt="">
        <div class="gallery-meta">By <b>${item.creator_name || '-'}</b></div>
        <div class="gallery-title">${item.title_en || item.title_ar || ''}</div>
      `;
      container.appendChild(card);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  document.getElementById('searchInput')?.addEventListener('input', render);
  document.getElementById('filterType')?.addEventListener('change', render);
  document.getElementById('sortSelect')?.addEventListener('change', render);
});
