/* ============================================================
   Prism · shared utilities, canvas helpers and local store
   ============================================================ */
(function () {
  'use strict';

  const OL = window.OL = window.OL || {};

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const deg = (d) => d * Math.PI / 180;
  const rad = (r) => r * 180 / Math.PI;

  function fmt(v, decimals) {
    if (!isFinite(v)) return '—';
    if (decimals == null) decimals = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
    return Number(v).toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function sci(v, digits) {
    if (!isFinite(v) || v === 0) return '0';
    const d = digits == null ? 2 : digits;
    const e = Math.floor(Math.log10(Math.abs(v)));
    const m = v / Math.pow(10, e);
    return m.toFixed(d) + '×10' + sup(e);
  }

  function sup(n) {
    const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map((c) => map[c] || c).join('');
  }

  function throttle(fn, ms) {
    let last = 0, timer = null, lastArgs;
    return function () {
      lastArgs = arguments;
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(null, lastArgs);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          last = Date.now();
          fn.apply(null, lastArgs);
        }, ms - (now - last));
      }
    };
  }

  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toCSV(rows) {
    return rows.map((r) => r.map((cell) => {
      const s = String(cell == null ? '' : cell);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
  }

  const storeKey = 'prism-physics-lab-v1';
  const defaultState = {
    theme: 'light', completed: [], steps: {}, last: 'accelerated-motion',
    custom: [], visits: 0, name: '物理探索者', fontScale: 1
  };
  let memoryState = null;

  function load() {
    if (memoryState) return memoryState;
    try {
      const raw = localStorage.getItem(storeKey);
      memoryState = raw ? Object.assign({}, defaultState, JSON.parse(raw)) : Object.assign({}, defaultState);
    } catch (e) {
      memoryState = Object.assign({}, defaultState);
    }
    return memoryState;
  }

  function save(patch) {
    const s = Object.assign(load(), patch || {});
    memoryState = s;
    try { localStorage.setItem(storeKey, JSON.stringify(s)); } catch (e) { /* private mode */ }
    return s;
  }

  function reset() { memoryState = Object.assign({}, defaultState); try { localStorage.removeItem(storeKey); } catch (e) {} }

  function complete(id) {
    const s = load();
    if (s.completed.indexOf(id) < 0) {
      s.completed.push(id);
      save({ completed: s.completed });
    }
  }

  function isDone(id) { return load().completed.indexOf(id) >= 0; }

  /* ---------- canvas ---------- */
  const palette = {
    blue: '#5ca8ff', blueSoft: 'rgba(92,168,255,.16)', cyan: '#64d2ff', green: '#30d158',
    greenSoft: 'rgba(48,209,88,.14)', orange: '#ffb340', orangeSoft: 'rgba(255,179,64,.15)',
    pink: '#ff6b9a', purple: '#bf8bff', red: '#ff6961', yellow: '#ffd166',
    text: '#eef4ff', dim: 'rgba(230,240,255,.44)', faint: 'rgba(230,240,255,.16)',
    grid: 'rgba(160,190,255,.07)', panel: 'rgba(16,24,40,.58)'
  };

  function prepare(canvas) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw; canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h, dpr };
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r == null ? 12 : r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fillRound(ctx, x, y, w, h, r, fill) {
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function label(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.save();
    const base = opts.size || 10;
    let fs = base < 13 ? Math.max(8.6, base * 1.12) : base;
    if (base < 16) fs *= (OL.ui && OL.ui.canvasLabelScale) || 1;
    ctx.font = (opts.weight || 500) + ' ' + fs + 'px ' + (opts.mono ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif');
    ctx.fillStyle = opts.color || palette.dim;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    if (opts.shadow) { ctx.shadowColor = opts.shadow; ctx.shadowBlur = 8; }
    ctx.fillText(String(text), x, y);
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = color || palette.faint;
    ctx.lineWidth = width || 1;
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function arrow(ctx, x1, y1, x2, y2, opts) {
    opts = opts || {};
    const color = opts.color || palette.blue;
    const width = opts.width || 1.8;
    const head = opts.head == null ? 8 : opts.head;
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (opts.glow) { ctx.shadowColor = color; ctx.shadowBlur = opts.glow; }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.42) * head, y2 - Math.sin(a - 0.42) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.42) * head, y2 - Math.sin(a + 0.42) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function dot(ctx, x, y, r, color, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  function ball(ctx, x, y, r, colors) {
    colors = colors || ['#ffffff', '#8fc7ff', '#2d6fd6'];
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, colors[0]); g.addColorStop(0.45, colors[1]); g.addColorStop(1, colors[2]);
    ctx.save();
    ctx.shadowColor = 'rgba(50,130,255,.55)'; ctx.shadowBlur = r * 0.9;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function glowCircle(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, alpha == null ? 0.6 : alpha));
    g.addColorStop(0.4, hexA(color, (alpha == null ? 0.6 : alpha) * 0.35));
    g.addColorStop(1, hexA(color, 0));
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function hexA(hex, a) {
    if (!hex) return 'rgba(255,255,255,' + a + ')';
    if (hex.indexOf('rgba') === 0 || hex.indexOf('rgb') === 0) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function grid(ctx, w, h, opts) {
    opts = opts || {};
    const step = opts.step || 32;
    ctx.save();
    ctx.strokeStyle = opts.color || palette.grid;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = (opts.offsetX || 0) % step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = (opts.offsetY || 0) % step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    if (opts.vignette !== false) {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.46, 10, w * 0.5, h * 0.46, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(10,16,30,0)'); g.addColorStop(1, 'rgba(5,9,18,.36)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function floorLine(ctx, x1, x2, y, color) {
    ctx.save();
    const g = ctx.createLinearGradient(x1, y, x2, y);
    g.addColorStop(0, 'rgba(150,180,230,0)'); g.addColorStop(0.15, color || 'rgba(170,195,240,.5)'); g.addColorStop(0.85, color || 'rgba(170,195,240,.5)'); g.addColorStop(1, 'rgba(150,180,230,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.restore();
  }

  function spring(ctx, x1, y1, x2, y2, coils, amp, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const n = (coils || 7) * 2;
    const lead = Math.min(14, len * 0.12);
    const body = Math.max(1, len - lead * 2);
    ctx.save();
    ctx.strokeStyle = color || palette.blue; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const side = i % 2 ? 1 : -1;
      const off = side * (amp || 7) * (i === 1 || i === n - 1 ? 0.55 : 1);
      ctx.lineTo(x1 + ux * (lead + body * t) + px * off, y1 + uy * (lead + body * t) + py * off);
    }
    ctx.lineTo(x2 - ux * lead, y2 - uy * lead);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function bars(ctx, x, y, w, h, values) {
    /* values: [{label, value, max, color}] */
    let cy = y;
    values.forEach((v) => {
      const frac = clamp(v.value / (v.max || 1), 0, 1);
      label(ctx, v.label, x, cy + 7, { size: 8.5, color: palette.dim });
      fillRound(ctx, x + 54, cy, w - 54, 6, 3, 'rgba(255,255,255,.08)');
      fillRound(ctx, x + 54, cy, (w - 54) * frac, 6, 3, v.color);
      label(ctx, v.text != null ? v.text : Math.round(frac * 100) + '%', x + w, cy + 7, { size: 8, align: 'right', color: palette.dim, mono: true });
      cy += 17;
    });
  }

  function axis(ctx, x, y, w, h, opts) {
    opts = opts || {};
    line(ctx, x, y, x + w, y, opts.color || 'rgba(200,220,255,.3)', 1);
    line(ctx, x, y, x, y - h, opts.color || 'rgba(200,220,255,.3)', 1);
    arrow(ctx, x + w, y, x + w + 5, y, { color: opts.color || 'rgba(200,220,255,.3)', head: 5, width: 1 });
    arrow(ctx, x, y - h, x, y - h - 5, { color: opts.color || 'rgba(200,220,255,.3)', head: 5, width: 1 });
  }

  function dashedPath(ctx, points, color, dash) {
    if (!points.length) return;
    ctx.save();
    ctx.setLineDash(dash || [5, 5]);
    ctx.strokeStyle = color || palette.faint; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke(); ctx.restore();
  }

  /* ---------- misc ---------- */
  function iconArrow() { return '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
  function iconBack() { return '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'; }
  function iconCheck() { return '<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>'; }
  function iconPlay() { return '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5-10-6.5Z"/></svg>'; }
  function iconPause() { return '<svg class="icon-pause" viewBox="0 0 24 24"><path d="M8 5.5v13M16 5.5v13"/></svg>'; }
  function iconReset() { return '<svg viewBox="0 0 24 24"><path d="M4.5 10a8 8 0 1 1 1.8 7.4"/><path d="M4.5 4.8V10H10"/></svg>'; }
  function iconExpand() { return '<svg viewBox="0 0 24 24"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg>'; }
  function iconDownload() { return '<svg viewBox="0 0 24 24"><path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>'; }
  function iconChart() { return '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16"/><path d="m7 15 4-5 3 3 5-7"/></svg>'; }
  function iconInfo() { return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>'; }
  function iconSpark() { return '<svg viewBox="0 0 24 24"><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/><path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 18l1.5-.5.5-1Z"/></svg>'; }
  function iconTable() { return '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M10 5v14M10 14.5h10"/></svg>'; }
  function iconCopy() { return '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></svg>'; }
  function iconTrash() { return '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>'; }
  function iconUpload() { return '<svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M5 20h14"/></svg>'; }

  OL.utils = { $, $$, clamp, lerp, uid, esc, deg, rad, fmt, sci, sup, throttle, download, toCSV, load, save, reset, complete, isDone, hexA };
  OL.ui = OL.ui || { fontScale: 1, canvasLabelScale: 1.12, chartFontScale: 1 };
  OL.store = { load, save, reset, complete, isDone, key: storeKey };
  OL.canvas = { prepare, roundRect, fillRound, label, line, arrow, dot, ball, glowCircle, hexA, grid, floorLine, spring, bars, axis, dashedPath };
  OL.palette = palette;
  OL.iconsUI = { arrow: iconArrow, back: iconBack, check: iconCheck, play: iconPlay, pause: iconPause, reset: iconReset, expand: iconExpand, download: iconDownload, chart: iconChart, info: iconInfo, spark: iconSpark, table: iconTable, copy: iconCopy, trash: iconTrash, upload: iconUpload };
})();
