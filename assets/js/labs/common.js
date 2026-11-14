/* ============================================================
   Prism · shared lab helpers
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL = window.OL || {};
  const C = OL.canvas;

  OL.labs = OL.labs || {};
  OL.registerLab = function (spec) {
    if (spec && spec.id) OL.labs[spec.id] = spec;
  };

  function frame(ctx, w, h, W, H) {
    W = W || 900; H = H || 460;
    const s = Math.min(w / W, h / H);
    const ox = (w - W * s) / 2;
    const oy = (h - H * s) / 2;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    return { s, ox, oy, W, H, restore: () => ctx.restore() };
  }

  function series(points, name, color, opts) {
    return Object.assign({ name, color, points: points || [] }, opts || {});
  }

  function scatter(rows, xKey, yKey, name, color, opts) {
    return series((rows || []).map((r) => ({ x: r[xKey], y: r[yKey] })).filter((p) => isFinite(p.x) && isFinite(p.y)), name, color, Object.assign({ type: 'scatter' }, opts || {}));
  }

  function readout(label, value, unit) {
    return { label, value, unit: unit || '' };
  }

  function arc(ctx, cx, cy, r, a0, a1, color, width) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width || 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    ctx.restore();
  }

  function angleArc(ctx, cx, cy, r, a0, a1, color) {
    arc(ctx, cx, cy, r, a0, a1, color, 1.2);
  }

  function panel(ctx, x, y, w, h, opts) {
    opts = opts || {};
    C.fillRound(ctx, x, y, w, h, opts.r == null ? 12 : opts.r, opts.fill || 'rgba(11,17,28,.58)');
    C.roundRect(ctx, x, y, w, h, opts.r == null ? 12 : opts.r);
    ctx.save(); ctx.strokeStyle = opts.stroke || 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }

  function tag(ctx, text, x, y, color, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = '9px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = ctx.measureText(text).width;
    C.fillRound(ctx, x, y, tw + 14, 20, 6, C.hexA(color || '#5ca8ff', 0.12));
    ctx.fillStyle = color || '#5ca8ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 7, y + 10);
    ctx.restore();
  }

  function lamp(ctx, x, y, r, intensity) {
    const I = Math.max(0, Math.min(1, intensity || 0));
    if (I > 0.01) {
      const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * (2.4 + I * 2.6));
      g.addColorStop(0, 'rgba(255,224,150,' + (0.45 * I) + ')');
      g.addColorStop(0.4, 'rgba(255,200,90,' + (0.18 * I) + ')');
      g.addColorStop(1, 'rgba(255,190,60,0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * (2.4 + I * 2.6), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const bg = ctx.createRadialGradient(x - r * .3, y - r * .35, 1, x, y, r);
    bg.addColorStop(0, 'rgba(255,250,225,' + (0.5 + I * 0.5) + ')');
    bg.addColorStop(0.45, 'rgba(255,224,150,' + (0.18 + I * 0.7) + ')');
    bg.addColorStop(1, 'rgba(190,140,60,.16)');
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,235,180,' + (0.35 + I * 0.55) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function car(ctx, x, y, scale, color) {
    scale = scale || 1; color = color || '#5ca8ff';
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    // body
    const g = ctx.createLinearGradient(0, -26, 0, 0);
    g.addColorStop(0, '#eaf3ff'); g.addColorStop(1, '#9dbbe0');
    C.fillRound(ctx, -36, -24, 72, 22, 7, g);
    ctx.beginPath();
    ctx.moveTo(-22, -24); ctx.lineTo(-14, -36); ctx.lineTo(14, -36); ctx.lineTo(24, -24);
    ctx.closePath();
    const g2 = ctx.createLinearGradient(0, -38, 0, -22);
    g2.addColorStop(0, '#bcd8ff'); g2.addColorStop(1, '#7da4cf');
    ctx.fillStyle = g2; ctx.fill();
    C.fillRound(ctx, -11, -34, 22, 9, 3, 'rgba(45,80,125,.7)');
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; ctx.stroke();
    // wheels
    ctx.fillStyle = '#26303d';
    [-22, 22].forEach((wx) => {
      ctx.beginPath(); ctx.arc(wx, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(wx, 0, 3, 0, Math.PI * 2); ctx.fillStyle = '#c9d6e8'; ctx.fill(); ctx.fillStyle = '#26303d';
    });
    // light
    ctx.fillStyle = '#ffe8a3'; ctx.beginPath(); ctx.arc(33, -14, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function block(ctx, x, y, w, h, color, labelText) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#e8f1ff'); g.addColorStop(1, color || '#8fb7e8');
    C.fillRound(ctx, x, y, w, h, 5, g);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; C.roundRect(ctx, x, y, w, h, 5); ctx.stroke(); ctx.restore();
    if (labelText) C.label(ctx, labelText, x + w / 2, y + h / 2 + 3, { align: 'center', color: 'rgba(20,40,70,.75)', size: 10, weight: 650 });
  }

  function miniPlot(ctx, x, y, w, h, points, color, opts) {
    opts = opts || {};
    panel(ctx, x, y, w, h, { fill: 'rgba(8,14,25,.55)', stroke: 'rgba(255,255,255,.07)' });
    const pad = { l: 24, r: 9, t: 12, b: 18 };
    const x0 = x + pad.l, y0 = y + h - pad.b, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    C.label(ctx, opts.title || '', x + 9, y + 13, { size: 8.5, color: 'rgba(230,240,255,.42)' });
    if (!points || !points.length) return;
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    points.forEach((p) => { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); });
    if (xmin === xmax) xmax = xmin + 1;
    if (ymin === ymax) ymax = ymin + 1;
    if (opts.zeroY !== false) ymin = Math.min(0, ymin);
    if (opts.zeroX) xmin = Math.min(0, xmin);
    const X = (v) => x0 + (v - xmin) / (xmax - xmin) * pw;
    const Y = (v) => y0 - (v - ymin) / (ymax - ymin) * ph;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) { const yy = y0 - ph * i / 3; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + pw, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + pw, y0); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => { if (i === 0) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y)); });
    ctx.strokeStyle = color || '#5ca8ff'; ctx.lineWidth = 1.7;
    ctx.shadowColor = C.hexA(color || '#5ca8ff', .45); ctx.shadowBlur = 5; ctx.stroke();
    ctx.restore();
    const last = points[points.length - 1];
    C.dot(ctx, X(last.x), Y(last.y), 2.6, color || '#5ca8ff', 7);
    C.label(ctx, opts.xLabel || '', x + w - 8, y + h - 5, { size: 7.5, color: 'rgba(230,240,255,.32)', align: 'right' });
  }

  OL.labKit = { frame, series, scatter, readout, panel, tag, arc, angleArc, lamp, car, block, miniPlot };
})();
