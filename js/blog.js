document.addEventListener('DOMContentLoaded', () => {
  const isArabic = document.documentElement.lang === 'ar';

  // Tag filtering
  const buttons = document.querySelectorAll('.tag-filter button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = btn.dataset.tag || '';
      document.querySelectorAll('article[data-tags]').forEach(article => {
        const tags = article.dataset.tags.split(',');
        if (!tag || tags.includes(tag)) {
          article.style.display = '';
        } else {
          article.style.display = 'none';
        }
      });
    });
  });

  // Likes and comments
  document.querySelectorAll('article[data-id]').forEach(article => {
    const id = article.dataset.id;
    const likeBtn = article.querySelector('.like-btn');
    const likeCount = article.querySelector('.like-count');
    const commentsList = article.querySelector('.comments-list');
    const form = article.querySelector('.comment-form');

    // Likes
    let count = parseInt(localStorage.getItem(`blog_like_${id}`)) || 0;
    likeCount.textContent = count;
    likeBtn.addEventListener('click', () => {
      count++;
      localStorage.setItem(`blog_like_${id}`, count);
      likeCount.textContent = count;
    });

    // Comments
    const loadComments = () => {
      const saved = JSON.parse(localStorage.getItem(`blog_comments_${id}`) || '[]');
      commentsList.innerHTML = '';
      saved.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name}: ${c.text}`;
        commentsList.appendChild(li);
      });
    };
    loadComments();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const text = form.comment.value.trim();
      if (!name || !text) return;
      const saved = JSON.parse(localStorage.getItem(`blog_comments_${id}`) || '[]');
      saved.push({name, text});
      localStorage.setItem(`blog_comments_${id}`, JSON.stringify(saved));
      form.reset();
      loadComments();
    });
  });
});
