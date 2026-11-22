/* ============================================================
   Electricity labs 11–14
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const C = OL.canvas;
  const K = OL.labKit;
  const U = OL.utils;
  const P = OL.palette;

  function pointAt(points, f) {
    f = ((f % 1) + 1) % 1;
    let total = 0;
    const segs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push(l); total += l;
    }
    let d = f * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) {
        const a = points[i], b = points[(i + 1) % points.length];
        const k = d / (segs[i] || 1);
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }
      d -= segs[i];
    }
    return points[0];
  }

  function flow(ctx, points, time, color, speed, count) {
    count = count || 14;
    const n = count;
    for (let i = 0; i < n; i++) {
      const p = pointAt(points, (i / n + time * (speed || 0.08)) % 1);
      C.dot(ctx, p[0], p[1], 1.7, color, 4);
    }
  }

  function batterySymbol(ctx, x, y, horizontal, scale) {
    const s = scale || 1;
    ctx.save();
    if (horizontal) {
      C.line(ctx, x - 22 * s, y, x - 8 * s, y, 'rgba(220,235,255,.55)', 1.2);
      C.line(ctx, x - 8 * s, y - 13 * s, x - 8 * s, y + 13 * s, 'rgba(220,235,255,.65)', 2);
      C.line(ctx, x + 2 * s, y - 7 * s, x + 2 * s, y + 7 * s, 'rgba(220,235,255,.65)', 3);
      C.line(ctx, x + 2 * s, y, x + 22 * s, y, 'rgba(220,235,255,.55)', 1.2);
      C.label(ctx, '+', x - 13 * s, y - 18 * s, { size: 8, color: '#ff8a80', align: 'center' });
    } else {
      C.line(ctx, x, y - 22 * s, x, y - 8 * s, 'rgba(220,235,255,.55)', 1.2);
      C.line(ctx, x - 13 * s, y - 8 * s, x + 13 * s, y - 8 * s, 'rgba(220,235,255,.65)', 2);
      C.line(ctx, x - 7 * s, y + 2 * s, x + 7 * s, y + 2 * s, 'rgba(220,235,255,.65)', 3);
      C.line(ctx, x, y + 2 * s, x, y + 22 * s, 'rgba(220,235,255,.55)', 1.2);
      C.label(ctx, '+', x + 17 * s, y - 8 * s, { size: 8, color: '#ff8a80', align: 'center' });
    }
    ctx.restore();
  }

  function meter(ctx, x, y, r, letter, value, color) {
    const W = r * 3.8, H = r * 2.9;
    const left = x - W / 2, top = y - H / 2;
    const numeric = parseFloat(String(value == null ? '' : value).replace(/[^0-9.+-]/g, ''));
    const max = letter === 'A' ? 0.6 : 3;
    const frac = Number.isFinite(numeric) ? Math.max(0, Math.min(1, Math.abs(numeric) / max)) : 0;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    C.fillRound(ctx, left, top, W, H, r * .32, '#e7ebf0');
    ctx.shadowColor = 'transparent';
    C.fillRound(ctx, left + 2, top + 2, W - 4, H - 4, r * .28, '#f7f5ed');
    ctx.strokeStyle = 'rgba(90,105,125,.55)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - r * .06, r * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.fill();
    ctx.strokeStyle = 'rgba(80,95,115,.35)'; ctx.lineWidth = .8; ctx.stroke();
    const fy = -r * .06, fr = r * 1.12;
    ctx.strokeStyle = 'rgba(42,54,68,.75)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(x, y + fy, fr * .78, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 1.04 + Math.PI * .92 * i / 10;
      const inner = fr * (i % 5 === 0 ? .62 : .69), outer = fr * .78;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * inner, y + fy + Math.sin(a) * inner);
      ctx.lineTo(x + Math.cos(a) * outer, y + fy + Math.sin(a) * outer);
      ctx.strokeStyle = i % 5 === 0 ? 'rgba(35,45,58,.9)' : 'rgba(75,88,105,.58)';
      ctx.lineWidth = i % 5 === 0 ? 1.2 : .7; ctx.stroke();
    }
    C.label(ctx, '0', x - fr * .62, y + fy + fr * .48, { size: r * .3, align: 'center', color: 'rgba(45,55,68,.75)', mono: true });
    C.label(ctx, String(max), x + fr * .58, y + fy + fr * .48, { size: r * .3, align: 'center', color: 'rgba(45,55,68,.75)', mono: true });
    const a = Math.PI * 1.04 + Math.PI * .92 * frac;
    ctx.beginPath(); ctx.moveTo(x, y + fy + fr * .03);
    ctx.lineTo(x + Math.cos(a) * fr * .68, y + fy + Math.sin(a) * fr * .68);
    ctx.strokeStyle = color || '#e04b3f'; ctx.lineWidth = Math.max(1.2, r * .055); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + fy + fr * .03, r * .09, 0, Math.PI * 2); ctx.fillStyle = '#26313e'; ctx.fill();
    ctx.beginPath(); ctx.arc(x - W * .24, y + H * .42, r * .12, 0, Math.PI * 2); ctx.fillStyle = '#c94135'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + W * .24, y + H * .42, r * .12, 0, Math.PI * 2); ctx.fillStyle = '#20242b'; ctx.fill();
    C.label(ctx, letter, x, top + r * .33, { size: r * .34, align: 'center', color: 'rgba(50,60,74,.86)', weight: 700 });
    C.label(ctx, 'COM', x + W * .24, y + H * .42, { size: r * .18, align: 'center', color: 'rgba(255,255,255,.35)', mono: true });
    ctx.beginPath(); ctx.arc(x - r * .28, y + fy - r * .35, fr * .55, Math.PI * 1.05, Math.PI * 1.55);
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = r * .1; ctx.stroke();
    ctx.restore();
    if (value != null) C.label(ctx, value, x, top + H + 12, { size: 8.5, align: 'center', color: color || '#64d2ff', mono: true });
  }

  function zigzag(ctx, x1, y, x2, color) {
    const n = 7, w = (x2 - x1) / n;
    ctx.save();
    ctx.strokeStyle = color || 'rgba(220,235,255,.65)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y);
    for (let i = 0; i < n; i++) ctx.lineTo(x1 + w * (i + 0.5), y + (i % 2 ? 5 : -5));
    ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
  }

  /* ------------------------------------------------------------
     11 · 测量金属丝的电阻率
     ------------------------------------------------------------ */
  const MATERIALS = {
    copper: { name: '铜', rho: 1.7e-8, color: '#ff9f6b' },
    aluminum: { name: '铝', rho: 2.8e-8, color: '#cfd8e6' },
    nichrome: { name: '镍铬合金', rho: 1.1e-6, color: '#a8b4c8' }
  };

  OL.registerLab({
    id: 'resistivity',
    live: false,
    playable: true,
    hint: '用游标卡尺测 L，用螺旋测微器测 d，再由伏安法求 R 与 ρ',
    extraControls: '<div class="measure-help-row"><button class="btn ghost small" data-action="measure-help" data-measure="caliper">游标卡尺用法</button><button class="btn ghost small" data-action="measure-help" data-measure="micrometer">螺旋测微器用法</button></div>',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const mat = MATERIALS[state.material] || MATERIALS.nichrome;
      const d = state.d * 1e-3;
      const area = Math.PI * d * d / 4;
      const R = mat.rho * state.L / area;
      const Rs = 5;
      const I = state.U / (R + Rs);
      const Uw = I * R;
      return { mat, d, area, R, I, Uw, Rs };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const loop = [[96, 150], [300, 150], [510, 150], [510, 330], [96, 330]];
      // wires
      ctx.save();
      ctx.strokeStyle = 'rgba(210,228,250,.42)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      loop.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
      ctx.closePath(); ctx.stroke(); ctx.restore();
      flow(ctx, loop, view.t, 'rgba(100,210,255,.55)', U.clamp(q.I * 0.18, 0.015, 0.3), 14);

      // battery
      batterySymbol(ctx, 96, 240, false, 1.1);
      C.label(ctx, U.fmt(state.U, 1) + ' V', 76, 210, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      // ammeter
      meter(ctx, 282, 150, 22, 'A', U.fmt(q.I, 2) + ' A', '#64d2ff');
      // sample wire
      C.line(ctx, 354, 150, 468, 150, q.mat.color, 4);
      C.line(ctx, 354, 150, 468, 150, 'rgba(255,255,255,.35)', 1);
      C.label(ctx, '待测金属丝', 411, 174, { size: 7.5, align: 'center', color: 'rgba(230,240,255,.35)' });
      // protective resistor
      zigzag(ctx, 292, 330, 372, 'rgba(220,235,255,.6)');
      C.label(ctx, '保护电阻 5 Ω', 332, 352, { size: 7, align: 'center', color: 'rgba(230,240,255,.3)' });
      // voltmeter branch
      C.line(ctx, 354, 150, 354, 78, 'rgba(210,228,250,.38)', 1.1);
      C.line(ctx, 354, 78, 468, 78, 'rgba(210,228,250,.38)', 1.1);
      C.line(ctx, 468, 78, 468, 150, 'rgba(210,228,250,.38)', 1.1);
      meter(ctx, 411, 78, 22, 'V', U.fmt(q.Uw, 3) + ' V', '#ffb340');

      // wire zoom
      K.panel(ctx, 560, 54, 292, 130, { fill: 'rgba(9,15,26,.58)' });
      C.label(ctx, q.mat.name + '丝 · 放大视图', 576, 76, { size: 8.5, color: 'rgba(230,240,255,.4)' });
      C.line(ctx, 578, 105, 834, 105, q.mat.color, 10);
      C.line(ctx, 578, 105, 834, 105, 'rgba(255,255,255,.35)', 2);
      for (let i = 0; i < 6; i++) C.line(ctx, 590 + i * 44, 100, 590 + i * 44, 110, 'rgba(20,30,45,.5)', 1);
      C.label(ctx, 'L = ' + U.fmt(state.L, 2) + ' m', 578, 134, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      C.label(ctx, 'd = ' + U.fmt(state.d, 2) + ' mm', 720, 134, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      C.label(ctx, 'S = ' + U.sci(q.area, 2) + ' m²', 578, 153, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });

      // formula / results
      K.panel(ctx, 560, 200, 292, 172, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, 'ρ = R·S / L', 578, 226, { size: 16, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, 'R = U / I', 578, 252, { size: 9, color: 'rgba(230,240,255,.38)', mono: true });
      C.label(ctx, '测得 R', 578, 280, { size: 8, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, U.fmt(q.R, 3) + ' Ω', 578, 300, { size: 18, color: '#64d2ff', mono: true });
      C.label(ctx, '电阻率 ρ', 578, 327, { size: 8, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, U.sci(q.mat.rho, 2) + ' Ω·m', 578, 347, { size: 14, color: '#30d158', mono: true });
      C.label(ctx, '真实值 ' + q.mat.name + ' ' + U.sci(q.mat.rho, 1) + ' Ω·m', 700, 301, { size: 7, color: 'rgba(230,240,255,.3)' });

      // vernier caliper (length measurement)
      K.panel(ctx, 40, 368, 392, 84, { fill: 'rgba(9,15,26,.62)', stroke: 'rgba(150,180,220,.16)' });
      C.label(ctx, '游标卡尺 · 测有效长度 L', 54, 386, { size: 7.5, color: 'rgba(230,240,255,.5)' });
      C.fillRound(ctx, 58, 398, 330, 13, 3, 'rgba(198,207,219,.72)');
      C.fillRound(ctx, 58, 411, 330, 5, 2, 'rgba(120,132,148,.8)');
      for (let i = 0; i <= 33; i++) {
        const tx = 62 + i * 9.7;
        C.line(ctx, tx, 398, tx, 398 - (i % 5 === 0 ? 8 : 4), 'rgba(28,36,48,.75)', .8);
      }
      const jawX = 94 + (state.L / 1.2) * 250;
      C.line(ctx, 90, 394, 90, 414, 'rgba(28,36,48,.95)', 5);
      C.line(ctx, jawX, 394, jawX, 418, 'rgba(28,36,48,.95)', 5);
      C.line(ctx, 90, 406, jawX, 406, q.mat.color, 4);
      C.fillRound(ctx, jawX - 4, 416, 92, 9, 2, 'rgba(210,220,234,.88)');
      C.label(ctx, '0', jawX, 432, { size: 6, align: 'center', color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, '10', jawX + 78, 432, { size: 6, align: 'center', color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, 'L = ' + U.fmt(state.L, 2) + ' m', 300, 390, { size: 8, align: 'right', color: '#ffd166', mono: true });
      C.label(ctx, '读数 = 主尺 + 对齐格数 × 0.02 mm', 54, 442, { size: 6.5, color: 'rgba(230,240,255,.35)' });

      // micrometer screw gauge (diameter measurement)
      K.panel(ctx, 460, 368, 382, 84, { fill: 'rgba(9,15,26,.62)', stroke: 'rgba(150,180,220,.16)' });
      C.label(ctx, '螺旋测微器 · 测直径 d', 474, 386, { size: 7.5, color: 'rgba(230,240,255,.5)' });
      C.fillRound(ctx, 486, 408, 145, 13, 4, 'rgba(181,192,207,.7)');
      C.fillRound(ctx, 486, 408, 12, 28, 4, 'rgba(130,143,160,.9)');
      C.line(ctx, 510, 403, 510, 426, 'rgba(30,40,54,.9)', 5);
      const sleeveX = 556 + (state.d / 1) * 95;
      C.line(ctx, 510, 414, sleeveX, 414, q.mat.color, 6);
      C.line(ctx, 510, 414, sleeveX, 414, 'rgba(255,255,255,.32)', 1);
      C.dot(ctx, sleeveX, 414, 12, 'rgba(181,192,207,.9)');
      C.dot(ctx, sleeveX, 414, 8, '#394455');
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        C.line(ctx, sleeveX + Math.cos(a) * 8, 414 + Math.sin(a) * 8, sleeveX + Math.cos(a) * 12, 414 + Math.sin(a) * 12, 'rgba(30,40,54,.75)', .8);
      }
      C.line(ctx, 638, 404, 638, 426, 'rgba(210,220,234,.9)', 4);
      C.fillRound(ctx, 642, 420, 90, 8, 2, 'rgba(120,132,148,.65)');
      C.label(ctx, 'd = ' + U.fmt(state.d, 2) + ' mm', 824, 390, { size: 8, align: 'right', color: '#ffd166', mono: true });
      C.label(ctx, '读数 = 固定刻度 + 可动刻度 × 0.01 mm', 474, 442, { size: 6.5, color: 'rgba(230,240,255,.35)' });
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('电阻 R', U.fmt(q.R, 3), 'Ω'),
        K.readout('电流 I', U.fmt(q.I, 2), 'A'),
        K.readout('电压 U', U.fmt(q.Uw, 3), 'V'),
        K.readout('电阻率 ρ', U.sci(q.mat.rho, 2), 'Ω·m')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { U: q.Uw, I: q.I, R: q.R, L: state.L, d: state.d, rho: q.mat.rho };
    },
    columns: [
      { key: 'U', label: 'U', unit: 'V', decimals: 4 },
      { key: 'I', label: 'I', unit: 'A', decimals: 4 },
      { key: 'R', label: 'R', unit: 'Ω', decimals: 4 }
    ],
    plot(state, view) {
      const q = this._calc(state);
      const pts = [];
      const Imax = Math.max(0.01, state.U / (q.R + q.Rs));
      for (let i = 0; i <= 60; i++) {
        const I = Imax * i / 60;
        pts.push({ x: I, y: I * q.R });
      }
      return {
        xLabel: '电流 I', yLabel: '金属丝电压 U', xUnit: 'A', yUnit: 'V',
        xMin: 0, xMax: Math.max(Imax * 1.1, 0.01), yMin: 0,
        series: [
          K.series(pts, '理论 U–I', '#ffb340', { width: 2 }),
          K.scatter(view.records, 'I', 'U', '测量点', '#ffd166', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>用伏安法测得金属丝电阻 R ≈ ' + U.fmt(q.R, 3) + ' Ω，结合 L = ' + U.fmt(state.L, 2) + ' m、d = ' + U.fmt(state.d, 2) + ' mm，算得 ρ ≈ <b>' + U.sci(q.mat.rho, 2) + ' Ω·m</b>。' + (q.I > 5 ? ' ⚠ 电流过大，实际实验中应缩短通电时间。' : '');
    }
  });

  /* ------------------------------------------------------------
     12 · 描绘小灯泡的伏安特性曲线
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'bulb-curve',
    live: false,
    playable: true,
    hint: '从零调压 · 记录多组 U、I 描点',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const R = state.R0 * (1 + 0.055 * Math.pow(Math.max(0, state.U), 1.5));
      const I = state.U <= 0 ? 0 : state.U / R;
      const P = state.U * I;
      return { R, I, P, bright: U.clamp(P / 4.2, 0, 1) };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const loop = [[96, 150], [280, 150], [330, 150], [500, 150], [500, 330], [96, 330]];
      ctx.save(); ctx.strokeStyle = 'rgba(210,228,250,.4)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); loop.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.stroke(); ctx.restore();
      flow(ctx, loop, view.t, 'rgba(255,196,110,.55)', 0.04 + q.I * 0.12, 12);

      batterySymbol(ctx, 98, 240, false, 1.1);
      C.label(ctx, U.fmt(state.U, 1) + ' V', 74, 210, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      meter(ctx, 270, 150, 21, 'A', U.fmt(q.I, 2) + ' A', '#64d2ff');
      // lamp
      const lx = 414, ly = 150;
      if (q.bright > 0.01) C.glowCircle(ctx, lx, ly, 92, '#ffcf70', 0.42 * q.bright);
      ctx.save();
      ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,242,205,' + (0.08 + q.bright * 0.4) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,180,' + (0.3 + q.bright * 0.6) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      K.lamp(ctx, lx, ly, 15, q.bright);
      C.label(ctx, '小灯泡', lx, 194, { size: 8, align: 'center', color: 'rgba(230,240,255,.35)' });

      // rheostat
      zigzag(ctx, 300, 330, 390, 'rgba(220,235,255,.55)');
      C.line(ctx, 390, 330, 390, 300, 'rgba(220,235,255,.35)', 1);
      C.arrow(ctx, 390, 300, 410, 300, { color: 'rgba(220,235,255,.45)', width: 1, head: 4 });
      C.label(ctx, '滑动变阻器（分压）', 318, 352, { size: 7, align: 'center', color: 'rgba(230,240,255,.3)' });

      // voltmeter branch
      C.line(ctx, 378, 150, 378, 78, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 378, 78, 450, 78, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 450, 78, 450, 150, 'rgba(210,228,250,.35)', 1.1);
      meter(ctx, 414, 78, 21, 'V', U.fmt(state.U, 2) + ' V', '#ffb340');

      // result panel
      K.panel(ctx, 560, 54, 292, 202, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, '灯丝状态', 578, 78, { size: 9, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, 'R = ' + U.fmt(q.R, 1) + ' Ω', 578, 110, { size: 17, color: '#ffd166', mono: true, weight: 600 });
      C.label(ctx, 'I = ' + U.fmt(q.I, 3) + ' A', 578, 138, { size: 11, color: '#64d2ff', mono: true });
      C.label(ctx, 'P = ' + U.fmt(q.P, 2) + ' W', 578, 160, { size: 11, color: '#ffb340', mono: true });
      C.label(ctx, '灯丝温度升高 → 电阻增大', 578, 190, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, 'I–U 图线向电流轴弯曲', 578, 206, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      K.panel(ctx, 560, 272, 292, 100, { fill: 'rgba(9,15,26,.48)' });
      C.label(ctx, 'R₀ = ' + state.R0 + ' Ω（冷态）', 578, 295, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      C.label(ctx, '当前 R / R₀ = ' + U.fmt(q.R / state.R0, 2), 578, 315, { size: 8, color: 'rgba(230,240,255,.35)', mono: true });
      C.label(ctx, '亮度', 578, 342, { size: 8, color: 'rgba(230,240,255,.35)' });
      C.fillRound(ctx, 616, 336, 204, 6, 3, 'rgba(255,255,255,.09)');
      C.fillRound(ctx, 616, 336, 204 * q.bright, 6, 3, '#ffb340');
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('电压 U', U.fmt(state.U, 2), 'V'),
        K.readout('电流 I', U.fmt(q.I, 3), 'A'),
        K.readout('电阻 R', U.fmt(q.R, 1), 'Ω'),
        K.readout('功率 P', U.fmt(q.P, 2), 'W')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { U: state.U, I: q.I, R: q.R, P: q.P };
    },
    columns: [
      { key: 'U', label: 'U', unit: 'V', decimals: 2 },
      { key: 'I', label: 'I', unit: 'A', decimals: 4 },
      { key: 'R', label: 'R', unit: 'Ω', decimals: 2 },
      { key: 'P', label: 'P', unit: 'W', decimals: 3 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const u = i / 80 * 12;
        const r = state.R0 * (1 + 0.055 * Math.pow(u, 1.5));
        pts.push({ x: u, y: u <= 0 ? 0 : u / r });
      }
      return {
        xLabel: '电压 U', yLabel: '电流 I', xUnit: 'V', yUnit: 'A',
        xMin: 0, xMax: 12, yMin: 0,
        series: [
          K.series(pts, '理论 I–U 曲线', '#ffb340', { width: 2 }),
          K.scatter(view.records, 'U', 'I', '测量点', '#ffd166', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>小灯泡的 I–U 图线不是直线，而是向电流轴弯曲。电压升高时灯丝温度升高，电阻由冷态的 ' + state.R0 + ' Ω 增大到 <b>' + U.fmt(q.R, 1) + ' Ω</b>，因此不能把它当作定值电阻。';
    }
  });

  /* ------------------------------------------------------------
     13 · 测量电源电动势和内阻
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'emf-internal',
    live: false,
    playable: true,
    hint: '改变外电阻 · 用 U–I 截距与斜率求 E、r',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const I = state.E / (state.R + state.r);
      return { I, U: I * state.R, P: I * I * state.R };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const loop = [[100, 150], [290, 150], [500, 150], [500, 330], [100, 330]];
      ctx.save(); ctx.strokeStyle = 'rgba(210,228,250,.42)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); loop.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke(); ctx.restore();
      flow(ctx, loop, view.t, 'rgba(100,210,255,.5)', 0.04 + q.I * 0.06, 13);

      // battery with internal resistance
      batterySymbol(ctx, 100, 240, false, 1.15);
      C.line(ctx, 112, 268, 128, 268, 'rgba(255,179,64,.65)', 2);
      C.line(ctx, 112, 276, 128, 276, 'rgba(255,179,64,.65)', 2);
      C.label(ctx, 'r', 136, 274, { size: 8, color: '#ffb340', mono: true });
      C.label(ctx, 'E = ' + U.fmt(state.E, 1) + ' V', 74, 208, { size: 8, color: 'rgba(230,240,255,.38)', mono: true });

      meter(ctx, 272, 150, 21, 'A', U.fmt(q.I, 3) + ' A', '#64d2ff');
      // rheostat
      zigzag(ctx, 300, 330, 400, 'rgba(220,235,255,.55)');
      C.line(ctx, 400, 330, 400, 298, 'rgba(220,235,255,.35)', 1);
      C.arrow(ctx, 400, 298, 424, 298, { color: 'rgba(220,235,255,.45)', width: 1, head: 4 });
      C.label(ctx, 'R = ' + U.fmt(state.R, 1) + ' Ω', 352, 352, { size: 7.5, align: 'center', color: 'rgba(230,240,255,.35)', mono: true });
      // voltmeter across battery terminals
      C.line(ctx, 100, 150, 76, 150, 'rgba(210,228,250,.35)', 1);
      C.line(ctx, 76, 150, 76, 68, 'rgba(210,228,250,.35)', 1);
      C.line(ctx, 76, 68, 158, 68, 'rgba(210,228,250,.35)', 1);
      C.line(ctx, 158, 68, 158, 150, 'rgba(210,228,250,.35)', 1);
      meter(ctx, 117, 68, 20, 'V', U.fmt(q.U, 2) + ' V', '#ffb340');

      // result panel
      K.panel(ctx, 560, 54, 292, 204, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, '路端电压', 578, 78, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.U, 2) + ' V', 578, 101, { size: 21, color: '#ffd166', mono: true, weight: 600 });
      C.label(ctx, '总电流', 578, 130, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.I, 3) + ' A', 578, 151, { size: 15, color: '#64d2ff', mono: true });
      C.label(ctx, 'U = E − Ir', 578, 183, { size: 11, color: 'rgba(230,240,255,.5)', mono: true });
      C.label(ctx, '外电路功率 ' + U.fmt(q.P, 2) + ' W', 578, 207, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, '内阻消耗 ' + U.fmt(q.I * q.I * state.r, 2) + ' W', 578, 225, { size: 8, color: 'rgba(255,138,128,.55)' });

      // characteristic hint
      K.panel(ctx, 560, 274, 292, 98, { fill: 'rgba(9,15,26,.48)' });
      C.label(ctx, '图像法', 578, 296, { size: 8, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, '纵截距 = E', 578, 317, { size: 9, color: '#ffb340', mono: true });
      C.label(ctx, '斜率绝对值 = r', 578, 335, { size: 9, color: '#ffb340', mono: true });
      C.label(ctx, '横截距 = E/r', 578, 353, { size: 9, color: 'rgba(230,240,255,.4)', mono: true });
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('路端电压 U', U.fmt(q.U, 2), 'V'),
        K.readout('电流 I', U.fmt(q.I, 3), 'A'),
        K.readout('电动势 E', U.fmt(state.E, 1), 'V'),
        K.readout('内阻 r', U.fmt(state.r, 2), 'Ω')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { U: q.U, I: q.I, R: state.R, P: q.P };
    },
    columns: [
      { key: 'U', label: 'U', unit: 'V', decimals: 3 },
      { key: 'I', label: 'I', unit: 'A', decimals: 3 },
      { key: 'R', label: 'R', unit: 'Ω', decimals: 2 }
    ],
    plot(state, view) {
      const pts = [];
      const Isc = state.E / state.r;
      for (let i = 0; i <= 60; i++) {
        const I = Isc * i / 60;
        pts.push({ x: I, y: state.E - I * state.r });
      }
      return {
        xLabel: '电流 I', yLabel: '路端电压 U', xUnit: 'A', yUnit: 'V',
        xMin: 0, xMax: Math.max(Isc, 0.1), yMin: 0,
        series: [
          K.series(pts, '理论 U–I', '#ffb340', { width: 2 }),
          K.scatter(view.records, 'I', 'U', '测量点', '#ffd166', { pointSize: 4 })
        ]
      };
    },
    conclusion(state, view) {
      const n = view.records.length;
      if (n < 2) return '<b>提示：</b>改变外电阻 R，记录至少 3 组 U、I，作 U–I 图像。纵截距为 E，斜率绝对值为 r。';
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      view.records.forEach((r) => { sx += r.I; sy += r.U; sxx += r.I * r.I; sxy += r.I * r.U; });
      const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const a = (sy - b * sx) / n;
      return '<b>结论：</b>U–I 图线是一条向下倾斜的直线。纵截距给出 E ≈ <b>' + U.fmt(a, 2) + ' V</b>，斜率绝对值给出 r ≈ <b>' + U.fmt(-b, 2) + ' Ω</b>。';
    }
  });

  /* ------------------------------------------------------------
     14 · 练习使用多用电表
     ------------------------------------------------------------ */
  const COMPONENTS = {
    resistor: { label: '定值电阻', value: '220 Ω', R: 220, V: 0, I: 0.0136, color: '#ffd166', kind: 'resistor' },
    carbon: { label: '碳膜电阻', value: '1 kΩ', R: 1000, V: 0, I: 0.00136, color: '#f6c177', kind: 'resistor' },
    wirewound: { label: '线绕电阻', value: '47 Ω', R: 47, V: 0, I: 0.031, color: '#ff9f6b', kind: 'resistor' },
    thermistor: { label: '热敏电阻', value: '560 Ω', R: 560, V: 0, I: 0.00227, color: '#ffb3c1', kind: 'resistor' },
    photoresistor: { label: '光敏电阻', value: '2.2 kΩ', R: 2200, V: 0, I: 0.00065, color: '#ffd166', kind: 'resistor' },
    battery: { label: '干电池', value: '1.5 V', R: null, V: 1.5, I: null, color: '#ff8a80', kind: 'battery' },
    lamp: { label: '小灯泡', value: '0.3 A', R: 12, V: 3, I: 0.25, color: '#ffd166', kind: 'lamp' }
  };
  const PROBE_TERMINALS = [{ x: 622, y: 222 }, { x: 812, y: 222 }];
  const PROBE_HOME = { red: { x: 520, y: 340 }, black: { x: 850, y: 340 } };
  const MM = {
    body: { x: 66, y: 36, w: 304, h: 392 },
    dial: { x: 216, y: 268, r: 50 },
    zero: { x: 306, y: 320, r: 19 },
    jacks: [{ x: 120, y: 380, label: '+' }, { x: 168, y: 380, label: 'COM' }]
  };
  const MODE_ORDER = ['resistance', 'voltage', 'current'];
  const MODE_ANGLES = { resistance: -2.35, voltage: -1.15, current: 0.12 };
  function modeFromAngle(a) {
    let best = 'resistance', d = 99;
    MODE_ORDER.forEach((m) => {
      let delta = Math.abs(Math.atan2(Math.sin(a - MODE_ANGLES[m]), Math.cos(a - MODE_ANGLES[m])));
      if (delta < d) { d = delta; best = m; }
    });
    return best;
  }

  function resetProbes(state) {
    state._probe = {
      red: { x: PROBE_HOME.red.x, y: PROBE_HOME.red.y, attached: null },
      black: { x: PROBE_HOME.black.x, y: PROBE_HOME.black.y, attached: null }
    };
    state._connected = false;
    state._short = false;
    state._drag = null;
    if (state.ohmZero == null) state.ohmZero = 0.15;
  }

  function stagePoint(view, p) {
    const f = view && view._frame;
    if (!f || !f.s) return { x: p.x, y: p.y };
    return { x: (p.x - f.ox) / f.s, y: (p.y - f.oy) / f.s };
  }

  function nearestTerminal(p) {
    let best = -1, dist = 40;
    PROBE_TERMINALS.forEach((t, i) => {
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function refreshConnection(state) {
    const r = state._probe && state._probe.red;
    const b = state._probe && state._probe.black;
    const same = !!(r && b && r.attached != null && b.attached != null && r.attached === b.attached);
    const different = !!(r && b && r.attached != null && b.attached != null && r.attached !== b.attached);
    state._connected = different || (same && state.mode === 'resistance');
    state._short = same && state.mode === 'resistance';
  }

  function probeDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  OL.registerLab({
    id: 'multimeter',
    live: false,
    playable: false,
    pointer: true,
    hint: '拖动红黑表笔，分别接触待测元件两端 · 红表笔接“+”，黑表笔接“COM”',
    extraControls: '<button class="btn ghost small mm-short-btn" data-action="multimeter-short" title="把红黑表笔短接在同一接线柱，便于欧姆调零">短接表笔（欧姆调零）</button>',
    init(state, view) {
      state.ohmZero = 0.15;
      state.zeroDirty = false;
      resetProbes(state);
      view._frame = null;
    },
    onControl(key, state) {
      if (key === 'component') resetProbes(state);
    },
    shortProbes(state) {
      if (!state._probe) resetProbes(state);
      ['red', 'black'].forEach((key) => {
        state._probe[key].x = PROBE_TERMINALS[0].x;
        state._probe[key].y = PROBE_TERMINALS[0].y;
        state._probe[key].attached = 0;
      });
      state.mode = 'resistance';
      const sel = document.querySelector('select[data-control-select="mode"]');
      if (sel) sel.value = 'resistance';
      refreshConnection(state);
    },
    _measure(state) {
      const comp = COMPONENTS[state.component] || COMPONENTS.resistor;
      let value = 0, unit = '', display = '0', overload = false, note = '';
      const connected = !!state._connected;
      unit = state.mode === 'resistance' ? 'Ω' : state.mode === 'voltage' ? 'V' : 'mA';
      if (!connected) {
        const r = state._probe && state._probe.red;
        const b = state._probe && state._probe.black;
        const same = !!(r && b && r.attached != null && r.attached === b.attached);
        return { display: '---', unit, value: null, overload: false, note: same ? '两根表笔不能接在同一端' : '请拖动红黑表笔，接触待测元件两端', comp, connected: false };
      }
      if (state.mode === 'resistance') {
        if (state.component === 'battery') { display = 'OL'; note = '带电元件不能直接测电阻'; return { display, unit, overload: true, note, comp, connected }; }
        const zeroOffset = (0.5 - (state.ohmZero == null ? 0.5 : state.ohmZero)) * 36;
        if (state._short) {
          value = Math.max(0, zeroOffset);
          display = U.fmt(value, 1);
          note = Math.abs(value) < 0.6 ? '指针已在 0 Ω，欧姆调零完成' : '短接表笔，转动右侧欧姆调零旋钮，使指针到 0 Ω';
        } else {
          value = Math.max(0, comp.R + zeroOffset);
          if (state.range === 'low' && value > 200) { display = '1 .'; overload = true; note = '超出低量程，请换高量程'; }
          else display = U.fmt(value, 1);
          note = note || '欧姆挡使用内部电源，测量前需短接表笔调零';
        }
      } else if (state.mode === 'voltage') {
        value = state.component === 'battery' ? comp.V : 0;
        if (state.range === 'low' && value > 2) { display = '1 .'; overload = true; note = '超出 2 V 量程'; }
        else display = U.fmt(value, 2);
        note = note || (state.component === 'battery' ? '并联接入，红表笔接高电位' : '待测电阻两端没有电源，电压为 0');
      } else {
        value = state.component === 'battery' ? 0 : comp.I * 1000;
        if (state.component === 'battery') { display = '—'; note = '不能把电流表直接接在电源两端'; return { display, unit, overload: true, note, comp, connected }; }
        if ((state.range === 'low' && value > 20) || (state.range === 'high' && value > 200)) { display = '1 .'; overload = true; note = '超出量程，请换挡'; }
        else display = U.fmt(value, 1);
        note = note || '串联接入，电流从红表笔流入';
      }
      return { display, unit, value, overload, note, comp, connected };
    },
    onPointerDown(p, state, view) {
      if (!state._probe) resetProbes(state);
      const q = stagePoint(view, p);
      const probes = state._probe;
      if (Math.hypot(q.x - MM.dial.x, q.y - MM.dial.y) <= MM.dial.r + 16) {
        state._drag = 'dial';
        this._turnDial(q, state);
        return true;
      }
      if (Math.hypot(q.x - MM.zero.x, q.y - MM.zero.y) <= MM.zero.r + 14) {
        state._drag = 'zero';
        this._turnZero(q, state);
        return true;
      }
      const candidates = [
        { key: 'red', d: probeDistance(q, probes.red) },
        { key: 'black', d: probeDistance(q, probes.black) }
      ].sort((a, b) => a.d - b.d);
      if (candidates[0].d > 38) return false;
      state._drag = candidates[0].key;
      probes[state._drag].attached = null;
      refreshConnection(state);
      return true;
    },
    _turnDial(q, state) {
      const a = Math.atan2(q.y - MM.dial.y, q.x - MM.dial.x);
      const mode = modeFromAngle(a);
      if (mode !== state.mode) {
        state.mode = mode;
        const sel = document.querySelector('select[data-control-select="mode"]');
        if (sel && sel.value !== mode) { sel.value = mode; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      state.zeroDirty = true;
    },
    _turnZero(q, state) {
      const a = Math.atan2(q.y - MM.zero.y, q.x - MM.zero.x);
      state.ohmZero = U.clamp((a + Math.PI) / (Math.PI * 2), 0.04, 0.96);
      state.zeroDirty = true;
    },
    onPointerMove(p, state, view) {
      if (!state._drag) return;
      const q = stagePoint(view, p);
      if (state._drag === 'dial') { this._turnDial(q, state); refreshConnection(state); return; }
      if (state._drag === 'zero') { this._turnZero(q, state); return; }
      if (!state._probe) return;
      const pr = state._probe[state._drag];
      pr.x = U.clamp(q.x, 12, 888);
      pr.y = U.clamp(q.y, 12, 448);
      const t = nearestTerminal(q);
      if (t >= 0) {
        pr.x = PROBE_TERMINALS[t].x; pr.y = PROBE_TERMINALS[t].y; pr.attached = t;
      } else {
        pr.attached = null;
      }
      refreshConnection(state);
    },
    onPointerUp(p, state, view) {
      if (!state._drag) return;
      const drag = state._drag;
      if (drag !== 'dial' && drag !== 'zero') this.onPointerMove(p, state, view);
      state._drag = null;
      refreshConnection(state);
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      view._frame = { s: f.s, ox: f.ox, oy: f.oy, W: f.W, H: f.H };
      const m = this._measure(state);
      const comp = m.comp;
      // instrument body (MF47-style analog multimeter)
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
      C.fillRound(ctx, MM.body.x, MM.body.y, MM.body.w, MM.body.h, 18, '#232936');
      ctx.restore();
      C.fillRound(ctx, MM.body.x + 5, MM.body.y + 5, MM.body.w - 10, MM.body.h - 10, 15, '#eee4d2');
      C.roundRect(ctx, MM.body.x, MM.body.y, MM.body.w, MM.body.h, 18);
      ctx.strokeStyle = 'rgba(160,140,110,.65)'; ctx.lineWidth = 1; ctx.stroke();
      C.label(ctx, 'MF-47', 92, 66, { size: 10, color: 'rgba(70,62,48,.78)', mono: true, weight: 700 });
      C.label(ctx, 'MULTIMETER', 344, 66, { size: 7, align: 'right', color: 'rgba(70,62,48,.48)' });
      // analog face
      C.fillRound(ctx, 88, 76, 260, 132, 10, '#f9f4e8');
      C.roundRect(ctx, 88, 76, 260, 132, 10);
      ctx.strokeStyle = 'rgba(100,88,68,.3)'; ctx.lineWidth = 1; ctx.stroke();
      const ax = 218, ay = 186, ar = 91;
      K.arc(ctx, ax, ay, ar, Math.PI * 1.08, Math.PI * 1.92, 'rgba(52,48,40,.7)', 1.2);
      for (let i = 0; i <= 30; i++) {
        const a = Math.PI * 1.08 + Math.PI * .84 * i / 30;
        const major = i % 5 === 0;
        C.line(ctx, ax + Math.cos(a) * (ar - (major ? 12 : 7)), ay + Math.sin(a) * (ar - (major ? 12 : 7)), ax + Math.cos(a) * ar, ay + Math.sin(a) * ar, major ? 'rgba(40,38,32,.9)' : 'rgba(70,66,56,.45)', major ? 1.1 : .6);
      }
      C.label(ctx, '0', ax - ar + 7, ay + 19, { size: 8, color: 'rgba(50,46,38,.75)', mono: true });
      C.label(ctx, '∞', ax + ar - 11, ay + 19, { size: 10, color: 'rgba(50,46,38,.75)', mono: true });
      C.label(ctx, 'Ω', ax - 23, ay - 27, { size: 9, color: 'rgba(50,46,38,.6)', mono: true });
      const norm = !m.connected ? 0 : (m.overload ? 1 : state.mode === 'resistance' ? Math.min(1, (m.value || 0) / 1000) : state.mode === 'voltage' ? Math.min(1, (m.value || 0) / 3) : Math.min(1, (m.value || 0) / 200));
      const needleA = Math.PI * 1.08 + Math.PI * .84 * norm;
      C.line(ctx, ax, ay, ax + Math.cos(needleA) * (ar - 9), ay + Math.sin(needleA) * (ar - 9), '#c83b2d', 1.7);
      C.dot(ctx, ax, ay, 4.5, '#3c3428');
      C.fillRound(ctx, 236, 156, 104, 40, 4, '#d6dfc2');
      C.label(ctx, m.display, 332, 178, { size: 23, align: 'right', color: '#26301f', mono: true, weight: 600 });
      C.label(ctx, m.unit, 332, 191, { size: 7, align: 'right', color: 'rgba(38,48,30,.62)', mono: true });
      C.label(ctx, state.mode === 'resistance' ? 'Ω' : state.mode === 'voltage' ? 'DCV' : 'DCmA', 242, 170, { size: 7, color: 'rgba(38,48,30,.55)', mono: true });
      // rotary selector
      const cx = MM.dial.x, cy = MM.dial.y, r = MM.dial.r;
      C.dot(ctx, cx, cy, r + 7, 'rgba(22,26,34,.96)');
      C.dot(ctx, cx, cy, r, '#d9d0be');
      K.arc(ctx, cx, cy, r - 4, 0, Math.PI * 2, 'rgba(60,55,45,.5)', 1);
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2;
        C.line(ctx, cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7), cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 'rgba(70,64,52,.42)', .7);
      }
      const dialAngle = MODE_ANGLES[state.mode] || MODE_ANGLES.resistance;
      C.line(ctx, cx, cy, cx + Math.cos(dialAngle) * (r - 12), cy + Math.sin(dialAngle) * (r - 12), '#f4f1e8', 5);
      C.dot(ctx, cx, cy, 15, '#3d434e');
      C.dot(ctx, cx, cy, 8, '#aeb6c2');
      C.label(ctx, 'Ω', cx + Math.cos(MODE_ANGLES.resistance) * (r + 22), cy + Math.sin(MODE_ANGLES.resistance) * (r + 22) + 3, { size: 8, align: 'center', color: 'rgba(230,240,255,.7)', mono: true });
      C.label(ctx, 'V', cx + Math.cos(MODE_ANGLES.voltage) * (r + 22), cy + Math.sin(MODE_ANGLES.voltage) * (r + 22) + 3, { size: 8, align: 'center', color: 'rgba(230,240,255,.7)', mono: true });
      C.label(ctx, 'mA', cx + Math.cos(MODE_ANGLES.current) * (r + 22), cy + Math.sin(MODE_ANGLES.current) * (r + 22) + 3, { size: 8, align: 'center', color: 'rgba(230,240,255,.7)', mono: true });
      C.label(ctx, '挡位选择', cx, cy + r + 11, { size: 7, align: 'center', color: 'rgba(230,240,255,.38)' });
      // ohm-zero knob
      const zx = MM.zero.x, zy = MM.zero.y;
      C.dot(ctx, zx, zy, MM.zero.r, '#d8cfbd');
      C.dot(ctx, zx, zy, MM.zero.r - 4, '#3d434e');
      const za = -Math.PI + state.ohmZero * Math.PI * 2;
      C.line(ctx, zx, zy, zx + Math.cos(za) * (MM.zero.r - 5), zy + Math.sin(za) * (MM.zero.r - 5), '#f4f1e8', 2.5);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        C.line(ctx, zx + Math.cos(a) * (MM.zero.r - 2), zy + Math.sin(a) * (MM.zero.r - 2), zx + Math.cos(a) * (MM.zero.r + 1), zy + Math.sin(a) * (MM.zero.r + 1), 'rgba(30,35,44,.6)', .8);
      }
      C.label(ctx, 'Ω 调零 · 拖动', zx, zy + MM.zero.r + 12, { size: 7, align: 'center', color: 'rgba(230,240,255,.62)' });
      // input jacks
      MM.jacks.forEach((jack, i) => {
        C.dot(ctx, jack.x, jack.y, 11, '#1a202a');
        C.dot(ctx, jack.x, jack.y, 7, i === 0 ? '#d84f43' : '#20242c');
        C.label(ctx, jack.label, jack.x, jack.y + 21, { size: 7, align: 'center', color: 'rgba(230,240,255,.5)' });
      });

      if (!state._probe) resetProbes(state);
      const probes = state._probe;
      // wires behind the component
      ctx.save();
      const drawLead = (jack, probe, color) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(jack.x, jack.y);
        ctx.bezierCurveTo(jack.x + 130, jack.y + 38, probe.x - 90, probe.y + 62, probe.x, probe.y);
        ctx.stroke();
      };
      drawLead(MM.jacks[0], probes.red, '#e05a4f');
      drawLead(MM.jacks[1], probes.black, '#596273');
      ctx.restore();

      // component panel
      C.label(ctx, '待测元件', 630, 104, { size: 8.5, color: 'rgba(230,240,255,.4)' });
      K.panel(ctx, 604, 128, 226, 184, { fill: 'rgba(9,15,26,.58)' });
      PROBE_TERMINALS.forEach((t, i) => {
        const attached = probes.red.attached === i || probes.black.attached === i;
        C.dot(ctx, t.x, t.y, attached ? 8 : 6, attached ? comp.color : 'rgba(230,240,255,.18)');
        C.dot(ctx, t.x, t.y, 2.5, attached ? '#0b0f18' : 'rgba(230,240,255,.4)');
      });
      if (comp.kind === 'resistor') {
        zigzag(ctx, 642, 222, 790, comp.color);
        C.line(ctx, 620, 222, 642, 222, 'rgba(220,235,255,.45)', 1.2);
        C.line(ctx, 790, 222, 812, 222, 'rgba(220,235,255,.45)', 1.2);
        C.label(ctx, comp.value, 716, 252, { size: 13, align: 'center', color: '#ffd166', mono: true });
      } else if (comp.kind === 'battery') {
        batterySymbol(ctx, 716, 222, true, 1.4);
        C.label(ctx, '1.5 V 干电池', 716, 258, { size: 10, align: 'center', color: '#ffd166', mono: true });
      } else {
        K.lamp(ctx, 716, 220, 18, 0.2);
        C.label(ctx, '小灯泡', 716, 256, { size: 10, align: 'center', color: '#ffd166' });
      }
      C.label(ctx, m.note, 716, 286, { size: 7.5, align: 'center', color: m.overload ? '#ff8a80' : (m.connected ? 'rgba(120,220,160,.7)' : 'rgba(255,210,120,.7)') });
      C.label(ctx, comp.label, 716, 338, { size: 9, align: 'center', color: 'rgba(230,240,255,.55)' });
      C.label(ctx, m.connected ? '✓ 已接通，读数稳定' : '拖动表笔到元件两端', 716, 354, { size: 8, align: 'center', color: m.connected ? 'rgba(120,220,160,.8)' : 'rgba(230,240,255,.4)' });
      // probe tips
      ctx.save();
      ctx.shadowBlur = 12;
      [['red', '#e05a4f'], ['black', '#596273']].forEach(([key, color]) => {
        const pr = probes[key];
        ctx.shadowColor = color;
        C.dot(ctx, pr.x, pr.y, key === 'black' ? 9 : 7, key === 'black' ? 'rgba(230,240,255,.22)' : 'rgba(224,90,79,.22)');
        C.dot(ctx, pr.x, pr.y, 7, color);
        C.dot(ctx, pr.x, pr.y, 3, 'rgba(255,255,255,.7)');
        if (pr.attached != null) {
          C.dot(ctx, pr.x, pr.y, 13, 'rgba(255,255,255,.06)');
        }
      });
      ctx.restore();
      if (probes.red.attached == null) C.label(ctx, '红表笔 +', probes.red.x, probes.red.y + 20, { size: 7.5, align: 'center', color: '#ff8a80' });
      if (probes.black.attached == null) C.label(ctx, '黑表笔 COM', probes.black.x, probes.black.y + 20, { size: 7.5, align: 'center', color: 'rgba(230,240,255,.4)' });
      f.restore();
    },
    readouts(state) {
      const m = this._measure(state);
      return [
        K.readout('当前读数', m.display + ' ' + m.unit, ''),
        K.readout('测量功能', state.mode === 'resistance' ? '电阻' : state.mode === 'voltage' ? '直流电压' : '直流电流', ''),
        K.readout('量程', state.range === 'auto' ? '自动' : state.range === 'low' ? '低' : '高', ''),
        K.readout('欧姆调零', state.mode === 'resistance' ? (state._short ? '短接中' : '待调零') : '不适用', ''),
        K.readout('接线状态', m.connected ? '已接通' : '待接线', '')
      ];
    },
    sample(state) {
      const m = this._measure(state);
      return { mode: state.mode, component: m.comp.label, reading: m.overload ? 'OL' : m.display, unit: m.unit, range: state.range, trueValue: m.value, connected: m.connected ? '是' : '否' };
    },
    columns: [
      { key: 'mode', label: '功能', unit: '', decimals: 0 },
      { key: 'component', label: '元件', unit: '', decimals: 0 },
      { key: 'reading', label: '读数', unit: '', decimals: 0 },
      { key: 'unit', label: '单位', unit: '', decimals: 0 },
      { key: 'connected', label: '接线', unit: '', decimals: 0 }
    ],
    plot(state, view) {
      // Ohm scale is nonlinear: show meter current vs external resistance.
      const E = 1.5, Rg = 15, Rmid = 15;
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const R = i / 100 * 1000;
        pts.push({ x: R, y: E / (R + Rg + Rmid) * 1000 });
      }
      return {
        xLabel: '待测电阻 R', yLabel: '表头电流 I', xUnit: 'Ω', yUnit: 'mA',
        xMin: 0, xMax: 1000, yMin: 0, yMax: Math.max(50, E / (Rg + Rmid) * 1000 * 1.1),
        series: [
          K.series(pts, '欧姆挡刻度关系', '#5ca8ff', { width: 2, fill: true })
        ]
      };
    },
    conclusion(state) {
      const m = this._measure(state);
      if (!m.connected) return '<b>接线提示：</b>拖动红色和黑色表笔，让两个笔尖分别接触待测元件的两端；只有两端都接通后，表盘才会显示读数。<br><b>欧姆调零：</b>把两表笔短接在同一接线柱上，转动电表右侧“Ω 调零”旋钮，直到指针指到 0 Ω。';
      return '<b>结论：</b>多用电表通过旋转挡位旋钮切换内部电路。当前 ' + m.comp.label + ' 的读数为 <b>' + m.display + ' ' + m.unit + '</b>。' + (m.overload ? ' ⚠ ' + m.note + '。' : ' 注意：欧姆挡刻度不均匀，换挡后要重新短接表笔调零。');
    }
  });
})();
