// ===== UI Utilities =====

export function setLoading(p) {
  const bar = document.getElementById('loadingBar');
  if (bar) bar.style.width = p + '%';
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

export function insertAtCursor(ta, prefix, suffix = '') {
  const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
  const ins = prefix + v.substring(s, e) + suffix;
  ta.value = v.substring(0, s) + ins + v.substring(e);
  ta.selectionStart = ta.selectionEnd = s + ins.length;
  ta.focus();
}

// Tag helpers
export function tagClass(cat, menus) {
  const i = menus.findIndex(x => x.id === cat);
  return 'tag-' + (i >= 0 ? i % 7 : 0);
}

export function tagLabel(cat, menus) {
  const m = menus.find(x => x.id === cat);
  return m ? m.name : cat;
}

export function catIcon(cat, menus) {
  const m = menus.find(x => x.id === cat);
  return m ? m.icon : '📄';
}

// Article card renderer
export function articleCard(a, showTag, menus) {
  return `<div class="article-card" onclick="openArticle('${a.id}')">
    <div style="min-width:0">
      <div class="article-title">${catIcon(a.cat, menus)} ${a.title}</div>
      <div class="article-meta">${a.date} · ${a.author}${showTag ? ' · <span class="tag ' + tagClass(a.cat, menus) + '">' + tagLabel(a.cat, menus) + '</span>' : ''}</div>
    </div>
    <span style="color:#cbd5e0;font-size:20px;flex-shrink:0">›</span>
  </div>`;
}

// Render article body
export function renderBody(txt) {
  const lines = txt.split('\n');
  let html = '', inUl = false;
  for (let l of lines) {
    if (l.startsWith('- ')) {
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${l.slice(2)}</li>`;
    } else {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (l.startsWith('### ')) html += `<h3>${l.slice(4)}</h3>`;
      else if (l.startsWith('[!] ')) html += `<div class="note">ℹ️ ${l.slice(4)}</div>`;
      else if (/^\[img:(.+)\]$/.test(l)) {
        const u = l.match(/^\[img:(.+)\]$/)[1];
        html += `<img src="${u}" class="art-img" alt="gambar" onerror="this.outerHTML='<div style=\\"padding:10px;background:#fff5f5;color:#c53030;border-radius:6px;font-size:12px\\">⚠️ Gambar tidak dapat dimuat.</div>'">`;
      } else if (/^\[dl:(.+)\|(.+)\]$/.test(l)) {
        const m = l.match(/^\[dl:(.+)\|(.+)\]$/);
        html += `<a href="${m[2]}" target="_blank" rel="noopener" download="${m[1]}" class="dl-btn">⬇️ ${m[1]}</a>`;
      } else if (/^\[embed:(.+)\|(.+)\|(.+)\|(.+)\|(.+)\]$/.test(l)) {
        const m = l.match(/^\[embed:(.+)\|(.+)\|(.+)\|(.+)\|(.+)\]$/);
        html += `<div class="embed-wrap"><div class="embed-label">🔗 ${m[1]}</div><iframe src="${m[2]}" width="${m[3]}" height="${m[4]}" scrolling="${m[5]}" allowfullscreen></iframe></div>`;
      } else if (/^\[pdf:(.+)\|(.+)\|(.+)\]$/.test(l)) {
        const m = l.match(/^\[pdf:(.+)\|(.+)\|(.+)\]$/);
        html += `<div class="embed-wrap"><div class="embed-label">📄 ${m[1]}</div><iframe src="${m[2]}" width="100%" height="${m[3]}"></iframe></div><a href="${m[2]}" download="${m[1]}" class="dl-btn">⬇️ Download ${m[1]}</a>`;
      } else if (l.trim() === '') html += '<br>';
      else html += `<p>${l}</p>`;
    }
  }
  if (inUl) html += '</ul>';
  return html;
}