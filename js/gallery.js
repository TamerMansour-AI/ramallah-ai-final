import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// إعداد الاتصال بـ Supabase
const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

let visitorIP = '';
let visitorHash = '';
async function hashIP(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
async function fetchIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    visitorIP = json.ip;
    visitorHash = await hashIP(visitorIP);
  } catch {}
}
const fetchIPPromise = fetchIP();

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
let profilesMap = {};
const batchSize = 12;
let offset = 0;
let loading = false;
let reachedEnd = false;
let sortOrder = 'newest';
let likeCounts = {};
const params = new URLSearchParams(window.location.search);
const creatorParam = (params.get('creator') || '').toLowerCase();

function getFallbackThumb(link) {
  if (!link) return '';
  const yt = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  return 'assets/icons/link.svg';
}
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

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,slug');
  if (!error && data) {
    profilesMap = {};
    data.forEach((p) => {
      profilesMap[p.id] = p.slug;
    });
  }
}

let likedItems = new Set();
async function fetchLikes(ids) {
  likeCounts = {};
  likedItems = new Set();
  if (!ids.length) return;
  const { data } = await supabase
    .from('likes')
    .select('submission_id, ip_hash')
    .in('submission_id', ids);
  if (data) {
    data.forEach((row) => {
      likeCounts[row.submission_id] = (likeCounts[row.submission_id] || 0) + 1;
      if (visitorHash && row.ip_hash === visitorHash) {
        likedItems.add(row.submission_id);
      }
    });
  }
}

async function fetchData(reset = false) {
  if (loading || (reachedEnd && !reset)) return;
  loading = true;
  if (reset) {
    offset = 0;
    reachedEnd = false;
    allItems = [];
  }

  await fetchCreators();
  await fetchProfiles();

  let query = supabase
    .from('submissions')
    .select('*, creators(slug)')
    .eq('status', 'approved');

  if (sortOrder === 'newest') {
    query = query.order('id', { ascending: false });
  } else if (sortOrder === 'oldest') {
    query = query.order('id', { ascending: true });
  } else if (sortOrder === 'likes') {
    query = query.order('id', { ascending: false });
  }

  query = query.range(offset, offset + batchSize - 1);

  const { data, error } = await query;

  if (error || !data) {
    console.error('❌ Error loading data:', error);
    loading = false;
    return;
  }

  await fetchLikes(data.map((i) => i.id));

  let list = data.filter((item) => {
    const hasTitle = item.title || item.title_en || item.title_ar;
    const thumb = item.thumb_url || item.thumb;
    const hasImage = thumb || (item.type === 'image' && item.link);
    return hasTitle && hasImage;
  });

  if (sortOrder === 'likes') {
    list.sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
  }

  allItems = allItems.concat(list);
  offset += data.length;
  if (data.length < batchSize) reachedEnd = true;

  renderFiltered(true);
  loading = false;
}

function renderFiltered(reset = false) {

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

  const pageItems = filtered;

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

    const thumb = item.thumb_url || item.thumb;
    const imgSrc = item.type === 'image' ? item.link : thumb || getFallbackThumb(item.link);
    const card = document.createElement('div');
    card.className = 'gallery-card show';
    card.dataset.id = item.id;

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
      const a = document.createElement('a');
      a.textContent = creatorName;
      let slug = null;
      if (item.profile_id) {
        slug = profilesMap[item.profile_id];
        if (slug) {
          a.href = `profile.html?slug=${encodeURIComponent(slug)}`;
        }
      }
      if (!slug) {
        slug =
          (item.creators && item.creators.slug) ||
          item.creator_slug ||
          creatorsMap[creatorName.toLowerCase()];
        if (slug) {
          a.href = `creator${isArabic ? '-ar' : ''}.html?id=${encodeURIComponent(slug)}`;
        } else {
          a.href = `gallery${isArabic ? '-ar' : ''}.html?creator=${encodeURIComponent(creatorName)}`;
        }
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

    const slug = item.id;
    let count = likeCounts[slug] || 0;
    const likeBox = document.createElement('div');
    likeBox.className = 'like-box';
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.textContent = '👍';
    const countSpan = document.createElement('span');
    countSpan.className = 'like-count';
    countSpan.textContent = count;
    likeBox.appendChild(likeBtn);
    likeBox.appendChild(countSpan);
    const likedKey = visitorIP ? `liked_${slug}_${visitorIP}` : `liked_${slug}`;
    if (localStorage.getItem(likedKey) || likedItems.has(slug)) {
      likeBtn.disabled = true;
      likeBtn.classList.add('liked');
      likeBtn.title = 'Liked ❤️';
    }
    likeBtn.addEventListener('click', async () => {
      if (localStorage.getItem(likedKey) || likedItems.has(slug)) return;
      const { error } = await supabase
        .from('likes')
        .insert({ submission_id: slug, ip_hash: visitorHash });
      if (!error) {
        count++;
        likeCounts[slug] = count;
        countSpan.textContent = count;
        likeBtn.disabled = true;
        likeBtn.classList.add('liked');
        likeBtn.title = 'Liked ❤️';
        likedItems.add(slug);
        localStorage.setItem(likedKey, '1');
      }
    });
    card.appendChild(likeBox);

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

}

document.addEventListener('DOMContentLoaded', () => {
  fetchIPPromise.then(() => fetchData(true));

  const search = document.getElementById('search-input');
  const filter = document.getElementById('type-filter');
  const sortSelect = document.getElementById('sort');
  const sentinel = document.getElementById('scroll-sentinel');

  const resetAndLoad = () => fetchData(true);
  if (search) search.addEventListener('input', resetAndLoad);
  if (filter) filter.addEventListener('change', resetAndLoad);
  if (sortSelect)
    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      resetAndLoad();
    });
  if (sentinel) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchData();
    }, { rootMargin: '200px' });
    obs.observe(sentinel);
  }
});

let previewDialog;

function closeModal() {
  if (previewDialog) previewDialog.close();
}

function openModal(item) {
  if (!previewDialog) {
    previewDialog = document.getElementById('preview-dialog');
    if (!previewDialog) {
      previewDialog = document.createElement('dialog');
      previewDialog.id = 'preview-dialog';
      document.body.appendChild(previewDialog);
    }
  }

  previewDialog.innerHTML = '';
  let media;
  if (item.type === 'image' && item.link) {
    media = document.createElement('img');
    media.src = item.link;
    media.alt = item.title || '';
  } else if (item.type === 'video' && item.link) {
    media = document.createElement('iframe');
    media.src = item.link;
    media.allowFullscreen = true;
  } else if (item.type === 'music' && item.link) {
    media = document.createElement('audio');
    media.controls = true;
    media.src = item.link;
  } else if (item.link) {
    media = document.createElement('iframe');
    media.src = item.link;
    media.allowFullscreen = true;
  }
  if (media) {
    media.className = 'modal-media';
    previewDialog.appendChild(media);
  }
  if (item.title) {
    const p = document.createElement('p');
    p.textContent = item.title;
    previewDialog.appendChild(p);
  }

  previewDialog.addEventListener('click', (e) => {
    if (e.target === previewDialog) closeModal();
  });
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') closeModal();
    },
    { once: true }
  );
  previewDialog.showModal();
}

document.addEventListener('click', function (e) {
  const card = e.target.closest('.gallery-card');
  if (!card) return;
  if (
    e.target.closest('a') ||
    e.target.closest('.like-btn') ||
    e.target.closest('.share-icons')
  ) {
    return;
  }
  const id = parseInt(card.dataset.id, 10);
  const item = allItems.find((i) => i.id === id);
  if (item) openModal(item);
});

