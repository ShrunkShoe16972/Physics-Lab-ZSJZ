/* ============================================================
   Prism · open experiment API
   External .js plugins can register complete labs at runtime.
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL;
  const pluginExperiments = [];

  function ensureId(id) {
    return id || 'plugin-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function normalize(spec) {
    if (!spec || typeof spec !== 'object') throw new Error('实验配置必须是对象');
    if (spec.expression && !spec.lab) return OL.workshop.add(spec);
    if (!spec.lab || typeof spec.lab.draw !== 'function') throw new Error('实验 ' + (spec.title || spec.id || '') + ' 缺少 lab.draw 绘制函数');

    const id = ensureId(spec.id);
    const lab = Object.assign({
      id,
      readouts: function () { return []; },
      plot: function () { return { xLabel: 'x', yLabel: 'y', series: [] }; },
      sample: function () { return null; },
      columns: [],
      conclusion: function () { return ''; }
    }, spec.lab, { id });

    const exp = {
      id,
      n: 0,
      title: spec.title || '插件实验',
      short: spec.short || spec.description || '由插件注册的自定义实验。',
      category: 'custom',
      accent: spec.accent || '#5e5ce6',
      icon: spec.icon || 'spark',
      difficulty: spec.difficulty || '插件',
      time: spec.time || '自定义',
      tags: spec.tags || ['插件', '开放接口'],
      description: spec.description || '由 Prism 开放实验接口注册的实验。',
      formula: spec.formula || '自定义模型',
      formulaNote: spec.formulaNote || '该实验由外部插件提供。',
      principle: spec.principle || '实验逻辑由插件实现，可通过开放接口扩展。',
      steps: spec.steps || ['阅读实验说明', '调节变量并观察', '采集数据并分析'],
      controls: (spec.controls || []).map(function (c) {
        return Object.assign({ type: 'range', decimals: 2, unit: '', min: 0, max: 1, step: 0.01, value: 0.5 }, c);
      })
    };
    OL.registerLab(lab);
    if (!pluginExperiments.find(function (e) { return e.id === id; })) pluginExperiments.push(exp);
    return exp;
  }

  OL.registerExperiment = function (spec) {
    try {
      const exp = normalize(spec);
      if (OL.app && OL.app.toast) OL.app.toast('已注册实验：' + (exp.title || exp.name || '自定义实验'));
      return exp;
    } catch (err) {
      if (OL.app && OL.app.toast) OL.app.toast('注册实验失败：' + err.message, 'error');
      console.error(err);
      return null;
    }
  };

  OL.registerPlugin = function (plugin) {
    if (!plugin) return [];
    if (Array.isArray(plugin)) return plugin.map((p) => OL.registerExperiment(p));
    const list = plugin.experiments || [];
    const out = [];
    list.forEach((spec) => {
      const exp = OL.registerExperiment(spec);
      if (exp) out.push(exp);
    });
    if (typeof plugin.setup === 'function') {
      try { plugin.setup(OL); } catch (e) { console.warn('plugin setup', e); }
    }
    if (OL.app && OL.app.toast) OL.app.toast('插件「' + (plugin.name || '未命名') + '」已加载 · ' + out.length + ' 个实验');
    return out;
  };

  OL.getPluginExperiments = function () { return pluginExperiments.slice(); };
  OL.pluginAPI = { version: '1.0', registerExperiment: OL.registerExperiment, registerPlugin: OL.registerPlugin };
})();
