// =====================================================================
//  «ДЕНЬ 1. СНОВА» — character rigs (2D vector, code-drawn)
//  Серёга (tourist) and Бархан (the camel). Origin = point between the feet.
//  All drawing goes through a 2D context `g` passed in.
// =====================================================================
(function (root) {
  const TAU = Math.PI * 2;
  const shade = (hex, k) => { // k<0 darker, k>0 lighter
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
    const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  };
  // fill a path with base colour + soft form shadow away from the light + rim light
  function body(g, path, base, L, o = {}) {
    g.save(); path(); g.fillStyle = base; g.fill();
    g.clip();
    const bb = o.bb || [-200, -200, 400, 400];
    const lx = L.dir ?? -1;
    if (o.cel !== false) { // hard cel shadow: shape shifted toward the light stays lit
      const k = Math.max(6, Math.min(bb[2], bb[3]) * .11);
      g.fillStyle = L.cel || 'rgba(70,20,80,.22)'; g.fillRect(bb[0] - 60, bb[1] - 60, bb[2] + 120, bb[3] + 120);
      g.save(); g.translate(lx * k, -k * .55); path(); g.fillStyle = base; g.fill(); g.restore();
    }
    const gr = g.createLinearGradient(bb[0] + (lx < 0 ? 0 : bb[2]), 0, bb[0] + (lx < 0 ? bb[2] : 0), 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, L.shadow || 'rgba(40,10,60,.32)');
    g.fillStyle = gr; g.fillRect(bb[0] - 50, bb[1] - 50, bb[2] + 100, bb[3] + 100);
    const gv = g.createLinearGradient(0, bb[1], 0, bb[1] + bb[3]);
    gv.addColorStop(0, 'rgba(255,255,255,0)'); gv.addColorStop(1, L.ground || 'rgba(30,10,50,.18)');
    g.fillStyle = gv; g.fillRect(bb[0] - 50, bb[1] - 50, bb[2] + 100, bb[3] + 100);
    g.restore();
    g.save(); path(); g.lineWidth = o.lw ?? 5; g.strokeStyle = o.line || shade(base, -.45); g.lineJoin = 'round'; g.stroke(); g.restore();
    if (L.rim) { // rim light: inner edge band, fading from the lit side
      const x0 = lx < 0 ? bb[0] : bb[0] + bb[2], x1 = lx < 0 ? bb[0] + bb[2] * .45 : bb[0] + bb[2] * .55;
      const rg = g.createLinearGradient(x0, 0, x1, 0); rg.addColorStop(0, L.rim); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); path(); g.clip(); path(); g.lineWidth = 16; g.strokeStyle = rg; g.stroke(); g.restore();
      g.save(); path(); g.lineWidth = o.lw ?? 5; g.strokeStyle = o.line || shade(base, -.45); g.stroke(); g.restore();
    }
  }
  const ell = (g, x, y, rx, ry, r = 0) => () => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, TAU); };
  function limb(g, x0, y0, a1, l1, a2, l2, w, col, L, end) {
    // two-segment limb, angles in radians from straight down
    const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
    const x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = shade(col, -.45); g.lineWidth = w + 10;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = 'rgba(40,10,60,.18)'; g.lineWidth = w * .45;
    g.beginPath(); g.moveTo(x0 + (L.dir > 0 ? -w * .25 : w * .25), y0); g.lineTo(x1 + (L.dir > 0 ? -w * .25 : w * .25), y1); g.lineTo(x2, y2); g.stroke();
    g.restore();
    if (end) end(x2, y2, a1 + a2);
    return [x2, y2];
  }

  // ------------------------------------------------------------ SERYOGA
  const SER = {
    skin: '#f2c29a', blush: '#ef8f86', shirt: '#1fa59a', flower: '#fff3d6', flower2: '#ffb347',
    shorts: '#d1a96b', hat: '#f1e4c0', band: '#27304f', hair: '#5a3b2a', strap: '#ff7b39',
    sock: '#ffffff', sandal: '#7a4a2b', glasses: '#1c2033', line: '#3b2230',
  };
  const DEF_S = { x: 0, y: 0, s: 1, face: 0, lean: 0, bob: 0, walk: null,
    armL: [.25, -.35], armR: [-.25, .35], legL: 0, legR: 0,
    brow: 0, browTilt: 0, eyeOpen: 1, pupil: [0, 0], mouth: 'smile', mouthOpen: 0, twitch: 0, sweat: 0, bags: 0,
    hat: true, prop: null, propHand: 'R', blush: .5 };
  function seryoga(g, opt = {}, L = { dir: -1 }) {
    const o = Object.assign({}, DEF_S, opt);
    g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s);
    // contact shadow
    g.save(); g.fillStyle = L.cast || 'rgba(20,0,40,.28)'; g.beginPath(); g.ellipse(0, 0, 140, 22, 0, 0, TAU); g.fill(); g.restore();
    let lL = o.legL, lR = o.legR, aL = o.armL, aR = o.armR, bob = o.bob;
    if (o.walk !== null) { const w = o.walk; lL = Math.sin(w) * .45; lR = -Math.sin(w) * .45; bob = Math.abs(Math.cos(w)) * -12; aL = [-Math.sin(w) * .5 + .15, -.5]; aR = [Math.sin(w) * .5 - .15, .5]; }
    g.translate(0, bob);
    g.rotate(o.lean);
    const fx = o.face * 28; // 3/4 turn: face features shift
    // legs
    const leg = (x, a) => limb(g, x, -165, a, 80, -Math.abs(a) * .3, 72, 52, SER.skin, L, (ex, ey) => {
      g.save(); g.translate(ex, ey); g.rotate(-a * .3);
      g.fillStyle = SER.sock; g.fillRect(-27, -24, 54, 24);
      g.fillStyle = SER.sandal; g.beginPath(); g.roundRect(-42 + o.face * 10, -8, 90, 24, 12); g.fill();
      g.strokeStyle = shade(SER.sandal, -.4); g.lineWidth = 4; g.stroke(); g.restore();
    });
    leg(-50, lL); leg(50, lR);
    g.translate(0, 50);
    // shorts
    body(g, () => { g.beginPath(); g.moveTo(-118, -330); g.lineTo(118, -330); g.lineTo(110, -205); g.lineTo(10, -200); g.lineTo(0, -232); g.lineTo(-10, -200); g.lineTo(-110, -205); g.closePath(); }, SER.shorts, L, { bb: [-120, -330, 240, 130] });
    // back arm (left) behind torso
    const arm = (sx, a) => { limb(g, sx, -455, a[0], 100, a[1], 92, 40, SER.skin, L, (ex, ey, ang) => {
      g.save(); g.translate(ex, ey); g.rotate(-ang);
      body(g, ell(g, 0, 8, 26, 30), SER.skin, L, { bb: [-26, -22, 52, 60], cel: false });
      body(g, ell(g, -sx / Math.abs(sx) * 22, -2, 10, 17, sx > 0 ? .5 : -.5), SER.skin, L, { bb: [-34, -20, 24, 36], cel: false, lw: 4 });
      g.restore();
      if (o.prop && ((o.propHand === 'R' && sx > 0) || (o.propHand === 'L' && sx < 0))) o.prop(g, ex, ey);
    });
      // short sleeve over the upper arm
      g.save(); g.translate(sx, -455); g.rotate(-a[0]);
      const sl = () => { g.beginPath(); g.moveTo(-34, -22); g.lineTo(34, -22); g.lineTo(38, 62); g.quadraticCurveTo(0, 72, -38, 62); g.closePath(); };
      body(g, sl, SER.shirt, L, { bb: [-38, -22, 76, 92] });
      g.save(); sl(); g.clip(); g.fillStyle = SER.flower; g.beginPath(); g.arc(8, 25, 9, 0, TAU); g.fill(); g.restore();
      g.restore(); };
    arm(-108, aL);
    // torso (round belly) in the shirt
    const torso = () => { g.beginPath(); g.moveTo(-95, -480); g.bezierCurveTo(-150, -440, -160, -330, -120, -300); g.bezierCurveTo(-60, -270, 60, -270, 120, -300); g.bezierCurveTo(160, -330, 150, -440, 95, -480); g.closePath(); };
    body(g, torso, SER.shirt, L, { bb: [-160, -480, 320, 210] });
    g.save(); torso(); g.clip(); // hibiscus pattern
    [[-90, -420], [40, -450], [80, -350], [-40, -330], [-120, -340], [110, -430], [0, -400]].forEach(([px, py], i) => {
      g.save(); g.translate(px + fx * .3, py); g.rotate(i);
      g.fillStyle = i % 2 ? SER.flower : SER.flower2; for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -11, 7, 12, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#e8584e'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.restore();
    });
    // placket + buttons
    g.strokeStyle = shade(SER.shirt, -.3); g.lineWidth = 4; g.beginPath(); g.moveTo(fx * .5, -440); g.lineTo(fx * .5, -285); g.stroke();
    g.fillStyle = shade(SER.shirt, .55); [-410, -365, -320].forEach(by2 => { g.beginPath(); g.arc(fx * .5, by2, 5, 0, TAU); g.fill(); });
    g.restore();
    // open camp collar + skin V
    g.save(); g.fillStyle = SER.skin; g.beginPath(); g.moveTo(-40 + fx * .3, -486); g.lineTo(40 + fx * .3, -486); g.lineTo(fx * .5, -435); g.closePath(); g.fill();
    [-1, 1].forEach(sd => { g.fillStyle = shade(SER.shirt, -.12); g.strokeStyle = shade(SER.shirt, -.45); g.lineWidth = 4; g.beginPath(); g.moveTo(sd * 52 + fx * .3, -492); g.lineTo(fx * .5, -432); g.lineTo(sd * 20 + fx * .4, -440); g.lineTo(sd * 70 + fx * .3, -458); g.closePath(); g.fill(); g.stroke(); });
    g.restore();
    // backpack straps
    g.save(); g.strokeStyle = SER.strap; g.lineWidth = 20; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-70, -478); g.quadraticCurveTo(-95, -400, -78, -330); g.moveTo(70, -478); g.quadraticCurveTo(95, -400, 78, -330); g.stroke(); g.restore();
    arm(108, aR);
    // neck + head
    const hy = -585;
    body(g, ell(g, fx * .2, -490, 40, 26), SER.skin, L, { bb: [-40, -516, 80, 52] });
    const head = ell(g, fx * .25, hy, 108, 112);
    body(g, head, SER.skin, L, { bb: [-108, hy - 112, 216, 224] });
    // ears
    [-1, 1].forEach(sd => { if (sd * o.face > .6) return; body(g, ell(g, sd * 106 + fx * .1, hy + 6, 18, 26), SER.skin, L, { bb: [sd * 106 - 18, hy - 20, 36, 52] }); });
    // hair sideburns
    g.fillStyle = SER.hair; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 92 + fx * .2, hy - 40, 16, 32, sd * .3, 0, TAU); g.fill(); });
    // cheeks
    g.save(); g.globalAlpha = o.blush; g.fillStyle = SER.blush; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 58 + fx, hy + 30, 22, 13, 0, 0, TAU); g.fill(); }); g.restore();
    // curly fringe peeking under the hat
    // eyes
    const ex = [-40 + fx, 40 + fx], ey = hy - 8;
    ex.forEach((x, i) => {
      const open = Math.max(.05, o.eyeOpen * (i === 1 && o.twitch ? (1 - o.twitch * .7) : 1));
      g.save(); g.fillStyle = '#fff'; g.strokeStyle = SER.line; g.lineWidth = 4.5;
      g.beginPath(); g.ellipse(x, ey, 25, 30 * open, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(x, ey, 25, 30 * open, 0, 0, TAU); g.clip();
      g.fillStyle = '#7a4a26'; g.beginPath(); g.arc(x + o.pupil[0] * 10 + o.face * 6, ey + o.pupil[1] * 10, 16, 0, TAU); g.fill();
      g.fillStyle = '#2b1a14'; g.beginPath(); g.arc(x + o.pupil[0] * 10 + o.face * 6, ey + o.pupil[1] * 10, 9.5, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + o.pupil[0] * 10 + o.face * 6 - 4, ey + o.pupil[1] * 10 - 5, 4, 0, TAU); g.fill();
      g.restore();
      if (o.bags) { g.save(); g.strokeStyle = `rgba(110,60,120,${o.bags})`; g.lineWidth = 5; g.beginPath(); g.arc(x, ey + 26, 20, .3, Math.PI - .3); g.stroke(); g.restore(); }
    });
    // brows
    g.save(); g.strokeStyle = SER.hair; g.lineWidth = 11; g.lineCap = 'round';
    ex.forEach((x, i) => { const sd = i ? 1 : -1; const tilt = o.browTilt * sd; const by = ey - 44 - o.brow * 14 + (i === 1 && o.twitch ? -o.twitch * 8 : 0);
      g.beginPath(); g.moveTo(x - 22, by + tilt * -10 * -1 * sd); g.lineTo(x + 22, by + tilt * 10 * -1 * sd); g.stroke(); });
    g.restore();
    // nose (sunburnt)
    body(g, ell(g, fx * 1.15, hy + 22, 19, 15), '#f29a83', L, { bb: [-19, hy + 7, 38, 30], lw: 3.5, cel: false });
    g.save(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(fx * 1.15 - 6, hy + 15, 6, 4, -.4, 0, TAU); g.fill(); g.restore();
    // mouth
    g.save(); g.strokeStyle = SER.line; g.lineWidth = 6; g.lineCap = 'round'; const mx = fx * 1.05, my = hy + 58;
    if (o.mouth === 'smile') { g.beginPath(); g.arc(mx, my - 16, 30, .35, Math.PI - .35); g.stroke(); }
    else if (o.mouth === 'grin') { g.fillStyle = '#7a2a3a'; g.beginPath(); g.arc(mx, my - 14, 34, .1, Math.PI - .1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(mx - 24, my - 12, 48, 9); }
    else if (o.mouth === 'flat') { g.beginPath(); g.moveTo(mx - 22, my); g.lineTo(mx + 22, my); g.stroke(); }
    else if (o.mouth === 'frown') { g.beginPath(); g.arc(mx, my + 22, 26, Math.PI + .5, -.5); g.stroke(); }
    else if (o.mouth === 'o') { g.fillStyle = '#7a2a3a'; g.beginPath(); g.ellipse(mx, my, 13, 17 + o.mouthOpen * 8, 0, 0, TAU); g.fill(); g.stroke(); }
    else if (o.mouth === 'grit') { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(mx - 30, my - 12, 60, 24, 8); g.fill(); g.stroke(); g.lineWidth = 3; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(mx + k * 15, my - 12); g.lineTo(mx + k * 15, my + 12); g.stroke(); } g.beginPath(); g.moveTo(mx - 30, my); g.lineTo(mx + 30, my); g.stroke(); }
    g.restore();
    // sweat drop
    if (o.sweat > 0) { g.save(); g.globalAlpha = o.sweat; g.fillStyle = '#9fe3ff'; g.strokeStyle = '#3a7fa8'; g.lineWidth = 3; const sx = 95 + fx * .2, sy = hy - 60; g.beginPath(); g.moveTo(sx, sy - 22); g.quadraticCurveTo(sx + 16, sy, sx, sy + 10); g.quadraticCurveTo(sx - 16, sy, sx, sy - 22); g.fill(); g.stroke(); g.restore(); }
    // panama hat + sunglasses on it
    if (o.hat) {
      body(g, ell(g, fx * .3, hy - 82, 158, 30), SER.hat, L, { bb: [-158, hy - 112, 316, 60] });
      body(g, () => { g.beginPath(); g.moveTo(-82 + fx * .3, hy - 86); g.bezierCurveTo(-86 + fx * .3, hy - 170, 86 + fx * .3, hy - 170, 82 + fx * .3, hy - 86); g.closePath(); }, SER.hat, L, { bb: [-90, hy - 170, 180, 90] });
      g.save(); g.fillStyle = SER.band; g.beginPath(); g.moveTo(-84 + fx * .3, hy - 92); g.lineTo(84 + fx * .3, hy - 92); g.lineTo(80 + fx * .3, hy - 116); g.lineTo(-80 + fx * .3, hy - 116); g.closePath(); g.fill(); g.restore();
      g.save(); g.fillStyle = SER.hair; g.strokeStyle = shade(SER.hair, -.4); g.lineWidth = 3; [-74, -46, -18].forEach((cx, i) => { g.beginPath(); g.arc(cx + fx * .35, hy - 62 + (i % 2) * 5, 17, 0, Math.PI * 1.05); g.fill(); g.stroke(); }); g.restore();
      g.save(); g.fillStyle = SER.glasses; g.strokeStyle = '#000'; g.lineWidth = 3; [-1, 1].forEach(sd => { g.beginPath(); g.roundRect(sd * 36 - 28 + fx * .5, hy - 132, 56, 30, 12); g.fill(); g.stroke(); });
      g.fillStyle = 'rgba(255,255,255,.5)'; [-1, 1].forEach(sd => g.fillRect(sd * 36 - 18 + fx * .5, hy - 126, 12, 5)); g.restore();
    }
    g.restore();
  }

  // ------------------------------------------------------------ BARKHAN (camel)
  const CAM = { fur: '#d9a066', dark: '#b07a45', light: '#f1c48a', muzzle: '#c98d58', lid: '#c48a54', tassel: '#e8443a', tassel2: '#ffd34d', line: '#5a3417' };
  const DEF_C = { x: 0, y: 0, s: 1, face: 1, chew: 0, blink: 0, lid: .55, neck: 0, headTilt: 0, sit: 0, walk: null, pupil: [0, 0], nod: 0 };
  function barkhan(g, opt = {}, L = { dir: -1 }) {
    const o = Object.assign({}, DEF_C, opt);
    g.save(); g.translate(o.x, o.y); g.scale(o.s * o.face, o.s);
    const Lc = Object.assign({}, L, { dir: (L.dir ?? -1) * o.face });
    const sit = o.sit, by = lerp(-430, -190, sit);
    g.save(); g.fillStyle = L.cast || 'rgba(20,0,40,.28)'; g.beginPath(); g.ellipse(10, 0, 260, 28, 0, 0, TAU); g.fill(); g.restore();
    // legs: tapered thigh -> knobby knee -> thin shin -> wide padded foot
    const legs = [[-150, 1], [-100, 0], [120, 1], [170, 0]];
    legs.forEach(([lx, back], i) => {
      let a = 0; if (o.walk !== null) a = Math.sin(o.walk + (i % 2) * Math.PI + (i > 1 ? Math.PI / 2 : 0)) * .3;
      const col = back ? CAM.dark : CAM.fur;
      if (sit > .01) body(g, ell(g, lx * .9, -34 - (1 - sit) * 120, 74, 34), col, Lc, { bb: [lx - 74, -70, 148, 70] });
      if (sit > .98) return;
      g.save(); g.globalAlpha = 1 - sit; const k = 1 - sit * .9;
      const top = by + 30, kx = lx + Math.sin(a) * 200 * k, ky = top + Math.cos(a) * 200 * k;
      const fx2 = kx + Math.sin(-a * .4) * 175 * k, fy = ky + Math.cos(-a * .4) * 175 * k;
      body(g, () => { g.beginPath(); g.moveTo(lx - 40, top - 40); g.quadraticCurveTo(lx - 50, top + 80, kx - 21, ky); g.lineTo(fx2 - 17, fy - 12); g.lineTo(fx2 + 17, fy - 12); g.lineTo(kx + 21, ky); g.quadraticCurveTo(lx + 48, top + 70, lx + 42, top - 40); g.closePath(); }, col, Lc, { bb: [lx - 50, top - 40, 100, 260] });
      body(g, ell(g, kx, ky, 25, 21), shade(col, -.06), Lc, { bb: [kx - 22, ky - 19, 44, 38], lw: 4 });
      body(g, () => { g.beginPath(); g.ellipse(fx2 + 8, fy - 6, 34, 14, 0, 0, TAU); }, shade(col, -.25), Lc, { bb: [fx2 - 30, fy - 20, 76, 28], lw: 4 });
      g.restore();
    });
    // tail
    g.save(); g.strokeStyle = CAM.dark; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-225, by - 20); g.quadraticCurveTo(-260, by + 40, -245, by + 90 + Math.sin(o.chew * 2) * 6); g.stroke();
    g.fillStyle = CAM.line; g.beginPath(); g.ellipse(-245, by + 100, 12, 22, .2, 0, TAU); g.fill(); g.restore();
    // body with two humps
    const bodyPath = () => { g.beginPath();
      g.moveTo(-230, by + 10);
      g.bezierCurveTo(-250, by - 80, -200, by - 110, -170, by - 120);
      g.bezierCurveTo(-140, by - 260, -40, by - 260, -20, by - 130);     // hump 1
      g.bezierCurveTo(0, by - 245, 110, by - 245, 125, by - 120);         // hump 2
      g.bezierCurveTo(170, by - 110, 215, by - 80, 220, by - 30);
      g.bezierCurveTo(225, by + 60, 160, by + 95, 60, by + 100);
      g.bezierCurveTo(-60, by + 108, -200, by + 90, -230, by + 10); g.closePath(); };
    body(g, bodyPath, CAM.fur, Lc, { bb: [-250, by - 260, 470, 370] });
    g.save(); bodyPath(); g.clip(); const bl = g.createLinearGradient(0, by + 20, 0, by + 105); bl.addColorStop(0, 'rgba(255,230,190,0)'); bl.addColorStop(1, 'rgba(255,230,190,.55)'); g.fillStyle = bl; g.fillRect(-260, by, 500, 110); g.restore();
    g.save(); g.strokeStyle = shade(CAM.fur, -.35); g.lineWidth = 4; g.lineCap = 'round';
    [[-95, by - 228], [-75, by - 232], [-115, by - 222], [55, by - 214], [75, by - 216], [35, by - 208]].forEach(([tx, ty], i) => { g.beginPath(); g.moveTo(tx, ty + 8); g.quadraticCurveTo(tx + 4, ty - 8, tx + 10 + (i % 2) * 4, ty - 14); g.stroke(); });
    g.restore();
    // saddle blanket (signature): striped red/gold
    g.save(); bodyPath(); g.clip();
    g.fillStyle = CAM.tassel; g.beginPath(); g.moveTo(-40, by - 140); g.lineTo(40, by - 145); g.lineTo(60, by + 20); g.lineTo(-60, by + 25); g.closePath(); g.fill();
    g.fillStyle = CAM.tassel2; for (let k = 0; k < 3; k++) g.fillRect(-58 + k * 2, by - 100 + k * 40, 116, 10);
    g.restore();
    // neck + head (S-curve from the chest, thick at the base)
    const nx = 170, ny = by + 10;
    const na = o.neck - sit * .05;
    g.save(); g.translate(nx, ny); g.rotate(na);
    const neckPath = () => { g.beginPath(); g.moveTo(-30, 70); g.bezierCurveTo(70, 60, 120, -10, 110, -120); g.bezierCurveTo(100, -200, 130, -270, 175, -300);
      g.lineTo(225, -260); g.bezierCurveTo(190, -230, 180, -170, 190, -110); g.bezierCurveTo(205, -10, 140, 110, 30, 110); g.closePath(); };
    body(g, neckPath, CAM.fur, Lc, { bb: [-30, -300, 255, 410] });
    g.save(); g.strokeStyle = shade(CAM.fur, -.15); g.lineWidth = 3; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(150 - k * 6, -220 + k * 50); g.lineTo(168 - k * 6, -214 + k * 50); g.stroke(); } g.restore();
    // head (bigger, long face, heavy brow)
    g.translate(205, -300 + o.nod * 10); g.rotate(o.headTilt + .05); g.scale(1.45, 1.45);
    const headPath = () => { g.beginPath(); g.moveTo(-50, -20); g.bezierCurveTo(-45, -70, 40, -75, 75, -40); g.bezierCurveTo(120, -30, 135, 5, 130, 30); g.bezierCurveTo(125, 55, 60, 60, 20, 45); g.bezierCurveTo(-30, 40, -55, 20, -50, -20); g.closePath(); };
    body(g, () => { g.beginPath(); g.ellipse(-40, -48, 12, 24, -.5, 0, TAU); }, CAM.dark, Lc, { bb: [-60, -75, 40, 55] });
    body(g, headPath, CAM.fur, Lc, { bb: [-55, -75, 190, 135], lw: 3.5 });
    // muzzle / droopy lip with chewing
    const ch = Math.sin(o.chew) * 6, chs = Math.cos(o.chew) * 4;
    body(g, () => { g.beginPath(); g.ellipse(100 + chs, 44 + Math.abs(ch) * 1.2, 30, 15, .1, 0, TAU); }, shade(CAM.muzzle, -.1), Lc, { bb: [70, 28, 62, 34], lw: 4, cel: false }); // lower lip
    [0, 1].forEach(k => body(g, () => { g.beginPath(); g.ellipse(104 + k * 22, 26, 20, 17, .2, 0, TAU); }, CAM.muzzle, Lc, { bb: [84, 9, 62, 36], lw: 4, cel: false })); // split upper lip
    g.save(); g.strokeStyle = CAM.dark; g.lineWidth = 4; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(70 + k * 8, 56 + Math.abs(ch)); g.lineTo(66 + k * 8, 72 + Math.abs(ch) + k % 2 * 4); g.stroke(); } // chin tuft
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-20 + k * 12, -66); g.quadraticCurveTo(-26 + k * 12, -84, -12 + k * 12, -90 - k % 2 * 5); g.stroke(); } g.restore(); // head tuft
    g.save(); g.strokeStyle = CAM.line; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(118, 2); g.quadraticCurveTo(126, 6, 124, 14); g.stroke(); // nostril
    g.beginPath(); g.moveTo(84, 30 + ch * .3); g.quadraticCurveTo(110, 26 + ch * .5, 136, 32); g.stroke(); // mouth line
    g.restore();
    // eye with heavy lid (the deadpan stare)
    const lid = clamp(o.lid + o.blink * (1 - o.lid), 0, 1);
    g.save(); g.fillStyle = '#fff'; g.strokeStyle = CAM.line; g.lineWidth = 4;
    g.beginPath(); g.ellipse(20, -22, 24, 20, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(20, -22, 24, 20, 0, 0, TAU); g.clip();
    g.fillStyle = '#2a170c'; g.beginPath(); g.arc(24 + o.pupil[0] * 7, -20 + o.pupil[1] * 6, 9, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(21 + o.pupil[0] * 7, -24 + o.pupil[1] * 6, 3, 0, TAU); g.fill();
    g.fillStyle = CAM.lid; g.fillRect(-5, -42, 50, 4 + 36 * lid);
    g.strokeStyle = CAM.line; g.lineWidth = 4; g.beginPath(); g.moveTo(-2, -40 + 36 * lid); g.lineTo(42, -40 + 36 * lid); g.stroke();
    g.restore();
    g.beginPath(); g.ellipse(20, -22, 24, 20, 0, 0, TAU); g.stroke();
    g.strokeStyle = CAM.line; g.lineWidth = 5; g.beginPath(); g.moveTo(-6, -46); g.quadraticCurveTo(20, -54, 46, -44); g.stroke();
    // lashes
    g.lineWidth = 3.5; for (let k = 0; k < 4; k++) { const lx = 4 + k * 11, ly = -40 + 36 * lid; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx - 2 + k, ly + 9); g.stroke(); }
    g.restore();
    // bridle with tassel
    g.save(); g.strokeStyle = CAM.tassel; g.lineWidth = 7; g.beginPath(); g.moveTo(-20, 30); g.quadraticCurveTo(40, 10, 95, 0); g.stroke();
    g.fillStyle = CAM.tassel2; g.beginPath(); g.arc(-20, 32, 9, 0, TAU); g.fill();
    g.strokeStyle = CAM.tassel; g.lineWidth = 4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-20, 38); g.lineTo(-20 + k * 4 + Math.sin(o.chew * .5) * 3, 70); g.stroke(); }
    g.restore();
    g.restore();
    g.restore();
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, x) => a + (b - a) * x;
  root.CHAR = { seryoga, barkhan, shade, body };
})(window);
