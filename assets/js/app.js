/* ============================================================
   Prism · application shell, router, dashboard and lab runtime
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const U = OL.utils;
  const C = OL.canvas;
  const $ = U.$;
  const $$ = U.$$;

  const viewEl = $('#view');
  const sidebar = $('#sidebar');
  const scrim = $('#mobileScrim');
  const toastStack = $('#toastStack');

  const app = OL.app = {
    navigate, rerender: () => renderRoute(true), toast, openModal, closeModal,
    openPalette, closePalette, state: null
  };

  const state = app.state = {
    route: 'home', filter: 'all', lab: null, currentLab: null,
    theme: U.load().theme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    fontScale: Number(U.load().fontScale) || 1,
    paletteOpen: false, paletteIndex: 0, heroStop: null, focus: false
  };

  function ui(name) { return (OL.iconsUI[name] || function () { return ''; })(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function catOf(exp) { return OL.categories[exp.category] || { name: '自定义', color: '#5e5ce6', en: 'Custom' }; }
  function customList() {
    const base = (OL.workshop && OL.workshop.list) ? OL.workshop.list() : [];
    const extra = (OL.getPluginExperiments ? OL.getPluginExperiments() : []);
    return base.concat(extra);
  }
  function resolveExp(id) {
    return OL.getExperiment(id) || customList().find((e) => e.id === id) || null;
  }
  function allForSearch() { return OL.experiments.concat(customList()); }
  function canPlay(lab) { return !!lab && lab.playable !== false && typeof lab.step === 'function'; }

  /* ------------------------------------------------------------
     Theme & chrome
     ------------------------------------------------------------ */
  function applyTheme(theme, persist) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#07080b' : '#f3f4f6');
    if (persist !== false) U.save({ theme });
    if (state.currentLab && state.currentLab.chart) state.currentLab.chart.draw();
  }

  function applyFontScale(value, persist) {
    const scale = Math.min(1.3, Math.max(1, Number(value) || 1));
    state.fontScale = scale;
    document.documentElement.style.setProperty('--fs', scale);
    document.documentElement.setAttribute('data-font-scale', String(scale));
    OL.ui.fontScale = scale;
    OL.ui.canvasLabelScale = 1 + (scale - 1) * 1.05;
    OL.ui.chartFontScale = 1 + (scale - 1) * 1.15;
    const fv = $('#fontValue');
    if (fv) fv.textContent = Math.round(scale * 100) + '%';
    $$('.font-options button').forEach((b) => b.classList.toggle('active', Number(b.dataset.font) === scale));
    if (persist !== false) U.save({ fontScale: scale });
    if (state.currentLab) {
      state.currentLab.view.dirty = true;
      if (state.currentLab.chart) setTimeout(() => state.currentLab && state.currentLab.chart.draw(), 30);
    }
  }

  function setFontPanel(open) {
    const pop = $('#fontPop');
    const btn = $('#fontBtn');
    if (!pop) return;
    pop.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function syncProgress() {
    const s = U.load();
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const pct = Math.round(Math.min(21, done) / 21 * 100);
    const txt = $('#sideProgressText'), bar = $('#sideProgressBar'), cnt = $('#sideDoneCount');
    if (txt) txt.textContent = pct + '%';
    if (bar) bar.style.width = pct + '%';
    if (cnt) cnt.textContent = Math.min(21, done);
  }

  function setCrumb(html) { const el = $('#crumb'); if (el) el.innerHTML = html; }

  function setActiveNav(name, category) {
    $$('.nav-item').forEach((b) => b.classList.remove('active'));
    if (name === 'home') { const b = $('.nav-item[data-route="home"]'); if (b) b.classList.add('active'); }
    if (name === 'library') { const b = $('.nav-item[data-route="library"]'); if (b) b.classList.add('active'); }
    if (name === 'workshop') { const b = $('.nav-item[data-route="workshop"]'); if (b) b.classList.add('active'); }
    if (category) {
      const c = $('.nav-cat[data-cat="' + category + '"]');
      if (c) c.classList.add('active');
    }
    syncProgress();
  }

  function toast(msg, type) {
    if (!toastStack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = '<svg viewBox="0 0 24 24">' + (type === 'error' ? '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16.5h.01"/>' : '<path d="m5 12 4.5 4.5L19 7"/>') + '</svg><span>' + U.esc(msg) + '</span>';
    toastStack.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2500);
  }

  function openModal(title, body, opts) {
    opts = opts || {};
    setFontPanel(false);
    const root = $('#modalRoot');
    root.innerHTML = '<div class="modal-scrim" data-action="close-modal"></div>' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><div><h2>' + U.esc(title) + '</h2>' + (opts.sub ? '<p>' + opts.sub + '</p>' : '') + '</div><button class="icon-btn" data-action="close-modal" aria-label="关闭"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="modal-body">' + body + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    const focusable = root.querySelector('button, input, select, textarea');
    if (focusable) setTimeout(() => focusable.focus(), 30);
  }

  function closeModal() {
    const root = $('#modalRoot');
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
  }

  function openHelp() {
    openModal('快速指南', [
      '<p style="margin:0 0 14px;color:var(--text-2);font-size:12px;line-height:1.7">Prism 把高中物理的 21 个基本实验做成了可交互的模拟器。每个实验都提供实时读数、图像探究与实验向导。</p>',
      '<div class="api-list">',
      '<li>' + ui('info') + '<span><b>拖动变量</b>：右侧滑块会实时改变模拟，图像同步更新。</span></li>',
      '<li>' + ui('chart') + '<span><b>采集数据</b>：点击按钮记录一组数据，图表与数据表会自动累积。</span></li>',
      '<li>' + ui('play') + '<span><b>播放 / 暂停</b>：按 <kbd class="kbd-hint">空格</kbd> 控制运动类实验。</span></li>',
      '<li>' + ui('spark') + '<span><b>创意工坊</b>：用公式和变量设计自己的实验，并导出为 JSON 或插件。</span></li>',
      '<li><span style="font-weight:700;font-size:13px">Aa</span><span><b>字体大小</b>：右上角 Aa 可放大界面文字、画布标注与图表。</span></li>',
      '</div>',
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:10px;color:var(--text-3)">快捷键：⌘/Ctrl + K 搜索 · 空格 播放/暂停 · R 重置 · Esc 关闭</div>'
    ].join(''));
  }

  function openPalette() {
    const root = $('#paletteRoot');
    setFontPanel(false);
    state.paletteOpen = true;
    state.paletteIndex = 0;
    root.innerHTML = '<div class="palette-scrim" data-action="close-palette"></div>' +
      '<div class="palette" role="dialog" aria-modal="true">' +
      '<div class="search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input id="paletteInput" type="text" placeholder="搜索实验、概念或公式…" autocomplete="off"><span class="esc">ESC</span></div>' +
      '<div class="palette-list" id="paletteList"></div>' +
      '<div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>↵</kbd> 打开</span><span style="margin-left:auto">21 个实验 · 4 个领域</span></div>' +
      '</div>';
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    renderPalette('');
    const input = $('#paletteInput');
    setTimeout(() => input.focus(), 40);
    input.addEventListener('input', () => { state.paletteIndex = 0; renderPalette(input.value); });
    input.addEventListener('keydown', onPaletteKey);
  }

  function renderPalette(q) {
    const list = $('#paletteList');
    if (!list) return;
    q = (q || '').trim().toLowerCase();
    const items = allForSearch().filter((e) => {
      const hay = [e.title, e.short, e.description, e.formula, (e.tags || []).join(' '), catOf(e).name].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    });
    if (!items.length) {
      list.innerHTML = '<div class="empty-workshop"><p>没有找到匹配的实验</p></div>';
      return;
    }
    list.innerHTML = '<div class="palette-group-label">实验</div>' + items.map((e, i) => {
      const cat = catOf(e);
      return '<button class="palette-item' + (i === state.paletteIndex ? ' sel' : '') + '" data-palette-lab="' + e.id + '" style="--accent:' + cat.color + '">' +
        '<span class="pi-ico">' + OL.icon(e.icon) + '</span>' +
        '<span><strong>' + U.esc(e.title) + '</strong><span>' + U.esc(e.short) + '</span></span>' +
        '<span class="pi-tag">' + U.esc(cat.name) + '</span></button>';
    }).join('');
    $$('.palette-item', list).forEach((b) => {
      b.addEventListener('click', () => { closePalette(); navigate('lab/' + b.dataset.paletteLab); });
    });
    const sel = list.querySelector('.palette-item.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function onPaletteKey(e) {
    const items = $$('.palette-item');
    if (e.key === 'Escape') { closePalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); state.paletteIndex = Math.min(items.length - 1, state.paletteIndex + 1); updatePaletteSel(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); state.paletteIndex = Math.max(0, state.paletteIndex - 1); updatePaletteSel(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = items[state.paletteIndex];
      if (sel) { const id = sel.dataset.paletteLab; closePalette(); navigate('lab/' + id); }
    }
  }

  function updatePaletteSel() {
    const items = $$('.palette-item');
    items.forEach((b, i) => b.classList.toggle('sel', i === state.paletteIndex));
    if (items[state.paletteIndex]) items[state.paletteIndex].scrollIntoView({ block: 'nearest' });
  }

  function closePalette() {
    state.paletteOpen = false;
    const root = $('#paletteRoot');
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
  }

  /* ------------------------------------------------------------
     Router
     ------------------------------------------------------------ */
  function parseRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    if (!parts.length) return { name: 'home' };
    if (parts[0] === 'lab' && parts[1]) return { name: 'lab', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'workshop') return { name: 'workshop' };
    if (parts[0] === 'category' && parts[1]) return { name: 'library', filter: parts[1] };
    if (parts[0] === 'library') return { name: 'library' };
    return { name: 'home' };
  }

  function navigate(path) {
    const next = '#/' + String(path || 'home').replace(/^#?\/?/, '');
    if (location.hash === next) renderRoute(true);
    else location.hash = next;
  }

  function renderRoute(fromHash) {
    const r = parseRoute();
    if (r.name === 'lab') { renderLab(r.id); return; }
    teardownLab();
    if (state.heroStop) { state.heroStop(); state.heroStop = null; }
    viewEl.scrollTop = 0;
    if (r.name === 'home') {
      state.route = 'home'; state.filter = state.filter || 'all';
      renderHome(); setCrumb('<span>工作台</span><i>/</i><strong>概览</strong>'); setActiveNav('home');
    } else if (r.name === 'library') {
      state.route = 'library';
      if (r.filter) state.filter = r.filter;
      renderLibrary(); setCrumb('<span>工作台</span><i>/</i><strong>实验库</strong>'); setActiveNav('library', state.filter !== 'all' ? state.filter : null);
    } else if (r.name === 'workshop') {
      state.route = 'workshop';
      renderWorkshop(); setCrumb('<span>工作台</span><i>/</i><strong>创意工坊</strong>'); setActiveNav('workshop');
    } else {
      renderHome(); setCrumb('<span>工作台</span><i>/</i><strong>概览</strong>'); setActiveNav('home');
    }
    $('#topbar') && $('#topbar').classList.remove('scrolled');
    const tb = $('.topbar'); if (tb) tb.classList.remove('scrolled');
  }

  window.addEventListener('hashchange', () => renderRoute(false));

  /* ------------------------------------------------------------
     Cards & dashboard
     ------------------------------------------------------------ */
  function expCard(e) {
    const cat = catOf(e);
    const done = U.isDone(e.id);
    return '<button class="exp-card" data-lab="' + e.id + '" style="--accent:' + (e.accent || cat.color) + '">' +
      '<span class="exp-art"><span class="art-label">' + U.esc(cat.en) + '</span>' + OL.icon(e.icon) +
      '<span class="exp-num">' + pad(e.n || 0) + '</span>' +
      (done ? '<span class="done-mark">' + ui('check') + '</span>' : '') + '</span>' +
      '<span class="exp-body"><h3>' + U.esc(e.title) + '</h3><p>' + U.esc(e.short) + '</p>' +
      '<span class="exp-foot"><span class="tag">' + U.esc(e.difficulty || '基础') + '</span><span class="dotsep"></span><span class="tag">' + U.esc(e.time || '8 分钟') + '</span>' +
      '<span class="go">开始 ' + ui('arrow') + '</span></span></span></button>';
  }

  function filterChips() {
    const items = [['all', '全部'], ['mechanics', '力学'], ['electricity', '电磁学'], ['optics', '光学'], ['molecular', '热学与分子']];
    return items.map(([k, label]) => '<button class="filter-chip' + (state.filter === k ? ' active' : '') + '" data-filter="' + k + '">' + label + '</button>').join('');
  }

  function filteredExperiments() {
    if (state.filter === 'all') return OL.experiments.slice();
    return OL.byCategory(state.filter);
  }

  function renderHome() {
    const s = U.load();
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const last = resolveExp(s.last) || OL.experiments[0];
    const lastCat = catOf(last);
    viewEl.innerHTML = '<div class="view-inner">' +
      '<section class="hero">' +
      '<div class="hero-copy">' +
      '<span class="hero-badge"><i class="pulse"></i>21 个经典实验 · 全新交互引擎</span>' +
      '<h1>把每一个公式，<br><span class="grad">变成看得见的实验。</span></h1>' +
      '<p>从打点计时器到双缝干涉，用实时图像、可拖动的变量与微观动画，重新理解高中物理。</p>' +
      '<div class="hero-actions"><button class="btn primary-hero" data-action="continue">' + ui('play') + ' 继续实验</button><button class="btn secondary" data-action="open-workshop">' + ui('spark') + ' 创意工坊</button></div>' +
      '<div class="hero-meta"><div><strong>21</strong><span>实验</span></div><div><strong>4</strong><span>领域</span></div><div><strong>' + done + '</strong><span>已完成</span></div><div><strong>100%</strong><span>可交互</span></div></div>' +
      '</div>' +
      '<div class="hero-visual"><canvas id="heroOrbit"></canvas><div class="hero-caption"><i></i>LIVE SIMULATION ENGINE</div></div>' +
      '</section>' +
      '<div class="dash-grid">' +
      '<div class="continue-card card" data-lab="' + last.id + '" role="button" tabindex="0"><div class="continue-art">' + OL.icon(last.icon) + '</div><div class="continue-copy"><span class="eyebrow">' + (U.isDone(last.id) ? '再次实验' : '继续上次') + '</span><h3>' + U.esc(last.title) + '</h3><p>' + U.esc(lastCat.name) + ' · ' + U.esc(last.formula) + '</p></div><button class="btn small" data-lab="' + last.id + '">' + (U.isDone(last.id) ? '重新打开' : '继续') + ' ' + ui('arrow') + '</button></div>' +
      '<div class="quick-stats card">' +
      '<div class="quick-stat"><strong>' + done + '<span>/21</span></strong><em>完成实验</em></div>' +
      '<div class="quick-stat"><strong>' + done + '</strong><em>累计完成</em></div>' +
      '<div class="quick-stat"><strong>4</strong><em>学科领域</em></div>' +
      '</div></div>' +
      '<div class="section-head"><div><h2>实验库</h2><p>选择一个实验，开始你的探究</p></div><button class="section-link" data-route="library">查看全部 ' + ui('arrow') + '</button></div>' +
      '<div class="filter-row" id="homeFilters">' + filterChips() + '<span class="filter-spacer"></span><span class="filter-count" id="filterCount">' + filteredExperiments().length + ' 个实验</span></div>' +
      '<div class="experiment-grid" id="expGrid">' + filteredExperiments().map(expCard).join('') + '</div>' +
      '<section class="workshop-promo card"><div class="wp-ico">' + ui('spark') + '</div><div class="wp-copy"><span class="eyebrow">开放实验工坊</span><h3>不只是使用者，也成为实验设计者。</h3><p>用变量、公式与可视化画布搭建自己的物理实验，导入导出 JSON，或通过插件接口扩展 Prism。</p></div><button class="btn ghost" data-route="workshop">进入工坊 ' + ui('arrow') + '</button></section>' +
      '</div>';
    startHero();
  }

  function renderLibrary() {
    const s = U.load();
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const pct = Math.round(done / 21 * 100);
    viewEl.innerHTML = '<div class="view-inner">' +
      '<div class="page-head"><div><span class="eyebrow"><span class="dot"></span>EXPERIMENT LIBRARY</span><h1 class="page-title">21 个实验，<br>一条完整的物理脉络。</h1><p class="page-sub">力学、电磁学、光学与分子热学。每个实验都可以拖动变量、记录数据、生成图像。</p></div>' +
      '<div class="library-progress"><span class="ring" style="--p:' + pct + '%"></span><span><b style="color:var(--text)">' + done + '/21</b> 已完成</span></div></div>' +
      '<div class="category-strip">' + Object.keys(OL.categories).map((k) => {
        const c = OL.categories[k];
        const n = OL.byCategory(k).length;
        return '<button class="cat-card" data-cat="' + k + '" style="--cat:' + c.color + '"><span class="cat-ico">' + OL.icon(c.icon) + '</span><span><strong>' + c.name + '</strong><span>' + c.desc + '</span></span><span class="cat-n">' + pad(n) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="filter-row" id="libFilters">' + filterChips() + '<span class="filter-spacer"></span><span class="filter-count" id="filterCount">' + filteredExperiments().length + ' 个实验</span></div>' +
      '<div class="experiment-grid" id="expGrid">' + filteredExperiments().map(expCard).join('') + '</div>' +
      '</div>';
  }

  function applyFilter(cat) {
    state.filter = cat;
    $$('[data-filter]').forEach((b) => b.classList.toggle('active', b.dataset.filter === cat));
    const grid = $('#expGrid');
    if (grid) grid.innerHTML = filteredExperiments().map(expCard).join('');
    const count = $('#filterCount');
    if (count) count.textContent = filteredExperiments().length + ' 个实验';
    if (state.route === 'library') setActiveNav('library', cat !== 'all' ? cat : null);
  }

  /* ------------------------------------------------------------
     Hero orbit animation
     ------------------------------------------------------------ */
  function startHero() {
    const canvas = $('#heroOrbit');
    if (!canvas) return;
    let alive = true;
    const t0 = performance.now();
    const orbits = [
      { rx: 154, ry: 52, rot: -0.32, color: '#5ca8ff', speed: 0.34, phase: 0.4, label: 'F' },
      { rx: 132, ry: 64, rot: 0.9, color: '#bf8bff', speed: -0.26, phase: 2.1, label: 'λ' },
      { rx: 175, ry: 42, rot: 2.4, color: '#64d2ff', speed: 0.2, phase: 4.4, label: 'v' }
    ];
    function draw(now) {
      if (!alive) return;
      const c = C.prepare(canvas), ctx = c.ctx, w = c.w, h = c.h;
      const t = (now - t0) / 1000;
      const cx = w * 0.54, cy = h * 0.5;
      // ambient glow
      C.glowCircle(ctx, cx, cy, Math.min(w, h) * 0.52, '#2f6bff', 0.28);
      // orbit rings
      orbits.forEach((o) => {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(o.rot);
        ctx.strokeStyle = C.hexA(o.color, .14); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2); ctx.stroke();
        // ticks
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          const x1 = Math.cos(a) * o.rx, y1 = Math.sin(a) * o.ry;
          const k = 0.94;
          ctx.strokeStyle = C.hexA(o.color, .18); ctx.beginPath(); ctx.moveTo(x1 * k, y1 * k); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const a = t * o.speed + o.phase;
        const px = Math.cos(a) * o.rx, py = Math.sin(a) * o.ry;
        C.glowCircle(ctx, px, py, 17, o.color, .6);
        C.dot(ctx, px, py, 3.4, '#fff', 9);
        ctx.restore();
        const ca = Math.cos(o.rot), sa = Math.sin(o.rot);
        const wx = cx + px * ca - py * sa, wy = cy + px * sa + py * ca;
        C.label(ctx, o.label, wx + 10, wy - 9, { size: 8.5, color: o.color, mono: true, shadow: o.color });
      });
      // central prism
      ctx.save();
      ctx.translate(cx, cy);
      const grd = ctx.createLinearGradient(-38, -46, 34, 44);
      grd.addColorStop(0, 'rgba(255,255,255,.96)');
      grd.addColorStop(.4, 'rgba(175,215,255,.85)');
      grd.addColorStop(1, 'rgba(100,120,255,.38)');
      ctx.shadowColor = 'rgba(100,180,255,.65)'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(46, 38); ctx.lineTo(-46, 38); ctx.closePath();
      ctx.fillStyle = grd; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, 38); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-23, -2); ctx.lineTo(23, -2); ctx.stroke();
      ctx.restore();
      // central label
      C.label(ctx, '21', cx, cy + 72, { size: 9, align: 'center', color: 'rgba(255,255,255,.28)', mono: true });
      // floating formula labels
      const labels = [['F = ma', 0.14, 0.18, '#5ca8ff'], ['v = v₀ + at', 0.72, 0.22, '#64d2ff'], ['n = sin i / sin r', 0.72, 0.78, '#bf8bff'], ['E = mc²', 0.13, 0.76, '#ffb340']];
      labels.forEach(([txt, fx, fy, col]) => {
        ctx.save(); ctx.globalAlpha = .55 + Math.sin(t * .8 + fx * 8) * .12;
        ctx.font = '8.5px "SFMono-Regular", ui-monospace, monospace';
        ctx.fillStyle = col; ctx.textAlign = 'center';
        ctx.fillText(txt, w * fx, h * fy);
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    state.heroStop = () => { alive = false; };
  }

  /* ------------------------------------------------------------
     Workshop shell (implementation lives in workshop.js)
     ------------------------------------------------------------ */
  function renderWorkshop() {
    if (OL.workshop && OL.workshop.render) {
      viewEl.innerHTML = OL.workshop.render();
      if (OL.workshop.bind) OL.workshop.bind(viewEl);
    } else {
      viewEl.innerHTML = '<div class="view-inner"><div class="empty-state"><div class="es-icon">' + ui('spark') + '</div><h3>创意工坊加载中</h3><p>请刷新页面重试。</p></div></div>';
    }
  }

  /* ------------------------------------------------------------
     Lab runtime
     ------------------------------------------------------------ */
  function teardownLab() {
    const cur = state.currentLab;
    if (cur) {
      cur.alive = false;
      if (cur.raf) cancelAnimationFrame(cur.raf);
      if (cur.chart && cur.chart.ro) cur.chart.ro.disconnect();
      state.currentLab = null;
      state.lab = null;
    }
  }

  function defaultValue(c) { return c.type === 'select' || c.type === 'segmented' ? c.value : Number(c.value); }

  function makeState(exp) {
    const s = {};
    exp.controls.forEach((c) => { s[c.key] = defaultValue(c); });
    return s;
  }

  function controlHTML(c) {
    if (c.type === 'select') {
      return '<div class="control-row"><div class="control-top"><label>' + U.esc(c.label) + '</label></div>' +
        '<select class="control-select" data-control-select="' + c.key + '">' +
        c.options.map((o) => '<option value="' + U.esc(o.value) + '"' + (o.value === c.value ? ' selected' : '') + '>' + U.esc(o.label) + '</option>').join('') +
        '</select></div>';
    }
    if (c.type === 'segmented') {
      return '<div class="control-row"><div class="control-top"><label>' + U.esc(c.label) + '</label></div>' +
        '<div class="segmented" data-control-seg="' + c.key + '">' +
        c.options.map((o) => '<button data-seg-key="' + c.key + '" data-seg-value="' + U.esc(o.value) + '" class="' + (o.value === c.value ? 'active' : '') + '">' + U.esc(o.label) + '</button>').join('') +
        '</div></div>';
    }
    const dec = c.decimals == null ? 2 : c.decimals;
    return '<div class="control-row">' +
      '<div class="control-top"><label for="ctl-' + c.key + '">' + U.esc(c.label) + '</label><span class="control-value" id="val-' + c.key + '">' + U.fmt(c.value, dec) + '<span>' + U.esc(c.unit || '') + '</span></span></div>' +
      '<input id="ctl-' + c.key + '" data-control-range="' + c.key + '" type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + c.value + '" style="--fill:' + ((c.value - c.min) / (c.max - c.min) * 100) + '%">' +
      '</div>';
  }

  function renderLab(id) {
    teardownLab();
    viewEl.scrollTop = 0;
    if (state.heroStop) { state.heroStop(); state.heroStop = null; }
    const exp = resolveExp(id);
    const lab = OL.labs[id];
    if (!exp || !lab) {
      viewEl.innerHTML = '<div class="view-inner"><div class="empty-state"><div class="es-icon">' + ui('info') + '</div><h3>没有找到这个实验</h3><p>它可能来自尚未加载的插件。</p><button class="btn" data-route="library" style="margin-top:14px">返回实验库</button></div></div>';
      return;
    }
    state.route = 'lab'; state.lab = id;
    U.save({ last: id, visits: (U.load().visits || 0) + 1 });
    const st = makeState(exp);
    const view = {
      t: 0, playing: false, records: [], dirty: true, lastTs: performance.now(),
      autoClock: 0, lastSample: -1, active: true, tab: 'chart', chart: null,
      done: U.isDone(id)
    };
    const cat = catOf(exp);
    const stepHTML = exp.steps.map((s, i) => {
      const checked = (U.load().steps[id] || [])[i];
      return '<li class="step' + (checked ? ' done' : '') + '" data-step="' + i + '"><span class="step-check">' + (checked ? ui('check') : (i + 1)) + '</span><p>' + U.esc(s) + '</p></li>';
    }).join('');

    viewEl.innerHTML = '<div class="lab-page" style="--accent:' + (exp.accent || cat.color) + '">' +
      '<div class="lab-head"><div class="lab-head-left">' +
      '<button class="back-link" data-route="library">' + ui('back') + ' 返回实验库</button>' +
      '<div class="lab-title-row"><h1>' + U.esc(exp.title) + '</h1><span class="lab-id">#' + pad(exp.n || 0) + '</span><span class="pill accent">' + U.esc(cat.name) + '</span><span class="pill">' + U.esc(exp.difficulty || '基础') + '</span><span class="pill' + (view.done ? ' green' : '') + '" id="labDonePill">' + (view.done ? '已完成' : '进行中') + '</span></div>' +
      '<p class="lab-sub">' + U.esc(exp.description) + '</p></div>' +
      '<div class="lab-head-right"><button class="btn ghost small" data-action="mark-complete">' + ui('check') + ' 标记完成</button><button class="btn ghost small" data-action="csv">' + ui('download') + ' 导出数据</button></div></div>' +
      '<div class="lab-layout"><section class="stage-card" id="stageCard">' +
      '<div class="stage-top"><div class="stage-label"><span class="live paused" id="liveDot"></span><span id="stageStatus">测量就绪</span></div>' +
      '<div class="stage-tools">' + (canPlay(lab) ? '<button class="stage-play-inline" data-action="toggle-play" id="playBtn" title="播放 / 暂停">' + ui('play') + '</button><button class="stage-tool" data-action="reset" title="重置">' + ui('reset') + '</button>' : '') + '<button class="stage-tool" data-action="screenshot" title="保存图像"><svg viewBox="0 0 24 24"><path d="M4 8h4l1.5-2h5L16 8h4v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/></svg></button><button class="stage-tool" data-action="expand" title="全屏"><svg viewBox="0 0 24 24"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg></button></div></div>' +
      '<div class="stage-wrap"><canvas id="labCanvas"></canvas></div>' +
      (canPlay(lab) ? '<div class="stage-tip"><kbd>SPACE</kbd> 播放 / 暂停</div>' : '') +
      '<div class="stage-readouts" id="stageReadouts"></div></section>' +
      '<aside class="side-stack"><section class="control-card card"><div class="card-head"><h3>实验变量</h3><span class="sub">实时调节</span></div><div class="controls" id="controls">' + exp.controls.map(controlHTML).join('') + '</div><div class="card-actions"><button class="btn record" data-action="record"><span class="record-dot"></span>采集数据</button><button class="btn ghost small" data-action="reset">' + ui('reset') + '</button></div></section>' +
      '<section class="metric-card card"><div class="card-head"><h3>实时读数</h3><span class="sub">LIVE</span></div><div class="metric-grid" id="metricGrid"></div><div class="control-note" style="margin:11px 0 0"><span>' + ui('info') + '</span><span>' + U.esc(lab.hint || '拖动变量，观察图像如何响应。') + '</span></div></section></aside></div>' +
      '<div class="lab-bottom"><section class="viz-card card"><div class="viz-head"><div><h3>数据与图像</h3><div class="sub" id="chartSub">实时绘制</div></div><div class="viz-tabs"><button class="active" data-tab="chart">' + ui('chart') + ' 图像</button><button data-tab="table">' + ui('table') + ' 数据表 <span id="recordCount">0</span></button></div></div>' +
      '<div class="chart-wrap" id="chartWrap"><canvas id="labChart"></canvas><div class="chart-tooltip" id="chartTip"></div></div>' +
      '<div class="data-table-wrap" id="dataTableWrap"></div>' +
      '<div class="chart-foot" id="chartFoot"></div></section>' +
      '<section class="guide-card card"><div class="guide-head"><h3>实验向导</h3><p>点击步骤可标记完成</p></div><ol class="steps" id="steps">' + stepHTML + '</ol><div class="conclusion" id="conclusion">' + ui('info') + '<span>调整变量并采集数据，结论会在这里更新。</span></div><div class="theory"><div class="eyebrow">实验原理</div><div class="formula-box"><span>' + U.esc(exp.formula) + '</span><button class="icon-btn copy-code" data-copy="' + U.esc(exp.formula) + '" title="复制公式">' + ui('copy') + '</button></div><p>' + U.esc(exp.formulaNote || exp.principle) + '</p></div></section></div>' +
      '</div>';

    const current = state.currentLab = {
      id, exp, lab, state: st, view, alive: true,
      canvas: $('#labCanvas'), chartCanvas: $('#labChart'), chart: null, raf: null
    };
    view.view = view;
    view.state = st;
    view.el = current;

    if (lab.init) lab.init.call(lab, st, view);
    if (lab.playable === false) view.playing = false;

    const chart = new OL.Chart(current.chartCanvas, $('#chartTip'));
    current.chart = chart;
    view.chart = chart;
    updateAll();
    updatePlayButton();
    startLabLoop();
    setActiveNav('library', exp.category !== 'custom' ? exp.category : null);
    setCrumb('<span>实验库</span><i>/</i><strong>' + U.esc(exp.title) + '</strong>');
    bindLabEvents();
  }

  function bindLabEvents() {
    const cur = state.currentLab;
    if (!cur) return;
    const controls = $('#controls');
    if (controls) {
      controls.addEventListener('input', (e) => {
        const range = e.target.closest('input[data-control-range]');
        if (!range) return;
        const key = range.dataset.controlRange;
        const c = cur.exp.controls.find((x) => x.key === key);
        const val = Number(range.value);
        cur.state[key] = val;
        const out = $('#val-' + key);
        if (out) out.innerHTML = U.fmt(val, c.decimals == null ? 2 : c.decimals) + '<span>' + U.esc(c.unit || '') + '</span>';
        range.style.setProperty('--fill', ((val - c.min) / (c.max - c.min) * 100) + '%');
        if (cur.lab.onControl) cur.lab.onControl.call(cur.lab, key, cur.state, cur.view);
        cur.view.dirty = true;
        updatePlayButton();
        updateReadouts();
        schedulePlot();
        scheduleConclusion();
      });
      controls.addEventListener('change', (e) => {
        const sel = e.target.closest('select[data-control-select]');
        if (!sel) return;
        const key = sel.dataset.controlSelect;
        cur.state[key] = sel.value;
        if (cur.lab.onControl) cur.lab.onControl.call(cur.lab, key, cur.state, cur.view);
        cur.view.dirty = true;
        updatePlayButton(); updateReadouts(); schedulePlot(); scheduleConclusion();
      });
      controls.addEventListener('click', (e) => {
        const b = e.target.closest('[data-seg-key]');
        if (!b) return;
        const key = b.dataset.segKey;
        cur.state[key] = b.dataset.segValue;
        $$('[data-control-seg="' + key + '"] button', controls).forEach((x) => x.classList.toggle('active', x === b));
        if (cur.lab.onControl) cur.lab.onControl.call(cur.lab, key, cur.state, cur.view);
        cur.view.dirty = true;
        updatePlayButton(); updateReadouts(); schedulePlot(); scheduleConclusion();
      });
    }
    const wrap = $('#chartWrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => { if (cur.view.tab === 'chart') cur.chart.draw(); });
      ro.observe(wrap);
      cur.chart.ro2 = ro;
    }
  }

  function schedulePlot() {
    const cur = state.currentLab;
    if (!cur) return;
    if (!cur._plotTimer) {
      cur._plotTimer = setTimeout(() => {
        cur._plotTimer = null;
        updateChart();
      }, 70);
    }
  }

  function scheduleConclusion() {
    const cur = state.currentLab;
    if (!cur) return;
    if (!cur._conclTimer) {
      cur._conclTimer = setTimeout(() => {
        cur._conclTimer = null;
        updateConclusion();
      }, 120);
    }
  }

  function startLabLoop() {
    const cur = state.currentLab;
    if (!cur) return;
    let lastReadout = 0, lastChart = 0, lastTable = 0;
    function loop(now) {
      if (!cur.alive || state.currentLab !== cur) return;
      const dt = Math.min(0.04, Math.max(0, (now - cur.view.lastTs) / 1000));
      cur.view.lastTs = now;
      if (cur.view.playing) {
        if (cur.lab.step) {
          cur.lab.step.call(cur.lab, cur.state, dt, cur.view);
          cur.view.dirty = true;
        }
        if (cur.lab.live) {
          cur.view.autoClock += dt;
          if (cur.view.autoClock >= 0.12) {
            cur.view.autoClock = 0;
            appendRecord(true);
          }
        }
        if (!cur.view.playing) updatePlayButton();
      }
      if (cur.view.dirty) {
        drawStage();
        if (now - lastReadout > 100) { lastReadout = now; updateReadouts(); }
        if (now - lastChart > 200) { lastChart = now; updateChart(); }
        if (cur.view.tab === 'table' && now - lastTable > 700) { lastTable = now; renderTable(); }
        cur.view.dirty = false;
      }
      cur.raf = requestAnimationFrame(loop);
    }
    cur.raf = requestAnimationFrame(loop);
  }

  function drawStage() {
    const cur = state.currentLab;
    if (!cur || !cur.canvas) return;
    const c = C.prepare(cur.canvas);
    try {
      cur.lab.draw.call(cur.lab, c.ctx, c.w, c.h, cur.state, cur.view);
    } catch (err) {
      console.error('[Prism lab]', err && err.stack ? err.stack : err);
      const ctx = c.ctx;
      ctx.fillStyle = 'rgba(255,80,80,.1)'; ctx.fillRect(0, 0, c.w, c.h);
      C.label(ctx, '模拟器绘制出错：' + err.message, c.w / 2, c.h / 2, { align: 'center', color: '#ff8a80', size: 11 });
    }
  }

  function updatePlayButton() {
    const cur = state.currentLab;
    if (!cur) return;
    const btn = $('#playBtn');
    if (btn) btn.innerHTML = cur.view.playing ? ui('pause') : ui('play');
    const dot = $('#liveDot');
    if (dot) dot.classList.toggle('paused', !cur.view.playing);
    const st = $('#stageStatus');
    if (st) st.textContent = cur.view.playing ? '运行中' : (canPlay(cur.lab) ? '已暂停' : '测量就绪');
  }

  function updateReadouts() {
    const cur = state.currentLab;
    if (!cur) return;
    let rows = [];
    try { rows = cur.lab.readouts.call(cur.lab, cur.state, cur.view) || []; } catch (e) { rows = []; }
    const html = rows.map((r) => {
      const v = typeof r.value === 'number' ? U.fmt(r.value, 2) : r.value;
      return '<div class="readout"><em>' + U.esc(r.label) + '</em><strong>' + U.esc(v) + (r.unit ? '<span>' + U.esc(r.unit) + '</span>' : '') + '</strong></div>';
    }).join('');
    const sr = $('#stageReadouts'); if (sr) sr.innerHTML = html;
    const mg = $('#metricGrid');
    if (mg) mg.innerHTML = rows.slice(0, 4).map((r) => {
      const v = typeof r.value === 'number' ? U.fmt(r.value, 2) : r.value;
      return '<div class="metric"><em>' + U.esc(r.label) + '</em><strong>' + U.esc(v) + (r.unit ? '<span>' + U.esc(r.unit) + '</span>' : '') + '</strong></div>';
    }).join('');
  }

  function updateChart() {
    const cur = state.currentLab;
    if (!cur) return;
    let model;
    try {
      model = cur.lab.plot.call(cur.lab, cur.state, cur.view);
    } catch (e) {
      console.warn(e);
      model = { xLabel: 'x', yLabel: 'y', series: [] };
    }
    model = model || { xLabel: 'x', yLabel: 'y', series: [] };
    if (!model.series) model.series = [];
    cur.lastModel = model;
    cur.chart.setModel(model);
    const sub = $('#chartSub');
    if (sub) sub.textContent = (model.yLabel || 'y') + ' — ' + (model.xLabel || 'x');
    const foot = $('#chartFoot');
    if (foot) {
      const legends = [];
      const seen = {};
      model.series.forEach((s) => {
        if (!s || !s.name || seen[s.name]) return;
        seen[s.name] = 1;
        if (legends.length < 4) legends.push('<span class="legend"><i style="background:' + (s.color || '#5ca8ff') + '"></i>' + U.esc(s.name) + '</span>');
      });
      foot.innerHTML = legends.join('') + '<span class="spacer"></span><span>' + (cur.view.records.length ? cur.view.records.length + ' 组数据' : '尚未采集') + '</span><button class="csv-btn" data-action="csv">' + ui('download') + ' CSV</button>';
    }
    const rc = $('#recordCount'); if (rc) rc.textContent = cur.view.records.length;
    updateConclusion();
  }

  function appendRecord(auto) {
    const cur = state.currentLab;
    if (!cur) return;
    let row;
    try { row = cur.lab.sample.call(cur.lab, cur.state, cur.view); } catch (e) { return; }
    if (!row) return;
    cur.view.records.push(row);
    if (cur.view.records.length > 400) cur.view.records.shift();
    if (!auto) {
      toast('已记录第 ' + cur.view.records.length + ' 组数据');
      if (cur.view.records.length >= 3) markComplete(cur.exp, true);
      cur.view.dirty = true;
      updateChart();
      if (cur.view.tab === 'table') renderTable();
    } else if (cur.view.records.length === 8) {
      markComplete(cur.exp, true);
    }
    const rc = $('#recordCount'); if (rc) rc.textContent = cur.view.records.length;
  }

  function formatCell(v, col) {
    if (typeof v === 'number') {
      const dec = col.decimals == null ? 2 : col.decimals;
      return U.fmt(v, dec);
    }
    return U.esc(v == null ? '—' : v);
  }

  function renderTable() {
    const cur = state.currentLab;
    if (!cur) return;
    const wrap = $('#dataTableWrap');
    if (!wrap) return;
    if (!cur.view.records.length) {
      wrap.innerHTML = '<div class="empty-data">' + ui('table') + '<span>还没有数据，点击「采集数据」记录第一组。</span></div>';
      return;
    }
    const cols = cur.lab.columns || [];
    const head = '<tr><th>#</th>' + cols.map((c) => '<th>' + U.esc(c.label) + (c.unit ? ' / ' + U.esc(c.unit) : '') + '</th>').join('') + '</tr>';
    const rows = cur.view.records.slice(-150).map((r, i) => '<tr><td>' + (cur.view.records.length - Math.min(150, cur.view.records.length) + i + 1) + '</td>' + cols.map((c) => '<td>' + formatCell(r[c.key], c) + '</td>').join('') + '</tr>').join('');
    wrap.innerHTML = '<table class="data-table"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  }

  function updateConclusion() {
    const cur = state.currentLab;
    if (!cur) return;
    const el = $('#conclusion');
    if (!el) return;
    let text = '';
    try { text = cur.lab.conclusion.call(cur.lab, cur.state, cur.view) || ''; } catch (e) { text = ''; }
    el.innerHTML = ui('info') + '<span>' + (text || '调整变量并采集数据，结论会在这里更新。') + '</span>';
  }

  function updateAll() {
    const cur = state.currentLab;
    if (!cur) return;
    drawStage();
    updateReadouts();
    updateChart();
    renderTable();
    updateConclusion();
    updatePlayButton();
  }

  function markComplete(exp, forceToast) {
    if (!exp) return;
    const was = U.isDone(exp.id);
    if (!was) {
      U.complete(exp.id);
      syncProgress();
      const pill = $('#labDonePill');
      if (pill) { pill.className = 'pill green'; pill.textContent = '已完成'; }
      if (forceToast !== false) toast('实验已完成：' + exp.title);
    }
    if (state.route === 'lab' && state.currentLab) {
      const pill = $('#labDonePill');
      if (pill) { pill.className = 'pill green'; pill.textContent = '已完成'; }
    }
  }

  function resetLab() {
    const cur = state.currentLab;
    if (!cur) return;
    Object.keys(cur.state).forEach((k) => delete cur.state[k]);
    Object.assign(cur.state, makeState(cur.exp));
    cur.view.t = 0; cur.view.playing = false; cur.view.records = []; cur.view.autoClock = 0;
    cur.view.dirty = true;
    if (cur.lab.init) cur.lab.init.call(cur.lab, cur.state, cur.view);
    // sync controls
    cur.exp.controls.forEach((c) => {
      if (c.type === 'select') {
        const sel = $('[data-control-select="' + c.key + '"]');
        if (sel) sel.value = c.value;
      } else if (c.type === 'segmented') {
        $$('[data-control-seg="' + c.key + '"] button').forEach((b) => b.classList.toggle('active', b.dataset.segValue === c.value));
      } else {
        const inp = $('[data-control-range="' + c.key + '"]');
        if (inp) {
          inp.value = c.value;
          inp.style.setProperty('--fill', ((c.value - c.min) / (c.max - c.min) * 100) + '%');
          const out = $('#val-' + c.key);
          if (out) out.innerHTML = U.fmt(c.value, c.decimals == null ? 2 : c.decimals) + '<span>' + U.esc(c.unit || '') + '</span>';
        }
      }
    });
    updateAll();
    toast('实验已重置');
  }

  function exportCSV() {
    const cur = state.currentLab;
    if (!cur) return;
    if (!cur.view.records.length) { toast('还没有可导出的数据', 'error'); return; }
    const cols = cur.lab.columns || [];
    const rows = [['#', ...cols.map((c) => c.label + (c.unit ? ' / ' + c.unit : ''))]];
    cur.view.records.forEach((r, i) => rows.push([i + 1, ...cols.map((c) => r[c.key])]));
    U.download('prism-' + cur.id + '-data.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
    toast('数据已导出为 CSV');
  }

  function screenshot() {
    const cur = state.currentLab;
    if (!cur || !cur.canvas) return;
    const a = document.createElement('a');
    a.download = 'prism-' + cur.id + '.png';
    a.href = cur.canvas.toDataURL('image/png');
    a.click();
    toast('实验图像已保存');
  }

  /* ------------------------------------------------------------
     Global events
     ------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const route = e.target.closest('[data-route]');
    if (route) {
      const path = route.dataset.route;
      closeMobile();
      if (path === 'home' || path === 'library' || path === 'workshop') navigate(path);
      return;
    }
    const lab = e.target.closest('[data-lab]');
    if (lab) { closeMobile(); navigate('lab/' + lab.dataset.lab); return; }
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.filter = cat.dataset.cat;
      closeMobile();
      if (state.route === 'library') { applyFilter(state.filter); }
      else navigate('library');
      return;
    }
    const filter = e.target.closest('[data-filter]');
    if (filter) { applyFilter(filter.dataset.filter); return; }
    const step = e.target.closest('[data-step]');
    if (step && state.currentLab) {
      const i = Number(step.dataset.step);
      const s = U.load();
      s.steps = s.steps || {};
      const arr = s.steps[state.currentLab.id] || [];
      arr[i] = !arr[i];
      s.steps[state.currentLab.id] = arr;
      U.save({ steps: s.steps });
      step.classList.toggle('done', !!arr[i]);
      step.querySelector('.step-check').innerHTML = arr[i] ? ui('check') : (i + 1);
      if (arr.length === state.currentLab.exp.steps.length && arr.every(Boolean)) markComplete(state.currentLab.exp, true);
      return;
    }
    const tab = e.target.closest('[data-tab]');
    if (tab && state.currentLab) {
      const which = tab.dataset.tab;
      state.currentLab.view.tab = which;
      $$('.viz-tabs button').forEach((b) => b.classList.toggle('active', b === tab));
      $('#chartWrap').style.display = which === 'chart' ? '' : 'none';
      $('#dataTableWrap').classList.toggle('show', which === 'table');
      $('#chartFoot').style.display = which === 'chart' ? '' : 'none';
      if (which === 'chart') setTimeout(() => state.currentLab && state.currentLab.chart.draw(), 30);
      if (which === 'table') renderTable();
      return;
    }
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const text = copy.dataset.copy;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('公式已复制')).catch(() => toast('复制失败', 'error'));
      else toast(text);
      return;
    }
    const act = e.target.closest('[data-action]');
    if (act) {
      const action = act.dataset.action;
      if (action === 'continue') { const last = resolveExp(U.load().last) || OL.experiments[0]; navigate('lab/' + last.id); }
      else if (action === 'open-workshop') navigate('workshop');
      else if (action === 'close-modal') closeModal();
      else if (action === 'close-palette') closePalette();
      else if (action === 'toggle-play' && state.currentLab) {
        const v = state.currentLab.view;
        v.playing = !v.playing;
        if (v.playing) {
          v.lastTs = performance.now();
          v.autoClock = 0;
          if (state.currentLab.lab.live && !v.records.length) appendRecord(true);
        }
        updatePlayButton();
        v.dirty = true;
      }
      else if (action === 'reset' && state.currentLab) resetLab();
      else if (action === 'record' && state.currentLab) appendRecord(false);
      else if (action === 'mark-complete' && state.currentLab) markComplete(state.currentLab.exp, true);
      else if (action === 'csv') { if (state.currentLab) exportCSV(); else if (OL.workshop) OL.workshop.exportAll(); }
      else if (action === 'screenshot') screenshot();
      else if (action === 'expand') {
        const card = $('#stageCard');
        if (card) {
          if (!document.fullscreenElement) card.requestFullscreen && card.requestFullscreen();
          else document.exitFullscreen && document.exitFullscreen();
        }
      }
      return;
    }
    // palette item fallback
    const pItem = e.target.closest('[data-palette-lab]');
    if (pItem) { closePalette(); navigate('lab/' + pItem.dataset.paletteLab); }
    if (e.target.closest('.modal-scrim') || e.target.closest('.palette-scrim')) { closeModal(); closePalette(); }
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') {
      if (state.paletteOpen) closePalette();
      setFontPanel(false);
      const mr = $('#modalRoot');
      if (mr && mr.classList.contains('open')) closeModal();
      closeMobile();
      return;
    }
    if (typing) return;
    if (e.key === ' ' && state.currentLab && canPlay(state.currentLab.lab)) {
      e.preventDefault();
      const btn = $('#playBtn'); if (btn) btn.click();
    }
    if ((e.key === 'r' || e.key === 'R') && state.currentLab) { e.preventDefault(); resetLab(); }
    if ((e.key === 'f' || e.key === 'F') && state.currentLab) { e.preventDefault(); const b = $('[data-action="expand"]'); if (b) b.click(); }
  });

  window.addEventListener('resize', U.throttle(() => {
    if (state.currentLab) { state.currentLab.view.dirty = true; state.currentLab.chart.draw(); }
  }, 120));

  // Make wheel scrolling reliable everywhere outside genuinely scrollable overlays.
  window.addEventListener('wheel', (e) => {
    if (e.defaultPrevented || e.ctrlKey || Math.abs(e.deltaY) < 0.5) return;
    if (!(e.target instanceof Element)) return;
    if ($('#modalRoot').classList.contains('open') || state.paletteOpen) return;
    const ownScroll = e.target.closest('.data-table-wrap, .sidebar-scroll, .font-pop');
    if (ownScroll && ownScroll.scrollHeight > ownScroll.clientHeight + 2) return;
    if (e.target.closest('.font-pop') || e.target.closest('.modal, .palette')) return;
    if (viewEl.scrollHeight <= viewEl.clientHeight + 2) return;
    const delta = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * viewEl.clientHeight : e.deltaY;
    const before = viewEl.scrollTop;
    viewEl.scrollTop = before + delta;
    if (viewEl.scrollTop !== before) e.preventDefault();
  }, { passive: false });

  $('#fontBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const pop = $('#fontPop');
    setFontPanel(pop ? pop.hidden : false);
  });
  $$('.font-options button').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      applyFontScale(Number(b.dataset.font), true);
      setFontPanel(false);
      toast('字体大小已调整为 ' + Math.round(Number(b.dataset.font) * 100) + '%');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.font-wrap')) setFontPanel(false);
  });

  $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
  $('#searchBtn').addEventListener('click', openPalette);
  $('#helpBtn').addEventListener('click', openHelp);
  const focusBtn = $('#focusBtn');
  if (focusBtn) focusBtn.addEventListener('click', () => {
    state.focus = !state.focus;
    document.body.classList.toggle('focus-mode', state.focus);
    focusBtn.querySelector('span:last-child').textContent = state.focus ? '退出专注' : '实验模式';
    setTimeout(() => { if (state.currentLab) { state.currentLab.view.dirty = true; state.currentLab.chart.draw(); } }, 320);
  });
  $('#menuBtn').addEventListener('click', () => {
    sidebar.classList.add('open'); scrim.classList.add('show');
  });
  scrim.addEventListener('click', closeMobile);
  viewEl.addEventListener('scroll', () => {
    const topbar = $('.topbar');
    if (topbar) topbar.classList.toggle('scrolled', viewEl.scrollTop > 8);
  });
  window.addEventListener('beforeunload', () => { if (state.currentLab) state.currentLab.alive = false; });

  function closeMobile() {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  applyTheme(state.theme, false);
  applyFontScale(state.fontScale, false);
  syncProgress();
  if (!location.hash) renderRoute(false);
  else renderRoute(false);
})();
