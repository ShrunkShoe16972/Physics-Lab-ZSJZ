/* ============================================================
   Mechanics labs 01–05
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const C = OL.canvas;
  const K = OL.labKit;
  const U = OL.utils;
  const P = OL.palette;

  /* ------------------------------------------------------------
     01 · 研究匀变速直线运动
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'accelerated-motion',
    live: true,
    playable: true,
    hint: '播放后自动采样 · 空格暂停',
    init(state) { state._tMax = 2.4; },
    step(state, dt, view) {
      view.t = Math.min(state._tMax, view.t + dt * 0.55);
      if (view.t >= state._tMax - 0.001) view.playing = false;
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const t = Math.min(view.t, 2.4);
      const v0 = state.v0, a = state.a;
      const tMax = 2.4;
      const distMax = Math.max(0.4, v0 * tMax + 0.5 * a * tMax * tMax);
      const trackY = 352, x0 = 74, trackW = 760;
      const pxPerM = Math.min(76, trackW / distMax);
      const dist = v0 * t + 0.5 * a * t * t;
      const carX = x0 + dist * pxPerM;

      // paper tape
      K.panel(ctx, 44, 38, 520, 128, { fill: 'rgba(10,16,28,.52)' });
      C.label(ctx, '打点计时器纸带', 58, 57, { size: 9.5, color: 'rgba(230,240,255,.46)' });
      C.label(ctx, '每 0.12 s 打一个点', 550, 57, { size: 8, align: 'right', color: 'rgba(230,240,255,.27)' });
      C.fillRound(ctx, 58, 78, 492, 38, 7, 'rgba(235,242,255,.1)');
      C.line(ctx, 58, 78, 550, 78, 'rgba(255,255,255,.13)', 1);
      C.line(ctx, 58, 116, 550, 116, 'rgba(255,255,255,.13)', 1);
      const tapeScale = 480 / distMax;
      const dtDot = 0.12;
      const nDots = Math.floor(t / dtDot + 0.0001);
      for (let i = 0; i <= nDots; i++) {
        const td = i * dtDot;
        const xd = 68 + (v0 * td + 0.5 * a * td * td) * tapeScale;
        if (xd > 544) continue;
        C.line(ctx, xd, 88, xd, 108, 'rgba(255,255,255,.12)', 1);
        C.dot(ctx, xd, 98, 1.9, i === nDots ? '#64d2ff' : 'rgba(220,235,255,.62)', i === nDots ? 7 : 0);
      }
      const xEnd = 68 + dist * tapeScale;
      if (t > 0.1) {
        C.line(ctx, 68, 132, Math.min(xEnd, 540), 132, 'rgba(92,168,255,.42)', 1, [3, 3]);
        C.label(ctx, '位移 ' + U.fmt(dist, 2) + ' m', 68, 148, { size: 8.5, color: 'rgba(150,195,255,.64)', mono: true });
      }

      // live mini graph
      const pts = [];
      for (let i = 0; i <= 50; i++) {
        const tt = t * i / 50;
        pts.push({ x: tt, y: v0 + a * tt });
      }
      K.miniPlot(ctx, 600, 38, 254, 158, pts.length > 1 ? pts : [{ x: 0, y: v0 }, { x: 0.01, y: v0 }], '#64a8ff', { title: '实时 v–t 图像', xLabel: 't / s' });

      // track
      K.panel(ctx, 38, 188, 824, 205, { fill: 'rgba(8,14,24,.4)', stroke: 'rgba(255,255,255,.06)' });
      C.floorLine(ctx, 48, 852, trackY, 'rgba(160,190,240,.34)');
      for (let m = 0; m <= Math.ceil(distMax); m++) {
        const mx = x0 + m * pxPerM;
        if (mx > 830) break;
        C.line(ctx, mx, trackY - 4, mx, trackY + 6, 'rgba(190,215,255,.25)', 1);
        C.label(ctx, m + ' m', mx, trackY + 20, { size: 7.5, align: 'center', color: 'rgba(190,215,255,.3)', mono: true });
      }
      K.car(ctx, carX + 10, trackY - 8, 0.72);
      // motion marks behind car
      for (let i = 1; i <= 5; i++) {
        const tx = carX - i * 20;
        if (tx > x0) C.line(ctx, tx, trackY - 12, tx + 8, trackY - 12, 'rgba(100,180,255,' + (0.2 - i * 0.03) + ')', 1.5);
      }
      // acceleration / velocity vector
      const vNow = v0 + a * t;
      C.arrow(ctx, carX + 44, trackY - 55, carX + 44 + Math.min(100, vNow * 14), trackY - 55, { color: '#64d2ff', width: 2, glow: 7 });
      C.label(ctx, 'v', carX + 48 + Math.min(100, vNow * 14), trackY - 58, { size: 9, color: '#64d2ff', mono: true });
      C.arrow(ctx, carX + 8, trackY - 76, carX + 8 + Math.min(70, a * 18), trackY - 76, { color: '#ffb340', width: 1.7 });
      C.label(ctx, 'a', carX + 10 + Math.min(70, a * 18), trackY - 80, { size: 8.5, color: '#ffb340', mono: true });

      // speed gauge
      const gx = 106, gy = 252, gr = 45;
      ctx.save();
      ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.07)';
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.82, Math.PI * 2.18); ctx.stroke();
      const vMax = Math.max(2, v0 + a * tMax);
      const frac = U.clamp(vNow / vMax, 0, 1);
      ctx.strokeStyle = '#5ca8ff'; ctx.shadowColor = '#5ca8ff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.82, Math.PI * (0.82 + frac * 1.36)); ctx.stroke();
      ctx.restore();
      C.label(ctx, U.fmt(vNow, 2), gx, gy + 2, { size: 19, weight: 600, color: '#eef4ff', align: 'center' });
      C.label(ctx, 'm/s', gx, gy + 16, { size: 7.5, color: P.dim, align: 'center' });
      C.label(ctx, '瞬时速度', gx, gy + 50, { size: 8, color: 'rgba(230,240,255,.35)', align: 'center' });
      C.label(ctx, 't = ' + U.fmt(t, 2) + ' s', 74, 202, { size: 8.5, color: 'rgba(230,240,255,.38)', mono: true });

      f.restore();
    },
    readouts(state, view) {
      const t = Math.min(view.t, 2.4);
      return [
        K.readout('时间 t', U.fmt(t, 2), 's'),
        K.readout('速度 v', U.fmt(state.v0 + state.a * t, 2), 'm/s'),
        K.readout('位移 x', U.fmt(state.v0 * t + 0.5 * state.a * t * t, 2), 'm'),
        K.readout('加速度 a', U.fmt(state.a, 1), 'm/s²')
      ];
    },
    sample(state, view) {
      const t = Math.min(view.t, 2.4);
      return { t, x: state.v0 * t + 0.5 * state.a * t * t, v: state.v0 + state.a * t, a: state.a };
    },
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 2 },
      { key: 'x', label: 'x', unit: 'm', decimals: 3 },
      { key: 'v', label: 'v', unit: 'm/s', decimals: 2 }
    ],
    plot(state, view) {
      const vmax = Math.max(1, state.v0 + state.a * 2.4);
      const line = [];
      for (let i = 0; i <= 70; i++) {
        const t = i / 70 * 2.4;
        line.push({ x: t, y: state.v0 + state.a * t });
      }
      return {
        xLabel: '时间 t', yLabel: '速度 v', xUnit: 's', yUnit: 'm·s⁻¹',
        xMin: 0, xMax: 2.4, yMin: 0, yMax: vmax * 1.15,
        series: [
          K.series(line, '理论 v–t', '#5ca8ff', { width: 2, fill: true }),
          K.scatter(view.records, 't', 'v', '测量点', '#64d2ff', { pointSize: 2.4 })
        ]
      };
    },
    conclusion(state, view) {
      const n = view.records.length;
      return n < 2
        ? '<b>提示：</b>播放实验，让系统自动采集 v–t 数据，观察图线是否为一条直线。'
        : '<b>结论：</b>v–t 图像是一条斜率恒定的直线，说明速度随时间均匀变化。图线斜率 ≈ ' + U.fmt(state.a, 2) + ' m/s²，与设定的加速度一致。';
    }
  });

  /* ------------------------------------------------------------
     02 · 探究弹力与弹簧伸长量的关系
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'hooke-law',
    live: false,
    playable: false,
    hint: '改变钩码质量 · 采集多组 F–x 数据',
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const mG = state.m, k = state.k;
      const F = mG / 1000 * 9.8;
      const extCm = F / k * 100;
      const extPx = extCm * 5.2;
      const topY = 66, natural = 148;
      const massY = topY + natural + extPx;

      // stand
      C.fillRound(ctx, 92, 400, 240, 12, 6, 'rgba(180,200,230,.18)');
      C.line(ctx, 112, 400, 112, 60, 'rgba(195,215,245,.45)', 5);
      C.line(ctx, 112, 64, 390, 64, 'rgba(195,215,245,.45)', 5);
      C.line(ctx, 112, 68, 390, 68, 'rgba(255,255,255,.13)', 1);
      C.line(ctx, 330, 64, 330, topY, 'rgba(230,240,255,.7)', 2);
      // spring
      C.spring(ctx, 330, topY, 330, topY + natural + extPx, 9, 13, '#9cc8ff');
      C.line(ctx, 322, topY + natural, 338, topY + natural, 'rgba(255,255,255,.24)', 1);
      C.label(ctx, '原长', 346, topY + natural + 3, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      // hanger
      C.line(ctx, 330, massY, 330, massY + 14, 'rgba(220,235,255,.65)', 1.5);
      C.fillRound(ctx, 306, massY + 14, 48, 14, 4, 'rgba(185,205,235,.8)');
      const weights = Math.max(1, Math.round(state.m / 100));
      for (let i = 0; i < Math.min(weights, 5); i++) {
        C.fillRound(ctx, 300 - i * 2, massY + 28 + i * 7, 60 + i * 4, 6, 3, 'rgba(220,230,245,' + (0.72 - i * 0.07) + ')');
      }
      C.arrow(ctx, 380, massY + 18, 380, massY + 18 + Math.min(110, F * 18), { color: '#ffb340', width: 2, glow: 6 });
      C.label(ctx, 'F = ' + U.fmt(F, 2) + ' N', 388, massY + 24 + Math.min(110, F * 18), { size: 8.5, color: '#ffb340', mono: true });

      // ruler
      const rx = 500, ry = 92, rh = 300;
      C.fillRound(ctx, rx, ry, 30, rh, 5, 'rgba(235,242,255,.08)');
      for (let c = 0; c <= 50; c++) {
        const y = ry + c * 5.6;
        if (y > ry + rh) break;
        const major = c % 5 === 0;
        C.line(ctx, rx, y, rx + (major ? 16 : 8), y, 'rgba(220,235,255,.42)', major ? 1 : 0.6);
        if (major) C.label(ctx, c, rx + 34, y + 3, { size: 7, color: 'rgba(220,235,255,.35)', mono: true });
      }
      C.label(ctx, 'cm', rx + 8, ry - 8, { size: 8, color: 'rgba(220,235,255,.4)' });
      C.line(ctx, rx - 2, topY + natural, rx + 22, topY + natural, 'rgba(100,210,255,.7)', 1);
      C.line(ctx, rx - 2, massY, rx + 22, massY, 'rgba(100,210,255,.7)', 1);
      C.line(ctx, rx - 8, topY + natural, rx - 8, massY, 'rgba(100,210,255,.4)', 1, [3, 3]);
      C.label(ctx, 'x = ' + U.fmt(extCm, 1) + ' cm', rx - 13, (topY + natural + massY) / 2, { size: 8, align: 'right', color: '#64d2ff', mono: true });

      // mini F-x
      const pts = [];
      for (let i = 0; i <= 50; i++) {
        const xcm = extCm * i / 50;
        pts.push({ x: xcm, y: k * xcm / 100 });
      }
      pts.push({ x: extCm, y: F });
      K.miniPlot(ctx, 610, 54, 238, 152, [{ x: 0, y: 0 }, { x: extCm, y: F }], '#ffb340', { title: 'F–x 关系', xLabel: 'x / cm' });

      // note
      C.label(ctx, '胡克定律：F = kx', 610, 236, { size: 10, color: 'rgba(230,240,255,.5)', mono: false });
      C.label(ctx, '斜率 = 劲度系数 k', 610, 253, { size: 8, color: 'rgba(230,240,255,.28)' });
      f.restore();
    },
    readouts(state) {
      const F = state.m / 1000 * 9.8;
      return [
        K.readout('钩码重力 F', U.fmt(F, 2), 'N'),
        K.readout('伸长量 x', U.fmt(F / state.k * 100, 1), 'cm'),
        K.readout('劲度系数 k', U.fmt(state.k, 0), 'N/m'),
        K.readout('钩码质量 m', U.fmt(state.m, 0), 'g')
      ];
    },
    sample(state) {
      const F = state.m / 1000 * 9.8;
      return { m: state.m, F, x: F / state.k * 100, k: state.k };
    },
    columns: [
      { key: 'm', label: 'm', unit: 'g', decimals: 0 },
      { key: 'F', label: 'F', unit: 'N', decimals: 3 },
      { key: 'x', label: 'x', unit: 'cm', decimals: 2 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const x = i / 60 * 22;
        pts.push({ x, y: state.k * x / 100 });
      }
      return {
        xLabel: '伸长量 x', yLabel: '弹力 F', xUnit: 'cm', yUnit: 'N',
        xMin: 0, xMax: 22, yMin: 0,
        series: [
          K.series(pts, '理论 F = kx', '#ffb340', { width: 1.8, dash: [5, 4] }),
          K.scatter(view.records, 'x', 'F', '测量点', '#ffd166', { pointSize: 4 })
        ]
      };
    },
    conclusion(state, view) {
      const n = view.records.length;
      if (n < 2) return '<b>提示：</b>改变钩码质量并采集至少 3 组数据，观察 F–x 图线是否过原点。';
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      view.records.forEach((r) => { const x = r.x / 100; sx += x; sy += r.F; sxx += x * x; sxy += x * r.F; });
      const kFit = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      return '<b>结论：</b>F–x 图线是一条过原点的直线，说明弹力与伸长量成正比。由斜率求得 k ≈ <b>' + U.fmt(kFit, 1) + ' N/m</b>，与弹簧标称值 ' + state.k + ' N/m 接近。';
    }
  });

  /* ------------------------------------------------------------
     03 · 验证力的平行四边形定则
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'force-parallelogram',
    live: false,
    playable: false,
    hint: '改变分力与夹角 · 观察合力对角线',
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 36 });
      const f = K.frame(ctx, w, h);
      const ox = 322, oy = 352, sc = 29;
      const th = U.deg(state.angle);
      const x1 = state.f1, x2 = state.f2 * Math.cos(th), y2 = state.f2 * Math.sin(th);
      const p1 = { x: ox + x1 * sc, y: oy };
      const p2 = { x: ox + state.f2 * Math.cos(th) * sc, y: oy - state.f2 * Math.sin(th) * sc };
      const pr = { x: ox + (x1 + x2) * sc, y: oy - y2 * sc };
      const F = Math.sqrt(state.f1 * state.f1 + state.f2 * state.f2 + 2 * state.f1 * state.f2 * Math.cos(th));
      const alpha = U.rad(Math.atan2(state.f2 * Math.sin(th), state.f1 + state.f2 * Math.cos(th)));

      // faint grid lines
      for (let i = 1; i <= 10; i++) {
        C.line(ctx, ox + i * sc, 54, ox + i * sc, 410, 'rgba(255,255,255,.032)', 1);
        C.line(ctx, 62, oy - i * sc, 840, oy - i * sc, 'rgba(255,255,255,.032)', 1);
      }
      // parallelogram
      C.line(ctx, p1.x, p1.y, pr.x, pr.y, 'rgba(190,205,255,.36)', 1, [5, 5]);
      C.line(ctx, p2.x, p2.y, pr.x, pr.y, 'rgba(190,205,255,.36)', 1, [5, 5]);
      // angle arc
      K.arc(ctx, ox, oy, 58, -th, 0, 'rgba(255,179,64,.55)', 1.2);
      C.label(ctx, 'θ = ' + state.angle + '°', ox + 63, oy - 34, { size: 8.5, color: '#ffb340', mono: true });

      // vectors
      C.arrow(ctx, ox, oy, p1.x, p1.y, { color: '#ffb340', width: 2.8, head: 11, glow: 7 });
      C.arrow(ctx, ox, oy, p2.x, p2.y, { color: '#30d158', width: 2.8, head: 11, glow: 7 });
      C.arrow(ctx, ox, oy, pr.x, pr.y, { color: '#7aa8ff', width: 3.4, head: 13, glow: 12 });
      C.dot(ctx, ox, oy, 4.2, '#fff', 9);

      // labels
      C.label(ctx, 'F₁ = ' + U.fmt(state.f1, 1) + ' N', p1.x + 10, p1.y + 17, { size: 9, color: '#ffb340', mono: true });
      C.label(ctx, 'F₂ = ' + U.fmt(state.f2, 1) + ' N', p2.x - 7, p2.y - 10, { size: 9, color: '#30d158', align: 'right', mono: true });
      C.label(ctx, 'F合 = ' + U.fmt(F, 2) + ' N', pr.x + 11, pr.y - 4, { size: 10.5, color: '#9ec1ff', mono: true, weight: 600 });
      C.label(ctx, 'O', ox - 3, oy + 19, { size: 9, color: 'rgba(230,240,255,.55)' });

      // resultant angle
      C.arrow(ctx, 78, 76, 78, 106, { color: 'rgba(255,255,255,.25)', width: 1, head: 4 });
      C.label(ctx, '合力方向 α = ' + U.fmt(alpha, 1) + '°', 88, 96, { size: 8.5, color: 'rgba(230,240,255,.38)', mono: true });

      // formula panel
      K.panel(ctx, 598, 54, 246, 126, { fill: 'rgba(10,16,28,.62)' });
      C.label(ctx, '余弦定理', 614, 76, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, 'F² = F₁² + F₂²', 614, 100, { size: 11, color: 'rgba(238,244,255,.8)', mono: true });
      C.label(ctx, '+ 2F₁F₂ cos θ', 614, 119, { size: 11, color: 'rgba(238,244,255,.8)', mono: true });
      C.label(ctx, 'θ 越大，合力越小', 614, 148, { size: 8, color: 'rgba(150,195,255,.55)' });
      C.label(ctx, 'θ = 180° 时 F = |F₁ − F₂|', 614, 166, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      f.restore();
    },
    readouts(state) {
      const th = U.deg(state.angle);
      const F = Math.sqrt(state.f1 * state.f1 + state.f2 * state.f2 + 2 * state.f1 * state.f2 * Math.cos(th));
      return [
        K.readout('合力 F', U.fmt(F, 2), 'N'),
        K.readout('分力 F₁', U.fmt(state.f1, 1), 'N'),
        K.readout('分力 F₂', U.fmt(state.f2, 1), 'N'),
        K.readout('夹角 θ', state.angle, '°')
      ];
    },
    sample(state) {
      const th = U.deg(state.angle);
      const F = Math.sqrt(state.f1 * state.f1 + state.f2 * state.f2 + 2 * state.f1 * state.f2 * Math.cos(th));
      return { angle: state.angle, F, f1: state.f1, f2: state.f2 };
    },
    columns: [
      { key: 'angle', label: 'θ', unit: '°', decimals: 0 },
      { key: 'f1', label: 'F₁', unit: 'N', decimals: 1 },
      { key: 'f2', label: 'F₂', unit: 'N', decimals: 1 },
      { key: 'F', label: 'F合', unit: 'N', decimals: 2 }
    ],
    plot(state, view) {
      const pts = [];
      for (let a = 20; a <= 160; a += 2) {
        const th = U.deg(a);
        pts.push({ x: a, y: Math.sqrt(state.f1 * state.f1 + state.f2 * state.f2 + 2 * state.f1 * state.f2 * Math.cos(th)) });
      }
      return {
        xLabel: '夹角 θ', yLabel: '合力 F', xUnit: '°', yUnit: 'N',
        xMin: 20, xMax: 160, yMin: 0,
        series: [
          K.series(pts, '理论合力', '#5ca8ff', { width: 2, fill: true }),
          K.scatter(view.records, 'angle', 'F', '测量点', '#9ec1ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      return '<b>结论：</b>以 F₁、F₂ 为邻边作平行四边形，其对角线长度与方向即为合力。当前 F₁ = ' + U.fmt(state.f1, 1) + ' N、F₂ = ' + U.fmt(state.f2, 1) + ' N、θ = ' + state.angle + '° 时，合力约为 <b>' + U.fmt(Math.sqrt(state.f1 * state.f1 + state.f2 * state.f2 + 2 * state.f1 * state.f2 * Math.cos(U.deg(state.angle))), 2) + ' N</b>。';
    }
  });

  /* ------------------------------------------------------------
     04 · 探究加速度与力、质量的关系
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'newton-second',
    live: false,
    playable: true,
    hint: '控制变量 · 记录 a–F 或 a–1/m',
    step(state, dt, view) {
      view.t += dt;
      if (view.t > 2.6) view.t = 0;
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const net = Math.max(0, state.force - state.friction);
      const a = net / state.mass;
      const dist = Math.min(520, 0.5 * a * view.t * view.t * 42);
      const trackY = 350, x0 = 92;
      const cartX = x0 + dist;

      K.panel(ctx, 40, 44, 826, 180, { fill: 'rgba(9,15,26,.46)', stroke: 'rgba(255,255,255,.06)' });
      C.label(ctx, '控制变量法', 58, 67, { size: 9.5, color: 'rgba(230,240,255,.4)' });
      C.label(ctx, '保持质量不变，研究 a 与 F 的关系；再保持 F 不变，研究 a 与 m 的关系。', 58, 86, { size: 8.5, color: 'rgba(230,240,255,.26)' });

      // equation card
      K.panel(ctx, 560, 56, 286, 150, { fill: 'rgba(10,17,30,.62)' });
      C.label(ctx, 'a = (F − f) / m', 580, 93, { size: 19, color: '#eef4ff', weight: 600, mono: true });
      C.label(ctx, '合外力', 580, 124, { size: 8, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, '质量', 700, 124, { size: 8, color: 'rgba(230,240,255,.32)' });
      C.arrow(ctx, 580, 140, 580 + U.clamp(a * 34, 0, 230), 140, { color: '#5ca8ff', width: 1.6 });
      C.label(ctx, U.fmt(a, 2) + ' m/s²', 580, 162, { size: 9, color: '#64d2ff', mono: true });
      if (net <= 0.001) {
        C.label(ctx, '拉力不足以克服摩擦，小车保持静止', 320, 210, { size: 8.5, color: '#ff8a80', align: 'center' });
      }

      // track + pulley
      C.floorLine(ctx, 50, 860, trackY, 'rgba(160,190,240,.3)');
      C.line(ctx, 58, trackY, 820, trackY, 'rgba(160,190,240,.22)', 5);
      C.line(ctx, 58, trackY - 2, 820, trackY - 2, 'rgba(255,255,255,.12)', 1);
      K.car(ctx, cartX + 8, trackY - 8, 0.76);
      // rope
      C.line(ctx, cartX + 44, trackY - 30, 748, trackY - 28, 'rgba(230,238,250,.55)', 1.2);
      ctx.save();
      ctx.beginPath(); ctx.arc(758, trackY - 28, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(200,218,240,.16)'; ctx.fill();
      ctx.strokeStyle = 'rgba(220,235,255,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
      C.line(ctx, 758, trackY - 14, 758, 300, 'rgba(230,238,250,.5)', 1.1);
      C.fillRound(ctx, 744, 300, 28, 27, 4, 'rgba(190,208,235,.72)');
      C.label(ctx, U.fmt(state.force, 2) + ' N', 782, 318, { size: 8.5, color: '#ffb340', mono: true });
      // force arrows
      C.arrow(ctx, cartX + 42, trackY - 50, cartX + 42 + Math.min(82, state.force * 24), trackY - 50, { color: '#ffb340', width: 2.2, glow: 6 });
      C.label(ctx, 'F', cartX + 46 + Math.min(82, state.force * 24), trackY - 54, { size: 9, color: '#ffb340', mono: true });
      if (state.friction > 0) {
        C.arrow(ctx, cartX - 42, trackY - 50, cartX - 42 - Math.min(55, state.friction * 80), trackY - 50, { color: '#ff6961', width: 1.4, head: 6 });
        C.label(ctx, 'f', cartX - 47 - Math.min(55, state.friction * 80), trackY - 54, { size: 8, color: '#ff6961', mono: true });
      }
      // stopwatch
      C.label(ctx, 't = ' + U.fmt(view.t, 2) + ' s', 86, 226, { size: 9, color: 'rgba(230,240,255,.45)', mono: true });
      C.label(ctx, 'v = ' + U.fmt(a * view.t, 2) + ' m/s', 86, 243, { size: 9, color: '#64d2ff', mono: true });
      f.restore();
    },
    readouts(state, view) {
      const net = Math.max(0, state.force - state.friction);
      const a = net / state.mass;
      return [
        K.readout('加速度 a', U.fmt(a, 2), 'm/s²'),
        K.readout('合外力 F合', U.fmt(net, 2), 'N'),
        K.readout('速度 v', U.fmt(a * Math.min(view.t, 2.6), 2), 'm/s'),
        K.readout('质量 m', U.fmt(state.mass, 2), 'kg')
      ];
    },
    sample(state) {
      const net = Math.max(0, state.force - state.friction);
      return { F: state.force, m: state.mass, invM: 1 / state.mass, a: net / state.mass };
    },
    columns: [
      { key: 'F', label: 'F', unit: 'N', decimals: 2 },
      { key: 'm', label: 'm', unit: 'kg', decimals: 2 },
      { key: 'a', label: 'a', unit: 'm/s²', decimals: 3 }
    ],
    plot(state, view) {
      if (state.chartMode === 'aM') {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const inv = 0.5 + i / 60 * 4.5;
          pts.push({ x: inv, y: Math.max(0, (state.force - state.friction) * inv) });
        }
        return {
          xLabel: '1/m', yLabel: '加速度 a', xUnit: 'kg⁻¹', yUnit: 'm/s²',
          xMin: 0, xMax: 5, yMin: 0,
          series: [
            K.series(pts, '理论 a–1/m', '#5ca8ff', { width: 2 }),
            K.scatter(view.records, 'invM', 'a', '测量点', '#64d2ff', { pointSize: 4 })
          ]
        };
      }
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const F = i / 60 * 3;
        pts.push({ x: F, y: Math.max(0, (F - state.friction) / state.mass) });
      }
      return {
        xLabel: '合外力 F', yLabel: '加速度 a', xUnit: 'N', yUnit: 'm/s²',
        xMin: 0, xMax: 3, yMin: 0,
        series: [
          K.series(pts, '理论 a–F', '#5ca8ff', { width: 2 }),
          K.scatter(view.records, 'F', 'a', '测量点', '#64d2ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const a = Math.max(0, state.force - state.friction) / state.mass;
      return '<b>结论：</b>质量一定时，a–F 图线是一条直线，说明加速度与合外力成正比；力一定时，a–1/m 图线也是直线，说明加速度与质量成反比。当前 a = <b>' + U.fmt(a, 2) + ' m/s²</b>。';
    }
  });

  /* ------------------------------------------------------------
     05 · 研究平抛运动
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'projectile',
    live: true,
    playable: true,
    hint: '播放后观察频闪轨迹 · 分解两个分运动',
    init(state) { state._t = 0; },
    step(state, dt, view) {
      const tf = Math.sqrt(2 * state.h / state.g);
      view.t = Math.min(tf, view.t + dt * 0.5);
      if (view.t >= tf - 0.0005) view.playing = false;
    },
    draw(ctx, w, h, state, view) {
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#101b31'); sky.addColorStop(0.62, '#0b1322'); sky.addColorStop(1, '#0a0e18');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      C.grid(ctx, w, h, { step: 40, vignette: false });
      const f = K.frame(ctx, w, h);
      const tf = Math.sqrt(2 * state.h / state.g);
      const range = state.v0 * tf;
      const x0 = 116, topY = 96;
      const sc = Math.max(14, Math.min(120, 600 / Math.max(range, 0.5), 286 / state.h));
      const groundY = topY + state.h * sc;
      const t = Math.min(view.t, tf);
      const ballX = x0 + state.v0 * t * sc;
      const ballY = topY + 0.5 * state.g * t * t * sc;
      const sx = state.v0 * t, sy = 0.5 * state.g * t * t;

      // ground / platform
      C.line(ctx, 50, groundY, 856, groundY, 'rgba(170,200,245,.45)', 1.4);
      for (let i = 0; i < 22; i++) C.line(ctx, 55 + i * 37, groundY, 47 + i * 37, groundY + 10, 'rgba(170,200,245,.12)', 1);
      C.fillRound(ctx, x0 - 56, topY - 8, 70, 10, 3, 'rgba(190,210,240,.7)');
      C.fillRound(ctx, x0 - 50, topY, 10, 20, 2, 'rgba(150,175,210,.4)');
      C.label(ctx, 'v₀', x0 - 71, topY - 16, { size: 9.5, color: '#64d2ff', mono: true });

      // ideal trajectory
      const traj = [];
      for (let i = 0; i <= 120; i++) {
        const tt = tf * i / 120;
        traj.push([x0 + state.v0 * tt * sc, topY + 0.5 * state.g * tt * tt * sc]);
      }
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(150,195,255,.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      traj.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
      ctx.stroke(); ctx.restore();

      // stroboscopic dots + velocity arrows
      const stepT = 0.12;
      const count = Math.floor(t / stepT);
      for (let i = 0; i <= count; i++) {
        const tt = i * stepT;
        const px = x0 + state.v0 * tt * sc;
        const py = topY + 0.5 * state.g * tt * tt * sc;
        C.dot(ctx, px, py, 2.4, 'rgba(100,210,255,.35)');
        if (i % 3 === 0 && i > 0) {
          C.line(ctx, px, py, px, py + 8, 'rgba(100,210,255,.2)', 1);
          C.line(ctx, px, py, px + 8, py, 'rgba(100,210,255,.2)', 1);
        }
      }
      // current ball
      C.glowCircle(ctx, ballX, ballY, 30, '#5ca8ff', 0.35);
      C.ball(ctx, ballX, ballY, 9, ['#ffffff', '#a9d3ff', '#2b6fd3']);
      // velocity components
      const vx = state.v0, vy = state.g * t;
      const vs = 8;
      C.arrow(ctx, ballX, ballY, ballX + Math.min(110, vx * vs), ballY, { color: '#64d2ff', width: 2, head: 7 });
      C.arrow(ctx, ballX, ballY, ballX, ballY + Math.min(100, vy * vs), { color: '#ffb340', width: 2, head: 7 });
      const vlen = Math.min(140, Math.hypot(vx, vy) * vs);
      C.arrow(ctx, ballX, ballY, ballX + vlen * vx / Math.hypot(vx, vy || 1), ballY + vlen * vy / Math.hypot(vx, vy || 1), { color: '#bf8bff', width: 1.2, head: 5, glow: 4 });
      C.label(ctx, 'vₓ', ballX + 8 + Math.min(110, vx * vs), ballY - 4, { size: 8.5, color: '#64d2ff', mono: true });
      C.label(ctx, 'v_y', ballX + 7, ballY + Math.min(100, vy * vs), { size: 8.5, color: '#ffb340', mono: true });

      // dimensions
      C.line(ctx, 66, topY, 66, groundY, 'rgba(230,240,255,.22)', 1, [4, 4]);
      C.line(ctx, 60, topY, 72, topY, 'rgba(230,240,255,.38)', 1);
      C.line(ctx, 60, groundY, 72, groundY, 'rgba(230,240,255,.38)', 1);
      C.label(ctx, 'h = ' + U.fmt(state.h, 1) + ' m', 58, (topY + groundY) / 2, { size: 8, align: 'right', color: 'rgba(230,240,255,.44)', mono: true });
      C.line(ctx, x0, groundY + 26, x0 + range * sc, groundY + 26, 'rgba(100,210,255,.3)', 1);
      C.label(ctx, '射程 x = ' + U.fmt(range, 2) + ' m', x0 + range * sc, groundY + 41, { size: 8, align: 'right', color: 'rgba(100,210,255,.6)', mono: true });

      // info card
      K.panel(ctx, 640, 52, 208, 102, { fill: 'rgba(10,17,30,.58)' });
      C.label(ctx, '飞行时间', 654, 73, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(tf, 2) + ' s', 654, 93, { size: 15, color: '#eef4ff', mono: true });
      C.label(ctx, '水平位移', 750, 73, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(range, 1) + ' m', 750, 93, { size: 15, color: '#64d2ff', mono: true });
      C.label(ctx, 'x = v₀t ， y = ½gt²', 654, 126, { size: 8.5, color: 'rgba(190,210,255,.45)', mono: true });
      f.restore();
    },
    readouts(state, view) {
      const tf = Math.sqrt(2 * state.h / state.g);
      const t = Math.min(view.t, tf);
      return [
        K.readout('时间 t', U.fmt(t, 2), 's'),
        K.readout('水平位移 x', U.fmt(state.v0 * t, 2), 'm'),
        K.readout('竖直速度 vy', U.fmt(state.g * t, 2), 'm/s'),
        K.readout('合速度 v', U.fmt(Math.hypot(state.v0, state.g * t), 2), 'm/s')
      ];
    },
    sample(state, view) {
      const tf = Math.sqrt(2 * state.h / state.g);
      const t = Math.min(view.t, tf);
      return { t, x: state.v0 * t, y: 0.5 * state.g * t * t, vx: state.v0, vy: state.g * t, v: Math.hypot(state.v0, state.g * t) };
    },
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 3 },
      { key: 'x', label: 'x', unit: 'm', decimals: 3 },
      { key: 'y', label: 'y', unit: 'm', decimals: 3 },
      { key: 'vy', label: 'vy', unit: 'm/s', decimals: 2 }
    ],
    plot(state, view) {
      const tf = Math.sqrt(2 * state.h / state.g);
      const range = state.v0 * tf;
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const x = range * i / 100;
        pts.push({ x, y: state.g * x * x / (2 * state.v0 * state.v0) });
      }
      return {
        xLabel: '水平位移 x', yLabel: '下落高度 y', xUnit: 'm', yUnit: 'm',
        xMin: 0, xMax: Math.max(range, 0.1), yMin: 0, yMax: Math.max(state.h, 0.1),
        series: [
          K.series(pts, '平抛轨迹', '#5ca8ff', { width: 2 }),
          K.scatter(view.records, 'x', 'y', '频闪点', '#64d2ff', { pointSize: 2.4 })
        ]
      };
    },
    conclusion(state) {
      const tf = Math.sqrt(2 * state.h / state.g);
      return '<b>结论：</b>平抛运动可分解为水平方向的匀速直线运动和竖直方向的自由落体运动。水平射程 x = v₀t = <b>' + U.fmt(state.v0 * tf, 2) + ' m</b>，飞行时间只由高度 h 决定。';
    }
  });
})();
