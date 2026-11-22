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
  let scrollRaf = 0;
  let bootBackground = true;
  const sidebar = $('#sidebar');
  const scrim = $('#mobileScrim');
  const toastStack = $('#toastStack');

  const app = OL.app = {
    navigate, rerender: () => renderRoute(true), toast, openModal, closeModal,
    openPalette, closePalette, state: null
  };

  const state = app.state = {
    route: 'home', filter: 'all', book: 'all', lab: null, currentLab: null,
    theme: U.load().theme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    uiStyle: U.load().uiStyle === 'mac' ? 'mac' : 'win',
    fontScale: Number(U.load().fontScale) || 1,
    uiOpacity: Number.isFinite(Number(U.load().uiOpacity)) ? Number(U.load().uiOpacity) : 72,
    glassBlur: Number.isFinite(Number(U.load().glassBlur)) ? Number(U.load().glassBlur) : 18,
    animSpeed: Number.isFinite(Number(U.load().animSpeed)) ? Number(U.load().animSpeed) : 1,
    background: U.load().background || 'gate',
    bgMode: ['cover', 'contain', 'stretch', 'tile', 'center'].indexOf(U.load().bgMode) >= 0 ? U.load().bgMode : 'cover',
    bgImage: U.load().bgImage || '',
    wallpaperApi: U.load().wallpaperApi || '',
    wallpaperProvider: U.load().wallpaperProvider === 'wikimedia' ? 'wikimedia' : 'bing',
    paletteOpen: false, paletteIndex: 0, heroStop: null, focus: false
  };

  const BACKGROUNDS = [
    { id: 'gate', name: '纪中牌坊', file: 'gate.jpg', tone: '校园' },
    { id: 'mountain-lake', name: '山湖晨光', file: 'mountain-lake.jpg', tone: '自然' },
    { id: 'forest-mist', name: '雾中森林', file: 'forest-mist.jpg', tone: '自然' },
    { id: 'galaxy', name: '深空星系', file: 'galaxy.jpg', tone: '科学' },
    { id: 'mountain-stars', name: '星夜山脊', file: 'mountain-stars.jpg', tone: '自然' },
    { id: 'laboratory', name: '实验室光影', file: 'laboratory.jpg', tone: '科学' },
    { id: 'ocean', name: '海岸浪涌', file: 'ocean.jpg', tone: '自然' }
  ];

  const MISTAKES = {
    'accelerated-motion': ['打点计时器应先接通电源，再释放纸带。', '纸带与限位孔摩擦会造成加速度偏小。', '计算加速度时要用逐差法，不能只取首末两点。'],
    'hooke-law': ['弹簧竖直悬挂时未扣除弹簧自重。', '读数时视线没有与指针刻度平齐。', '超过弹性限度后继续加钩码，F–x 不再成直线。'],
    'force-parallelogram': ['两次拉橡皮条时结点 O 没有拉到同一位置。', '弹簧测力计没有与木板平行，读数偏小。', '作图时两个分力的标度不统一。'],
    'newton-second': ['忘记平衡摩擦力，a–F 图线不过原点。', '钩码质量没有远小于小车质量，绳中拉力不等于钩码重力。', '改变小车质量后没有重新平衡摩擦力。'],
    'projectile': ['斜槽末端没有调水平，小球初速度不水平。', '小球没有从同一位置由静止释放。', '坐标原点没有取在槽口末端。'],
    'centripetal': ['皮带没有张紧，塔轮打滑使角速度读数偏小。', '小球没有放在挡板同一侧，半径读数错误。', '转动手柄速度不稳定，应等匀速后再读数。'],
    'work-energy': ['没有平衡摩擦力，合外力做功不等于橡皮筋做功。', '橡皮筋条数增加时长度没有保持一致。', '应取纸带上点距均匀的部分计算小车末速度。'],
    'mechanical-energy': ['释放点高度测量应取摆球球心。', '摆球应在同一竖直平面内摆动，避免圆锥摆。', '空气阻力使总机械能逐渐减小。'],
    'momentum': ['气垫导轨没有调水平，系统合外力不为零。', '光电门宽度与挡光时间必须对应。', '速度方向没有规定正方向，动量符号易错。'],
    'simple-pendulum': ['摆角应小于 5°，否则周期公式不再适用。', '摆长应量到摆球球心，而不是摆线末端。', '应从最低点开始计时，测量多个全周期取平均。'],
    'resistivity': ['金属丝直径要在不同位置多次测量取平均。', '电流不宜过大，避免金属丝发热改变电阻率。', '伏安法接法选择错误会引入明显系统误差。'],
    'bulb-curve': ['小灯泡电阻随温度升高而增大，不能用定值电阻代替。', '电压表分流使电流读数偏大，应采用安培计外接。', '调节电压应从零开始，避免灯丝烧断。'],
    'emf-internal': ['电流表应串联在干路，电压表并联在路端。', '干电池不宜长时间大电流放电，内阻会变化。', 'U–I 图线纵截距为电动势，斜率为内阻。'],
    'multimeter': ['测电阻前必须断开电源，不能带电测量。', '换挡后要重新欧姆调零。', '红黑表笔插孔和量程选择不能混淆。'],
    'ampere-force': ['导线应垂直磁场放置，否则安培力不是 F=BIL。', '导轨接触不良会使电流不稳定。', '判断方向要用左手定则，注意电流方向。'],
    'induction': ['磁铁运动方向与电流表偏转方向要对应记录。', '线圈匝数或磁铁速度改变后应重新观察。', '原磁场方向、磁通量变化方向不能混淆。'],
    'transformer': ['原、副线圈匝数应按接线柱标识读取。', '只能接交流电源，接直流不能持续变压。', '铁芯应闭合，否则漏磁使电压比偏差增大。'],
    'capacitor': ['电容器充电后不能直接用手短接，应先放电。', '测电容前要确认量程与极性。', 'RC 电路中时间常数应取 R 与 C 的乘积。'],
    'refraction': ['入射角应相对法线测量，不是相对界面。', '玻璃砖两边平行，插针间距要适当大。', '不能把玻璃砖当镜面，注意折射光线从另一侧射出。'],
    'double-slit': ['双缝应竖直且与光屏平行。', '单缝与双缝间距要合适，否则条纹太暗。', '测量条纹间距应取多条条纹总宽度再平均。'],
    'oil-film': ['油酸酒精溶液浓度要准确，滴数要稳定。', '痱子粉要撒得薄而均匀。', '油膜面积用坐标纸数格，不足半格舍去。'],
    'gas-law': ['注射器密封性要好，推拉时不能漏气。', '应等温度稳定后再读压强和体积。', '压强单位要与体积单位匹配，p–V 图是双曲线。']
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
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#07080b' : '#f3f4f6');
    if (persist !== false) U.save({ theme: state.theme });
    syncAppearanceControls();
    if (state.currentLab && state.currentLab.chart) state.currentLab.chart.draw();
  }

  function applyUiStyle(style, persist) {
    state.uiStyle = style === 'mac' ? 'mac' : 'win';
    document.documentElement.setAttribute('data-style', state.uiStyle);
    if (persist !== false) U.save({ uiStyle: state.uiStyle });
    syncAppearanceControls();
    if (state.currentLab) {
      state.currentLab.view.dirty = true;
      if (state.currentLab.chart) setTimeout(() => state.currentLab && state.currentLab.chart.draw(), 30);
    }
  }

  function applyFontScale(value, persist) {
    let scale = Number(value) || 1;
    if (scale > 10) scale = scale / 100;
    scale = Math.min(1.5, Math.max(1, scale));
    state.fontScale = scale;
    document.documentElement.style.setProperty('--fs', scale);
    document.documentElement.setAttribute('data-font-scale', String(scale));
    OL.ui.fontScale = scale;
    OL.ui.canvasLabelScale = 1 + (scale - 1) * 1.05;
    OL.ui.chartFontScale = 1 + (scale - 1) * 1.15;
    syncAppearanceControls();
    if (persist !== false) U.save({ fontScale: scale });
    if (state.currentLab) {
      state.currentLab.view.dirty = true;
      if (state.currentLab.chart) setTimeout(() => state.currentLab && state.currentLab.chart.draw(), 30);
    }
  }

  function applyBackgroundMode(mode, persist) {
    const allowed = ['cover', 'contain', 'stretch', 'tile', 'center'];
    state.bgMode = allowed.indexOf(mode) >= 0 ? mode : 'cover';
    allowed.forEach((m) => document.body.classList.remove('bg-' + m));
    document.body.classList.add('bg-' + state.bgMode);
    if (persist !== false) U.save({ bgMode: state.bgMode });
  }

  function applyPerformance(persist) {
    state.uiOpacity = Math.max(0, Math.min(100, Number(state.uiOpacity)));
    state.glassBlur = Math.max(0, Math.min(20, Number(state.glassBlur)));
    state.animSpeed = Math.max(0.4, Math.min(2.5, Number(state.animSpeed)));
    document.body.style.setProperty('--ui-veil', String(state.uiOpacity / 100));
    document.body.style.setProperty('--glass-blur', state.glassBlur + 'px');
    document.body.style.setProperty('--anim-scale', String(1 / state.animSpeed));
    applyBackgroundMode(state.bgMode, false);
    const appBg = $('#appBackground');
    if (appBg) {
      let url = '';
      if (state.bgImage) url = state.bgImage;
      else {
        const preset = BACKGROUNDS.find((b) => b.id === state.background) || BACKGROUNDS[0];
        url = 'assets/img/backgrounds/' + preset.file;
        if (bootBackground) {
          bootBackground = false;
          const bootPreset = preset.id;
          appBg.style.backgroundImage = 'url("assets/img/backgrounds/thumb-' + preset.file.replace(/"/g, '%22') + '")';
          setTimeout(() => {
            if (state.background === bootPreset && !state.bgImage && !document.body.classList.contains('we-video-bg')) {
              appBg.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
            }
          }, 140);
          syncPerformanceControls();
          if (persist !== false) U.save({ uiOpacity: state.uiOpacity, glassBlur: state.glassBlur, animSpeed: state.animSpeed, background: state.background, bgImage: state.bgImage, bgMode: state.bgMode, wallpaperApi: state.wallpaperApi, wallpaperProvider: state.wallpaperProvider });
          return;
        }
      }
      appBg.style.backgroundImage = url ? 'url("' + url.replace(/"/g, '%22') + '")' : 'none';
    }
    syncPerformanceControls();
    if (persist !== false) U.save({ uiOpacity: state.uiOpacity, glassBlur: state.glassBlur, animSpeed: state.animSpeed, background: state.background, bgImage: state.bgImage, bgMode: state.bgMode, wallpaperApi: state.wallpaperApi, wallpaperProvider: state.wallpaperProvider });
    if (state.currentLab) {
      state.currentLab.view.dirty = true;
      if (state.currentLab.chart) setTimeout(() => state.currentLab && state.currentLab.chart.draw(), 30);
    }
  }

  function setBackground(value, custom) {
    clearWeVideo();
    if (custom) {
      state.bgImage = value || '';
      if (value) state.background = 'custom';
    } else {
      state.background = value;
      state.bgImage = '';
    }
    applyPerformance(true);
  }

  function readBackgroundFile(file, done) {
    if (!file || !/^image\//.test(file.type)) { toast('请选择图片文件', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 1800, maxH = 1200;
          let w = img.width, h = img.height;
          const ratio = Math.min(1, maxW / w, maxH / h);
          w = Math.max(1, Math.round(w * ratio)); h = Math.max(1, Math.round(h * ratio));
          const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
          done(canvas.toDataURL('image/jpeg', 0.84));
        } catch (err) { toast('图片处理失败：' + err.message, 'error'); }
      };
      img.onerror = () => toast('图片无法读取', 'error');
      img.src = reader.result;
    };
    reader.onerror = () => toast('图片读取失败', 'error');
    reader.readAsDataURL(file);
  }

  function bgResultsHTML(items) {
    const box = $('[data-bg-results]');
    if (!box) return;
    if (!items.length) { box.innerHTML = '<p class="bg-hint">没有找到可用图片，换一个关键词试试。</p>'; return; }
    box.innerHTML = '<div class="bg-result-grid">' + items.slice(0, 8).map((it) => '<button class="bg-result" data-bg-url="' + U.esc(it.url) + '" title="' + U.esc(it.title || '') + '"><img src="' + U.esc(it.thumb || it.url) + '" alt=""><span>' + U.esc((it.title || '壁纸').slice(0, 28)) + '</span></button>').join('') + '</div>';
  }

  async function fetchBingWallpapers(query) {
    if (!query) {
      const res = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const url = data.url || data.image || '';
      if (!/^https?:/.test(url)) throw new Error('Bing 未返回图片');
      return [{ title: data.title || data.copyright || 'Bing 每日壁纸', url, thumb: url }];
    }
    const bingUrl = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query) + '&format=rss';
    const proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(bingUrl),
      'https://corsproxy.io/?url=' + encodeURIComponent(bingUrl)
    ];
    let lastErr = null;
    for (const proxy of proxies) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        let res;
        try { res = await fetch(proxy, { signal: controller.signal }); } finally { clearTimeout(timer); }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        if (query) {
          const doc = new DOMParser().parseFromString(text, 'text/xml');
          const nodes = [...doc.querySelectorAll('item')];
          const items = nodes.map((item) => {
            const title = (item.querySelector('title') && item.querySelector('title').textContent || 'Bing 壁纸').trim();
            const enc = item.getElementsByTagName('enclosure')[0] || item.getElementsByTagName('media:content')[0];
            let url = enc ? enc.getAttribute('url') : '';
            if (!url) {
              const m = text.match(/https?:\/\/[^"'<> ]+\.(?:jpe?g|png|webp)(?:\?[^"'<> ]*)?/i);
              if (m) url = m[0];
            }
            if (url && url.startsWith('/')) url = 'https://www.bing.com' + url;
            return { title, url, thumb: url };
          }).filter((x) => /^https?:/.test(x.url));
          if (items.length) return items;
        } else {
          const data = JSON.parse(text);
          const items = (data.images || []).map((it) => ({
            title: it.copyright || it.title || 'Bing 每日壁纸',
            url: 'https://www.bing.com' + it.urlbase + '_1920x1080.jpg',
            thumb: 'https://www.bing.com' + it.urlbase + '_480x270.jpg'
          }));
          if (items.length) return items;
        }
        throw new Error('Bing 未返回图片');
      } catch (err) { lastErr = err; }
    }
    throw lastErr || new Error('Bing 连接失败');
  }

  async function fetchWikimediaWallpapers(query) {
    const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1200', format: 'json', origin: '*' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res;
    try { res = await fetch('https://commons.wikimedia.org/w/api.php?' + params.toString(), { mode: 'cors', signal: controller.signal }); }
    finally { clearTimeout(timer); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];
    return pages.map((p) => ({ title: p.title, url: p.imageinfo && p.imageinfo[0] ? p.imageinfo[0].url : '', thumb: p.imageinfo && p.imageinfo[0] ? p.imageinfo[0].thumburl : '' })).filter((x) => x.url && /\.(jpe?g|png|webp)(\?|$)/i.test(x.url));
  }

  async function searchWallpapers(query) {
    const q = String(query || '').trim();
    const box = $('[data-bg-results]');
    if (!q && state.wallpaperProvider === 'wikimedia') { toast('请输入壁纸关键词', 'error'); return; }
    if (box) box.innerHTML = '<p class="bg-hint">正在搜索 ' + (state.wallpaperProvider === 'bing' ? 'Bing.com' : 'Wikimedia Commons') + '…</p>';
    try {
      let items = state.wallpaperProvider === 'bing'
        ? await fetchBingWallpapers(q)
        : await fetchWikimediaWallpapers(q);
      bgResultsHTML(items);
      if (!items.length) toast('没有找到图片，换一个关键词试试', 'error');
    } catch (err) {
      if (state.wallpaperProvider === 'bing' && q) {
        try {
          const items = await fetchWikimediaWallpapers(q);
          bgResultsHTML(items);
          if (box) box.insertAdjacentHTML('afterbegin', '<p class="bg-hint">Bing 连接失败，已自动切换到 Wikimedia 结果。</p>');
          return;
        } catch (e2) { /* show original Bing error below */ }
      }
      if (box) box.innerHTML = '<p class="bg-hint">联网搜索失败：' + U.esc(err.message) + '。请检查网络，或使用上传图片 / 桌面 API。</p>';
      toast('壁纸搜索失败', 'error');
    }
  }

  async function discoverWallpaperApi() {
    try {
      const res = await fetch(location.origin + '/api/wallpaper-engine/current', { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && data.current) { await syncWallpaperEngine(); return; }
      }
    } catch (e) { /* continue to generic local APIs */ }
    const candidates = [
      'http://127.0.0.1:17890/wallpaper',
      'http://127.0.0.1:17890/api/wallpaper',
      'http://127.0.0.1:17600/wallpaper',
      'http://127.0.0.1:8765/wallpaper',
      'http://127.0.0.1:12345/wallpaper',
      'http://localhost:17890/wallpaper'
    ];
    if (window.prismWallpaper && typeof window.prismWallpaper.get === 'function') {
      try {
        const result = await window.prismWallpaper.get({ candidates });
        const url = typeof result === 'string' ? result : result && (result.url || result.image);
        if (url) { setBackground(url, true); toast('已读取系统壁纸 API'); return; }
      } catch (e) { /* continue */ }
    }
    for (const endpoint of candidates) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        let res;
        try { res = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } }); }
        finally { clearTimeout(timer); }
        if (!res.ok) continue;
        const data = await res.json();
        const url = typeof data === 'string' ? data : (data.url || data.image || data.imageUrl || data.wallpaper || (Array.isArray(data.urls) ? data.urls[0] : ''));
        if (url && /^(https?:|data:image\/)/.test(url)) {
          state.wallpaperApi = endpoint;
          const input = $('[data-wallpaper-api]');
          if (input) input.value = endpoint;
          setBackground(url, true);
          toast('已找到系统壁纸 API：' + endpoint);
          return;
        }
      } catch (e) { /* try next */ }
    }
    toast('未发现本机壁纸 API，请填写接口地址', 'error');
    const box = $('[data-bg-results]');
    if (box) box.innerHTML = '<p class="bg-hint">未发现自动 API。请在地址栏填写桌面壁纸软件的 HTTP API，或让软件通过 <code>window.prismWallpaper.get()</code> 提供图片 URL。</p>';
  }

  async function syncDesktopWallpaper() {
    const input = $('[data-wallpaper-api]');
    const endpoint = String((input && input.value) || state.wallpaperApi || '').trim();
    if (!endpoint) { toast('请先填写桌面壁纸 API 地址', 'error'); return; }
    state.wallpaperApi = endpoint;
    applyPerformance(true);
    try {
      let result;
      if (window.prismWallpaper && typeof window.prismWallpaper.get === 'function') {
        result = await window.prismWallpaper.get({ endpoint });
      } else {
        const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        result = await res.json();
      }
      let url = '';
      if (typeof result === 'string') url = result;
      else if (result && typeof result === 'object') {
        url = result.url || result.image || result.imageUrl || result.wallpaper || (Array.isArray(result.urls) ? result.urls[0] : '') || (Array.isArray(result.images) ? result.images[0] : '');
      }
      if (!url || !/^(https?:|data:image\/)/.test(url)) throw new Error('API 未返回可用的图片 URL');
      setBackground(url, true);
      toast('已同步桌面壁纸');
    } catch (err) {
      toast('桌面壁纸同步失败：' + err.message, 'error');
      const box = $('[data-bg-results]');
      if (box) box.innerHTML = '<p class="bg-hint">桌面 API 调用失败：' + U.esc(err.message) + '。浏览器只能加载 http(s) 或 data:image 图片；本地文件路径需要由桌面 API 提供 HTTP 地址。</p>';
    }
  }

  let weLiveTimer = null;
  let weLiveBusy = false;

  function clearWeVideo() {
    if (weLiveTimer) { clearInterval(weLiveTimer); weLiveTimer = null; }
    weLiveBusy = false;
    const old = $('#weVideoLayer');
    if (old) old.remove();
    const oldLive = $('#weLiveLayer');
    if (oldLive) oldLive.remove();
    document.body.classList.remove('we-video-bg');
    state.weCurrent = null;
    const status = $('[data-we-status]');
    if (status) status.textContent = '未连接';
  }

  function applyWeLive(url, title, fallback) {
    clearWeVideo();
    const layer = document.createElement('div');
    layer.id = 'weLiveLayer';
    layer.className = 'we-video-layer';
    layer.innerHTML = '<img alt=""><div class="we-video-veil"></div>';
    document.body.appendChild(layer);
    const img = layer.querySelector('img');
    let previousUrl = '';
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      clearWeVideo();
      if (fallback) setBackground(fallback, true);
      toast('Wallpaper Engine 实时画面不可用，已回退预览图', 'error');
    };
    img.addEventListener('error', fail);
    const fetchFrame = async () => {
      if (weLiveBusy || failed || document.hidden) return;
      weLiveBusy = true;
      try {
        const res = await fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const next = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('image decode'));
          img.src = next;
        });
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        previousUrl = next;
      } catch (err) {
        fail();
      } finally {
        weLiveBusy = false;
      }
    };
    fetchFrame();
    weLiveTimer = setInterval(fetchFrame, 50);
    document.body.classList.add('we-video-bg');
    const status = $('[data-we-status]');
    if (status) status.textContent = '实时动态 · ' + (title || 'Wallpaper Engine');
    state.weCurrent = { kind: 'live', url, title };
    toast('已读取 Wallpaper Engine 实时动态壁纸');
  }

  function applyWeVideo(url, title) {
    clearWeVideo();
    const layer = document.createElement('div');
    layer.id = 'weVideoLayer';
    layer.className = 'we-video-layer';
    layer.innerHTML = '<video autoplay muted loop playsinline preload="auto"></video><div class="we-video-veil"></div>';
    document.body.appendChild(layer);
    const video = layer.querySelector('video');
    if (video) {
      video.src = url;
      video.addEventListener('error', () => toast('Wallpaper Engine 视频加载失败', 'error'));
      const play = video.play();
      if (play && play.catch) play.catch(() => {});
    }
    document.body.classList.add('we-video-bg');
    const status = $('[data-we-status]');
    if (status) status.textContent = '动态视频 · ' + (title || 'Wallpaper Engine');
    state.weCurrent = { kind: 'video', url, title };
    toast('已读取 Wallpaper Engine 动态壁纸');
  }

  async function syncWallpaperEngine() {
    const status = $('[data-we-status]');
    if (status) status.textContent = '正在读取 Wallpaper Engine…';
    const bases = [location.origin, 'http://127.0.0.1:8088'];
    let lastError = '';
    for (const base of bases) {
      try {
        const endpoint = base === location.origin
          ? base + '/api/wallpaper-engine/current'
          : base.replace(/\/+$/, '') + '/current';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        let res;
        try { res = await fetch(endpoint, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } }); }
        finally { clearTimeout(timer); }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!data || data.ok === false || !data.current) throw new Error(data && data.error ? data.error : '未返回当前壁纸');
        const cur = data.current;
        const kind = cur.kind || 'image';
        let url = cur.url || cur.file || cur.preview || '';
        if (!url) throw new Error('缺少壁纸地址');
        if (!/^https?:|^data:/.test(url)) url = new URL(url, base).href;
        const thumb = cur.thumbnail ? new URL(cur.thumbnail, base).href : '';
        if (kind === 'video') {
          applyWeVideo(url, cur.title);
        } else if (kind === 'scene' || kind === 'web') {
          const liveUrl = base + (base === location.origin ? '/api/wallpaper-engine/frame' : '/frame');
          applyWeLive(liveUrl, cur.title, thumb || url);
        } else {
          setBackground(url, true);
          if (status) status.textContent = '静态壁纸 · ' + (cur.title || 'Wallpaper Engine');
          state.weCurrent = { kind, url, title: cur.title || '' };
          toast('已读取 Wallpaper Engine 壁纸');
        }
        return;
      } catch (err) {
        lastError = err.message || String(err);
      }
    }
    if (status) status.textContent = '未找到 Wallpaper Engine API';
    toast('未连接 Wallpaper Engine：' + lastError, 'error');
    const box = $('[data-bg-results]');
    if (box) box.innerHTML = '<p class="bg-hint">未发现 Wallpaper Engine API。便携版会自动提供 <code>/api/wallpaper-engine</code>；开发模式请先运行打包版，或安装 WE API 服务（默认 8088）。</p>';
  }

  function syncPerformanceControls() {
    $$('[data-perf]').forEach((el) => {
      const key = el.dataset.perf;
      const map = { opacity: state.uiOpacity, blur: state.glassBlur, speed: state.animSpeed };
      if (key in map) {
        el.value = map[key];
        const out = $('[data-perf-value="' + key + '"]');
        if (out) out.textContent = key === 'speed' ? map[key].toFixed(1) + '×' : Math.round(map[key]) + (key === 'blur' ? 'px' : '%');
        const min = Number(el.min) || 0, max = Number(el.max) || 100;
        el.style.setProperty('--fill', ((Number(el.value) - min) / (max - min) * 100) + '%');
      }
    });
    $$('[data-bg-id]').forEach((b) => b.classList.toggle('active', !state.bgImage && b.dataset.bgId === state.background));
    $$('[data-bg-custom]').forEach((b) => b.classList.toggle('active', !!state.bgImage && b.dataset.bgCustom === 'upload'));
    $$('[data-bg-provider]').forEach((b) => b.classList.toggle('active', b.dataset.bgProvider === state.wallpaperProvider));
    $$('[data-bg-mode]').forEach((b) => b.classList.toggle('active', b.dataset.bgMode === state.bgMode));
    const api = $('[data-wallpaper-api]');
    if (api && document.activeElement !== api) api.value = state.wallpaperApi || '';
  }

  function performanceFields() {
    const cards = BACKGROUNDS.map((b) => '<button class="bg-choice' + (!state.bgImage && state.background === b.id ? ' active' : '') + '" data-bg-id="' + b.id + '"><img src="assets/img/backgrounds/thumb-' + b.file + '" alt="' + U.esc(b.name) + '"><span>' + U.esc(b.name) + '</span><em>' + b.tone + '</em></button>').join('');
    return '<div class="settings-block perf-block">' +
      '<div class="settings-label"><span><b>性能与动效</b><em>降低动效速度或关闭毛玻璃可改善低性能设备</em></span></div>' +
      '<div class="perf-grid">' +
      '<label class="perf-control"><span>界面不透明度 <b data-perf-value="opacity">' + Math.round(state.uiOpacity) + '%</b></span><input type="range" min="0" max="100" step="1" value="' + state.uiOpacity + '" data-perf="opacity"></label>' +
      '<label class="perf-control"><span>毛玻璃模糊 <b data-perf-value="blur">' + state.glassBlur + 'px</b></span><input type="range" min="0" max="20" step="1" value="' + state.glassBlur + '" data-perf="blur"></label>' +
      '<label class="perf-control"><span>动画速度 <b data-perf-value="speed">' + state.animSpeed.toFixed(1) + '×</b></span><input type="range" min="0.4" max="2.5" step="0.1" value="' + state.animSpeed + '" data-perf="speed"></label>' +
      '</div></div>' +
      '<div class="settings-block bg-block"><div class="settings-label"><span><b>软件背景</b><em>内置自然与科学图片 · 支持上传、联网搜索和桌面壁纸 API</em></span><span class="pill">' + (state.bgImage ? '自定义' : (BACKGROUNDS.find((b) => b.id === state.background) || BACKGROUNDS[0]).name) + '</span></div>' +
      '<div class="bg-grid">' + cards + '<button class="bg-choice bg-upload' + (state.bgImage ? ' active' : '') + '" data-bg-upload><span class="bg-upload-ico">+</span><span>上传图片</span><em>从本机选择</em></button></div>' +
      '<div class="bg-mode"><span>显示方式</span><div class="bg-mode-group">' +
      '<button data-bg-mode="cover" class="' + (state.bgMode === 'cover' ? 'active' : '') + '">填充</button>' +
      '<button data-bg-mode="contain" class="' + (state.bgMode === 'contain' ? 'active' : '') + '">适应</button>' +
      '<button data-bg-mode="stretch" class="' + (state.bgMode === 'stretch' ? 'active' : '') + '">拉伸</button>' +
      '<button data-bg-mode="tile" class="' + (state.bgMode === 'tile' ? 'active' : '') + '">平铺</button>' +
      '<button data-bg-mode="center" class="' + (state.bgMode === 'center' ? 'active' : '') + '">原尺寸</button>' +
      '</div></div>' +
      '<div class="bg-tools"><div class="bg-provider"><span>搜索来源</span><button data-bg-provider="bing" class="active">Bing</button><button data-bg-provider="wikimedia">Wikimedia</button></div>' +
      '<div class="bg-search"><input type="text" placeholder="搜索 Bing 壁纸，如：星云 / 森林 / 实验室" data-bg-query><button class="btn ghost small" data-bg-search>联网搜索</button></div>' +
      '<div class="bg-search"><input type="text" placeholder="桌面壁纸 API 地址，或点击自动查找" data-wallpaper-api><button class="btn ghost small" data-wallpaper-sync>同步</button><button class="btn ghost small" data-wallpaper-discover>自动查找</button></div></div>' +
      '<div class="we-box"><div><b>Wallpaper Engine</b><span data-we-status>读取当前桌面动态壁纸</span></div><button class="btn ghost small" data-we-sync>读取动态壁纸</button></div>' +
      '<div class="bg-results" data-bg-results><p class="bg-hint">留空搜索 Bing 每日壁纸；输入关键词联网搜索，Bing 失败时自动回退 Wikimedia。桌面 API 需返回 <code>{ "url": "..." }</code> 或图片地址数组。</p></div>' +
      '<div class="bg-credit">内置图片来自 Unsplash，仅用于界面背景；可在设置中随时切换或清除。</div>' +
      '<button class="btn ghost small" data-bg-clear>恢复默认背景</button>' +
      '</div>' +
      '<input type="file" accept="image/*" data-bg-file hidden>';
  }

  function syncAppearanceControls() {
    const pct = Math.round(state.fontScale * 100);
    $$('[data-font-value]').forEach((el) => { el.textContent = pct + '%'; });
    $$('[data-font-slider]').forEach((el) => {
      if (Number(el.value) !== pct) el.value = pct;
      el.style.setProperty('--fill', ((pct - 100) / 50 * 100) + '%');
    });
    $$('[data-set-theme]').forEach((el) => {
      const active = el.dataset.setTheme === state.theme;
      el.classList.toggle('active', active);
      el.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    $$('[data-set-style]').forEach((el) => {
      const active = el.dataset.setStyle === state.uiStyle;
      el.classList.toggle('active', active);
      el.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
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
    const total = OL.experiments.length;
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const pct = Math.round(Math.min(total, done) / total * 100);
    const txt = $('#sideProgressText'), bar = $('#sideProgressBar'), cnt = $('#sideDoneCount');
    if (txt) txt.textContent = pct + '%';
    if (bar) bar.style.width = pct + '%';
    if (cnt) cnt.textContent = Math.min(total, done);
  }

  function setCrumb(html) { const el = $('#crumb'); if (el) el.innerHTML = html; }

  function setLibraryExpanded(open) {
    const sub = $('#catSub');
    const btn = $('.nav-library');
    if (sub) sub.classList.toggle('open', !!open);
    if (sub) sub.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function setActiveNav(name, category) {
    $$('.nav-item').forEach((b) => b.classList.remove('active'));
    if (name === 'home') { const b = $('.nav-item[data-route="home"]'); if (b) b.classList.add('active'); }
    if (name === 'library') { const b = $('.nav-item[data-route="library"]'); if (b) b.classList.add('active'); }
    if (name === 'workshop') { const b = $('.nav-item[data-route="workshop"]'); if (b) b.classList.add('active'); }
    setLibraryExpanded(name === 'library');
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

  let modalSeq = 0;
  function openModal(title, body, opts) {
    opts = opts || {};
    modalSeq++;
    setFontPanel(false);
    const root = $('#modalRoot');
    root.classList.remove('closing');
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
    if (!root.classList.contains('open')) return;
    const seq = ++modalSeq;
    root.classList.remove('open');
    root.classList.add('closing');
    root.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (seq !== modalSeq) return;
      root.classList.remove('closing');
      root.innerHTML = '';
    }, 220 / state.animSpeed);
  }

  function openMeasureHelp(kind) {
    if (kind === 'micrometer') {
      openModal('螺旋测微器使用方法', [
        '<p style="margin:0 0 12px;color:var(--text-2);font-size:12px;line-height:1.7">螺旋测微器（千分尺）用于测量金属丝的直径，精度 0.01 mm，需估读到 0.001 mm。</p>',
        '<ol class="about-steps"><li>转动棘轮，使测砧与测微螺杆轻轻接触，检查零刻度。</li><li>把金属丝夹在测砧与螺杆之间，听到棘轮“咔哒”声后停止，避免压扁金属丝。</li><li>先读固定刻度（主尺），注意半毫米刻度是否露出。</li><li>再读可动刻度（套筒），估读到 0.001 mm。</li><li>读数 = 固定刻度 + 可动刻度 × 0.01 mm。</li><li>在金属丝的不同位置测三次，取平均值。</li></ol>'
      ].join(''), { sub: '螺旋测微器 · 0.01 mm' });
      return;
    }
    openModal('游标卡尺使用方法', [
      '<p style="margin:0 0 12px;color:var(--text-2);font-size:12px;line-height:1.7">游标卡尺用于测量金属丝的有效长度，常用精度为 0.02 mm 或 0.05 mm。</p>',
      '<ol class="about-steps"><li>合拢两个外测量爪，检查主尺与游标零刻度是否对齐。</li><li>将被测金属丝夹在外测量爪之间，不要用力过猛。</li><li>先读主尺上离游标零刻线最近的整毫米数。</li><li>再找游标上与主尺刻度对齐的格数。</li><li>读数 = 主尺读数 + 对齐格数 × 精度；0.02 mm 卡尺读到 0.02 mm。</li><li>在不同位置测量三次，取平均值作为有效长度 L。</li></ol>'
    ].join(''), { sub: '游标卡尺 · 0.02 mm' });
  }

  function openHelp() {
    openModal('快速指南', [
      '<p style="margin:0 0 14px;color:var(--text-2);font-size:12px;line-height:1.7">中山市中山纪念中学物理实验室把高中物理的 22 个基本实验做成了可交互的模拟器。每个实验都提供实时读数、图像探究与实验向导。</p>',
      '<div class="api-list">',
      '<li>' + ui('info') + '<span><b>拖动变量</b>：右侧滑块会实时改变模拟，图像同步更新。</span></li>',
      '<li>' + ui('chart') + '<span><b>采集数据</b>：点击按钮记录一组数据，图表与数据表会自动累积。</span></li>',
      '<li>' + ui('play') + '<span><b>播放 / 暂停</b>：按 <kbd class="kbd-hint">空格</kbd> 控制运动类实验。</span></li>',
      '<li>' + ui('spark') + '<span><b>创意工坊</b>：用公式和变量设计自己的实验，并导出为 JSON 或插件。</span></li>',
      '<li><span style="font-weight:700;font-size:13px">⚙</span><span><b>设置</b>：左下角学习进度上方，可调整字体、外观、性能、毛玻璃、动画速度与背景。</span></li>',
      '<li><span style="font-weight:700;font-size:13px">↗</span><span><b>PPT / WPS</b>：拖动实验卡片到幻灯片生成链接，放映时点击即可跳转；也可在实验页复制「PPT 链接」。</span></li>',
      '</div>',
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:10px;color:var(--text-3)">快捷键：⌘/Ctrl + K 搜索 · 空格 播放/暂停 · R 重置 · Esc 关闭</div>'
    ].join(''));
  }

  function appearanceFields() {
    return '<div class="settings-block">' +
      '<div class="settings-label"><span><b>字体大小</b><em>同时影响界面、实验画布和图表标注</em></span><strong data-font-value>' + Math.round(state.fontScale * 100) + '%</strong></div>' +
      '<input class="settings-range" type="range" min="100" max="150" step="1" value="' + Math.round(state.fontScale * 100) + '" data-font-slider aria-label="字体大小">' +
      '<div class="range-scale"><span>100%</span><span>125%</span><span>150%</span></div>' +
      '<div class="font-preview">把每一个公式，变成看得见的实验。<span>中山市中山纪念中学物理实验室</span></div>' +
      '</div>' +
      '<div class="settings-block">' +
      '<div class="settings-label"><span><b>明暗外观</b><em>白天与夜晚都可以舒适阅读</em></span></div>' +
      '<div class="theme-switch">' +
      '<button data-set-theme="light">' + ui('sun') + '<span>浅色</span></button>' +
      '<button data-set-theme="dark">' + ui('moon') + '<span>深色</span></button>' +
      '</div></div>' +
      '<div class="settings-block">' +
      '<div class="settings-label"><span><b>界面主题</b><em>选择你熟悉的桌面风格</em></span></div>' +
      '<div class="style-grid">' +
      '<button class="style-choice" data-set-style="win"><span class="style-shot win-shot"><i></i><i></i><i></i></span><span class="style-copy"><b>Windows 风格</b><em>毛玻璃、柔和渐变与高密度信息</em></span></button>' +
      '<button class="style-choice" data-set-style="mac"><span class="style-shot mac-shot"><i></i><i></i><i></i></span><span class="style-copy"><b>macOS 简约</b><em>纯色面板、轻边框与更安静的留白</em></span></button>' +
      '</div></div>';
  }

  function openSettings() {
    openModal('设置', appearanceFields() + performanceFields(), {
      sub: '外观、字号、性能与背景会保存在这台设备上',
      footer: '<button class="btn ghost small" data-action="reopen-welcome">重新查看欢迎页</button><button class="btn" data-action="close-modal">完成</button>'
    });
    syncAppearanceControls();
    syncPerformanceControls();
  }

  function openWelcome() {
    openModal('欢迎来到中山市中山纪念中学物理实验室', '<p class="welcome-lead">先选择你的阅读方式。以后随时可以在左下角 <b>设置</b> 中修改。</p>' + appearanceFields(), {
      sub: '22 个高中物理实验，准备好了',
      footer: '<button class="btn" data-action="finish-welcome">开始探索 ' + ui('arrow') + '</button>'
    });
    setTimeout(() => { const r = $('[data-font-slider]'); if (r) r.focus({ preventScroll: true }); }, 60);
    syncAppearanceControls();
  }

  function finishWelcome() {
    U.save({ onboarded: true, fontScale: state.fontScale, theme: state.theme, uiStyle: state.uiStyle });
    closeModal();
    toast('已保存你的阅读偏好');
  }

  function openErrorAnalysis() {
    const cur = state.currentLab;
    if (!cur || !cur.exp.errorAnalysis) return;
    const ea = cur.exp.errorAnalysis;
    const cases = (ea.cases || []).map((c) =>
      '<div class="error-case ' + U.esc(c.kind || 'note') + '">' +
      '<b>' + U.esc(c.name) + '</b>' +
      '<div class="error-case-formula">' + OL.tex.render(c.tex || c.formula, false) + '</div>' +
      '<em>' + U.esc(c.verdict) + '</em></div>'
    ).join('');
    openModal('误差分析', [
      '<p class="error-analysis-lead">' + U.esc(ea.lead) + '</p>',
      '<div class="error-formula">' + OL.tex.render(ea.formulaTex || ea.formula, true) + '</div>',
      '<div class="error-case-grid">' + cases + '</div>',
      '<p class="error-method">' + U.esc(ea.method) + '</p>',
      '<div class="error-conclusion"><b>误差方向判断：</b>' + U.esc(ea.conclusion) + '</div>'
    ].join(''), {
      sub: cur.exp.title,
      footer: '<button class="btn" data-action="close-modal">关闭</button>'
    });
  }

  function openMistakes() {
    const cur = state.currentLab;
    if (!cur) return;
    const items = MISTAKES[cur.exp.id] || ['请结合实验步骤检查操作顺序、读数与单位。'];
    openModal('易错点 · ' + cur.exp.title,
      '<div class="mistake-list">' + items.map((m, i) => '<div class="mistake-item"><span>' + (i + 1) + '</span><p>' + U.esc(m) + '</p></div>').join('') + '</div>',
      { sub: '教学提示 · 点击关闭后继续实验', footer: '<button class="btn" data-action="close-modal">我知道了</button>' });
  }

  function loadSearchHistory() {
    try { const v = JSON.parse(localStorage.getItem('prism-search-history') || '[]'); return Array.isArray(v) ? v.slice(0, 6) : []; }
    catch (e) { return []; }
  }
  function rememberSearch(q) {
    q = String(q || '').trim();
    if (!q) return;
    const list = loadSearchHistory().filter((x) => x !== q);
    list.unshift(q);
    try { localStorage.setItem('prism-search-history', JSON.stringify(list.slice(0, 6))); } catch (e) { }
  }

  let paletteSeq = 0;
  function openPalette() {
    const root = $('#paletteRoot');
    if (state.paletteOpen) return;
    paletteSeq++;
    root.classList.remove('closing');
    setFontPanel(false);
    state.paletteOpen = true;
    state.paletteIndex = 0;
    root.innerHTML =
      '<div class="palette" role="dialog" aria-label="实验搜索">' +
      '<div class="palette-list" id="paletteList"></div>' +
      '<div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>↵</kbd> 打开</span><span style="margin-left:auto">' + OL.experiments.length + ' 个实验 · 4 个领域</span></div>' +
      '</div>';
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    const input = $('#globalSearchInput');
    renderPalette(input ? input.value : '');
    positionPalette();
    setTimeout(positionPalette, 360);
  }

  function positionPalette() {
    const root = $('#paletteRoot');
    const shell = $('#searchShell');
    const panel = root && root.querySelector('.palette');
    if (!panel || !shell) return;
    const r = shell.getBoundingClientRect();
    const width = Math.min(480, Math.max(320, window.innerWidth - 24));
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, r.left + r.width / 2 - width / 2));
    panel.style.position = 'fixed';
    panel.style.left = left + 'px';
    panel.style.top = Math.round(r.bottom + 8) + 'px';
    panel.style.width = width + 'px';
    panel.style.maxHeight = Math.max(260, Math.min(510, window.innerHeight - r.bottom - 24)) + 'px';
  }

  function renderPalette(q) {
    const list = $('#paletteList');
    if (!list) return;
    q = (q || '').trim().toLowerCase();
    const items = allForSearch().filter((e) => {
      const hay = [e.title, e.short, e.description, e.formula, (e.tags || []).join(' '), catOf(e).name].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    });
    const history = q ? [] : loadSearchHistory();
    const historyHTML = history.length ? '<div class="palette-group-label">最近搜索</div><div class="search-history">' + history.map((h) => '<button data-history="' + U.esc(h) + '">' + U.esc(h) + '</button>').join('') + '</div>' : '';
    const suggestions = q ? items : items.slice(0, 8);
    if (!suggestions.length && !history.length) {
      list.innerHTML = '<div class="empty-workshop"><p>没有找到匹配的实验</p></div>';
      return;
    }
    list.innerHTML = historyHTML + '<div class="palette-group-label">' + (q ? '匹配实验' : '推荐实验') + '</div>' + (suggestions.length ? suggestions.map((e, i) => {
      const cat = catOf(e);
      return '<button class="palette-item' + (i === state.paletteIndex ? ' sel' : '') + '" data-palette-lab="' + e.id + '" style="--accent:' + cat.color + '">' +
        '<span class="pi-ico">' + OL.icon(e.icon) + '</span>' +
        '<span><strong>' + U.esc(e.title) + '</strong><span>' + U.esc(e.short) + '</span></span>' +
        '<span class="pi-tag">' + U.esc(cat.name) + '</span></button>';
    }).join('') : '<div class="empty-workshop"><p>没有找到匹配的实验</p></div>');
    $$('.palette-item', list).forEach((b) => {
      b.addEventListener('click', () => {
        const input = $('#globalSearchInput');
        if (input && input.value.trim()) rememberSearch(input.value);
        closePalette(); navigate('lab/' + b.dataset.paletteLab);
      });
    });
    $$('[data-history]', list).forEach((b) => {
      b.addEventListener('click', () => {
        const input = $('#globalSearchInput');
        if (input) { input.value = b.dataset.history; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }
      });
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
      if (sel) { const id = sel.dataset.paletteLab; const input = $('#globalSearchInput'); if (input && input.value.trim()) rememberSearch(input.value); closePalette(); navigate('lab/' + id); }
    }
  }

  function updatePaletteSel() {
    const items = $$('.palette-item');
    items.forEach((b, i) => b.classList.toggle('sel', i === state.paletteIndex));
    if (items[state.paletteIndex]) items[state.paletteIndex].scrollIntoView({ block: 'nearest' });
  }

  function closePalette() {
    state.paletteOpen = false;
    const input = $('#globalSearchInput');
    if (input) { input.value = ''; input.blur(); }
    const root = $('#paletteRoot');
    if (!root.classList.contains('open')) return;
    const seq = ++paletteSeq;
    root.classList.remove('open');
    root.classList.add('closing');
    root.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (seq !== paletteSeq) return;
      root.classList.remove('closing');
      root.innerHTML = '';
    }, 220 / state.animSpeed);
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
    if (parts[0] === 'about') return { name: 'about' };
    return { name: 'home' };
  }

  function navigate(path) {
    const next = '#/' + String(path || 'home').replace(/^#?\/?/, '');
    if (location.hash === next) renderRoute(true);
    else location.hash = next;
  }

  function labUrl(id) {
    if (location.protocol === 'file:') return 'file:///' + location.pathname.replace(/^\/+/, '') + '#/lab/' + id;
    return location.origin + '/#/lab/' + id;
  }

  function copyLabLink() {
    if (!state.currentLab) return;
    const url = labUrl(state.currentLab.id);
    const done = () => toast('实验链接已复制，可粘贴为 PPT 超链接');
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => toast(url));
    else toast(url);
  }

  function renderRoute(fromHash) {
    if (state.paletteOpen) closePalette();
    const r = parseRoute();
    if (r.name === 'lab') { renderLab(r.id); return; }
    teardownLab();
    if (state.heroStop) { state.heroStop(); state.heroStop = null; }
    viewEl.scrollTop = 0;
    if (r.name === 'home') {
      state.route = 'home'; state.filter = state.filter || 'all';
      renderHome(); setCrumb('<strong>概览</strong>'); setActiveNav('home');
    } else if (r.name === 'library') {
      state.route = 'library';
      if (r.filter) state.filter = r.filter;
      renderLibrary(); setCrumb('<strong>实验库</strong>'); setActiveNav('library', state.filter !== 'all' ? state.filter : null);
    } else if (r.name === 'workshop') {
      state.route = 'workshop';
      renderWorkshop(); setCrumb('<strong>创意工坊</strong>'); setActiveNav('workshop');
    } else if (r.name === 'about') {
      state.route = 'about';
      renderAbout(); setCrumb('<strong>关于</strong>'); setActiveNav('about');
    } else {
      state.route = 'home';
      renderHome(); setCrumb('<strong>概览</strong>'); setActiveNav('home');
    }
    $('#topbar') && $('#topbar').classList.remove('scrolled');
    const tb = $('.topbar'); if (tb) tb.classList.remove('scrolled');
  }

  window.addEventListener('hashchange', () => renderRoute(false));

  /* ------------------------------------------------------------
     Cards & dashboard
     ------------------------------------------------------------ */
  function expCard(e, index) {
    const cat = catOf(e);
    const book = OL.bookOf ? OL.bookOf(e) : null;
    const done = U.isDone(e.id);
    return '<button class="exp-card" data-lab="' + e.id + '" draggable="true" title="点击打开 · 拖动到 PowerPoint / WPS 生成实验链接" style="--accent:' + (e.accent || cat.color) + '">' +
      '<span class="exp-art"><span class="exp-art-grid"></span><span class="exp-glyph">' + OL.icon(e.icon) + '</span><span class="exp-art-cat">' + U.esc(cat.name) + '</span></span>' +
      '<span class="exp-body"><h3>' + U.esc(e.title) + '</h3><p>' + U.esc(e.short) + '</p>' +
      '<span class="exp-foot"><span class="tag">' + U.esc(e.difficulty || '基础') + '</span><span class="dotsep"></span><span class="tag">' + U.esc(e.time || '8 分钟') + '</span>' +
      (book ? '<span class="tag book-tag">' + U.esc(book.short) + '</span>' : '') +
      '<span class="go">开始 ' + ui('arrow') + '</span></span></span></button>';
  }

  function filterChips() {
    const items = [['all', '全部'], ['mechanics', '力学'], ['electricity', '电磁学'], ['optics', '光学'], ['molecular', '热学与分子']];
    return items.map(([k, label]) => '<button class="filter-chip' + (state.filter === k ? ' active' : '') + '" data-filter="' + k + '">' + label + '</button>').join('');
  }

  function bookChips() {
    const items = [['all', '全部教材']].concat(Object.keys(OL.books).map((k) => [k, OL.books[k].short]));
    return items.map(([k, label]) => {
      const n = k === 'all' ? OL.experiments.length : OL.byBook(k).length;
      return '<button class="filter-chip book-chip' + (state.book === k ? ' active' : '') + '" data-book="' + k + '">' + U.esc(label) + '<span>' + n + '</span></button>';
    }).join('');
  }

  function filteredExperiments() {
    let list = state.filter === 'all' ? OL.experiments.slice() : OL.byCategory(state.filter);
    if (state.book !== 'all') list = list.filter((e) => e.book === state.book);
    return list;
  }

  function syncBookChips() {
    $$('[data-book]').forEach((b) => b.classList.toggle('active', b.dataset.book === state.book));
  }

  function switchScheme(index) {
    const cur = state.currentLab;
    if (!cur || !cur.exp.schemes || !cur.exp.schemes.length) return;
    const i = Math.max(0, Math.min(cur.exp.schemes.length - 1, Number(index) || 0));
    if (i === cur.view.scheme) return;
    cur.view.scheme = i;
    const display = displayContent(cur.exp, cur.view);
    U.save({ schemeSelections: Object.assign({}, U.load().schemeSelections || {}, { [cur.id]: i }) });
    const formula = $('#principleFormula');
    const copy = $('#principleCopy');
    const principle = $('#principlePrinciple');
    const note = $('#principleNote');
    if (formula) formula.innerHTML = OL.tex.render(display.formulaTex || display.formula, true);
    if (copy) copy.dataset.copy = display.formula;
    if (principle) principle.textContent = display.principle;
    if (note) note.textContent = display.formulaNote || '';
    const steps = $('#steps');
    if (steps) steps.innerHTML = stepListHTML(cur.exp, cur.view);
    const dock = $('#schemeDock');
    if (dock) {
      dock.style.setProperty('--scheme-index', i);
      $$('button', dock).forEach((b, n) => b.classList.toggle('active', n === i));
    }
    const badge = $('#schemeStageBadge');
    if (badge) badge.textContent = cur.exp.schemes[i].short || cur.exp.schemes[i].title || '';
    const banner = $('.principle-banner');
    if (banner) {
      banner.classList.remove('scheme-swap');
      void banner.offsetWidth;
      banner.classList.add('scheme-swap');
    }
    const stepsBox = $('#steps');
    if (stepsBox) {
      stepsBox.classList.remove('scheme-swap');
      void stepsBox.offsetWidth;
      stepsBox.classList.add('scheme-swap');
    }
    cur.view.dirty = true;
  }

  function renderHome() {
    const s = U.load();
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const last = resolveExp(s.last) || OL.experiments[0];
    const lastCat = catOf(last);
    viewEl.innerHTML = '<div class="view-inner">' +
      '<section class="hero">' +
      '<div class="hero-copy">' +
      '<span class="hero-badge"><i class="pulse"></i>' + OL.experiments.length + ' 个经典实验 · 全新交互引擎</span>' +
      '<h1>把每一个公式，<br><span class="grad">变成看得见的实验。</span></h1>' +
      '<p>从打点计时器到双缝干涉，用实时图像、可拖动的变量与微观动画，重新理解高中物理。</p>' +
      '<div class="hero-actions"><button class="btn primary-hero" data-action="continue">' + ui('play') + ' 继续实验</button><button class="btn secondary" data-action="open-workshop">' + ui('spark') + ' 创意工坊</button></div>' +
      '<div class="hero-meta"><div><strong>' + OL.experiments.length + '</strong><span>实验</span></div><div><strong>4</strong><span>领域</span></div><div><strong>' + done + '</strong><span>已完成</span></div><div><strong>100%</strong><span>可交互</span></div></div>' +
      '</div>' +
      '<div class="hero-visual"><canvas id="heroOrbit"></canvas><div class="hero-caption"><i></i>LIVE SIMULATION ENGINE</div></div>' +
      '</section>' +
      '<div class="dash-grid">' +
      '<div class="continue-card card" data-lab="' + last.id + '" role="button" tabindex="0"><div class="continue-art">' + OL.icon(last.icon) + '</div><div class="continue-copy"><span class="eyebrow">' + (U.isDone(last.id) ? '再次实验' : '继续上次') + '</span><h3>' + U.esc(last.title) + '</h3><p>' + U.esc(lastCat.name) + ' · ' + U.esc(last.formula) + '</p></div><button class="btn small" data-lab="' + last.id + '">' + (U.isDone(last.id) ? '重新打开' : '继续') + ' ' + ui('arrow') + '</button></div>' +
      '<div class="quick-stats card">' +
      '<div class="quick-stat"><strong>' + done + '<span>/' + OL.experiments.length + '</span></strong><em>完成实验</em></div>' +
      '<div class="quick-stat"><strong>' + done + '</strong><em>累计完成</em></div>' +
      '<div class="quick-stat"><strong>4</strong><em>学科领域</em></div>' +
      '</div></div>' +
      '<section class="workshop-promo card"><div class="wp-ico">' + ui('spark') + '</div><div class="wp-copy"><span class="eyebrow">开放实验工坊</span><h3>不只是使用者，也成为实验设计者。</h3><p>用变量、公式与可视化画布搭建自己的物理实验，导入导出 JSON，或通过插件接口扩展实验室。</p></div><button class="btn ghost" data-route="workshop">进入工坊 ' + ui('arrow') + '</button></section>' +
      '</div>';
    startHero();
  }

  function renderLibrary() {
    const s = U.load();
    const done = s.completed.filter((id) => !!OL.getExperiment(id)).length;
    const pct = Math.round(done / OL.experiments.length * 100);
    viewEl.innerHTML = '<div class="view-inner">' +
      '<div class="page-head"><div><span class="eyebrow"><span class="dot"></span>EXPERIMENT LIBRARY</span><h1 class="page-title">' + OL.experiments.length + ' 个实验，<br>一条完整的物理脉络。</h1><p class="page-sub">力学、电磁学、光学与分子热学。每个实验都可以拖动变量、记录数据、生成图像。</p></div>' +
      '<div class="library-progress"><span class="ring" style="--p:' + pct + '%"></span><span><b style="color:var(--text)">' + done + '/' + OL.experiments.length + '</b> 已完成</span></div></div>' +
      '<div class="filter-row" id="libFilters"><span class="filter-label">板块</span>' + filterChips() + '<span class="filter-spacer"></span><span class="filter-count" id="filterCount">' + filteredExperiments().length + ' 个实验</span></div>' +
      '<div class="filter-row book-filter-row" id="libBookFilters"><span class="filter-label">教材</span>' + bookChips() + '</div>' +
      '<div class="experiment-grid" id="expGrid">' + filteredExperiments().map(expCard).join('') + '</div>' +
      '</div>';
  }

  function applyFilter(cat) {
    state.filter = cat;
    $$('[data-filter]').forEach((b) => b.classList.toggle('active', b.dataset.filter === cat));
    syncBookChips();
    const grid = $('#expGrid');
    if (grid) grid.innerHTML = filteredExperiments().map(expCard).join('');
    const count = $('#filterCount');
    if (count) count.textContent = filteredExperiments().length + ' 个实验';
    if (state.route === 'library') setActiveNav('library', cat !== 'all' ? cat : null);
  }

  function applyBookFilter(book) {
    state.book = book || 'all';
    syncBookChips();
    const grid = $('#expGrid');
    if (grid) grid.innerHTML = filteredExperiments().map(expCard).join('');
    const count = $('#filterCount');
    if (count) count.textContent = filteredExperiments().length + ' 个实验';
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
  function setStageTheater(open) {
    const card = $('#stageCard');
    if (!card) return;
    const was = card.classList.contains('theater');
    if (open === was) return;
    if (open) {
      if (card.parentElement !== document.body) {
        const placeholder = document.createElement('div');
        placeholder.id = 'stageTheaterPlaceholder';
        placeholder.className = 'stage-theater-placeholder';
        card.parentNode.insertBefore(placeholder, card);
        document.body.appendChild(card);
      }
      card.classList.add('theater');
      document.body.classList.add('stage-theater');
    } else {
      card.classList.remove('theater');
      document.body.classList.remove('stage-theater');
      const placeholder = $('#stageTheaterPlaceholder');
      if (placeholder && placeholder.parentNode) placeholder.parentNode.replaceChild(card, placeholder);
      else if (card.parentElement === document.body) card.remove();
    }
    const btn = $('[data-action="expand"]');
    if (btn) btn.setAttribute('aria-label', open ? '还原实验舞台' : '放大实验舞台');
    try {
      if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
        window.chrome.webview.postMessage(open ? 'fullscreen:on' : 'fullscreen:off');
      }
    } catch (e) { }
    if (state.currentLab) {
      state.currentLab.view.dirty = true;
      setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    }
  }

  function teardownLab() {
    if (document.body.classList.contains('stage-theater')) {
      setStageTheater(false);
      const card = $('#stageCard');
      if (card && card.parentElement === document.body) card.remove();
      const placeholder = $('#stageTheaterPlaceholder');
      if (placeholder) placeholder.remove();
    }
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

  function activeSteps(exp, view) {
    const scheme = currentScheme(exp, view);
    if (scheme && scheme.steps && scheme.steps.length) return scheme.steps;
    if (exp && exp.stepVersions && view && view.stepVariant === 'complex' && exp.stepVersions.complex) {
      return exp.stepVersions.complex;
    }
    if (exp && exp.stepVersions && exp.stepVersions.simple) return exp.stepVersions.simple;
    return (exp && exp.steps) || [];
  }

  function schemeList(exp) { return exp && exp.schemes && exp.schemes.length > 1 ? exp.schemes : null; }

  function currentScheme(exp, view) {
    if (!exp || !exp.schemes || !exp.schemes.length) return null;
    const i = Math.max(0, Math.min(exp.schemes.length - 1, Number(view && view.scheme) || 0));
    return exp.schemes[i];
  }

  function displayContent(exp, view) {
    const scheme = currentScheme(exp, view);
    if (!scheme) return exp;
    return Object.assign({}, exp, {
      formula: scheme.formula || exp.formula,
      formulaTex: scheme.formulaTex || exp.formulaTex,
      principle: scheme.principle || exp.principle,
      formulaNote: scheme.formulaNote || exp.formulaNote,
      steps: scheme.steps || exp.steps
    });
  }

  function stepStorageKey(id, view, exp) {
    const scheme = exp && currentScheme(exp, view);
    const suffix = scheme ? ':scheme-' + exp.schemes.indexOf(scheme) : '';
    return id + suffix + (view && view.stepVariant === 'complex' ? ':complex' : '');
  }

  function stepListHTML(exp, view) {
    const steps = activeSteps(exp, view);
    const checked = (U.load().steps[stepStorageKey(exp.id, view, exp)] || []);
    return steps.map((s, i) => {
      const on = !!checked[i];
      return '<li class="step' + (on ? ' done' : '') + '" data-step="' + i + '"><span class="step-check">' + (on ? ui('check') : (i + 1)) + '</span><p>' + U.esc(s) + '</p></li>';
    }).join('');
  }

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

  function renderAbout() {
    const issueUrl = 'https://github.com/ShrunkShoe16972/Physics-Lab-ZSJZ/issues';
    const releaseUrl = 'https://github.com/ShrunkShoe16972/Physics-Lab-ZSJZ/releases';
    const licenseText = [
      'BSD 3-Clause License',
      '',
      'Copyright (c) 2026, 中山纪念中学，张荣轩，胡婧潆，李诺宇，叶君逸，刘熠宸',
      '',
      'Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:',
      '',
      '1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.',
      '2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.',
      '3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.',
      '',
      'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.'
    ].join('\n');
    viewEl.innerHTML = '<div class="view-inner about-page">' +
      '<section class="about-hero"><div class="about-crest"><img src="assets/img/school-badge.png" alt="中山市中山纪念中学校徽"></div><div><span class="eyebrow">ABOUT · 关于</span><h1>中山市中山纪念中学<br>物理实验室</h1><p>把每一个公式，变成看得见的实验。22 个高中物理实验、多方案切换、连续运动与模块化工坊。</p></div><span class="about-version">v0.8.0</span></section>' +
      '<div class="about-grid">' +
      '<section class="card about-card"><div class="about-card-head"><h2>版本与发布</h2><span class="pill green">稳定版</span></div>' +
      '<div class="about-version-row"><strong>0.8.0</strong><span>2026-11-22</span></div>' +
      '<p>胡克定律与等效替代法原理更新；电阻率实验加入游标卡尺、螺旋测微器和使用方法；向心力实验按手摇演示器重建为可拖动手柄/小球的 3D 风格装置。</p>' +
      '<div class="about-links"><a class="btn ghost small" href="' + releaseUrl + '" target="_blank" rel="noopener">GitHub Releases ↗</a><a class="btn ghost small" href="https://github.com/ShrunkShoe16972/Physics-Lab-ZSJZ" target="_blank" rel="noopener">GitHub 仓库 ↗</a></div></section>' +
      '<section class="card about-card"><div class="about-card-head"><h2>问题递交</h2><span class="pill">Issues</span></div>' +
      '<p>发现实验步骤、图像、交互或兼容性问题，欢迎在 GitHub Issues 提交。请附上实验编号、系统与浏览器版本，以及可复现步骤。</p>' +
      '<ol class="about-steps"><li>打开 Issues 页面</li><li>点击 “New issue”</li><li>选择或填写问题模板</li><li>附上截图与复现步骤</li></ol>' +
      '<a class="btn primary-hero small" href="' + issueUrl + '" target="_blank" rel="noopener">打开 GitHub Issues ↗</a></section>' +
      '<section class="card about-card about-wide"><div class="about-card-head"><h2>最近更新</h2><span class="pill">Changelog</span></div>' +
      '<div class="about-changelog"><div><b>0.8.0</b><span>2026-11-22</span><p>胡克定律改为二力平衡表述；平行四边形实验原理改为等效替代法并移除公式；电阻率实验加入游标卡尺、螺旋测微器及使用方法弹窗；向心力实验按手摇演示器重绘为可交互 3D 风格装置。</p></div>' +
      '<div><b>0.7.3</b><span>2026-11-21</span><p>实验放大时将舞台从 .lab-page 移到 body，彻底摆脱侧栏/内容容器的定位限制；全屏时隐藏侧边栏、顶部栏和滚动条，实测舞台 0,0 到 1920×1080 完整铺满。</p></div>' +
      '<div><b>0.7.2</b><span>2026-11-21</span><p>实验放大改为原生窗口全屏并覆盖整块电脑屏幕；多用电表增加“短接表笔”与可拖动欧姆调零旋钮；搜索下拉固定在搜索框正下方；删除右侧实时读数，数据与图像框移至实验右侧。</p></div>' +
      '<div><b>0.7.1</b><span>2026-11-21</span><p>修复搜索框与侧边栏错位、去掉重复搜索框和缩略图；放大实验向导；统一实验舞台按钮；全屏放大后可继续拖动/点击；多用电表增加挡位旋钮、欧姆调零旋钮与表笔互动。</p></div>' +
      '<div><b>0.7.0</b><span>2026-11-21</span><p>独立 WebView2 桌面窗口，不再调用 Chrome；实验参数移入实验窗口；实验向导置顶；新增易错点；纪中牌坊默认壁纸；搜索栏居中下拉；电表重绘；修正三个教材实验。</p></div>' +
      '<div><b>0.6.3</b><span>2026-11-15</span><p>Wallpaper Engine 窗口移出桌面并隐藏任务栏图标；提升动态捕获帧率与 JPEG 清晰度；新增填充、适应、拉伸、平铺、原尺寸五种背景显示方式。</p></div>' +
      '<div><b>0.6.2</b><span>2026-11-15</span><p>滚动内容与背景同步到 rAF；启动资源按需加载；Wallpaper Engine 实时动态背景；按钮与控件质感优化。</p></div></div></section>' +
      '<section class="card about-card about-wide"><div class="about-card-head"><h2>BSD 3-Clause License</h2><span class="pill">LICENSE</span></div>' +
      '<p class="about-license-lead">本项目采用 BSD 3-Clause License。再分发时需保留版权声明、许可证条款和免责声明。</p><pre class="about-license">' + U.esc(licenseText) + '</pre></section>' +
      '<section class="card about-card about-wide"><div class="about-card-head"><h2>PowerPoint / WPS 联动</h2><span class="pill purple">PPT</span></div>' +
      '<p>在实验库中拖动任意实验卡片到 PowerPoint 或 WPS 幻灯片，会写入一个指向当前实验的链接。放映时点击该链接，即可在浏览器中打开对应实验。</p>' +
      '<p class="about-muted">链接会使用当前运行地址（本机开发为 127.0.0.1:4178，便携版为 127.0.0.1:4380）。分享到另一台电脑时，请确保对方也能访问同一地址，或使用「PPT 链接」按钮复制链接后手动设置超链接。</p><a class="btn ghost small" href="assets/ppt/Prism-Lab-0.8.0-Links.pptx" download>下载 23 页 PPT 链接包 ↓</a></section>' +
      '<section class="card about-card about-wide"><div class="about-card-head"><h2>Wallpaper Engine 动态背景</h2><span class="pill green">WE</span></div>' +
      '<p>在设置中点击「读取动态壁纸」，程序会自动读取 Wallpaper Engine 当前壁纸：视频壁纸直接播放，场景与网页壁纸由独立 WE 窗口实时捕获。窗口移出桌面并设置为工具窗口，不显示任务栏图标，也不会抢占焦点。</p>' +
      '<p class="about-muted">场景捕获为 1280×720、JPEG 82，热启动约 25fps；视频保持原始清晰度。背景支持填充、适应、拉伸、平铺、原尺寸五种显示方式。</p></section>' +
      '<section class="card about-card about-wide"><div class="about-card-head"><h2>代码签名证书</h2><span class="pill green">CODE SIGNING</span></div>' +
      '<p>0.8.0 使用学校自签名代码签名证书 <b>PrismLab Code Signing 0.7</b>，指纹 <code>4C10FB0E9B1C0CF4FAE5188AA9E29734B05BCC59</code>，有效期至 2031-11-21。</p>' +
      '<p class="about-muted">证书公钥位于 <code>packaging/certs/PrismLab-CodeSigning.cer</code>。它不是公共 CA 证书，Windows 默认仍可能提示“未知发布者”；可将公钥安装到“受信任的发布者”后消除提示。</p></section>' +
      '</div></div>';
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
      done: U.isDone(id),
      stepVariant: (exp.stepVersions && (U.load().stepVariants || {})[id] === 'complex') ? 'complex' : 'simple',
      scheme: Math.max(0, Number((U.load().schemeSelections || {})[id]) || 0)
    };
    const cat = catOf(exp);
    const display = displayContent(exp, view);
    const expIndex = OL.experiments.findIndex((e) => e.id === id);
    const labSwitcher = expIndex >= 0
      ? '<div class="lab-switcher" aria-label="快速切换实验">' +
        '<button data-action="prev-lab" title="上一个实验" aria-label="上一个实验">' + ui('back') + '</button>' +
        '<span>' + pad(expIndex + 1) + ' / ' + pad(OL.experiments.length) + '</span>' +
        '<button data-action="next-lab" title="下一个实验" aria-label="下一个实验">' + ui('arrow') + '</button>' +
        '</div>'
      : '';
    const stepHTML = stepListHTML(exp, view);

    const schemeListForLab = schemeList(exp);
    if (schemeListForLab) {
      const si = exp.schemes.indexOf(currentScheme(exp, view));
      view.scheme = si < 0 ? 0 : si;
    }
    const schemeDock = schemeListForLab
      ? '<div class="scheme-dock" id="schemeDock" style="--scheme-index:' + view.scheme + ';--scheme-count:' + schemeListForLab.length + '" aria-label="实验方案切换">' +
        '<span class="scheme-thumb" aria-hidden="true"></span>' +
        schemeListForLab.map((s, i) => '<button data-scheme="' + i + '" class="' + (i === view.scheme ? 'active' : '') + '" title="' + U.esc(s.title || ('方案' + (i + 1))) + '">方案' + ['一', '二', '三'][i] + '</button>').join('') +
        '</div>'
      : '';
    const schemeLabel = schemeListForLab ? (currentScheme(exp, view).short || currentScheme(exp, view).title || '') : '';

    viewEl.innerHTML = '<div class="lab-page" style="--accent:' + (exp.accent || cat.color) + '">' +
      '<div class="lab-head"><div class="lab-head-left">' +
      '<button class="back-link" data-route="library">' + ui('back') + ' 返回实验库</button>' +
      '<div class="lab-title-row"><h1>' + U.esc(exp.title) + '</h1><span class="lab-id">#' + pad(exp.n || 0) + '</span><span class="pill accent">' + U.esc(cat.name) + '</span><span class="pill">' + U.esc(exp.difficulty || '基础') + '</span><span class="pill' + (view.done ? ' green' : '') + '" id="labDonePill">' + (view.done ? '已完成' : '进行中') + '</span></div>' +
      '<p class="lab-sub">' + U.esc(exp.description) + '</p></div>' +
      '<div class="lab-head-right">' + labSwitcher +
      (exp.errorAnalysis ? '<button class="btn ghost small error-analysis-btn" data-action="error-analysis">' + ui('info') + ' 误差分析</button>' : '') +
      '<button class="btn ghost small mistake-btn" data-action="mistakes">' + ui('info') + ' 易错点</button>' +
      '<button class="btn ghost small" data-action="ppt-link">' + ui('arrow') + ' PPT 链接</button>' +
      '<button class="btn ghost small" data-action="mark-complete">' + ui('check') + ' 标记完成</button><button class="btn ghost small" data-action="csv">' + ui('download') + ' 导出数据</button></div></div>' +
      schemeDock +
      '<section class="wizard-top card"><div class="wizard-head"><div><h3>实验向导</h3><p>按顺序操作，点击步骤可标记完成</p></div>' +
      (exp.stepVersions ? '<div class="step-switch"><button data-step-variant="simple" class="' + (view.stepVariant === 'simple' ? 'active' : '') + '">简易</button><button data-step-variant="complex" class="' + (view.stepVariant === 'complex' ? 'active' : '') + '">复杂</button></div>' : '') +
      '</div><ol class="steps wizard-steps" id="steps">' + stepHTML + '</ol><div class="conclusion" id="conclusion">' + ui('info') + '<span>调整变量并采集数据，结论会在这里更新。</span></div></section>' +
      '<section class="principle-banner"><div class="principle-badge">' + ui('info') + '<span>实验原理</span></div>' +
      '<div class="principle-main"><div class="principle-formula"><div class="formula-tex" id="principleFormula">' + (display.formulaPlain ? '<span class="formula-plain">' + U.esc(display.formula) + '</span>' : OL.tex.render(display.formulaTex || display.formula, true)) + '</div><button class="icon-btn copy-code" id="principleCopy" data-copy="' + U.esc(display.formula) + '" title="复制公式">' + ui('copy') + '</button></div>' +
      '<p id="principlePrinciple">' + U.esc(display.principle) + '</p>' +
      (display.formulaNote ? '<div class="principle-note" id="principleNote">' + U.esc(display.formulaNote) + '</div>' : '<div class="principle-note" id="principleNote"></div>') +
      '</div></section>' +
      '<div class="lab-layout"><section class="stage-card" id="stageCard">' +
      '<div class="stage-top"><div class="stage-label"><span class="live paused" id="liveDot"></span><span id="stageStatus">测量就绪</span>' + (schemeLabel ? '<span class="scheme-stage-badge" id="schemeStageBadge">' + U.esc(schemeLabel) + '</span>' : '') + '</div>' +
      '<div class="stage-tools">' + (canPlay(lab) ? '<button class="stage-play-inline" data-action="toggle-play" id="playBtn" title="播放 / 暂停">' + ui('play') + '</button><button class="stage-tool" data-action="reset" title="重置">' + ui('reset') + '</button>' : '') + '<button class="stage-tool" data-action="toggle-params" id="paramsToggle" title="显示 / 隐藏实验参数" aria-label="显示或隐藏实验参数"><svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></button><button class="stage-tool" data-action="screenshot" title="保存图像" aria-label="保存图像"><svg viewBox="0 0 24 24"><path d="M4 8h4l1.5-2h5L16 8h4v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/></svg></button><button class="stage-tool stage-expand" data-action="expand" title="放大 / 还原实验舞台" aria-label="放大或还原实验舞台"><svg viewBox="0 0 24 24"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg></button></div></div>' +
      '<div class="stage-wrap"><canvas id="labCanvas"></canvas>' +
      '<div class="stage-controls" id="stageControls"><div class="stage-controls-head"><b>实验参数</b><span>实时调节</span></div><div class="controls" id="controls">' + exp.controls.map(controlHTML).join('') + (lab.extraControls || '') + '</div><div class="card-actions"><button class="btn record" data-action="record"><span class="record-dot"></span>采集数据</button><button class="btn ghost small" data-action="reset">' + ui('reset') + '</button></div></div></div>' +
      (canPlay(lab) ? '<div class="stage-tip"><kbd>SPACE</kbd> 播放 / 暂停</div>' : '') +
      '<div class="stage-readouts" id="stageReadouts"></div></section>' +
      '<aside class="side-stack"><section class="viz-card card"><div class="viz-head"><div><h3>数据与图像</h3><div class="sub" id="chartSub">实时绘制</div></div><div class="viz-tabs"><button class="active" data-tab="chart">' + ui('chart') + ' 图像</button><button data-tab="table">' + ui('table') + ' 数据表 <span id="recordCount">0</span></button></div></div>' +
      '<div class="chart-wrap" id="chartWrap"><canvas id="labChart"></canvas><div class="chart-tooltip" id="chartTip"></div></div>' +
      '<div class="data-table-wrap" id="dataTableWrap"></div>' +
      '<div class="chart-foot" id="chartFoot"></div></section></aside></div>' +
      '</div>';

    const current = state.currentLab = {
      id, exp, lab, state: st, view, alive: true,
      canvas: $('#labCanvas'), chartCanvas: $('#labChart'), chart: null, raf: null
    };
    view.view = view;
    view.state = st;
    view.el = current;
    if (lab.pointer) current.canvas.classList.add('canvas-interactive');

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
        if (cur.view.playing) {
          cur._ease = cur._ease || {};
          cur._ease[key] = { from: Number(cur.state[key]), to: val, t0: performance.now() };
        } else {
          cur.state[key] = val;
          if (cur.lab.onControl) cur.lab.onControl.call(cur.lab, key, cur.state, cur.view);
        }
        const out = $('#val-' + key);
        if (out) out.innerHTML = U.fmt(val, c.decimals == null ? 2 : c.decimals) + '<span>' + U.esc(c.unit || '') + '</span>';
        range.style.setProperty('--fill', ((val - c.min) / (c.max - c.min) * 100) + '%');
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
    bindCanvasPointers(cur);
  }

  function canvasPoint(cur, e) {
    const r = cur.canvas.getBoundingClientRect();
    const w = cur.canvas.clientWidth || r.width || 1;
    const h = cur.canvas.clientHeight || r.height || 1;
    return { x: (e.clientX - r.left) / r.width * w, y: (e.clientY - r.top) / r.height * h };
  }

  function bindCanvasPointers(cur) {
    if (!cur.canvas) return;
    const canvas = cur.canvas;
    const hasPointer = cur.lab.onPointerDown || cur.lab.onPointerMove || cur.lab.onPointerUp;
    if (!hasPointer) return;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      const p = canvasPoint(cur, e);
      const handled = cur.lab.onPointerDown && cur.lab.onPointerDown.call(cur.lab, p, cur.state, cur.view, e);
      if (!handled) return;
      cur.pointerId = e.pointerId;
      cur.dragging = true;
      canvas.classList.add('is-dragging');
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      cur.view.dirty = true;
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!cur.dragging || e.pointerId !== cur.pointerId) return;
      const p = canvasPoint(cur, e);
      if (cur.lab.onPointerMove) cur.lab.onPointerMove.call(cur.lab, p, cur.state, cur.view, e);
      cur.view.dirty = true;
      e.preventDefault();
    });
    const end = (e) => {
      if (!cur.dragging || (e.pointerId != null && e.pointerId !== cur.pointerId)) return;
      const p = canvasPoint(cur, e);
      if (cur.lab.onPointerUp) cur.lab.onPointerUp.call(cur.lab, p, cur.state, cur.view, e);
      cur.dragging = false;
      canvas.classList.remove('is-dragging');
      try { canvas.releasePointerCapture(cur.pointerId); } catch (err) {}
      cur.pointerId = null;
      cur.view.dirty = true;
      updateReadouts();
      schedulePlot();
      scheduleConclusion();
      e.preventDefault();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
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

  function easeLabState(cur, now) {
    if (!cur._ease) return false;
    let active = false;
    Object.keys(cur._ease).forEach((key) => {
      const a = cur._ease[key];
      const p = U.clamp((now - a.t0) / 300, 0, 1);
      cur.state[key] = a.from + (a.to - a.from) * U.smoothstep(p);
      if (p >= 1) {
        cur.state[key] = a.to;
        delete cur._ease[key];
      } else {
        active = true;
      }
    });
    return active;
  }

  function startLabLoop() {
    const cur = state.currentLab;
    if (!cur) return;
    let lastReadout = 0, lastChart = 0, lastTable = 0;
    function loop(now) {
      if (!cur.alive || state.currentLab !== cur) return;
      if (document.hidden) { cur.raf = requestAnimationFrame(loop); return; }
      const dt = Math.min(0.04, Math.max(0, (now - cur.view.lastTs) / 1000)) * (state.animSpeed || 1);
      cur.view.lastTs = now;
      if (easeLabState(cur, now)) cur.view.dirty = true;
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
    cur._ease = {};
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
      if (path === 'library' && state.route === 'library' && route.classList.contains('nav-library')) {
        setLibraryExpanded(!$('#catSub').classList.contains('open'));
        return;
      }
      if (path === 'home' || path === 'library' || path === 'workshop') navigate(path);
      return;
    }
    const lab = e.target.closest('[data-lab]');
    if (lab) { closeMobile(); navigate('lab/' + lab.dataset.lab); return; }
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.filter = cat.dataset.cat;
      state.book = 'all';
      closeMobile();
      if (state.route === 'library') { applyFilter(state.filter); }
      else navigate('library');
      return;
    }
    const filter = e.target.closest('[data-filter]');
    if (filter) { applyFilter(filter.dataset.filter); return; }
    const book = e.target.closest('[data-book]');
    if (book) { applyBookFilter(book.dataset.book); return; }
    const scheme = e.target.closest('[data-scheme]');
    if (scheme) { switchScheme(scheme.dataset.scheme); return; }
    const themeChoice = e.target.closest('[data-set-theme]');
    if (themeChoice) { applyTheme(themeChoice.dataset.setTheme, true); return; }
    const styleChoice = e.target.closest('[data-set-style]');
    if (styleChoice) { applyUiStyle(styleChoice.dataset.setStyle, true); return; }
    const step = e.target.closest('[data-step]');
    if (step && state.currentLab) {
      const cur = state.currentLab;
      const i = Number(step.dataset.step);
      const s = U.load();
      s.steps = s.steps || {};
      const key = stepStorageKey(cur.id, cur.view, cur.exp);
      const arr = s.steps[key] || [];
      arr[i] = !arr[i];
      s.steps[key] = arr;
      U.save({ steps: s.steps });
      step.classList.toggle('done', !!arr[i]);
      step.querySelector('.step-check').innerHTML = arr[i] ? ui('check') : (i + 1);
      if (arr.length === activeSteps(cur.exp, cur.view).length && arr.every(Boolean)) markComplete(cur.exp, true);
      return;
    }
    const stepVariant = e.target.closest('[data-step-variant]');
    if (stepVariant && state.currentLab) {
      const cur = state.currentLab;
      const variant = stepVariant.dataset.stepVariant === 'complex' ? 'complex' : 'simple';
      cur.view.stepVariant = variant;
      U.save({ stepVariants: Object.assign({}, U.load().stepVariants || {}, { [cur.id]: variant }) });
      const list = $('#steps');
      if (list) list.innerHTML = stepListHTML(cur.exp, cur.view);
      $$('.step-switch button').forEach((b) => b.classList.toggle('active', b.dataset.stepVariant === variant));
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
      else if (action === 'open-settings') openSettings();
      else if (action === 'error-analysis') openErrorAnalysis();
      else if (action === 'mistakes') openMistakes();
      else if (action === 'measure-help') openMeasureHelp(act.dataset.measure);
      else if (action === 'toggle-params') {
        const panel = $('#stageControls');
        if (panel) panel.classList.toggle('collapsed');
        if (act) act.classList.toggle('active', panel && !panel.classList.contains('collapsed'));
      }
      else if (action === 'ppt-link') copyLabLink();
      else if (action === 'prev-lab' || action === 'next-lab') {
        if (state.currentLab) {
          const idx = OL.experiments.findIndex((e) => e.id === state.currentLab.id);
          if (idx >= 0) {
            const delta = action === 'prev-lab' ? -1 : 1;
            const next = OL.experiments[(idx + delta + OL.experiments.length) % OL.experiments.length];
            navigate('lab/' + next.id);
          }
        }
      }
      else if (action === 'finish-welcome') finishWelcome();
      else if (action === 'reopen-welcome') openWelcome();
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
      else if (action === 'multimeter-short' && state.currentLab) {
        const cur = state.currentLab;
        if (cur.lab.shortProbes) {
          cur.lab.shortProbes.call(cur.lab, cur.state);
          cur.view.dirty = true;
          updateAll();
          schedulePlot(); scheduleConclusion();
          toast('红黑表笔已短接，请拖动欧姆调零旋钮到 0 Ω');
        }
      }
      else if (action === 'mark-complete' && state.currentLab) markComplete(state.currentLab.exp, true);
      else if (action === 'csv') { if (state.currentLab) exportCSV(); else if (OL.workshop) OL.workshop.exportAll(); }
      else if (action === 'screenshot') screenshot();
      else if (action === 'expand') {
        const card = $('#stageCard');
        if (card) setStageTheater(!card.classList.contains('theater'));
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
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = $('#globalSearchInput');
      if (input) { input.focus(); openPalette(); }
      return;
    }
    if (e.key === 'Escape') {
      if (state.paletteOpen) closePalette();
      if (document.body.classList.contains('stage-theater')) {
        setStageTheater(false);
        window.dispatchEvent(new Event('resize'));
      }
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

  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.exp-card[data-lab]');
    if (!card) return;
    const url = labUrl(card.dataset.lab);
    e.dataTransfer.effectAllowed = 'copyLink';
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('text/plain', url);
    e.dataTransfer.setData('text/html', '<a href="' + U.esc(url) + '">' + U.esc((resolveExp(card.dataset.lab) || {}).title || '物理实验') + '</a>');
    e.dataTransfer.setData('application/x-prism-lab', JSON.stringify({ id: card.dataset.lab, url }));
    card.classList.add('dragging');
    hideExpPreview();
  });
  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.exp-card');
    if (card) card.classList.remove('dragging');
  });

  function hideExpPreview() {
    const el = $('#expPreview');
    if (el) { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); }
    state.hoverLab = null;
  }
  viewEl.addEventListener('scroll', hideExpPreview, { passive: true });

  document.addEventListener('input', (e) => {
    const slider = e.target.closest('[data-font-slider]');
    if (slider) { applyFontScale(Number(slider.value), true); return; }
    const perf = e.target.closest('[data-perf]');
    if (perf) {
      const key = perf.dataset.perf;
      if (key === 'opacity') state.uiOpacity = Number(perf.value);
      if (key === 'blur') state.glassBlur = Number(perf.value);
      if (key === 'speed') state.animSpeed = Number(perf.value);
      applyPerformance(true);
      return;
    }
    if (e.target.closest('[data-wallpaper-api]')) {
      state.wallpaperApi = e.target.value.trim();
      U.save({ wallpaperApi: state.wallpaperApi });
    }
  });

  document.addEventListener('click', (e) => {
    const bgChoice = e.target.closest('[data-bg-id]');
    if (bgChoice) { setBackground(bgChoice.dataset.bgId, false); toast('背景已切换'); return; }
    if (e.target.closest('[data-bg-upload]')) { const f = $('[data-bg-file]'); if (f) f.click(); return; }
    if (e.target.closest('[data-bg-clear]')) { setBackground('gate', false); toast('已恢复默认背景'); return; }
    if (e.target.closest('[data-bg-search]')) { const q = $('[data-bg-query]'); searchWallpapers(q ? q.value : ''); return; }
    if (e.target.closest('[data-wallpaper-discover]')) { discoverWallpaperApi(); return; }
    if (e.target.closest('[data-we-sync]')) { syncWallpaperEngine(); return; }
    const bgMode = e.target.closest('[data-bg-mode]');
    if (bgMode) { applyBackgroundMode(bgMode.dataset.bgMode, true); syncPerformanceControls(); toast('背景显示方式：' + bgMode.innerText); return; }
    const provider = e.target.closest('[data-bg-provider]');
    if (provider) { state.wallpaperProvider = provider.dataset.bgProvider === 'wikimedia' ? 'wikimedia' : 'bing'; applyPerformance(true); toast(state.wallpaperProvider === 'bing' ? '壁纸搜索来源：Bing' : '壁纸搜索来源：Wikimedia'); return; }
    if (e.target.closest('[data-wallpaper-sync]')) { syncDesktopWallpaper(); return; }
    const remote = e.target.closest('[data-bg-url]');
    if (remote) { setBackground(remote.dataset.bgUrl, true); toast('背景已应用'); return; }
  });

  document.addEventListener('change', (e) => {
    if (e.target.closest('[data-bg-file]')) {
      const file = e.target.files && e.target.files[0];
      readBackgroundFile(file, (data) => { setBackground(data, true); toast('背景已上传并应用'); });
      e.target.value = '';
    }
  });

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#aboutBtn').addEventListener('click', () => navigate('about'));
  const searchInput = $('#globalSearchInput');
  if (searchInput) {
    const shell = $('#searchShell');
    if (shell) shell.addEventListener('click', () => searchInput.focus());
    searchInput.addEventListener('focus', openPalette);
    searchInput.addEventListener('input', () => {
      if (!state.paletteOpen) openPalette();
      state.paletteIndex = 0;
      renderPalette(searchInput.value);
    });
    searchInput.addEventListener('keydown', onPaletteKey);
  }
  document.addEventListener('click', (e) => {
    if (!state.paletteOpen) return;
    if (e.target.closest('.palette') || e.target.closest('#searchShell')) return;
    closePalette();
  });
  window.addEventListener('resize', () => { if (state.paletteOpen) positionPalette(); });
  $('#helpBtn').addEventListener('click', openHelp);
  const sidebarToggle = $('#sidebarToggle');
  function setSidebarFocus(focus) {
    state.focus = !!focus;
    document.body.classList.toggle('focus-mode', state.focus);
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', state.focus ? 'false' : 'true');
      sidebarToggle.setAttribute('aria-label', state.focus ? '展开侧边栏' : '收起侧边栏');
      sidebarToggle.setAttribute('title', state.focus ? '展开侧边栏' : '收起侧边栏');
    }
    setTimeout(() => {
      if (state.currentLab) {
        state.currentLab.view.dirty = true;
        if (state.currentLab.chart) state.currentLab.chart.draw();
      }
      if (state.paletteOpen) positionPalette();
    }, 420 / state.animSpeed);
  }
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => setSidebarFocus(!state.focus));
  $('#menuBtn').addEventListener('click', () => {
    sidebar.classList.add('open'); scrim.classList.add('show');
  });
  scrim.addEventListener('click', closeMobile);
  viewEl.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const y = viewEl.scrollTop;
      const topbar = $('.topbar');
      if (topbar) topbar.classList.toggle('scrolled', y > 8);
      document.documentElement.style.setProperty('--scroll-y', y + 'px');
      const bg = $('#appBackground');
      if (bg && !document.body.classList.contains('we-video-bg')) {
        bg.style.transform = 'translate3d(0,' + (-y * 0.018).toFixed(2) + 'px,0) scale(1.02)';
      }
    });
  }, { passive: true });
  window.addEventListener('beforeunload', () => { if (state.currentLab) state.currentLab.alive = false; });

  function closeMobile() {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  applyUiStyle(state.uiStyle, false);
  applyTheme(state.theme, false);
  applyFontScale(state.fontScale, false);
  applyPerformance(false);
  syncProgress();
  if (!location.hash) renderRoute(false);
  else renderRoute(false);
  if (!U.load().onboarded) setTimeout(() => { if (!U.load().onboarded) openWelcome(); }, 520);
})();
