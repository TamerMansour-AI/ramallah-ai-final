document.addEventListener('DOMContentLoaded', ()=> {
  // تفعيل قائمة الهاتف
  const btn = document.getElementById('nav-hamburger');
  const links = document.getElementById('navbar-links');
  if (btn) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }

  // ربط نموذج الاتصال مع Supabase
  const forms = [
    { id: 'contact-form', isArabic: false },
    { id: 'contact-form-ar', isArabic: true }
  ];

  // تأكد أنك أضفت مكتبة supabase من CDN في index.html أو contact.html
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) => {
    const supabase = createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    forms.forEach(({ id, isArabic }) => {
      const form = document.getElementById(id);
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.subject) delete data.subject;

        const { error } = await supabase.from('messages').insert([data]);

        if (error) {
          alert((isArabic ? 'خطأ: ' : 'Error: ') + (error.message || 'Unknown'));
        } else {
          alert(isArabic ? '✅ تم إرسال رسالتك بنجاح' : '✅ Your message was sent!');
          form.reset();
        }
      });
    });
  });
});
