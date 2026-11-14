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
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(14,22,38,.9)'; ctx.fill();
    ctx.strokeStyle = 'rgba(160,195,245,.45)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
    C.label(ctx, letter, x, y + 1, { size: r * 0.72, align: 'center', color: color || 'rgba(200,220,255,.8)' });
    if (value != null) C.label(ctx, value, x, y + r + 16, { size: 8.5, align: 'center', color: color || '#64d2ff', mono: true });
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
    hint: '伏安法测 R · 结合长度与直径求 ρ',
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
      meter(ctx, 282, 150, 17, 'A', U.fmt(q.I, 2) + ' A', '#64d2ff');
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
      meter(ctx, 411, 78, 17, 'V', U.fmt(q.Uw, 3) + ' V', '#ffb340');

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
      meter(ctx, 270, 150, 17, 'A', U.fmt(q.I, 2) + ' A', '#64d2ff');
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
      meter(ctx, 414, 78, 17, 'V', U.fmt(state.U, 2) + ' V', '#ffb340');

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

      meter(ctx, 272, 150, 17, 'A', U.fmt(q.I, 3) + ' A', '#64d2ff');
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
      meter(ctx, 117, 68, 16, 'V', U.fmt(q.U, 2) + ' V', '#ffb340');

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
    resistor: { label: '定值电阻', R: 220, V: 0, I: 0.0136, unitR: 'Ω' },
    battery: { label: '干电池', R: null, V: 1.5, I: null, unitR: 'V' },
    lamp: { label: '小灯泡', R: 12, V: 3, I: 0.25, unitR: 'Ω' }
  };

  OL.registerLab({
    id: 'multimeter',
    live: false,
    playable: false,
    hint: '先选功能，再选量程 · 红表笔接“+”，黑表笔接“COM”',
    _measure(state) {
      const comp = COMPONENTS[state.component] || COMPONENTS.resistor;
      let value = 0, unit = '', display = '0', overload = false, note = '';
      if (state.mode === 'resistance') {
        unit = 'Ω';
        if (state.component === 'battery') { display = 'OL'; note = '带电元件不能直接测电阻'; return { display, unit, overload: true, note, comp }; }
        value = comp.R;
        if (state.range === 'low' && value > 200) { display = '1 .'; overload = true; note = '超出低量程，请换高量程'; }
        else display = U.fmt(value, 1);
        note = note || '欧姆挡使用内部电源，测量前需调零';
      } else if (state.mode === 'voltage') {
        unit = 'V';
        value = state.component === 'battery' ? comp.V : 0;
        if (state.range === 'low' && value > 2) { display = '1 .'; overload = true; note = '超出 2 V 量程'; }
        else display = U.fmt(value, 2);
        note = note || '并联接入，红表笔接高电位';
      } else {
        unit = 'mA';
        value = state.component === 'battery' ? 0 : comp.I * 1000;
        if (state.component === 'battery') { display = '—'; note = '不能把电流表直接接在电源两端'; return { display, unit, overload: true, note, comp }; }
        if ((state.range === 'low' && value > 20) || (state.range === 'high' && value > 200)) { display = '1 .'; overload = true; note = '超出量程，请换挡'; }
        else display = U.fmt(value, 1);
        note = note || '串联接入，电流从红表笔流入';
      }
      return { display, unit, value, overload, note, comp };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const m = this._measure(state);
      // body
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
      C.fillRound(ctx, 86, 50, 262, 360, 22, 'rgba(32,40,55,.96)');
      ctx.restore();
      C.roundRect(ctx, 86, 50, 262, 360, 22);
      ctx.strokeStyle = 'rgba(160,190,235,.18)'; ctx.lineWidth = 1; ctx.stroke();
      // LCD
      C.fillRound(ctx, 110, 76, 214, 88, 8, '#c8d8b4');
      C.fillRound(ctx, 110, 76, 214, 88, 8, 'rgba(210,226,180,.92)');
      C.label(ctx, m.display, 316, 132, { size: 34, align: 'right', color: '#24301c', mono: true, weight: 600 });
      C.label(ctx, m.unit, 316, 153, { size: 10, align: 'right', color: 'rgba(36,48,28,.7)', mono: true });
      C.label(ctx, state.mode === 'resistance' ? 'Ω' : state.mode === 'voltage' ? 'DC V' : 'DC mA', 126, 98, { size: 9, color: 'rgba(36,48,28,.65)', mono: true });
      C.label(ctx, state.range === 'auto' ? 'AUTO' : state.range === 'low' ? 'LOW' : 'HIGH', 126, 114, { size: 8, color: 'rgba(36,48,28,.5)', mono: true });
      if (m.overload) C.label(ctx, 'OVER', 308, 98, { size: 8, align: 'right', color: '#a33a2a', mono: true });
      // dial
      const cx = 216, cy = 248, r = 52;
      C.dot(ctx, cx, cy, r + 5, 'rgba(15,21,32,.9)');
      K.arc(ctx, cx, cy, r, 0, Math.PI * 2, 'rgba(180,205,240,.25)', 1);
      for (let i = -4; i <= 4; i++) {
        const a = Math.PI / 2 + i * 0.22;
        C.line(ctx, cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8), cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 'rgba(210,225,245,.32)', 1);
      }
      const dialAngle = state.mode === 'resistance' ? -1.35 : state.mode === 'voltage' ? -0.45 : 0.45;
      C.line(ctx, cx, cy, cx + Math.cos(dialAngle) * (r - 14), cy + Math.sin(dialAngle) * (r - 14), '#ffb340', 2.4);
      C.dot(ctx, cx, cy, 11, 'rgba(48,58,76,1)');
      C.dot(ctx, cx, cy, 5, 'rgba(160,180,210,.4)');
      C.label(ctx, 'Ω', cx - 36, cy - 28, { size: 7, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, 'V', cx - 8, cy - 43, { size: 7, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, 'mA', cx + 23, cy - 34, { size: 7, color: 'rgba(230,240,255,.4)' });
      // jacks
      ['+', 'COM'].forEach((t, i) => {
        const x = 132 + i * 44;
        C.dot(ctx, x, 370, 10, '#1a2231');
        C.dot(ctx, x, 370, 6, i === 0 ? '#e05a4f' : '#252b36');
        C.label(ctx, t, x, 390, { size: 7, align: 'center', color: 'rgba(230,240,255,.38)' });
      });
      // probes
      const jack = [132, 370], compX = 674, compY = 250;
      ctx.save();
      ctx.strokeStyle = '#e05a4f'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(jack[0], jack[1]); ctx.bezierCurveTo(300, 430, 560, 390, compX - 28, compY - 12); ctx.stroke();
      ctx.strokeStyle = '#2a2e36'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(jack[0] + 44, jack[1]); ctx.bezierCurveTo(340, 450, 600, 410, compX + 26, compY + 12); ctx.stroke();
      ctx.restore();

      // component
      C.label(ctx, '待测元件', 630, 104, { size: 8.5, color: 'rgba(230,240,255,.4)' });
      K.panel(ctx, 604, 128, 226, 184, { fill: 'rgba(9,15,26,.58)' });
      if (state.component === 'resistor') {
        zigzag(ctx, 642, 222, 790, 'rgba(255,179,64,.8)');
        C.line(ctx, 620, 222, 642, 222, 'rgba(220,235,255,.45)', 1.2);
        C.line(ctx, 790, 222, 812, 222, 'rgba(220,235,255,.45)', 1.2);
        C.label(ctx, '220 Ω', 716, 248, { size: 12, align: 'center', color: '#ffd166', mono: true });
      } else if (state.component === 'battery') {
        batterySymbol(ctx, 716, 222, true, 1.4);
        C.label(ctx, '1.5 V 干电池', 716, 258, { size: 10, align: 'center', color: '#ffd166', mono: true });
      } else {
        K.lamp(ctx, 716, 220, 18, 0.2);
        C.label(ctx, '小灯泡', 716, 256, { size: 10, align: 'center', color: '#ffd166' });
      }
      C.label(ctx, m.note, 716, 286, { size: 7.5, align: 'center', color: m.overload ? '#ff8a80' : 'rgba(230,240,255,.32)' });
      C.label(ctx, '红表笔 +', 620, 342, { size: 7.5, color: '#ff8a80' });
      C.label(ctx, '黑表笔 COM', 734, 342, { size: 7.5, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, m.comp.label, 716, 372, { size: 9, align: 'center', color: 'rgba(230,240,255,.5)' });
      f.restore();
    },
    readouts(state) {
      const m = this._measure(state);
      return [
        K.readout('当前读数', m.display + ' ' + m.unit, ''),
        K.readout('测量功能', state.mode === 'resistance' ? '电阻' : state.mode === 'voltage' ? '直流电压' : '直流电流', ''),
        K.readout('量程', state.range === 'auto' ? '自动' : state.range === 'low' ? '低' : '高', ''),
        K.readout('表笔接法', state.mode === 'current' ? '串联' : state.mode === 'voltage' ? '并联' : '断电源', '')
      ];
    },
    sample(state) {
      const m = this._measure(state);
      return { mode: state.mode, component: m.comp.label, reading: m.overload ? 'OL' : m.display, unit: m.unit, range: state.range, trueValue: m.value };
    },
    columns: [
      { key: 'mode', label: '功能', unit: '', decimals: 0 },
      { key: 'component', label: '元件', unit: '', decimals: 0 },
      { key: 'reading', label: '读数', unit: '', decimals: 0 },
      { key: 'unit', label: '单位', unit: '', decimals: 0 }
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
      return '<b>结论：</b>多用电表通过切换内部电路实现不同测量。当前 ' + m.comp.label + ' 的读数为 <b>' + m.display + ' ' + m.unit + '</b>。' + (m.overload ? ' ⚠ ' + m.note + '。' : ' 注意：欧姆挡刻度不均匀，换挡后要重新调零。');
    }
  });
})();
