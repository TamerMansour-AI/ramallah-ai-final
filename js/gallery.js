@@
-const sections = ['image', 'music', 'video', 'blog', 'article', 'book'];
+const sections = ['image', 'music', 'video', 'blog', 'book'];
@@ function createCard(it) {
-  let thumb = it.thumb;
-  if (thumb && !thumb.startsWith('http')) {
-    const { data } = supabase.storage.from('uploads').getPublicUrl(thumb);
-    thumb = data.publicUrl;
-  }
+  let thumbUrl = '';
+  if (it.type === 'image') {
+    // Use the submission link directly for images
+    thumbUrl = it.link;
+  } else if (it.thumb) {
+    // Use provided thumbnail path (if any) for non-image types
+    thumbUrl = it.thumb;
+    if (thumbUrl && !thumbUrl.startsWith('http')) {
+      const { data } = supabase.storage.from('uploads').getPublicUrl(thumbUrl);
+      if (data.publicUrl) thumbUrl = data.publicUrl;
+    }
+  } else {
+    // Derive a placeholder for non-image types (e.g., YouTube video)
+    if (it.type === 'video' && it.link) {
+      const ytMatch = it.link.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
+      if (ytMatch) {
+        thumbUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
+      }
+    }
+    if (!thumbUrl) {
+      thumbUrl = 'assets/placeholder.png'; // generic placeholder image
+    }
+  }
-  img.src   = thumb || it.link;
+  img.src   = thumbUrl || it.link;
@@ function openModal(it) {
-  modalC.innerHTML = `
-    <img src="${it.thumb || it.link}" class="modal-media" alt="">
-    <button id="likeBtn" class="like-btn">🔥 <span>${it.likes}</span></button>
-    <div id="cWrap"></div>`;
-  mountComments(modalC.querySelector('#cWrap'), it.id);
-  modal.showModal();
+  const title = it.title_en || it.title_ar || '';
+  const creator = it.creator_name || it.creator || '';
+  const desc = it.desc_en || it.desc_ar || '';
+  modalC.innerHTML = `
+    <img src="${it.thumb || it.link}" class="modal-media" alt="">
+    <div class="modal-info">
+      ${ title ? `<h3>${title}</h3>` : '' }
+      ${ creator ? `<p><em>by ${creator}</em></p>` : '' }
+      ${ desc ? `<p>${desc}</p>` : '' }
+    </div>
+    <button id="likeBtn" class="like-btn">🔥 <span>${it.likes}</span></button>
+    <div id="cWrap"></div>
+    <div class="share-box">
+      <div id="share-buttons" class="share-icons"></div>
+      <span id="share-status" style="font-size:0.9rem;color:gray;"></span>
+    </div>`;
+  mountComments(modalC.querySelector('#cWrap'), it.id);
+  modal.showModal();
+  // Initialize share buttons (mobile share API fallback)
+  const shareContainer = modalC.querySelector('#share-buttons');
+  const shareStatus = modalC.querySelector('#share-status');
+  const isArabic = document.documentElement.lang === 'ar';
+  const shareTitle = title ? `${title} – Ramallah.ai` : 'Ramallah.ai';
+  const shareText = isArabic
+    ? (title ? `شاهد "${it.title_ar || it.title_en}" ضمن منصة Ramallah.ai` 
+             : 'شارك هذا عبر Ramallah.ai')
+    : (title ? `Check out "${title}" on Ramallah.ai` 
+             : 'Check this out on Ramallah.ai');
+  const shareUrl = window.location.origin + (isArabic ? '/gallery-ar.html' : '/gallery.html');
+  if (navigator.share && window.innerWidth < 768) {
+    const btn = document.createElement('button');
+    btn.textContent = '🔗';
+    btn.title = isArabic ? 'مشاركة' : 'Share';
+    btn.addEventListener('click', () => {
+      navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
+    });
+    shareContainer.appendChild(btn);
+  } else {
+    const openWin = (u) => window.open(u, '_blank');
+    // WhatsApp
+    const wa = document.createElement('button');
+    wa.textContent = '💬';
+    wa.title = 'WhatsApp';
+    wa.addEventListener('click', () =>
+      openWin(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`)
+    );
+    // Facebook
+    const fb = document.createElement('button');
+    fb.textContent = '📘';
+    fb.title = 'Facebook';
+    fb.addEventListener('click', () =>
+      openWin(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
+    );
+    // X (Twitter)
+    const tw = document.createElement('button');
+    tw.textContent = '🐦';
+    tw.title = 'X';
+    tw.addEventListener('click', () =>
+      openWin(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)
+    );
+    // Copy Link
+    const copyBtn = document.createElement('button');
+    copyBtn.textContent = '🔗';
+    copyBtn.title = isArabic ? 'نسخ الرابط' : 'Copy link';
+    copyBtn.addEventListener('click', async () => {
+      try {
+        await navigator.clipboard.writeText(shareUrl);
+        shareStatus.textContent = isArabic ? '📋 تم نسخ الرابط' : '📋 Link copied!';
+        setTimeout(() => (shareStatus.textContent = ''), 2000);
+      } catch {
+        shareStatus.textContent = isArabic ? '❌ لم يتم نسخ الرابط' : '❌ Failed to copy link.';
+      }
+    });
+    [wa, fb, tw, copyBtn].forEach(btn => shareContainer.appendChild(btn));
+  }
@@ (Like button handler remains unchanged)
