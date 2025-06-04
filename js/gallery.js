import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// إعداد الاتصال بـ Supabase
const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// الأقسام الظاهرة فى الـ HTML
const sections = ['images', 'music', 'videos', 'blogs', 'books'];

/* mapping القسم → القيمة فى قاعدة البيانات */
const sectionMap = {
  images: 'image',
  music: 'music',
  videos: 'video',
  blogs: 'blog',
  books: 'book'
};

let allItems = [];

async function fetchData() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.error('❌ Error loading data:', error);
    return;
  }

  // 🧹 تنظيف البيانات: فقط اللي عنده عنوان وصورة (أو thumb)
  allItems = data.filter(item => {
    const hasTitle = item.title || item.title_en || item.title_ar;
    const hasImage = item.thumb || (item.type === 'image' && item.link);
    return hasTitle && hasImage;
  });

  renderFiltered();
}

function renderFiltered() {
  const searchValue =
    document.getElementById('search-input')?.value?.toLowerCase() || '';

  const selectedTypeRaw = document.getElementById('type-filter')?.value || '';
  const selectedType =
    selectedTypeRaw === 'images' ? 'image' : selectedTypeRaw;

  sections.forEach((section) => {
    const container = document.querySelector(`#${section} .gallery-grid`);
    if (!container) return;
    container.innerHTML = '';

    const filtered = allItems.filter((item) => {
      const matchesType = selectedType ? item.type === selectedType : true;
      const matchesSearch =
        (item.title_en || item.title_ar || '')
          .toLowerCase()
          .includes(searchValue) ||
        (item.creator_name || '')
          .toLowerCase()
          .includes(searchValue);

      const sectionMatch = item.type === sectionMap[section];
      return sectionMatch && matchesType && matchesSearch;
    });

    filtered.forEach((item) => {
      const imgSrc = item.type === 'image' ? item.link : item.thumb || '';

      const card = document.createElement('div');
      card.className = 'gallery-card show';
      card.innerHTML = `
        ${imgSrc ? `<img src="${imgSrc}" alt="${item.title_en || ''}" loading="lazy" class="clickable-image">` : ''}
        ${(item.creator_name || item.creator)
            ? `<div class="gallery-meta">By <b>${item.creator_name || item.creator}</b></div>`
            : ''}
        ${item.title ? `<div class="gallery-title">${item.title}</div>` : ''}
        ${item.type ? `<div class="gallery-badge">${item.type}</div>` : ''}
        <div class="gallery-desc">${item.desc_en || item.desc_ar || ''}</div>
        ${item.link && item.type !== 'image' ? `<a href="${item.link}" target="_blank">🔗 View Work</a>` : ''}
      `;
      container.appendChild(card);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchData();

  const search = document.getElementById('search-input');
  const filter = document.getElementById('type-filter');

  if (search) search.addEventListener('input', renderFiltered);
  if (filter) filter.addEventListener('change', renderFiltered);
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('clickable-image')) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `<img src="${e.target.src}" alt="">`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.remove());
  }
});

