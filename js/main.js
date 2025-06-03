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
      'https://mclcwqoecszpctglwwxz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbGN3cW9lY3N6cGN0Z2x3d3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTI2MDUsImV4cCI6MjA2MTUyODYwNX0.LuAyKXuDmt9afXzy-jaAtdMUKEOx0woxr5dTs0Yd0cs'
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
