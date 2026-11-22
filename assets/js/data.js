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
    droplet: '<path d="M24 5c6 9 11 14 11 21a11 11 0 0 1-22 0c0-7 5-12 11-21Z"/><path d="M6 39c6-3 11-3 18 0s12 3 18 0" stroke-dasharray="3 4"/><circle cx="24" cy="27" r="5" opacity=".45"/>',
    cylinder: '<path d="M13 9h22v4a22 7 0 0 1-22 0V9Z"/><path d="M13 13v26a22 7 0 0 0 22 0V13"/><path d="M18 20h12M18 26h12M18 32h12" opacity=".55"/>'
  };

  function icon(name, cls) {
    return '<svg viewBox="0 0 48 48" class="' + (cls || '') + '" aria-hidden="true">' + (paths[name] || paths.mechanics) + '</svg>';
  }

  const experiments = [
    {
      n: 1, id: 'accelerated-motion', title: '探究匀变速直线运动的规律',
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
      n: 2, id: 'hooke-law', title: '探究弹力与形变量的关系',
      short: '改变钩码质量，寻找弹簧弹力与伸长量之间的线性关系。',
      category: 'mechanics', accent: '#0a84ff', icon: 'spring',
      difficulty: '基础', time: '7 分钟', tags: ['胡克定律', 'F–x 图像'],
      description: '在竖直悬挂的弹簧下端逐个增加钩码，测量弹簧的伸长量。以弹力 F 为纵轴、伸长量 x 为横轴作图，图线斜率即弹簧的劲度系数。',
      formula: 'F = kx', formulaNote: '在弹性限度内，弹力与伸长量成正比；F–x 图像的斜率表示劲度系数 k。',
      principle: '本实验依据二力平衡，重物重力等于弹簧弹力。在弹性限度内，改变弹簧所受弹力，测量对应形变量，通过多组数据作图可得：弹簧弹力与形变量成正比例关系，验证胡克定律。',
      steps: ['记录弹簧自然长度', '逐个增加钩码并等待静止', '测量弹簧总长度，计算伸长量', '绘制 F–x 图像并求劲度系数'],
      stepVersions: {
        simple: ['记录弹簧自然长度', '逐个增加钩码并等待静止', '测量弹簧总长度，计算伸长量', '绘制 F–x 图像并求劲度系数'],
        complex: [
          '将弹簧竖直悬挂在铁架台上，待静止后记录指针位置，作为自然长度 L₀；刻度尺估读到 0.1 cm。',
          '在弹簧下端挂上最小钩码，等待弹簧完全静止，记录钩码总质量 m 和指针位置。',
          '逐个增加钩码，每次增加后等待静止，记录对应的总质量 m 和指针位置；注意不要超过弹簧的弹性限度。',
          '用刻度尺测量每次弹簧总长度 L，计算伸长量 x = L − L₀，并填写数据记录表。',
          '以弹力 F = mg 为纵轴、伸长量 x 为横轴描点，用直尺作出拟合直线。',
          '求出 F–x 图线的斜率 k，分析斜率与弹簧劲度系数的关系，并检查图线是否通过原点。',
          '换用不同弹簧或重复测量，讨论弹性限度、刻度读数、钩码摆动等误差来源。'
        ]
      },
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
      description: '用图钉固定橡皮条，两个弹簧测力计沿不同方向拉结点到 O；再用一个弹簧测力计把结点拉到同一 O，比较两分力与等效合力。',
      formula: '等效替代法', formulaPlain: true, formulaNote: '',
      principle: '等效替代法：两个分力共同作用的效果，与一个合力单独作用的效果相同。实验中两次都把橡皮条结点拉到同一位置 O，用合力等效替代两个分力，再比较合力与平行四边形对角线。',
      steps: ['固定白纸、图钉和橡皮条，标出结点 O', '两个弹簧测力计沿不同方向拉结点到 O，记录 F₁、F₂ 和角度', '用一个弹簧测力计把结点拉到同一 O，记录等效合力', '按同一标度作平行四边形，比较对角线与等效合力'],
      controls: [
        { key: 'f1', label: '分力 F₁', min: 1, max: 10, step: 0.1, value: 6, unit: 'N', decimals: 1 },
        { key: 'f2', label: '分力 F₂', min: 1, max: 10, step: 0.1, value: 4, unit: 'N', decimals: 1 },
        { key: 'angle', label: '夹角 θ', min: 20, max: 160, step: 1, value: 60, unit: '°', decimals: 0 }
      ]
    },
    {
      n: 4, id: 'newton-second', title: '探究加速度与合外力、质量的关系',
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
      n: 5, id: 'projectile', title: '探究平抛运动的规律',
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
      n: 6, id: 'centripetal', title: '探究向心力大小的影响因素',
      short: '转动手摇向心力演示器，观察小球做圆周运动，比较质量、半径和角速度对向心力的影响。',
      category: 'mechanics', accent: '#0a84ff', icon: 'orbit',
      difficulty: '进阶', time: '10 分钟', tags: ['圆周运动', '向心力'],
      description: '仪器外形与高中实验室真实手摇向心力演示器一致：黑色底座、手摇转动手柄、水平金属长转轴、两个可移动金属小球、带刻度滑杆、配重套和传动结构；摇动手柄带动小球做圆周运动。',
      formula: 'F = mω²r = mv²/r', formulaNote: '向心力与质量、半径成正比，与角速度的平方成正比。',
      principle: '向心力指向圆心，只改变速度方向而不改变速度大小。手摇手柄经传动结构带动水平长转轴旋转，小球在滑杆上做圆周运动；通过配重套和滑杆位置改变质量、半径，用测力套筒比较向心力。',
      steps: ['检查底座、传动结构和滑杆，确认两球位置', '转动手摇手柄，带动小球做稳定的圆周运动', '移动滑杆上的小球或更换配重套，改变半径和质量', '读取测力套筒示数，比较 F 与 m、r、ω 的关系'],
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
      description: '用橡皮筋拉动小车在长木板上加速，打点计时器记录纸带；改变橡皮筋条数或位移，测量做功与小车末速度，绘制 W–v² 图像。',
      formula: 'W = ½mv²', formulaNote: '合外力做的功等于动能变化；W–v² 图线应为过原点的直线，斜率为 m/2。',
      principle: '功是能量转化的量度。平衡摩擦力后，橡皮筋对小车做的功等于合外力做功；初速度为零时 W = ½mv²。',
      steps: ['垫高长木板平衡摩擦力，纸带穿过打点计时器', '用橡皮筋拉小车一段较长位移，记录拉力与位移', '从纸带点距均匀段求小车末速度，记录 W 与 v', '改变橡皮筋条数或位移，绘制 W–v² 图像并分析斜率'],
      controls: [
        { key: 'F', label: '拉力 F', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'N', decimals: 1 },
        { key: 'm', label: '小车质量 m', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'kg', decimals: 2 },
        { key: 's', label: '位移 s', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'm', decimals: 1 },
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
      n: 10, id: 'simple-pendulum', title: '利用单摆测重力加速度',
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
      description: '用伏安法测量金属丝电阻，用游标卡尺测有效长度 L、螺旋测微器测直径 d，再由 R = ρL/S 计算电阻率。',
      formula: 'ρ = RS/L = πRd²/(4L)', formulaNote: '游标卡尺精度 0.02 mm，读数 = 主尺 + 对齐格数×0.02 mm；螺旋测微器精度 0.01 mm，读数 = 固定刻度 + 可动刻度×0.01 mm，并估读到 0.001 mm。',
      principle: '电阻定律表明，导体电阻与长度成正比、与横截面积成反比，比例系数为电阻率。长度用游标卡尺测量，直径用螺旋测微器在三个不同位置各测一次取平均，再由 S = πd²/4 求横截面积。',
      steps: ['用游标卡尺测量金属丝有效长度 L', '用螺旋测微器在三个位置测量直径 d 并取平均', '连接伏安法电路，测 U 和 I', '计算 R、S 与电阻率 ρ'],
      errorAnalysis: {
        title: '伏安法测电阻：电流表、电压表内阻引起的系统误差',
        lead: '电流表内阻 R_A 不为零，电压表内阻 R_V 也不是无限大。它们会改变待测电阻两端的电压或流过待测电阻的电流，使按 R测 = U/I 算出的结果系统性地偏大或偏小。',
        formula: 'R测 = U / I',
        cases: [
          { kind: 'smaller', name: '电流表外接法（电压表直接并联待测电阻）', formula: 'R测 = R_x·R_V / (R_x + R_V) < R_x', verdict: '测量值偏小' },
          { kind: 'larger', name: '电流表内接法（电压表并联电阻与电流表串联支路）', formula: 'R测 = R_x + R_A > R_x', verdict: '测量值偏大' }
        ],
        method: '当 R_x ≪ R_V 时，电压表分流可以忽略，宜采用外接法；当 R_x ≫ R_A 时，电流表分压可以忽略，宜采用内接法。若两者都不可忽略，应进行电表内阻修正。',
        conclusion: '不能笼统地说伏安法一定偏大或偏小：外接法使测量值偏小，内接法使测量值偏大。判断误差方向的关键是看电表内阻相对待测电阻的大小。'
      },
      controls: [
        { key: 'material', label: '金属材料', type: 'select', value: 'nichrome', options: [{ value: 'nichrome', label: '镍铬合金' }, { value: 'copper', label: '铜' }, { value: 'aluminum', label: '铝' }] },
        { key: 'L', label: '金属丝长度 L（游标卡尺）', min: 0.04, max: 0.12, step: 0.001, value: 0.08, unit: 'm', decimals: 3 },
        { key: 'd', label: '直径 d（螺旋测微器）', min: 0.2, max: 1, step: 0.01, value: 0.5, unit: 'mm', decimals: 2 },
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
      errorAnalysis: {
        title: '小灯泡伏安特性：电表内阻与温度效应的叠加',
        lead: '小灯泡的灯丝电阻随温度变化，本身就不是线性元件；同时电流表内阻 R_A 和电压表内阻 R_V 会带来测量误差。分析时要把“电表内阻造成的系统误差”和“灯丝升温造成的电阻变化”区分开。',
        formula: 'R测 = U / I ，  P = U·I',
        cases: [
          { kind: 'smaller', name: '电流表外接法', formula: 'R测 = R_x(U)·R_V / (R_x(U) + R_V) < R_x(U)', verdict: '同一电压下测量值偏小' },
          { kind: 'larger', name: '电流表内接法', formula: 'R测 = R_x(U) + R_A > R_x(U)', verdict: '同一电压下测量值偏大' }
        ],
        method: '小灯泡通常采用分压电路，使电压可以从零开始连续调节。电压表内阻越大、电流表内阻越小，测量越接近真实值；灯丝温度越高，真实电阻 R_x(U) 越大。',
        conclusion: 'I–U 图线的弯曲主要来自灯丝温度升高，而电表内阻会造成额外的系统性偏移。读数时应同时说明接法，否则不能只根据曲线判断“电阻变大还是变小”。'
      },
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
      errorAnalysis: {
        title: '电源电动势和内阻：电压表分流与电流表分压',
        lead: '电压表内阻 R_V 会从电源分流，电流表内阻 R_A 会分压。按理想电表公式 U = E − Ir 处理 U–I 图线时，截距和斜率会偏离真实值。',
        formula: 'U = E − I·r',
        cases: [
          { kind: 'smaller', name: '电压表直接并接电源两端，电流表测负载支路', formula: 'E测 = E / (1 + r/R_V) < E\nr测 = r / (1 + r/R_V) < r', verdict: 'E、r 均偏小' },
          { kind: 'larger', name: '电流表接在干路，电压表测负载两端', formula: 'r测 = r + R_A > r\nE测 ≈ E', verdict: '内阻偏大' }
        ],
        method: '电压表内阻越大，分流越小；电流表内阻越小，分压越小。若 R_V 不是远大于 r、R_A 不是远小于 r，应按实际电路重新推导 U–I 关系，而不能直接套用理想电表公式。',
        conclusion: '本实验的误差方向取决于电表接法：电压表并接电源时 E、r 通常偏小；电流表接入干路时测得的 r 会包含 R_A，因而偏大。'
      },
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
      errorAnalysis: {
        title: '欧姆挡：内部电源、内阻与调零误差',
        lead: '欧姆挡利用表内电源和已知内阻测量电阻。若电池电动势下降、内阻变大，或测量前没有短接表笔重新调零，指针电流与刻度对应的电阻值就会偏离真实值。',
        formula: 'R_x = E / I − R内',
        cases: [
          { kind: 'larger', name: '电池老化：E 下降或 R内 增大', formula: '同一 R_x 下 I 变小 → 指针落在更大的电阻刻度', verdict: '读数通常偏大' },
          { kind: 'note', name: '欧姆调零不准或换挡后未重新调零', formula: 'R测 = E / I − R内(实际) ≠ R_x', verdict: '可能偏大或偏小' },
          { kind: 'note', name: '量程选择或读数误差', formula: '倍率 × 刻度读数 ≠ R_x', verdict: '由读数与倍率决定' }
        ],
        method: '每次换挡后都要把红黑表笔短接，调节欧姆调零旋钮使指针指到 0 Ω；测量时待测元件必须与外部电源断开。读数应结合所选倍率，并注意欧姆刻度不均匀。',
        conclusion: '欧姆挡的误差不只来自读数。电池老化通常使读数偏大；调零不准或倍率读错时可能偏大也可能偏小，因此“换挡后重新调零”和“确认倍率”是判断误差方向的前提。'
      },
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
      n: 19, id: 'refraction', title: '“插针法”测量玻璃砖的折射率',
      short: '用插针法追踪光线穿过玻璃砖，由折射角求折射率。',
      category: 'optics', accent: '#bf5af2', icon: 'prism',
      difficulty: '进阶', time: '10 分钟', tags: ['折射定律', '插针法'],
      description: '用插针法确定入射光线和出射光线，量出入射角 i 与折射角 r。作 sin i–sin r 图像，斜率即玻璃砖的折射率。',
      formula: 'n = sin i / sin r', formulaNote: '光从空气进入玻璃时，折射角小于入射角；sin i–sin r 图线为过原点的直线。',
      principle: '折射定律指出，入射角与折射角的正弦之比为常数，该常数等于两种介质的相对折射率。',
      steps: ['在白纸上画界面 aa′ 和法线，确定入射点 O', '沿 AO 插 P₁、P₂ 两根大头针', '放上玻璃砖，画出另一侧界面 bb′', '在 bb′ 一侧插 P₃、P₄，使它们挡住前面的像', '移去玻璃砖，连接 OO′ 确定出射光线', '量出入射角 i 和折射角 r', '计算 n = sin i/sin r，或作 sin i–sin r 图像求斜率'],
      controls: [
        { key: 'i', label: '入射角 i', min: 5, max: 80, step: 1, value: 40, unit: '°', decimals: 0 },
        { key: 'n', label: '玻璃折射率 n', min: 1.3, max: 1.9, step: 0.01, value: 1.5, unit: '', decimals: 2 }
      ]
    },
    {
      n: 20, id: 'double-slit', title: '利用双缝干涉测定光的波长',
      short: '调节双缝间距与屏距，从干涉条纹间距反推光的波长。',
      category: 'optics', accent: '#bf5af2', icon: 'wave',
      difficulty: '进阶', time: '11 分钟', tags: ['双缝干涉', '波长'],
      description: '单色光通过双缝后在屏上形成明暗相间的干涉条纹。测量相邻亮纹间距 Δx、双缝间距 d 与屏距 L，可计算波长。',
      formula: 'Δx = λL/d ⇒ λ = Δx·d/L', formulaNote: '条纹间距与波长、屏距成正比，与双缝间距成反比。',
      principle: '两束相干光在屏上叠加，光程差为波长整数倍处形成亮纹，半波长奇数倍处形成暗纹。',
      steps: ['把光源、遮光筒、毛玻璃屏依次安装在光具座上', '安装单缝和双缝，使缝平行且位于遮光筒轴线', '放上滤光片，观察单色光的干涉条纹', '用测量头测出 n 条亮纹间的距离 a，求 Δx=a/(n−1)', '用刻度尺测双缝到屏的距离 L，代入 λ=Δx·d/L', '重复测量并求波长的平均值'],
      controls: [
        { key: 'lambda', label: '光的波长 λ', min: 380, max: 750, step: 1, value: 550, unit: 'nm', decimals: 0 },
        { key: 'd', label: '双缝间距 d', min: 0.1, max: 0.8, step: 0.01, value: 0.25, unit: 'mm', decimals: 2 },
        { key: 'L', label: '屏距 L', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 'm', decimals: 2 }
      ]
    },
    {
      n: 21, id: 'oil-film', title: '“油膜法”测油酸分子直径',
      short: '让一滴油在水面铺成单分子层，用面积反推分子直径。',
      category: 'molecular', accent: '#30d158', icon: 'droplet',
      difficulty: '进阶', time: '12 分钟', tags: ['油膜法', '分子尺度'],
      description: '将已知体积的油酸酒精溶液滴在水面，酒精溶于水，油酸铺展成单分子油膜。测量油膜面积，即可估算油酸分子的直径。',
      formula: 'd = V/S', formulaNote: '把油膜看作单分子层，分子直径等于纯油酸体积除以油膜面积。',
      principle: '油酸分子一端亲水、一端疏水，会在水面形成单分子层。这是把宏观测量延伸到微观尺度的经典方法。',
      steps: ['用注射器或滴管测出一滴溶液的体积和滴数', '向容器中倒入约 2 cm 深的水，均匀撒上痱子粉', '滴入一滴溶液，待油膜稳定后描绘轮廓', '用坐标方格计算油膜面积 S', '由 d = V/S 估算油酸分子直径'],
      controls: [
        { key: 'V', label: '一滴溶液体积 V', min: 0.005, max: 0.05, step: 0.001, value: 0.02, unit: 'mL', decimals: 3 },
        { key: 'c', label: '油酸浓度', min: 0.05, max: 0.5, step: 0.01, value: 0.1, unit: '%', decimals: 2 },
        { key: 'A', label: '油膜面积 S', min: 100, max: 400, step: 5, value: 200, unit: 'cm²', decimals: 0 }
      ]
    },
    {
      n: 22, id: 'gas-law', title: '探究等温条件下气体压强与体积的关系',
      short: '缓慢改变注射器中封闭空气柱的体积，验证 pV 为恒量。',
      category: 'molecular', accent: '#30d158', icon: 'cylinder',
      difficulty: '进阶', time: '10 分钟', tags: ['玻意耳定律', 'p–V 图像'],
      description: '用注射器封闭一段空气柱，缓慢改变体积并读取压强，作 p–V 与 p–1/V 图像，验证等温条件下压强与体积成反比。',
      formula: 'pV = nRT = C', formulaTex: 'pV = nRT = C',
      formulaNote: '一定质量的某种气体，在温度不变时，压强与体积的乘积为恒量，即 p 与 1/V 成正比。',
      principle: '一定质量的理想气体在温度不变时，压强与体积成反比。缓慢改变体积，使气体有充分时间与外界交换热量，保持温度不变。',
      steps: ['安装注射器、橡胶套和压力表，封闭一段空气柱', '读取空气柱长度 l 和压强 p，由 V=lS 求体积', '缓慢向下压或向上拉柱塞，记录多组 p、V', '作 p–V 图像和 p–1/V 图像', '由 p–1/V 图线为过原点直线验证玻意耳定律'],
      controls: [
        { key: 'V', label: '空气柱体积 V', min: 20, max: 100, step: 1, value: 50, unit: 'mL', decimals: 0 },
        { key: 'T', label: '气体温度 T', min: 250, max: 350, step: 1, value: 300, unit: 'K', decimals: 0 },
        { key: 'n', label: '气体物质的量 n', min: 1, max: 5, step: 0.5, value: 3, unit: 'mmol', decimals: 1 },
        { key: 'chartMode', label: '图像', type: 'segmented', options: [{ label: 'p–V', value: 'pv' }, { label: 'p–1/V', value: 'inv' }], value: 'pv' }
      ]
    }
  ];

  /* 22 个实验的册次归属；仅用于“按教材”浏览筛选。 */
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
    'oil-film': 'x3',
    'gas-law': 'x3'
  };
  experiments.forEach(function (e) { e.book = bookByExp[e.id] || 'b1'; });

  const formulaTexById = {
    'accelerated-motion': 'v = v_0 + at',
    'hooke-law': 'F = kx',
    'force-parallelogram': 'F = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta}',
    'newton-second': 'a = \\frac{F}{m}',
    'projectile': 'x = v_0 t,\\quad y = \\frac{1}{2}gt^2',
    'centripetal': 'F = m\\omega^2 r = \\frac{mv^2}{r}',
    'work-energy': 'W = \\frac{1}{2}mv^2',
    'mechanical-energy': 'mgh_1 + \\frac{1}{2}mv_1^2 = mgh_2 + \\frac{1}{2}mv_2^2',
    'momentum': 'm_1v_1 + m_2v_2 = m_1v_1\' + m_2v_2\'',
    'simple-pendulum': 'T = 2\\pi\\sqrt{\\frac{L}{g}} \\Rightarrow T^2 = \\frac{4\\pi^2}{g}L',
    'resistivity': '\\rho = \\frac{RS}{L} = \\frac{\\pi R d^2}{4L}',
    'bulb-curve': 'R = \\frac{U}{I},\\quad P = UI',
    'emf-internal': 'U = E - Ir',
    'multimeter': 'I = \\frac{U}{R + R_g},\\quad R_x = \\frac{E}{I} - R_{\\mathrm{in}}',
    'ampere-force': 'F = BIL\\sin\\theta',
    'induction': 'E = n\\frac{\\Delta\\Phi}{\\Delta t}',
    'transformer': '\\frac{U_1}{U_2} = \\frac{n_1}{n_2},\\quad \\frac{I_1}{I_2} = \\frac{n_2}{n_1}',
    'capacitor': 'C = \\frac{\\varepsilon_0\\varepsilon_r S}{d},\\quad Q = CU,\\quad E = \\frac{U}{d}',
    'refraction': 'n = \\frac{\\sin i}{\\sin r}',
    'double-slit': '\\Delta x = \\frac{\\lambda L}{d} \\Rightarrow \\lambda = \\frac{\\Delta x\\,d}{L}',
    'oil-film': 'd = \\frac{V}{S}',
    'gas-law': 'pV = nRT = C'
  };
  const errorTexById = {
    'resistivity': {
      formula: 'R_{\\mathrm{meas}} = \\frac{U}{I}',
      cases: [
        'R_{\\mathrm{meas}} = \\frac{R_x R_V}{R_x + R_V} < R_x',
        'R_{\\mathrm{meas}} = R_x + R_A > R_x'
      ]
    },
    'bulb-curve': {
      formula: 'R_{\\mathrm{meas}} = \\frac{U}{I},\\quad P = UI',
      cases: [
        'R_{\\mathrm{meas}} = \\frac{R_x(U)R_V}{R_x(U) + R_V} < R_x(U)',
        'R_{\\mathrm{meas}} = R_x(U) + R_A > R_x(U)'
      ]
    },
    'emf-internal': {
      formula: 'U = E - Ir',
      cases: [
        'E_{\\mathrm{meas}} = \\frac{E}{1 + r/R_V} < E,\\quad r_{\\mathrm{meas}} = \\frac{r}{1 + r/R_V} < r',
        'r_{\\mathrm{meas}} = r + R_A > r'
      ]
    },
    'multimeter': {
      formula: 'R_x = \\frac{E}{I} - R_{\\mathrm{in}}',
      cases: [
        'I \\downarrow \\Rightarrow R_{\\mathrm{meas}} \\uparrow',
        'R_{\\mathrm{meas}} = \\frac{E}{I} - R_{\\mathrm{in}} \\ne R_x',
        'R_{\\mathrm{meas}} = k\\theta'
      ]
    }
  };
  experiments.forEach(function (e) {
    if (formulaTexById[e.id]) e.formulaTex = formulaTexById[e.id];
    const et = errorTexById[e.id];
    if (et && e.errorAnalysis) {
      e.errorAnalysis.formulaTex = et.formula;
      if (e.errorAnalysis.cases && et.cases) {
        e.errorAnalysis.cases.forEach(function (c, i) {
          if (et.cases[i]) c.tex = et.cases[i];
        });
      }
    }
  });

  /* 同一实验的多种教材方案；有 2 个以上方案时显示方案切换 dock。 */
  const schemesById = {
    'accelerated-motion': [
      {
        title: '方案一 · 打点计时器', short: '打点计时器',
        formula: 'Δx = aT²', formulaTex: '\\Delta x = aT^2',
        principle: '打点计时器使用 50 Hz 交变电源，每 0.02 s 打一个点；纸带上相邻计数点的时间间隔由所取计数点决定。',
        formulaNote: '若连续相等时间 T 内的位移差 Δx 为恒量，则小车做匀变速直线运动；可用逐差法或 v–t 图像求加速度。',
        steps: ['固定打点计时器、纸带、小车、细绳和重物', '先接通电源，稳定后释放小车', '重复实验获得多条纸带', '用逐差法或 v–t 图像求加速度']
      },
      {
        title: '方案二 · 光电门', short: '光电门',
        formula: 'v = d/t ，  a = (v₂² − v₁²)/(2L)', formulaTex: 'v = \\frac{d}{t},\\quad a = \\frac{v_2^2 - v_1^2}{2L}',
        principle: '用遮光片通过光电门的平均速度代替瞬时速度；两光电门间距为 L，分别测出通过两个光电门的速度。',
        formulaNote: '遮光片宽度 d 要窄，释放点离第一个光电门远一些，两光电门间距尽量大，以减小测量误差。',
        steps: ['测量遮光片宽度 d 和两光电门间距 L', '释放滑块，记录通过光电门 1、2 的遮光时间 t₁、t₂', '由 v=d/t 求两个瞬时速度', '由 v₂²−v₁²=2aL 求加速度']
      }
    ],
    'force-parallelogram': [
      {
        title: '方案一 · 弹簧测力计', short: '弹簧测力计',
        formula: '等效替代法', formulaPlain: true, formulaNote: '',
        principle: '等效替代法：两个分力共同作用的效果，与一个合力单独作用的效果相同。实验中两次都把橡皮条结点拉到同一位置 O，用合力等效替代两个分力，再比较合力与平行四边形对角线。',
        formulaNote: '同一次实验结点 O 的位置必须相同；两分力夹角以 60°～120° 为宜；弹簧测力计应与木板平行。',
        steps: ['固定白纸、橡皮条和两个细绳套', '用两个测力计互成角度拉结点到 O，记录读数与方向', '用一个测力计把结点拉到同一 O，记录 F′', '按同一标度作平行四边形，比较 F 与 F′']
      },
      {
        title: '方案二 · 钩码', short: '钩码',
        formula: '等效替代法', formulaPlain: true, formulaNote: '',
        principle: '等效替代法：用三段绳悬挂钩码使结点静止，三段拉力的共同效果与其中两个拉力的合力效果相同；以两个拉力为邻边作平行四边形，其对角线与第三个拉力等大反向。',
        formulaNote: '不需要测出具体钩码重力，只要按 a:b:c 的比例作力的图示；平行四边形对角线与 F_C 近似等大反向即可验证。',
        steps: ['用三段绳悬挂 a、b、c 个等质量钩码，调整滑轮使系统静止', '记录三段绳的方向和钩码个数', '在同心圆上按比例作出 F_A、F_B、F_C', '以 F_A、F_B 为邻边作平行四边形，与 F_C 比较']
      }
    ],
    'projectile': [
      {
        title: '方案一 · 频闪照相', short: '频闪照相',
        formula: 'x = v₀t ，  y = ½gt²', formulaTex: 'x = v_0t,\\quad y = \\frac{1}{2}gt^2',
        principle: '频闪照片在相等时间间隔曝光一次；水平方向相邻位置等距，竖直方向位移差恒定，说明水平匀速、竖直自由落体。',
        formulaNote: '由 Δy=gT² 求曝光时间，由水平位移求 v₀；不可用自由落体公式反算速度，否则会默认机械能守恒。',
        steps: ['安装平抛装置，调整斜槽末端水平', '从同一位置释放小球，获得频闪照片', '测量水平、竖直方向位移', '由 Δy=gT² 和 x=v₀t 求初速度']
      },
      {
        title: '方案二 · 分运动研究', short: '分运动研究',
        formula: 'Δy = gT² ，  v₀ = x/T', formulaTex: '\\Delta y = gT^2,\\quad v_0 = \\frac{x}{T}',
        principle: '分别研究竖直和水平分运动：A 球平抛与 B 球自由落体同时落地，说明竖直分运动为自由落体；水平方向等时间位移相同。',
        formulaNote: '斜槽末端切线必须水平；小球每次从同一高度由静止释放；选实心小铁球减小空气阻力。',
        steps: ['调整斜槽末端水平，固定白纸和复写纸', '从同一高度释放小球，记录多个落点', '建立 x–y 坐标，描出平抛轨迹', '用 Δy=gT² 和水平位移求 v₀']
      }
    ],
    'centripetal': [
      {
        title: '方案一 · 向心力演示仪', short: '向心力演示仪',
        formula: 'F = mω²r = mv²/r', formulaTex: 'F = m\\omega^2r = \\frac{mv^2}{r}',
        principle: '手摇手柄经传动结构带动水平长转轴旋转，两个金属小球在带刻度滑杆上做圆周运动；采用控制变量法，比较向心力 F 与质量 m、半径 r、角速度 ω 的关系。',
        formulaNote: '移动滑杆上的小球可改变半径；配重套可改变质量；改变手摇转速可改变角速度。测力套筒示数反映向心力大小。',
        steps: ['转动手摇手柄，让两个金属小球在滑杆上做圆周运动', '保持质量、半径不变，改变转速观察测力套筒示数', '移动小球改变半径，保持质量与转速不变', '更换配重套改变质量，比较向心力']
      },
      {
        title: '方案二 · 光电门', short: '光电门',
        formula: 'ω = d/(Lt) ，  F = mω²r', formulaTex: '\\omega = \\frac{d}{Lt},\\quad F = m\\omega^2r',
        principle: '光滑水平直杆随竖直转轴匀速转动，物块由细线连接力传感器；遮光杆通过光电门测出角速度。',
        formulaNote: '保持物块质量和半径 r 不变，作 F–ω² 图线；若图线为过原点的直线，则 F 与 ω² 成正比。',
        steps: ['固定直杆、物块、力传感器和光电门', '使直杆匀速转动，记录遮光时间和拉力', '改变转速，测量多组 F 与 ω', '作 F–ω² 图像并分析']
      }
    ],
    'mechanical-energy': [
      {
        title: '方案一 · 单个物体', short: '单个物体',
        formula: 'mgh = ½mv²', formulaTex: 'mgh = \\frac{1}{2}mv^2',
        principle: '重物自由下落时，重力势能减少量等于动能增加量；用纸带测量下落高度和瞬时速度进行验证。',
        formulaNote: '因 m 可约去，不需要测质量；速度必须用“中间时刻速度等于平均速度”求，不能直接用自由落体公式。',
        steps: ['安装打点计时器，纸带连接重物', '先接通电源，再释放重物', '测量各点下落高度 h 和瞬时速度 v', '比较 mgh 与 ½mv²，或作 v²–h 图像']
      },
      {
        title: '方案二 · 系统', short: '系统',
        formula: '(m_A − m_B)gh = ½(m_A + m_B)v²', formulaTex: '(m_A - m_B)gh = \\frac{1}{2}(m_A + m_B)v^2',
        principle: 'A、B 两物体通过细绳连接，A 下降、B 上升；系统重力势能减少量转化为系统动能。',
        formulaNote: '用游标卡尺测遮光片宽度 d，用天平测 m_A、m_B，用刻度尺测高度差 h；由遮光时间求速度。',
        steps: ['测量遮光片宽度 d、两物体质量和高度差 h', '释放 A，使 B 向上运动并通过光电门', '记录遮光时间，求速度 v', '验证系统重力势能减少量与动能增加量']
      }
    ],
    'momentum': [
      {
        title: '方案一 · 气垫导轨', short: '气垫导轨',
        formula: 'm₁v₁ = m₁v₁′ + m₂v₂′', formulaTex: 'm_1v_1 = m_1v_1\\prime + m_2v_2\\prime',
        principle: '气垫导轨近似无摩擦；滑块通过光电门测速度，碰撞前后系统总动量应保持不变。',
        formulaNote: 'v=d/t；若碰撞前后总动能也相等，则为弹性碰撞。',
        steps: ['测滑块质量和遮光条宽度', '安装气垫导轨并接通气源', '给滑块 1 初速度，记录碰撞前后遮光时间', '计算碰撞前后总动量并比较']
      },
      {
        title: '方案二 · 斜槽小球', short: '斜槽小球',
        formula: 'm₁·OP = m₁·OM + m₂·ON', formulaTex: 'm_1\\cdot OP = m_1\\cdot OM + m_2\\cdot ON',
        principle: '小球从斜槽末端水平飞出后做平抛运动，飞行时间相同，水平位移与速度成正比，可用落点距离代替速度。',
        formulaNote: '入射球质量应大于被碰球，两球半径相同；斜槽末端必须水平，每次从同一高度由静止释放。',
        steps: ['测两球质量，安装斜槽并调整末端水平', '不放被碰球，重复释放入射球，确定平均落点 P', '放被碰球，重复碰撞，确定落点 M、N', '测量 OP、OM、ON，验证 m₁OP=m₁OM+m₂ON']
      }
    ],
    'simple-pendulum': [
      {
        title: '方案一 · 计算法', short: '计算法',
        formula: 'g = 4π²L/T²', formulaTex: 'g = \\frac{4\\pi^2L}{T^2}',
        principle: '测出摆长 L 和周期 T，由单摆周期公式 T=2π√(L/g) 计算重力加速度。',
        formulaNote: '摆长为悬点到球心的距离；周期应从最低点开始计时，测量多次全振动后取平均。',
        steps: ['用米尺测悬线长，用游标卡尺测球直径', '将摆球拉开小角度后释放', '从最低点开始计时，测 n 次全振动时间', '计算周期 T，代入 g=4π²L/T²']
      },
      {
        title: '方案二 · 图像法', short: '图像法',
        formula: 'T² = (4π²/g)L', formulaTex: 'T^2 = \\frac{4\\pi^2}{g}L',
        principle: '改变摆长，测出对应的周期，作 T²–L 图像；图线斜率 k=4π²/g，由此求 g。',
        formulaNote: '摆长测量误差不影响斜率，因此图像法可减小摆长测量误差；周期测量误差仍会影响结果。',
        steps: ['改变摆长，测量多组 L 和 T', '计算每组 T²', '作 T²–L 图像并求斜率 k', '由 g=4π²/k 求重力加速度']
      }
    ]
  };
  experiments.forEach(function (e) {
    if (schemesById[e.id]) e.schemes = schemesById[e.id];
    if (e.schemes && e.schemes.length) {
      e.formula = e.schemes[0].formula || e.formula;
      e.formulaTex = e.schemes[0].formulaTex || e.formulaTex;
      e.principle = e.schemes[0].principle || e.principle;
      e.formulaNote = e.schemes[0].formulaNote || e.formulaNote;
      e.steps = e.schemes[0].steps || e.steps;
    }
  });

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
