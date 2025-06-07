import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUserId = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) currentUserId = session.user.id;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUserId = session?.user?.id || null;
});

function initSubmitForms() {
  const form = document.querySelector('#ai-submit-form, #ai-submit-form-ar');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

    const fileInput = form.workFile;
    let uploadedURL = '';

    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        alert(lang === 'ar' ? 'فشل رفع الملف' : 'File upload failed');
        return;
      }

      const { data: publicURL } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      uploadedURL = publicURL.publicUrl;
    }

    const data = {
      creator_name: form.fullName.value,
      type: form.workType.value.toLowerCase(),
      link: uploadedURL || form.workLink?.value || '',
      title_en: lang === 'en' ? form.description.value : '',
      title_ar: lang === 'ar' ? form.description.value : '',
      desc_en: lang === 'en' ? form.description.value : '',
      desc_ar: lang === 'ar' ? form.description.value : '',
      profile_id: currentUserId,
      status: 'pending'
    };

    const { error } = await supabase.from('submissions').insert([data]);
    if (error) {
      alert(lang === 'ar' ? 'فشل الإرسال. حاول مجددًا.' : 'Submission failed. Please try again.');
      console.error(error);
      return;
    }

    const modalId = lang === 'ar' ? 'thank-you-modal-ar' : 'thank-you-modal';
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
    form.reset();

    const closeBtnId = lang === 'ar' ? 'close-modal-btn-ar' : 'close-modal-btn';
    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
  });
}

document.addEventListener('DOMContentLoaded', initSubmitForms);
