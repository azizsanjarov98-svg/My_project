// =====================================================================
//  «ДРУГ В ДУБАЕ» — wordless comedy. Seryoga only THINKS of a place,
//  Barkhan is already there with the ticket in his mouth. 4 rounds + finale.
// =====================================================================
// ---------- camera, layers, life
const layer = document.createElement('canvas'); layer.width = W; layer.height = H; const lctx = layer.getContext('2d');
function blurred(px, fn) { const prev = g; g = lctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.save(); fn(); g.restore(); g = prev; g.save(); if (px > .3) g.filter = `blur(${px}px)`; g.drawImage(layer, 0, 0); g.restore(); }
function handheld(t, amp = 1, zoom = 1, cx = W / 2, cy = H / 2) {
  const dx = (Math.sin(t * .9) * 6 + Math.sin(t * 2.3 + 1) * 2.5) * amp, dy = (Math.sin(t * .7 + 2) * 5 + Math.sin(t * 2.9) * 2) * amp, r = Math.sin(t * .6 + 4) * .003 * amp;
  g.translate(cx + dx, cy + dy); g.rotate(r); g.scale(zoom, zoom); g.translate(-cx, -cy);
}
const push = (t, t0, t1, z0, z1) => lerp(z0, z1, eIO(prog(t, t0, t1)));
const blink = (t, seed = 0) => { const p = (t + seed * 1.7) % 3.3; return p < .12 ? .08 : 1; };
const breath = (t, seed = 0) => Math.sin(t * 2.1 + seed) * 4;
function squash(x, y, sx, sy, fn) { g.save(); g.translate(x, y); g.scale(sx, sy); g.translate(-x, -y); fn(); g.restore(); }
const hop = (t, t0, d = .55) => { const p = prog(t, t0, t0 + d); if (p <= 0 || p >= 1) return { y: 0, sx: 1, sy: 1 };
  if (p < .18) { const q = p / .18; return { y: 0, sx: 1 + .12 * Math.sin(q * Math.PI), sy: 1 - .14 * Math.sin(q * Math.PI) }; }
  if (p < .82) { const q = (p - .18) / .64; return { y: -Math.sin(q * Math.PI) * 150, sx: .94, sy: 1.08 }; }
  const q = (p - .82) / .18; return { y: 0, sx: 1 + .1 * Math.sin(q * Math.PI), sy: 1 - .12 * Math.sin(q * Math.PI) }; };
// ---------- brand emblem (exact artwork + «@»)
const LOGO = new Image(); LOGO.src = 'assets/logo_aziz.png';
function logo(x, y, size, alpha = 1) { if (!LOGO.complete || !LOGO.naturalWidth) return; const h = size * 2.43, w = h * LOGO.naturalWidth / LOGO.naturalHeight; g.save(); g.globalAlpha *= alpha * .61; g.drawImage(LOGO, x - w / 2, y - h * .695, w, h); g.restore(); }

// ---------- props
const TK = {
  aqua: ['#12a5e0', '🌊', 'АКВАПАРК'], yacht: ['#2563eb', '🛥️', 'ЯХТА'], burj: ['#ff7b39', '🏙️', 'БУРДЖ-ХАЛИФА'],
  ferrari: ['#e8261c', '🏎️', 'FERRARI WORLD'], safari: ['#d97a2b', '🐪', 'САФАРИ'],
};
function ticket(key, x = 0, y = 0, s = 1, rot = 0, tear = 0) {
  const [col, em, label] = TK[key];
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const half = (side) => { g.save(); if (tear) g.translate(side * tear * 60, tear * tear * 200 * (side > 0 ? 1 : .6)); if (tear) g.rotate(side * tear * .6);
    g.beginPath(); if (side < 0) { g.moveTo(-170, -80); g.lineTo(70, -80); g.lineTo(70, 80); g.lineTo(-170, 80); g.lineTo(-170, 20); g.arc(-170, 0, 20, Math.PI / 2, -Math.PI / 2, true); }
    else { g.moveTo(70, -80); g.lineTo(170, -80); g.lineTo(170, -20); g.arc(170, 0, 20, -Math.PI / 2, Math.PI / 2, true); g.lineTo(170, 80); g.lineTo(70, 80); }
    g.closePath(); g.fillStyle = col; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fill(); g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.stroke(); g.restore(); };
  half(-1); half(1);
  if (!tear) {
    g.setLineDash([9, 9]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(70, -72); g.lineTo(70, 72); g.stroke(); g.setLineDash([]);
    g.save(); g.font = `70px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(em, -112, 4); g.restore();
    let fs = 30; g.font = `900 ${fs}px ${F}`; while (g.measureText(label).width > 150 && fs > 16) { fs -= 1; g.font = `900 ${fs}px ${F}`; }
    txt(label, -10, -14, fs, '#fff'); txt('ВХОД · 1', -10, 26, 20, 'rgba(255,255,255,.85)', { w: 700, track: 3 });
    g.save(); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0, yy = -60; yy < 60; i++) { const bw = 2 + (rnd(i * 3.7 + label.length) * 5 | 0); g.fillRect(100 + (i % 2) * 2, yy, 40, bw); yy += bw + 4; } g.restore();
  }
  g.restore();
}
function thought(hx, hy, bx, by, t, t0, t1, emoji, size = 1) { // cloud bubble growing out of the head
  const p = prog(t, t0, t0 + .45), q = t1 ? prog(t, t1, t1 + .18) : 0; if (p <= 0 || q >= 1) return;
  g.save(); g.globalAlpha = 1 - q;
  [[.18, 14], [.38, 22], [.6, 32]].forEach(([k, r], i) => { const pp = prog(p, i * .15, i * .15 + .3); if (pp <= 0) return; g.fillStyle = '#fff'; g.strokeStyle = '#2a2140'; g.lineWidth = 4; g.beginPath(); g.arc(lerp(hx, bx, k), lerp(hy, by, k) + Math.sin(t * 3 + i) * 4, r * back(pp), 0, TAU); g.fill(); g.stroke(); });
  const pb = back(prog(p, .45, 1), 2) * (1 + q * .6) * size; if (pb > 0) {
    g.save(); g.translate(bx, by + Math.sin(t * 2.5) * 6); g.scale(pb, pb);
    g.fillStyle = '#fff'; g.strokeStyle = '#2a2140'; g.lineWidth = 6;
    const blobs = [[-110, 0, 80], [-40, -60, 90], [60, -55, 85], [120, 10, 75], [50, 60, 80], [-50, 55, 78]];
    g.beginPath(); blobs.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }); g.stroke(); g.beginPath(); blobs.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }); g.fill();
    g.font = `150px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(emoji, 5, 5); g.restore();
  }
  g.restore();
}
function sky(top, mid, bot) { g.fillStyle = lg(0, 0, 0, H, [[0, top], [.6, mid], [1, bot]]); g.fillRect(0, 0, W, H); }
function tearFx(t, t0, key) { const p = prog(t, t0, t0 + .45); if (p <= 0 || p >= 1) return; ticket(key, 540, 900, 2.2, -.08, eOut(p)); }

// ================================================================ SHOTS
const R1 = 0, R2 = 6.2, R3 = 11.9, R4 = 17.6, MON = 24.4, FIN = 30.8, END = 34.6;
// ---- round 1 · balcony · aquapark
shot(R1, R2, (l, t) => {
  g.save(); handheld(t, .8, push(t, 0, R2, 1, 1.06), 540, 1300);
  blurred(5, () => { sky('#8fd0ff', '#d9efff', '#ffe2b6'); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(250, 420, 80, 0, TAU); g.fill(); skyline(1250, '#a9c3db', 3, 1.2); burj(820, 1260, 1000, '#94b2cf'); });
  g.fillStyle = '#f0e2cc'; g.fillRect(0, 1560, W, H);
  const turn = eIO(prog(t, 2.3, 2.7)), take = prog(t, 3.9, 4.4), shrug = t > 5.0;
  const hasT = t > 4.4;
  barkhan(g, { x: lerp(2250, 1230, eOut(prog(t, 1.75, 2.15))), y: 2050, s: 1.15, face: -1, chew: t * 6, lid: t > 3.15 && t < 3.3 ? .95 : .5, pupil: [-1, .1], neck: .12,
    mouthProp: take < .01 ? (gg) => ticket('aqua', 60, 30, .9, -.2) : null }, DAY);
  if (take > 0 && !hasT) ticket('aqua', lerp(840, 700, eOut(take)), lerp(1170, 1240, eOut(take)), lerp(.9, .8, take), -.2);
  seryoga(g, { x: 380, y: 1900, s: 1.15, face: lerp(.1, .9, turn), bob: breath(t), mouth: shrug ? 'grin' : turn > .5 ? 'o' : 'flat', mouthOpen: 1, eyeOpen: (turn > .5 && !shrug ? 1.3 : .85) * blink(t), brow: turn > .5 ? 1 : .3,
    pupil: [lerp(-.2, 1, turn), shrug ? 0 : lerp(-.6, 0, turn)], armR: hasT ? [1.3, -1.0] : t < 2.3 ? [2.25, -1.9] : [.42, -.25], armL: shrug ? [-1.4, -.6] : [-.42, .25],
    prop: hasT ? (gg, ex, ey) => ticket('aqua', ex + 20, ey - 40, .7, -.3) : null }, DAY);
  g.fillStyle = '#fff'; g.fillRect(0, 1640, W, 18); for (let x = 20; x < W; x += 70) g.fillRect(x, 1640, 12, 300);
  g.restore();
  thought(520, 1170, 700, 700, t, .4, 1.9, '🌊');
}, 'day');
// ---- round 2 · marina · yacht (camel hangs in from the top onto the phone)
shot(R2, R3, (l, t) => {
  g.save(); handheld(t, .8, push(t, R2, R3, 1.02, 1.08), 540, 1300);
  blurred(5, () => { sky('#7fc8ff', '#ffe3c0', '#ffd0a0'); skyline(1150, '#a7bfd6', 41, 1.3);
    g.fillStyle = lg(0, 1150, 0, H, [[0, '#1d8fc9'], [1, '#0b5f8f']]); g.fillRect(0, 1150, W, H);
    [[200, 1260], [720, 1300]].forEach(([x, y]) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 200, y); g.lineTo(x + 180, y); g.lineTo(x + 230, y - 50); g.lineTo(x + 160, y + 40); g.lineTo(x - 170, y + 40); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 20, y); g.lineTo(x - 20, y - 260); g.stroke(); }); });
  g.fillStyle = '#d9c3a0'; g.fillRect(0, 1600, W, H);
  const phoneUp = prog(t, R2 + 1.0, R2 + 1.4), drop = eOut(prog(t, R2 + 2.0, R2 + 2.5)), look = eIO(prog(t, R2 + 2.8, R2 + 3.2)), take = t > R2 + 3.7, up = eIn(prog(t, R2 + 4.0, R2 + 4.5)), cam = t > R2 + 4.8;
  seryoga(g, { x: 470, y: 1920, s: 1.15, face: cam ? 0 : .3, bob: breath(t, 1), mouth: cam ? 'flat' : look > .5 ? 'o' : 'flat', mouthOpen: 1, eyeOpen: (look > .5 && !cam ? 1.3 : .9) * blink(t, 1), brow: cam ? .9 : look > .5 ? 1 : 0, browTilt: cam ? .8 : 0,
    pupil: cam ? [0, 0] : [lerp(.3, .1, look), lerp(.9, -1, look)], armR: phoneUp > 0 ? [2.2, -1.85] : [.42, -.25],
    prop: (gg, ex, ey) => { if (phoneUp <= 0) return; phoneDevice(ex + 10, ey - 70, .3, -.12, () => { g.fillStyle = '#fff'; g.fillRect(-160, -330, 320, 660); g.fillStyle = '#dfe6f3'; rr(-130, -290, 260, 50, 25); g.fill(); txt('яхта дуб|', -110, -265, 26, '#1b2033', { al: 'left', w: 700 }); });
      if (take) ticket('yacht', ex + 40, ey - 200, .65, .15); } }, DAY);
  // the camel hangs in upside-down from above the frame
  if (drop > 0 && up < 1) { g.save(); g.translate(760, lerp(-1300, -420, drop) - up * 900); g.rotate(Math.PI * .92); barkhan(g, { x: 0, y: 0, s: 1.1, face: 1, chew: t * 6, lid: t > R2 + 3.4 && t < R2 + 3.55 ? .95 : .5, pupil: [0, -1], neck: .35,
    mouthProp: !take ? (gg) => { g.rotate(Math.PI); ticket('yacht', 0, 0, .9, 0); } : null }, DAY); g.restore(); }
  g.restore();
  thought(560, 1180, 760, 720, t, R2 + .3, R2 + 1.2, '🛥️');
}, 'day');
// ---- round 3 · Burj Khalifa · he's already there, in sunglasses, with two tickets
shot(R3, R4, (l, t) => {
  const tilt = eIO(prog(t, R3, R3 + 1.2));
  g.save(); handheld(t, .7, 1.03);
  g.translate(0, lerp(1500, 0, tilt));
  sky('#5aa9ff', '#bfe3ff', '#ffe2b6');
  g.save(); g.translate(0, -1500); g.fillStyle = lg(0, 0, 0, 1500, [[0, '#3d8bff'], [1, '#5aa9ff']]); g.fillRect(0, 0, W, 1500); g.restore();
  blurred(2, () => { skyline(1320, '#a9c3db', 17, 1.1); });
  burj(540, 1330, 2600, '#7f9fc2');
  g.fillStyle = '#efdcc0'; g.fillRect(0, 1320, W, H);
  const appear = t > R3 + 2.0, squint = eIO(prog(t, R3 + 2.5, R3 + 3.1)), take = t > R3 + 4.6;
  if (appear) barkhan(g, { x: 1000, y: 1900, s: 1.0, face: -1, chew: t * 6, lid: .5, shades: true, pupil: [-1, 0], neck: .1,
    mouthProp: !take ? (gg) => { ticket('burj', 40, 20, .85, -.15); ticket('burj', 70, 60, .85, .05); } : null }, DAY);
  seryoga(g, { x: 300, y: 1930, s: 1.1, face: lerp(.1, .85, squint), bob: breath(t, 2), mouth: take ? 'smile' : squint > .5 ? 'flat' : 'o', eyeOpen: lerp(.95, .32, squint) * (take ? 2.4 : 1) * blink(t, 2), brow: lerp(.8, -.6, squint), browTilt: squint * .7,
    pupil: [lerp(0, 1, squint), lerp(-1, 0, squint)], armR: take ? [1.4, -1.0] : [.42, -.25], prop: take ? (gg, ex, ey) => { ticket('burj', ex + 20, ey - 50, .65, -.2); ticket('burj', ex + 40, ey - 20, .65, .1); } : null }, DAY);
  g.restore();
  if (tilt >= 1) thought(400, 1200, 620, 760, t, R3 + 1.4, R3 + 2.05, '🔭', .9);
}, 'day');
// ---- round 4 · the test: he thinks of the impossible — a race car
shot(R4, MON, (l, t) => {
  const shut = t > R4 + 1.0 && t < R4 + 2.4, open = t >= R4 + 2.4, laugh = t > R4 + 3.4, hug = eIO(prog(t, R4 + 4.0, R4 + 4.6));
  g.save(); handheld(t, shut ? .4 : 1, push(t, R4, R4 + 2.4, 1.0, 1.12) - (open ? .1 * eOut(prog(t, R4 + 2.4, R4 + 2.7)) : 0), 540, 1400);
  blurred(5, () => { sky('#5b3c8a', '#ff9a6a', '#ffcf8f'); skyline(1300, 'rgba(80,45,110,.75)', 61, 1.2); });
  g.fillStyle = '#3a3550'; g.fillRect(0, 1450, W, H); g.fillStyle = '#ffffff'; for (let x = -40; x < W; x += 180) g.fillRect(x + (t * 300 % 180) * open, 1640, 90, 14);
  if (open) { // dust from the "arrival"
    const d = prog(t, R4 + 2.4, R4 + 3.4); g.fillStyle = `rgba(230,200,160,${.6 * (1 - d)})`; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(1100 - d * 200 - i * 40, 1650 - rnd(i) * 80, 40 + d * 60 + rnd(i) * 30, 0, TAU); g.fill(); } }
  if (open) barkhan(g, { x: lerp(1600, 1040, eOut(prog(t, R4 + 2.4, R4 + 2.65))) - hug * 40, y: 1960, s: 1.05, face: -1, chew: t > R4 + 3 ? t * 6 : 0, lid: .45, helmet: true, pupil: [-1, 0], neck: .1,
    mouthProp: hug < .5 ? (gg) => ticket('ferrari', 50, 30, .85, -.15) : null }, DAY);
  const hp = hop(t, R4 + 3.45);
  squash(280, 1960, hp.sx, hp.sy, () => seryoga(g, { x: 280 + hug * 90, y: 1960 + hp.y, s: 1.1, face: open ? .8 : 0, lean: hug * .2, bob: breath(t, 3),
    mouth: laugh ? 'grin' : shut ? 'grit' : open ? 'o' : 'flat', mouthOpen: 1, eyeOpen: shut ? .05 : laugh ? .45 : open ? 1.35 : .9 * blink(t, 3), brow: shut ? -1 : open ? 1 : .2,
    pupil: open ? [1, 0] : [Math.sin(t * 5) * (t < R4 + 1 ? 1 : 0), 0], armL: hug > 0 ? [-2.3, .9] : shut ? [-2.6, 1.3] : [-.42, .25], armR: hug > 0 ? [2.4, -.4] : shut ? [2.6, -1.3] : [.42, -.25],
    prop: hug > .5 ? (gg, ex, ey) => ticket('ferrari', ex + 10, ey - 60, .6, -.2) : null }, DAY));
  g.restore();
  thought(430, 1240, 600, 700, t, R4 + 1.15, R4 + 2.35, '🏎️', 1.1);
  if (open && t < R4 + 2.6) { g.fillStyle = `rgba(255,255,255,${1 - prog(t, R4 + 2.4, R4 + 2.6)})`; g.fillRect(0, 0, W, H); }
}, 'sunset');
// ---- montage · 4 × 1.6 s, each opens with the ticket being torn
const MK = [['aqua', 0], ['yacht', 1], ['burj', 2], ['ferrari', 3]];
MK.forEach(([key, i]) => shot(MON + i * 1.6, MON + (i + 1) * 1.6, (l, t) => {
  g.save(); handheld(t, 1.1, 1.05);
  if (key === 'aqua') { sky('#6fd0ff', '#bdeaff', '#d9f6ff'); g.strokeStyle = '#ff7b39'; g.lineWidth = 170; g.lineCap = 'round'; g.beginPath(); g.moveTo(-100, 500); g.bezierCurveTo(900, 600, 100, 1050, 700, 1350); g.stroke(); g.strokeStyle = '#ffb07a'; g.lineWidth = 120; g.stroke(); g.fillStyle = '#1aa7e0'; g.fillRect(0, 1450, W, H);
    const k = prog(l, 0, 1.45); seryoga(g, { x: lerp(60, 740, k), y: lerp(620, 1420, k), s: .8, face: .6, lean: -.5, mouth: 'grin', eyeOpen: .5, brow: 1, armL: [-2.8, 0], armR: [2.8, 0] }, DAY); }
  if (key === 'yacht') { sky('#7fc8ff', '#ffe3c0', '#ffd0a0'); skyline(1200, '#a7bfd6', 41, 1.3); g.fillStyle = lg(0, 1200, 0, H, [[0, '#1d8fc9'], [1, '#0b5f8f']]); g.fillRect(0, 1200, W, H);
    const bob = Math.sin(t * 3) * 10; g.save(); g.translate(560 - l * 80, 1430 + bob); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-420, -40); g.lineTo(380, -40); g.lineTo(470, -110); g.lineTo(330, 70); g.lineTo(-380, 70); g.closePath(); g.fill(); g.fillStyle = '#1b2a4a'; g.fillRect(-380, 20, 710, 16); g.restore();
    seryoga(g, { x: 640 - l * 80, y: 1390 + bob, s: .62, face: -.3, mouth: 'grin', eyeOpen: .55, brow: .8, armL: [-2.6, .4] }, DAY);
    barkhan(g, { x: 300 - l * 80, y: 1395 + bob, s: .42, face: 1, chew: t * 5, lid: .4, shades: true }, DAY); }
  if (key === 'burj') { sky('#ffb98a', '#ffe0b8', '#bfe3ff'); skyline(1500, '#9fb7cf', 21, 1.3); g.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 5; i++) g.fillRect(i * 260, 0, 12, H); g.fillStyle = '#2d3550'; g.fillRect(0, 1500, W, H);
    seryoga(g, { x: 380, y: 1900, s: 1.0, face: .4, mouth: 'grin', eyeOpen: .6, brow: .6, armR: [2.7, -.2] }, DAY); barkhan(g, { x: 900, y: 1880, s: .8, face: -1, chew: t * 5, lid: .4, shades: true, pupil: [-1, -.5] }, DAY); }
  if (key === 'ferrari') { sky('#ff8a5c', '#ffcf8f', '#ffe2b0'); g.fillStyle = '#3a3550'; g.fillRect(0, 1300, W, H); g.fillStyle = '#fff'; for (let x = -200; x < W + 200; x += 220) g.fillRect(((x - t * 1400) % (W + 400) + W + 400) % (W + 400) - 200, 1560, 110, 14);
    g.save(); g.translate(560, 1500 + Math.sin(t * 30) * 3); g.fillStyle = '#e8261c'; g.beginPath(); g.moveTo(-420, 0); g.lineTo(-380, -110); g.lineTo(-120, -140); g.lineTo(40, -230); g.lineTo(220, -230); g.lineTo(330, -130); g.lineTo(440, -110); g.lineTo(460, 0); g.closePath(); g.fill();
    [-260, 290].forEach(wx => { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(wx, 0, 80, 0, TAU); g.fill(); g.fillStyle = '#c0c0c0'; g.beginPath(); g.arc(wx, 0, 34, 0, TAU); g.fill(); }); g.restore();
    seryoga(g, { x: 460, y: 1560, s: .55, face: .3, mouth: 'grin', eyeOpen: .4, brow: 1, armL: [-2.7, .4], armR: [2.7, -.4] }, DAY);
    barkhan(g, { x: 760, y: 1600, s: .4, face: 1, chew: 0, lid: .3, helmet: true }, DAY);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; for (let i = 0; i < 8; i++) { const y = 1200 + i * 50; g.beginPath(); g.moveTo(0, y); g.lineTo(200 + rnd(i) * 200, y); g.stroke(); } }
  g.restore();
  tearFx(t, MON + i * 1.6, key);
}, key === 'ferrari' ? 'sunset' : 'day'));
// ---- finale · sunset dune, two friends
shot(FIN, END, (l, t) => {
  g.save(); handheld(t, .5, push(t, FIN, END, 1.0, 1.06), 540, 1400);
  g.fillStyle = lg(0, 0, 0, H, [[0, '#4b3a8a'], [.5, '#ff8a5c'], [1, '#ffcf8f']]); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,225,150,.95)'; g.beginPath(); g.arc(540, 1000, 160, 0, TAU); g.fill();
  const sg = g.createRadialGradient(540, 1000, 150, 540, 1000, 560); sg.addColorStop(0, 'rgba(255,200,120,.5)'); sg.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = sg; g.fillRect(0, 400, W, 1200);
  blurred(3, () => { skyline(1180, 'rgba(90,50,110,.5)', 71, 1.0); burj(840, 1190, 700, 'rgba(80,45,110,.6)'); });
  g.fillStyle = '#d98b52'; g.beginPath(); g.moveTo(0, 1200); g.quadraticCurveTo(540, 1120, W, 1230); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  barkhan(g, { x: 700, y: 1620, s: .85, face: -1, sit: 1, chew: t * 4, lid: t % 3.3 < .12 ? .95 : .45, pupil: [-1, -.2], neck: .05 }, SUNSET);
  seryoga(g, { x: 360, y: 1980, s: .95, face: .45, bob: breath(t, 4) * .6, mouth: 'smile', eyeOpen: .55 * blink(t, 4), brow: .4, pupil: [.6, -.3], armR: [1.6, -1.3], armL: [-.42, .25],
    prop: (gg, ex, ey) => ['aqua', 'yacht', 'burj', 'ferrari'].forEach((k, i) => ticket(k, ex + 10 + i * 18, ey - 60 - i * 6, .5, -.5 + i * .25)) }, SUNSET);
  g.fillStyle = '#c4733e'; g.beginPath(); g.moveTo(0, 1700); g.quadraticCurveTo(540, 1640, W, 1720); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.restore();
  const a = eOut(prog(t, FIN + .6, FIN + 1.3)); g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 30);
  txt('Когда в Дубае', 540, 420, 84, '#fff', { glow: 'rgba(60,20,60,.5)', gr: 24 }); txt('есть свой человек', 540, 520, 84, '#ffe07a', { glow: 'rgba(60,20,60,.5)', gr: 24 }); g.restore();
}, 'sunset');
// ---- end card
shot(END, DUR + 1, (l, t) => {
  g.fillStyle = lg(0, 0, 0, H, [[0, '#0f3d8a'], [.6, '#1f6fd1'], [1, '#2a86e8']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.06 + rnd(i) * .08})`; g.beginPath(); g.ellipse((rnd(i + 1) * W + t * 12) % (W + 200) - 100, rnd(i + 2) * 900, 120 + rnd(i) * 160, 8, -.15, 0, TAU); g.fill(); }
  skyline(1700, 'rgba(10,40,100,.45)', 51, 1.2); burj(820, 1710, 900, 'rgba(10,40,100,.55)');
  const a = t0 => { const p = eOut(prog(l, t0, t0 + .45)); g.globalAlpha = p; return (1 - p) * 40; };
  let d = a(.05); txt('Билеты на все', 540, 430 + d, 76, '#fff'); txt('развлечения Дубая', 540, 525 + d, 76, '#ffd34d'); g.globalAlpha = 1;
  ['aqua', 'yacht', 'burj', 'ferrari', 'safari'].forEach((k, i) => { const p = back(prog(l, .4 + i * .08, .7 + i * .08), 2); if (p <= 0) return; ticket(k, 540 + (i - 2) * 150, 760 + Math.abs(i - 2) * 28, .62 * p, (i - 2) * .16); });
  const p = prog(l, 1.0, 1.5); g.save(); g.translate(540, 1010); g.scale(lerp(.8, 1, back(p)), lerp(.8, 1, back(p))); g.globalAlpha = p; logo(0, 0, 92, 1.3); g.restore();
  d = a(1.5); txt('Telegram · WhatsApp · Instagram', 540, 1150 + d, 40, 'rgba(255,255,255,.85)', { w: 700 }); g.globalAlpha = 1;
  const cp = eOut(prog(l, 1.8, 2.5));
  barkhan(g, { x: 1180 - cp * 250, y: 2150, s: 1.0, face: -1, chew: l > 2.9 ? 0 : t * 5, lid: l > 3.0 && l < 3.15 ? .95 : .5, shades: true, pupil: [-1, -.4], neck: .2 }, { ...DAY, dir: 1 });
}, 'end');
