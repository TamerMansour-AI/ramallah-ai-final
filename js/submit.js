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
  const progress = form.querySelector('progress');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

    const fileInput = form.workFile;
    const linkEl = form.workLink;
    let uploadedURL = '';

    if (submitBtn) submitBtn.disabled = true;
    if (progress) {
      progress.value = 0;
      progress.style.display = 'block';
    }

    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        alert(lang === 'ar' ? 'فشل رفع الملف' : 'File upload failed');
        if (submitBtn) submitBtn.disabled = false;
        if (progress) progress.style.display = 'none';
        return;
      }

      const { data: publicURL } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      uploadedURL = publicURL.publicUrl;
    }
    if (progress) progress.value = 100;

    const linkVal = linkEl ? linkEl.value.trim() : '';
    const data = {
      creator_name: form.fullName.value,
      type: form.workType.value.toLowerCase(),
      link: uploadedURL || linkVal || '',
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
      if (submitBtn) submitBtn.disabled = false;
      if (progress) progress.style.display = 'none';
      return;
    }

    alert(lang === 'ar' ? 'شكراً! تم استلام مشاركتك.' : 'Thanks! Your submission was received.');

    const modalId = lang === 'ar' ? 'thank-you-modal-ar' : 'thank-you-modal';
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      setTimeout(() => { modal.style.display = 'none'; }, 4000);
      const esc = (ev) => {
        if (ev.key === 'Escape') {
          modal.style.display = 'none';
          document.removeEventListener('keydown', esc);
        }
      };
      document.addEventListener('keydown', esc);
    }
    form.reset();

    const closeBtnId = lang === 'ar' ? 'close-modal-btn-ar' : 'close-modal-btn';
    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (modal) modal.style.display = 'none';
      };
    }

    if (submitBtn) submitBtn.disabled = false;
    if (progress) progress.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', initSubmitForms);
