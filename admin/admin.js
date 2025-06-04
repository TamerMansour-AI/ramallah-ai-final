import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const PASSWORD = 'ramallah2025';
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const loginBox = document.getElementById('login-box');
const approvalPanel = document.getElementById('approval-panel');
const tableBody = document.querySelector('#submissions-table tbody');

document.getElementById('login-btn').addEventListener('click', () => {
  const val = document.getElementById('admin-password').value.trim();
  if (val === PASSWORD) {
    loginBox.style.display = 'none';
    approvalPanel.style.display = 'block';
    fetchPending(); // ✅ this is now called correctly after login
  } else {
    alert('Incorrect password');
  }
});

async function fetchPending() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending'); // ✅ using the correct field

  if (error) {
    alert('❌ Failed to load submissions');
    console.error(error);
    return;
  }

  tableBody.innerHTML = '';
  data.forEach((row) => {
    const tr = document.createElement('tr');

    const tdCreator = document.createElement('td');
    tdCreator.textContent = row.creator_name || row.creator || '-';
    tr.appendChild(tdCreator);

    const tdType = document.createElement('td');
    tdType.textContent = row.type || '-';
    tr.appendChild(tdType);

    const tdTitle = document.createElement('td');
    tdTitle.textContent = row.title_en || row.title_ar || row.title || '-';
    tr.appendChild(tdTitle);

    const tdThumb = document.createElement('td');
    if (row.thumb || row.link) {
      const img = document.createElement('img');
      img.src = row.thumb || row.link;
      img.alt = '';
      img.style.width = '80px';
      img.style.borderRadius = '8px';
      tdThumb.appendChild(img);
    } else {
      tdThumb.textContent = '-';
    }
    tr.appendChild(tdThumb);

    const tdDesc = document.createElement('td');
    tdDesc.textContent = row.desc_en || row.desc_ar || '-';
    tr.appendChild(tdDesc);

    const tdAction = document.createElement('td');
    const btn = document.createElement('button');
    btn.dataset.id = row.id;
    btn.textContent = 'Approve ✅';
    btn.className = 'approve-btn';
    tdAction.appendChild(btn);

    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    tdAction.appendChild(feedback);
    tr.appendChild(tdAction);

    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener('click', async (e) => {
  if (e.target.matches('button.approve-btn')) {
    const id = e.target.dataset.id;
    const feedback = e.target.nextElementSibling;

    const { error } = await supabase
      .from('submissions')
      .update({ status: 'approved' }) // ✅ match schema exactly
      .eq('id', id);

    if (error) {
      feedback.textContent = 'Error!';
      console.error(error);
    } else {
      feedback.textContent = 'Approved!';
      setTimeout(() => e.target.closest('tr').remove(), 500);
    }
  }
});
