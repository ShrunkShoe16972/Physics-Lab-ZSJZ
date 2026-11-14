/* ============================================================
   Electricity labs 15–18
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const C = OL.canvas;
  const K = OL.labKit;
  const U = OL.utils;
  const P = OL.palette;

  /* ------------------------------------------------------------
     15 · 探究安培力的大小
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'ampere-force',
    live: false,
    playable: true,
    hint: '改变 I、B、L 与夹角 · 记录 F–I 数据',
    step(state, dt, view) { view.t += dt; },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const th = U.deg(state.angle);
      const F = state.B * state.I * state.L * Math.sin(th);

      // magnet
      const mx1 = 128, mx2 = 200, mx3 = 438, mx4 = 510;
      C.fillRound(ctx, mx1, 156, mx2 - mx1, 200, 8, 'rgba(255,105,97,.18)');
      C.fillRound(ctx, mx3, 156, mx4 - mx3, 200, 8, 'rgba(92,168,255,.18)');
      C.roundRect(ctx, mx1, 156, mx2 - mx1, 200, 8); ctx.strokeStyle = 'rgba(255,120,110,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      C.roundRect(ctx, mx3, 156, mx4 - mx3, 200, 8); ctx.strokeStyle = 'rgba(100,180,255,.55)'; ctx.stroke();
      C.label(ctx, 'N', 164, 180, { size: 18, align: 'center', color: '#ff8a80', weight: 700 });
      C.label(ctx, 'S', 474, 180, { size: 18, align: 'center', color: '#7db7ff', weight: 700 });
      // field lines
      for (let i = 0; i < 5; i++) {
        const y = 196 + i * 32;
        C.arrow(ctx, mx2 + 13, y, mx3 - 13, y, { color: 'rgba(120,190,255,.24)', width: 1, head: 4 });
      }
      C.label(ctx, 'B', 330, 181, { size: 9, color: 'rgba(120,190,255,.55)', mono: true });
      // conductor rod
      const cx = 330, cy = 260;
      const Lp = 42 + state.L * 96;
      const dx = Math.cos(th) * Lp, dy = -Math.sin(th) * Lp;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,190,90,.9)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,170,60,.4)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(cx - dx / 2, cy - dy / 2); ctx.lineTo(cx + dx / 2, cy + dy / 2); ctx.stroke();
      ctx.restore();
      C.arrow(ctx, cx - dx * 0.25, cy - dy * 0.25, cx + dx * 0.36, cy + dy * 0.36, { color: '#ffd166', width: 1.2, head: 5 });
      C.label(ctx, 'I', cx + dx * 0.27 + 8, cy + dy * 0.27, { size: 9, color: '#ffd166', mono: true });
      // current flow dots
      for (let i = 0; i < 5; i++) {
        const life = (view.t * 0.5 + i / 5) % 1;
        const p = life - 0.5;
        const alpha = 0.18 + 0.82 * Math.sin(Math.PI * life);
        C.dot(ctx, cx + dx * p, cy + dy * p, 2.2, 'rgba(255,230,168,' + alpha.toFixed(3) + ')', 4 * alpha);
      }
      // force arrow (out of plane represented upward)
      C.arrow(ctx, cx, cy - 12, cx, cy - 12 - Math.min(112, 28 + F * 10), { color: '#bf8bff', width: 2.6, head: 10, glow: 9 });
      C.label(ctx, 'F = ' + U.fmt(F, 3) + ' N', cx + 10, cy - 18 - Math.min(112, 28 + F * 10), { size: 9, color: '#d7b8ff', mono: true });
      C.label(ctx, '（方向：垂直于 I 与 B）', cx + 10, cy + 24 - Math.min(112, 28 + F * 10), { size: 7, color: 'rgba(215,184,255,.38)' });

      // vector diagram
      K.panel(ctx, 574, 52, 278, 286, { fill: 'rgba(9,15,26,.6)' });
      C.label(ctx, '矢量关系', 590, 74, { size: 9, color: 'rgba(230,240,255,.4)' });
      const ox = 620, oy = 220, bs = 52, is = 30 + state.I * 7;
      C.arrow(ctx, ox, oy, ox + Math.min(110, state.B * 130), oy, { color: '#64a8ff', width: 2, head: 7 });
      C.label(ctx, 'B', ox + Math.min(110, state.B * 130) + 7, oy + 3, { size: 9, color: '#64a8ff', mono: true });
      C.arrow(ctx, ox, oy, ox + Math.cos(th) * is, oy - Math.sin(th) * is, { color: '#ffb340', width: 2, head: 7 });
      C.label(ctx, 'I', ox + Math.cos(th) * is + 7, oy - Math.sin(th) * is, { size: 9, color: '#ffb340', mono: true });
      K.arc(ctx, ox, oy, 42, -th, 0, 'rgba(255,255,255,.28)', 1);
      C.label(ctx, 'θ', ox + 48, oy - 22, { size: 8, color: 'rgba(230,240,255,.5)', mono: true });
      C.arrow(ctx, ox, oy, ox, oy - 70, { color: '#bf8bff', width: 2, head: 7 });
      C.label(ctx, 'F', ox - 16, oy - 58, { size: 9, color: '#bf8bff', mono: true });
      C.label(ctx, 'F = BIL sin θ', 590, 270, { size: 14, color: '#eef4ff', mono: true, weight: 600 });
      C.label(ctx, 'θ = 0° 或 180° 时 F = 0', 590, 293, { size: 7.5, color: 'rgba(230,240,255,.32)' });
      C.label(ctx, 'θ = 90° 时 F 最大', 590, 308, { size: 7.5, color: 'rgba(230,240,255,.32)' });

      // formula panel bottom
      K.panel(ctx, 54, 390, 300, 42, { fill: 'rgba(9,15,26,.5)' });
      C.label(ctx, 'B = ' + U.fmt(state.B, 2) + ' T', 68, 407, { size: 8.5, color: 'rgba(230,240,255,.42)', mono: true });
      C.label(ctx, 'L = ' + U.fmt(state.L, 2) + ' m', 172, 407, { size: 8.5, color: 'rgba(230,240,255,.42)', mono: true });
      C.label(ctx, 'I = ' + U.fmt(state.I, 1) + ' A', 276, 407, { size: 8.5, color: 'rgba(230,240,255,.42)', mono: true });
      C.label(ctx, '左手定则：磁感线穿入手心，四指指电流，大拇指指安培力', 54, 372, { size: 7.5, color: 'rgba(230,240,255,.28)' });
      f.restore();
    },
    readouts(state) {
      const F = state.B * state.I * state.L * Math.sin(U.deg(state.angle));
      return [
        K.readout('安培力 F', U.fmt(F, 3), 'N'),
        K.readout('磁感应强度 B', U.fmt(state.B, 2), 'T'),
        K.readout('电流 I', U.fmt(state.I, 1), 'A'),
        K.readout('有效长度', U.fmt(state.L * Math.sin(U.deg(state.angle)), 2), 'm')
      ];
    },
    sample(state) {
      const th = U.deg(state.angle);
      return { I: state.I, B: state.B, L: state.L, angle: state.angle, F: state.B * state.I * state.L * Math.sin(th) };
    },
    columns: [
      { key: 'I', label: 'I', unit: 'A', decimals: 2 },
      { key: 'B', label: 'B', unit: 'T', decimals: 2 },
      { key: 'angle', label: 'θ', unit: '°', decimals: 0 },
      { key: 'F', label: 'F', unit: 'N', decimals: 3 }
    ],
    plot(state, view) {
      const th = U.deg(state.angle);
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const I = i / 60 * 8;
        pts.push({ x: I, y: state.B * I * state.L * Math.sin(th) });
      }
      return {
        xLabel: '电流 I', yLabel: '安培力 F', xUnit: 'A', yUnit: 'N',
        xMin: 0, xMax: 8, yMin: 0,
        series: [
          K.series(pts, '理论 F–I', '#bf8bff', { width: 2 }),
          K.scatter(view.records, 'I', 'F', '测量点', '#d7b8ff', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const th = U.deg(state.angle);
      const F = state.B * state.I * state.L * Math.sin(th);
      return '<b>结论：</b>安培力 F = BIL sinθ。当 B、L 不变时，F 与 I 成正比；当电流方向与磁场方向平行时，sinθ = 0，安培力为零。当前 F = <b>' + U.fmt(F, 3) + ' N</b>。';
    }
  });

  /* ------------------------------------------------------------
     16 · 探究电磁感应的产生条件
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'induction',
    live: true,
    playable: true,
    hint: '插入 / 拔出磁铁 · 观察磁通量变化与感应电流',
    onControl(key, state, view) {
      if (key === 'motion') { view.t = 0; view.playing = false; }
    },
    step(state, dt, view) {
      if (state.motion === 'still') { view.playing = false; return; }
      const duration = 4.6 / Math.max(0.2, state.speed);
      view.t = Math.min(duration, view.t + dt);
      if (view.t >= duration - 0.001) view.playing = false;
    },
    _kin(state, view) {
      if (state.motion === 'still') return { x: 482, vx: 0, phase: 0 };
      const cyc = 4.6 / Math.max(0.2, state.speed);
      const p = U.clamp(view.t / cyc, 0, 1);
      const q = U.clamp(p * 1.75, 0, 1);
      const smooth = q * q * (3 - 2 * q);
      if (state.motion === 'withdraw') {
        return { x: 482 + 300 * smooth, vx: 300 * 1.75 / cyc, phase: p };
      }
      return { x: 120 + 362 * smooth, vx: 362 * 1.75 / cyc, phase: p };
    },
    _emf(state, view) {
      const k = this._kin(state, view);
      const sigma = 62;
      const flux = state.strength * Math.exp(-Math.pow((k.x - 482) / sigma, 2));
      const dphidx = flux * (-2 * (k.x - 482) / (sigma * sigma));
      const emf = -state.turns * dphidx * k.vx * 1e-3;
      return { flux, emf, x: k.x, vx: k.vx };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const k = this._emf(state, view);
      const coilX = 482, coilY = 310;
      // circuit from galvanometer to coil
      C.line(ctx, 306, 110, 380, 110, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 380, 110, 380, 210, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 380, 210, 444, 238, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 306, 180, 356, 180, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 356, 180, 356, 424, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 356, 424, 444, 424, 'rgba(210,228,250,.32)', 1.1);
      C.line(ctx, 444, 424, 444, 382, 'rgba(210,228,250,.32)', 1.1);
      // coil
      for (let i = 0; i < 9; i++) {
        const x = coilX - 38 + i * 9.5;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,179,64,.55)'; ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255,160,40,.18)'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.ellipse(x, coilY, 9, 72, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      C.label(ctx, '线圈 n = ' + state.turns + ' 匝', coilX, coilY + 92, { size: 8, align: 'center', color: 'rgba(255,179,64,.55)', mono: true });

      // magnet
      const mx = k.x;
      C.fillRound(ctx, mx - 58, coilY - 32, 55, 64, 4, 'rgba(255,105,97,.82)');
      C.fillRound(ctx, mx + 2, coilY - 32, 55, 64, 4, 'rgba(92,168,255,.82)');
      C.label(ctx, 'N', mx - 30, coilY + 6, { size: 14, align: 'center', color: '#fff', weight: 700 });
      C.label(ctx, 'S', mx + 30, coilY + 6, { size: 14, align: 'center', color: '#fff', weight: 700 });
      for (let i = 0; i < 3; i++) {
        C.line(ctx, mx + 60 + i * 13, coilY - 20, mx + 60 + i * 13, coilY + 20, 'rgba(160,200,255,' + (0.2 - i * 0.04) + ')', 1);
      }
      C.label(ctx, 'v', mx - 4, coilY - 48, { size: 8.5, color: '#64d2ff', align: 'center', mono: true });

      // galvanometer
      K.panel(ctx, 70, 56, 236, 174, { fill: 'rgba(9,15,26,.64)' });
      const gx = 188, gy = 154, gr = 57;
      K.arc(ctx, gx, gy, gr, Math.PI * 0.85, Math.PI * 2.15, 'rgba(180,205,240,.25)', 2);
      for (let i = -3; i <= 3; i++) {
        const a = Math.PI * 1.5 + i * 0.23;
        C.line(ctx, gx + Math.cos(a) * (gr - 9), gy + Math.sin(a) * (gr - 9), gx + Math.cos(a) * gr, gy + Math.sin(a) * gr, 'rgba(210,225,245,.28)', 1);
      }
      const defl = U.clamp(k.emf * 0.55, -1.1, 1.1);
      const needle = Math.PI * 1.5 + defl;
      C.line(ctx, gx, gy, gx + Math.cos(needle) * (gr - 12), gy + Math.sin(needle) * (gr - 12), '#ff6b9a', 2.2);
      C.dot(ctx, gx, gy, 4, 'rgba(220,235,255,.7)');
      C.label(ctx, '灵敏电流计', gx, gy + 76, { size: 8, align: 'center', color: 'rgba(230,240,255,.35)' });
      C.label(ctx, k.emf >= 0 ? '→ 右偏' : '← 左偏', gx, gy - 78, { size: 8, align: 'center', color: 'rgba(255,107,154,.7)' });

      // flux / emf panel
      K.panel(ctx, 630, 54, 222, 174, { fill: 'rgba(9,15,26,.62)' });
      C.label(ctx, '磁通量 Φ', 646, 78, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(k.flux, 3), 646, 101, { size: 17, color: '#64a8ff', mono: true });
      C.label(ctx, '感应电动势 E', 646, 130, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(k.emf, 3) + ' V', 646, 153, { size: 17, color: k.emf >= 0 ? '#30d158' : '#ff6b9a', mono: true });
      C.label(ctx, 'E = n·ΔΦ/Δt', 646, 181, { size: 8.5, color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, '只有磁通量变化才产生感应电流', 646, 205, { size: 7.5, color: 'rgba(230,240,255,.3)' });

      // circuit
      C.label(ctx, 't = ' + U.fmt(view.t, 1) + ' s', 70, 258, { size: 9, color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, '速度 ' + U.fmt(state.speed, 2) + ' m/s', 70, 276, { size: 8.5, color: 'rgba(230,240,255,.3)', mono: true });
      f.restore();
    },
    readouts(state, view) {
      const k = this._emf(state, view);
      return [
        K.readout('感应电动势', U.fmt(k.emf, 3), 'V'),
        K.readout('磁通量 Φ', U.fmt(k.flux, 3), 'Wb'),
        K.readout('线圈匝数', state.turns, '匝'),
        K.readout('磁铁位置', U.fmt(k.x, 0), 'px')
      ];
    },
    sample(state, view) {
      const k = this._emf(state, view);
      return { t: view.t, flux: k.flux, emf: k.emf, current: k.emf / 8 };
    },
    columns: [
      { key: 't', label: 't', unit: 's', decimals: 2 },
      { key: 'flux', label: 'Φ', unit: 'Wb', decimals: 4 },
      { key: 'emf', label: 'E', unit: 'V', decimals: 4 }
    ],
    plot(state, view) {
      const rec = view.records;
      return {
        xLabel: '时间 t', yLabel: '感应电动势 E', xUnit: 's', yUnit: 'V',
        xMin: 0, xMax: Math.max(6, rec.length ? rec[rec.length - 1].t : 6),
        series: [
          K.series(rec.map((r) => ({ x: r.t, y: r.emf })), '感应电动势', '#30d158', { width: 2 })
        ]
      };
    },
    conclusion(state) {
      return '<b>结论：</b>磁铁插入或拔出线圈时，穿过线圈的磁通量发生变化，回路中产生感应电动势；磁铁静止时磁通量不变，即使磁场很强也没有感应电流。感应电动势随磁通量变化率的增大而增大。';
    }
  });

  /* ------------------------------------------------------------
     17 · 探究变压器电压与匝数的关系
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'transformer',
    live: false,
    playable: true,
    hint: '改变副线圈匝数 · 观察灯泡亮度与电压比',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const U2 = state.U1 * state.n2 / state.n1;
      const I2 = U2 / state.R;
      const I1 = U2 * U2 / (state.U1 * state.R);
      return { U2, I2, I1, P: U2 * I2 };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const cx = 430, cy = 250;
      // core
      C.fillRound(ctx, cx - 52, cy - 130, 104, 260, 6, 'rgba(150,170,195,.16)');
      C.roundRect(ctx, cx - 52, cy - 130, 104, 260, 6); ctx.strokeStyle = 'rgba(190,210,240,.35)'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 4; i++) C.line(ctx, cx - 42 + i * 20, cy - 118, cx - 42 + i * 20, cy + 118, 'rgba(190,210,240,.12)', 1);
      C.fillRound(ctx, cx - 30, cy - 116, 60, 232, 4, 'rgba(10,16,28,.92)');

      // coils
      const drawCoil = (x, turns, color, label) => {
        const count = U.clamp(Math.round(turns / 70), 4, 12);
        for (let i = 0; i < count; i++) {
          const y = cy - 100 + i * (200 / count);
          ctx.save();
          ctx.strokeStyle = C.hexA(color, .65); ctx.lineWidth = 2.2;
          ctx.shadowColor = C.hexA(color, .25); ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.ellipse(x, y, 13, 7, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        C.label(ctx, label, x, cy + 122, { size: 8, align: 'center', color: C.hexA(color, .7), mono: true });
      };
      drawCoil(cx - 62, state.n1, '#5ca8ff', 'n₁ = ' + state.n1);
      drawCoil(cx + 62, state.n2, '#30d158', 'n₂ = ' + state.n2);
      // flux arrows in core
      for (let i = 0; i < 4; i++) {
        C.arrow(ctx, cx - 8, cy - 80 + i * 56, cx - 8, cy - 60 + i * 56, { color: 'rgba(255,179,64,.24)', width: 1, head: 4 });
      }
      // AC source
      C.line(ctx, 168, 230, 168, 280, 'rgba(210,228,250,.42)', 1.2);
      C.line(ctx, 148, 230, 188, 230, 'rgba(210,228,250,.42)', 1.2);
      C.line(ctx, 168, 280, 148, 280, 'rgba(210,228,250,.42)', 1.2);
      C.line(ctx, 168, 280, 188, 280, 'rgba(210,228,250,.42)', 1.2);
      C.line(ctx, 168, 230, cx - 62, 230, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 168, 280, 168, 312, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 168, 312, cx - 62, 312, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, cx - 62, 312, cx - 62, cy + 100, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 168, 230, 168, 188, 'rgba(210,228,250,.35)', 1.1);
      C.label(ctx, '~', 168, 262, { size: 15, align: 'center', color: '#ffb340', mono: true });
      C.label(ctx, 'U₁ = ' + U.fmt(state.U1, 1) + ' V', 120, 168, { size: 8, color: 'rgba(230,240,255,.38)', mono: true });

      // secondary + lamp
      C.line(ctx, cx + 62, cy - 100, 690, cy - 100, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, cx + 62, cy + 100, 690, cy + 100, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 690, cy - 100, 690, cy - 44, 'rgba(210,228,250,.35)', 1.1);
      C.line(ctx, 690, cy + 44, 690, cy + 100, 'rgba(210,228,250,.35)', 1.1);
      K.lamp(ctx, 690, cy, 18, U.clamp(q.P / 12, 0, 1));
      C.label(ctx, 'U₂ = ' + U.fmt(q.U2, 1) + ' V', 714, cy - 4, { size: 8, color: '#64d2ff', mono: true });
      C.label(ctx, 'R = ' + state.R + ' Ω', 714, cy + 12, { size: 7, color: 'rgba(230,240,255,.3)', mono: true });

      // waveform panel
      K.panel(ctx, 62, 66, 248, 100, { fill: 'rgba(9,15,26,.58)' });
      C.label(ctx, '原线圈电压', 78, 86, { size: 8, color: '#64a8ff' });
      for (let k = 0; k < 2; k++) {
        ctx.save(); ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const x = 78 + i * 2.7;
          const y = (k === 0 ? 112 : 142) + Math.sin(i / 80 * Math.PI * 4 + view.t * 4) * (k === 0 ? 14 : 14 * U.clamp(q.U2 / state.U1, 0, 2));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = k === 0 ? '#64a8ff' : '#30d158'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
        C.label(ctx, k === 0 ? 'U₁' : 'U₂', 300, (k === 0 ? 112 : 142) + 3, { size: 7, align: 'right', color: k === 0 ? '#64a8ff' : '#30d158', mono: true });
      }

      // ratio panel
      K.panel(ctx, 620, 310, 230, 104, { fill: 'rgba(9,15,26,.6)' });
      C.label(ctx, 'U₁ / U₂ = n₁ / n₂', 636, 333, { size: 11, color: '#eef4ff', mono: true });
      C.label(ctx, 'U₂ = ' + U.fmt(q.U2, 2) + ' V', 636, 357, { size: 8.5, color: '#30d158', mono: true });
      C.label(ctx, 'I₂ = ' + U.fmt(q.I2, 3) + ' A', 636, 377, { size: 8.5, color: 'rgba(230,240,255,.45)', mono: true });
      C.label(ctx, q.U2 > state.U1 ? '升压变压器' : q.U2 < state.U1 ? '降压变压器' : '隔离变压器', 636, 397, { size: 7.5, color: 'rgba(255,179,64,.7)' });
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('副线圈电压 U₂', U.fmt(q.U2, 2), 'V'),
        K.readout('副线圈电流 I₂', U.fmt(q.I2, 3), 'A'),
        K.readout('原线圈电流 I₁', U.fmt(q.I1, 4), 'A'),
        K.readout('输出功率 P', U.fmt(q.P, 2), 'W')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { n2: state.n2, U2: q.U2, I2: q.I2, P: q.P };
    },
    columns: [
      { key: 'n2', label: 'n₂', unit: '匝', decimals: 0 },
      { key: 'U2', label: 'U₂', unit: 'V', decimals: 2 },
      { key: 'I2', label: 'I₂', unit: 'A', decimals: 3 }
    ],
    plot(state, view) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const n2 = 50 + i / 60 * 1150;
        pts.push({ x: n2, y: state.U1 * n2 / state.n1 });
      }
      return {
        xLabel: '副线圈匝数 n₂', yLabel: '副线圈电压 U₂', xUnit: '匝', yUnit: 'V',
        xMin: 0, xMax: 1200, yMin: 0,
        series: [
          K.series(pts, '理论 U₂–n₂', '#30d158', { width: 2 }),
          K.scatter(view.records, 'n2', 'U2', '测量点', '#7dff9e', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>理想变压器的电压比等于匝数比，U₁/U₂ = n₁/n₂。当前 n₁ = ' + state.n1 + '、n₂ = ' + state.n2 + '，副线圈电压为 <b>' + U.fmt(q.U2, 2) + ' V</b>，属于' + (q.U2 > state.U1 ? '升压' : q.U2 < state.U1 ? '降压' : '隔离') + '变压器。';
    }
  });

  /* ------------------------------------------------------------
     18 · 探究平行板电容器的电容
     ------------------------------------------------------------ */
  OL.registerLab({
    id: 'capacitor',
    live: false,
    playable: true,
    hint: '改变 S、d 或介质 · 观察电容与电场变化',
    step(state, dt, view) { view.t += dt; },
    _calc(state) {
      const e0 = 8.854e-12;
      const d = state.d * 1e-3;
      const C = e0 * state.er * state.S / d;
      const Q = C * state.U;
      const E = state.U / d;
      return { C, Q, E, d };
    },
    draw(ctx, w, h, state, view) {
      C.grid(ctx, w, h, { step: 34 });
      const f = K.frame(ctx, w, h);
      const q = this._calc(state);
      const cx = 402, cy = 244;
      const gap = 54 + state.d / 5 * 100;
      const plateH = 130 + state.S / 0.5 * 80;
      const left = cx - gap / 2, right = cx + gap / 2;
      // dielectric
      if (state.er > 1.02) {
        C.fillRound(ctx, left + 4, cy - plateH / 2, gap - 8, plateH, 5, 'rgba(48,209,88,' + (0.04 + (state.er - 1) * 0.03) + ')');
        C.roundRect(ctx, left + 4, cy - plateH / 2, gap - 8, plateH, 5);
        ctx.strokeStyle = 'rgba(48,209,88,.28)'; ctx.lineWidth = 1; ctx.stroke();
        C.label(ctx, 'εᵣ = ' + U.fmt(state.er, 1), cx, cy + plateH / 2 + 18, { size: 8, align: 'center', color: 'rgba(48,209,88,.6)', mono: true });
      }
      // plates
      ctx.save();
      ctx.shadowColor = 'rgba(255,179,64,.26)'; ctx.shadowBlur = 18;
      C.fillRound(ctx, left - 8, cy - plateH / 2, 9, plateH, 3, 'rgba(255,179,64,.86)');
      C.fillRound(ctx, right - 1, cy - plateH / 2, 9, plateH, 3, 'rgba(255,179,64,.86)');
      ctx.restore();
      C.label(ctx, '+', left - 24, cy - plateH / 2 + 15, { size: 15, color: '#ff8a80', weight: 700 });
      C.label(ctx, '−', right + 18, cy - plateH / 2 + 15, { size: 15, color: '#64a8ff', weight: 700 });

      // field lines
      for (let i = 0; i < 7; i++) {
        const y = cy - plateH / 2 + 15 + i * (plateH - 30) / 6;
        const ph = (view.t * 0.35 + i * 0.13) % 1;
        C.line(ctx, left + 6, y, right - 4, y, 'rgba(100,180,255,' + (0.1 + state.er * 0.025) + ')', 1);
        for (let j = 0; j < 3; j++) {
          const life = (ph + j / 3) % 1;
          const px = left + 6 + life * (gap - 10);
          const alpha = 0.62 * Math.sin(Math.PI * life);
          C.dot(ctx, px, y, 1.2, 'rgba(150,210,255,' + alpha.toFixed(3) + ')');
        }
      }
      // charges
      for (let i = 0; i < 9; i++) {
        const y = cy - plateH / 2 + 12 + i * (plateH - 24) / 8;
        C.dot(ctx, left - 3, y, 2, 'rgba(255,210,160,.7)');
        C.dot(ctx, right + 3, y, 2, 'rgba(150,205,255,.7)');
      }
      // dimensions
      C.line(ctx, left, cy + plateH / 2 + 34, right, cy + plateH / 2 + 34, 'rgba(230,240,255,.3)', 1);
      C.label(ctx, 'd = ' + U.fmt(state.d, 1) + ' mm', cx, cy + plateH / 2 + 49, { size: 8, align: 'center', color: 'rgba(230,240,255,.4)', mono: true });
      C.label(ctx, 'S = ' + U.fmt(state.S, 2) + ' m²', 104, 92, { size: 8, color: 'rgba(230,240,255,.38)', mono: true });
      C.label(ctx, 'U = ' + U.fmt(state.U, 1) + ' V', 104, 110, { size: 8, color: 'rgba(230,240,255,.3)', mono: true });

      // result panel
      K.panel(ctx, 620, 52, 234, 234, { fill: 'rgba(9,15,26,.64)' });
      C.label(ctx, '电容 C', 636, 76, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.C * 1e12, 1) + ' pF', 636, 102, { size: 22, color: '#30d158', mono: true, weight: 600 });
      C.label(ctx, '电荷量 Q', 636, 132, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.Q * 1e9, 3) + ' nC', 636, 152, { size: 13, color: '#64d2ff', mono: true });
      C.label(ctx, '电场强度 E', 636, 180, { size: 8, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, U.fmt(q.E / 1000, 2) + ' kV/m', 636, 200, { size: 13, color: '#ffb340', mono: true });
      C.label(ctx, 'C = ε₀εᵣS / d', 636, 232, { size: 12, color: 'rgba(230,240,255,.65)', mono: true });
      C.label(ctx, '电容由电容器本身决定', 636, 256, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      C.label(ctx, '与 Q、U 无关', 636, 271, { size: 7.5, color: 'rgba(230,240,255,.3)' });
      // schematic
      K.panel(ctx, 62, 350, 256, 68, { fill: 'rgba(9,15,26,.46)' });
      C.line(ctx, 80, 384, 300, 384, 'rgba(210,228,250,.35)', 1);
      C.line(ctx, 166, 366, 166, 402, 'rgba(255,179,64,.7)', 2);
      C.line(ctx, 190, 366, 190, 402, 'rgba(255,179,64,.7)', 2);
      C.label(ctx, '平行板电容器', 128, 414, { size: 7, color: 'rgba(230,240,255,.3)' });
      f.restore();
    },
    readouts(state) {
      const q = this._calc(state);
      return [
        K.readout('电容 C', U.fmt(q.C * 1e12, 1), 'pF'),
        K.readout('电荷量 Q', U.fmt(q.Q * 1e9, 3), 'nC'),
        K.readout('电场强度 E', U.fmt(q.E / 1000, 2), 'kV/m'),
        K.readout('电压 U', U.fmt(state.U, 1), 'V')
      ];
    },
    sample(state) {
      const q = this._calc(state);
      return { S: state.S, d: state.d, er: state.er, C: q.C * 1e12, Q: q.Q * 1e9, E: q.E / 1000 };
    },
    columns: [
      { key: 'S', label: 'S', unit: 'm²', decimals: 2 },
      { key: 'd', label: 'd', unit: 'mm', decimals: 1 },
      { key: 'er', label: 'εᵣ', unit: '', decimals: 1 },
      { key: 'C', label: 'C', unit: 'pF', decimals: 1 }
    ],
    plot(state, view) {
      if (state.chartMode === 'CS') {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const S = 0.01 + i / 60 * 0.49;
          pts.push({ x: S, y: 8854 * state.er * S / state.d });
        }
        return {
          xLabel: '正对面积 S', yLabel: '电容 C', xUnit: 'm²', yUnit: 'pF',
          xMin: 0, xMax: 0.5, yMin: 0,
          series: [
            K.series(pts, '理论 C–S', '#30d158', { width: 2 }),
            K.scatter(view.records, 'S', 'C', '测量点', '#7dff9e', { pointSize: 4 })
          ]
        };
      }
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const d = 0.5 + i / 80 * 4.5;
        pts.push({ x: d, y: 8854 * state.er * state.S / d });
      }
      return {
        xLabel: '板间距 d', yLabel: '电容 C', xUnit: 'mm', yUnit: 'pF',
        xMin: 0, xMax: 5, yMin: 0,
        series: [
          K.series(pts, '理论 C–d', '#30d158', { width: 2 }),
          K.scatter(view.records, 'd', 'C', '测量点', '#7dff9e', { pointSize: 4 })
        ]
      };
    },
    conclusion(state) {
      const q = this._calc(state);
      return '<b>结论：</b>平行板电容器的电容与正对面积 S、介电常数 εᵣ 成正比，与板间距 d 成反比。当前 C ≈ <b>' + U.fmt(q.C * 1e12, 1) + ' pF</b>。C 由电容器自身结构决定，与是否带电无关。';
    }
  });
})();
