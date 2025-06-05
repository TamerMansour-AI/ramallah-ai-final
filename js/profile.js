import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
const form = document.getElementById('profile-form')
const emailEl = document.getElementById('user-email')
const feedbackEl = document.getElementById('save-feedback')
let currentUser = null

async function loadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()
  if (error) return
  if (data) {
    form.name.value = data.name || ''
    form.avatar_url.value = data.avatar_url || ''
    form.bio.value = data.bio || ''
    form.slug.value = data.slug || ''
  }
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.replace('login.html')
    return
  }
  currentUser = session.user
  emailEl.textContent = currentUser.email
  await loadProfile()
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!currentUser) return
  const updates = {
    id: currentUser.id,
    name: form.name.value,
    avatar_url: form.avatar_url.value,
    bio: form.bio.value,
    slug: form.slug.value
  }
  const { error } = await supabase.from('profiles').upsert(updates)
  if (error) {
    feedbackEl.textContent = '❌ Failed to save'
    feedbackEl.className = 'feedback error'
  } else {
    feedbackEl.textContent = '✅ Saved'
    feedbackEl.className = 'feedback success'
  }
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.replace('login.html')
})

document.addEventListener('DOMContentLoaded', checkSession)
