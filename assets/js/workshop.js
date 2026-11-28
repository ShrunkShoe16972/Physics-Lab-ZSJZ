/* ============================================================
   Prism · creative workshop
   Visual experiment designer + JSON / plugin ingress.
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const U = OL.utils;
  const C = OL.canvas;
  const esc = U.esc;

  const ACCENTS = [
    { value: '#5e5ce6', label: '棱镜紫' },
    { value: '#0a84ff', label: '深海蓝' },
    { value: '#30d158', label: '荧光绿' },
    { value: '#ff9f0a', label: '琥珀橙' },
    { value: '#ff375f', label: '珊瑚红' }
  ];

  let _custom = null;
  let _initialized = false;

  function defaults() {
    return {
      name: '简谐运动演示',
      description: '用正弦函数描述一个质点在平衡位置附近的往复运动。改变振幅与平衡位置，观察曲线如何变化。',
      expression: 'a * sin(t) + b',
      yLabel: '位移', yUnit: 'cm',
      tLabel: '时间', tUnit: 's', tMin: 0, tMax: 6.28, tStep: 0.01, tValue: 1.57,
      aLabel: '振幅 A', aMin: 0.1, aMax: 5, aStep: 0.1, aValue: 2, aUnit: 'cm',
      bLabel: '平衡位置 b', bMin: -2, bMax: 2, bStep: 0.1, bValue: 0, bUnit: 'cm',
      accent: '#5e5ce6'
    };
  }

  function strip(spec) {
    const out = {};
    Object.keys(spec).forEach((k) => { if (k[0] !== '_' && typeof spec[k] !== 'function') out[k] = spec[k]; });
    return out;
  }

  function specToExperiment(spec) {
    return {
      id: spec.id, n: 0, title: spec.name, short: spec.description || ('自定义实验 · ' + spec.expression),
      category: 'custom', accent: spec.accent || '#5e5ce6', icon: 'spark',
      difficulty: '公式实验', time: '自主设计', tags: ['创意工坊', '自定义实验'],
      description: spec.description || '由 Prism 创意工坊生成的自定义实验。',
      formula: 'y = ' + spec.expression,
      formulaNote: '自定义函数关系：改变自变量与参数，图像会实时变化。',
      principle: '这是一个由用户定义的函数实验。通过改变参数，观察自变量与因变量之间的关系。',
      steps: ['选择自变量 t 的取值', '调节参数 a 与 b', '采集数据并观察图像', '总结 y 随 t 的变化规律'],
      controls: [
        { key: 't', label: spec.tLabel, min: Number(spec.tMin), max: Number(spec.tMax), step: Number(spec.tStep), value: Number(spec.tValue), unit: spec.tUnit, decimals: 2 },
        { key: 'a', label: spec.aLabel, min: Number(spec.aMin), max: Number(spec.aMax), step: Number(spec.aStep), value: Number(spec.aValue), unit: spec.aUnit, decimals: 2 },
        { key: 'b', label: spec.bLabel, min: Number(spec.bMin), max: Number(spec.bMax), step: Number(spec.bStep), value: Number(spec.bValue), unit: spec.bUnit, decimals: 2 }
      ]
    };
  }

  function buildLab(spec) {
    const compiled = OL.expr.compile(spec.expression, ['t', 'a', 'b']);
    const exp = specToExperiment(spec);
    function yOf(st) {
      const y = compiled.eval({ t: st.t, a: st.a, b: st.b });
      return isFinite(y) ? y : NaN;
    }
    return {
      id: spec.id,
      live: false,
      playable: false,
      hint: '调节 t、a、b · 观察函数曲线与数据表',
      draw(ctx, w, h, state, view) {
        C.grid(ctx, w, h, { step: 34 });
        const f = OL.labKit.frame(ctx, w, h);
        const x0 = 108, x1 = 820, y0 = 372, y1 = 68;
        const tMin = Number(spec.tMin), tMax = Number(spec.tMax);
        const pts = [];
        let ymin = Infinity, ymax = -Infinity;
        for (let i = 0; i <= 160; i++) {
          const t = tMin + (tMax - tMin) * i / 160;
          const y = compiled.eval({ t, a: state.a, b: state.b });
          if (isFinite(y)) { pts.push({ x: t, y }); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
        }
        if (!isFinite(ymin)) { ymin = -1; ymax = 1; }
        if (ymin === ymax) { ymin -= 1; ymax += 1; }
        const padY = (ymax - ymin) * 0.12;
        ymin -= padY; ymax += padY;
        if (ymin > 0) ymin = 0;
        if (ymax < 0) ymax = 0;
        const X = (t) => x0 + (t - tMin) / (tMax - tMin || 1) * (x1 - x0);
        const Y = (y) => y0 - (y - ymin) / (ymax - ymin || 1) * (y0 - y1);
        // grid
        for (let i = 0; i <= 5; i++) {
          const gx = x0 + (x1 - x0) * i / 5;
          C.line(ctx, gx, y1, gx, y0, 'rgba(255,255,255,.045)', 1);
          const gy = y1 + (y0 - y1) * i / 5;
          C.line(ctx, x0, gy, x1, gy, 'rgba(255,255,255,.045)', 1);
        }
        C.axis(ctx, x0, y0, x1 - x0, y0 - y1, { color: 'rgba(190,215,255,.22)' });
        C.label(ctx, spec.tLabel + ' / ' + spec.tUnit, x1, y0 + 22, { size: 8, align: 'right', color: 'rgba(230,240,255,.4)' });
        C.label(ctx, spec.yLabel + ' / ' + spec.yUnit, 64, y1 + 4, { size: 8, color: 'rgba(230,240,255,.4)' });
        // zero line
        if (ymin < 0 && ymax > 0) C.line(ctx, x0, Y(0), x1, Y(0), 'rgba(255,255,255,.12)', 1, [4, 4]);
        // ticks
        for (let i = 0; i <= 5; i++) {
          const tv = tMin + (tMax - tMin) * i / 5;
          C.label(ctx, U.fmt(tv, 1), X(tv), y0 + 13, { size: 7, align: 'center', color: 'rgba(230,240,255,.28)', mono: true });
        }
        // curve
        ctx.save();
        ctx.beginPath();
        pts.forEach((p, i) => { if (i === 0) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y)); });
        ctx.strokeStyle = spec.accent || '#5e5ce6'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
        ctx.shadowColor = C.hexA(spec.accent || '#5e5ce6', .5); ctx.shadowBlur = 10; ctx.stroke(); ctx.restore();
        // current point
        const y = yOf(state);
        C.line(ctx, X(state.t), y1, X(state.t), y0, C.hexA(spec.accent || '#5e5ce6', .25), 1, [3, 3]);
        if (isFinite(y)) {
          C.glowCircle(ctx, X(state.t), Y(y), 22, spec.accent || '#5e5ce6', .4);
          C.dot(ctx, X(state.t), Y(y), 4.6, '#fff', 10);
          C.label(ctx, 'y = ' + U.fmt(y, 3), X(state.t) + 9, Y(y) - 10, { size: 9, color: '#fff', mono: true });
        }
        // title / formula
        C.fillRound(ctx, 70, 36, 410, 74, 13, 'rgba(9,15,26,.58)');
        C.label(ctx, spec.name, 88, 62, { size: 12, color: '#eef4ff', weight: 600 });
        C.label(ctx, 'y = ' + spec.expression, 88, 88, { size: 9.5, color: spec.accent || '#9b97ff', mono: true });
        C.label(ctx, 't = ' + U.fmt(state.t, 2) + ' ' + spec.tUnit, 816, 62, { size: 9, align: 'right', color: 'rgba(230,240,255,.45)', mono: true });
        C.label(ctx, 'a = ' + U.fmt(state.a, 2) + '   b = ' + U.fmt(state.b, 2), 816, 82, { size: 8.5, align: 'right', color: 'rgba(230,240,255,.3)', mono: true });
        f.restore();
      },
      readouts(state) {
        const y = yOf(state);
        return [
          { label: spec.yLabel, value: isFinite(y) ? U.fmt(y, 3) : '—', unit: spec.yUnit },
          { label: spec.tLabel, value: U.fmt(state.t, 2), unit: spec.tUnit },
          { label: spec.aLabel, value: U.fmt(state.a, 2), unit: spec.aUnit },
          { label: spec.bLabel, value: U.fmt(state.b, 2), unit: spec.bUnit }
        ];
      },
      sample(state) { return { t: state.t, y: yOf(state), a: state.a, b: state.b }; },
      columns: [
        { key: 't', label: spec.tLabel, unit: spec.tUnit, decimals: 2 },
        { key: 'y', label: spec.yLabel, unit: spec.yUnit, decimals: 4 },
        { key: 'a', label: spec.aLabel, unit: spec.aUnit, decimals: 2 },
        { key: 'b', label: spec.bLabel, unit: spec.bUnit, decimals: 2 }
      ],
      plot(state, view) {
        const tMin = Number(spec.tMin), tMax = Number(spec.tMax);
        const pts = [];
        for (let i = 0; i <= 120; i++) {
          const t = tMin + (tMax - tMin) * i / 120;
          pts.push({ x: t, y: compiled.eval({ t, a: state.a, b: state.b }) });
        }
        return {
          xLabel: spec.tLabel, yLabel: spec.yLabel, xUnit: spec.tUnit, yUnit: spec.yUnit,
          xMin: tMin, xMax: tMax,
          series: [
            OL.labKit.series(pts, 'y = ' + spec.expression, spec.accent || '#5e5ce6', { width: 2, fill: true }),
            OL.labKit.scatter(view.records, 't', 'y', '测量点', '#ffffff', { pointSize: 3 })
          ]
        };
      },
      conclusion(state) {
        const y = yOf(state);
        return '<b>自定义实验：</b>当 t = ' + U.fmt(state.t, 2) + ' ' + spec.tUnit + '，a = ' + U.fmt(state.a, 2) + '，b = ' + U.fmt(state.b, 2) + ' 时，y = <b>' + (isFinite(y) ? U.fmt(y, 3) : '—') + ' ' + spec.yUnit + '</b>。改变参数，观察图像形状如何响应。';
      }
    };
  }

  function register(spec, silent) {
    if (!spec || !spec.id) return null;
    if (!OL.labs[spec.id]) {
      spec._compiled = OL.expr.compile(spec.expression, ['t', 'a', 'b']);
      OL.registerLab(buildLab(spec));
    }
    if (!_custom.find((s) => s.id === spec.id)) _custom.push(spec);
    return spec;
  }

  function hydrate() {
    if (_initialized) return;
    _initialized = true;
    _custom = [];
    const stored = U.load().custom || [];
    stored.forEach((s) => { try { register(s, true); } catch (e) { console.warn('custom experiment', e); } });
  }

  function persist() {
    U.save({ custom: _custom.map(strip) });
  }

  function add(spec) {
    hydrate();
    if (!spec.id) spec.id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    spec.n = 0;
    spec.category = 'custom';
    spec.icon = spec.icon || 'spark';
    spec.accent = spec.accent || '#5e5ce6';
    spec.difficulty = spec.difficulty || '自定义';
    spec.time = spec.time || '自主设计';
    spec.tags = spec.tags || ['创意工坊', '自定义实验'];
    spec.steps = spec.steps || ['选择自变量并调节参数', '采集数据并观察图像', '总结函数关系'];
    spec.description = spec.description || '由 Prism 创意工坊生成的自定义实验。';
    spec.formulaNote = spec.formulaNote || '自定义函数关系，图像随参数实时变化。';
    spec.principle = spec.principle || '通过改变参数，观察自变量与因变量之间的关系。';
    spec.formula = 'y = ' + spec.expression;
    register(spec);
    persist();
    return spec;
  }

  function remove(id) {
    hydrate();
    _custom = _custom.filter((s) => s.id !== id);
    delete OL.labs[id];
    persist();
  }

  function list() { hydrate(); return _custom.map(specToExperiment); }

  function exportAll() {
    hydrate();
    if (!_custom.length) { OL.app.toast('还没有自定义实验可以导出', 'error'); return; }
    U.download('prism-custom-experiments.json', JSON.stringify(_custom.map(strip), null, 2), 'application/json');
    OL.app.toast('自定义实验已导出');
  }

  function designFromForm(form) {
    const f = form.elements;
    return {
      name: f.name.value.trim() || '未命名实验',
      description: f.description.value.trim(),
      expression: f.expression.value.trim(),
      yLabel: f.yLabel.value.trim() || 'y', yUnit: f.yUnit.value.trim(),
      tLabel: f.tLabel.value.trim() || 't', tUnit: f.tUnit.value.trim(),
      tMin: Number(f.tMin.value), tMax: Number(f.tMax.value), tStep: Number(f.tStep.value || 0.01), tValue: Number(f.tValue.value),
      aLabel: f.aLabel.value.trim() || '参数 a', aMin: Number(f.aMin.value), aMax: Number(f.aMax.value), aStep: Number(f.aStep.value || 0.1), aValue: Number(f.aValue.value), aUnit: f.aUnit.value.trim(),
      bLabel: f.bLabel.value.trim() || '参数 b', bMin: Number(f.bMin.value), bMax: Number(f.bMax.value), bStep: Number(f.bStep.value || 0.1), bValue: Number(f.bValue.value), bUnit: f.bUnit.value.trim(),
      accent: f.accent.value,
      steps: ['选择自变量 t 的取值', '调节参数 a 与 b', '采集数据并观察图像', '总结 y 随 t 的变化规律']
    };
  }

  function drawPreview(canvas, spec) {
    if (!canvas) return;
    const c = C.prepare(canvas);
    const ctx = c.ctx, w = c.w, h = c.h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#101a2f'); bg.addColorStop(1, '#0a0f19');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    C.grid(ctx, w, h, { step: 24, vignette: false });
    const comp = OL.expr.compile(spec.expression, ['t', 'a', 'b']);
    const x0 = 34, x1 = w - 18, y0 = h - 30, y1 = 18;
    const pts = [];
    let ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i <= 120; i++) {
      const t = spec.tMin + (spec.tMax - spec.tMin) * i / 120;
      const y = comp.eval({ t, a: spec.aValue, b: spec.bValue });
      if (isFinite(y)) { pts.push({ x: t, y }); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    }
    if (!isFinite(ymin)) { ymin = -1; ymax = 1; }
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    const p = (ymax - ymin) * .15; ymin -= p; ymax += p;
    if (ymin > 0) ymin = 0; if (ymax < 0) ymax = 0;
    const X = (t) => x0 + (t - spec.tMin) / (spec.tMax - spec.tMin || 1) * (x1 - x0);
    const Y = (y) => y0 - (y - ymin) / (ymax - ymin || 1) * (y0 - y1);
    C.axis(ctx, x0, y0, x1 - x0, y0 - y1, { color: 'rgba(180,210,255,.22)' });
    if (ymin < 0 && ymax > 0) C.line(ctx, x0, Y(0), x1, Y(0), 'rgba(255,255,255,.1)', 1, [3, 3]);
    if (comp.ok) {
      ctx.save(); ctx.beginPath();
      pts.forEach((pnt, i) => { if (i === 0) ctx.moveTo(X(pnt.x), Y(pnt.y)); else ctx.lineTo(X(pnt.x), Y(pnt.y)); });
      ctx.strokeStyle = spec.accent; ctx.lineWidth = 2;
      ctx.shadowColor = C.hexA(spec.accent, .5); ctx.shadowBlur = 7; ctx.stroke(); ctx.restore();
      const yy = comp.eval({ t: spec.tValue, a: spec.aValue, b: spec.bValue });
      if (isFinite(yy)) {
        C.glowCircle(ctx, X(spec.tValue), Y(yy), 16, spec.accent, .5);
        C.dot(ctx, X(spec.tValue), Y(yy), 3.2, '#fff', 6);
      }
      C.label(ctx, 'y = ' + spec.expression, x0 + 6, 18, { size: 8, color: 'rgba(220,235,255,.5)', mono: true });
      C.label(ctx, 't ∈ [' + spec.tMin + ', ' + spec.tMax + ']', x1 - 4, y0 + 14, { size: 7, align: 'right', color: 'rgba(220,235,255,.3)', mono: true });
    } else {
      C.label(ctx, comp.error, w / 2, h / 2, { size: 9, align: 'center', color: '#ff8a80' });
    }
  }

  function render() {
    hydrate();
    const d = defaults();
    const custom = _custom;
    return '<div class="view-inner">' +
      '<section class="workshop-hero"><span class="eyebrow">OPEN LAB STUDIO</span><h1>把想法，写成<br>可以运行的实验。</h1><p>选择变量、写下公式、实时预览。你设计的实验会立即进入实验室，也可以导出为 JSON 或通过开放接口分享给其他人。</p>' +
      '<div class="hero-actions"><button class="btn primary-hero" data-ws="focus-form">' + OL.iconsUI.spark() + ' 开始设计</button><button class="btn secondary" data-ws="import-json">' + OL.iconsUI.upload() + ' 导入 JSON</button></div></section>' +
      '<div class="ws-tabs"><button data-ws-mode="formula" class="active">函数实验 <small>y = f(t, a, b)</small></button><button data-ws-mode="modules">模块搭建 <small>拖动器具 · 连线 · 运行</small><span class="ws-new">NEW</span></button></div>' +
      '<div class="ws-panel" data-ws-panel="formula">' +
      '<div class="workshop-grid">' +
      '<section class="designer-card card" id="designerCard"><div class="designer-head"><div><h2>可视化实验设计器</h2><p>自变量 t · 参数 a / b · 函数 y = f(t, a, b)</p></div><span class="pill accent">无需写代码</span></div>' +
      '<form class="designer-body" id="designerForm" autocomplete="off">' +
      '<div class="form-row"><div class="field"><label>实验名称</label><input name="name" value="' + esc(d.name) + '" maxlength="32"></div><div class="field"><label>主题色</label><select name="accent">' + ACCENTS.map((a) => '<option value="' + a.value + '">' + a.label + '</option>').join('') + '</select></div></div>' +
      '<div class="field full"><label>实验简介 <small>会显示在实验卡片和实验页顶部</small></label><textarea name="description">' + esc(d.description) + '</textarea></div>' +
      '<div class="field full"><label>函数表达式 <small>支持 + − × ÷ ^、sin、cos、sqrt、log，变量 t / a / b</small></label><input class="formula-input" name="expression" value="' + esc(d.expression) + '" spellcheck="false"></div>' +
      '<div class="form-row"><div class="field"><label>纵轴名称</label><input name="yLabel" value="' + esc(d.yLabel) + '"></div><div class="field"><label>纵轴单位</label><input name="yUnit" value="' + esc(d.yUnit) + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>自变量名称</label><input name="tLabel" value="' + esc(d.tLabel) + '"></div><div class="field"><label>自变量单位</label><input name="tUnit" value="' + esc(d.tUnit) + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>t 最小值</label><input name="tMin" type="number" step="any" value="' + d.tMin + '"></div><div class="field"><label>t 最大值</label><input name="tMax" type="number" step="any" value="' + d.tMax + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>t 步长</label><input name="tStep" type="number" step="any" value="' + d.tStep + '"></div><div class="field"><label>t 默认值</label><input name="tValue" type="number" step="any" value="' + d.tValue + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>参数 a 名称</label><input name="aLabel" value="' + esc(d.aLabel) + '"></div><div class="field"><label>a 单位</label><input name="aUnit" value="' + esc(d.aUnit) + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>a 最小值</label><input name="aMin" type="number" step="any" value="' + d.aMin + '"></div><div class="field"><label>a 最大值</label><input name="aMax" type="number" step="any" value="' + d.aMax + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>a 步长</label><input name="aStep" type="number" step="any" value="' + d.aStep + '"></div><div class="field"><label>a 默认值</label><input name="aValue" type="number" step="any" value="' + d.aValue + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>参数 b 名称</label><input name="bLabel" value="' + esc(d.bLabel) + '"></div><div class="field"><label>b 单位</label><input name="bUnit" value="' + esc(d.bUnit) + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>b 最小值</label><input name="bMin" type="number" step="any" value="' + d.bMin + '"></div><div class="field"><label>b 最大值</label><input name="bMax" type="number" step="any" value="' + d.bMax + '"></div></div>' +
      '<div class="form-row"><div class="field"><label>b 步长</label><input name="bStep" type="number" step="any" value="' + d.bStep + '"></div><div class="field"><label>b 默认值</label><input name="bValue" type="number" step="any" value="' + d.bValue + '"></div></div>' +
      '<div class="param-chips"><span class="param-chip"><b>t</b> ' + esc(d.tLabel) + '</span><span class="param-chip"><b>a</b> ' + esc(d.aLabel) + '</span><span class="param-chip"><b>b</b> ' + esc(d.bLabel) + '</span></div>' +
      '<div class="designer-actions"><button type="button" class="btn" data-ws="create">' + OL.iconsUI.spark() + ' 创建并打开实验</button><button type="button" class="btn ghost small" data-ws="reset-form">重置</button><span class="spacer"></span><span class="kbd-hint">实时预览 →</span></div>' +
      '</form></section>' +
      '<aside class="workshop-side">' +
      '<section class="preview-card card"><div class="preview-head"><h3>实时预览</h3><span class="pill purple">LIVE</span></div><div class="preview-stage"><canvas id="designerPreview"></canvas></div><div class="preview-meta"><span class="pill">y = f(t, a, b)</span><span class="pill">自动坐标轴</span><span class="pill">可采集数据</span></div></section>' +
      '<section class="api-card card"><h3>开放实验接口</h3><p>注册一个带自定义绘制函数与图像的实验，几行代码即可扩展 Prism。</p>' +
      '<pre class="code-block"><button class="code-copy" data-copy="' + esc("OL.registerExperiment({\n  id: 'my-lab',\n  title: '我的实验',\n  controls: [{ key: 'x', label: 'x', min: 0, max: 10, step: 1, value: 3 }],\n  lab: {\n    draw(ctx, w, h, state) { /* canvas */ },\n    readouts(state) { return []; },\n    plot(state, view) { return { series: [] }; }\n  }\n});") + '" title="复制示例">' + OL.iconsUI.copy() + '</button><span class="c">// 注册一个实验</span>\n<span class="k">OL</span>.<span class="k">registerExperiment</span>({\n  <span class="s">id</span>: <span class="s">\'my-lab\'</span>,\n  <span class="s">title</span>: <span class="s">\'我的实验\'</span>,\n  <span class="s">lab</span>: { <span class="s">draw</span>, <span class="s">readouts</span>, <span class="s">plot</span> }\n});</pre>' +
      '<ul class="api-list"><li>' + OL.iconsUI.check() + '<span><b>OL.registerExperiment(spec)</b> 注册实验</span></li><li>' + OL.iconsUI.check() + '<span><b>OL.registerPlugin(plugin)</b> 批量注册插件</span></li><li>' + OL.iconsUI.check() + '<span><b>OL.workshop.add(spec)</b> 添加公式实验</span></li><li>' + OL.iconsUI.check() + '<span><b>OL.app.toast(msg)</b> 显示通知</span></li></ul></section>' +
      '</aside></div>' +
      '<div class="workshop-list card" style="margin-top:16px"><div class="workshop-list-head"><div><h3>我的实验</h3><span class="filter-count">' + custom.length + ' 个自定义实验</span></div><div style="display:flex;gap:7px"><button class="btn ghost small" data-ws="export-json">' + OL.iconsUI.download() + ' 导出全部</button><button class="btn ghost small" data-ws="load-plugin">' + OL.iconsUI.upload() + ' 加载插件</button></div></div>' +
      (custom.length ? '<div class="custom-grid">' + custom.map((s) => '<div class="custom-card"><h4>' + esc(s.name) + '</h4><p>y = ' + esc(s.expression) + '</p><div class="cc-foot"><span class="pill">' + esc(s.tLabel) + ' ∈ [' + s.tMin + ', ' + s.tMax + ']</span><button data-lab="' + s.id + '">打开 →</button><button data-ws-del="' + s.id + '" title="删除">' + OL.iconsUI.trash() + '</button></div></div>').join('') + '</div>' :
        '<div class="empty-workshop">' + OL.iconsUI.spark() + '<p>还没有自定义实验。填写上方公式，创建你的第一个实验。</p></div>') +
      '<div class="plugin-drop">' + OL.iconsUI.upload() + '<span>加载本地 <b>.js</b> 插件文件（仅使用可信来源）</span><button data-ws="load-plugin">选择文件</button></div></div>' +
      '<input type="file" id="wsImport" accept=".json,application/json" hidden><input type="file" id="wsPlugin" accept=".js,text/javascript" hidden>' +
      '</div>' + modulePanel() +
      '</div>';
  }

  const MODULE_PARTS = {
    cart: { label: '小车', cat: '运动', color: '#64a8ff', hint: '可沿轨道运动' },
    ramp: { label: '斜面', cat: '运动', color: '#64a8ff', hint: '提供斜面与重力分量' },
    ball: { label: '小球', cat: '运动', color: '#ffd166', hint: '自由落体 / 平抛' },
    spring: { label: '弹簧', cat: '运动', color: '#64a8ff', hint: '弹力与振动' },
    pendulum: { label: '摆球', cat: '运动', color: '#ff9f0a', hint: '单摆周期' },
    battery: { label: '电源', cat: '电学', color: '#ff9f0a', hint: '提供电压' },
    resistor: { label: '电阻', cat: '电学', color: '#ff9f0a', hint: '限流 / 分压' },
    lamp: { label: '小灯泡', cat: '电学', color: '#ffd166', hint: '电流通过时发光' },
    switch: { label: '开关', cat: '电学', color: '#ff9f0a', hint: '接通或断开电路' },
    ammeter: { label: '电流表', cat: '电学', color: '#ff9f0a', hint: '串联测电流' },
    voltmeter: { label: '电压表', cat: '电学', color: '#ff9f0a', hint: '并联测电压' },
    light: { label: '光源', cat: '光学', color: '#bf5af2', hint: '发出平行光' },
    lens: { label: '透镜', cat: '光学', color: '#bf5af2', hint: '会聚或发散光线' },
    screen: { label: '光屏', cat: '光学', color: '#bf5af2', hint: '接收光斑' },
    syringe: { label: '注射器', cat: '热学', color: '#30d158', hint: '封闭气体，改变体积' },
    beaker: { label: '水槽', cat: '热学', color: '#30d158', hint: '盛水 / 油膜实验' }
  };

  function modulePanel() {
    const cats = ['运动', '电学', '光学', '热学'];
    const palette = cats.map((cat) => '<div class="module-cat"><span>' + cat + '</span><div class="module-palette-grid">' +
      Object.keys(MODULE_PARTS).filter((k) => MODULE_PARTS[k].cat === cat).map((k) => {
        const p = MODULE_PARTS[k];
        return '<button class="module-part-chip" draggable="true" data-part="' + k + '" style="--part-color:' + p.color + '" title="' + p.hint + '"><i></i><b>' + p.label + '</b><small>' + p.hint + '</small></button>';
      }).join('') + '</div></div>').join('');
    return '<section class="module-builder" data-ws-panel="modules" hidden>' +
      '<div class="module-head"><div><span class="eyebrow">MODULAR LAB</span><h2>像搭积木一样，搭一个实验。</h2><p>从左侧拖入实验器具，在画布上自由摆放；用“连线”连接电源、电表、光源与光屏。保存后可以随时继续编辑。</p></div><span class="pill accent">SCRATCH 式搭建</span></div>' +
      '<div class="module-toolbar"><button class="module-tool active" data-mod-tool="select">选择</button><button class="module-tool" data-mod-tool="wire">连线</button><span class="module-divider"></span><button class="module-tool green" data-mod-action="run">运行</button><button class="module-tool" data-mod-action="stop">停止</button><button class="module-tool" data-mod-action="clear">清空</button><span class="spacer"></span><input class="module-name" id="moduleName" maxlength="30" placeholder="模块实验名称"><button class="module-tool" data-mod-action="save">保存模块实验</button></div>' +
      '<div class="module-body"><aside class="module-palette"><div class="module-palette-head"><b>实验器具</b><span>拖到画布</span></div>' + palette + '</aside>' +
      '<div class="module-stage-wrap"><canvas id="moduleCanvas"></canvas><div class="module-stage-hint" id="moduleHint">拖动左侧器具到画布 · 双击器具可删除</div></div>' +
      '<aside class="module-inspector"><div class="module-inspector-head"><b>属性</b><span id="moduleSelection">未选择</span></div><div id="moduleInspector"><p class="module-empty">选择一个器具后，可修改名称和参数。</p></div><div class="module-saved"><div class="module-saved-head"><b>我的模块实验</b><span id="moduleSavedCount">0</span></div><div id="moduleSavedList"></div></div></aside></div>' +
      '<div class="module-logic"><div><span class="eyebrow">连接逻辑</span><p>电源 → 开关 → 电阻 → 灯泡 形成回路；光源 → 透镜 → 光屏形成光路；运动器具会按重力自动演示。</p></div><button class="btn ghost small" data-mod-action="export">导出模块 JSON</button></div>' +
      '</section>';
  }

  const MODULE_KEY = 'prism-module-builds-v1';
  let moduleState = null;
  let moduleRAF = 0;
  let moduleDrag = null;
  let moduleWireFrom = null;

  function loadBuilds() {
    try { const v = JSON.parse(localStorage.getItem(MODULE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function saveBuilds(list) { try { localStorage.setItem(MODULE_KEY, JSON.stringify(list)); } catch (e) {} }
  function newModuleState() {
    return { id: '', name: '我的模块实验', parts: [], links: [], selected: null, tool: 'select', running: false, t: 0 };
  }
  function modulePart(id) { return moduleState.parts.find((p) => p.id === id); }
  function moduleCenter(p) { return { x: p.x + 40, y: p.y + 34 }; }

  function moduleCircuitStatus() {
    if (!moduleState) return { complete: false, reason: 'no-state' };
    const conducting = new Set(['battery', 'resistor', 'lamp', 'switch', 'ammeter']);
    const parts = moduleState.parts.filter((p) => conducting.has(p.type) && !(p.type === 'switch' && p.closed === false));
    const byId = {};
    parts.forEach((p) => { byId[p.id] = p; });
    const links = moduleState.links.filter((l) => byId[l.from] && byId[l.to] && l.from !== l.to);
    const hasBattery = parts.some((p) => p.type === 'battery');
    const hasLamp = parts.some((p) => p.type === 'lamp');
    if (!hasBattery || !hasLamp) return { complete: false, reason: 'missing' };
    const adj = {};
    parts.forEach((p) => { adj[p.id] = []; });
    links.forEach((l) => { adj[l.from].push(l.to); adj[l.to].push(l.from); });
    const start = parts.find((p) => p.type === 'battery').id;
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const id = queue.shift();
      adj[id].forEach((n) => { if (!seen.has(n)) { seen.add(n); queue.push(n); } });
    }
    const lampPart = parts.find((p) => p.type === 'lamp');
    if (!seen.has(lampPart.id)) return { complete: false, reason: 'lamp-not-connected' };
    const component = parts.filter((p) => seen.has(p.id));
    const componentEdges = links.filter((l) => seen.has(l.from) && seen.has(l.to)).length;
    if (adj[start].length < 2 || adj[lampPart.id].length < 2) return { complete: false, reason: 'open' };
    if (componentEdges < component.length) return { complete: false, reason: 'open' };
    return { complete: true, reason: 'ok', battery: start, lamp: lampPart.id };
  }

  function drawModulePart(ctx, p, t, powered) {
    const meta = MODULE_PARTS[p.type] || { label: '模块', color: '#64a8ff' };
    const x = p.x, y = p.y;
    const selected = moduleState.selected === p.id;
    C.fillRound(ctx, x, y, 80, 68, 12, 'rgba(12,22,38,.86)');
    ctx.strokeStyle = selected ? '#ffffff' : C.hexA(meta.color, .55);
    ctx.lineWidth = selected ? 2 : 1.2;
    C.roundRect(ctx, x, y, 80, 68, 12); ctx.stroke();
    ctx.save();
    ctx.translate(x + 40, y + 30);
    ctx.strokeStyle = meta.color; ctx.fillStyle = C.hexA(meta.color, .2); ctx.lineWidth = 1.7;
    if (p.type === 'cart') {
      C.fillRound(ctx, -22, -8, 40, 16, 4, C.hexA(meta.color, .22));
      C.line(ctx, -26, 12, 28, 12, meta.color, 2);
      C.dot(ctx, -14, 14, 4, meta.color); C.dot(ctx, 16, 14, 4, meta.color);
    } else if (p.type === 'ramp') {
      ctx.beginPath(); ctx.moveTo(-24, 18); ctx.lineTo(-24, -16); ctx.lineTo(26, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (p.type === 'ball') {
      const bounce = moduleState.running ? Math.abs(Math.sin(t * 2.6)) * 18 : 0;
      ctx.beginPath(); ctx.arc(0, 10 - bounce, 10, 0, Math.PI * 2); ctx.fillStyle = meta.color; ctx.fill();
    } else if (p.type === 'spring') {
      ctx.beginPath(); ctx.moveTo(0, -20);
      for (let i = 1; i <= 6; i++) ctx.lineTo(i % 2 ? -12 : 12, -20 + i * 5);
      ctx.stroke();
    } else if (p.type === 'pendulum') {
      const a = moduleState.running ? Math.sin(t * 2.2) * .45 : .35;
      C.line(ctx, 0, -22, Math.sin(a) * 34, Math.cos(a) * 34, meta.color, 1.5);
      C.dot(ctx, Math.sin(a) * 34, Math.cos(a) * 34, 8, meta.color);
    } else if (p.type === 'battery') {
      C.fillRound(ctx, -24, -10, 42, 20, 4, C.hexA(meta.color, .2));
      C.line(ctx, 22, -5, 22, 5, meta.color, 2);
      C.label(ctx, '+', -18, -14, { size: 8, color: meta.color });
    } else if (p.type === 'resistor') {
      C.fillRound(ctx, -24, -8, 48, 16, 4, C.hexA(meta.color, .18));
      C.line(ctx, -14, -8, -8, 8, meta.color, 1.2); C.line(ctx, -8, 8, -2, -8, meta.color, 1.2); C.line(ctx, -2, -8, 4, 8, meta.color, 1.2); C.line(ctx, 4, 8, 10, -8, meta.color, 1.2);
    } else if (p.type === 'lamp') {
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fillStyle = powered ? 'rgba(255,209,102,.55)' : C.hexA(meta.color, .16); ctx.fill(); ctx.stroke();
      if (powered) { ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 18; ctx.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; C.line(ctx, Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 24, Math.sin(a) * 24, meta.color, 1); }
    } else if (p.type === 'switch') {
      C.line(ctx, -24, 6, -6, 6, meta.color, 2); C.line(ctx, 8, 6, 24, 6, meta.color, 2);
      C.line(ctx, -6, 6, 16, -12, meta.color, 2);
    } else if (p.type === 'ammeter' || p.type === 'voltmeter') {
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fillStyle = C.hexA(meta.color, .15); ctx.fill(); ctx.stroke();
      C.label(ctx, p.type === 'ammeter' ? 'A' : 'V', 0, 5, { size: 13, color: meta.color, align: 'center', weight: 700 });
    } else if (p.type === 'light') {
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = meta.color; ctx.fill();
      for (let i = 0; i < 5; i++) { const yy = -14 + i * 7; C.line(ctx, 12, yy, 34, yy, C.hexA(meta.color, .8), 1); }
    } else if (p.type === 'lens') {
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 24, 0, 0, Math.PI * 2); ctx.fillStyle = C.hexA(meta.color, .2); ctx.fill(); ctx.stroke();
    } else if (p.type === 'screen') {
      C.line(ctx, 6, -24, 6, 24, meta.color, 3); C.line(ctx, -18, -24, 6, -24, meta.color, 1); C.line(ctx, -18, 24, 6, 24, meta.color, 1);
    } else if (p.type === 'syringe') {
      C.fillRound(ctx, -26, -9, 46, 18, 4, C.hexA(meta.color, .18));
      C.line(ctx, 20, -4, 32, -4, meta.color, 2); C.line(ctx, 20, 4, 32, 4, meta.color, 2);
      C.line(ctx, -20, -9, -20, 9, meta.color, 1.5);
    } else if (p.type === 'beaker') {
      ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-14, 20); ctx.lineTo(14, 20); ctx.lineTo(20, -18); ctx.stroke();
      C.line(ctx, -16, 8, 16, 8, C.hexA(meta.color, .6), 5);
    } else {
      C.dot(ctx, 0, 0, 10, meta.color);
    }
    ctx.restore();
    C.label(ctx, p.label || meta.label, x + 40, y + 53, { size: 8.5, color: '#e8f1ff', align: 'center', weight: 600 });
    if (p.value) C.label(ctx, p.value, x + 40, y + 63, { size: 7, color: C.hexA(meta.color, .75), align: 'center', mono: true });
  }

  function drawModuleScene() {
    const canvas = document.querySelector('#moduleCanvas');
    if (!canvas || !moduleState) return;
    const c = C.prepare(canvas), ctx = c.ctx, w = c.w, h = c.h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0d1728'); bg.addColorStop(1, '#080d16');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    C.grid(ctx, w, h, { step: 28, vignette: false });
    const circuit = moduleCircuitStatus();
    const powered = circuit.complete && moduleState.running;
    // flow / wires
    moduleState.links.forEach((l) => {
      const a = modulePart(l.from), b = modulePart(l.to);
      if (!a || !b) return;
      const ca = moduleCenter(a), cb = moduleCenter(b);
      C.line(ctx, ca.x, ca.y, cb.x, cb.y, 'rgba(125,255,158,.4)', 1.5, [4, 5]);
    });
    moduleState.parts.forEach((p) => drawModulePart(ctx, p, moduleState.t, powered));
    if (!moduleState.parts.length) {
      C.label(ctx, '拖动左侧器具到这里', w / 2, h / 2 - 8, { size: 14, color: 'rgba(230,240,255,.38)', align: 'center' });
      C.label(ctx, '小车 · 斜面 · 电源 · 透镜 · 注射器', w / 2, h / 2 + 14, { size: 9, color: 'rgba(230,240,255,.24)', align: 'center' });
    }
    const status = moduleState.running && circuit.complete ? '运行中 · 回路闭合，灯泡发光' : (!circuit.complete && moduleState.parts.length ? '回路未闭合 · 请用“连线”补全电池—灯泡回路' : '编辑模式 · 连线后点击运行');
    if (circuit.complete) C.label(ctx, '● 回路闭合', w - 16, h - 15, { size: 8, color: 'rgba(125,255,158,.75)', align: 'right', mono: true });
    C.label(ctx, status, 16, h - 15, { size: 8, color: moduleState.running ? 'rgba(125,255,158,.65)' : 'rgba(230,240,255,.32)', mono: true });
  }

  function startModuleLoop() {
    cancelAnimationFrame(moduleRAF);
    const step = () => {
      if (!moduleState || !moduleState.running) return;
      moduleState.t += 0.016;
      drawModuleScene();
      moduleRAF = requestAnimationFrame(step);
    };
    moduleRAF = requestAnimationFrame(step);
  }

  function renderModuleInspector() {
    const box = document.querySelector('#moduleInspector');
    const label = document.querySelector('#moduleSelection');
    if (!box) return;
    const p = modulePart(moduleState.selected);
    if (label) label.textContent = p ? (p.label || MODULE_PARTS[p.type].label) : '未选择';
    if (!p) { box.innerHTML = '<p class="module-empty">选择一个器具后，可修改名称和参数。</p>'; return; }
    box.innerHTML = '<div class="module-field"><label>名称</label><input data-mod-field="label" value="' + esc(p.label || '') + '"></div>' +
      '<div class="module-field"><label>参数 / 读数</label><input data-mod-field="value" value="' + esc(p.value || '') + '" placeholder="如 2 N / 6 V"></div>' +
      '<div class="module-type">' + (MODULE_PARTS[p.type].cat) + ' · ' + MODULE_PARTS[p.type].hint + '</div>' +
      '<button class="btn ghost small module-delete" data-mod-action="delete">删除这个器具</button>';
  }

  function renderModuleSaved() {
    const list = document.querySelector('#moduleSavedList');
    const count = document.querySelector('#moduleSavedCount');
    if (!list) return;
    const builds = loadBuilds();
    if (count) count.textContent = builds.length;
    list.innerHTML = builds.length ? builds.map((b) => '<div class="module-saved-item"><button data-mod-load="' + b.id + '">' + esc(b.name) + '<small>' + (b.parts ? b.parts.length : 0) + ' 个器具 · ' + (b.links ? b.links.length : 0) + ' 条连线</small></button><button data-mod-remove="' + b.id + '" title="删除">×</button></div>').join('') : '<p class="module-empty">还没有保存的模块实验。</p>';
  }

  function bindModules(root) {
    cancelAnimationFrame(moduleRAF);
    const canvas = root.querySelector('#moduleCanvas');
    if (!canvas) return;
    if (!moduleState) moduleState = newModuleState();
    if (moduleState.selected && !modulePart(moduleState.selected)) moduleState.selected = null;
    const nameInput = root.querySelector('#moduleName');
    if (nameInput) nameInput.value = moduleState.name;
    drawModuleScene();
    renderModuleInspector();
    renderModuleSaved();

    // tabs
    root.querySelectorAll('[data-ws-mode]').forEach((b) => b.addEventListener('click', () => {
      root.querySelectorAll('[data-ws-mode]').forEach((x) => x.classList.toggle('active', x === b));
      root.querySelectorAll('[data-ws-panel]').forEach((p) => { p.hidden = p.dataset.wsPanel !== b.dataset.wsMode; });
      if (b.dataset.wsMode === 'modules') { drawModuleScene(); renderModuleSaved(); }
    }));

    // palette drag
    root.querySelectorAll('[data-part]').forEach((b) => {
      b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', b.dataset.part); e.dataTransfer.effectAllowed = 'copy'; });
    });
    canvas.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('text/plain');
      if (!MODULE_PARTS[type]) return;
      const r = canvas.getBoundingClientRect();
      const p = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: type, x: Math.max(8, e.clientX - r.left - 40), y: Math.max(8, e.clientY - r.top - 34), label: MODULE_PARTS[type].label, value: '' };
      moduleState.parts.push(p); moduleState.selected = p.id;
      drawModuleScene(); renderModuleInspector();
      if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = '已添加 ' + p.label + ' · 拖动可移动 · 双击删除';
    });

    // canvas pointer interaction
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = moduleState.parts.slice().reverse().find((p) => x >= p.x && x <= p.x + 80 && y >= p.y && y <= p.y + 68);
      if (moduleState.tool === 'wire') {
        if (!hit) return;
        if (!moduleWireFrom) {
          moduleWireFrom = hit.id;
          if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = '已选择起点，再点击另一个器具完成连线';
        } else if (moduleWireFrom !== hit.id) {
          moduleState.links.push({ from: moduleWireFrom, to: hit.id });
          moduleWireFrom = null;
          drawModuleScene();
          if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = '连线已创建';
        }
        return;
      }
      moduleState.selected = hit ? hit.id : null;
      if (hit) {
        moduleDrag = { id: hit.id, dx: x - hit.x, dy: y - hit.y };
        canvas.setPointerCapture(e.pointerId);
      }
      drawModuleScene(); renderModuleInspector();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!moduleDrag) return;
      const p = modulePart(moduleDrag.id); if (!p) return;
      const r = canvas.getBoundingClientRect();
      p.x = U.clamp(e.clientX - r.left - moduleDrag.dx, 0, r.width - 80);
      p.y = U.clamp(e.clientY - r.top - moduleDrag.dy, 0, r.height - 68);
      drawModuleScene();
    });
    canvas.addEventListener('pointerup', () => { moduleDrag = null; });
    canvas.addEventListener('dblclick', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = moduleState.parts.slice().reverse().find((p) => x >= p.x && x <= p.x + 80 && y >= p.y && y <= p.y + 68);
      if (hit) { moduleState.parts = moduleState.parts.filter((p) => p.id !== hit.id); moduleState.links = moduleState.links.filter((l) => l.from !== hit.id && l.to !== hit.id); moduleState.selected = null; drawModuleScene(); renderModuleInspector(); }
    });

    // toolbar
    root.querySelectorAll('[data-mod-tool]').forEach((b) => b.addEventListener('click', () => {
      moduleState.tool = b.dataset.modTool; moduleWireFrom = null;
      root.querySelectorAll('[data-mod-tool]').forEach((x) => x.classList.toggle('active', x === b));
      if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = b.dataset.modTool === 'wire' ? '连线模式：依次点击两个器具' : '拖动器具移动位置，双击删除';
    }));
    root.querySelectorAll('[data-mod-action]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.modAction;
      if (a === 'run') {
        const circuit = moduleCircuitStatus();
        if (!circuit.complete) {
          if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = '回路未闭合：请用“连线”把电源、开关、电阻和灯泡连成完整回路';
          if (OL.app && OL.app.toast) OL.app.toast('回路未闭合，无法运行。请用连线连接电池、灯泡等元件。', 'error');
          moduleState.running = false;
          drawModuleScene();
          return;
        }
        moduleState.running = true;
        if (root.querySelector('#moduleHint')) root.querySelector('#moduleHint').textContent = '运行中：回路闭合，灯泡发光';
        startModuleLoop();
      }
      if (a === 'stop') { moduleState.running = false; cancelAnimationFrame(moduleRAF); drawModuleScene(); }
      if (a === 'clear') { moduleState.parts = []; moduleState.links = []; moduleState.selected = null; moduleState.running = false; moduleWireFrom = null; cancelAnimationFrame(moduleRAF); drawModuleScene(); renderModuleInspector(); }
      if (a === 'delete') { if (moduleState.selected) { moduleState.parts = moduleState.parts.filter((p) => p.id !== moduleState.selected); moduleState.links = moduleState.links.filter((l) => l.from !== moduleState.selected && l.to !== moduleState.selected); moduleState.selected = null; drawModuleScene(); renderModuleInspector(); } }
      if (a === 'save') {
        const name = (nameInput && nameInput.value.trim()) || '我的模块实验';
        const id = moduleState.id || 'mod-' + Date.now().toString(36);
        const builds = loadBuilds().filter((x) => x.id !== id);
        builds.unshift({ id: id, name: name, parts: moduleState.parts.slice(), links: moduleState.links.slice() });
        saveBuilds(builds);
        moduleState.id = id; moduleState.name = name;
        if (nameInput) nameInput.value = name;
        renderModuleSaved();
        OL.app.toast('模块实验已保存：' + name);
      }
      if (a === 'export') {
        const data = { name: (nameInput && nameInput.value.trim()) || moduleState.name, parts: moduleState.parts, links: moduleState.links };
        U.download('prism-module-lab.json', JSON.stringify(data, null, 2), 'application/json');
        OL.app.toast('模块实验已导出');
      }
    }));

    // inspector fields
    root.querySelector('#moduleInspector')?.addEventListener('input', (e) => {
      const f = e.target.closest('[data-mod-field]'); if (!f) return;
      const p = modulePart(moduleState.selected); if (!p) return;
      p[f.dataset.modField] = f.value;
      drawModuleScene();
    });
    // Dynamic controls created by the inspector / saved list are handled by delegation.
    root.addEventListener('click', (e) => {
      const del = e.target.closest('[data-mod-action="delete"]');
      if (del && moduleState.selected) {
        const id = moduleState.selected;
        moduleState.parts = moduleState.parts.filter((p) => p.id !== id);
        moduleState.links = moduleState.links.filter((l) => l.from !== id && l.to !== id);
        moduleState.selected = null;
        drawModuleScene(); renderModuleInspector();
        return;
      }
      const load = e.target.closest('[data-mod-load]');
      if (load) {
        const build = loadBuilds().find((x) => x.id === load.dataset.modLoad); if (!build) return;
        moduleState = { id: build.id, name: build.name, parts: (build.parts || []).slice(), links: (build.links || []).slice(), selected: null, tool: 'select', running: false, t: 0 };
        if (nameInput) nameInput.value = moduleState.name;
        drawModuleScene(); renderModuleInspector();
        return;
      }
      const remove = e.target.closest('[data-mod-remove]');
      if (remove) { saveBuilds(loadBuilds().filter((x) => x.id !== remove.dataset.modRemove)); renderModuleSaved(); }
    });
    if (nameInput) nameInput.addEventListener('input', () => { moduleState.name = nameInput.value; });
  }

  function bind(root) {
    bindModules(root);
    const form = root.querySelector('#designerForm');
    const canvas = root.querySelector('#designerPreview');
    if (form && canvas) {
      const update = U.throttle(() => drawPreview(canvas, designFromForm(form)), 60);
      form.addEventListener('input', update);
      form.addEventListener('change', update);
      drawPreview(canvas, designFromForm(form));
    }

    root.addEventListener('click', (e) => {
      const ws = e.target.closest('[data-ws]');
      if (ws) {
        const a = ws.dataset.ws;
        if (a === 'focus-form') { const card = root.querySelector('#designerCard'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        if (a === 'reset-form' && form) { form.reset(); drawPreview(canvas, designFromForm(form)); }
        if (a === 'create' && form) {
          const spec = designFromForm(form);
          const comp = OL.expr.compile(spec.expression, ['t', 'a', 'b']);
          if (!comp.ok) { OL.app.toast('公式有误：' + comp.error, 'error'); form.elements.expression.focus(); return; }
          if (!(spec.tMax > spec.tMin)) { OL.app.toast('t 的最大值必须大于最小值', 'error'); return; }
          if (!(spec.aMax > spec.aMin) || !(spec.bMax > spec.bMin)) { OL.app.toast('参数范围设置不正确', 'error'); return; }
          const saved = add(spec);
          OL.app.toast('实验已创建：' + saved.name);
          OL.app.navigate('lab/' + saved.id);
        }
        if (a === 'import-json') { const input = root.querySelector('#wsImport'); if (input) input.click(); }
        if (a === 'export-json') exportAll();
        if (a === 'load-plugin') { const input = root.querySelector('#wsPlugin'); if (input) input.click(); }
      }
      const del = e.target.closest('[data-ws-del]');
      if (del) {
        const id = del.dataset.wsDel;
        const spec = _custom.find((s) => s.id === id);
        if (!spec) return;
        OL.app.openModal('删除自定义实验？', '<p style="margin:0;color:var(--text-2);font-size:12px;line-height:1.6">“' + esc(spec.name) + '” 将从本机移除，但不会影响已经导出的 JSON 文件。</p>', {
          footer: '<button class="btn ghost" data-action="close-modal">取消</button><button class="btn danger" data-ws-del-confirm="' + id + '">删除实验</button>'
        });
      }
    });

    root.addEventListener('change', (e) => {
      if (e.target.id === 'wsImport' && e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            const arr = Array.isArray(data) ? data : (data.experiments || [data]);
            let n = 0;
            arr.forEach((s) => {
              if (!s || !s.expression || !s.name) return;
              if (!s.id) s.id = 'custom-' + Date.now().toString(36) + n;
              const comp = OL.expr.compile(s.expression, ['t', 'a', 'b']);
              if (!comp.ok) return;
              add(s); n++;
            });
            OL.app.toast(n ? '已导入 ' + n + ' 个实验' : '没有可导入的实验', n ? undefined : 'error');
            if (n) OL.app.rerender();
          } catch (err) { OL.app.toast('JSON 解析失败：' + err.message, 'error'); }
        };
        reader.readAsText(file);
        e.target.value = '';
      }
      if (e.target.id === 'wsPlugin' && e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const blob = new Blob([reader.result], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => { URL.revokeObjectURL(url); script.remove(); OL.app.toast('插件已加载：' + file.name); setTimeout(() => OL.app.rerender(), 350); };
            script.onerror = () => { URL.revokeObjectURL(url); OL.app.toast('插件加载失败', 'error'); };
            document.head.appendChild(script);
          } catch (err) { OL.app.toast('插件执行失败：' + err.message, 'error'); }
        };
        reader.readAsText(file);
        e.target.value = '';
      }
    });
  }

  document.addEventListener('click', (e) => {
    const del = e.target.closest('[data-ws-del-confirm]');
    if (del) {
      remove(del.dataset.wsDelConfirm);
      OL.app.closeModal();
      OL.app.toast('自定义实验已删除');
      OL.app.rerender();
    }
  });

  OL.workshop = { render, bind, list, add, remove, exportAll, hydrate, buildLab, specToExperiment };
  hydrate();
})();
