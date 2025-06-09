import { supabase, getUser } from './auth.js';
const form = document.getElementById('profile-form');

(async () => {
  const { data:{user} } = await getUser();
  if(!user){ location.href='index.html'; return; }

  // Fetch existing
  let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if(data){
    form.full_name.value = data.full_name || '';
    form.bio.value       = data.bio        || '';
    form.avatar_url.value = data.avatar_url|| '';
  }

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const updates = {
      id: user.id,
      full_name: form.full_name.value,
      bio: form.bio.value,
      avatar_url: form.avatar_url.value,
      updated_at: new Date()
    };
    const { error } = await supabase.from('profiles').upsert(updates,{ returning:'minimal' });
    if(error) alert(error.message); else alert('✅ Saved!');
  });
})();
