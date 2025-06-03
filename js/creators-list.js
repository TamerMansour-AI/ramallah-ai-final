import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)

const isArabic = document.documentElement.lang === 'ar'
const bioField = isArabic ? 'bio_ar' : 'bio_en'
const grid = document.getElementById('creators-list')

async function loadCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('inserted_at', { ascending: false })

  if (error) {
    console.error('❌ Error loading creators:', error)
    return
  }

  if (!data.length) {
    grid.innerHTML = isArabic
      ? '<p>لا يوجد مبدعون بعد.</p>'
      : '<p>No creators yet.</p>'
    return
  }

  grid.innerHTML = data.map(row => `
    <a class="creator-card" href="creator${isArabic ? '-ar' : ''}.html?id=${encodeURIComponent(row.slug)}">
      <img class="creator-photo" src="${row.avatar_url || 'images/creators/avatar.png'}"
           onerror="this.src='images/creators/avatar.png';" alt="${row.name}">
      <h3 class="creator-name">${row.name}</h3>
      <p class="creator-desc">${row[bioField] ?? ''}</p>
      ${row.speciality ? `<span class="creator-type">${row.speciality}</span>` : ''}
    </a>
  `).join('')
}

document.addEventListener('DOMContentLoaded', loadCreators)
