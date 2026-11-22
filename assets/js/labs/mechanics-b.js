/* ============================================================
   Mechanics labs 06–10
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const C = OL.canvas;
  const K = OL.labKit;
  const U = OL.utils;
  const P = OL.palette;

  function localPoint(view, p) {
    const f = view && view._frame;
    if (!f || !f.s) return null;
    return { x: (p.x - f.ox) / f.s, y: (p.y - f.oy) / f.s };
  }

  /* ------------------------------------------------------------
     06 · 探究向心力的大小
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'centripetal',
    live: false,
    playable: true,
    pointer: true,
    hint: '拖动手柄或小球 · 手柄带动小球做圆周运动',
    step(state, dt, view) { view.t += dt; },
    onPointerDown(p, state, view) {
      const q = localPoint(view, p);
      if (!q) return false;
      const balls = view._balls || [];
      for (let i = 0; i < balls.length; i++) {
        if (Math.hypot(q.x - balls[i].x, q.y - balls[i].y) < 24) {
          state._drag = { type: 'ball' };
          view.playing = false;
          return true;
        }
      }
      const c = view._crank;
      if (c && Math.hypot(q.x - c.x, q.y - c.y) < 44) {
        state._drag = { type: 'crank' };
        state._lastCrank = Math.atan2(q.y - c.y, q.x - c.x);
        view.playing = false;
        return true;
      }
      return false;
    },
    onPointerMove(p, state, view) {
      if (!state._drag) return;
      const q = localPoint(view, p);
      if (!q) return;
      if (state._drag.type === 'crank') {
        const c = view._crank;
        if (!c) return;
        const a = Math.atan2(q.y - c.y, q.x - c.x);
        let d = a - (state._lastCrank == null ? a : state._lastCrank);
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        state._lastCrank = a;
        if (Math.abs(d) > 0.0005) {
          view.t -= d / Math.max(state.omega, 0.35);
          view.dirty = true;
        }
        return;
      }
      if (state._drag.type === 'ball') {
        const cx = 448, cy = 252;
        const px = Math.hypot(q.x - cx, (q.y - cy) / 0.38);
        state.r = U.clamp(0.3 + (px - 58) / 168 * 1.2, 0.3, 1.5);
        const slider = document.querySelector('#ctl-r');
        if (slider) {
          slider.value = state.r.toFixed(2);
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        view.dirty = true;
      }
    },
    onPointerUp(p, state, view) {
      state._drag = null;
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      view._frame = { s: f.s, ox: f.ox, oy: f.oy, W: f.W, H: f.H };
      const cx = 448, cy = 252;
      const armPx = 58 + (state.r - 0.3) / 1.2 * 168;
      const phase = -view.t * state.omega - Math.PI / 2;
      const tilt = 0.38;
      const ballAt = (a) => ({ x: cx + Math.cos(a) * armPx, y: cy + Math.sin(a) * armPx * tilt });
      const b1 = ballAt(phase), b2 = ballAt(phase + Math.PI);
      view._balls = [b1, b2];
      const F = state.m * state.omega * state.omega * state.r;
      const v = state.omega * state.r;

      const poly = (pts, fill, stroke, lw) => {
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
      };
      const metal = (x, y, r, inner) => {
        const g = ctx.createRadialGradient(x - r * .35, y - r * .4, 1, x, y, r);
        g.addColorStop(0, '#f6f8fb'); g.addColorStop(.3, inner || '#cbd4df');
        g.addColorStop(.75, '#7e8a9b'); g.addColorStop(1, '#3d4653');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(30,38,50,.7)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - r * .35, y - r * .38, r * .22, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
      };

      // floor shadow
      ctx.save();
      ctx.translate(0, 14);
      ctx.filter = 'blur(12px)';
      poly([[250, 380], [700, 340], [760, 385], [330, 425]], 'rgba(0,0,0,.38)');
      ctx.restore();

      // solid laboratory base
      poly([[250, 330], [620, 318], [710, 365], [330, 390]], '#263744', 'rgba(155,177,197,.4)', 1.2);
      poly([[330, 390], [710, 365], [710, 410], [330, 440]], '#17242f', 'rgba(120,145,166,.32)', 1.2);
      poly([[250, 330], [330, 390], [330, 440], [238, 372]], '#1e2c38', 'rgba(120,145,166,.28)', 1);
      poly([[250, 330], [620, 318], [620, 330], [250, 342]], 'rgba(255,255,255,.06)');
      C.label(ctx, '手摇向心力演示器', 252, 426, { size: 9, color: 'rgba(225,236,250,.55)' });
      C.label(ctx, '金属灰 · 实验室常规结构', 252, 439, { size: 7, color: 'rgba(225,236,250,.28)' });

      // base feet and white drive pulleys
      [[338, 447], [684, 417], [260, 382], [720, 378]].forEach((p) => {
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 17, 8, 0, 0, Math.PI * 2); ctx.fillStyle = '#101820'; ctx.fill();
      });
      [[356, 342, 70, 22], [596, 338, 66, 21]].forEach((p) => {
        ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2], p[3], 0, 0, Math.PI * 2);
        ctx.fillStyle = '#d7d3c8'; ctx.fill(); ctx.strokeStyle = 'rgba(55,64,72,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] - 13, p[3] - 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(90,100,110,.4)'; ctx.stroke();
      });

      // two spring-loaded vertical posts with scale sleeves
      const post = (x) => {
        C.fillRound(ctx, x - 11, 174, 22, 160, 7, '#28343f');
        C.fillRound(ctx, x - 7, 177, 7, 154, 3, 'rgba(220,228,238,.18)');
        C.fillRound(ctx, x - 17, 174, 34, 12, 4, '#4b5a68');
        C.fillRound(ctx, x - 15, 186, 30, 8, 3, '#171f27');
        for (let i = 0; i < 9; i++) {
          const yy = 196 + i * 10;
          C.line(ctx, x - 10, yy, x + 10, yy + 5, 'rgba(210,220,232,.32)', 1);
        }
        C.label(ctx, '测力套筒', x, 166, { size: 6.8, align: 'center', color: 'rgba(225,236,250,.48)' });
      };
      post(274); post(622);

      // central vertical spindle
      C.fillRound(ctx, cx - 8, 214, 16, 120, 6, '#5c6977');
      C.fillRound(ctx, cx - 4, 214, 5, 118, 3, 'rgba(235,242,250,.4)');
      C.fillRound(ctx, cx - 25, 208, 50, 9, 4, '#8795a5');

      // rotating arms / graduated slide bars
      [b1, b2].forEach((b, i) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(30,38,48,.95)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = i === 0 ? '#7c8b9a' : '#687787'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(b.x, b.y); ctx.stroke();
        for (let k = 1; k < 6; k++) {
          const t = k / 6, x = cx + (b.x - cx) * t, y = cy + (b.y - cy) * t;
          C.line(ctx, x - 4, y - 3, x + 4, y + 3, 'rgba(230,238,248,.35)', .8);
        }
        // movable collar / counterweight sleeve
        const collar = ballAt(phase + (i ? Math.PI : 0) - .28);
        C.fillRound(ctx, collar.x - 10, collar.y - 10, 20, 20, 4, '#b5bec9');
        C.fillRound(ctx, collar.x - 7, collar.y - 7, 14, 14, 3, '#303b47');
        ctx.restore();
      });

      // elliptical orbit and swept phase
      ctx.save();
      ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(110,190,255,.35)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(cx, cy, armPx, armPx * tilt, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      K.arc(ctx, cx, cy, armPx * .72, -Math.PI / 2, phase, 'rgba(100,210,255,.24)', 1.5);

      // drive belt and hand crank
      C.line(ctx, 356, 354, 596, 350, 'rgba(28,35,44,.85)', 5);
      C.line(ctx, 356, 360, 596, 356, 'rgba(28,35,44,.85)', 5);
      for (let i = 0; i < 7; i++) {
        const t = (i / 7 + (view.t * .35) % 1) % 1;
        const x = 356 + (596 - 356) * t;
        C.dot(ctx, x, 354 + Math.sin(t * Math.PI) * 6, 2.2, 'rgba(190,210,230,.55)', 2);
      }
      const crankBase = { x: 714, y: 326 };
      C.fillRound(ctx, crankBase.x - 18, 294, 36, 14, 5, '#4d5c6b');
      C.fillRound(ctx, crankBase.x - 5, 306, 10, 48, 4, '#96a4b4');
      const ca = phase * .8 + Math.PI;
      const hx = crankBase.x + Math.cos(ca) * 34, hy = 320 + Math.sin(ca) * 34;
      C.line(ctx, crankBase.x + 4, 320, hx, hy, '#aeb9c6', 7);
      C.dot(ctx, hx, hy, 10, '#2a333e', 4);
      C.label(ctx, '手摇手柄', crankBase.x + 42, 345, { size: 7, color: 'rgba(225,236,250,.5)' });
      view._crank = { x: hx, y: hy };

      // two movable metal balls
      [b1, b2].forEach((b, i) => {
        C.glowCircle(ctx, b.x, b.y, 22, i ? '#b8c4d2' : '#7fc4ff', .2);
        metal(b.x, b.y, 12, i ? '#c7d0da' : '#d8e4ef');
        C.label(ctx, i ? '配重球' : '钢球', b.x, b.y - 20, { size: 6.8, align: 'center', color: 'rgba(225,236,250,.58)' });
      });

      // measured radius and force on the test ball
      C.line(ctx, cx, cy, b1.x, b1.y, 'rgba(100,210,255,.38)', 1, [3, 4]);
      C.label(ctx, 'r = ' + U.fmt(state.r, 2) + ' m', (cx + b1.x) / 2 + 9, (cy + b1.y) / 2 + 4, { size: 8, color: 'rgba(100,210,255,.7)', mono: true });
      const ux = (cx - b1.x) / Math.max(1, armPx), uy = (cy - b1.y) / Math.max(1, armPx * tilt);
      const fl = Math.min(80, 22 + F * 4);
      C.arrow(ctx, b1.x, b1.y, b1.x + ux * fl, b1.y + uy * fl, { color: '#ffb340', width: 2.2, head: 8, glow: 6 });
      C.label(ctx, 'F向 = ' + U.fmt(F, 1) + ' N', b1.x + 20, b1.y - 28, { size: 7.5, color: '#ffb340', mono: true });
      const tx = -Math.sin(phase), ty = Math.cos(phase);
      C.arrow(ctx, b1.x, b1.y, b1.x + tx * Math.min(60, v * 16), b1.y + ty * Math.min(60, v * 16), { color: '#64d2ff', width: 1.8, head: 7 });
      C.label(ctx, 'v', b1.x + tx * Math.min(60, v * 16) + 6, b1.y + ty * Math.min(60, v * 16), { size: 8, color: '#64d2ff', mono: true });

      // headings / formula card
      C.label(ctx, 'ω = ' + U.fmt(state.omega, 1) + ' rad/s', 72, 84, { size: 8.5, color: 'rgba(230,240,255,.45)', mono: true });
      C.label(ctx, 'm = ' + U.fmt(state.m, 2) + ' kg', 72, 100, { size: 8, color: 'rgba(230,240,255,.3)', mono: true });
      C.label(ctx, '拖动小球改变半径 · 摇动手柄启动', 274, 156, { size: 7.5, color: 'rgba(225,236,250,.4)' });
      K.panel(ctx, 640, 48, 214, 108, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, 'F = mω²r', 654, 78, { size: 17, color: '#eef4ff', weight: 600, mono: true });
      C.label(ctx, '= mv²/r', 654, 101, { size: 10, color: 'rgba(230,240,255,.48)', mono: true });
      C.label(ctx, '向心力指向圆心', 654, 128, { size: 7.5, color: 'rgba(255,179,64,.65)' });
      C.label(ctx, '双球反向旋转', 654, 143, { size: 7, color: 'rgba(225,236,250,.35)' });

      f.restore();
    },
    readouts(state) {
      const F = state.m * state.omega * state.omega * state.r;
      return [
        K.readout('向心力 F', U.fmt(F, 2), 'N'),
        K.readout('线速度 v', U.fmt(state.omega * state.r, 2), 'm/s'),
        K.readout('周期 T', U.fmt(2 * Math.PI / state.omega, 2), 's'),
        K.readout('角速度 ω', U.fmt(state.omega, 1), 'rad/s')
      ];
    },
    sample(state) {
      return { r: state.r, w: state.omega, w2: state.omega * state.omega, F: state.m * state.omega * state.omega * state.r, v: state.omega * state.r };
    },
    columns: [
      { key: 'r', label: 'r', unit: 'm', decimals: 2 },
      { key: 'w', label: 'ω', unit: 'rad/s', decimals: 2 },
      { key: 'F', label: 'F', unit: 'N', decimals: 2 }
    ],
    plot(state, view) {
      if (state.chartMode === 'Fw') {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const w2 = 0.25 + i / 60 * 35;
          pts.push({ x: w2, y: state.m * state.r * w2 });
        }
        return {
          xLabel: '角速度平方 ω²', yLabel: '向心力 F', xUnit: 'rad²/s²', yUnit: 'N',
          xMin: 0, xMax: 36, yMin: 0,
          series: [
            K.series(pts, '理论 F–ω²', '#5ca8ff', { width: 2 }),
            K.scatter(view.records, 'w2', 'F', '测量点', '#64d2ff', { pointSize: 4 })
          ]
        };
      }
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const r = 0.3 + i / 60 * 1.2;
        pts.push({ x: r, y: state.m * state.omega * state.omega * r });
      }
      return {
        xLabel: '半径 r', yLabel: '向心力 F', xUnit: 'm', yUnit: 'N',
        xMin: 0, xMax: 1.5, yMin: 0,
        series: [
          K.series(pts, '理论 F–r', '#5ca8ff', { width: 2 }),
          K.scatter(view.records, 'r', 'F', '测量点', '#64d2ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      return '<b>结论：</b>向心力 F = mω²r。当质量与角速度一定时，F 与半径 r 成正比；当质量与半径一定时，F 与 ω² 成正比。当前向心力约 <b>' + U.fmt(state.m * state.omega * state.omega * state.r, 2) + ' N</b>。';
    }
  });

  /* ------------------------------------------------------------
     07 · 探究功与速度变化的关系
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'work-energy',
    live: false,
    playable: true,
    hint: '播放观察加速过程 · 记录 W 与 v²',
    init(state) { state._progress = 0; },
    step(state, dt, view) {
      const f = state.mu * state.m * 9.8;
      const a = Math.max(0, state.F - f) / state.m;
      if (a <= 0) return;
      const tEnd = Math.sqrt(2 * state.s / a);
      view.t += dt * 0.45;
      if (tEnd > 0 && view.t >= tEnd) view.t = view.t % tEnd;
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const fric = state.mu * state.m * 9.8;
      const net = Math.max(0, state.F - fric);
      const a = net / state.m;
      const tEnd = a > 0 ? Math.sqrt(2 * state.s / a) : 1;
      const t = Math.min(view.t, tEnd);
      const xm = 0.5 * a * t * t;
      const v = a * t;
      const W = net * state.s;
      const scale = Math.min(140, 570 / Math.max(state.s, 1));
      const x0 = 250, trackY = 320;
      const blockX = x0 + Math.min(xm, state.s) * scale;

      K.panel(ctx, 40, 44, 826, 160, { fill: 'rgba(9,15,26,.46)' });
      C.label(ctx, '合外力做功', 58, 69, { size: 9.5, color: 'rgba(230,240,255,.42)' });
      C.label(ctx, 'W = (F − f)s', 58, 96, { size: 19, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, '末动能', 290, 69, { size: 8.5, color: 'rgba(230,240,255,.35)' });
      C.label(ctx, '½mv²', 290, 96, { size: 19, color: '#64d2ff', mono: true, weight: 600 });
      C.label(ctx, 'v = √(2W/m)', 290, 122, { size: 9, color: 'rgba(230,240,255,.35)', mono: true });
      // energy bars
      const E0 = Math.max(1, W);
      C.bars(ctx, 540, 64, 294, 40, [
        { label: '做功 W', value: W, max: E0, color: '#5ca8ff', text: U.fmt(W, 1) + ' J' },
        { label: '动能 Ek', value: 0.5 * state.m * v * v, max: E0, color: '#30d158', text: U.fmt(0.5 * state.m * v * v, 1) + ' J' }
      ]);

      // track
      C.floorLine(ctx, 48, 870, trackY, 'rgba(160,190,240,.3)');
      C.line(ctx, 58, trackY, 844, trackY, 'rgba(160,190,240,.24)', 5);
      C.line(ctx, 58, trackY - 2, 844, trackY - 2, 'rgba(255,255,255,.12)', 1);
      // rubber band stretching from fixed hook to the cart
      C.line(ctx, 70, trackY - 25, blockX - 24, trackY - 25, 'rgba(194,126,54,.85)', 5);
      C.line(ctx, 70, trackY - 20, blockX - 24, trackY - 20, 'rgba(255,190,105,.3)', 1);
      C.dot(ctx, 68, trackY - 25, 5, '#7d5129', 4);
      C.label(ctx, '橡皮筋', 78, trackY - 40, { size: 7.5, color: 'rgba(240,180,100,.7)' });
      // start & end marks
      C.line(ctx, x0, trackY - 4, x0, trackY + 8, 'rgba(255,255,255,.3)', 1);
      const endX = x0 + state.s * scale;
      C.line(ctx, endX, trackY - 8, endX, trackY + 8, 'rgba(100,210,255,.4)', 1);
      C.label(ctx, '起点', x0, trackY + 22, { size: 7.5, align: 'center', color: 'rgba(230,240,255,.3)' });
      C.label(ctx, 's = ' + U.fmt(state.s, 1) + ' m', (x0 + endX) / 2, trackY + 22, { size: 7.5, align: 'center', color: 'rgba(100,210,255,.55)', mono: true });
      // block
      K.block(ctx, blockX - 24, trackY - 46, 48, 42, '#8fb7e8', 'm');
      // force arrow
      C.arrow(ctx, blockX + 27, trackY - 26, blockX + 27 + Math.min(86, state.F * 13), trackY - 26, { color: '#ffb340', width: 2.4, head: 9, glow: 7 });
      C.label(ctx, 'F', blockX + 31 + Math.min(86, state.F * 13), trackY - 30, { size: 9, color: '#ffb340', mono: true });
      if (fric > 0.01) {
        C.arrow(ctx, blockX - 27, trackY - 26, blockX - 27 - Math.min(55, fric * 22), trackY - 26, { color: '#ff6961', width: 1.5, head: 6 });
        C.label(ctx, 'f', blockX - 31 - Math.min(55, fric * 22), trackY - 30, { size: 8, color: '#ff6961', mono: true });
      }
      // speed lines
      if (v > 0.1) {
        for (let i = 1; i <= 3; i++) C.line(ctx, blockX - 32 - i * 8, trackY - 20, blockX - 38 - i * 8, trackY - 20, 'rgba(100,210,255,' + (0.3 - i * 0.07) + ')', 1.2);
      }
      C.label(ctx, 'v = ' + U.fmt(v, 2) + ' m/s', 76, 240, { size: 10, color: '#64d2ff', mono: true });
      C.label(ctx, 'a = ' + U.fmt(a, 2) + ' m/s²', 76, 258, { size: 8.5, color: 'rgba(230,240,255,.35)', mono: true });

      if (net <= 0.001) {
        C.label(ctx, '拉力不足以克服摩擦力，物体不会运动', 450, 222, { size: 9, color: '#ff8a80', align: 'center' });
      }
      f.restore();
    },
    readouts(state, view) {
      const fric = state.mu * state.m * 9.8;
      const net = Math.max(0, state.F - fric);
      const a = net / state.m;
      const tEnd = a > 0 ? Math.sqrt(2 * state.s / a) : 0;
      const v = a * Math.min(view.t, tEnd);
      return [
        K.readout('合外力做功 W', U.fmt(net * state.s, 2), 'J'),
        K.readout('末速度 v', U.fmt(Math.sqrt(2 * net * state.s / state.m), 2), 'm/s'),
        K.readout('末动能 Ek', U.fmt(net * state.s, 2), 'J'),
        K.readout('加速度 a', U.fmt(a, 2), 'm/s²')
      ];
    },
    sample(state) {
      const fric = state.mu * state.m * 9.8;
      const net = Math.max(0, state.F - fric);
      const W = net * state.s;
      const v2 = 2 * W / state.m;
      return { W, v2, v: Math.sqrt(Math.max(0, v2)), Ek: W, F: state.F, s: state.s };
    },
    columns: [
      { key: 'W', label: 'W', unit: 'J', decimals: 3 },
      { key: 'v', label: 'v', unit: 'm/s', decimals: 3 },
      { key: 'v2', label: 'v²', unit: 'm²/s²', decimals: 3 }
    ],
    plot(state, view) {
      const fric = state.mu * state.m * 9.8;
      const net = Math.max(0, state.F - fric);
      const Wmax = net * 4;
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const W = Wmax * i / 60;
        pts.push({ x: W, y: 2 * W / state.m });
      }
      return {
        xLabel: '合外力做功 W', yLabel: '速度平方 v²', xUnit: 'J', yUnit: 'm²/s²',
        xMin: 0, xMax: Math.max(Wmax, 1), yMin: 0,
        series: [
          K.series(pts, '理论 W–v²', '#5ca8ff', { width: 2 }),
          K.scatter(view.records, 'W', 'v2', '测量点', '#64d2ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const fric = state.mu * state.m * 9.8;
      const net = Math.max(0, state.F - fric);
      return '<b>结论：</b>合外力对物体做的功等于物体动能的变化。W–v² 图线为过原点的直线，斜率约为 <b>' + U.fmt(state.m / 2, 2) + '</b>，与 m/2 一致。当前 W = ' + U.fmt(net * state.s, 2) + ' J。';
    }
  });

  /* ------------------------------------------------------------
     08 · 验证机械能守恒定律
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'mechanical-energy',
    live: true,
    playable: true,
    hint: '释放摆球 · 观察动能与势能的转化',
    init(state) { state._theta = U.deg(state.angle); state._omega = 0; state._trail = []; },
    onControl(key, state, view) {
      if (!view.playing && (key === 'angle' || key === 'length')) {
        state._theta = U.deg(state.angle); state._omega = 0; state._trail = [];
        view.t = 0; view.records.length = 0;
      }
    },
    step(state, dt, view) {
      const g = 9.8;
      let theta = state._theta, omega = state._omega;
      const sub = 3;
      const h = Math.min(dt, 0.04) / sub;
      for (let i = 0; i < sub; i++) {
        const alpha = -(g / state.length) * Math.sin(theta) - state.damping * omega;
        omega += alpha * h;
        theta += omega * h;
      }
      state._theta = theta; state._omega = omega;
      view.t += dt;
      const bob = this._bob(state);
      state._trail.push(bob);
      if (state._trail.length > 120) state._trail.shift();
    },
    _bob(state) {
      const px = 450, py = 72, lp = 90 + (state.length - 0.5) / 1.5 * 205;
      const th = state._theta || 0;
      return { x: px + Math.sin(th) * lp, y: py + Math.cos(th) * lp, th, lp, px, py };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const g = 9.8;
      const th = state._theta || 0;
      const bob = this._bob(state);
      const px = bob.px, py = bob.py, lp = bob.lp;
      const v = Math.abs(state._omega) * state.length;
      const E0 = state.mass * g * state.length * (1 - Math.cos(U.deg(state.angle)));
      const hgt = state.length * (1 - Math.cos(th));
      const Ep = state.mass * g * hgt;
      const Ek = 0.5 * state.mass * v * v;
      const Etot = Ep + Ek;

      // ceiling
      C.fillRound(ctx, px - 95, py - 18, 190, 11, 5, 'rgba(160,185,220,.32)');
      C.line(ctx, px - 76, py - 7, px - 76, py + 11, 'rgba(190,210,240,.22)', 1);
      C.line(ctx, px + 76, py - 7, px + 76, py + 11, 'rgba(190,210,240,.22)', 1);
      // vertical equilibrium
      C.line(ctx, px, py, px, py + lp + 25, 'rgba(255,255,255,.11)', 1, [4, 5]);
      // protractor arc
      K.arc(ctx, px, py, lp * 0.7, Math.PI / 2 - 0.95, Math.PI / 2 + 0.95, 'rgba(255,255,255,.1)', 1);
      // trail
      if (state._trail && state._trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        state._trail.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.strokeStyle = 'rgba(100,210,255,.18)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }
      // string and bob
      C.line(ctx, px, py, bob.x, bob.y, 'rgba(225,238,255,.58)', 1.4);
      const bx = bob.x, by = bob.y;
      C.glowCircle(ctx, bx, by, 36, '#5ca8ff', 0.32);
      C.ball(ctx, bx, by, 12, ['#ffffff', '#a9d3ff', '#2b6fd3']);
      // height marker
      C.line(ctx, px - 82, py + lp, px - 22, py + lp, 'rgba(100,210,255,.2)', 1);
      C.line(ctx, px - 78, by, px - 78, py + lp, 'rgba(100,210,255,.3)', 1, [3, 3]);
      C.arrow(ctx, px - 78, py + lp, px - 78, by, { color: '#64d2ff', width: 1, head: 4 });
      C.label(ctx, 'h = ' + U.fmt(hgt, 2) + ' m', px - 86, (py + lp + by) / 2, { size: 8, align: 'right', color: '#64d2ff', mono: true });
      // velocity
      const vx = Math.cos(th) * state._omega * state.length * 35;
      const vy = -Math.sin(th) * state._omega * state.length * 35;
      if (Math.hypot(vx, vy) > 1) {
        C.arrow(ctx, bx, by, bx + vx, by + vy, { color: '#ffb340', width: 1.8, head: 7 });
        C.label(ctx, 'v', bx + vx + 5, by + vy, { size: 8, color: '#ffb340', mono: true });
      }
      // energy panel
      K.panel(ctx, 636, 62, 218, 200, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, '能量转化', 652, 84, { size: 9, color: 'rgba(230,240,255,.46)' });
      const maxE = Math.max(E0, 0.01);
      C.bars(ctx, 650, 102, 186, 52, [
        { label: '动能', value: Ek, max: maxE, color: '#30d158', text: U.fmt(Ek, 1) + ' J' },
        { label: '势能', value: Ep, max: maxE, color: '#5ca8ff', text: U.fmt(Ep, 1) + ' J' },
        { label: '总能量', value: Etot, max: maxE, color: '#bf8bff', text: U.fmt(Etot, 1) + ' J' }
      ]);
      C.line(ctx, 650, 188, 836, 188, 'rgba(255,255,255,.08)', 1);
      C.label(ctx, '初始机械能', 650, 207, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(E0, 2) + ' J', 836, 207, { size: 8, align: 'right', color: 'rgba(230,240,255,.55)', mono: true });
      C.label(ctx, '损失', 650, 225, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(E0 - Etot, 2) + ' J', 836, 225, { size: 8, align: 'right', color: (E0 - Etot > 0.01 ? '#ff8a80' : '#30d158'), mono: true });
      C.label(ctx, 'θ = ' + U.fmt(U.rad(th), 1) + '°', 72, 80, { size: 9, color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, 'v = ' + U.fmt(v, 2) + ' m/s', 72, 98, { size: 8.5, color: '#64d2ff', mono: true });
      f.restore();
    },
    readouts(state) {
      const g = 9.8;
      const th = state._theta || 0;
      const v = Math.abs(state._omega || 0) * state.length;
      return [
        K.readout('速度 v', U.fmt(v, 2), 'm/s'),
        K.readout('高度 h', U.fmt(state.length * (1 - Math.cos(th)), 2), 'm'),
        K.readout('动能 Ek', U.fmt(0.5 * state.mass * v * v, 2), 'J'),
        K.readout('机械能 E', U.fmt(state.mass * g * state.length * (1 - Math.cos(U.deg(state.angle))), 2), 'J')
      ];
    },
    sample(state, view) {
      const g = 9.8;
      const th = state._theta || 0;
      const v = Math.abs(state._omega || 0) * state.length;
      const Ep = state.mass * g * state.length * (1 - Math.cos(th));
      const Ek = 0.5 * state.mass * v * v;
      return { t: view.t, Ek, Ep, E: Ek + Ep, v, theta: U.rad(th) };
    },
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 2 },
      { key: 'Ek', label: 'Ek', unit: 'J', decimals: 3 },
      { key: 'Ep', label: 'Ep', unit: 'J', decimals: 3 },
      { key: 'E', label: 'E', unit: 'J', decimals: 3 }
    ],
    plot(state, view) {
      const g = 9.8;
      const E0 = state.mass * g * state.length * (1 - Math.cos(U.deg(state.angle)));
      const rec = view.records;
      return {
        xLabel: '时间 t', yLabel: '能量 E', xUnit: 's', yUnit: 'J',
        xMin: 0, xMax: Math.max(8, rec.length ? rec[rec.length - 1].t : 8), yMin: 0, yMax: Math.max(E0 * 1.15, 0.01),
        series: [
          K.series(rec.map((r) => ({ x: r.t, y: r.Ek })), '动能 Ek', '#30d158', { width: 1.8 }),
          K.series(rec.map((r) => ({ x: r.t, y: r.Ep })), '势能 Ep', '#5ca8ff', { width: 1.8 }),
          K.series(rec.map((r) => ({ x: r.t, y: r.E })), '总机械能 E', '#bf8bff', { width: 1.6, dash: [5, 4] })
        ]
      };
    },
    conclusion(state, view) {
      const g = 9.8;
      const E0 = state.mass * g * state.length * (1 - Math.cos(U.deg(state.angle)));
      const last = view.records[view.records.length - 1];
      if (!last) return '<b>提示：</b>点击播放释放摆球，观察动能、势能与总机械能三条曲线的变化。';
      return '<b>结论：</b>在摆动过程中，动能与势能不断相互转化，但总机械能基本保持不变。当前总能量 ' + U.fmt(last.E, 2) + ' J，与初始 ' + U.fmt(E0, 2) + ' J 的偏差为 ' + U.fmt(Math.abs(last.E - E0), 2) + ' J。';
    }
  });

  /* ------------------------------------------------------------
     09 · 验证动量守恒定律
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'momentum',
    live: true,
    playable: true,
    hint: '播放碰撞 · 对比碰撞前后的总动量',
    step(state, dt, view) {
      view.t += dt * 0.55;
      if (view.t >= 4.6) view.t = view.t % 4.6;
    },
    _stateAt(state, t) {
      const v1 = state.v1, v2 = state.v2;
      const m1 = state.m1, m2 = state.m2, e = state.e;
      const x1 = 250, x2 = 590, half = 38;
      const rel = (v1 - v2) * 58;
      const gap = (x2 - x1) - half * 2;
      const tc = rel > 0.001 ? gap / rel : Infinity;
      const v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const v2p = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      if (t < tc) {
        return { x1: x1 + v1 * 58 * t, x2: x2 + v2 * 58 * t, v1, v2, tc, hit: false, pre: true };
      }
      const dtAfter = t - tc;
      return {
        x1: x1 + v1 * 58 * tc + v1p * 58 * dtAfter,
        x2: x2 + v2 * 58 * tc + v2p * 58 * dtAfter,
        v1: v1p, v2: v2p, tc, hit: true, pre: false
      };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const kin = this._stateAt(state, view.t);
      const trackY = 318;

      // air track
      C.fillRound(ctx, 70, trackY - 5, 770, 18, 8, 'rgba(140,170,210,.13)');
      C.line(ctx, 76, trackY - 2, 834, trackY - 2, 'rgba(190,215,245,.3)', 1.2);
      for (let i = 0; i < 46; i++) C.dot(ctx, 86 + i * 16.4, trackY + 6, 1.1, 'rgba(170,200,240,.24)');
      C.label(ctx, '气垫导轨 · 光电门', 84, 360, { size: 8, color: 'rgba(230,240,255,.28)' });
      // photogates
      [250, 590].forEach((gx, i) => {
        C.line(ctx, gx, trackY - 48, gx, trackY - 5, 'rgba(100,210,255,.4)', 1.2);
        C.fillRound(ctx, gx - 11, trackY - 52, 22, 8, 3, 'rgba(100,210,255,.25)');
        C.label(ctx, i === 0 ? '光电门 1' : '光电门 2', gx, trackY - 62, { size: 7, align: 'center', color: 'rgba(100,210,255,.45)' });
      });

      // carts
      const drawCart = (x, m, v, color, label) => {
        ctx.save();
        ctx.shadowColor = C.hexA(color, .32); ctx.shadowBlur = 12;
        C.fillRound(ctx, x - 38, trackY - 42, 76, 34, 6, C.hexA(color, .3));
        ctx.restore();
        C.roundRect(ctx, x - 38, trackY - 42, 76, 34, 6);
        ctx.strokeStyle = C.hexA(color, .7); ctx.lineWidth = 1.2; ctx.stroke();
        C.label(ctx, label, x, trackY - 21, { size: 9, align: 'center', color: '#eaf2ff', mono: true });
        C.label(ctx, U.fmt(m, 2) + ' kg', x, trackY - 52, { size: 7.5, align: 'center', color: C.hexA(color, .75) });
        C.arrow(ctx, x + 42, trackY - 28, x + 42 + Math.sign(v) * Math.min(58, Math.abs(v) * 24 + 8), trackY - 28, { color, width: 1.7, head: 6 });
      };
      drawCart(kin.x1, state.m1, kin.v1, '#5ca8ff', 'm₁');
      drawCart(kin.x2, state.m2, kin.v2, '#30d158', 'm₂');

      // collision flash
      if (kin.tc < 5 && Math.abs(view.t - kin.tc) < 0.24) {
        const age = Math.abs(view.t - kin.tc) / 0.24;
        const mx = (kin.x1 + kin.x2) / 2;
        ctx.save();
        ctx.globalAlpha = 1 - U.smoothstep(age);
        C.glowCircle(ctx, mx, trackY - 26, 54 + 34 * age, '#ffffff', 0.42);
        C.label(ctx, '碰撞', mx, trackY - 70, { size: 9, align: 'center', color: '#fff' });
        ctx.restore();
      }
      // momentum before / after panel
      const p1b = state.m1 * state.v1, p2b = state.m2 * state.v2;
      const v1p = ((state.m1 - state.e * state.m2) * state.v1 + (1 + state.e) * state.m2 * state.v2) / (state.m1 + state.m2);
      const v2p = ((state.m2 - state.e * state.m1) * state.v2 + (1 + state.e) * state.m1 * state.v1) / (state.m1 + state.m2);
      const p1a = state.m1 * v1p, p2a = state.m2 * v2p;
      K.panel(ctx, 632, 54, 224, 164, { fill: 'rgba(9,15,26,.64)' });
      C.label(ctx, '碰撞前', 648, 74, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, '碰撞后', 760, 74, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, 'p₁', 648, 94, { size: 9, color: '#5ca8ff', mono: true });
      C.label(ctx, U.fmt(p1b, 2), 704, 94, { size: 9, align: 'right', color: 'rgba(230,240,255,.62)', mono: true });
      C.label(ctx, 'p₂', 648, 112, { size: 9, color: '#30d158', mono: true });
      C.label(ctx, U.fmt(p2b, 2), 704, 112, { size: 9, align: 'right', color: 'rgba(230,240,255,.62)', mono: true });
      C.line(ctx, 648, 122, 704, 122, 'rgba(255,255,255,.12)', 1);
      C.label(ctx, 'Σp', 648, 138, { size: 9, color: '#bf8bff', mono: true });
      C.label(ctx, U.fmt(p1b + p2b, 2), 704, 138, { size: 9, align: 'right', color: '#d9c8ff', mono: true });
      C.label(ctx, 'p₁', 760, 94, { size: 9, color: '#5ca8ff', mono: true });
      C.label(ctx, U.fmt(p1a, 2), 836, 94, { size: 9, align: 'right', color: 'rgba(230,240,255,.62)', mono: true });
      C.label(ctx, 'p₂', 760, 112, { size: 9, color: '#30d158', mono: true });
      C.label(ctx, U.fmt(p2a, 2), 836, 112, { size: 9, align: 'right', color: 'rgba(230,240,255,.62)', mono: true });
      C.line(ctx, 760, 122, 836, 122, 'rgba(255,255,255,.12)', 1);
      C.label(ctx, 'Σp', 760, 138, { size: 9, color: '#bf8bff', mono: true });
      C.label(ctx, U.fmt(p1a + p2a, 2), 836, 138, { size: 9, align: 'right', color: '#d9c8ff', mono: true });
      C.label(ctx, 'Δp = ' + U.fmt(Math.abs(p1a + p2a - p1b - p2b), 3) + ' kg·m/s', 648, 165, { size: 8, color: 'rgba(230,240,255,.42)', mono: true });
      C.label(ctx, U.rad(0) === 0 ? 'e = ' + U.fmt(state.e, 2) : '', 648, 184, { size: 8, color: 'rgba(230,240,255,.3)', mono: true });
      C.label(ctx, 't = ' + U.fmt(view.t, 2) + ' s', 72, 74, { size: 9, color: 'rgba(230,240,255,.4)', mono: true });
      f.restore();
    },
    readouts(state) {
      const v1p = ((state.m1 - state.e * state.m2) * state.v1 + (1 + state.e) * state.m2 * state.v2) / (state.m1 + state.m2);
      const v2p = ((state.m2 - state.e * state.m1) * state.v2 + (1 + state.e) * state.m1 * state.v1) / (state.m1 + state.m2);
      const pb = state.m1 * state.v1 + state.m2 * state.v2;
      const pa = state.m1 * v1p + state.m2 * v2p;
      return [
        K.readout('碰前总动量', U.fmt(pb, 2), 'kg·m/s'),
        K.readout('碰后总动量', U.fmt(pa, 2), 'kg·m/s'),
        K.readout('动量变化 Δp', U.fmt(Math.abs(pa - pb), 3), 'kg·m/s'),
        K.readout('恢复系数 e', U.fmt(state.e, 2), '')
      ];
    },
    sample(state, view) {
      const kin = this._stateAt(state, view.t);
      return {
        t: view.t,
        p1: state.m1 * kin.v1,
        p2: state.m2 * kin.v2,
        p: state.m1 * kin.v1 + state.m2 * kin.v2,
        v1: kin.v1, v2: kin.v2
      };
    },
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 2 },
      { key: 'p1', label: 'p₁', unit: 'kg·m/s', decimals: 3 },
      { key: 'p2', label: 'p₂', unit: 'kg·m/s', decimals: 3 },
      { key: 'p', label: 'Σp', unit: 'kg·m/s', decimals: 3 }
    ],
    plot(state, view) {
      const rec = view.records;
      return {
        xLabel: '时间 t', yLabel: '动量 p', xUnit: 's', yUnit: 'kg·m/s',
        xMin: 0, xMax: 4.6,
        series: [
          K.series(rec.map((r) => ({ x: r.t, y: r.p1 })), 'p₁', '#5ca8ff', { width: 1.8 }),
          K.series(rec.map((r) => ({ x: r.t, y: r.p2 })), 'p₂', '#30d158', { width: 1.8 }),
          K.series(rec.map((r) => ({ x: r.t, y: r.p })), '总动量 Σp', '#bf8bff', { width: 2, dash: [5, 4] })
        ]
      };
    },
    conclusion(state) {
      const v1p = ((state.m1 - state.e * state.m2) * state.v1 + (1 + state.e) * state.m2 * state.v2) / (state.m1 + state.m2);
      const v2p = ((state.m2 - state.e * state.m1) * state.v2 + (1 + state.e) * state.m1 * state.v1) / (state.m1 + state.m2);
      const pb = state.m1 * state.v1 + state.m2 * state.v2;
      const pa = state.m1 * v1p + state.m2 * v2p;
      return '<b>结论：</b>碰撞前后系统总动量几乎不变。碰前 Σp = ' + U.fmt(pb, 2) + ' kg·m/s，碰后 Σp = ' + U.fmt(pa, 2) + ' kg·m/s。' + (Math.abs(pa - pb) < 0.01 ? '在误差范围内动量守恒。' : '请检查参数设置。');
    }
  });

  /* ------------------------------------------------------------
     10 · 用单摆测量重力加速度
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'simple-pendulum',
    live: false,
    playable: true,
    hint: '改变摆长并记录周期 · 用 T²–L 求 g',
    init(state) { state._theta = U.deg(state.amp); state._omega = 0; },
    onControl(key, state, view) {
      if (!view.playing && (key === 'L' || key === 'g' || key === 'amp')) {
        const T = 2 * Math.PI * Math.sqrt(state.L / state.g);
        state._theta = U.deg(state.amp) * Math.cos(2 * Math.PI * view.t / T);
        state._omega = -U.deg(state.amp) * 2 * Math.PI / T * Math.sin(2 * Math.PI * view.t / T);
      }
    },
    step(state, dt, view) {
      const T = 2 * Math.PI * Math.sqrt(state.L / state.g);
      view.t += dt;
      state._theta = U.deg(state.amp) * Math.cos(2 * Math.PI * view.t / T);
      state._omega = -U.deg(state.amp) * 2 * Math.PI / T * Math.sin(2 * Math.PI * view.t / T);
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const T = 2 * Math.PI * Math.sqrt(state.L / state.g);
      const px = 430, py = 64, lp = 95 + (state.L - 0.4) / 1.1 * 235;
      const th = state._theta || 0;
      const bx = px + Math.sin(th) * lp, by = py + Math.cos(th) * lp;

      // support
      C.fillRound(ctx, px - 108, py - 20, 216, 12, 6, 'rgba(160,185,220,.34)');
      C.line(ctx, px - 88, py - 8, px - 88, py + 10, 'rgba(190,210,240,.22)', 1);
      C.line(ctx, px + 88, py - 8, px + 88, py + 10, 'rgba(190,210,240,.22)', 1);
      // angle arc
      K.arc(ctx, px, py, lp * 0.55, Math.PI / 2 - Math.abs(th), Math.PI / 2 + Math.abs(th), 'rgba(100,210,255,.32)', 1.2);
      C.line(ctx, px, py, px, py + lp + 20, 'rgba(255,255,255,.1)', 1, [4, 5]);
      // string
      C.line(ctx, px, py, bx, by, 'rgba(225,238,255,.62)', 1.4);
      C.glowCircle(ctx, bx, by, 32, '#5ca8ff', 0.28);
      C.ball(ctx, bx, by, 11, ['#ffffff', '#a9d3ff', '#2b6fd3']);
      C.label(ctx, 'θ = ' + U.fmt(U.rad(th), 1) + '°', px + 14, py + 44, { size: 8, color: 'rgba(100,210,255,.55)', mono: true });
      C.label(ctx, 'L = ' + U.fmt(state.L, 2) + ' m', px + 8, py + lp * 0.45, { size: 8.5, color: 'rgba(230,240,255,.38)', mono: true });

      // timer / measurement panel
      K.panel(ctx, 634, 54, 222, 206, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, '测量结果', 650, 76, { size: 9, color: 'rgba(230,240,255,.43)' });
      C.label(ctx, '周期 T', 650, 103, { size: 8.5, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(T, 3) + ' s', 650, 126, { size: 20, color: '#eef4ff', mono: true });
      C.label(ctx, '30 次全振动', 650, 151, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(T * 30, 2) + ' s', 650, 169, { size: 13, color: '#64d2ff', mono: true });
      C.label(ctx, 'g = 4π²L / T²', 650, 198, { size: 8.5, color: 'rgba(230,240,255,.38)', mono: true });
      C.label(ctx, '= ' + U.fmt(4 * Math.PI * Math.PI * state.L / (T * T), 2) + ' m/s²', 650, 216, { size: 11, color: '#30d158', mono: true });
      C.label(ctx, '摆角较小时周期与振幅无关', 650, 243, { size: 7.5, color: 'rgba(230,240,255,.28)' });
      // mini T2-L
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const L = 0.4 + i / 40 * 1.1;
        pts.push({ x: L, y: 4 * Math.PI * Math.PI * L / state.g });
      }
      K.miniPlot(ctx, 54, 292, 250, 128, pts, '#bf8bff', { title: 'T²–L 理论图线', xLabel: 'L / m' });
      C.label(ctx, 't = ' + U.fmt(view.t, 2) + ' s', 76, 82, { size: 9, color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, view.playing ? '摆动计时中…' : '点击播放开始摆动', 76, 100, { size: 8, color: 'rgba(230,240,255,.25)' });
      f.restore();
    },
    readouts(state) {
      const T = 2 * Math.PI * Math.sqrt(state.L / state.g);
      return [
        K.readout('周期 T', U.fmt(T, 3), 's'),
        K.readout('摆长 L', U.fmt(state.L, 2), 'm'),
        K.readout('频率 f', U.fmt(1 / T, 3), 'Hz'),
        K.readout('重力加速度 g', U.fmt(4 * Math.PI * Math.PI * state.L / (T * T), 2), 'm/s²')
      ];
    },
    sample(state) {
      const T = 2 * Math.PI * Math.sqrt(state.L / state.g);
      return { L: state.L, T, T2: T * T, g: 4 * Math.PI * Math.PI * state.L / (T * T) };
    },
    columns: [
      { key: 'L', label: 'L', unit: 'm', decimals: 2 },
      { key: 'T', label: 'T', unit: 's', decimals: 3 },
      { key: 'T2', label: 'T²', unit: 's²', decimals: 3 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const L = i / 60 * 1.5;
        pts.push({ x: L, y: 4 * Math.PI * Math.PI * L / state.g });
      }
      return {
        xLabel: '摆长 L', yLabel: '周期平方 T²', xUnit: 'm', yUnit: 's²',
        xMin: 0, xMax: 1.5, yMin: 0,
        series: [
          K.series(pts, '理论 T²–L', '#bf8bff', { width: 1.8, dash: [5, 4] }),
          K.scatter(view.records, 'L', 'T2', '测量点', '#d7b8ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state, view) {
      const n = view.records.length;
      if (n < 2) return '<b>提示：</b>改变摆长，记录至少 3 组 L 与 T，作 T²–L 图像并求斜率。';
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      view.records.forEach((r) => { sx += r.L; sy += r.T2; sxx += r.L * r.L; sxy += r.L * r.T2; });
      const k = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const g = 4 * Math.PI * Math.PI / k;
      return '<b>结论：</b>T²–L 图线是一条过原点的直线，斜率 k = ' + U.fmt(k, 3) + ' s²/m。由 g = 4π²/k 得 <b>g ≈ ' + U.fmt(g, 2) + ' m/s²</b>。';
    }
  });
})();
