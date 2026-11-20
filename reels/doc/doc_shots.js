// =====================================================================
//  «ТУРИСТ ОБЫКНОВЕННЫЙ» — nature-documentary parody. Shots, camera, overlays, captions.
//  Timings come from the narration (assets/vo_times.json, injected as T).
// =====================================================================
const PRICE_SITE = 225, PRICE_AZIZ = 185;
const LINES = {
  dubai: 'Дубай.',
  species: 'Каждую осень сюда прилетает удивительный вид — турист обыкновенный.',
  full: 'Он полон сил. И сразу совершает первую ошибку.',
  peak: 'Идёт на Бурдж-Халифу в самый пик.',
  queue: 'Очередь. Жара.',
  icecream: 'Мороженое не выживет.',
  m2: 'Ошибка вторая. Билет на официальном сайте — 225 дирхамов.',
  twitch: 'Глаз начинает дёргаться.',
  m3: 'Ошибка третья — экскурсия у гида в отеле.',
  wallet: 'Кошелёк пустеет быстрее, чем хотелось бы.',
  nature: 'Но природа всё предусмотрела. На помощь приходит местный житель — верблюд Бархан.',
  knows: 'Он знает, к кому идти.',
  tickets: 'Билеты у Азиза. Бурдж-Халифа — 185 дирхамов.',
  guide: 'Гид на русском. Оплата при встрече.',
  all: 'Аквапарки, яхты, сафари — всё в одном месте.',
  rare: 'Перед нами редчайшее явление природы.',
  noerr: 'Отпуск без ошибок.',
  cta: 'Пишите Азизу: Азиз Дубай Гайд.',
};
// ---- word timing (weights ≈ syllables; numbers are spoken long)
const WORDS = {};
for (const [k, s] of Object.entries(LINES)) {
  const ws = s.split(' ').filter(w => w !== '—');
  const wt = ws.map(w => /\d/.test(w) ? 9 : Math.max(1, (w.match(/[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g) || []).length) + (/[.,:]$/.test(w) ? .8 : 0));
  const tot = wt.reduce((a, b) => a + b, 0); const [a, b] = T[k]; let acc = 0;
  WORDS[k] = ws.map((w, i) => { const s0 = a + (b - a) * acc / tot; acc += wt[i]; return { w, s: s0, e: a + (b - a) * acc / tot }; });
}
const wAt = (k, i) => WORDS[k][Math.min(i, WORDS[k].length - 1)].s;   // start time of the i-th word

// ---------------------------------------------------------------- layers & camera
const layer = document.createElement('canvas'); layer.width = W; layer.height = H; const lctx = layer.getContext('2d');
function blurred(px, fn) { // draw fn into an offscreen layer, composite with depth-of-field blur
  const prev = g; g = lctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.save(); fn(); g.restore(); g = prev;
  g.save(); if (px > .3) g.filter = `blur(${px}px)`; g.drawImage(layer, 0, 0); g.restore();
}
function handheld(t, amp = 1, zoom = 1, cx = W / 2, cy = H / 2) { // documentary long-lens camera
  const dx = (Math.sin(t * .9) * 7 + Math.sin(t * 2.3 + 1) * 3 + Math.sin(t * 5.1) * 1.2) * amp;
  const dy = (Math.sin(t * .7 + 2) * 6 + Math.sin(t * 2.9) * 2.5) * amp;
  const r = Math.sin(t * .6 + 4) * .004 * amp;
  g.translate(cx + dx, cy + dy); g.rotate(r); g.scale(zoom, zoom); g.translate(-cx, -cy);
}
const crash = (t, t0, k = .35) => t < t0 ? 0 : (1 - Math.exp(-(t - t0) * 14)) * k;   // snap zoom (comedy beat)
const blink = (t, seed = 0) => { const p = (t + seed * 1.7) % 3.4; return p < .12 ? .08 : 1; };
const breath = (t, seed = 0) => Math.sin(t * 2.1 + seed) * 4;
function squash(x, y, sx, sy, fn) { g.save(); g.translate(x, y); g.scale(sx, sy); g.translate(-x, -y); fn(); g.restore(); }
const hop = (t, t0, d = .55) => { const p = prog(t, t0, t0 + d); if (p <= 0 || p >= 1) return { y: 0, sx: 1, sy: 1 };
  if (p < .18) { const q = p / .18; return { y: 0, sx: 1 + .12 * Math.sin(q * Math.PI), sy: 1 - .14 * Math.sin(q * Math.PI) }; }    // anticipation
  if (p < .82) { const q = (p - .18) / .64; return { y: -Math.sin(q * Math.PI) * 170, sx: .94, sy: 1.08 }; }                       // stretch in the air
  const q = (p - .82) / .18; return { y: 0, sx: 1 + .1 * Math.sin(q * Math.PI), sy: 1 - .12 * Math.sin(q * Math.PI) }; };           // landing squash

// ---------------------------------------------------------------- overlays
const LOGO = new Image(); LOGO.src = 'assets/logo_aziz.png';
function logo(x, y, size, alpha = 1) { if (!LOGO.complete || !LOGO.naturalWidth) return; const h = size * 2.43, w = h * LOGO.naturalWidth / LOGO.naturalHeight;
  g.save(); g.globalAlpha *= alpha * .61; g.drawImage(LOGO, x - w / 2, y - h * .695, w, h); g.restore(); }
function viewfinder(t, zoomLabel = '40×') {
  g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 6; const m = 60, L = 90, top = 230, bot = 1500;
  [[m, top, 1, 1], [W - m, top, -1, 1], [m, bot, 1, -1], [W - m, bot, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke(); });
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(W / 2 - 30, 865); g.lineTo(W / 2 + 30, 865); g.moveTo(W / 2, 835); g.lineTo(W / 2, 895); g.stroke();
  if (Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(m + 34, top + 50, 14, 0, TAU); g.fill(); }
  txt('REC', m + 60, top + 52, 34, '#fff', { al: 'left', w: 800 });
  const fr = Math.floor(t * 30) % 30, sec = Math.floor(t) % 60;
  txt(`00:14:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, W - m - 10, top + 52, 30, '#fff', { al: 'right', fam: '"JetBrains Mono", monospace', w: 700 });
  txt(zoomLabel, W - m - 10, bot - 40, 30, '#fff', { al: 'right', fam: '"JetBrains Mono", monospace', w: 700 });
  g.restore();
}
function chapter(t, t0, title, sub) { // «ОШИБКА №1» slam
  const p = prog(t, t0, t0 + .22); if (p <= 0) return;
  const s = lerp(2, 1, eOut(p));
  g.save(); g.translate(540, 360); g.rotate(-.035); g.scale(s, s); g.globalAlpha = clamp(p * 3);
  rr(-290, -64, 580, 128, 24); g.fillStyle = '#e8443a'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  txt(title, 0, 4, 78, '#fff'); g.restore();
  if (sub) { const q = prog(t, t0 + .25, t0 + .55); if (q > 0) { g.save(); g.globalAlpha = q; g.font = `800 48px ${F}`; const w = g.measureText(sub).width + 64; rr(540 - w / 2, 448, w, 84, 42); g.fillStyle = 'rgba(12,12,30,.82)'; g.fill(); txt(sub, 540, 491, 48, '#fff', { w: 800 }); g.restore(); } }
}
function speciesCard(t, t0, name, latin, facts, y = 1130) { // field-guide card
  const p = prog(t, t0, t0 + .35); if (p <= 0) return;
  g.save(); g.translate(0, y + (1 - eOut(p)) * 60); g.globalAlpha = clamp(p * 2);
  rr(90, -120, 900, 240, 18); g.fillStyle = 'rgba(250,244,228,.97)'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  g.strokeStyle = '#6b5a3e'; g.lineWidth = 3; rr(104, -106, 872, 212, 12); g.stroke();
  g.fillStyle = '#e8443a'; g.fillRect(104, -106, 14, 212);
  txt(name, 150, -52, 54, '#2a2018', { al: 'left' });
  txt(latin, 150, 4, 34, '#7a6248', { al: 'left', w: 600, fam: `Georgia, serif` });
  txt(facts, 150, 62, 30, '#4a3c2c', { al: 'left', w: 700 });
  g.restore();
}
function captions(t) {
  for (const [k, ws] of Object.entries(WORDS)) {
    const [a, b] = T[k]; if (t < a - .05 || t > b + .25) continue;
    // chunk into groups of ≤ 3 words / 24 chars
    const chunks = []; let cur = [];
    ws.forEach(w => { const len = cur.map(x => x.w).join(' ').length + w.w.length; if (cur.length && (cur.length >= 3 || len > 22)) { chunks.push(cur); cur = []; } cur.push(w); });
    if (cur.length) chunks.push(cur);
    const ch = chunks.find((c, i) => t < (chunks[i + 1] ? chunks[i + 1][0].s : b + .25)) || chunks[chunks.length - 1];
    g.save(); g.font = `900 64px ${F}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
    const parts = ch.map(w => w.w); const widths = parts.map(s => g.measureText(s).width), sp = 18;
    const tw = widths.reduce((a2, b2) => a2 + b2, 0) + sp * (parts.length - 1); let x = 540 - tw / 2; const y = 1420;
    const pop = back(prog(t, ch[0].s - .05, ch[0].s + .12), 2); g.translate(540, y); g.scale(lerp(.85, 1, pop), lerp(.85, 1, pop)); g.translate(-540, -y);
    ch.forEach((w, i) => { const on = t >= w.s; g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(parts[i], x, y); g.fillStyle = on ? (t < w.e + .05 ? '#ffd34d' : '#fff') : 'rgba(255,255,255,.55)'; g.fillText(parts[i], x, y); x += widths[i] + sp; });
    g.restore();
  }
}

// ---------------------------------------------------------------- props
function iceCream(x, y, melt, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#e0a45a'; g.beginPath(); g.moveTo(-26, -10); g.lineTo(26, -10); g.lineTo(0, 70); g.closePath(); g.fill();
  g.strokeStyle = '#b97a35'; g.lineWidth = 3; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-20 + k * 10, -5); g.lineTo(k * 10 + 8, 50); g.stroke(); }
  if (melt < 1) { g.fillStyle = '#ffb3c7'; g.beginPath(); g.ellipse(0, -22 + melt * 14, 32 - melt * 6, 30 - melt * 12, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-10, -34 + melt * 14, 7, 0, TAU); g.fill(); }
  g.fillStyle = '#ffb3c7'; for (let k = 0; k < 3; k++) { const dl = melt * (30 + k * 30); g.beginPath(); g.ellipse(-18 + k * 18, -6 + dl / 2, 7, 8 + dl / 2, 0, 0, TAU); g.fill(); }
  g.restore();
}
function suitcase(x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#ff7b39'; rr(-70, -150, 140, 190, 22); g.fill(); g.strokeStyle = '#b44d1c'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#ffd34d'; g.fillRect(-70, -70, 140, 18); g.fillStyle = '#333'; [-45, 45].forEach(wx => { g.beginPath(); g.arc(wx, 48, 13, 0, TAU); g.fill(); });
  g.strokeStyle = '#555'; g.lineWidth = 8; g.beginPath(); g.moveTo(-30, -150); g.lineTo(-30, -250); g.lineTo(30, -250); g.lineTo(30, -150); g.stroke(); g.restore(); }
function heat(t, y0, y1, a = .3) { g.save(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = lerp(y0, y1, i / 8); g.beginPath(); for (let x = 0; x <= W; x += 18) g.lineTo(x, y + Math.sin(x * .025 + t * 7 + i * 1.3) * 7); g.stroke(); } g.restore(); }
function sunsetSky(p) { return lg(0, 0, 0, H, [[0, `hsl(${lerp(205, 262, p)},${lerp(80, 45, p)}%,${lerp(66, 28, p)}%)`], [.6, `hsl(${lerp(195, 18, p)},${lerp(70, 85, p)}%,${lerp(80, 62, p)}%)`], [1, `hsl(${lerp(40, 25, p)},85%,${lerp(78, 60, p)}%)`]]); }
function queuePeople(t, p, x0 = 540, y0 = 1330, rows = 4) {
  for (let i = 0; i < rows * 10; i++) { const row = Math.floor(i / 10), k = i % 10, dir = row % 2 ? -1 : 1; const qx = x0 + dir * (k - 4.5) * 80, qy = y0 + row * 68;
    const sway = Math.sin(t * 2 + i) * 3, droop = p * 10;
    g.fillStyle = ['#ff7b39', '#1fa59a', '#8a5bff', '#ffd34d', '#ff3d8b', '#35a0ff'][i % 6]; rr(qx - 19 + sway, qy - 72 + droop * .3, 38, 62 - droop * .3, 15); g.fill();
    g.fillStyle = '#f2c29a'; g.beginPath(); g.arc(qx + sway, qy - 88 + droop, 16, 0, TAU); g.fill();
    g.fillStyle = 'rgba(40,10,60,.22)'; g.beginPath(); g.ellipse(qx, qy - 6, 24, 6, 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#c9a54a'; g.lineWidth = 6; for (let r = 0; r < rows; r++) { g.beginPath(); g.moveTo(70, y0 + 15 + r * 68); g.lineTo(1010, y0 + 15 + r * 68); g.stroke(); }
}
function dunes(t, p, night = 0) {
  g.fillStyle = lg(0, 0, 0, H, night ? [[0, '#0b1230'], [1, '#2a2f5a']] : [[0, '#4b3a8a'], [.5, '#ff8a5c'], [1, '#ffcf8f']]); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,225,150,.95)'; g.beginPath(); g.arc(560, 960, 150, 0, TAU); g.fill();
  const sg = g.createRadialGradient(560, 960, 140, 560, 960, 520); sg.addColorStop(0, 'rgba(255,200,120,.5)'); sg.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = sg; g.fillRect(0, 400, W, 1100);
  [['#d98b52', 1060, 1000, 1110], ['#c4733e', 1300, 1220, 1340], ['#a95f33', 1560, 1480, 1600]].forEach(([c, a, m, b]) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, a); g.quadraticCurveTo(540, m, W, b); g.lineTo(W, H); g.lineTo(0, H); g.fill(); });
}

// ================================================================ SHOTS
const C = {}; // cut points derived from the narration
C.s1b = T.species[0] + 1.4; C.s2 = T.full[0] - .15; C.s3 = T.peak[0] - .2; C.ice = T.icecream[0] - .1; C.s4 = T.m2[0] - .2; C.tw = T.twitch[0] - .15;
C.s5 = T.m3[0] - .2; C.s6 = T.nature[0] - .25; C.s6b = T.knows[0] - .15; C.s7 = T.tickets[0] - .15; C.burj = wAt('tickets', 3) - .1; C.guide = T.guide[0] - .15;
C.aqua = T.all[0] - .1; C.yacht = wAt('all', 1) - .05; C.safari = wAt('all', 2) - .05; C.grid = wAt('all', 3) - .05; C.s8 = T.rare[0] - .3; C.s9 = T.cta[0] - .35;

// 1a · Dubai at sunrise, long lens, heat haze
shot(0, C.s1b, (l, t) => {
  g.save(); handheld(t, 1, 1 + l * .035);
  blurred(2.5, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#ffb98a'], [.45, '#ffd9ae'], [1, '#f3c08a']]); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,240,200,.95)'; g.beginPath(); g.arc(300, 820, 120, 0, TAU); g.fill(); skyline(1180, '#c79a8e', 3, 1.3); });
  skyline(1260, '#9a6f78', 9, 1.1); burj(640, 1270, 1150, '#7d5a72');
  g.fillStyle = lg(0, 1250, 0, H, [[0, '#e3b07c'], [1, '#c48a5c']]); g.fillRect(0, 1250, W, H);
  heat(t, 1080, 1300, .25);
  g.restore();
  viewfinder(t, '120×');
  const p = prog(l, .3, .9); if (p > 0) { g.save(); g.globalAlpha = p * (1 - prog(l, C.s1b - 1.2, C.s1b - .6)); txt('НАБЛЮДЕНИЕ', 540, 650, 44, '#fff', { track: 10, w: 800, glow: 'rgba(0,0,0,.5)' }); txt('Дубай, ноябрь', 540, 720, 72, '#fff', { glow: 'rgba(0,0,0,.5)' }); g.restore(); }
}, 'day');
// 1b · the species exits the airport → freeze + field-guide card
shot(C.s1b, C.s2, (l, t) => {
  const freeze = T.species[1] - .05, tt = t < freeze ? t : freeze;
  g.save(); handheld(tt, 1, 1 + crash(t, wAt('species', 6), .25), 600, 1300);
  blurred(5, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#86c8ff'], [.55, '#ffe2b0'], [1, '#ffcf8f']]); g.fillRect(0, 0, W, H);
    g.fillStyle = '#d7e6f2'; g.fillRect(0, 700, W, 650); g.fillStyle = '#9fc3dd'; for (let x = 20; x < W; x += 110) for (let y = 740; y < 1300; y += 120) g.fillRect(x, y, 96, 104);
    g.fillStyle = '#2a3a5a'; rr(330, 620, 420, 90, 14); g.fill(); txt('ARRIVALS  ✈', 540, 666, 48, '#ffd34d', { fam: `${F}, ${EMO}` });
    palmPot(110, 1250, 1.0, tt); palmPot(970, 1250, 1.0, tt); });
  g.fillStyle = lg(0, 1350, 0, H, [[0, '#e9cfa8'], [1, '#caa679']]); g.fillRect(0, 1350, W, H);
  const x = lerp(250, 620, prog(tt, C.s1b, freeze));
  suitcase(x - 230, 1830);
  seryoga(g, { x, y: 1840, s: 1.0, face: .55, walk: tt * 8, mouth: 'grin', eyeOpen: .8 * blink(tt), brow: .6, armL: [-.9, .2], pupil: [.6, -.2] }, DAY);
  g.restore();
  if (t >= freeze) { g.save(); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, W, H); g.restore(); }
  viewfinder(t, t >= freeze ? 'ПАУЗА' : '40×');
  speciesCard(t, freeze - .1, 'Турист обыкновенный', 'Turistus vulgaris', 'Ареал: пляжи, отели, очереди');
}, 'day');
// 2 · full of energy → first mistake
shot(C.s2, C.s3, (l, t) => {
  g.save(); handheld(t, 1, 1.05 + l * .02);
  blurred(4, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#7cc4ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H); skyline(1300, '#a9c3db', 21, 1.2); burj(820, 1310, 1100, '#8fb0cc'); });
  g.fillStyle = '#efdcc0'; g.fillRect(0, 1300, W, H);
  const h1 = hop(t, T.full[0] + .1), h2 = hop(t, T.full[0] + .75);
  const hp = h1.y || h2.y ? (h1.y ? h1 : h2) : (h1.sx !== 1 ? h1 : h2);
  const pointing = t > wAt('full', 4);
  squash(470, 1830, hp.sx, hp.sy, () => seryoga(g, { x: 470, y: 1830 + hp.y, s: 1.1, face: pointing ? .7 : .1, bob: breath(t), mouth: 'grin', eyeOpen: .7 * blink(t, 1), brow: .8,
    armL: hp.y ? [-2.7, .3] : [-.5, .3], armR: pointing ? [2.0, -.2] : hp.y ? [2.7, -.3] : [.5, -.3], pupil: [pointing ? 1 : 0, -.4] }, DAY));
  g.restore();
  viewfinder(t);
  chapter(t, wAt('full', 6), 'ОШИБКА №1', 'Бурдж-Халифа в самый пик');
}, 'day');
// 3 · queue time-lapse in the heat
shot(C.s3, C.ice, (l, t) => {
  const p = prog(t, T.peak[0], C.ice);
  g.save(); handheld(t, 1.2, 1.0 + p * .06, 700, 1500);
  g.fillStyle = sunsetSky(p * .6); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,250,220,.95)'; g.beginPath(); g.arc(lerp(860, 520, p), lerp(420, 360, p), 95, 0, TAU); g.fill();
  blurred(3, () => { skyline(1250, 'hsl(215,25%,68%)', 7, .9); burj(560, 1260, 1050, 'hsl(215,20%,60%)'); });
  g.fillStyle = lg(0, 1250, 0, H, [[0, '#e7c08e'], [1, '#c58f5d']]); g.fillRect(0, 1250, W, H);
  queuePeople(t, p);
  heat(t, 1150, 1350, .35);
  seryoga(g, { x: 820, y: 1840, s: .95, face: -.4, lean: p * .1, bob: breath(t) * .5, mouth: p > .45 ? 'frown' : 'flat', eyeOpen: lerp(1, .55, p) * blink(t, 2), brow: lerp(0, -.5, p), sweat: 1, blush: .5 + p * .4,
    armR: [.35, -1.45], prop: (gg, ex, ey) => iceCream(ex - 10, ey - 70, p * .6) }, p > .6 ? SUNSET : DAY);
  g.restore();
  const hh = lerp(14, 18.5, p); g.save(); rr(800, 540, 220, 86, 24); g.fillStyle = 'rgba(15,20,45,.8)'; g.fill(); g.restore();
  txt(`${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor(hh % 1 * 60)).padStart(2, '0')}`, 910, 585, 52, '#fff', { fam: '"JetBrains Mono", monospace', w: 800 });
  txt('42°C', 140, 585, 52, '#ffd34d', { glow: 'rgba(0,0,0,.4)' });
  viewfinder(t); chapter(t, -1, 'ОШИБКА №1', 'Бурдж-Халифа в самый пик');
}, 'day');
// 3b · insert: the ice cream doesn't survive
shot(C.ice, C.s4, (l, t) => {
  g.save(); handheld(t, .8, 1 + l * .05);
  blurred(14, () => { g.fillStyle = sunsetSky(.6); g.fillRect(0, 0, W, H); queuePeople(t, .7, 540, 1100, 6); });
  const melt = prog(t, C.ice + .1, wAt('icecream', 2) + .2), fall = prog(t, wAt('icecream', 2) + .25, wAt('icecream', 2) + .6);
  mitten(560, 1100, 3.2, -.2, DAY);
  iceCream(540, 820, Math.min(.99, melt), 4.2);
  if (fall > 0) { g.fillStyle = '#ffb3c7'; g.beginPath(); g.ellipse(560, lerp(700, 1900, eIn(fall)), 120, 110, 0, 0, TAU); g.fill(); }
  g.restore();
  viewfinder(t, 'МАКРО');
}, 'sunset');
// 4 · official website: 225 AED, then the eye twitch
shot(C.s4, C.tw, (l, t) => {
  g.save(); handheld(t, .9, 1 + crash(t, wAt('m2', 6) - .05, .14), 540, 1050);
  blurred(10, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#8fd0ff'], [1, '#f6d6aa']]); g.fillRect(0, 0, W, H); skyline(1400, '#a9c3db', 11, 1.2); });
  phoneDevice(540, 1080, 2.05, -.04, () => {
    g.fillStyle = '#f4f6fb'; g.fillRect(-160, -330, 320, 660);
    g.fillStyle = '#1b2a4a'; g.fillRect(-160, -330, 320, 70); txt('Официальный сайт', 0, -290, 18, '#fff', { w: 700 });
    burj(0, -60, 170, '#9fb6d1'); txt('Бурдж-Халифа · 124 этаж', 0, -30, 18, '#1b2a4a', { w: 800 });
    const pp = back(prog(t, wAt('m2', 6) - .05, wAt('m2', 6) + .25), 2.5); g.save(); g.translate(0, 40); g.scale(pp, pp); txt(`${PRICE_SITE} AED`, 0, 0, 60, '#e8443a'); g.restore();
    const pressed = t > wAt('m2', 7) + .3; rr(-120, 120, 240, 64, 32); g.fillStyle = pressed ? '#16a34a' : '#2563eb'; g.fill(); txt(pressed ? 'Оплачено ✓' : 'Купить', 0, 153, 26, '#fff', { w: 800 });
  });
  const tp = prog(t, wAt('m2', 7) - .2, wAt('m2', 7) + .25), back2 = prog(t, wAt('m2', 7) + .4, wAt('m2', 7) + .8);
  mitten(lerp(950, 610, eOut(tp) * (1 - eOut(back2))), lerp(1850, 1500, eOut(tp) * (1 - eOut(back2))), 1.5, -.5, DAY);
  g.restore();
  viewfinder(t); chapter(t, T.m2[0], 'ОШИБКА №2', 'Билет на официальном сайте');
}, 'day');
shot(C.tw, C.s5, (l, t) => {
  g.save(); handheld(t, 1.3, 1 + crash(t, wAt('twitch', 1), .45), 640, 1080);
  blurred(9, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#9ad5ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H); skyline(1500, '#b4cbe0', 13, 1.2); });
  const tw = t > wAt('twitch', 1) && Math.sin(t * 55) > .2 ? 1 : 0;
  seryoga(g, { x: 540, y: 2950, s: 2.3, face: 0, bob: breath(t), mouth: 'grit', eyeOpen: .95, brow: -.3, browTilt: .6, twitch: tw, sweat: 1 }, DAY);
  g.restore(); viewfinder(t, 'ZOOM'); chapter(t, -1, 'ОШИБКА №2', 'Билет на официальном сайте');
}, 'day');
// 5 · hotel desk, wallet empties, a moth escapes toward the lens
shot(C.s5, C.s6, (l, t) => {
  const empty = t > wAt('wallet', 1);
  g.save(); handheld(t, 1, 1 + l * .02 + crash(t, wAt('wallet', 1), .12), 520, 1300);
  blurred(5, () => {
    g.fillStyle = lg(0, 0, 0, H, [[0, '#3b2a4a'], [.5, '#8a5a4a'], [1, '#d9b48a']]); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,230,190,.22)'; [80, 980].forEach(x => g.fillRect(x - 50, 0, 100, 1350));
    const cg = g.createRadialGradient(540, 620, 10, 540, 620, 420); cg.addColorStop(0, 'rgba(255,220,140,.7)'); cg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = cg; g.fillRect(0, 200, W, 900);
    g.fillStyle = '#ffd98a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(400 + i * 35, 620 + Math.sin(i) * 20, 10, 0, TAU); g.fill(); }
    palmPot(120, 1240, .9, t); });
  g.fillStyle = '#efe3cf'; g.fillRect(0, 1350, W, H);
  g.fillStyle = 'rgba(120,90,70,.12)'; for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) if ((r + c) % 2) g.fillRect(c * 130 - r * 20, 1350 + r * 75, 130, 75);
  g.fillStyle = '#5a3324'; rr(580, 1200, 480, 330, 20); g.fill(); g.fillStyle = '#8b5136'; rr(560, 1180, 520, 50, 14); g.fill();
  g.fillStyle = '#1b2a4a'; rr(650, 920, 360, 110, 16); g.fill(); txt('ЭКСКУРСИИ', 830, 975, 46, '#ffd34d');
  const pay = prog(t, T.m3[1] - .4, wAt('wallet', 1)); const n = Math.floor(pay * 9);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#5fd38a' : '#4cbf78'; rr(720 + rnd(i) * 30, 1170 - i * 12, 170, 30, 6); g.fill(); g.strokeStyle = '#2e8f55'; g.lineWidth = 3; g.stroke(); }
  if (pay > 0 && pay < 1) { const k = (t * 3.4) % 1; g.save(); g.translate(lerp(580, 780, k), lerp(1170, 1100, k) - Math.sin(k * Math.PI) * 120); g.rotate(k * 5); g.fillStyle = '#5fd38a'; rr(-60, -16, 120, 32, 6); g.fill(); g.restore(); }
  seryoga(g, { x: 520, y: 1830, s: .95, face: .7, bob: breath(t), mouth: empty ? 'o' : 'flat', mouthOpen: 1, eyeOpen: (empty ? 1.3 : 1.05) * blink(t, 3), brow: empty ? 1 : .3, pupil: [empty ? 0 : 1, empty ? .6 : .3],
    armR: empty ? [2.0, -1.2] : pay > 0 ? [1.6 + Math.sin(t * 12) * .2, -.6] : [.42, -.25],
    prop: (gg, ex, ey) => { if (!empty) return; g.save(); g.translate(ex + 10, ey - 50); g.fillStyle = '#6b3d26'; rr(-60, -36, 120, 72, 10); g.fill(); g.fillStyle = '#e9d6c0'; rr(-46, 20, 34, 40, 6); g.fill(); rr(12, 20, 34, 40, 6); g.fill(); g.restore(); } }, ROOM);
  g.restore();
  const mp = prog(t, wAt('wallet', 2), C.s6); // the moth flies at the lens and grows huge
  if (mp > 0) { const s = lerp(1, 9, eIn(mp)); g.save(); g.translate(lerp(640, 540, mp) + Math.sin(t * 20) * 20 * (1 - mp), lerp(1150, 900, mp)); g.scale(s, s); g.fillStyle = '#c9b8a0'; const fl = Math.abs(Math.sin(t * 38));
    g.beginPath(); g.ellipse(-16, 0, 20, 12 * fl + 3, -.4, 0, TAU); g.ellipse(16, 0, 20, 12 * fl + 3, .4, 0, TAU); g.fill(); g.fillStyle = '#6d5a48'; g.beginPath(); g.ellipse(0, 0, 6, 14, 0, 0, TAU); g.fill(); g.restore(); }
  viewfinder(t); chapter(t, T.m3[0], 'ОШИБКА №3', 'Экскурсия у гида в отеле');
}, 'room');
// 6 · nature provides: Barkhan on the dune crest at golden hour
shot(C.s6, C.s6b, (l, t) => {
  g.save(); handheld(t, .7, 1.0 + l * .03, 540, 1200);
  dunes(t, 0);
  const walk = prog(t, wAt('nature', 6) - .6, wAt('nature', 9) + .3);
  barkhan(g, { x: lerp(-250, 420, eOut(walk)), y: 1350, s: .75, face: 1, walk: walk > 0 && walk < 1 ? t * 6 : null, chew: walk >= 1 ? t * 5 : 0, lid: blink(t, 4) < 1 ? .95 : .5, pupil: [1, 0], nod: walk >= 1 ? Math.sin(t * 2) * .3 : 0 }, SUNSET);
  g.fillStyle = 'rgba(169,95,51,.9)'; g.beginPath(); g.moveTo(0, 1500); g.quadraticCurveTo(540, 1440, W, 1520); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.restore();
  viewfinder(t, '80×');
  speciesCard(t, wAt('nature', 10) - .1, 'Бархан', 'Camelus helpus · местный житель', 'Знает, где купить выгоднее', 1130);
}, 'sunset');
// 6b · he knows where to go: Barkhan slides the phone with Aziz's chat
shot(C.s6b, C.s7, (l, t) => {
  g.save(); handheld(t, .9, 1.04);
  blurred(6, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#3b2a4a'], [1, '#d9b48a']]); g.fillRect(0, 0, W, H); palmPot(900, 1250, 1.2, t); });
  g.fillStyle = '#efe3cf'; g.fillRect(0, 1450, W, H);
  const push = eIO(prog(t, T.knows[0] + .1, T.knows[0] + .8));
  barkhan(g, { x: 60, y: 1820, s: 1.0, face: 1, chew: push < .05 ? t * 6 : 0, lid: .55, neck: push * .35, headTilt: push * .2, pupil: [1, .3] }, ROOM);
  if (push > 0) phoneDevice(lerp(420, 640, push), 1180, .5, .1, () => { g.fillStyle = '#fff3e2'; g.fillRect(-160, -330, 320, 660); g.fillStyle = '#0d1330'; g.fillRect(-160, -330, 320, 100);
    txt('Азиз | Гид', 0, -280, 34, '#fff'); txt('в сети', 0, -245, 26, '#35e0a0', { w: 700 }); rr(-130, -170, 260, 90, 24); g.fillStyle = '#fff'; g.fill(); txt('Помогу! 🙂', 0, -125, 30, '#1b2033', { fam: `${F}, ${EMO}` }); });
  const lit = t > T.knows[1] - .2;
  seryoga(g, { x: 800, y: 1950, s: 1.1, face: -.7, bob: breath(t), mouth: lit ? 'grin' : 'o', eyeOpen: (lit ? .8 : 1.2) * blink(t, 5), brow: 1, pupil: [-1, .2] }, ROOM);
  g.restore(); viewfinder(t);
}, 'room');
// 7 · the fix — clean warm look, no viewfinder
shot(C.s7, C.burj, (l, t) => { // tickets burst out of the phone
  g.save(); handheld(t, .5, 1.02);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#ffd59a'], [1, '#ffb27a']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { g.save(); g.translate(540, 900); g.rotate(i / 12 * TAU + t * .3); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, 1400); g.lineTo(90, 1400); g.fill(); g.restore(); }
  phoneDevice(540, 950, 1.3, 0, () => { g.fillStyle = '#fff3e2'; g.fillRect(-160, -330, 320, 660); g.fillStyle = '#0d1330'; g.fillRect(-160, -330, 320, 90); txt('Азиз | Гид в Эмиратах', 0, -285, 22, '#fff');
    rr(-140, -200, 280, 70, 22); g.fillStyle = '#d6f5c9'; g.fill(); txt('Билеты готовы ✅', 0, -165, 24, '#1b2033', { fam: `${F}, ${EMO}` }); });
  [['#ff7b39', 'Бурдж'], ['#1fa59a', 'Аквапарк'], ['#2563eb', 'Яхта'], ['#e8443a', 'Сафари']].forEach(([c, s], i) => { const p = prog(t, T.tickets[0] + .15 + i * .12, T.tickets[0] + .7 + i * .12); if (p <= 0) return;
    const a = -2.4 + i * .55, R = 520 * eOut(p); g.save(); g.translate(540 + Math.cos(a) * R, 900 + Math.sin(a) * R * .9); g.rotate(a * .3); g.scale(back(p), back(p));
    g.beginPath(); g.moveTo(-120, -60); g.lineTo(120, -60); g.lineTo(120, 60); g.lineTo(-120, 60); g.closePath(); g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0;
    g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, -50); g.lineTo(60, 50); g.stroke(); g.setLineDash([]); txt(s, -30, 2, 30, '#fff'); g.restore(); });
  g.restore();
}, 'warm');
shot(C.burj, C.guide, (l, t) => { // Burj, 185 AED
  g.save(); handheld(t, .5, 1.0 + l * .03);
  blurred(4, () => { g.fillStyle = lg(0, 0, 0, H, [[0, '#ffb98a'], [.5, '#ffe0b8'], [1, '#bfe3ff']]); g.fillRect(0, 0, W, H); skyline(1500, '#9fb7cf', 21, 1.3); });
  g.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 5; i++) g.fillRect(i * 260, 0, 12, H); g.fillStyle = '#2d3550'; g.fillRect(0, 1500, W, H);
  seryoga(g, { x: 380, y: 1900, s: 1.0, face: .4, bob: breath(t), mouth: 'grin', eyeOpen: .6 * blink(t, 6), brow: .6, armR: [2.7, -.2] }, DAY);
  const p = back(prog(t, wAt('tickets', 4) - .15, wAt('tickets', 4) + .2), 2);
  g.save(); g.translate(780, 760); g.rotate(.06 + Math.sin(t * 3) * .02); g.scale(p, p);
  rr(-230, -150, 460, 300, 34); g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  txt('Бурдж-Халифа', 0, -90, 40, '#1b2033'); txt(`${PRICE_SITE} AED`, -95, -20, 40, '#9aa0b5'); g.strokeStyle = '#e8443a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-180, -18); g.lineTo(-10, -24); g.stroke();
  txt(`${PRICE_AZIZ} AED`, 0, 60, 92, '#16a34a'); g.restore();
  g.restore();
}, 'warm');
shot(C.guide, C.aqua, (l, t) => { // guide in Russian · pay on meeting
  g.save(); handheld(t, .5, 1.02);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#8fd0ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H);
  blurred(5, () => { skyline(1350, '#a9c3db', 5, 1.1); burj(250, 1360, 900, '#94b2cf'); });
  g.fillStyle = '#efdcc0'; g.fillRect(0, 1350, W, H);
  g.save(); g.translate(720, 1520); g.fillStyle = '#fff'; rr(-280, -330, 560, 290, 40); g.fill(); g.fillStyle = '#9fd3ff'; rr(-240, -300, 200, 120, 18); g.fill(); rr(-10, -300, 200, 120, 18); g.fill();
  [-180, 180].forEach(wx => { g.fillStyle = '#222'; g.beginPath(); g.arc(wx, -40, 58, 0, TAU); g.fill(); g.fillStyle = '#aaa'; g.beginPath(); g.arc(wx, -40, 24, 0, TAU); g.fill(); }); g.restore();
  seryoga(g, { x: 300, y: 1900, s: 1.0, face: .5, bob: breath(t), mouth: 'grin', eyeOpen: .7 * blink(t, 7), brow: .5, armL: [-.4, .3], armR: [1.2, -1.6] }, DAY);
  [['Гид на русском', wAt('guide', 0)], ['Оплата при встрече', wAt('guide', 3)]].forEach(([s, t0], i) => { const p = back(prog(t, t0 - .05, t0 + .3), 2.2); if (p <= 0) return;
    g.save(); g.translate(540, 620 + i * 170); g.rotate(i ? .03 : -.03); g.scale(p, p); g.font = `900 60px ${F}`; const w = g.measureText(s).width + 160;
    rr(-w / 2, -66, w, 132, 66); g.fillStyle = '#16a34a'; g.shadowColor = 'rgba(0,60,20,.4)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; txt('✓ ' + s, 0, 4, 60, '#fff'); g.restore(); });
  g.restore();
}, 'warm');
function label(s, l) { const p = back(prog(l, .02, .25), 2); g.save(); g.translate(540, 352); g.scale(p, p); g.font = `900 64px ${F}`; const w = g.measureText(s).width + 90; rr(-w / 2, -56, w, 112, 56); g.fillStyle = 'rgba(15,15,40,.85)'; g.fill(); txt(s, 0, 3, 64, '#fff'); g.restore(); }
shot(C.aqua, C.yacht, (l, t) => {
  g.save(); handheld(t, .8, 1.04);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#6fd0ff'], [1, '#d9f6ff']]); g.fillRect(0, 0, W, H);
  g.strokeStyle = '#ff7b39'; g.lineWidth = 170; g.lineCap = 'round'; g.beginPath(); g.moveTo(-100, 500); g.bezierCurveTo(900, 600, 100, 1050, 700, 1350); g.stroke(); g.strokeStyle = '#ffb07a'; g.lineWidth = 120; g.stroke();
  g.fillStyle = '#1aa7e0'; g.fillRect(0, 1450, W, H);
  const k = eIn(prog(l, 0, .8)); seryoga(g, { x: lerp(0, 720, k), y: lerp(560, 1400, k) + Math.sin(k * 6) * 40, s: .8, face: .6, lean: -.5, mouth: 'grin', eyeOpen: .5, brow: 1, armL: [-2.8, 0], armR: [2.8, 0] }, DAY);
  g.restore(); label('Аквапарки', l);
}, 'warm');
shot(C.yacht, C.safari, (l, t) => {
  g.save(); handheld(t, .8, 1.04);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#7fc8ff'], [.6, '#ffe3c0'], [1, '#ffd0a0']]); g.fillRect(0, 0, W, H); skyline(1200, '#a7bfd6', 41, 1.3);
  g.fillStyle = lg(0, 1200, 0, H, [[0, '#1d8fc9'], [1, '#0b5f8f']]); g.fillRect(0, 1200, W, H);
  const bob = Math.sin(t * 3) * 10; g.save(); g.translate(560 - l * 60, 1430 + bob); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-420, -40); g.lineTo(380, -40); g.lineTo(470, -110); g.lineTo(330, 70); g.lineTo(-380, 70); g.closePath(); g.fill();
  g.fillStyle = '#1b2a4a'; g.fillRect(-380, 20, 710, 16); g.fillStyle = '#eef4fb'; rr(-260, -170, 380, 130, 30); g.fill(); g.restore();
  seryoga(g, { x: 700 - l * 60, y: 1390 + bob, s: .65, face: -.3, mouth: 'grin', eyeOpen: .55, brow: .8, armL: [-2.6, .4] }, DAY);
  g.restore(); label('Яхты', l);
}, 'warm');
shot(C.safari, C.grid, (l, t) => {
  g.save(); handheld(t, 1.1, 1.04); dunes(t, 0);
  const bump = Math.sin(t * 18) * 6;
  barkhan(g, { x: 230 + Math.sin(l * 2) * 20, y: 1500, s: .55, face: 1, walk: t * 12, lid: .3, pupil: [1, -.3] }, SUNSET);
  g.save(); g.translate(660, 1500 + bump); g.fillStyle = '#fff'; rr(-260, -230, 520, 170, 30); g.fill(); g.fillStyle = '#e8443a'; g.fillRect(-260, -150, 520, 20);
  [-170, 170].forEach(wx => { g.fillStyle = '#222'; g.beginPath(); g.arc(wx, -50, 62, 0, TAU); g.fill(); }); g.restore();
  seryoga(g, { x: 560, y: 1460 + bump, s: .5, face: -.4, mouth: 'grin', eyeOpen: .55, brow: 1, armL: [-2.7, .4] }, SUNSET);
  g.restore(); label('Сафари', l);
}, 'sunset');
shot(C.grid, C.s8, (l, t) => { // «всё в одном месте» — four panels snap together
  g.fillStyle = '#ffd34d'; g.fillRect(0, 0, W, H);
  const tiles = [['#ff9a6a', 'Бурдж-Халифа', '🏙️'], ['#35c8ff', 'Аквапарки', '🌊'], ['#2563eb', 'Яхты', '🛥️'], ['#e8843a', 'Сафари', '🐪']];
  tiles.forEach(([c, s, e], i) => { const p = eOut(prog(l, i * .08, .35 + i * .08)); const x = 290 + (i % 2) * 500, y = 560 + Math.floor(i / 2) * 540;
    g.save(); g.translate(x + (1 - p) * (i % 2 ? 600 : -600), y); g.rotate((i % 2 ? .03 : -.03)); rr(-235, -255, 470, 510, 34); g.fillStyle = c; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
    g.save(); g.font = `150px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(e, 0, -50); g.restore(); txt(s, 0, 150, 48, '#fff'); g.restore(); });
  const q = back(prog(l, .45, .75), 2); g.save(); g.translate(540, 300); g.scale(q, q); rr(-400, -70, 800, 140, 70); g.fillStyle = '#1b2033'; g.fill(); txt('всё в одном месте', 0, 4, 64, '#ffd34d'); g.restore();
}, 'warm');
// 8 · rare phenomenon: holiday without mistakes (viewfinder callback) → polaroid
shot(C.s8, C.s9, (l, t) => {
  const freeze = T.noerr[0] - .05, frozen = t >= freeze;
  g.save();
  if (frozen) { const p = eOut(prog(t, freeze, freeze + .6)); g.fillStyle = '#2a1d3a'; g.fillRect(0, 0, W, H); g.translate(540, 900); g.rotate(-.05 * p); g.scale(lerp(1, .8, p), lerp(1, .8, p)); g.translate(-540, -900); g.fillStyle = '#fffaf0'; g.fillRect(-20, -40, W + 40, H + 260); }
  g.save(); g.beginPath(); g.rect(frozen ? 40 : 0, frozen ? 40 : 0, frozen ? W - 80 : W, frozen ? 1700 : H); g.clip();
  const tt = frozen ? freeze : t; handheld(tt, 1, 1.0 + prog(tt, C.s8, freeze) * .08, 540, 1500);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#4a3480'], [.55, '#ff8f66'], [1, '#ffd29a']]); g.fillRect(0, 0, W, H);
  blurred(3, () => { skyline(1350, 'rgba(70,40,110,.6)', 31, 1.1); burj(540, 1360, 1250, 'rgba(60,35,100,.85)'); });
  g.fillStyle = '#e2a46c'; g.fillRect(0, 1350, W, H);
  barkhan(g, { x: 700, y: 1750, s: .95, face: -1, chew: frozen ? 0 : tt * 5, lid: .35, pupil: [-.3, -.4], headTilt: -.15, neck: .15 }, SUNSET);
  seryoga(g, { x: 360, y: 1880, s: 1.0, face: .3, bob: frozen ? 0 : breath(tt), mouth: 'grin', eyeOpen: .5, brow: .7, armR: [2.6, -.4], prop: (gg, ex, ey) => phoneDevice(ex + 20, ey - 60, .22, .2, () => { g.fillStyle = '#222'; g.fillRect(-160, -330, 320, 660); }) }, SUNSET);
  g.restore();
  if (frozen) txt('Отпуск без ошибок ✓', 540, 1860, 64, '#2a1d3a', { w: 800 });
  g.restore();
  if (!frozen) viewfinder(t, 'РЕДКОСТЬ');
  const f = 1 - prog(t, freeze, freeze + .3); if (frozen && f > 0) { g.fillStyle = `rgba(255,255,255,${f})`; g.fillRect(0, 0, W, H); }
}, 'sunset');
// 9 · end card
shot(C.s9, DUR + 1, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#0f3d8a'], [.6, '#1f6fd1'], [1, '#2a86e8']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.06 + rnd(i) * .08})`; g.beginPath(); g.ellipse((rnd(i + 1) * W + t * 12) % (W + 200) - 100, rnd(i + 2) * 900, 120 + rnd(i) * 160, 8, -.15, 0, TAU); g.fill(); }
  skyline(1700, 'rgba(10,40,100,.45)', 51, 1.2); burj(820, 1710, 900, 'rgba(10,40,100,.55)');
  const a = t0 => { const p = eOut(prog(l, t0, t0 + .45)); g.globalAlpha = p; return (1 - p) * 40; };
  let d = a(.05); txt('Не будьте', 540, 380 + d, 70, '#fff'); txt('туристом обыкновенным', 540, 470 + d, 70, '#ffd34d'); g.globalAlpha = 1;
  d = a(.6); txt('Билеты и экскурсии —', 540, 640 + d, 56, '#fff', { w: 800 }); txt('выгодно у Азиза', 540, 720 + d, 56, '#fff', { w: 800 }); g.globalAlpha = 1;
  const p = prog(l, .9, 1.4); g.save(); g.translate(540, 930); g.scale(lerp(.8, 1, back(p)), lerp(.8, 1, back(p))); g.globalAlpha = p; logo(0, 0, 92, 1.3); g.restore();
  d = a(1.5); rr(170, 1080 + d, 740, 110, 55); g.fillStyle = '#ffd34d'; g.fill(); txt('Пишите в Telegram или WhatsApp', 540, 1136 + d, 44, '#0f2a5a'); g.globalAlpha = 1;
  g.globalAlpha = prog(l, 2, 2.4); txt(`Бурдж-Халифа, 124 этаж: официальный сайт ${PRICE_SITE} AED, у Азиза ${PRICE_AZIZ} AED. Цены на ноябрь 2026`, 540, 1270, 22, 'rgba(255,255,255,.6)', { w: 600 }); g.globalAlpha = 1;
  const cp = eOut(prog(l, 2.2, 2.9));
  barkhan(g, { x: 1180 - cp * 250, y: 2150, s: 1.0, face: -1, chew: l > 3.6 ? 0 : t * 5, lid: l > 3.7 && l < 3.85 ? .95 : .5, pupil: [-1, -.4], neck: .2 }, { ...DAY, dir: 1 });
}, 'end');
