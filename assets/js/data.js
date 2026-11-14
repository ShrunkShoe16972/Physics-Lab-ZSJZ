/* ============================================================
   Prism · experiment catalogue
   All metadata, default variables and guided-inquiry content.
   ============================================================ */
(function () {
  'use strict';

  const categories = {
    mechanics: {
      name: '力学', en: 'Mechanics', color: '#0a84ff', soft: 'rgba(10,132,255,.12)',
      desc: '运动、力、能量与动量', icon: 'mechanics'
    },
    electricity: {
      name: '电磁学', en: 'Electromagnetism', color: '#ff9f0a', soft: 'rgba(255,159,10,.13)',
      desc: '电路、场与电磁感应', icon: 'electricity'
    },
    optics: {
      name: '光学', en: 'Optics', color: '#bf5af2', soft: 'rgba(191,90,242,.12)',
      desc: '折射、干涉与波动', icon: 'optics'
    },
    molecular: {
      name: '热学与分子', en: 'Molecular', color: '#30d158', soft: 'rgba(48,209,88,.12)',
      desc: '微观世界与分子尺度', icon: 'molecular'
    }
  };

  /* 粤教版（2019 课标版）册次分类。分类只影响浏览，不改变原有学科分类。 */
  const books = {
    b1: { name: '必修第一册', short: '必修一', en: 'Compulsory 1', color: '#0a84ff' },
    b2: { name: '必修第二册', short: '必修二', en: 'Compulsory 2', color: '#30b0c7' },
    b3: { name: '必修第三册', short: '必修三', en: 'Compulsory 3', color: '#ff9f0a' },
    x1: { name: '选择性必修第一册', short: '选必一', en: 'Selective 1', color: '#bf5af2' },
    x2: { name: '选择性必修第二册', short: '选必二', en: 'Selective 2', color: '#ff6482' },
    x3: { name: '选择性必修第三册', short: '选必三', en: 'Selective 3', color: '#30d158' }
  };

  const paths = {
    mechanics: '<circle cx="24" cy="24" r="5"/><ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(-28 24 24)"/><ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(32 24 24)"/><circle cx="39" cy="15" r="2" fill="currentColor" stroke="none"/>',
    electricity: '<path d="M26 5 12 27h10l-2 16 16-24H25l1-14Z"/>',
    optics: '<path d="M24 7 42 39H6L24 7Z"/><path d="M5 24h12M31 24h12M24 7v32" opacity=".55"/>',
    molecular: '<circle cx="24" cy="14" r="5"/><circle cx="14" cy="32" r="5"/><circle cx="34" cy="32" r="5"/><path d="M21 18.5 17 27M27 18.5 31 27M19 32h10"/>',
    tape: '<rect x="6" y="13" width="36" height="23" rx="3"/><path d="M11 23h26M11 29h20"/><circle cx="17" cy="23" r="1.5" fill="currentColor" stroke="none"/><circle cx="24" cy="23" r="1.5" fill="currentColor" stroke="none"/><circle cx="33" cy="23" r="1.5" fill="currentColor" stroke="none"/><path d="M30 18.5h5M30 19v-1"/><path d="M6 42h36"/>',
    spring: '<path d="M24 4v7"/><path d="M17 11h14M17 15h14M17 19h14M17 23h14M17 27h14M17 31h14"/><path d="M24 35v5"/><rect x="16" y="40" width="16" height="5" rx="2"/><path d="M11 8h5M11 43h5"/>',
    vectors: '<path d="M10 39 33 12"/><path d="m27 11 7 1-1 7"/><path d="M10 39h26"/><path d="m31 39 5-3v6l-5-3Z" fill="currentColor" stroke="none"/><path d="M10 39V14"/><path d="m10 14-3 6h6l-3-6Z" fill="currentColor" stroke="none"/><path d="M10 14h23v25" stroke-dasharray="3 4" opacity=".55"/>',
    cart: '<path d="M5 35h31"/><rect x="8" y="25" width="20" height="10" rx="2"/><circle cx="13" cy="38" r="3"/><circle cx="24" cy="38" r="3"/><path d="M28 25h7a3 3 0 0 1 3 3v4"/><circle cx="38" cy="34" r="3"/><path d="M39 37v6M35 43h8"/><path d="M8 25h6"/>',
    parabola: '<path d="M6 40h36M8 40V7"/><path d="M8 12c10 0 15 6 23 26" stroke-dasharray="4 4"/><circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M36 28v9M36 37l-3-2M36 37l3-2M29 37h7"/>',
    orbit: '<circle cx="24" cy="24" r="13" stroke-dasharray="3 4"/><circle cx="24" cy="24" r="4"/><circle cx="36" cy="19" r="3.5" fill="currentColor" stroke="none"/><path d="M24 24 35 20M24 24l7 6"/><path d="M19 18a8 8 0 0 1 7-4"/>',
    work: '<rect x="8" y="27" width="13" height="10" rx="2"/><path d="M21 32h18"/><path d="m35 28 5 4-5 4"/><path d="M8 40h34"/><path d="M13 18v9M9 22l4-4 4 4"/>',
    pendulum: '<path d="M24 6v20"/><path d="M24 26 38 36"/><circle cx="38" cy="36" r="4.5" fill="currentColor" stroke="none"/><path d="M24 26v6" opacity=".35"/><path d="M7 41c7-3 12-3 17 0s11 3 17 0" stroke-dasharray="3 4"/><path d="M8 13h8M8 18h5"/>',
    collision: '<circle cx="15" cy="24" r="7"/><circle cx="34" cy="24" r="5"/><path d="M4 24h5M22 24h5M39 24h5"/><path d="m17 19 4 5-4 5M37 19l-4 5 4 5" opacity=".5"/>',
    clock: '<circle cx="24" cy="21" r="13"/><path d="M24 12v9l6 4"/><path d="M24 34v4M21 42h6M24 38l-6 4M24 38l6 4"/><path d="M12 21h-4M40 21h-4"/>',
    wire: '<path d="M5 24h9c3 0 3-7 6-7s3 14 6 14 3-14 6-14 3 7 6 7h5"/><rect x="4" y="19" width="3" height="10" rx="1"/><rect x="41" y="19" width="3" height="10" rx="1"/><path d="M15 39h18M24 36v6" opacity=".5"/>',
    bulb: '<path d="M24 5a11 11 0 0 0-6 20c1 .8 2 2 2 4h8c0-2 1-3.2 2-4A11 11 0 0 0 24 5Z"/><path d="M20 33h8M21 37h6M22 41h4"/><path d="M9 10l2 2M39 10l-2 2M6 23h3M39 23h3"/>',
    battery: '<rect x="5" y="15" width="27" height="18" rx="3"/><path d="M32 21h3v6h-3M10 20v8M15 24h7"/><path d="M38 18v12M41 21v6"/>',
    multimeter: '<rect x="12" y="5" width="24" height="38" rx="4"/><rect x="17" y="10" width="14" height="9" rx="2"/><circle cx="24" cy="29" r="7"/><path d="M24 23v6l4 3"/><path d="M18 37h.1M30 37h.1M24 43v-2"/>',
    magnet: '<path d="M13 8v18a11 11 0 0 0 22 0V8h-7v18a4 4 0 0 1-8 0V8h-7Z"/><path d="M13 14h7M28 14h7"/><path d="M6 33h8M34 33h8" opacity=".5"/>',
    coil: '<path d="M9 18c0-4 6-4 6 0s-6 4-6 0 6-4 6 0 6 4 6 0 6-4 6 0 6 4 6 0 6-4 6 0"/><path d="M9 18v14c0 4 6 4 6 0s-6-4-6 0 6 4 6 0 6-4 6 0 6 4 6 0 6-4 6 0 6 4 6 0"/><rect x="30" y="14" width="8" height="20" rx="2" fill="currentColor" stroke="none"/><path d="M34 18v12" stroke="#fff" stroke-width="1.5"/>',
    transformer: '<rect x="8" y="12" width="7" height="24" rx="2"/><rect x="33" y="12" width="7" height="24" rx="2"/><path d="M15 17h18M15 23h18M15 29h18M15 35h18" opacity=".6"/><path d="M11 12V7h6v5M37 12V7h-6v5"/><path d="M11 36v5h6v-5M37 36v5h-6v-5"/>',
    capacitor: '<path d="M9 13v22M39 13v22"/><path d="M15 13v22M33 13v22"/><path d="M19 17h10M19 22h10M19 27h10M19 32h10" stroke-dasharray="2 4" opacity=".6"/><path d="M2 24h7M39 24h7"/><path d="M9 17h-4M9 22h-4M39 17h4M39 22h4" opacity=".6"/>',
    prism: '<path d="M24 7 42 39H6L24 7Z"/><path d="M2 30h15"/><path d="m17 30 7-5 7 5"/><path d="m31 30 15-7M31 30l15 3M31 30l14 9" opacity=".65"/>',
    wave: '<path d="M4 17c4-8 8-8 12 0s8 8 12 0 8-8 12 0M4 31c4-8 8-8 12 0s8 8 12 0 8-8 12 0"/><path d="M24 5v38" stroke-dasharray="2 4" opacity=".4"/>',
    droplet: '<path d="M24 5c6 9 11 14 11 21a11 11 0 0 1-22 0c0-7 5-12 11-21Z"/><path d="M6 39c6-3 11-3 18 0s12 3 18 0" stroke-dasharray="3 4"/><circle cx="24" cy="27" r="5" opacity=".45"/>'
  };

  function icon(name, cls) {
    return '<svg viewBox="0 0 48 48" class="' + (cls || '') + '" aria-hidden="true">' + (paths[name] || paths.mechanics) + '</svg>';
  }

  const experiments = [
    {
      n: 1, id: 'accelerated-motion', title: '研究匀变速直线运动',
      short: '让小车匀加速滑行，用打点计时器还原速度—时间图像。',
      category: 'mechanics', accent: '#0a84ff', icon: 'tape',
      difficulty: '基础', time: '8 分钟', tags: ['打点计时器', 'v–t 图像'],
      description: '小车在钩码牵引下做匀加速直线运动。纸带上的点间距随时间增大，测量各点速度并绘制 v–t 图像，验证速度随时间线性变化。',
      formula: 'v = v₀ + at', formulaNote: 'v–t 图像的斜率就是加速度 a，图线与纵轴截距为初速度 v₀。',
      principle: '当加速度恒定时，速度随时间均匀变化。通过测量连续相等时间间隔内的位移，可以求出各时刻的瞬时速度。',
      steps: ['调整纸带并启动打点计时器', '释放小车，记录纸带上的点迹', '测量计数点间距并计算瞬时速度', '绘制 v–t 图像，求出加速度'],
      controls: [
        { key: 'v0', label: '初速度 v₀', min: 0, max: 6, step: 0.1, value: 1.2, unit: 'm/s', decimals: 1 },
        { key: 'a', label: '加速度 a', min: 0.2, max: 4, step: 0.1, value: 1.4, unit: 'm/s²', decimals: 1 }
      ]
    },
    {
      n: 2, id: 'hooke-law', title: '探究弹力与弹簧伸长量的关系',
      short: '改变钩码质量，寻找弹簧弹力与伸长量之间的线性关系。',
      category: 'mechanics', accent: '#0a84ff', icon: 'spring',
      difficulty: '基础', time: '7 分钟', tags: ['胡克定律', 'F–x 图像'],
      description: '在竖直悬挂的弹簧下端逐个增加钩码，测量弹簧的伸长量。以弹力 F 为纵轴、伸长量 x 为横轴作图，图线斜率即弹簧的劲度系数。',
      formula: 'F = kx', formulaNote: '在弹性限度内，弹力与伸长量成正比；F–x 图像的斜率表示劲度系数 k。',
      principle: '弹簧发生弹性形变时，恢复力与形变量成正比。实验中用钩码重力充当弹力，通过多次测量减小偶然误差。',
      steps: ['记录弹簧自然长度', '逐个增加钩码并等待静止', '测量弹簧总长度，计算伸长量', '绘制 F–x 图像并求劲度系数'],
      controls: [
        { key: 'm', label: '钩码质量 m', min: 10, max: 500, step: 10, value: 100, unit: 'g', decimals: 0 },
        { key: 'k', label: '弹簧劲度系数 k', min: 10, max: 60, step: 1, value: 25, unit: 'N/m', decimals: 0 }
      ]
    },
    {
      n: 3, id: 'force-parallelogram', title: '验证力的平行四边形定则',
      short: '用两个分力与一个合力，验证矢量合成的几何规律。',
      category: 'mechanics', accent: '#0a84ff', icon: 'vectors',
      difficulty: '基础', time: '8 分钟', tags: ['矢量合成', '合力'],
      description: '两个共点力作用在同一点上，用平行四边形定则作出合力。改变分力大小与夹角，比较理论合力与等效合力。',
      formula: 'F = √(F₁² + F₂² + 2F₁F₂cos θ)', formulaNote: '合力大小随夹角增大而减小；夹角为 90° 时退化为勾股定理。',
      principle: '力是矢量，合成遵循平行四边形定则。以两个分力为邻边作平行四边形，对角线即表示合力的大小和方向。',
      steps: ['固定两个分力的方向与大小', '按标度作出力的图示', '完成平行四边形并画出对角线', '测量合力并验证几何关系'],
      controls: [
        { key: 'f1', label: '分力 F₁', min: 1, max: 10, step: 0.1, value: 6, unit: 'N', decimals: 1 },
        { key: 'f2', label: '分力 F₂', min: 1, max: 10, step: 0.1, value: 4, unit: 'N', decimals: 1 },
        { key: 'angle', label: '夹角 θ', min: 20, max: 160, step: 1, value: 60, unit: '°', decimals: 0 }
      ]
    },
    {
      n: 4, id: 'newton-second', title: '探究加速度与力、质量的关系',
      short: '控制变量，分别寻找 a–F 与 a–1/m 的线性关系。',
      category: 'mechanics', accent: '#0a84ff', icon: 'cart',
      difficulty: '进阶', time: '12 分钟', tags: ['控制变量', '牛顿第二定律'],
      description: '小车在长木板上受钩码牵引。保持质量不变改变拉力，或保持拉力不变改变质量，测量加速度并绘制图像。',
      formula: 'a = F / m', formulaNote: '质量一定时 a ∝ F；力一定时 a ∝ 1/m。两幅图线都是过原点的直线。',
      principle: '牛顿第二定律指出，物体加速度与合外力成正比、与质量成反比。实验需平衡摩擦力，并使钩码质量远小于小车质量。',
      steps: ['垫高木板平衡摩擦力', '保持小车质量不变，改变拉力', '测量加速度并绘制 a–F 图像', '保持拉力不变，改变质量并绘制 a–1/m 图像'],
      controls: [
        { key: 'force', label: '合外力 F', min: 0.1, max: 3, step: 0.05, value: 1.2, unit: 'N', decimals: 2 },
        { key: 'mass', label: '小车质量 m', min: 0.2, max: 2, step: 0.05, value: 0.8, unit: 'kg', decimals: 2 },
        { key: 'friction', label: '未平衡摩擦力 f', min: 0, max: 0.4, step: 0.01, value: 0.08, unit: 'N', decimals: 2 },
        { key: 'chartMode', label: '图像模式', type: 'segmented', value: 'aF', options: [{ value: 'aF', label: 'a–F' }, { value: 'aM', label: 'a–1/m' }] }
      ]
    },
    {
      n: 5, id: 'projectile', title: '研究平抛运动',
      short: '从不同高度水平抛出小球，拆解水平与竖直方向的运动。',
      category: 'mechanics', accent: '#0a84ff', icon: 'parabola',
      difficulty: '进阶', time: '9 分钟', tags: ['运动分解', '轨迹'],
      description: '小球从水平桌面边缘飞出，只受重力作用。频闪照片显示相邻小球位置，可分解为水平匀速直线运动和竖直自由落体运动。',
      formula: 'x = v₀t ，  y = ½gt²', formulaNote: '水平方向匀速，竖直方向自由落体；轨迹为抛物线 y = gx²/(2v₀²)。',
      principle: '平抛运动可分解为两个互相垂直的独立分运动。竖直方向的等时位移差满足 Δy = gT²。',
      steps: ['调节斜槽末端水平', '让小球从同一位置由静止释放', '记录频闪位置并建立坐标系', '分别分析水平与竖直分运动'],
      controls: [
        { key: 'v0', label: '初速度 v₀', min: 1, max: 12, step: 0.1, value: 5, unit: 'm/s', decimals: 1 },
        { key: 'h', label: '抛出高度 h', min: 1, max: 20, step: 0.5, value: 5, unit: 'm', decimals: 1 },
        { key: 'g', label: '重力加速度 g', min: 1.6, max: 20, step: 0.1, value: 9.8, unit: 'm/s²', decimals: 1 }
      ]
    },
    {
      n: 6, id: 'centripetal', title: '探究向心力的大小',
      short: '旋转小球，观察向心力如何随质量、半径和角速度变化。',
      category: 'mechanics', accent: '#0a84ff', icon: 'orbit',
      difficulty: '进阶', time: '10 分钟', tags: ['圆周运动', '向心力'],
      description: '小球在水平面内做匀速圆周运动，力传感器测量绳的拉力。改变小球质量、旋转半径或角速度，观察向心力的变化。',
      formula: 'F = mω²r = mv²/r', formulaNote: '向心力与质量、半径成正比，与角速度的平方成正比。',
      principle: '向心力指向圆心，只改变速度方向而不改变速度大小。实验采用控制变量法分别研究各因素的影响。',
      steps: ['固定半径与质量，改变角速度', '记录力传感器示数', '改变半径，重复测量', '绘制 F–r 或 F–ω² 图像并分析'],
      controls: [
        { key: 'm', label: '小球质量 m', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', decimals: 2 },
        { key: 'r', label: '旋转半径 r', min: 0.3, max: 1.5, step: 0.05, value: 0.8, unit: 'm', decimals: 2 },
        { key: 'omega', label: '角速度 ω', min: 0.5, max: 6, step: 0.1, value: 2.5, unit: 'rad/s', decimals: 1 },
        { key: 'chartMode', label: '图像模式', type: 'segmented', value: 'Fr', options: [{ value: 'Fr', label: 'F–r' }, { value: 'Fw', label: 'F–ω²' }] }
      ]
    },
    {
      n: 7, id: 'work-energy', title: '探究功与速度变化的关系',
      short: '用恒力做功改变小车速度，检验 W 与 v² 的线性关系。',
      category: 'mechanics', accent: '#0a84ff', icon: 'work',
      difficulty: '进阶', time: '10 分钟', tags: ['动能定理', '功'],
      description: '小车在恒力作用下从静止开始运动。改变拉力或位移，测量做功与末速度，绘制 W–v² 图像验证动能定理。',
      formula: 'W = ½mv²', formulaNote: '合外力做的功等于动能变化；W–v² 图线应为过原点的直线，斜率为 m/2。',
      principle: '功是能量转化的量度。当合外力为恒力且初速度为零时，W = F合s = ½mv²。',
      steps: ['平衡摩擦力并安装速度传感器', '用恒定拉力拉小车一段距离', '记录拉力、位移与末速度', '绘制 W–v² 图像并分析斜率'],
      controls: [
        { key: 'F', label: '拉力 F', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'N', decimals: 1 },
        { key: 'm', label: '小车质量 m', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'kg', decimals: 2 },
        { key: 's', label: '位移 s', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'm', decimals: 1 },
        { key: 'mu', label: '摩擦因数 μ', min: 0, max: 0.4, step: 0.01, value: 0.1, unit: '', decimals: 2 }
      ]
    },
    {
      n: 8, id: 'mechanical-energy', title: '验证机械能守恒定律',
      short: '释放摆动小球，追踪动能、势能与总机械能的转化。',
      category: 'mechanics', accent: '#0a84ff', icon: 'pendulum',
      difficulty: '进阶', time: '10 分钟', tags: ['能量守恒', '摆'],
      description: '小球从某一高度由静止释放，在摆动过程中重力势能与动能相互转化。能量条实时显示三种能量的变化。',
      formula: 'mgh₁ + ½mv₁² = mgh₂ + ½mv₂²', formulaNote: '只有重力做功时，动能与重力势能之和保持不变。',
      principle: '忽略空气阻力时，摆球的机械能守恒。最低点势能最小、动能最大；最高点正好相反。',
      steps: ['测量摆球质量与释放高度', '由静止释放摆球', '记录不同位置的速率', '计算各位置机械能并比较'],
      controls: [
        { key: 'length', label: '摆长 L', min: 0.5, max: 2, step: 0.05, value: 1, unit: 'm', decimals: 2 },
        { key: 'angle', label: '释放角 θ₀', min: 10, max: 70, step: 1, value: 35, unit: '°', decimals: 0 },
        { key: 'mass', label: '摆球质量 m', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', decimals: 2 },
        { key: 'damping', label: '空气阻力', min: 0, max: 0.15, step: 0.005, value: 0.02, unit: '', decimals: 3 }
      ]
    },
    {
      n: 9, id: 'momentum', title: '验证动量守恒定律',
      short: '让两辆气垫导轨小车碰撞，比较碰撞前后的总动量。',
      category: 'mechanics', accent: '#0a84ff', icon: 'collision',
      difficulty: '进阶', time: '11 分钟', tags: ['碰撞', '动量'],
      description: '两辆小车在气垫导轨上发生一维碰撞，光电门测量碰前与碰后速度。改变质量与恢复系数，检验系统总动量是否守恒。',
      formula: 'm₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′', formulaNote: '系统所受合外力为零时，总动量守恒；弹性碰撞还满足动能守恒。',
      principle: '碰撞过程中内力远大于外力，系统动量近似守恒。恢复系数 e=1 为弹性碰撞，e=0 为完全非弹性碰撞。',
      steps: ['调平气垫导轨并安装光电门', '测量两小车质量', '记录碰前速度', '记录碰后速度并计算总动量'],
      controls: [
        { key: 'm1', label: '小车 1 质量 m₁', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'kg', decimals: 2 },
        { key: 'm2', label: '小车 2 质量 m₂', min: 0.2, max: 2, step: 0.05, value: 0.6, unit: 'kg', decimals: 2 },
        { key: 'v1', label: '碰前速度 v₁', min: 0.2, max: 4, step: 0.05, value: 2, unit: 'm/s', decimals: 2 },
        { key: 'v2', label: '碰前速度 v₂', min: -2, max: 1, step: 0.05, value: 0, unit: 'm/s', decimals: 2 },
        { key: 'e', label: '恢复系数 e', min: 0, max: 1, step: 0.05, value: 1, unit: '', decimals: 2 }
      ]
    },
    {
      n: 10, id: 'simple-pendulum', title: '用单摆测量重力加速度',
      short: '测量不同摆长的周期，用 T²–L 图像求出当地重力加速度。',
      category: 'mechanics', accent: '#0a84ff', icon: 'clock',
      difficulty: '基础', time: '9 分钟', tags: ['单摆', 'T²–L 图像'],
      description: '单摆做小角度摆动时具有等时性。测量摆长 L 与周期 T，绘制 T²–L 图像，由斜率 g = 4π²/k 计算重力加速度。',
      formula: 'T = 2π√(L/g) ⇒ T² = (4π²/g)L', formulaNote: 'T²–L 图像是过原点的直线，斜率为 4π²/g。',
      principle: '摆角小于 5° 时，单摆周期与摆长平方根成正比，与摆球质量、振幅无关。',
      steps: ['测量摆线长度与摆球直径', '使摆角小于 5° 后释放', '用秒表测量 30 次全振动时间', '改变摆长，绘制 T²–L 图像'],
      controls: [
        { key: 'L', label: '摆长 L', min: 0.4, max: 1.5, step: 0.05, value: 1, unit: 'm', decimals: 2 },
        { key: 'g', label: '环境重力加速度 g', min: 1.6, max: 20, step: 0.1, value: 9.8, unit: 'm/s²', decimals: 1 },
        { key: 'amp', label: '初始摆角', min: 2, max: 18, step: 1, value: 6, unit: '°', decimals: 0 }
      ]
    },
    {
      n: 11, id: 'resistivity', title: '测量金属丝的电阻率',
      short: '伏安法测电阻，结合长度与直径算出金属的电阻率。',
      category: 'electricity', accent: '#ff9f0a', icon: 'wire',
      difficulty: '进阶', time: '12 分钟', tags: ['伏安法', '电阻定律'],
      description: '用伏安法测量金属丝电阻，用刻度尺测长度、螺旋测微器测直径，再由 R = ρL/S 计算电阻率。',
      formula: 'ρ = RS/L = πRd²/(4L)', formulaNote: '金属丝直径需用螺旋测微器多次测量取平均，电阻用伏安法测量。',
      principle: '电阻定律表明，导体电阻与长度成正比、与横截面积成反比，比例系数为电阻率。',
      steps: ['测量金属丝有效长度 L', '用螺旋测微器测直径 d', '连接伏安法电路，测 U 和 I', '计算 R、S 与电阻率 ρ'],
      controls: [
        { key: 'material', label: '金属材料', type: 'select', value: 'nichrome', options: [{ value: 'nichrome', label: '镍铬合金' }, { value: 'copper', label: '铜' }, { value: 'aluminum', label: '铝' }] },
        { key: 'L', label: '金属丝长度 L', min: 0.4, max: 1.2, step: 0.02, value: 0.8, unit: 'm', decimals: 2 },
        { key: 'd', label: '直径 d', min: 0.2, max: 1, step: 0.01, value: 0.5, unit: 'mm', decimals: 2 },
        { key: 'U', label: '电压 U', min: 0.2, max: 3, step: 0.1, value: 1.5, unit: 'V', decimals: 1 }
      ]
    },
    {
      n: 12, id: 'bulb-curve', title: '描绘小灯泡的伏安特性曲线',
      short: '逐渐升高电压，记录灯泡的电流，观察灯丝电阻的变化。',
      category: 'electricity', accent: '#ff9f0a', icon: 'bulb',
      difficulty: '进阶', time: '11 分钟', tags: ['非线性元件', '伏安特性'],
      description: '小灯泡的灯丝温度随电流升高而升高，电阻随之增大，因此 I–U 图线不是直线。用分压电路从零开始调节电压。',
      formula: 'R = U/I ，  P = UI', formulaNote: '图线上某点与原点连线的斜率等于 1/R；曲线向电流轴弯曲说明电阻增大。',
      principle: '金属的电阻率随温度升高而增大。灯泡两端电压越大，灯丝温度越高，电阻越大。',
      steps: ['连接分压式供电电路', '从零开始缓慢升高电压', '记录多组电压与电流值', '描点连线并分析电阻变化'],
      controls: [
        { key: 'U', label: '电压 U', min: 0, max: 12, step: 0.1, value: 6, unit: 'V', decimals: 1 },
        { key: 'R0', label: '冷态电阻 R₀', min: 5, max: 30, step: 1, value: 12, unit: 'Ω', decimals: 0 }
      ]
    },
    {
      n: 13, id: 'emf-internal', title: '测量电源电动势和内阻',
      short: '改变外电阻，用 U–I 图像的截距和斜率求 E 与 r。',
      category: 'electricity', accent: '#ff9f0a', icon: 'battery',
      difficulty: '进阶', time: '12 分钟', tags: ['闭合电路', 'U–I 图像'],
      description: '改变滑动变阻器阻值，记录路端电压 U 与总电流 I。U–I 图线的纵截距为电动势 E，斜率绝对值为内阻 r。',
      formula: 'U = E − Ir', formulaNote: '纵轴截距是 E，横轴截距是短路电流 E/r，斜率绝对值为 r。',
      principle: '闭合电路欧姆定律：E = U + Ir。电源内阻导致路端电压随电流增大而降低。',
      steps: ['按电路图连接电源、开关与变阻器', '改变外电阻，记录多组 U、I', '绘制 U–I 图像', '由截距与斜率求出 E 和 r'],
      controls: [
        { key: 'E', label: '电动势 E', min: 1.5, max: 12, step: 0.1, value: 6, unit: 'V', decimals: 1 },
        { key: 'r', label: '内阻 r', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'Ω', decimals: 2 },
        { key: 'R', label: '外电阻 R', min: 1, max: 20, step: 0.1, value: 5, unit: 'Ω', decimals: 1 }
      ]
    },
    {
      n: 14, id: 'multimeter', title: '练习使用多用电表',
      short: '旋转挡位，拖动红黑表笔测量电阻、电压和电流。',
      category: 'electricity', accent: '#ff9f0a', icon: 'multimeter',
      difficulty: '基础', time: '10 分钟', tags: ['多用电表', '表笔接线', '测量工具'],
      description: '多用电表集电压表、电流表与欧姆表于一体。选择正确的挡位与量程，拖动红黑表笔接触待测元件两端，读出数值，并理解表盘刻度不均匀的原因。',
      formula: 'I = U/(R + R_g) ，  R_x = E/(I) − R内', formulaNote: '欧姆挡刻度不均匀，换挡后必须重新进行欧姆调零。',
      principle: '多用电表通过切换内部电路实现不同测量功能。测电阻时使用内部电源，待测电阻必须与外部电源断开。',
      steps: ['检查指针是否指在零刻度', '选择测量功能与合适量程', '拖动红黑表笔，分别接触待测元件两端', '读数并记录测量结果'],
      controls: [
        { key: 'mode', label: '测量功能', type: 'select', value: 'resistance', options: [{ value: 'resistance', label: '电阻 Ω' }, { value: 'voltage', label: '直流电压 V' }, { value: 'current', label: '直流电流 mA' }] },
        { key: 'range', label: '量程', type: 'select', value: 'auto', options: [{ value: 'auto', label: '自动量程' }, { value: 'low', label: '低量程' }, { value: 'high', label: '高量程' }] },
        { key: 'component', label: '待测元件', type: 'select', value: 'resistor', options: [
          { value: 'resistor', label: '定值电阻 220 Ω' },
          { value: 'carbon', label: '碳膜电阻 1 kΩ' },
          { value: 'wirewound', label: '线绕电阻 47 Ω' },
          { value: 'thermistor', label: '热敏电阻 560 Ω' },
          { value: 'photoresistor', label: '光敏电阻 2.2 kΩ' },
          { value: 'battery', label: '干电池 1.5 V' },
          { value: 'lamp', label: '小灯泡 0.3 A' }
        ] }
      ]
    },
    {
      n: 15, id: 'ampere-force', title: '探究安培力的大小',
      short: '把通电导体放入磁场，观察电流、磁场与夹角对受力的影响。',
      category: 'electricity', accent: '#ff9f0a', icon: 'magnet',
      difficulty: '进阶', time: '9 分钟', tags: ['安培力', '左手定则'],
      description: '通电导体棒放置在蹄形磁铁的磁场中。改变电流、磁感应强度、导体长度和夹角，测量安培力大小。',
      formula: 'F = BIL sin θ', formulaNote: '电流方向与磁场方向平行时安培力为零；垂直时安培力最大。',
      principle: '安培力方向由左手定则判断：让磁感线穿入手心，四指指向电流方向，大拇指指向安培力方向。',
      steps: ['将导体棒放入磁场并接通电路', '保持 B、L 不变，改变电流 I', '保持其他量不变，改变夹角 θ', '记录力传感器示数并作 F–I 图像'],
      controls: [
        { key: 'I', label: '电流 I', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'A', decimals: 1 },
        { key: 'B', label: '磁感应强度 B', min: 0.05, max: 0.8, step: 0.01, value: 0.35, unit: 'T', decimals: 2 },
        { key: 'L', label: '导体长度 L', min: 0.1, max: 1, step: 0.02, value: 0.4, unit: 'm', decimals: 2 },
        { key: 'angle', label: 'I 与 B 的夹角 θ', min: 0, max: 180, step: 1, value: 90, unit: '°', decimals: 0 }
      ]
    },
    {
      n: 16, id: 'induction', title: '探究电磁感应的产生条件',
      short: '让磁铁穿过线圈，观察磁通量变化如何产生感应电流。',
      category: 'electricity', accent: '#ff9f0a', icon: 'coil',
      difficulty: '进阶', time: '11 分钟', tags: ['电磁感应', '楞次定律'],
      description: '磁铁插入或拔出线圈时，穿过线圈的磁通量发生变化，回路中产生感应电流。灵敏电流计的偏转方向反映感应电流方向。',
      formula: 'E = n·ΔΦ/Δt', formulaNote: '感应电动势与磁通量变化率成正比；磁通量不变时即使磁场很强也不产生感应电流。',
      principle: '只要穿过闭合回路的磁通量发生变化，回路中就会产生感应电流。感应电流的磁场总是阻碍原磁通量的变化。',
      steps: ['将线圈与灵敏电流计连成闭合回路', '把磁铁快速插入线圈', '观察指针偏转方向并记录', '改变磁铁速度与匝数，重复实验'],
      controls: [
        { key: 'speed', label: '磁铁运动速度', min: 0.2, max: 4, step: 0.05, value: 1.5, unit: 'm/s', decimals: 2 },
        { key: 'turns', label: '线圈匝数 n', min: 100, max: 1000, step: 50, value: 400, unit: '匝', decimals: 0 },
        { key: 'strength', label: '磁铁强度', min: 0.2, max: 1.5, step: 0.05, value: 1, unit: '×', decimals: 2 },
        { key: 'motion', label: '运动方式', type: 'select', value: 'insert', options: [{ value: 'insert', label: '插入磁铁' }, { value: 'withdraw', label: '拔出磁铁' }, { value: 'still', label: '静止不动' }] }
      ]
    },
    {
      n: 17, id: 'transformer', title: '探究变压器电压与匝数的关系',
      short: '改变原副线圈匝数，观察理想变压器的升压与降压。',
      category: 'electricity', accent: '#ff9f0a', icon: 'transformer',
      difficulty: '进阶', time: '10 分钟', tags: ['变压器', '交流电'],
      description: '理想变压器的铁芯中形成交变磁通，原、副线圈的电压比等于匝数比。改变匝数或输入电压，观察副线圈电压与灯泡亮度。',
      formula: 'U₁/U₂ = n₁/n₂ ，  I₁/I₂ = n₂/n₁', formulaNote: '理想变压器不改变频率，输入功率等于输出功率。',
      principle: '电磁感应使能量在原、副线圈之间传递。副线圈匝数多于原线圈时为升压变压器。',
      steps: ['连接原线圈与低压交流电源', '将副线圈接小灯泡', '改变副线圈匝数并测电压', '绘制 U₂–n₂ 图像并验证比例关系'],
      controls: [
        { key: 'n1', label: '原线圈匝数 n₁', min: 100, max: 1000, step: 50, value: 400, unit: '匝', decimals: 0 },
        { key: 'n2', label: '副线圈匝数 n₂', min: 50, max: 1200, step: 50, value: 800, unit: '匝', decimals: 0 },
        { key: 'U1', label: '输入电压 U₁', min: 6, max: 36, step: 0.5, value: 12, unit: 'V', decimals: 1 },
        { key: 'R', label: '负载电阻 R', min: 5, max: 100, step: 1, value: 20, unit: 'Ω', decimals: 0 }
      ]
    },
    {
      n: 18, id: 'capacitor', title: '探究平行板电容器的电容',
      short: '改变正对面积、板间距和介质，研究电容的决定因素。',
      category: 'electricity', accent: '#ff9f0a', icon: 'capacitor',
      difficulty: '进阶', time: '12 分钟', tags: ['电容器', '电场'],
      description: '平行板电容器与静电计相连，改变极板正对面积、间距或插入电介质，观察电容与电势差的变化。',
      formula: 'C = ε₀εᵣS/d ，  Q = CU ，  E = U/d', formulaNote: '电容与正对面积、介电常数成正比，与板间距成反比。',
      principle: '电容是电容器本身的属性，由极板形状、大小、间距和介质决定，与所带电荷量无关。',
      steps: ['连接平行板与静电计', '保持电荷量不变，改变板间距', '记录静电计指针偏角', '插入不同介质，比较电容变化'],
      controls: [
        { key: 'S', label: '正对面积 S', min: 0.01, max: 0.5, step: 0.01, value: 0.1, unit: 'm²', decimals: 2 },
        { key: 'd', label: '板间距 d', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'mm', decimals: 1 },
        { key: 'er', label: '介电常数 εᵣ', min: 1, max: 5, step: 0.1, value: 1, unit: '', decimals: 1 },
        { key: 'U', label: '电压 U', min: 1, max: 20, step: 0.5, value: 10, unit: 'V', decimals: 1 },
        { key: 'chartMode', label: '图像模式', type: 'segmented', value: 'Cd', options: [{ value: 'Cd', label: 'C–d' }, { value: 'CS', label: 'C–S' }] }
      ]
    },
    {
      n: 19, id: 'refraction', title: '测量玻璃的折射率',
      short: '用插针法追踪光线穿过玻璃砖，由折射角求折射率。',
      category: 'optics', accent: '#bf5af2', icon: 'prism',
      difficulty: '进阶', time: '10 分钟', tags: ['折射定律', '插针法'],
      description: '光线从空气斜射入半圆形玻璃砖，入射角 i 与折射角 r 满足斯涅尔定律。作 sin i–sin r 图像，斜率即折射率。',
      formula: 'n = sin i / sin r', formulaNote: '光从空气进入玻璃时，折射角小于入射角；sin i–sin r 图线为过原点的直线。',
      principle: '折射定律指出，入射角与折射角的正弦之比为常数，该常数等于两种介质的相对折射率。',
      steps: ['在白纸上画出玻璃砖界面', '从一侧插针确定入射光线', '从另一侧观察并插针确定出射光线', '量角并绘制 sin i–sin r 图像'],
      controls: [
        { key: 'i', label: '入射角 i', min: 5, max: 80, step: 1, value: 40, unit: '°', decimals: 0 },
        { key: 'n', label: '玻璃折射率 n', min: 1.3, max: 1.9, step: 0.01, value: 1.5, unit: '', decimals: 2 }
      ]
    },
    {
      n: 20, id: 'double-slit', title: '用双缝干涉测光的波长',
      short: '调节双缝间距与屏距，从干涉条纹间距反推光的波长。',
      category: 'optics', accent: '#bf5af2', icon: 'wave',
      difficulty: '进阶', time: '11 分钟', tags: ['双缝干涉', '波长'],
      description: '单色光通过双缝后在屏上形成明暗相间的干涉条纹。测量相邻亮纹间距 Δx、双缝间距 d 与屏距 L，可计算波长。',
      formula: 'Δx = λL/d ⇒ λ = Δx·d/L', formulaNote: '条纹间距与波长、屏距成正比，与双缝间距成反比。',
      principle: '两束相干光在屏上叠加，光程差为波长整数倍处形成亮纹，半波长奇数倍处形成暗纹。',
      steps: ['调节单缝与双缝平行', '安装测量头并观察干涉条纹', '测量 n 个亮纹间距求平均值', '代入公式计算光的波长'],
      controls: [
        { key: 'lambda', label: '光的波长 λ', min: 380, max: 750, step: 1, value: 550, unit: 'nm', decimals: 0 },
        { key: 'd', label: '双缝间距 d', min: 0.1, max: 0.8, step: 0.01, value: 0.25, unit: 'mm', decimals: 2 },
        { key: 'L', label: '屏距 L', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 'm', decimals: 2 }
      ]
    },
    {
      n: 21, id: 'oil-film', title: '用油膜法估测分子的大小',
      short: '让一滴油在水面铺成单分子层，用面积反推分子直径。',
      category: 'molecular', accent: '#30d158', icon: 'droplet',
      difficulty: '进阶', time: '12 分钟', tags: ['油膜法', '分子尺度'],
      description: '将已知体积的油酸酒精溶液滴在水面，酒精溶于水，油酸铺展成单分子油膜。测量油膜面积，即可估算油酸分子的直径。',
      formula: 'd = V/S', formulaNote: '把油膜看作单分子层，分子直径等于油酸体积除以油膜面积。',
      principle: '油酸分子一端亲水、一端疏水，会在水面形成单分子层。这是把宏观测量延伸到微观尺度的经典方法。',
      steps: ['配制已知浓度的油酸酒精溶液', '用滴管测出一滴溶液的体积', '将一滴溶液滴入撒有爽身粉的水面', '描绘油膜轮廓并估算面积'],
      controls: [
        { key: 'V', label: '一滴溶液体积 V', min: 0.005, max: 0.05, step: 0.001, value: 0.02, unit: 'mL', decimals: 3 },
        { key: 'c', label: '油酸浓度', min: 0.05, max: 0.5, step: 0.01, value: 0.1, unit: '%', decimals: 2 },
        { key: 'A', label: '油膜面积 S', min: 100, max: 400, step: 5, value: 200, unit: 'cm²', decimals: 0 }
      ]
    }
  ];

  /* 21 个实验的册次归属；仅用于“按教材”浏览筛选。 */
  const bookByExp = {
    'accelerated-motion': 'b1',
    'hooke-law': 'b1',
    'force-parallelogram': 'b1',
    'newton-second': 'b1',
    'projectile': 'b2',
    'centripetal': 'b2',
    'work-energy': 'b2',
    'mechanical-energy': 'b2',
    'momentum': 'x1',
    'simple-pendulum': 'x1',
    'resistivity': 'b3',
    'bulb-curve': 'b3',
    'emf-internal': 'b3',
    'multimeter': 'b3',
    'ampere-force': 'x2',
    'induction': 'x2',
    'transformer': 'x2',
    'capacitor': 'b3',
    'refraction': 'x1',
    'double-slit': 'x1',
    'oil-film': 'x3'
  };
  experiments.forEach(function (e) { e.book = bookByExp[e.id] || 'b1'; });

  function get(id) { return experiments.find(function (e) { return e.id === id; }); }
  function categoryOf(exp) { return categories[exp.category]; }
  function byCategory(cat) { return experiments.filter(function (e) { return e.category === cat; }); }
  function byBook(book) { return experiments.filter(function (e) { return e.book === book; }); }
  function bookOf(exp) { return books[exp && exp.book] || books.b1; }

  window.OL = window.OL || {};
  window.OL.categories = categories;
  window.OL.books = books;
  window.OL.experiments = experiments;
  window.OL.icons = paths;
  window.OL.icon = icon;
  window.OL.getExperiment = get;
  window.OL.categoryOf = categoryOf;
  window.OL.byCategory = byCategory;
  window.OL.byBook = byBook;
  window.OL.bookOf = bookOf;
})();
