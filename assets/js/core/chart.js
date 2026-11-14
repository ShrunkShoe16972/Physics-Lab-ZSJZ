/* ============================================================
   Prism · canvas chart renderer
   Lightweight, DPR-aware, interactive, no dependencies.
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL = window.OL || {};
  const U = OL.utils;

  function niceNum(range, round) {
    const exp = Math.floor(Math.log10(range || 1));
    const f = (range || 1) / Math.pow(10, exp);
    let nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }

  function scale(min, max, ticks, zero) {
    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
    if (min === max) { min -= 1; max += 1; }
    if (zero) {
      if (min > 0 && min < (max - min) * 0.85) min = 0;
      if (max < 0 && max > (min - max) * 0.85) max = 0;
    }
    let span = max - min;
    const step = niceNum(span / Math.max(2, ticks), true);
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
    if (min === max) max = min + step;
    const out = [];
    for (let v = min; v <= max + step * 0.001; v += step) out.push(Math.abs(v) < step * 1e-8 ? 0 : v);
    return { min, max, step, values: out };
  }

  function css(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  class Chart {
    constructor(canvas, tooltip) {
      this.canvas = canvas;
      this.tooltip = tooltip;
      this.model = null;
      this.hover = null;
      this.pad = { l: 54, r: 18, t: 18, b: 36 };
      this._resize = U.throttle(() => this.draw(), 80);
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(canvas.parentElement || canvas);
      }
      canvas.addEventListener('mousemove', (e) => this.onMove(e));
      canvas.addEventListener('mouseleave', () => this.onLeave());
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches[0]) this.onMove(e.touches[0]);
      }, { passive: true });
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches[0]) this.onMove(e.touches[0]);
      }, { passive: true });
      canvas.addEventListener('touchend', () => this.onLeave());
    }

    setModel(model) {
      this.model = model;
      this.draw();
    }

    onMove(e) {
      if (!this.model || !this.geo) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const g = this.geo;
      if (x < g.x0 - 4 || x > g.x1 + 4 || y < g.y0 - 4 || y > g.y0 + g.h + 4) {
        this.onLeave(); return;
      }
      let best = null, bestD = 18;
      const series = this.model.series || [];
      series.forEach((s) => {
        (s.points || []).forEach((p) => {
          if (!isFinite(p.x) || !isFinite(p.y)) return;
          const px = g.x(p.x), py = g.y(p.y);
          const d = Math.hypot(px - x, py - y);
          if (d < bestD) { bestD = d; best = { s, p, px, py }; }
        });
      });
      if (!best) { this.onLeave(); return; }
      this.hover = best;
      this.draw();
      if (this.tooltip) {
        this.tooltip.innerHTML = '<b>' + U.esc(best.s.name) + '</b><br>' +
          U.esc(this.model.xLabel || 'x') + ' ' + U.fmt(best.p.x, this.model.xDigits == null ? 2 : this.model.xDigits) +
          (this.model.xUnit ? ' ' + this.model.xUnit : '') + '<br>' +
          U.esc(this.model.yLabel || 'y') + ' ' + U.fmt(best.p.y, this.model.yDigits == null ? 2 : this.model.yDigits) +
          (this.model.yUnit ? ' ' + this.model.yUnit : '');
        this.tooltip.style.left = best.px + 'px';
        this.tooltip.style.top = (best.py - 8) + 'px';
        this.tooltip.style.opacity = '1';
      }
    }

    onLeave() {
      this.hover = null;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.draw();
    }

    draw() {
      const c = OL.canvas.prepare(this.canvas);
      const ctx = c.ctx, w = c.w, h = c.h;
      const m = this.model;
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      const text2 = dark ? 'rgba(230,235,245,.55)' : 'rgba(60,60,67,.55)';
      const text3 = dark ? 'rgba(230,235,245,.32)' : 'rgba(60,60,67,.34)';
      const grid = dark ? 'rgba(255,255,255,.055)' : 'rgba(20,30,50,.06)';
      const axis = dark ? 'rgba(255,255,255,.13)' : 'rgba(20,30,50,.12)';
      const fsScale = (OL.ui && OL.ui.chartFontScale) || 1;
      if (!m) return;

      ctx.save();
      ctx.font = (11 * fsScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

      const series = (m.series || []).filter((s) => s && s.points && s.points.length);
      if (!series.length) {
        this.empty(ctx, w, h, text3, grid);
        ctx.restore();
        return;
      }

      let xs = [], ys = [];
      series.forEach((s) => s.points.forEach((p) => {
        if (isFinite(p.x) && isFinite(p.y)) { xs.push(p.x); ys.push(p.y); }
      }));
      if (!xs.length) { this.empty(ctx, w, h, text3, grid); ctx.restore(); return; }

      let xmin = m.xMin != null ? m.xMin : Math.min.apply(null, xs);
      let xmax = m.xMax != null ? m.xMax : Math.max.apply(null, xs);
      let ymin = m.yMin != null ? m.yMin : Math.min.apply(null, ys);
      let ymax = m.yMax != null ? m.yMax : Math.max.apply(null, ys);
      if (m.xMin == null && xmin >= 0) xmin = 0;
      if (m.yMin == null && ymin >= 0) ymin = 0;
      if (m.yMin == null && ymax <= 0) ymax = 0;

      if (xmin === xmax) { xmin -= 1; xmax += 1; }
      if (ymin === ymax) { ymax += Math.abs(ymax || 1) * 0.2 + 0.1; ymin -= Math.abs(ymin || 1) * 0.05; }

      const xPad = (xmax - xmin) * 0.035;
      const yPad = (ymax - ymin) * 0.1;
      const xscl = scale(xmin - (m.xMin == null && xmin !== 0 ? xPad : 0), xmax + (m.xMax == null ? xPad : 0), 5, false);
      const yscl = scale(ymin - (m.yMin == null && ymin !== 0 ? yPad : 0), ymax + (m.yMax == null ? yPad : 0), 5, false);

      const pad = {
        l: (m.yLabel ? 58 : 42) + Math.max(0, fsScale - 1) * 18,
        r: 16,
        t: 14,
        b: (m.xLabel ? 40 : 28) + Math.max(0, fsScale - 1) * 6
      };
      const x0 = pad.l, y0 = h - pad.b, pw = w - pad.l - pad.r, ph = y0 - pad.t;
      const X = (v) => x0 + (v - xscl.min) / (xscl.max - xscl.min) * pw;
      const Y = (v) => y0 - (v - yscl.min) / (yscl.max - yscl.min) * ph;
      this.geo = { x0, y0, w: pw, h: ph, x: X, y: Y, xscl, yscl };

      // optional bands
      (m.bands || []).forEach((b) => {
        const bx1 = X(b.x1), bx2 = X(b.x2);
        ctx.fillStyle = b.color || 'rgba(92,168,255,.06)';
        ctx.fillRect(Math.min(bx1, bx2), y0 - ph, Math.abs(bx2 - bx1), ph);
      });

      // grid + ticks
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = grid;
      xscl.values.forEach((v) => {
        const px = X(v);
        ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, y0); ctx.stroke();
      });
      yscl.values.forEach((v) => {
        const py = Y(v);
        ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x0 + pw, py); ctx.stroke();
      });

      // axis lines
      ctx.strokeStyle = axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, pad.t); ctx.lineTo(x0, y0); ctx.lineTo(x0 + pw, y0); ctx.stroke();

      // tick labels
      ctx.fillStyle = text3;
      ctx.font = (9.5 * fsScale) + 'px "SFMono-Regular", ui-monospace, Consolas, monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      yscl.values.forEach((v) => {
        ctx.fillText(this.tick(v, yscl.step), x0 - 8, Y(v));
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      xscl.values.forEach((v) => {
        ctx.fillText(this.tick(v, xscl.step), X(v), y0 + 7);
      });

      // axis labels
      ctx.fillStyle = text2;
      ctx.font = (10.5 * fsScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      if (m.xLabel) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        const unit = m.xUnit ? ' / ' + m.xUnit : '';
        ctx.fillText(m.xLabel + unit, x0 + pw, h - 2);
      }
      if (m.yLabel) {
        ctx.save();
        ctx.translate(12, pad.t);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        const unit = m.yUnit ? ' / ' + m.yUnit : '';
        ctx.fillText(m.yLabel + unit, -8, 0);
        ctx.restore();
      }

      // series
      series.forEach((s) => {
        const color = s.color || '#0a84ff';
        const pts = s.points.filter((p) => isFinite(p.x) && isFinite(p.y));
        if (s.type === 'bar') {
          const bw = Math.max(2, Math.min(16, pw / Math.max(1, pts.length) * 0.5));
          pts.forEach((p) => {
            const px = X(p.x), py = Y(p.y);
            ctx.fillStyle = U.hexA(color, 0.7);
            const by = Math.min(Y(0), py), bh = Math.abs(Y(0) - py);
            ctx.fillRect(px - bw / 2, by, bw, Math.max(1, bh));
          });
        }
        if (s.type !== 'scatter' && s.type !== 'bar') {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = s.width || 2;
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          if (s.dash) ctx.setLineDash(s.dash);
          if (s.glow !== false) { ctx.shadowColor = U.hexA(color, 0.35); ctx.shadowBlur = 7; }
          ctx.beginPath();
          pts.forEach((p, i) => { if (i === 0) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y)); });
          ctx.stroke();
          ctx.restore();
          if (s.fill) {
            ctx.save();
            const grad = ctx.createLinearGradient(0, pad.t, 0, y0);
            grad.addColorStop(0, U.hexA(color, 0.18)); grad.addColorStop(1, U.hexA(color, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(X(pts[0].x), Y(0));
            pts.forEach((p) => ctx.lineTo(X(p.x), Y(p.y)));
            ctx.lineTo(X(pts[pts.length - 1].x), Y(0));
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
        }
        if (s.type === 'scatter' || s.showPoints) {
          pts.forEach((p, i) => {
            const isLast = i === pts.length - 1;
            ctx.save();
            ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), s.pointSize || (isLast ? 3.6 : 3), 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.shadowColor = U.hexA(color, 0.45); ctx.shadowBlur = isLast ? 10 : 4;
            ctx.fill();
            if (s.ring !== false) {
              ctx.shadowBlur = 0; ctx.strokeStyle = dark ? 'rgba(10,14,22,.75)' : '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
            }
            ctx.restore();
          });
        }
      });

      // hover crosshair
      if (this.hover && this.hover.p) {
        const p = this.hover.p;
        const px = X(p.x), py = Y(p.y);
        ctx.save();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = U.hexA(this.hover.s.color || '#0a84ff', 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, y0); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(px, py, 5.2, 0, Math.PI * 2);
        ctx.strokeStyle = this.hover.s.color || '#0a84ff'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    tick(v, step) {
      if (Math.abs(v) >= 10000 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)) {
        return v.toExponential(1);
      }
      const d = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
      return v.toFixed(d);
    }

    empty(ctx, w, h, color, grid) {
      const fsScale = (OL.ui && OL.ui.chartFontScale) || 1;
      ctx.save();
      ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
      for (let y = 36; y < h - 24; y += 34) {
        ctx.beginPath(); ctx.moveTo(46, y); ctx.lineTo(w - 18, y); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = (11 * fsScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('采集数据后，图像会出现在这里', w / 2, h / 2 - 6);
      ctx.font = (10 * fsScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = color; ctx.globalAlpha = 0.7;
      ctx.fillText('调节变量 → 点击「采集数据」', w / 2, h / 2 + 13);
      ctx.restore();
    }
  }

  OL.Chart = Chart;
  OL.chartScale = scale;
})();
