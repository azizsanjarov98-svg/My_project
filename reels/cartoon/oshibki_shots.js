// =====================================================================
//  «3 ошибки туристов в Дубае» — shots. Uses helpers/props from film.html head.
// =====================================================================
const PRICE_SITE = 225, PRICE_AZIZ = 185;

// ---------- brand emblem: «@AzizDubaiGuide» + Burj + palm (as in the brand image)
function logo(x, y, size, alpha = 1, col = '#eaf2ff') {
  g.save(); g.globalAlpha *= alpha;
  g.font = `800 ${size}px ${F}`; g.letterSpacing = '-1px';
  const label = '@AzizDubaiGuide', w = g.measureText(label).width, ic = size * 1.05;
  const x0 = x - (w + ic * .9) / 2;
  g.shadowColor = 'rgba(0,20,60,.35)'; g.shadowBlur = size * .25; g.shadowOffsetY = size * .05;
  g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(label, x0, y + size * .35);
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  // icon: slim Burj + palm, sitting on a swoosh after the last letter
  const ix = x0 + w + ic * .12, base = y + size * .38;
  g.fillStyle = col; g.strokeStyle = col;
  burj(ix + ic * .2, base, ic * 1.15, col);
  g.lineWidth = Math.max(2, size * .06); g.lineCap = 'round';
  g.beginPath(); g.moveTo(ix + ic * .62, base); g.quadraticCurveTo(ix + ic * .6, base - ic * .45, ix + ic * .55, base - ic * .82); g.stroke();
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .55; g.beginPath(); g.moveTo(ix + ic * .55, base - ic * .82);
    g.quadraticCurveTo(ix + ic * .55 + Math.cos(a) * ic * .28, base - ic * .82 + Math.sin(a) * ic * .28 - ic * .1, ix + ic * .55 + Math.cos(a) * ic * .5, base - ic * .82 + Math.sin(a) * ic * .5 + ic * .12); g.stroke(); }
  g.lineWidth = Math.max(2, size * .045); g.beginPath(); g.moveTo(ix - ic * .9, base + size * .06); g.quadraticCurveTo(ix + ic * .3, base - size * .02, ix + ic * 1.0, base + size * .02); g.stroke();
  g.restore();
}
function watermark(t) {
  const a = prog(t, .3, .7) * (1 - prog(t, 38.2, 38.5)); if (a <= 0) return;
  logo(540, 150, 44, .62 * a);
}
// ---------- graphics: mistake header, solution panel, tickets
function header(l, num, line) {
  const p = prog(l, 0, .25); if (p <= 0) return;
  const s = lerp(1.8, 1, eOut(p));
  g.save(); g.translate(540, 300); g.rotate(-.03); g.scale(s, s); g.globalAlpha = clamp(p * 3);
  rr(-300, -62, 600, 124, 26); g.fillStyle = '#e8443a'; g.shadowColor = 'rgba(120,0,0,.45)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  txt(`ОШИБКА №${num}`, 0, 4, 76, '#fff');
  g.restore();
  const q = prog(l, .3, .65); if (q <= 0) return;
  g.save(); g.globalAlpha = q; g.translate(0, (1 - eOut(q)) * 30);
  g.font = `800 52px ${F}`; const w = g.measureText(line).width + 70;
  rr(540 - w / 2, 382, w, 92, 46); g.fillStyle = 'rgba(15,15,40,.82)'; g.fill();
  txt(line, 540, 430, 52, '#fff', { w: 800 });
  g.restore();
}
function tick(x, y, r, p) { if (p <= 0) return; g.save(); g.translate(x, y); g.scale(back(p), back(p)); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = '#16a34a'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = r * .24; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-r * .42, 0); g.lineTo(-r * .1, r * .32); g.lineTo(r * .45, -r * .3); g.stroke(); g.restore(); }
function solution(l, t0, title, lines, y = 1180) {
  const p = prog(l, t0, t0 + .35); if (p <= 0) return;
  const h = 130 + lines.length * 78;
  g.save(); g.translate(540, y + (1 - eOut(p)) * 260); g.globalAlpha = clamp(p * 2);
  rr(-470, -h / 2, 940, h, 40); g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(0,40,20,.35)'; g.shadowBlur = 40; g.fill(); g.shadowBlur = 0;
  g.lineWidth = 6; g.strokeStyle = '#16a34a'; g.stroke();
  rr(-150, -h / 2 - 34, 300, 68, 34); g.fillStyle = '#16a34a'; g.fill(); txt('КАК НАДО', 0, -h / 2 + 1, 38, '#fff');
  txt(title, 0, -h / 2 + 82, 50, '#14532d');
  lines.forEach((s, i) => { const q = prog(l, t0 + .35 + i * .45, t0 + .7 + i * .45); g.globalAlpha = clamp(p * 2) * clamp(q * 2);
    tick(-390, -h / 2 + 160 + i * 78, 26, q); txt(s, -340, -h / 2 + 160 + i * 78, 46, '#1b2033', { al: 'left', w: 800 }); });
  g.restore();
}
function ticketShape(x, y, s, rot, col, label) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(-120, -60); g.lineTo(120, -60); g.lineTo(120, -18); g.arc(120, 0, 18, -Math.PI / 2, Math.PI / 2, true); g.lineTo(120, 60); g.lineTo(-120, 60); g.lineTo(-120, 18); g.arc(-120, 0, 18, Math.PI / 2, -Math.PI / 2, true); g.closePath();
  g.fillStyle = col; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0;
  g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, -50); g.lineTo(60, 50); g.stroke(); g.setLineDash([]);
  txt(label, -30, 2, 30, '#fff'); g.restore();
}
function iceCream(x, y, melt) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#e0a45a'; g.beginPath(); g.moveTo(-26, -10); g.lineTo(26, -10); g.lineTo(0, 70); g.closePath(); g.fill();
  g.strokeStyle = '#b97a35'; g.lineWidth = 3; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-20 + k * 10, -5); g.lineTo(k * 10 + 8, 50); g.stroke(); }
  g.fillStyle = '#ffb3c7'; g.beginPath(); g.arc(0, -22 + melt * 12, 32 - melt * 6, 0, TAU); g.fill();
  for (let k = 0; k < 3; k++) { const dl = melt * (30 + k * 25); g.beginPath(); g.ellipse(-18 + k * 18, -6 + dl / 2, 7, 8 + dl / 2, 0, 0, TAU); g.fill(); }
  g.restore();
}
function suitcase(x, y) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#ff7b39'; rr(-70, -150, 140, 190, 22); g.fill(); g.strokeStyle = '#b44d1c'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#ffd34d'; g.fillRect(-70, -70, 140, 18);
  g.fillStyle = '#333'; [-45, 45].forEach(wx => { g.beginPath(); g.arc(wx, 48, 13, 0, TAU); g.fill(); });
  g.strokeStyle = '#555'; g.lineWidth = 8; g.beginPath(); g.moveTo(-30, -150); g.lineTo(-30, -250); g.lineTo(30, -250); g.lineTo(30, -150); g.stroke();
  g.restore();
}
function queueScene(t, p, seryOpts, camelOpts) {
  const sky = lg(0, 0, 0, H, [[0, `hsl(${lerp(205, 260, p)},${lerp(80, 45, p)}%,${lerp(66, 30, p)}%)`], [.6, `hsl(${lerp(195, 18, p)},${lerp(70, 85, p)}%,${lerp(80, 62, p)}%)`], [1, `hsl(${lerp(40, 25, p)},85%,${lerp(78, 60, p)}%)`]]);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sx = lerp(820, 140, p), sy = lerp(560, 1050, Math.pow(p, 1.4));
  g.fillStyle = `rgba(255,${lerp(250, 170, p)},${lerp(200, 90, p)},.95)`; g.beginPath(); g.arc(sx, sy, 80, 0, TAU); g.fill();
  skyline(1250, `hsl(${lerp(210, 280, p)},25%,${lerp(70, 35, p)}%)`, 7, .9);
  burj(560, 1260, 1050, `hsl(${lerp(210, 270, p)},20%,${lerp(62, 28, p)}%)`);
  g.fillStyle = lg(0, 1250, 0, H, [[0, '#e7c08e'], [1, '#c58f5d']]); g.fillRect(0, 1250, W, H);
  g.fillStyle = `rgba(80,20,80,${.12 + p * .2})`; g.fillRect(0, 1250, W, H);
  for (let i = 0; i < 40; i++) {
    const row = Math.floor(i / 10), k = i % 10, dir = row % 2 ? -1 : 1;
    const qx = 520 + dir * (k - 4.5) * 78, qy = 1330 + row * 66;
    g.fillStyle = ['#ff7b39', '#1fa59a', '#8a5bff', '#ffd34d', '#ff3d8b', '#35a0ff'][i % 6];
    rr(qx - 18, qy - 70, 36, 60, 14); g.fill(); g.fillStyle = '#f2c29a'; g.beginPath(); g.arc(qx, qy - 86, 15, 0, TAU); g.fill();
  }
  g.strokeStyle = '#c9a54a'; g.lineWidth = 6; for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(80, 1345 + r * 66); g.lineTo(980, 1345 + r * 66); g.stroke(); }
  const L = p > .6 ? SUNSET : DAY;
  if (camelOpts) barkhan(g, camelOpts, L);
  seryoga(g, seryOpts, L);
}

// ================================================================ SHOTS
// HOOK · 0–2.6
shot(0, 2.6, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#7cc4ff'], [.55, '#ffe2b0'], [1, '#ffcf8f']]); g.fillRect(0, 0, W, H);
  // airport facade
  g.fillStyle = '#d7e6f2'; g.fillRect(0, 760, W, 600); g.fillStyle = '#9fc3dd';
  for (let x = 20; x < W; x += 110) for (let y = 800; y < 1300; y += 120) g.fillRect(x, y, 96, 104);
  g.fillStyle = '#2a3a5a'; rr(330, 690, 420, 90, 14); g.fill(); txt('ARRIVALS  ✈', 540, 736, 48, '#ffd34d', { fam: `${F}, ${EMO}` });
  palmPot(110, 1250, 1.0, t); palmPot(970, 1250, 1.0, t);
  g.fillStyle = lg(0, 1350, 0, H, [[0, '#e9cfa8'], [1, '#caa679']]); g.fillRect(0, 1350, W, H);
  // heat shimmer
  g.save(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); for (let x = 0; x < W; x += 20) g.lineTo(x, 1180 + i * 40 + Math.sin(x * .03 + t * 6 + i) * 8); g.stroke(); } g.restore();
  const x = lerp(180, 600, prog(l, 0, 2.4));
  suitcase(x - 210, 1790);
  seryoga(g, { x, y: 1800, s: .95, face: .5, walk: l * 9, sweat: 1, mouth: 'flat', brow: -.2, armL: [-.9, .2] }, DAY);
  // title
  const p = prog(l, .15, .45); g.save(); g.translate(540, 360); g.scale(back(p), back(p)); g.globalAlpha = clamp(p * 2);
  g.font = `900 165px ${F}`; g.lineWidth = 20; g.strokeStyle = '#2a1d3a'; g.lineJoin = 'round'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('3 ОШИБКИ', 0, 0);
  txt('3 ОШИБКИ', 0, 0, 165, '#ffd34d'); g.restore();
  const q = prog(l, .5, .8); g.save(); g.globalAlpha = q; g.translate(0, (1 - eOut(q)) * 30);
  rr(110, 490, 860, 200, 40); g.fillStyle = 'rgba(20,15,45,.85)'; g.fill();
  txt('из-за которых туристы', 540, 548, 60, '#fff', { w: 800 }); txt('переплачивают в Дубае', 540, 630, 60, '#ffd34d', { w: 900 }); g.restore();
}, 'day');

// MISTAKE 1 · no plan · 2.6–11.0
shot(2.6, 11.0, (l, t) => {
  const p = prog(l, .6, 4.2), slap = l > 7.0 && l < 7.7;
  queueScene(t, p, { x: 780, y: 1820, s: .9, face: -.4, lean: p * .12 * (l < 7 ? 1 : 0),
    mouth: l > 7.7 ? 'smile' : slap ? 'o' : p > .5 ? 'frown' : 'flat', eyeOpen: l > 7.7 ? .8 : slap ? 1.3 : lerp(1, .55, p), brow: slap ? 1 : lerp(0, -.5, p), sweat: clamp(p * 2) * (l < 7.7 ? 1 : 0), blush: .5 + p * .4,
    armL: slap ? [-2.75, .9] : [.1, -.1], armR: [.35, -1.4], prop: (gg, ex, ey) => iceCream(ex - 10, ey - 70, p) },
    l > 4.3 ? { x: lerp(-300, 260, eOut(prog(l, 4.3, 5.4))), y: 1640, s: .58, face: 1, walk: l < 5.4 ? l * 7 : null, chew: l > 5.4 ? t * 6 : 0, lid: .55, pupil: [1, 0] } : null);
  const hh = Math.floor(lerp(15, 19, p)), mm = Math.floor((lerp(15, 19, p) % 1) * 60);
  if (l < 5.5) { g.save(); rr(820, 520, 220, 90, 26); g.fillStyle = 'rgba(15,20,45,.8)'; g.fill(); g.restore(); txt(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 930, 567, 56, '#fff', { fam: '"JetBrains Mono", monospace', w: 800 }); }
  header(l, 1, 'Нет плана на день');
  solution(l, 5.5, 'Азиз составит план:', ['что и когда смотреть', 'что бронировать заранее', 'как успеть больше за день'], 1100);
}, 'day');

// MISTAKE 2 · official site · 11.0–19.0
shot(11.0, 19.0, (l, t) => {
  if (l < 2.4) { // phone close-up
    g.fillStyle = lg(0, 0, 0, H, [[0, '#8fd0ff'], [1, '#f6d6aa']]); g.fillRect(0, 0, W, H);
    phoneDevice(540, 1120, 2.0, -.04, () => {
      g.fillStyle = '#f4f6fb'; g.fillRect(-160, -330, 320, 660);
      g.fillStyle = '#1b2a4a'; g.fillRect(-160, -330, 320, 70); txt('Официальный сайт', 0, -290, 18, '#fff', { w: 700 });
      burj(0, -60, 170, '#9fb6d1'); txt('Бурдж-Халифа · 124 этаж', 0, -30, 18, '#1b2a4a', { w: 800 });
      txt(`${PRICE_SITE} AED`, 0, 40, 60, '#e8443a', { w: 900 });
      const pressed = l > 1.5; rr(-120, 120, 240, 64, 32); g.fillStyle = pressed ? '#16a34a' : '#2563eb'; g.fill();
      txt(pressed ? 'Оплачено ✓' : 'Купить', 0, 153, 26, '#fff', { w: 800 });
    });
    const tp = l < 1.5 ? eOut(prog(l, .7, 1.4)) : 1 - eOut(prog(l, 1.6, 2.1));
    mitten(lerp(900, 600, tp), lerp(1800, 1480, tp), 1.5, -.5, DAY);
  } else if (l < 4.2) { // twitch
    g.fillStyle = lg(0, 0, 0, H, [[0, '#9ad5ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H);
    skyline(1500, '#b4cbe0', 13, 1.2);
    const tw = Math.sin(l * 55) > .2 ? 1 : 0;
    seryoga(g, { x: 540, y: 2950, s: 2.3, face: 0, mouth: 'grit', eyeOpen: .95, brow: -.3, browTilt: .6, twitch: tw, sweat: 1 }, DAY);
  } else { // two-shot + price comparison
    g.fillStyle = lg(0, 0, 0, H, [[0, '#8fd0ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H);
    skyline(1350, '#a9c3db', 11, 1.1); burj(860, 1360, 900, '#94b2cf');
    g.fillStyle = '#f0e2cc'; g.fillRect(0, 1350, W, H);
    const k = eOut(prog(l, 4.2, 4.9));
    barkhan(g, { x: lerp(1400, 900, k), y: 1820, s: .8, face: -1, chew: t * 6, lid: .5, pupil: [-1, .2] }, DAY);
    const drop = l > 5.4;
    seryoga(g, { x: 320, y: 1880, s: 1.0, face: .5, mouth: drop ? 'o' : 'flat', mouthOpen: 1, eyeOpen: drop ? 1.35 : .9, brow: drop ? 1 : -.3, pupil: [.6, 0] }, DAY);
    // comparison card
    const p = prog(l, 4.6, 5.0);
    if (p > 0) {
      g.save(); g.translate(540, 1000 + (1 - eOut(p)) * 200); g.globalAlpha = clamp(p * 2);
      rr(-440, -230, 880, 460, 40); g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 40; g.fill(); g.shadowBlur = 0;
      txt('Бурдж-Халифа · 124 этаж', 0, -165, 44, '#1b2033');
      txt('Официальный сайт', -200, -70, 36, '#7a7f95', { w: 700 }); txt(`${PRICE_SITE} AED`, -200, 0, 70, '#9aa0b5');
      g.strokeStyle = '#e8443a'; g.lineWidth = 8; g.beginPath(); g.moveTo(-320, 5); g.lineTo(-80, -5); g.stroke();
      txt('У Азиза', 200, -70, 36, '#14532d', { w: 800 });
      const q = prog(l, 5.2, 5.5); g.save(); g.translate(200, 0); g.scale(back(q, 2.2), back(q, 2.2)); txt(`${PRICE_AZIZ} AED`, 0, 0, 84, '#16a34a'); g.restore();
      const r = prog(l, 5.9, 6.2); if (r > 0) { g.globalAlpha *= r; rr(-300, 90, 600, 90, 45); g.fillStyle = '#16a34a'; g.fill(); txt(`Экономия ${PRICE_SITE - PRICE_AZIZ} AED с человека`, 0, 136, 38, '#fff'); }
      g.restore();
    }
  }
  header(l, 2, 'Билеты на официальном сайте');
}, 'day');

// MISTAKE 3 · hotel desk · 19.0–27.0
shot(19.0, 27.0, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#3b2a4a'], [.5, '#8a5a4a'], [1, '#d9b48a']]); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,230,190,.22)'; [80, 980].forEach(x => g.fillRect(x - 50, 0, 100, 1350));
  const cg = g.createRadialGradient(540, 620, 10, 540, 620, 420); cg.addColorStop(0, 'rgba(255,220,140,.7)'); cg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = cg; g.fillRect(0, 200, W, 900);
  g.fillStyle = '#ffd98a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(400 + i * 35, 620 + Math.sin(i) * 20, 10, 0, TAU); g.fill(); }
  g.fillStyle = '#efe3cf'; g.fillRect(0, 1350, W, H);
  g.fillStyle = 'rgba(120,90,70,.12)'; for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) if ((r + c) % 2) g.fillRect(c * 130 - r * 20, 1350 + r * 75, 130, 75);
  palmPot(120, 1240, .9, t);
  // desk
  g.fillStyle = '#5a3324'; rr(580, 1200, 480, 330, 20); g.fill(); g.fillStyle = '#8b5136'; rr(560, 1180, 520, 50, 14); g.fill();
  g.fillStyle = '#1b2a4a'; rr(650, 920, 360, 110, 16); g.fill(); txt('ЭКСКУРСИИ', 830, 975, 46, '#ffd34d');
  const n = Math.floor(prog(l, .6, 2.6) * 9);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#5fd38a' : '#4cbf78'; rr(720 + rnd(i) * 30, 1170 - i * 12, 170, 30, 6); g.fill(); g.strokeStyle = '#2e8f55'; g.lineWidth = 3; g.stroke(); }
  if (l > .6 && l < 2.6) { const k = (l * 3.2) % 1; g.save(); g.translate(lerp(580, 780, k), lerp(1170, 1100, k) - Math.sin(k * Math.PI) * 120); g.rotate(k * 5); g.fillStyle = '#5fd38a'; rr(-60, -16, 120, 32, 6); g.fill(); g.restore(); }
  const empty = l > 2.8, ck = eOut(prog(l, 4.0, 5.0));
  if (l > 4.0) barkhan(g, { x: lerp(-320, 200, ck), y: 1700, s: .6, face: 1, walk: l < 5 ? l * 7 : null, chew: l > 5 ? t * 6 : 0, lid: .5, pupil: [1, 0] }, ROOM);
  seryoga(g, { x: 520, y: 1830, s: .95, face: l > 5 ? -.6 : .7, mouth: empty ? (l > 6.2 ? 'smile' : 'o') : 'flat', eyeOpen: empty ? 1.25 : 1.05, brow: empty ? 1 : .3, pupil: [l > 5 ? -1 : 1, .3],
    armR: empty && l < 4.5 ? [2.0, -1.2] : l < 2.8 ? [1.6 + Math.sin(l * 12) * .2, -.6] : [.42, -.25],
    prop: (gg, ex, ey) => { if (!empty || l > 4.5) return; g.save(); g.translate(ex + 10, ey - 50); g.fillStyle = '#6b3d26'; rr(-60, -36, 120, 72, 10); g.fill(); g.fillStyle = '#e9d6c0'; rr(-46, 20, 34, 40, 6); g.fill(); rr(12, 20, 34, 40, 6); g.fill(); g.restore(); } }, ROOM);
  if (l > 2.9 && l < 4.6) { const k = prog(l, 2.9, 4.4); const mx = 640 + k * 300 + Math.sin(l * 20) * 30, my = 1150 - k * 600 + Math.cos(l * 17) * 30;
    g.save(); g.translate(mx, my); g.fillStyle = '#c9b8a0'; const fl = Math.abs(Math.sin(l * 40)); g.beginPath(); g.ellipse(-16, 0, 20, 12 * fl + 3, -.4, 0, TAU); g.ellipse(16, 0, 20, 12 * fl + 3, .4, 0, TAU); g.fill(); g.fillStyle = '#6d5a48'; g.beginPath(); g.ellipse(0, 0, 6, 14, 0, 0, TAU); g.fill(); g.restore(); }
  header(l, 3, 'Экскурсии у гида в отеле');
  solution(l, 5.2, 'Напрямую у Азиза:', ['выгоднее', 'гид на русском', 'оплата при встрече'], 1130);
}, 'room');

// THE FIX · 27.0–28.6 : message → tickets fly in
shot(27.0, 28.6, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#8fd0ff'], [1, '#ffe2b6']]); g.fillRect(0, 0, W, H);
  skyline(1450, '#a9c3db', 5, 1.1);
  g.fillStyle = '#f0e2cc'; g.fillRect(0, 1450, W, H);
  seryoga(g, { x: 540, y: 1900, s: 1.05, face: 0, mouth: l > .9 ? 'grin' : 'smile', eyeOpen: l > .9 ? .6 : .9, brow: .5, pupil: [0, .6],
    armL: l > 1.0 ? [-2.4, .6] : [.42, -.25], armR: l > 1.0 ? [2.4, -.6] : [2.2, -1.8], prop: l <= 1.0 ? (gg, ex, ey) => phoneDevice(ex + 10, ey - 70, .3, -.15, () => { g.fillStyle = '#fff3e2'; g.fillRect(-160, -330, 320, 660); }) : null }, DAY);
  // chat bubbles
  const b1 = prog(l, .1, .35), b2 = prog(l, .55, .8);
  if (b1 > 0 && l < 1.1) { g.save(); g.translate(330, 600); g.scale(back(b1), back(b1)); rr(-250, -60, 500, 120, 40); g.fillStyle = '#d6f5c9'; g.fill(); g.font = `800 44px ${F}, ${EMO}`; g.fillStyle = '#1b2033'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Азиз, нужны билеты! 🙌', 0, 2); g.restore(); }
  if (b2 > 0 && l < 1.1) { g.save(); g.translate(720, 760); g.scale(back(b2), back(b2)); rr(-210, -60, 420, 120, 40); g.fillStyle = '#fff'; g.fill(); g.font = `800 44px ${F}, ${EMO}`; g.fillStyle = '#1b2033'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Готово! ✅', 0, 2); g.restore(); }
  // tickets rain into his hands
  const tk = [['#ff7b39', 'Бурдж'], ['#1fa59a', 'Аквапарк'], ['#2563eb', 'Яхта'], ['#e8443a', 'Сафари']];
  tk.forEach(([c, s], i) => { const p = prog(l, 1.0 + i * .1, 1.45 + i * .1); if (p <= 0) return; ticketShape(lerp(540 + (i - 1.5) * 260, 540 + (i - 1.5) * 90, eIn(p)), lerp(-100, 1050 - i * 20, eIn(p)), .9, (i - 1.5) * .25, c, s); });
}, 'day');
// montage (4 × 1.7 s) with labels
function label(s, l) { const p = prog(l, .05, .3); g.save(); g.globalAlpha = p; g.font = `900 54px ${F}`; const w = g.measureText(s).width + 80; rr(540 - w / 2, 300, w, 100, 50); g.fillStyle = 'rgba(15,15,40,.8)'; g.fill(); txt(s, 540, 352, 54, '#fff'); g.restore(); }
shot(28.6, 30.3, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#ffb98a'], [.5, '#ffe0b8'], [1, '#bfe3ff']]); g.fillRect(0, 0, W, H);
  skyline(1500, '#9fb7cf', 21, 1.3); g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 5; i++) g.fillRect(i * 260, 0, 12, H);
  g.fillStyle = '#2d3550'; g.fillRect(0, 1500, W, H);
  seryoga(g, { x: 400, y: 1900, s: 1.0, face: .4, mouth: 'grin', eyeOpen: .6, brow: .6, armR: [2.7, -.2] }, DAY);
  const p = back(prog(l, .3, .7)); g.save(); g.translate(790, 820); g.rotate(.08); g.scale(p, p);
  rr(-200, -100, 400, 200, 30); g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  txt('билет у Азиза', 0, -45, 36, '#14532d', { w: 800 }); txt(`${PRICE_AZIZ} AED`, 0, 30, 84, '#16a34a'); g.restore();
  label('Бурдж-Халифа', l);
}, 'day');
shot(30.3, 32.0, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#6fd0ff'], [1, '#d9f6ff']]); g.fillRect(0, 0, W, H);
  g.strokeStyle = '#ff7b39'; g.lineWidth = 170; g.lineCap = 'round'; g.beginPath(); g.moveTo(-100, 400); g.bezierCurveTo(900, 500, 100, 1000, 700, 1350); g.stroke();
  g.strokeStyle = '#ffb07a'; g.lineWidth = 120; g.stroke();
  g.fillStyle = '#1aa7e0'; g.fillRect(0, 1450, W, H); g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 8; i++) g.fillRect(((i * 170 + t * 120) % (W + 100)) - 50, 1480 + i * 50, 120, 8);
  const p = prog(l, 0, 1.1), k = eIn(p);
  if (p < 1) seryoga(g, { x: lerp(0, 760, k), y: lerp(460, 1400, k) + Math.sin(k * 6) * 40, s: .75, face: .6, lean: -.5, mouth: 'grin', eyeOpen: .5, brow: 1, armL: [-2.8, 0], armR: [2.8, 0] }, DAY);
  if (l > 1.1) { const q = prog(l, 1.1, 1.7); g.fillStyle = `rgba(255,255,255,${1 - q})`; for (let i = 0; i < 14; i++) { const a = -Math.PI * rnd(i); g.beginPath(); g.arc(760 + Math.cos(a) * q * 300, 1450 + Math.sin(a) * q * 400 + q * q * 300, 18 + rnd(i) * 12, 0, TAU); g.fill(); } }
  label('Аквапарк', l);
}, 'day');
shot(32.0, 33.7, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#7fc8ff'], [.6, '#ffe3c0'], [1, '#ffd0a0']]); g.fillRect(0, 0, W, H);
  skyline(1200, '#a7bfd6', 41, 1.3);
  g.fillStyle = lg(0, 1200, 0, H, [[0, '#1d8fc9'], [1, '#0b5f8f']]); g.fillRect(0, 1200, W, H);
  g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 10; i++) g.fillRect(((i * 150 - t * 160) % (W + 100) + W + 100) % (W + 100) - 50, 1240 + i * 60, 140, 6);
  const bob = Math.sin(t * 3) * 10; g.save(); g.translate(560, 1430 + bob); g.rotate(Math.sin(t * 2) * .02);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-420, -40); g.lineTo(380, -40); g.lineTo(470, -110); g.lineTo(330, 70); g.lineTo(-380, 70); g.closePath(); g.fill();
  g.fillStyle = '#1b2a4a'; g.fillRect(-380, 20, 710, 16); g.fillStyle = '#eef4fb'; rr(-260, -170, 380, 130, 30); g.fill(); g.fillStyle = '#5aa9e6'; for (let i = 0; i < 4; i++) rr(-230 + i * 85, -145, 65, 50, 10), g.fill();
  g.restore();
  seryoga(g, { x: 700, y: 1390 + bob, s: .62, face: -.3, mouth: 'grin', eyeOpen: .55, brow: .8, armL: [-2.6, .4] }, DAY);
  label('Яхта', l);
}, 'day');
shot(33.7, 35.4, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#5b3c8a'], [.5, '#ff8a5c'], [1, '#ffcf8f']]); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,230,160,.95)'; g.beginPath(); g.arc(540, 980, 140, 0, TAU); g.fill();
  g.fillStyle = '#d98b52'; g.beginPath(); g.moveTo(0, 1100); g.quadraticCurveTo(540, 980, 1080, 1120); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = '#c4733e'; g.beginPath(); g.moveTo(0, 1400); g.quadraticCurveTo(600, 1300, 1080, 1420); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  const bump = Math.sin(t * 18) * 6;
  barkhan(g, { x: 230 + Math.sin(l * 2) * 20, y: 1500, s: .55, face: 1, walk: t * 12, lid: .3, pupil: [1, -.3] }, SUNSET);
  g.save(); g.translate(660, 1500 + bump);
  g.fillStyle = '#fff'; rr(-260, -230, 520, 170, 30); g.fill(); g.fillStyle = '#e8443a'; g.fillRect(-260, -150, 520, 20);
  g.fillStyle = '#9fd3ff'; rr(-60, -330, 200, 110, 14); g.fill();
  [-170, 170].forEach(wx => { g.fillStyle = '#222'; g.beginPath(); g.arc(wx, -50, 62, 0, TAU); g.fill(); g.fillStyle = '#999'; g.beginPath(); g.arc(wx, -50, 26, 0, TAU); g.fill(); });
  g.restore();
  seryoga(g, { x: 560, y: 1460 + bump, s: .5, face: -.4, mouth: 'grin', eyeOpen: .55, brow: 1, armL: [-2.7, .4], armR: [.3, -.2] }, SUNSET);
  g.fillStyle = 'rgba(217,139,82,.5)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(900 + i * 30 + (t * 200 % 60), 1460 - rnd(i) * 40, 30 + rnd(i) * 30, 0, TAU); g.fill(); }
  label('Сафари', l);
}, 'sunset');
// SELFIE · 35.4–38.4
shot(35.4, 38.4, (l, t) => {
  g.save();
  const frozen = l > 1.6;
  if (frozen) { const p = eOut(prog(l, 1.6, 2.3)); g.fillStyle = '#2a1d3a'; g.fillRect(0, 0, W, H); g.translate(540, 900); g.rotate(-.06 * p); g.scale(lerp(1, .78, p), lerp(1, .78, p)); g.translate(-540, -900); g.fillStyle = '#fffaf0'; g.fillRect(-20, -40, W + 40, H + 260); }
  g.save(); g.beginPath(); g.rect(frozen ? 40 : 0, frozen ? 40 : 0, frozen ? W - 80 : W, frozen ? 1700 : H); g.clip();
  g.fillStyle = lg(0, 0, 0, H, [[0, '#4a3480'], [.55, '#ff8f66'], [1, '#ffd29a']]); g.fillRect(0, 0, W, H);
  skyline(1350, 'rgba(70,40,110,.6)', 31, 1.1); burj(540, 1360, 1250, 'rgba(60,35,100,.85)');
  g.fillStyle = '#e2a46c'; g.fillRect(0, 1350, W, H);
  barkhan(g, { x: 700, y: 1750, s: .95, face: -1, chew: frozen ? 0 : t * 5, lid: .35, pupil: [-.3, -.4], headTilt: -.15, neck: .15 }, SUNSET);
  seryoga(g, { x: 360, y: 1880, s: 1.0, face: .3, mouth: 'grin', eyeOpen: .5, brow: .7, armR: [2.6, -.4], prop: (gg, ex, ey) => phoneDevice(ex + 20, ey - 60, .22, .2, () => { g.fillStyle = '#222'; g.fillRect(-160, -330, 320, 660); }) }, SUNSET);
  g.restore();
  if (frozen) txt('Дубай без ошибок ✓', 540, 1860, 64, '#2a1d3a', { w: 800 });
  g.restore();
  const f = 1 - prog(l, 1.6, 1.9); if (l > 1.6 && f > 0) { g.fillStyle = `rgba(255,255,255,${f})`; g.fillRect(0, 0, W, H); }
}, 'sunset');
// END CARD · 38.4–44
shot(38.4, 44.0, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#0f3d8a'], [.6, '#1f6fd1'], [1, '#2a86e8']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.06 + rnd(i) * .08})`; g.beginPath(); g.ellipse(rnd(i + 1) * W, rnd(i + 2) * 900, 120 + rnd(i) * 160, 8, -.15, 0, TAU); g.fill(); }
  skyline(1700, 'rgba(10,40,100,.45)', 51, 1.2); burj(820, 1710, 900, 'rgba(10,40,100,.55)');
  const a = (t0) => { const p = eOut(prog(l, t0, t0 + .5)); g.globalAlpha = p; return (1 - p) * 40; };
  let d = a(.1); txt('Билеты и экскурсии —', 540, 420 + d, 74, '#fff'); txt('выгодно у Азиза', 540, 520 + d, 92, '#ffd34d', { glow: 'rgba(0,0,0,.25)' }); g.globalAlpha = 1;
  d = a(.8); ['Бурдж-Халифа · парки · аквапарки', 'яхты · сафари · обзорные', 'групповые и индивидуальные'].forEach((s, i) => txt(s, 540, 680 + i * 66 + d, 46, 'rgba(255,255,255,.92)', { w: 700 })); g.globalAlpha = 1;
  const p = prog(l, 1.6, 2.1); g.save(); g.translate(540, 1000); g.scale(lerp(.8, 1, back(p)), lerp(.8, 1, back(p))); g.globalAlpha = p; logo(0, 0, 92, 1); g.restore();
  d = a(2.3); rr(170, 1150 + d, 740, 110, 55); g.fillStyle = '#ffd34d'; g.fill(); txt('Пишите в Telegram или WhatsApp', 540, 1206 + d, 44, '#0f2a5a'); g.globalAlpha = 1;
  g.globalAlpha = prog(l, 2.8, 3.3); txt(`Бурдж-Халифа, 124 этаж: официальный сайт ${PRICE_SITE} AED, у Азиза ${PRICE_AZIZ} AED. Цены на ноябрь 2026`, 540, 1340, 22, 'rgba(255,255,255,.6)', { w: 600 }); g.globalAlpha = 1;
  const cp = eOut(prog(l, 3.2, 3.9));
  barkhan(g, { x: 1180 - cp * 250, y: 2150, s: 1.0, face: -1, chew: l > 4.8 ? 0 : t * 5, lid: l > 4.9 && l < 5.1 ? .95 : .5, pupil: [-1, -.4], neck: .2 }, { ...DAY, dir: 1 });
}, 'end');
