import { SUPABASE_URL, SUPABASE_KEY } from './env.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function mountComments(wrapper, submissionId){
  wrapper.insertAdjacentHTML('beforeend',`
    <section id="comments">
      <h4>Comments</h4>
      <div id="commentsList" class="c-list"></div>
      <form id="cForm">
        <input  name="name" placeholder="Your name" required>
        <textarea name="body" rows="3" placeholder="Write a comment…" required></textarea>
        <button type="submit">Send</button>
      </form>
    </section>`);

  const listEl = wrapper.querySelector('#commentsList');
  const formEl = wrapper.querySelector('#cForm');

  async function load(){
    const { data } = await supabase
      .from('comments')
      .select('name,body,created_at')
      .eq('submission_id', submissionId)
      .order('created_at','asc');

    if(!data || data.length===0){
      listEl.innerHTML = '<em style="color:#777">No comments yet…</em>';
      return;
    }

    listEl.innerHTML = data.map(c=>`
      <div class="c-item">
        <strong>${c.name}</strong>
        <small>${new Date(c.created_at).toLocaleString()}</small>
        <p>${c.body}</p>
      </div>`).join('');
    /* scroll to newest */
    listEl.scrollTop = listEl.scrollHeight;
  }

  formEl.addEventListener('submit', async e=>{
    e.preventDefault();
    const fd = new FormData(formEl);
    const name = fd.get('name').toString().trim();
    const body = fd.get('body').toString().trim();
    if(!name||!body) return;
    await supabase.from('comments').insert({ submission_id: submissionId, name, body });
    formEl.reset();
    load();
  });

  load();
}
