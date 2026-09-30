const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'kitchenflow:v2';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const items = arr => arr.map(t => ({ t, d: false }));

const DEFAULT = {
  timers: [], products: [], sound: true, theme: null,
  recent: [{ n: 'Pâtes', m: 9 }, { n: 'Riz', m: 12 }, { n: 'Œufs mollets', m: 6 }, { n: 'Fond brun', m: 45 }],
  lists: [
    { id: 'mep', name: 'Mise en place', items: items(['Vérifier les températures des frigos', 'Sortir et affûter les couteaux', 'Préparer les sauces de base', 'Étiqueter les bacs (nom et date)', 'Nettoyer le plan de travail']) },
    { id: 'close', name: 'Fermeture', items: items(['Couper les feux et le gaz', 'Filmer et ranger les produits', 'Vider les poubelles', 'Nettoyer les sols']) }
  ]
};

let S;
try { S = { ...structuredClone(DEFAULT), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { S = structuredClone(DEFAULT); }
['timers', 'products', 'recent', 'lists'].forEach(k => { if (!Array.isArray(S[k])) S[k] = structuredClone(DEFAULT)[k]; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ---------- Navigation ---------- */
function show(tab) {
  if (!$('#' + tab)) tab = 'service';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === tab));
  $$('[data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === tab));
  history.replaceState(null, '', '#' + tab);
  scrollTo({ top: 0 });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-go]');
  if (t) show(t.dataset.tab || t.dataset.go);
});

/* ---------- Thème et son ---------- */
function applyTheme() {
  if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme;
  $('#sound').textContent = S.sound ? '🔊' : '🔇';
}
$('#theme').onclick = () => {
  const dark = S.theme ? S.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  S.theme = dark ? 'light' : 'dark'; save(); applyTheme();
};
$('#sound').onclick = () => { S.sound = !S.sound; save(); applyTheme(); if (S.sound) beep(1); };

let ctx;
addEventListener('pointerdown', () => { try { ctx = ctx || new AudioContext(); ctx.resume(); } catch {} }, { once: true });
function beep(n = 3) {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (!S.sound || !ctx) return;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .4;
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
    o.start(t); o.stop(t + .3);
  }
}

/* ---------- Minuteurs ---------- */
const left = t => t.paused ? t.left : Math.max(0, t.end - Date.now());
const fmt = ms => {
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
};
function addTimer(n, m) {
  m = Math.max(1, Math.min(600, +m || 1));
  S.timers.unshift({ id: uid(), n, total: m * 6e4, end: Date.now() + m * 6e4, paused: false, left: 0, done: false });
  S.recent = [{ n, m }, ...S.recent.filter(r => !(r.n === n && r.m === m))].slice(0, 6);
  save(); render();
}
function ticketHTML(t) {
  const cls = t.done ? 'done' : t.paused ? 'paused' : '';
  return `<li class="ticket ${cls}" data-id="${t.id}">
    <div class="top2"><b>${esc(t.n)}</b><small>${Math.round(t.total / 6e4)} min</small></div>
    <div class="t-time" data-t>${fmt(left(t))}</div>
    <div class="bar"><i data-b style="width:${left(t) / t.total * 100}%"></i></div>
    <div class="act">
      ${t.done ? '' : `<button data-a="pause">${t.paused ? 'Reprendre' : 'Pause'}</button>`}
      <button data-a="plus">+1 min</button>
      <button data-a="del" class="x">${t.done ? 'Terminé' : 'Arrêter'}</button>
    </div></li>`;
}
function renderTimers() {
  const html = S.timers.length ? S.timers.map(ticketHTML).join('') : '<li class="empty">Aucun minuteur. Lance une cuisson ci-dessus.</li>';
  $('#t-list').innerHTML = html;
  $('#mini').innerHTML = S.timers.length ? html : '<li class="empty">Rien en cours pour le moment.</li>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const t = S.timers.find(x => x.id === b.closest('[data-id]').dataset.id); if (!t) return;
  if (b.dataset.a === 'del') S.timers = S.timers.filter(x => x !== t);
  if (b.dataset.a === 'plus') { t.total += 6e4; if (t.paused) t.left += 6e4; else t.end += 6e4; t.done = false; }
  if (b.dataset.a === 'pause') {
    if (t.paused) { t.end = Date.now() + t.left; t.paused = false; } else { t.left = left(t); t.paused = true; }
  }
  save(); render();
});
$('#f-timer').onsubmit = e => {
  e.preventDefault(); const f = e.target;
  addTimer(f.n.value.trim(), f.m.value); f.reset(); f.n.focus();
};
function tick() {
  let changed = false;
  S.timers.forEach(t => {
    if (!t.done && !t.paused && left(t) <= 0) { t.done = true; changed = true; beep(); }
    $$(`[data-id="${t.id}"]`).forEach(el => {
      $('[data-t]', el).textContent = fmt(left(t));
      $('[data-b]', el).style.width = left(t) / t.total * 100 + '%';
    });
  });
  if (changed) { save(); render(); }
  const d = new Date();
  $('#st-clock').textContent = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  $('#st-date').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ---------- Produits ---------- */
const dayDiff = d => Math.round((new Date(d + 'T00:00') - new Date(new Date().toDateString())) / 864e5);
function renderProducts() {
  const list = [...S.products].sort((a, b) => (a.d || '9') < (b.d || '9') ? -1 : 1);
  $('#p-list').innerHTML = list.length ? list.map(p => {
    let tag = '<span class="tag">Sans date</span>';
    if (p.d) {
      const n = dayDiff(p.d);
      tag = n < 0 ? '<span class="tag bad">Périmé</span>' : n === 0 ? '<span class="tag bad">Aujourd\'hui</span>'
        : n <= 2 ? `<span class="tag warn">J-${n}</span>` : `<span class="tag ok">J-${n}</span>`;
    }
    return `<li><div class="grow"><b>${esc(p.n)}</b> ${p.q ? `<small>· ${esc(p.q)}</small>` : ''}</div>${tag}
      <button class="x" data-p="${p.id}" aria-label="Supprimer ${esc(p.n)}">✕</button></li>`;
  }).join('') : '<li class="empty">Aucun produit. Ajoute ta première préparation.</li>';
}
$('#f-prod').onsubmit = e => {
  e.preventDefault(); const f = e.target;
  S.products.push({ id: uid(), n: f.n.value.trim(), q: f.q.value.trim(), d: f.d.value });
  save(); f.reset(); render();
};
$('#p-list').onclick = e => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  S.products = S.products.filter(p => p.id !== b.dataset.p); save(); render();
};

/* ---------- Checklists ---------- */
function renderLists() {
  $('#l-wrap').innerHTML = S.lists.map(l => {
    const done = l.items.filter(i => i.d).length, pct = l.items.length ? done / l.items.length * 100 : 0;
    return `<div class="card" data-l="${l.id}">
      <div class="meta"><h3>${esc(l.name)}</h3><span>${done}/${l.items.length}</span></div>
      <div class="prog"><i style="width:${pct}%"></i></div>
      ${l.items.map((i, k) => `<label><input type="checkbox" data-k="${k}" ${i.d ? 'checked' : ''}><span>${esc(i.t)}</span></label>`).join('')}
      <form><input name="t" placeholder="Ajouter une tâche" required maxlength="60"><button class="primary">Ajouter</button></form>
      <p><button data-reset>Tout décocher</button></p></div>`;
  }).join('');
}
$('#l-wrap').addEventListener('change', e => {
  const l = S.lists.find(x => x.id === e.target.closest('[data-l]').dataset.l);
  l.items[e.target.dataset.k].d = e.target.checked; save(); render();
});
$('#l-wrap').addEventListener('submit', e => {
  e.preventDefault();
  const l = S.lists.find(x => x.id === e.target.closest('[data-l]').dataset.l);
  l.items.push({ t: e.target.t.value.trim(), d: false }); save(); render();
});
$('#l-wrap').addEventListener('click', e => {
  if (!e.target.closest('[data-reset]')) return;
  const l = S.lists.find(x => x.id === e.target.closest('[data-l]').dataset.l);
  l.items.forEach(i => i.d = false); save(); render();
});

/* ---------- Accueil ---------- */
function renderHome() {
  $('#st-timers').textContent = S.timers.filter(t => !t.done).length;
  $('#st-tasks').textContent = S.lists.reduce((n, l) => n + l.items.filter(i => i.d).length, 0);
  $('#st-prods').textContent = S.products.length;
  $('#recent').innerHTML = S.recent.map((r, i) => `<button data-r="${i}">${esc(r.n)} · ${r.m} min</button>`).join('');
}
$('#recent').onclick = e => {
  const b = e.target.closest('[data-r]'); if (!b) return;
  const r = S.recent[b.dataset.r]; addTimer(r.n, r.m); show('timers');
};

function render() { renderTimers(); renderProducts(); renderLists(); renderHome(); }

show(location.hash.slice(1) || 'service');
applyTheme(); render(); tick(); setInterval(tick, 500);
