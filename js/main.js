document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const btn = document.getElementById('nav-hamburger');
  const links = document.getElementById('navbar-links');
  if (btn) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }

  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.classList.add('shadow');
      } else {
        navbar.classList.remove('shadow');
      }
    });
  }

  // Contact forms submission via Formspree
  const forms = [
    { id: 'contact-form', ar: false },
    { id: 'contact-form-ar', ar: true }
  ];

  forms.forEach(({ id, ar }) => {
    const form = document.getElementById(id);
    if (!form) return;
    const feedback = form.querySelector('.feedback');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);

      try {
        const res = await fetch('https://formspree.io/f/xrbpvebk', {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          if (feedback) {
            feedback.textContent = ar
              ? 'شكراً لك! سنتواصل معك قريباً.'
              : "Thank you! We'll be in touch soon.";
            feedback.className = 'feedback success';
          }
          form.reset();
        } else {
          throw new Error();
        }
      } catch (err) {
        if (feedback) {
          feedback.textContent = ar
            ? 'فشل الإرسال. حاول مجدداً.'
            : 'Message failed. Please try again.';
          feedback.className = 'feedback error';
        }
      }
    });
  });

  // Auto-expand textareas with maxlength + character counter
  document.querySelectorAll('textarea[maxlength]').forEach((ta) => {
    const counter = ta.parentElement.querySelector('.char-count');
    const max = parseInt(ta.getAttribute('maxlength'), 10);
    const update = () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
      if (counter) {
        const len = ta.value.length;
        counter.textContent = `${len}/${max}`;
        if (len > max * 0.9) counter.classList.add('warn');
        else counter.classList.remove('warn');
      }
    };
    ta.addEventListener('input', update);
    update();
  });

  // Simple success stories slider
  const carousel = document.querySelector('.story-carousel');
  if (carousel) {
    const slides = Array.from(carousel.children);
    let index = 0;
    const show = () => {
      slides.forEach((s, i) => {
        s.style.display = i === index ? 'block' : 'none';
      });
    };
    show();
    setInterval(() => {
      index = (index + 1) % slides.length;
      show();
    }, 5000);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.body.classList.remove('modal-open');
  }
});
