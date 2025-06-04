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
    const p = document.createElement('p')
    p.textContent = isArabic ? 'لا يوجد مبدعون بعد.' : 'No creators yet.'
    grid.innerHTML = ''
    grid.appendChild(p)
    return
  }

  grid.innerHTML = ''
  data.forEach(row => {
    const link = document.createElement('a')
    link.className = 'creator-card'
    link.href = `creator${isArabic ? '-ar' : ''}.html?id=${encodeURIComponent(row.slug)}`

    const img = document.createElement('img')
    img.className = 'creator-photo'
    img.src = row.avatar_url || 'images/creators/avatar.png'
    img.alt = row.name
    img.onerror = function () {
      this.src = 'images/creators/avatar.png'
    }
    link.appendChild(img)

    const h3 = document.createElement('h3')
    h3.className = 'creator-name'
    h3.textContent = row.name
    link.appendChild(h3)

    const pDesc = document.createElement('p')
    pDesc.className = 'creator-desc'
    pDesc.textContent = row[bioField] ?? ''
    link.appendChild(pDesc)

    if (row.speciality) {
      const span = document.createElement('span')
      span.className = 'creator-type'
      span.textContent = row.speciality
      link.appendChild(span)
    }

    grid.appendChild(link)
  })
}

document.addEventListener('DOMContentLoaded', loadCreators)
