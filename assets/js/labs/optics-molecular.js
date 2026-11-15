/* ============================================================
   Optics & molecular labs 19–21
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const C = OL.canvas;
  const K = OL.labKit;
  const U = OL.utils;
  const P = OL.palette;

  /* ------------------------------------------------------------
     19 · 测量玻璃的折射率
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'refraction',
    live: false,
    playable: false,
    hint: '改变入射角 · 记录 sin i 与 sin r',
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const i = U.deg(state.i);
      const sinR = Math.sin(i) / state.n;
      const r = Math.asin(U.clamp(sinR, -1, 1));
      const cx = 430, cy = 252, R = 168;

      // paper
      K.panel(ctx, 54, 42, 800, 384, { fill: 'rgba(235,242,255,.035)', stroke: 'rgba(255,255,255,.09)' });

      // glass semicircle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI, false);
      ctx.closePath();
      const glassGrad = ctx.createLinearGradient(cx - R, cy, cx + R, cy + R);
      glassGrad.addColorStop(0, 'rgba(120,200,255,.13)');
      glassGrad.addColorStop(1, 'rgba(80,140,255,.22)');
      ctx.fillStyle = glassGrad; ctx.fill();
      ctx.strokeStyle = 'rgba(140,205,255,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      C.line(ctx, cx - R, cy, cx + R, cy, 'rgba(140,205,255,.45)', 1.2);
      C.label(ctx, '玻璃 n = ' + U.fmt(state.n, 2), cx, cy + R - 18, { size: 9, align: 'center', color: 'rgba(150,205,255,.55)' });
      C.label(ctx, '空气', cx - R - 10, 94, { size: 8, align: 'right', color: 'rgba(230,240,255,.32)' });

      // normal
      C.line(ctx, cx, cy - 200, cx, cy + 90, 'rgba(255,255,255,.22)', 1, [5, 5]);
      C.label(ctx, '法线', cx + 7, cy - 193, { size: 7.5, color: 'rgba(230,240,255,.3)' });

      // angle arcs
      K.arc(ctx, cx, cy, 72, -Math.PI / 2 - i, -Math.PI / 2, 'rgba(100,210,255,.55)', 1.3);
      C.label(ctx, 'i = ' + state.i + '°', cx - 90, cy - 104, { size: 8.5, color: '#64d2ff', mono: true });
      K.arc(ctx, cx, cy, 95, Math.PI / 2 - r, Math.PI / 2, 'rgba(255,179,64,.55)', 1.3);
      C.label(ctx, 'r = ' + U.fmt(U.rad(r), 1) + '°', cx + 98, cy + 80, { size: 8.5, color: '#ffb340', mono: true });

      // incident ray
      const ix1 = cx - Math.sin(i) * 250, iy1 = cy - Math.cos(i) * 250;
      C.arrow(ctx, ix1, iy1, cx - Math.sin(i) * 8, cy - Math.cos(i) * 8, { color: '#64d2ff', width: 2.2, head: 9, glow: 6 });
      C.line(ctx, ix1, iy1, cx, cy, 'rgba(100,210,255,.18)', 1);
      // reflected ray
      C.arrow(ctx, cx, cy, cx - Math.sin(i) * 180, cy - Math.cos(i) * 180, { color: 'rgba(100,210,255,.24)', width: 1.2, head: 6 });
      // refracted ray
      C.arrow(ctx, cx, cy, cx + Math.sin(r) * 176, cy + Math.cos(r) * 176, { color: '#ffb340', width: 2.2, head: 9, glow: 6 });
      // pins
      [[ix1 + 16, iy1 + 22], [ix1 + 80, iy1 + 86]].forEach((p) => {
        C.dot(ctx, p[0], p[1], 4, '#ff6b9a', 7);
        C.dot(ctx, p[0], p[1], 1.3, '#fff');
      });
      C.dot(ctx, cx, cy, 3.4, '#fff', 7);

      // angle labels and formula
      K.panel(ctx, 610, 56, 224, 166, { fill: 'rgba(9,15,26,.66)' });
      C.label(ctx, '斯涅尔定律', 626, 78, { size: 9, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, 'n = sin i / sin r', 626, 108, { size: 15, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, 'sin r = sin i / n', 626, 132, { size: 9, color: 'rgba(230,240,255,.38)', mono: true });
      C.label(ctx, '当前折射角 r', 626, 164, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(U.rad(r), 2) + '°', 626, 187, { size: 17, color: '#ffb340', mono: true });
      C.label(ctx, '光在玻璃中的速度', 626, 211, { size: 8, color: 'rgba(230,240,255,.3)' });

      // formula strip bottom
      C.label(ctx, 'sin i = ' + U.fmt(Math.sin(i), 4), 74, 392, { size: 9, color: 'rgba(100,210,255,.6)', mono: true });
      C.label(ctx, 'sin r = ' + U.fmt(Math.sin(r), 4), 230, 392, { size: 9, color: 'rgba(255,179,64,.65)', mono: true });
      C.label(ctx, 'v = c/n = ' + U.sci(3e8 / state.n, 2) + ' m/s', 74, 412, { size: 8.5, color: 'rgba(230,240,255,.34)', mono: true });
      f.restore();
    },
    readouts(state) {
      const i = U.deg(state.i);
      const r = Math.asin(Math.sin(i) / state.n);
      return [
        K.readout('入射角 i', state.i, '°'),
        K.readout('折射角 r', U.fmt(U.rad(r), 2), '°'),
        K.readout('折射率 n', U.fmt(state.n, 2), ''),
        K.readout('玻璃中光速', U.sci(3e8 / state.n, 2), 'm/s')
      ];
    },
    sample(state) {
      const i = U.deg(state.i);
      const r = Math.asin(Math.sin(i) / state.n);
      return { i: state.i, r: U.rad(r), sinI: Math.sin(i), sinR: Math.sin(r), n: state.n };
    },
    columns: [
      { key: 'i', label: 'i', unit: '°', decimals: 1 },
      { key: 'r', label: 'r', unit: '°', decimals: 2 },
      { key: 'sinI', label: 'sin i', unit: '', decimals: 4 },
      { key: 'sinR', label: 'sin r', unit: '', decimals: 4 }
    ],
    plot(state, view) {
      const rmax = Math.asin(Math.min(1, Math.sin(U.deg(80)) / state.n));
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const sr = rmax * k / 60;
        pts.push({ x: sr, y: state.n * sr });
      }
      return {
        xLabel: 'sin r', yLabel: 'sin i', xUnit: '', yUnit: '',
        xMin: 0, yMin: 0, xMax: Math.max(rmax, 0.1), yMax: 1,
        series: [
          K.series(pts, '理论 sin i–sin r', '#ffb340', { width: 2 }),
          K.scatter(view.records, 'sinR', 'sinI', '测量点', '#ffd166', { pointSize: 4 })
        ]
      };
    },
    conclusion(state, view) {
      const n = view.records.length;
      if (n < 2) return '<b>提示：</b>改变入射角，记录多组 sin i、sin r，作 sin i–sin r 图像，斜率即折射率。';
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      view.records.forEach((r) => { sx += r.sinR; sy += r.sinI; sxx += r.sinR * r.sinR; sxy += r.sinR * r.sinI; });
      const fit = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      return '<b>结论：</b>sin i–sin r 图线是一条过原点的直线，斜率 n ≈ <b>' + U.fmt(fit, 2) + '</b>，与玻璃的折射率标称值 ' + U.fmt(state.n, 2) + ' 接近。';
    }
  });

  /* ------------------------------------------------------------
     20 · 用双缝干涉测光的波长
     ------------------------------------------------------------ */
  function wlColor(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else { r = 1; }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  OL.registerLab({
    id: 'double-slit',
    live: false,
    playable: true,
    hint: '改变波长、缝距与屏距 · 测量条纹间距',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const dx = state.lambda * 1e-9 * state.L / (state.d * 1e-3);
      return { dx, dxmm: dx * 1000 };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const rgb = wlColor(state.lambda);
      const col = 'rgb(' + rgb.join(',') + ')';
      const sy = 246, slitX = 418, screenX = 760;
      const sourceY = sy;
      // laser
      C.fillRound(ctx, 70, sy - 18, 116, 36, 6, 'rgba(46,58,78,.9)');
      C.fillRound(ctx, 186, sy - 8, 18, 16, 3, 'rgba(190,205,225,.55)');
      C.dot(ctx, 206, sy, 2.4, col, 10);
      C.label(ctx, '单色光源', 126, sy - 28, { size: 8, align: 'center', color: 'rgba(230,240,255,.35)' });

      // beam
      C.line(ctx, 206, sy, slitX - 4, sy, C.hexA(col, .38), 1.2);
      // double slit plate
      C.fillRound(ctx, slitX - 5, 112, 10, 264, 3, 'rgba(170,190,220,.55)');
      C.fillRound(ctx, slitX - 2, sy - 44, 4, 34, 1, '#0b0f18');
      C.fillRound(ctx, slitX - 2, sy + 10, 4, 34, 1, '#0b0f18');
      C.label(ctx, '双缝', slitX, 100, { size: 8, align: 'center', color: 'rgba(190,210,240,.55)' });
      C.label(ctx, 'd = ' + U.fmt(state.d, 2) + ' mm', slitX, 394, { size: 8, align: 'center', color: 'rgba(230,240,255,.38)', mono: true });

      // wavefronts
      const ph = (view.t * 0.8) % 1;
      for (let s = 0; s < 2; s++) {
        const cy = sy - 27 + s * 54;
        for (let k = 0; k < 5; k++) {
          const f = (ph + k / 5) % 1;
          const rr = 34 + f * 310;
          ctx.save();
          ctx.beginPath(); ctx.arc(slitX + 3, cy, rr, -0.62, 0.62);
          ctx.strokeStyle = C.hexA(col, 0.2 * Math.sin(Math.PI * f));
          ctx.lineWidth = 1; ctx.stroke();
          ctx.restore();
        }
      }

      // screen
      C.fillRound(ctx, screenX, 82, 22, 332, 4, 'rgba(18,23,34,.95)');
      C.roundRect(ctx, screenX, 82, 22, 332, 4); ctx.strokeStyle = 'rgba(180,200,230,.25)'; ctx.lineWidth = 1; ctx.stroke();
      const center = 248;
      const mmToPx = 13;
      for (let y = 84; y < 412; y++) {
        const dy = (y - center) / mmToPx; // mm
        const phase = Math.PI * dy / Math.max(0.001, q.dxmm);
        const inten = Math.pow(Math.cos(phase), 2);
        ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.06 + inten * 0.9) + ')';
        ctx.fillRect(screenX + 2, y, 18, 1);
      }
      C.label(ctx, '屏', screenX + 11, 78, { size: 8, align: 'center', color: 'rgba(230,240,255,.4)' });
      C.label(ctx, 'L = ' + U.fmt(state.L, 2) + ' m', (screenX + slitX) / 2, 424, { size: 8, align: 'center', color: 'rgba(230,240,255,.38)', mono: true });
      // fringe spacing dimension
      const fringePx = q.dxmm * mmToPx;
      if (fringePx > 3) {
        C.line(ctx, screenX - 13, center, screenX - 13, center + fringePx, 'rgba(230,240,255,.45)', 1);
        C.line(ctx, screenX - 17, center, screenX - 9, center, 'rgba(230,240,255,.45)', 1);
        C.line(ctx, screenX - 17, center + fringePx, screenX - 9, center + fringePx, 'rgba(230,240,255,.45)', 1);
        C.label(ctx, 'Δx', screenX - 19, center + fringePx / 2 + 3, { size: 7.5, align: 'right', color: '#ffd166', mono: true });
      }

      // result panel
      K.panel(ctx, 600, 52, 240, 178, { fill: 'rgba(9,15,26,.68)' });
      C.label(ctx, '条纹间距 Δx', 616, 76, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.dxmm, 3) + ' mm', 616, 102, { size: 20, color: '#ffd166', mono: true, weight: 600 });
      C.label(ctx, 'λ = Δx·d / L', 616, 132, { size: 10, color: 'rgba(230,240,255,.5)', mono: true });
      C.label(ctx, '波长 λ', 616, 158, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, state.lambda + ' nm', 616, 180, { size: 14, color: col, mono: true });
      C.label(ctx, '可见光 · ' + (state.lambda < 450 ? '蓝紫' : state.lambda < 495 ? '蓝' : state.lambda < 570 ? '绿' : state.lambda < 590 ? '黄' : state.lambda < 620 ? '橙' : '红'), 616, 203, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      // color swatch
      ctx.save();
      const grad = ctx.createLinearGradient(760, 0, 820, 0);
      grad.addColorStop(0, '#8a5cff'); grad.addColorStop(0.45, '#42d392'); grad.addColorStop(0.75, '#ffd166'); grad.addColorStop(1, '#ff5d5d');
      C.fillRound(ctx, 722, 158, 98, 8, 4, 'rgba(255,255,255,.08)');
      C.dot(ctx, 722 + (state.lambda - 380) / 370 * 98, 162, 3.2, col, 9);
      ctx.restore();
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('条纹间距 Δx', U.fmt(q.dxmm, 3), 'mm'),
        K.readout('波长 λ', state.lambda, 'nm'),
        K.readout('双缝间距 d', U.fmt(state.d, 2), 'mm'),
        K.readout('屏距 L', U.fmt(state.L, 2), 'm')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { lambda: state.lambda, dx: q.dxmm, d: state.d, L: state.L };
    },
    columns: [
      { key: 'lambda', label: 'λ', unit: 'nm', decimals: 0 },
      { key: 'd', label: 'd', unit: 'mm', decimals: 2 },
      { key: 'L', label: 'L', unit: 'm', decimals: 2 },
      { key: 'dx', label: 'Δx', unit: 'mm', decimals: 4 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const lambda = 380 + i / 60 * 370;
        pts.push({ x: lambda, y: lambda * 1e-9 * state.L / (state.d * 1e-3) * 1000 });
      }
      return {
        xLabel: '波长 λ', yLabel: '条纹间距 Δx', xUnit: 'nm', yUnit: 'mm',
        xMin: 380, xMax: 750, yMin: 0,
        series: [
          K.series(pts, '理论 Δx–λ', '#bf8bff', { width: 2 }),
          K.scatter(view.records, 'lambda', 'dx', '测量点', '#d7b8ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>相邻亮纹间距 Δx = λL/d。当前 λ = ' + state.lambda + ' nm、d = ' + U.fmt(state.d, 2) + ' mm、L = ' + U.fmt(state.L, 2) + ' m 时，Δx ≈ <b>' + U.fmt(q.dxmm, 3) + ' mm</b>。条纹间距与波长、屏距成正比，与双缝间距成反比。';
    }
  });

  /* ------------------------------------------------------------
     21 · 用油膜法估测分子的大小
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'oil-film',
    live: false,
    playable: true,
    hint: '播放完整动画 · 观察油膜铺展成单分子层',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const V_oil_mm3 = state.V * 1000 * state.c / 100; // mL -> mm³, then concentration
      const area_mm2 = state.A * 100; // cm² -> mm²
      const d_mm = V_oil_mm3 / area_mm2;
      return { V_oil_mm3, area_mm2, d_mm, d_nm: d_mm * 1e6 };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const cycle = 8;
      const t = view.t % cycle;
      const dropPhase = U.clamp((t - 0.3) / 1.0, 0, 1);
      const spreadPhase = U.clamp((t - 1.3) / 2.0, 0, 1);
      const spreadEase = U.smoothstep(spreadPhase);
      const settled = t > 3.3;
      const sceneFade = view.playing
        ? Math.min(1, U.clamp(t / 0.55, 0, 1), U.clamp((cycle - t) / 1.25, 0, 1))
        : 1;

      // table
      C.fillRound(ctx, 40, 394, 570, 12, 6, 'rgba(160,180,210,.13)');
      // dish
      const dishX = 62, dishY = 282, dishW = 526, dishH = 104;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dishX, dishY);
      ctx.lineTo(dishX + 12, dishY + dishH - 12);
      ctx.quadraticCurveTo(dishX + dishW / 2, dishY + dishH + 12, dishX + dishW - 12, dishY + dishH - 12);
      ctx.lineTo(dishX + dishW, dishY);
      ctx.strokeStyle = 'rgba(180,210,245,.35)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // water
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dishX + 4, dishY + 8);
      ctx.lineTo(dishX + 15, dishY + dishH - 15);
      ctx.quadraticCurveTo(dishX + dishW / 2, dishY + dishH + 4, dishX + dishW - 15, dishY + dishH - 15);
      ctx.lineTo(dishX + dishW - 4, dishY + 8);
      ctx.closePath();
      const wg = ctx.createLinearGradient(0, dishY, 0, dishY + dishH);
      wg.addColorStop(0, 'rgba(50,140,220,.16)'); wg.addColorStop(1, 'rgba(20,80,160,.28)');
      ctx.fillStyle = wg; ctx.fill(); ctx.restore();
      // water surface
      C.line(ctx, dishX + 5, dishY + 8, dishX + dishW - 5, dishY + 8, 'rgba(130,205,255,.55)', 1.2);
      for (let i = 0; i < 12; i++) {
        const xx = dishX + 16 + i * 42;
        C.line(ctx, xx, dishY + 14, xx + 16, dishY + 14, 'rgba(130,205,255,.15)', 1);
      }
      C.label(ctx, '水面', dishX + 8, dishY + 29, { size: 7.5, color: 'rgba(130,205,255,.48)' });

      // final film width maps area
      const targetW = 150 + (state.A - 100) / 300 * 330;
      const fw = 12 + (targetW - 12) * (settled ? 1 : spreadEase);
      const filmH = 10 + 12 * spreadEase;
      ctx.save();
      ctx.globalAlpha = sceneFade;
      if (spreadPhase > 0) {
        const fx = 320, fy = dishY + 6;
        ctx.save();
        ctx.beginPath(); ctx.ellipse(fx, fy, fw / 2, filmH / 2, 0, 0, Math.PI * 2);
        const fg = ctx.createLinearGradient(fx - fw / 2, fy, fx + fw / 2, fy);
        fg.addColorStop(0, 'rgba(150,120,255,.35)'); fg.addColorStop(0.28, 'rgba(80,210,255,.32)');
        fg.addColorStop(0.5, 'rgba(255,220,120,.38)'); fg.addColorStop(0.72, 'rgba(255,110,170,.3)');
        fg.addColorStop(1, 'rgba(120,255,180,.32)');
        ctx.fillStyle = fg; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.restore();
        if (settled) {
          // measurement grid over film
          ctx.save();
          ctx.beginPath(); ctx.ellipse(320, fy, fw / 2, filmH / 2, 0, 0, Math.PI * 2); ctx.clip();
          for (let x = 320 - fw / 2; x < 320 + fw / 2; x += 24) C.line(ctx, x, fy - 20, x, fy + 20, 'rgba(255,255,255,.1)', 0.7);
          for (let y = fy - 20; y < fy + 20; y += 10) C.line(ctx, 320 - fw / 2, y, 320 + fw / 2, y, 'rgba(255,255,255,.1)', 0.7);
          ctx.restore();
        }
      }
      C.label(ctx, '油膜', 320, dishY + 37, { size: 8, align: 'center', color: settled ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)' });
      ctx.restore();

      // dropper
      const dx = 320, dy = 84;
      C.fillRound(ctx, dx - 16, dy - 30, 32, 42, 6, 'rgba(210,225,245,.22)');
      C.roundRect(ctx, dx - 16, dy - 30, 32, 42, 6); ctx.strokeStyle = 'rgba(210,225,245,.4)'; ctx.stroke();
      C.fillRound(ctx, dx - 2, dy + 8, 4, 12, 2, 'rgba(210,225,245,.5)');
      if (dropPhase > 0 && dropPhase < 1) {
        const yy = 106 + (dropPhase * dropPhase) * (dishY - 114);
        ctx.save();
        ctx.globalAlpha = sceneFade;
        C.glowCircle(ctx, dx, yy, 15, '#ffcf70', 0.5);
        ctx.beginPath(); ctx.ellipse(dx, yy, 6, 9, 0, 0, Math.PI * 2);
        const dg = ctx.createRadialGradient(dx - 2, yy - 3, 1, dx, yy, 9);
        dg.addColorStop(0, 'rgba(255,255,235,.95)'); dg.addColorStop(0.5, 'rgba(255,220,140,.8)'); dg.addColorStop(1, 'rgba(220,160,60,.55)');
        ctx.fillStyle = dg; ctx.fill(); ctx.restore();
      }
      if (t > 1.28 && t < 1.95) {
        const rp = (t - 1.28) / 0.67;
        ctx.save();
        ctx.globalAlpha = sceneFade * (1 - rp);
        ctx.strokeStyle = 'rgba(170,225,255,.55)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(dx, dishY + 5, 8 + 42 * rp, 3 + 9 * rp, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      C.label(ctx, '油酸酒精溶液', dx, 44, { size: 8, align: 'center', color: 'rgba(230,240,255,.38)' });
      C.label(ctx, U.fmt(state.V, 3) + ' mL / 滴', dx, 60, { size: 7.5, align: 'center', color: 'rgba(230,240,255,.28)', mono: true });

      // magnifier
      const mx = 746, my = 176, mr = 104;
      ctx.save();
      ctx.globalAlpha = sceneFade;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(8,16,30,.92)'; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      const lens = ctx.createRadialGradient(mx - 30, my - 34, 8, mx, my, mr);
      lens.addColorStop(0, 'rgba(40,70,110,.5)'); lens.addColorStop(1, 'rgba(10,18,32,.2)');
      ctx.fillStyle = lens; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      // molecular lattice
      for (let row = -3; row <= 3; row++) {
        for (let col = -4; col <= 4; col++) {
          const px = mx + col * 22 + (row % 2 ? 11 : 0);
          const py = my + row * 19;
          if (Math.hypot(px - mx, py - my) > mr - 12) continue;
          const g = ctx.createRadialGradient(px - 4, py - 3, 1, px, py, 9);
          g.addColorStop(0, 'rgba(200,245,255,.92)'); g.addColorStop(0.5, 'rgba(80,190,255,.7)'); g.addColorStop(1, 'rgba(30,100,200,.3)');
          ctx.beginPath(); ctx.arc(px, py, 7.2, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = 'rgba(170,230,255,.28)'; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      // thickness arrow
      C.line(ctx, 690, 314, 690, 366, 'rgba(255,255,255,.12)', 1);
      // water layer below / air above labels inside lens
      C.label(ctx, '空气', mx, 100, { size: 7, align: 'center', color: 'rgba(180,220,255,.4)' });
      C.label(ctx, '水', mx, 300, { size: 7, align: 'center', color: 'rgba(120,190,255,.5)' });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = sceneFade;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150,205,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = sceneFade;
      C.label(ctx, '微观放大 · 单分子层', mx, my + mr + 18, { size: 8, align: 'center', color: 'rgba(150,205,255,.42)' });
      ctx.restore();

      // result card
      K.panel(ctx, 622, 300, 234, 94, { fill: 'rgba(9,15,26,.68)' });
      C.label(ctx, 'd = V / S', 638, 324, { size: 13, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, '分子直径 d', 638, 347, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.d_nm, 2) + ' nm', 638, 372, { size: 18, color: '#30d158', mono: true });
      C.label(ctx, U.sci(q.d_nm * 1e-9, 1) + ' m', 772, 372, { size: 9, color: 'rgba(230,240,255,.38)', mono: true });

      // stage progress
      ctx.save();
      ctx.globalAlpha = sceneFade;
      const stages = ['滴入', '铺展', '单分子层'];
      let active = 0;
      if (t > 1.2) active = 1;
      if (t > 3.3) active = 2;
      for (let i = 0; i < 3; i++) {
        const x = 76 + i * 152;
        C.dot(ctx, x, 354, 5, i <= active ? '#30d158' : 'rgba(255,255,255,.14)', i === active ? 8 : 0);
        C.label(ctx, stages[i], x + 12, 358, { size: 8, color: i <= active ? 'rgba(230,255,235,.6)' : 'rgba(230,240,255,.22)' });
        if (i < 2) C.line(ctx, x + 5, 354, x + 147, 354, i < active ? 'rgba(48,209,88,.45)' : 'rgba(255,255,255,.08)', 1);
      }
      C.label(ctx, 'S = ' + U.fmt(state.A, 0) + ' cm²', 76, 382, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      C.label(ctx, 'c = ' + U.fmt(state.c, 2) + '%', 204, 382, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      ctx.restore();
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('分子直径 d', U.fmt(q.d_nm, 2), 'nm'),
        K.readout('纯油酸体积', U.fmt(q.V_oil_mm3, 4), 'mm³'),
        K.readout('油膜面积 S', state.A, 'cm²'),
        K.readout('溶液浓度 c', U.fmt(state.c, 2), '%')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { A: state.A, V: state.V, c: state.c, d: q.d_nm, Voil: q.V_oil_mm3 };
    },
    columns: [
      { key: 'A', label: 'S', unit: 'cm²', decimals: 0 },
      { key: 'V', label: 'V', unit: 'mL', decimals: 3 },
      { key: 'c', label: 'c', unit: '%', decimals: 2 },
      { key: 'd', label: 'd', unit: 'nm', decimals: 3 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const A = 100 + i / 60 * 300;
        pts.push({ x: A, y: 100000 * state.V * state.c / A });
      }
      return {
        xLabel: '油膜面积 S', yLabel: '分子直径 d', xUnit: 'cm²', yUnit: 'nm',
        xMin: 100, xMax: 400, yMin: 0,
        series: [
          K.series(pts, '理论 d–S', '#30d158', { width: 2 }),
          K.scatter(view.records, 'A', 'd', '测量点', '#7dff9e', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>把油膜视为单分子层，油酸分子的直径 d = V/S ≈ <b>' + U.fmt(q.d_nm, 2) + ' nm</b>（' + U.sci(q.d_nm * 1e-9, 1) + ' m），与分子直径的数量级 10⁻¹⁰ m 相符。';
    }
  });
  /* ------------------------------------------------------------
     22 · 探究等温条件下气体压强与体积的关系
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'gas-law',
    live: false,
    playable: false,
    hint: '缓慢改变体积 · 读取压强 · 作 p–V 与 p–1/V 图像',
    init(state) { state._phase = 0; },
    _p(state) { return state.n * 8.314 * state.T / state.V; },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const p = this._p(state);
      const inv = 1000 / state.V;
      const bx = 188, by = 238, bw = 470, bh = 92;
      const pistonX = bx + 24 + (state.V - 20) / 80 * (bw - 58);

      K.panel(ctx, 42, 38, 486, 150, { fill: 'rgba(9,15,26,.48)', stroke: 'rgba(255,255,255,.06)' });
      C.label(ctx, '玻意耳定律 · 等温过程', 60, 64, { size: 9.5, color: 'rgba(230,240,255,.44)' });
      C.label(ctx, 'pV = nRT = 恒量', 60, 104, { size: 24, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, '缓慢改变体积，保持温度不变', 60, 132, { size: 8.5, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, 'p = ' + U.fmt(p, 1) + ' kPa', 60, 162, { size: 10, color: '#7dff9e', mono: true });

      // pressure gauge
      K.panel(ctx, 566, 38, 286, 150, { fill: 'rgba(10,17,30,.62)' });
      C.label(ctx, '压力表', 586, 62, { size: 9, color: 'rgba(230,240,255,.4)' });
      const gx = 704, gy = 114, gr = 43;
      ctx.save();
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8,15,24,.85)'; ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,190,.35)'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * 0.8 + i / 10 * Math.PI * 1.4;
        const r1 = gr - 6, r2 = gr - 1;
        C.line(ctx, gx + Math.cos(a) * r1, gy + Math.sin(a) * r1, gx + Math.cos(a) * r2, gy + Math.sin(a) * r2, 'rgba(180,230,205,.45)', 1);
      }
      const na = Math.PI * 0.8 + U.clamp(p / 300, 0, 1) * Math.PI * 1.4;
      C.line(ctx, gx, gy, gx + Math.cos(na) * (gr - 9), gy + Math.sin(na) * (gr - 9), '#7dff9e', 2);
      C.dot(ctx, gx, gy, 3, '#7dff9e');
      C.label(ctx, U.fmt(p, 1) + ' kPa', gx, gy + 61, { size: 10, color: '#7dff9e', align: 'center', mono: true });
      ctx.restore();

      // syringe
      K.panel(ctx, 40, 202, 824, 196, { fill: 'rgba(8,14,24,.38)', stroke: 'rgba(255,255,255,.06)' });
      C.label(ctx, '注射器 · 封闭空气柱', 58, 226, { size: 9.5, color: 'rgba(230,240,255,.42)' });
      C.label(ctx, 'V = ' + U.fmt(state.V, 0) + ' mL', 58, 247, { size: 8.5, color: '#7dff9e', mono: true });
      ctx.save();
      C.fillRound(ctx, bx, by, bw, bh, 18, 'rgba(205,225,245,.08)');
      ctx.strokeStyle = 'rgba(210,235,255,.35)'; ctx.lineWidth = 2;
      C.roundRect(ctx, bx, by, bw, bh, 18); ctx.stroke();
      // gas column
      const gasW = Math.max(18, pistonX - bx - 2);
      const grad = ctx.createLinearGradient(bx, by, bx + gasW, by + bh);
      grad.addColorStop(0, 'rgba(48,209,88,.06)'); grad.addColorStop(1, 'rgba(48,209,88,.22)');
      ctx.fillStyle = grad;
      C.roundRect(ctx, bx + 2, by + 2, gasW, bh - 4, 14); ctx.fill();
      for (let i = 0; i < 34; i++) {
        const a = i * 2.399 + (state._phase || 0);
        const px = bx + 10 + (Math.sin(a * 2.1) * .5 + .5) * Math.max(4, gasW - 20);
        const py = by + 10 + (Math.cos(a * 1.7) * .5 + .5) * (bh - 20);
        C.dot(ctx, px, py, 1.5, i % 3 ? 'rgba(160,255,185,.5)' : 'rgba(255,255,255,.55)');
      }
      // piston
      C.fillRound(ctx, pistonX, by + 8, 18, bh - 16, 5, 'rgba(205,225,245,.8)');
      C.fillRound(ctx, pistonX + 18, by + 32, 52, 28, 5, 'rgba(150,180,215,.45)');
      C.line(ctx, pistonX + 70, by + 46, bx + bw - 18, by + 46, 'rgba(205,225,245,.45)', 5);
      C.label(ctx, '柱塞', pistonX + 33, by + 82, { size: 8, color: 'rgba(230,240,255,.4)', align: 'center' });
      // scale
      for (let i = 0; i <= 8; i++) {
        const x = bx + 24 + i / 8 * (bw - 58);
        C.line(ctx, x, by + bh + 5, x, by + bh + 11, 'rgba(180,215,245,.26)', 1);
        if (i % 2 === 0) C.label(ctx, (20 + i * 10) + '', x, by + bh + 23, { size: 7, color: 'rgba(180,215,245,.3)', align: 'center', mono: true });
      }
      C.label(ctx, 'V / mL', bx + bw / 2, by + bh + 38, { size: 8, color: 'rgba(180,215,245,.3)', align: 'center' });
      C.label(ctx, 'T = ' + U.fmt(state.T, 0) + ' K  ·  n = ' + U.fmt(state.n, 1) + ' mmol', 620, 414, { size: 8.5, color: 'rgba(230,240,255,.35)', align: 'right' });
      C.label(ctx, '1/V = ' + U.fmt(inv, 2) + ' L⁻¹', 620, 432, { size: 8.5, color: 'rgba(125,255,158,.6)', align: 'right', mono: true });
      ctx.restore();
    },
    readouts(state) {
      const p = this._p(state);
      return [
        K.readout('压强 p', U.fmt(p, 1), 'kPa'),
        K.readout('体积 V', U.fmt(state.V, 0), 'mL'),
        K.readout('pV', U.fmt(p * state.V / 1000, 1), 'J'),
        K.readout('1/V', U.fmt(1000 / state.V, 2), 'L⁻¹')
      ];
    },
    sample(state) {
      const p = this._p(state);
      return { V: state.V, p: p, invV: 1000 / state.V, T: state.T, n: state.n };
    },
    columns: [
      { key: 'V', label: 'V', unit: 'mL', decimals: 0 },
      { key: 'p', label: 'p', unit: 'kPa', decimals: 1 },
      { key: 'invV', label: '1/V', unit: 'L⁻¹', decimals: 2 },
      { key: 'T', label: 'T', unit: 'K', decimals: 0 }
    ],
    plot(state, view) {
      const inv = state.chartMode === 'inv';
      const pts = [];
      for (let i = 0; i <= 90; i++) {
        const V = 20 + i / 90 * 80;
        const p = state.n * 8.314 * state.T / V;
        pts.push({ x: inv ? 1000 / V : V, y: p });
      }
      const data = view.records.map((r) => ({ x: inv ? r.invV : r.V, y: r.p }));
      return {
        xLabel: inv ? '1/V' : '体积 V', yLabel: '压强 p', xUnit: inv ? 'L⁻¹' : 'mL', yUnit: 'kPa',
        xMin: inv ? 10 : 20, xMax: inv ? 50 : 100, yMin: 0,
        series: [
          K.series(pts, '等温线', '#30d158', { width: 2 }),
          K.scatter(data, 'x', 'y', '测量点', '#7dff9e', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const p = this._p(state);
      return '<b>结论：</b>当前 p = <b>' + U.fmt(p, 1) + ' kPa</b>、V = <b>' + U.fmt(state.V, 0) + ' mL</b>，pV ≈ <b>' + U.fmt(p * state.V / 1000, 1) + ' J</b>。等温条件下 p 与 V 成反比，p–1/V 图像是一条过原点的直线。';
    }
  });
})();
