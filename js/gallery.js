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
let creatorsMap = {};
const batchSize = 12;
let itemsShown = batchSize;
let shuffleEnabled = false;
const params = new URLSearchParams(window.location.search);
const creatorParam = (params.get('creator') || '').toLowerCase();
const isArabic = document.documentElement.lang === 'ar';

function createShareButtons(url, text) {
  const container = document.createElement('div');
  container.className = 'share-icons';
  const isMobileShare = navigator.share && window.innerWidth < 768;
  if (isMobileShare) {
    const btn = document.createElement('button');
    btn.textContent = '🔗';
    btn.title = isArabic ? 'مشاركة' : 'Share';
    btn.addEventListener('click', () => {
      navigator.share({ title: text, text, url }).catch(() => {});
    });
    container.appendChild(btn);
  } else {
    const openWin = (u) => window.open(u, '_blank');
    const wa = document.createElement('button');
    wa.textContent = '💬';
    wa.title = 'WhatsApp';
    wa.addEventListener('click', () =>
      openWin(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`)
    );
    const fb = document.createElement('button');
    fb.textContent = '📘';
    fb.title = 'Facebook';
    fb.addEventListener('click', () =>
      openWin(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
    );
    const tw = document.createElement('button');
    tw.textContent = '🐦';
    tw.title = 'X';
    tw.addEventListener('click', () =>
      openWin(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
    );
    const copy = document.createElement('button');
    copy.textContent = '🔗';
    copy.title = isArabic ? 'نسخ الرابط' : 'Copy link';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = '✅';
        setTimeout(() => (copy.textContent = '🔗'), 1500);
      } catch {}
    });
    [wa, fb, tw, copy].forEach((b) => container.appendChild(b));
  }
  return container;
}

async function fetchCreators() {
  const { data, error } = await supabase.from('creators').select('name,slug');
  if (!error && data) {
    creatorsMap = {};
    data.forEach((c) => {
      creatorsMap[c.name.toLowerCase()] = c.slug;
    });
  }
}

async function fetchData() {
  await fetchCreators();
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.error('❌ Error loading data:', error);
    return;
  }

  console.log('✅ Fetched data from Supabase', data);

  // 🧹 تنظيف البيانات: فقط اللي عنده عنوان وصورة (أو thumb)
  allItems = data.filter(item => {
    const hasTitle = item.title || item.title_en || item.title_ar;
    const hasImage = item.thumb || (item.type === 'image' && item.link);
    return hasTitle && hasImage;
  });

  renderFiltered(true);
}

function renderFiltered(reset = false) {
  if (reset) itemsShown = batchSize;

  const searchValue =
    document.getElementById('search-input')?.value?.toLowerCase() || '';
  const selectedTypeRaw = document.getElementById('type-filter')?.value || '';
  const selectedType =
    selectedTypeRaw === 'images' ? 'image' : selectedTypeRaw;

  let filtered = allItems.filter((item) => {
    const matchesType = selectedType ? item.type === selectedType : true;
    const matchesSearch =
      (item.title_en || item.title_ar || '')
        .toLowerCase()
        .includes(searchValue) ||
      (item.creator_name || '')
        .toLowerCase()
        .includes(searchValue);
    const matchesCreatorParam = creatorParam
      ? (item.creator_name || '').toLowerCase() === creatorParam
      : true;
    return matchesType && matchesSearch && matchesCreatorParam;
  });

  if (shuffleEnabled) {
    filtered = filtered.sort(() => Math.random() - 0.5);
  }

  const pageItems = filtered.slice(0, itemsShown);

  const hasData = {};
  sections.forEach((s) => {
    hasData[s] = false;
    const cont = document.querySelector(`#${s} .gallery-grid`);
    if (cont) cont.innerHTML = '';
  });

  pageItems.forEach((item) => {
    const section = Object.keys(sectionMap).find((k) => sectionMap[k] === item.type);
    const container = document.querySelector(`#${section} .gallery-grid`);
    if (!container) return;
    hasData[section] = true;

    const imgSrc = item.type === 'image' ? item.link : item.thumb || '';
    const card = document.createElement('div');
    card.className = 'gallery-card show';

    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = item.title_en || '';
      img.loading = 'lazy';
      img.className = 'clickable-image';
      card.appendChild(img);
    }

    const creatorName = item.creator_name || item.creator;
    if (creatorName) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'gallery-meta';
      metaDiv.textContent = isArabic ? 'بواسطة ' : 'By ';
      const b = document.createElement('b');
      const slug = creatorsMap[creatorName.toLowerCase()];
      const a = document.createElement('a');
      a.textContent = creatorName;
      if (slug) {
        a.href = `creator${isArabic ? '-ar' : ''}.html?id=${encodeURIComponent(slug)}`;
      } else {
        a.href = `gallery${isArabic ? '-ar' : ''}.html?creator=${encodeURIComponent(creatorName)}`;
      }
      b.appendChild(a);
      metaDiv.appendChild(b);
      card.appendChild(metaDiv);
    }

    if (item.title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'gallery-title';
      titleDiv.textContent = item.title;
      card.appendChild(titleDiv);
    }

    if (item.type) {
      const badge = document.createElement('div');
      badge.className = 'gallery-badge';
      badge.textContent = item.type;
      card.appendChild(badge);
    }

    const descDiv = document.createElement('div');
    descDiv.className = 'gallery-desc';
    descDiv.textContent = item.desc_en || item.desc_ar || '';
    card.appendChild(descDiv);

    if (item.link && item.type !== 'image') {
      const link = document.createElement('a');
      link.href = item.link;
      link.target = '_blank';
      link.textContent = '🔗 View Work';
      card.appendChild(link);
    }

    const share = createShareButtons(item.link || window.location.href, item.title || '');
    card.appendChild(share);

    container.appendChild(card);
  });

  sections.forEach((s) => {
    const el = document.getElementById(s);
    if (el) el.style.display = hasData[s] ? '' : 'none';
  });

  const msg = document.getElementById('gallery-empty');
  if (filtered.length === 0) {
    if (!msg) {
      const p = document.createElement('p');
      p.id = 'gallery-empty';
      p.className = 'gallery-empty';
      p.textContent = isArabic ? 'لا يوجد محتوى بعد' : 'No approved content yet';
      document.querySelector('.gallery-intro .container')?.appendChild(p);
    }
  } else if (msg) {
    msg.remove();
  }

  const loadBtn = document.getElementById('load-more-btn');
  if (loadBtn) {
    if (itemsShown >= filtered.length) loadBtn.style.display = 'none';
    else loadBtn.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchData();

  const search = document.getElementById('search-input');
  const filter = document.getElementById('type-filter');

  const shuffleToggle = document.getElementById('shuffle-toggle');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (search) search.addEventListener('input', () => renderFiltered(true));
  if (filter) filter.addEventListener('change', () => renderFiltered(true));
  if (shuffleToggle)
    shuffleToggle.addEventListener('change', () => {
      shuffleEnabled = shuffleToggle.checked;
      renderFiltered(true);
    });
  if (loadMoreBtn)
    loadMoreBtn.addEventListener('click', () => {
      itemsShown += batchSize;
      renderFiltered();
    });
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('clickable-image')) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    const img = document.createElement('img');
    img.src = e.target.src;
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.remove());
  }
});

