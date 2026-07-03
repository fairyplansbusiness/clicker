(() => {
  'use strict';

  /* ============================================================
     DATA
     ============================================================ */

  const STORAGE_KEY = 'bloomQuestSave_v1'; // unchanged — keeps old saves compatible

  const DIFFICULTY = {
    small:  { label: 'Small',  emoji: '🌱', sparkles: 6,  xp: 8,  minutes: 8 },
    medium: { label: 'Medium', emoji: '🌿', sparkles: 14, xp: 18, minutes: 30 },
    large:  { label: 'Big',    emoji: '🌳', sparkles: 26, xp: 34, minutes: 60 },
  };

  const GARDEN_STAGES_COUNT = 8; // 0..7, drives plant SVG growth (see plantStageSVG)
  const LEVEL_TITLES = [
    'Tiny Seed', 'Tiny Sprout', 'Budding Buddy', 'Blooming Buddy', 'Petal Pal',
    'Garden Star', 'Meadow Hero', 'Bloom Champion', 'Sparkle Guardian', 'Legendary Green Thumb'
  ];

  const PETS = [
    // common
    { id: 'chick',    name: 'Chirpy',      rarity: 'common' },
    { id: 'hamster',  name: 'Hammy',       rarity: 'common' },
    { id: 'bunny',    name: 'Coco',        rarity: 'common' },
    { id: 'mushroom', name: 'Shroomie',    rarity: 'common' },
    { id: 'clover',   name: 'Lucky Leaf',  rarity: 'common' },
    { id: 'bear',     name: 'Teddy',       rarity: 'common' },
    { id: 'bee',      name: 'Buzzy',       rarity: 'common' },
    { id: 'snail',    name: 'Shelly',      rarity: 'common' },
    // rare
    { id: 'unicorn',  name: 'Glimmer',     rarity: 'rare' },
    { id: 'koala',    name: 'Koa',         rarity: 'rare' },
    { id: 'fox',      name: 'Foxtail',     rarity: 'rare' },
    { id: 'panda',    name: 'Momo',        rarity: 'rare' },
    { id: 'donut',    name: 'Sprinkles',   rarity: 'rare' },
    { id: 'rainbow',  name: 'Skye',        rarity: 'rare' },
    // epic
    { id: 'dragon',   name: 'Emberly',     rarity: 'epic' },
    { id: 'fairy',    name: 'Petalwing',   rarity: 'epic' },
    { id: 'butterfly',name: 'Flutter',     rarity: 'epic' },
    { id: 'cake',     name: 'Frosting',    rarity: 'epic' },
    // legendary
    { id: 'crown',    name: 'Majesty',     rarity: 'legendary' },
    { id: 'star',     name: 'Stardust',    rarity: 'legendary' },
    { id: 'gem',      name: 'Crystal',     rarity: 'legendary' },
    { id: 'ribbon',   name: 'Bowbow',      rarity: 'legendary' },
    { id: 'phoenix',  name: 'Solstice',    rarity: 'legendary' },
    { id: 'moon',     name: 'Luna',        rarity: 'legendary' },
  ];

  const RARITY_WEIGHTS = { common: 60, rare: 25, epic: 12, legendary: 3 };
  const RARITY_REFUND = { common: 8, rare: 15, epic: 25, legendary: 40 };
  const EGG_COST = 30;

  const TIPS = [
    'Tiny steps still count! 🐾',
    "Break it down — smaller quests = quicker wins!",
    "You're doing great, one quest at a time 💫",
    'Done is better than perfect 🌼',
    'Your garden believes in you!',
    'Rest is productive too, take a breath 🌸',
    'Progress, not perfection ✨',
    'Every sparkle adds up!',
    'Focus sprints make big quests feel tiny 🍅',
    'Celebrate the small wins — they matter!',
  ];

  // Small encouragement lines the featured garden pet occasionally says.
  const PET_SPEECH_LINES = [
    'You got this! 💗', 'Tiny steps count~', 'Proud of you!', 'One quest at a time 🌱',
    'Take a breath, then go!', 'You are doing great!', 'Let\'s grow together 🌿', 'Sparkles believe in you!',
  ];

  // Decorations unlock automatically as the player progresses. Structured as a
  // list so a future shop could add a `purchasable`/`owned` flag per entry.
  const DECORATIONS = [
    { id: 'flowerpatch',  icon: 'ic-flowerpatch',   cls: 'deco-flowerpatch',   unlock: (s) => s.level >= 2 },
    { id: 'fence',        icon: 'ic-fence',         cls: 'deco-fence',         unlock: (s) => s.level >= 3 },
    { id: 'sign',         icon: 'ic-sign',          cls: 'deco-sign',         unlock: (s) => s.level >= 4 },
    { id: 'wateringcan',  icon: 'ic-wateringcan',   cls: 'deco-wateringcan',   unlock: (s) => s.totalTasksCompleted >= 5 },
    { id: 'clouds',       icon: 'ic-cloud',         cls: 'deco-cloud-1',       unlock: (s) => s.level >= 5 },
    { id: 'clouds2',      icon: 'ic-cloud',         cls: 'deco-cloud-2',       unlock: (s) => s.level >= 5 },
    { id: 'butterfly',    icon: 'ic-butterfly',     cls: 'deco-butterfly',     unlock: (s) => s.totalTasksCompleted >= 5 },
    { id: 'fairylights',  icon: 'ic-fairylights',   cls: 'deco-fairylights',   unlock: (s) => s.level >= 6 },
    { id: 'rug',          icon: 'ic-rug',           cls: 'deco-rug',           unlock: (s) => s.eggsHatched >= 1 },
    { id: 'mushroomtable',icon: 'ic-mushroom-table',cls: 'deco-mushroomtable', unlock: (s) => s.level >= 7 },
    { id: 'petbed',       icon: 'ic-petbed',        cls: 'deco-petbed',        unlock: (s) => Object.keys(s.collection).filter((k) => s.collection[k]).length >= 3 },
  ];

  // Deterministic daily mood — same for everyone on the same calendar date.
  const MOODS = [
    { id: 'sunny',      label: '☀️ Sunny Sprout Day', message: 'Perfect weather for growing quests!' },
    { id: 'rainy',      label: '🌧️ Rainy Bloom Day', message: 'Cozy indoor quest energy today~' },
    { id: 'strawberry', label: '🍓 Strawberry Day',   message: 'Sweet little wins all day long!' },
    { id: 'moonlight',  label: '🌙 Moonlight Day',    message: 'Calm and quiet productivity vibes.' },
    { id: 'sleepy',     label: '☁️ Sleepy Cloud Day', message: 'Be gentle with yourself today, friend.' },
  ];

  const PET_PALETTE = ['#ffb8d9', '#c6b3ff', '#a8e6cf', '#ffe08a', '#7fc9f5', '#ffcf9e', '#f6a8c0', '#b9d98a'];
  const EAR_TYPES = ['round', 'pointy', 'long', 'wing', 'horn', 'none'];

  /* ============================================================
     STATE
     ============================================================ */

  function defaultState() {
    return {
      sparkles: 0,
      xp: 0,
      level: 1,
      streak: 0,
      bestStreak: 0,
      lastCompletionDate: null,
      totalTasksCompleted: 0,
      eggsHatched: 0,
      tasks: [],
      collection: {},
      muted: false,
      focus: null, // { taskId, endsAt, minutes }

      // --- fields added in the cozy-upgrade pass; all default-safe for old saves ---
      featuredPetId: null,          // which owned pet shows in the garden
      decorationsSeen: {},          // { [decorationId]: true } — avoids replaying unlock pop every render
      totalGardenTaps: 0,           // lifetime garden taps, drives the 20-tap combo bonus
      completions: { date: null, count: 0 }, // today's completed-task count, for daily bonuses
      dailyBonusesGiven: { date: null, first: false, streak3: false, perfectDay: false },
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // shallow-merge onto defaults so any newly-added field gets a safe default
      // while every field the player already had is preserved untouched.
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      console.warn('Failed to load save, starting fresh.', e);
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     DOM REFS
     ============================================================ */

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    sparkleCount: $('#sparkle-count'),
    levelCount: $('#level-count'),
    levelTitle: $('#level-title'),
    xpBarFill: $('#xp-bar-fill'),
    streakCount: $('#streak-count'),
    muteBtn: $('#mute-btn'),
    moodChip: $('#mood-chip'),

    gardenStage: $('#garden-stage'),
    gardenDecorations: $('#garden-decorations'),
    gardenPlant: $('#garden-plant'),
    gardenPet: $('#garden-pet'),
    petSpeech: $('#pet-speech'),
    gardenFxLayer: $('#garden-fx-layer'),
    gardenClickArea: $('#garden-click-area'),

    focusIdle: $('#focus-idle'),
    focusSelectionLabel: $('#focus-selection-label'),
    focusActive: $('#focus-active'),
    focusTaskLabel: $('#focus-task-label'),
    focusTime: $('#focus-time'),
    focusRingProgress: $('#focus-ring-progress'),
    focusCancelBtn: $('#focus-cancel-btn'),
    focusLenBtns: $$('.focus-len-btn'),

    addTaskForm: $('#add-task-form'),
    taskInput: $('#task-input'),
    diffBtns: $$('.diff-btn'),
    taskList: $('#task-list'),
    emptyState: $('#empty-state'),
    dailyTip: $('#daily-tip'),

    collectionCount: $('#collection-count'),
    collectionTotal: $('#collection-total'),
    petPreviewGrid: $('#pet-preview-grid'),
    openCollectionBtn: $('#open-collection-btn'),
    buyEggBtn: $('#buy-egg-btn'),

    statTotalTasks: $('#stat-total-tasks'),
    statBestStreak: $('#stat-best-streak'),
    statEggs: $('#stat-eggs'),

    levelupModal: $('#levelup-modal'),
    levelupLevelNum: $('#levelup-level-num'),
    levelupTitleText: $('#levelup-title-text'),

    eggModal: $('#egg-modal'),
    eggStageShaking: $('#egg-stage-shaking'),
    eggStageReveal: $('#egg-stage-reveal'),
    eggReveaRarity: $('#egg-reveal-rarity'),
    eggRevealEmoji: $('#egg-reveal-emoji'),
    eggRevealName: $('#egg-reveal-name'),
    eggRevealDup: $('#egg-reveal-dup'),
    eggDupRefund: $('#egg-dup-refund'),

    collectionModal: $('#collection-modal'),
    collectionGrid: $('#collection-grid'),

    focusCompleteModal: $('#focus-complete-modal'),
  };

  let selectedDifficulty = 'small';
  let focusTimerInterval = null;
  let selectedFocusTaskId = null; // transient UI selection; the active session lives in state.focus
  let petSpeechTimeout = null;

  /* ============================================================
     AUDIO (synthesized, no external files)
     ============================================================ */

  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  function tone(freq, startTime, duration, type = 'sine', gainPeak = 0.18) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playPop() {
    if (state.muted) return;
    const ctx = getAudioCtx();
    tone(660, ctx.currentTime, 0.12, 'sine', 0.15);
  }

  function playChime() {
    if (state.muted) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, now + i * 0.08, 0.35, 'triangle', 0.14));
  }

  function playSparkleSound() {
    if (state.muted) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66, 1567.98].forEach((f, i) => tone(f, now + i * 0.05, 0.25, 'sine', 0.1));
  }

  function playLevelUpSound() {
    if (state.muted) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, now + i * 0.1, 0.4, 'triangle', 0.16));
  }

  function playLuckySound() {
    if (state.muted) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [987.77, 1318.5, 1567.98, 2093].forEach((f, i) => tone(f, now + i * 0.06, 0.3, 'sine', 0.12));
  }

  /* ============================================================
     CONFETTI / PARTICLE SYSTEM
     ============================================================ */

  const canvas = $('#confetti-canvas');
  const ctx2d = canvas.getContext('2d');
  let particles = [];
  let confettiRunning = false;
  const MAX_PARTICLES = 260; // perf ceiling so rapid tapping can't flood mobile Safari

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const CONFETTI_COLORS = ['#ff9ec4', '#d9c6ff', '#a8e6cf', '#b4e4ff', '#ffe08a', '#ff6fae'];

  function spawnConfetti(x, y, count = 24, colors = CONFETTI_COLORS, opts = {}) {
    if (prefersReducedMotion) count = Math.min(count, 6);
    const room = MAX_PARTICLES - particles.length;
    if (room <= 0) return;
    count = Math.min(count, room);
    const shapePool = opts.shape ? [opts.shape] : ['circle', 'square'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        shape: shapePool[Math.floor(Math.random() * shapePool.length)],
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(confettiLoop);
    }
  }

  // Small 4-point-star burst used for garden taps — visually distinct from confetti.
  function spawnSparkleBurst(x, y, count = 6, colors = ['#ffcf5c', '#fff3d6']) {
    spawnConfetti(x, y, count, colors, { shape: 'star' });
  }

  function drawStar(ctx, size) {
    const r = size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.15, -r * 0.15, r * 0.85, -r * 0.15, r, 0);
    ctx.bezierCurveTo(r * 0.15, r * 0.15, r * 0.15, r * 0.15, 0, r);
    ctx.bezierCurveTo(-r * 0.15, r * 0.15, -r * 0.85, r * 0.15, -r, 0);
    ctx.bezierCurveTo(-r * 0.15, -r * 0.15, -r * 0.15, -r * 0.15, 0, -r);
    ctx.closePath();
  }

  function confettiLoop() {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += 0.12; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;
    });
    particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 40);

    particles.forEach((p) => {
      ctx2d.save();
      ctx2d.translate(p.x, p.y);
      ctx2d.rotate((p.rotation * Math.PI) / 180);
      ctx2d.globalAlpha = Math.max(p.life, 0);
      ctx2d.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx2d.beginPath();
        ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx2d.fill();
      } else if (p.shape === 'star') {
        drawStar(ctx2d, p.size * 1.4);
        ctx2d.fill();
      } else {
        ctx2d.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx2d.restore();
    });

    if (particles.length > 0) {
      requestAnimationFrame(confettiLoop);
    } else {
      confettiRunning = false;
    }
  }

  /* ============================================================
     FLOATING TEXT (+N sparkles, combo callouts, etc.)
     ============================================================ */

  function spawnFloatingText(x, y, text, opts = {}) {
    const node = document.createElement('div');
    node.className = 'float-text' + (opts.big ? ' big' : '') + (opts.lucky ? ' lucky' : '');
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.textContent = text;
    document.body.appendChild(node);
    node.addEventListener('animationend', () => node.remove());
    // Safety net in case animationend doesn't fire (e.g. reduced motion truncation)
    setTimeout(() => node.remove(), 1600);
  }

  /* ============================================================
     HAND-DRAWN SVG ART (plant growth stages + pet critters)
     Kept intentionally simple (circles/ellipses/short paths) for
     mobile performance — no filters, no per-frame SVG work.
     ============================================================ */

  function flowerFaceSVG(cx, cy, r = 7) {
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff6d9"/>
      <circle cx="${(cx - r * 0.35).toFixed(1)}" cy="${cy}" r="${(r * 0.14).toFixed(1)}" fill="#5c4a44"/>
      <circle cx="${(cx + r * 0.35).toFixed(1)}" cy="${cy}" r="${(r * 0.14).toFixed(1)}" fill="#5c4a44"/>
      <path d="M${(cx - r * 0.3).toFixed(1)} ${(cy + r * 0.3).toFixed(1)} q${(r * 0.3).toFixed(1)} ${(r * 0.22).toFixed(1)} ${(r * 0.6).toFixed(1)} 0" stroke="#5c4a44" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="${(cx - r * 0.6).toFixed(1)}" cy="${(cy + r * 0.15).toFixed(1)}" rx="${(r * 0.22).toFixed(1)}" ry="${(r * 0.14).toFixed(1)}" fill="#ffb8d9" opacity=".7"/>
      <ellipse cx="${(cx + r * 0.6).toFixed(1)}" cy="${(cy + r * 0.15).toFixed(1)}" rx="${(r * 0.22).toFixed(1)}" ry="${(r * 0.14).toFixed(1)}" fill="#ffb8d9" opacity=".7"/>
    `;
  }

  function flowerHeadSVG(cx, cy, r) {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const px = (cx + Math.cos(angle) * r).toFixed(1);
      const py = (cy + Math.sin(angle) * r).toFixed(1);
      const deg = ((angle * 180) / Math.PI).toFixed(0);
      petals += `<ellipse cx="${px}" cy="${py}" rx="${(r * 0.7).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" fill="#ff9ec4" transform="rotate(${deg} ${px} ${py})"/>`;
    }
    return petals + flowerFaceSVG(cx, cy, r * 0.55);
  }

  // stage: 0 (seed) .. 7 (grand blossoming tree)
  function plantStageSVG(stage) {
    stage = Math.max(0, Math.min(GARDEN_STAGES_COUNT - 1, stage));
    const stemHeights = [0, 20, 34, 44, 50, 54, 58, 60];
    const leafPairsByStage = [0, 1, 2, 2, 2, 1, 0, 0];
    const stemHeight = stemHeights[stage];
    const leafPairs = leafPairsByStage[stage];
    const hasBud = stage === 3;
    const hasFlower = stage === 4 || stage === 5;
    const isTree = stage >= 6;

    let parts = `<use href="#ic-pot" x="10" y="96" width="100" height="40"/>`;

    if (stemHeight > 0) {
      const stemTopY = 96 - stemHeight;
      parts += `<path d="M60 96 V${stemTopY}" stroke="#8fcf8a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    } else {
      parts += `<ellipse cx="60" cy="92" rx="14" ry="5" fill="#c98a5c" opacity=".4"/><circle cx="60" cy="88" r="4" fill="#8a6a4a"/>`;
    }

    for (let i = 0; i < leafPairs; i++) {
      const y = (96 - stemHeight * ((i + 1) / (leafPairs + 1))).toFixed(1);
      parts += `
        <ellipse cx="46" cy="${y}" rx="11" ry="6" fill="#a8e6cf" transform="rotate(-20 46 ${y})"/>
        <ellipse cx="74" cy="${y}" rx="11" ry="6" fill="#a8e6cf" transform="rotate(20 74 ${y})"/>
      `;
    }

    const topY = 96 - stemHeight;

    if (hasBud) {
      parts += `<circle cx="60" cy="${topY - 4}" r="8" fill="#ffb8d9"/>`;
    }
    if (hasFlower) {
      parts += flowerHeadSVG(60, topY - 6, stage === 5 ? 14 : 11);
    }
    if (isTree) {
      const canopyR = stage === 6 ? 30 : 36;
      const canopyCy = topY - canopyR * 0.6;
      parts += `<circle cx="60" cy="${canopyCy.toFixed(1)}" r="${canopyR}" fill="#bfe8b8"/>`;
      const blossomCount = stage === 6 ? 5 : 8;
      for (let i = 0; i < blossomCount; i++) {
        const angle = (i / blossomCount) * Math.PI * 2;
        const bx = (60 + Math.cos(angle) * canopyR * 0.65).toFixed(1);
        const by = (canopyCy + Math.sin(angle) * canopyR * 0.65).toFixed(1);
        parts += `<circle cx="${bx}" cy="${by}" r="4" fill="#ff9ec4"/>`;
      }
      parts += flowerFaceSVG(60, canopyCy, 9);
      if (stage === 7) {
        parts += `<use href="#ic-sparkle" x="18" y="10" width="16" height="16" fill="#ffe08a" style="color:#ffe08a"/><use href="#ic-sparkle" x="88" y="24" width="12" height="12" style="color:#ffb8d9"/>`;
      }
    }

    return `<svg viewBox="0 0 120 140" class="plant-art" aria-hidden="true">${parts}</svg>`;
  }

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function petVisual(pet) {
    const h = hashStr(pet.id);
    const bodyColor = PET_PALETTE[h % PET_PALETTE.length];
    const earType = EAR_TYPES[Math.floor(h / PET_PALETTE.length) % EAR_TYPES.length];
    return { bodyColor, earType };
  }

  // Generic default critter shown before the player owns any pets.
  const STARTER_PET = { id: 'starter-seedling', name: 'Sprout', rarity: 'common' };

  function petSvgMarkup(pet) {
    const { bodyColor, earType } = petVisual(pet);
    const rarity = pet.rarity;
    let ears = '';
    if (earType === 'round') ears = `<circle cx="24" cy="20" r="9" fill="${bodyColor}"/><circle cx="56" cy="20" r="9" fill="${bodyColor}"/>`;
    else if (earType === 'pointy') ears = `<path d="M20 24 L14 6 L30 18Z" fill="${bodyColor}"/><path d="M60 24 L66 6 L50 18Z" fill="${bodyColor}"/>`;
    else if (earType === 'long') ears = `<ellipse cx="20" cy="10" rx="6" ry="16" fill="${bodyColor}"/><ellipse cx="60" cy="10" rx="6" ry="16" fill="${bodyColor}"/>`;
    else if (earType === 'wing') ears = `<path d="M14 30q-14-4-10-20q14 0 16 14z" fill="${bodyColor}" opacity=".9"/><path d="M66 30q14-4 10-20q-14 0-16 14z" fill="${bodyColor}" opacity=".9"/>`;
    else if (earType === 'horn') ears = `<path d="M40 16 L34 2 L46 2Z" fill="${bodyColor}"/>`;

    const legendaryGlow = rarity === 'legendary' ? `<circle cx="40" cy="42" r="34" fill="#fff3d6" opacity=".5"/>` : '';
    const accessory = rarity === 'epic'
      ? `<use href="#ic-star4-mini" x="50" y="8" width="14" height="14" style="color:#ffcf5c"/>`
      : rarity === 'legendary'
      ? `<use href="#ic-sparkle" x="48" y="4" width="18" height="18" style="color:#ffcf5c"/>`
      : '';

    return `
    <svg viewBox="0 0 80 80" class="pet-art" aria-hidden="true">
      ${legendaryGlow}
      ${ears}
      <ellipse cx="40" cy="46" rx="26" ry="24" fill="${bodyColor}"/>
      <ellipse cx="40" cy="50" rx="16" ry="13" fill="#fff8ef" opacity=".85"/>
      <g class="pet-eyes">
        <circle cx="32" cy="42" r="3" fill="#4a3b42"/>
        <circle cx="48" cy="42" r="3" fill="#4a3b42"/>
      </g>
      <path d="M35 52q5 4 10 0" stroke="#4a3b42" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="25" cy="50" rx="4.5" ry="3" fill="#ffb8d9" opacity=".8"/>
      <ellipse cx="55" cy="50" rx="4.5" ry="3" fill="#ffb8d9" opacity=".8"/>
      ${accessory}
    </svg>`;
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function xpNeededForLevel(level) {
    return 40 + (level - 1) * 22;
  }

  function elCenter(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function weightedRandomPet() {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let chosenRarity = 'common';
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      if (roll < weight) { chosenRarity = rarity; break; }
      roll -= weight;
    }
    const pool = PETS.filter((p) => p.rarity === chosenRarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function ownedPets() {
    return PETS.filter((p) => !!state.collection[p.id]);
  }

  function getTodayMood() {
    const dateStr = todayStr();
    const h = hashStr(dateStr);
    return MOODS[h % MOODS.length];
  }

  /* ============================================================
     RENDER
     ============================================================ */

  function renderAll() {
    renderStats();
    renderMood();
    renderGardenScene();
    renderTasks();
    renderCollectionPreview();
    renderShop();
    renderFocus();
  }

  function renderStats() {
    el.sparkleCount.textContent = state.sparkles;
    el.levelCount.textContent = `Lv. ${state.level}`;
    el.levelTitle.textContent = LEVEL_TITLES[Math.min(state.level - 1, LEVEL_TITLES.length - 1)];
    const needed = xpNeededForLevel(state.level);
    const pct = Math.min(100, Math.round((state.xp / needed) * 100));
    el.xpBarFill.style.width = pct + '%';
    el.streakCount.textContent = state.streak;
    el.muteBtn.textContent = state.muted ? '🔇' : '🔊';
    el.muteBtn.setAttribute('aria-pressed', String(state.muted));
    el.statTotalTasks.textContent = state.totalTasksCompleted;
    el.statBestStreak.textContent = state.bestStreak;
    el.statEggs.textContent = state.eggsHatched;
  }

  function renderMood() {
    const mood = getTodayMood();
    el.moodChip.textContent = mood.label;
    el.moodChip.title = mood.message;
    el.gardenStage.classList.remove('mood-sunny', 'mood-rainy', 'mood-strawberry', 'mood-moonlight', 'mood-sleepy');
    el.gardenStage.classList.add('mood-' + mood.id);
  }

  function renderGardenScene() {
    // plant growth stage from level
    const stageIdx = Math.min(Math.floor((state.level - 1) / 1.4), GARDEN_STAGES_COUNT - 1);
    el.gardenPlant.innerHTML = plantStageSVG(stageIdx);

    // featured pet: newest catch if the player owns any, otherwise a default starter critter
    const featured = state.featuredPetId && state.collection[state.featuredPetId]
      ? PETS.find((p) => p.id === state.featuredPetId)
      : null;
    el.gardenPet.innerHTML = petSvgMarkup(featured || STARTER_PET);

    // decoration unlocks
    DECORATIONS.forEach((deco) => {
      let node = el.gardenDecorations.querySelector(`[data-deco="${deco.id}"]`);
      if (!node) {
        node = document.createElement('div');
        node.className = 'deco ' + deco.cls;
        node.dataset.deco = deco.id;
        node.innerHTML = `<svg viewBox="0 0 120 50" class="deco-art" aria-hidden="true" style="width:100%;height:100%"><use href="#${deco.icon}"></use></svg>`;
        el.gardenDecorations.appendChild(node);
      }
      const isUnlocked = deco.unlock(state);
      if (isUnlocked && !node.classList.contains('unlocked')) {
        node.classList.add('unlocked');
        if (!state.decorationsSeen[deco.id]) {
          state.decorationsSeen[deco.id] = true;
          if (!prefersReducedMotion) {
            node.classList.add('just-unlocked');
            node.addEventListener('animationend', () => node.classList.remove('just-unlocked'), { once: true });
          }
          saveState();
        }
      } else if (!isUnlocked) {
        node.classList.remove('unlocked');
      }
    });
  }

  function renderTasks() {
    el.taskList.innerHTML = '';
    if (state.tasks.length === 0) {
      el.emptyState.classList.remove('hidden');
    } else {
      el.emptyState.classList.add('hidden');
    }

    // incomplete first, then completed
    const sorted = [...state.tasks].sort((a, b) => {
      if (a.done === b.done) return b.createdAt - a.createdAt;
      return a.done ? 1 : -1;
    });

    sorted.forEach((task) => {
      const diff = DIFFICULTY[task.difficulty];
      const li = document.createElement('li');
      const isSelectedForFocus = selectedFocusTaskId === task.id && !task.done;
      li.className = 'task-card'
        + (task.done ? ' done' : '')
        + (state.focus && state.focus.taskId === task.id ? ' focused' : '');
      li.dataset.diff = task.difficulty;
      li.dataset.id = task.id;
      li.innerHTML = `
        <button class="task-check" data-action="toggle" aria-label="${task.done ? 'Mark quest not done' : 'Complete quest'}">${task.done ? '✔' : ''}</button>
        <div class="task-body">
          <div class="task-text"></div>
          <div class="task-meta">
            <span class="task-diff-badge">${diff.emoji} ${diff.label}</span>
            <span>+${diff.sparkles} <svg class="icon-sparkle" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-sparkle"></use></svg></span>
          </div>
        </div>
        <div class="task-actions">
          ${!task.done ? `<button class="task-focus-btn${isSelectedForFocus ? ' selected' : ''}" data-action="focus" aria-label="Select this quest for a focus sprint" title="Select for focus sprint">🍅</button>` : ''}
          <button class="task-del-btn" data-action="delete" aria-label="Delete quest" title="Delete quest">🗑️</button>
        </div>
      `;
      li.querySelector('.task-text').textContent = task.text;
      el.taskList.appendChild(li);
    });
  }

  function renderCollectionPreview() {
    const owned = Object.keys(state.collection).filter((k) => state.collection[k]);
    el.collectionCount.textContent = owned.length;
    el.collectionTotal.textContent = PETS.length;

    el.petPreviewGrid.innerHTML = '';
    PETS.slice(0, 12).forEach((pet) => {
      const has = !!state.collection[pet.id];
      const div = document.createElement('div');
      const glowClass = has && pet.rarity !== 'common' ? `${pet.rarity}-glow` : '';
      div.className = `pet-slot ${has ? '' : 'locked'} ${glowClass}`.trim();
      div.innerHTML = has ? petSvgMarkup(pet) : '';
      div.title = has ? pet.name : '???';
      el.petPreviewGrid.appendChild(div);
    });
  }

  function renderShop() {
    el.buyEggBtn.disabled = state.sparkles < EGG_COST;
  }

  function renderFocus() {
    if (state.focus) {
      el.focusIdle.classList.add('hidden');
      el.focusActive.classList.remove('hidden');
      const task = state.tasks.find((t) => t.id === state.focus.taskId);
      el.focusTaskLabel.textContent = `Focusing on: ${task ? task.text : '—'}`;
    } else {
      el.focusIdle.classList.remove('hidden');
      el.focusActive.classList.add('hidden');
      renderFocusSelection();
    }
  }

  function renderFocusSelection() {
    const task = selectedFocusTaskId ? state.tasks.find((t) => t.id === selectedFocusTaskId && !t.done) : null;
    if (!task) {
      selectedFocusTaskId = null;
      el.focusSelectionLabel.classList.remove('has-task');
      el.focusSelectionLabel.innerHTML = 'Tap 🍅 on a quest below to select it for a focus sprint~';
      el.focusLenBtns.forEach((b) => b.classList.add('needs-task'));
    } else {
      const diff = DIFFICULTY[task.difficulty];
      const bonusSparkles = Math.round(diff.sparkles * 1.5);
      el.focusSelectionLabel.classList.add('has-task');
      el.focusSelectionLabel.innerHTML = `Selected quest: <strong>${escapeHtml(task.text)}</strong>` +
        `<span class="focus-bonus-preview">Finish during sprint = x1.5 reward (~${bonusSparkles} sparkles)</span>`;
      el.focusLenBtns.forEach((b) => b.classList.remove('needs-task'));
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCollectionModal() {
    el.collectionGrid.innerHTML = '';
    PETS.forEach((pet) => {
      const has = !!state.collection[pet.id];
      const div = document.createElement('div');
      div.className = 'collection-card' + (has ? '' : ' locked');
      div.innerHTML = `
        <div class="c-emoji">${has ? petSvgMarkup(pet) : ''}</div>
        <div class="c-name">${has ? pet.name : '???'}</div>
        <div class="c-rarity">${pet.rarity}</div>
      `;
      el.collectionGrid.appendChild(div);
    });
  }

  function rotateTip() {
    el.dailyTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  }

  /* ============================================================
     PET SPEECH BUBBLE
     ============================================================ */

  function showPetSpeech(text) {
    if (petSpeechTimeout) clearTimeout(petSpeechTimeout);
    const line = text || PET_SPEECH_LINES[Math.floor(Math.random() * PET_SPEECH_LINES.length)];
    el.petSpeech.innerHTML = `
      <div class="pet-speech-inner">
        <svg class="bubble-bg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><use href="#ic-bubble"></use></svg>
        <span></span>
      </div>`;
    el.petSpeech.querySelector('span').textContent = line;
    el.petSpeech.classList.remove('hidden');
    petSpeechTimeout = setTimeout(() => el.petSpeech.classList.add('hidden'), 3200);
  }

  function scheduleAmbientPetSpeech() {
    const delay = 45000 + Math.random() * 45000; // every 45-90s
    setTimeout(() => {
      if (!document.hidden) showPetSpeech();
      scheduleAmbientPetSpeech();
    }, delay);
  }

  /* ============================================================
     STREAK LOGIC
     ============================================================ */

  function registerCompletionForStreak() {
    const today = todayStr();
    if (state.lastCompletionDate === today) {
      // already counted today
      return;
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (state.lastCompletionDate === yesterday) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    state.lastCompletionDate = today;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  }

  /* ============================================================
     DAILY TASK BONUSES (first quest / 3-in-a-row / perfect day)
     ============================================================ */

  function applyDailyCompletionBonuses(cardNode) {
    const today = todayStr();

    if (state.completions.date !== today) {
      state.completions = { date: today, count: 0 };
    }
    state.completions.count += 1;

    if (state.dailyBonusesGiven.date !== today) {
      state.dailyBonusesGiven = { date: today, first: false, streak3: false, perfectDay: false };
    }

    let bonus = 0;
    let label = '';

    if (!state.dailyBonusesGiven.first) {
      state.dailyBonusesGiven.first = true;
      bonus += 3;
      label = 'First quest today! +3';
    } else if (state.completions.count === 3 && !state.dailyBonusesGiven.streak3) {
      state.dailyBonusesGiven.streak3 = true;
      bonus += 8;
      label = '3 quests today! +8';
    }

    const allDone = state.tasks.length > 0 && state.tasks.every((t) => t.done);
    if (allDone && !state.dailyBonusesGiven.perfectDay) {
      state.dailyBonusesGiven.perfectDay = true;
      bonus += 15;
      label = label ? label + ' + Perfect Day! +15' : 'Perfect Day! +15';
    }

    if (bonus > 0) {
      state.sparkles += bonus;
      if (cardNode) {
        const { x, y } = elCenter(cardNode);
        setTimeout(() => spawnFloatingText(x, y - 26, label, { big: true }), 250);
      }
    }
  }

  /* ============================================================
     XP / LEVELING
     ============================================================ */

  function addXp(amount) {
    state.xp += amount;
    let leveledUp = false;
    let needed = xpNeededForLevel(state.level);
    while (state.xp >= needed) {
      state.xp -= needed;
      state.level += 1;
      leveledUp = true;
      needed = xpNeededForLevel(state.level);
    }
    if (leveledUp) {
      showLevelUpModal();
    }
  }

  function showLevelUpModal() {
    el.levelupLevelNum.textContent = state.level;
    el.levelupTitleText.textContent = LEVEL_TITLES[Math.min(state.level - 1, LEVEL_TITLES.length - 1)];
    openModal(el.levelupModal);
    playLevelUpSound();
    const { x, y } = elCenter(el.levelupModal);
    spawnConfetti(x, y, 60);
  }

  /* ============================================================
     TASK ACTIONS
     ============================================================ */

  function addTask(text, difficulty) {
    state.tasks.push({
      id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
      text,
      difficulty,
      done: false,
      createdAt: Date.now(),
    });
    saveState();
    renderTasks();
  }

  function toggleTask(id, cardNode) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.done) {
      // allow un-checking a misclick; reward was already claimed and stays claimed
      task.done = false;
      saveState();
      renderTasks();
      return;
    }

    task.done = true;

    if (task.rewarded) {
      // already paid out once (checked, unchecked, re-checked) — no double dipping
      saveState();
      renderTasks();
      return;
    }
    task.rewarded = true;
    state.totalTasksCompleted += 1;

    const diff = DIFFICULTY[task.difficulty];
    let sparkleGain = diff.sparkles;
    let xpGain = diff.xp;

    // focus bonus
    const wasFocused = state.focus && state.focus.taskId === id;
    if (wasFocused) {
      sparkleGain = Math.round(sparkleGain * 1.5);
      xpGain = Math.round(xpGain * 1.5);
      clearFocus();
    }

    registerCompletionForStreak();
    const streakMultiplier = Math.min(1 + state.streak * 0.04, 1.6);
    sparkleGain = Math.round(sparkleGain * streakMultiplier);

    state.sparkles += sparkleGain;
    addXp(xpGain);
    applyDailyCompletionBonuses(cardNode);

    saveState();
    renderStats();
    renderTasks();
    renderGardenScene();
    renderShop();

    playPop();
    const isBig = task.difficulty === 'large';
    if (cardNode) {
      const { x, y } = elCenter(cardNode);
      spawnConfetti(x, y, isBig ? 46 : 26);
      spawnFloatingText(x, y - 10, `+${sparkleGain} sparkles${wasFocused ? ' 🍅' : ''}`, { big: isBig });
      cardNode.classList.add(isBig ? 'reward-glow-big' : 'reward-glow');
      cardNode.addEventListener('animationend', () => cardNode.classList.remove('reward-glow', 'reward-glow-big'), { once: true });
    }
    bouncePet();
    if (Math.random() < 0.35) showPetSpeech();
  }

  function deleteTask(id, cardNode) {
    if (selectedFocusTaskId === id) selectedFocusTaskId = null;
    if (cardNode) {
      cardNode.classList.add('removing');
      setTimeout(() => {
        state.tasks = state.tasks.filter((t) => t.id !== id);
        if (state.focus && state.focus.taskId === id) clearFocus();
        saveState();
        renderTasks();
        renderFocus();
      }, 260);
    } else {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      saveState();
      renderTasks();
    }
  }

  /* ============================================================
     GARDEN CLICKER
     ============================================================ */

  function bouncePlant(originXPct) {
    el.gardenPlant.classList.remove('pop', 'wiggle');
    void el.gardenPlant.offsetWidth;
    el.gardenPlant.classList.add(originXPct !== undefined ? 'wiggle' : 'pop');
  }

  function bouncePet() {
    el.gardenPet.classList.remove('pop');
    void el.gardenPet.offsetWidth;
    el.gardenPet.classList.add('pop');
  }

  function handleGardenClick(e) {
    state.totalGardenTaps += 1;

    const rect = el.gardenClickArea.getBoundingClientRect();
    const tapX = (e && e.clientX) ? e.clientX : rect.left + rect.width / 2;
    const tapY = (e && e.clientY) ? e.clientY : rect.top + rect.height / 2;

    let gain = 1;
    let isLucky = false;
    if (Math.random() < 0.12) {
      isLucky = true;
      gain = 3 + Math.floor(Math.random() * 3); // 3-5
    }

    const isCombo = state.totalGardenTaps % 20 === 0;
    if (isCombo) gain += 5;

    state.sparkles += gain;
    saveState();
    renderStats();
    renderShop();

    bouncePlant(tapX);
    playPop();

    spawnSparkleBurst(tapX, tapY, prefersReducedMotion ? 2 : 6);

    if (isCombo) {
      spawnFloatingText(tapX, tapY - 20, `🔥 Combo x${state.totalGardenTaps}! +${gain}`, { big: true });
      spawnConfetti(tapX, tapY, prefersReducedMotion ? 6 : 20, ['#ffcf5c', '#ff9ec4', '#a8e6cf']);
      playSparkleSound();
    } else if (isLucky) {
      spawnFloatingText(tapX, tapY - 16, `Lucky sparkle! +${gain}`, { lucky: true });
      playLuckySound();
    } else {
      spawnFloatingText(tapX, tapY - 12, `+${gain}`);
    }
  }

  /* ============================================================
     FOCUS TIMER
     ============================================================ */

  function selectTaskForFocus(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.done) return;
    selectedFocusTaskId = id;
    renderFocusSelection();
    renderTasks();
  }

  function startFocus(minutes) {
    const task = selectedFocusTaskId ? state.tasks.find((t) => t.id === selectedFocusTaskId && !t.done) : null;
    if (!task) {
      el.focusSelectionLabel.classList.remove('shake');
      void el.focusSelectionLabel.offsetWidth;
      el.focusSelectionLabel.classList.add('shake');
      el.focusSelectionLabel.innerHTML = 'Pick a quest first! Tap 🍅 on one below~ 🌱';
      return;
    }
    state.focus = {
      taskId: task.id,
      minutes,
      endsAt: Date.now() + minutes * 60 * 1000,
    };
    selectedFocusTaskId = null;
    saveState();
    renderFocus();
    renderTasks();
    tickFocus();
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = setInterval(tickFocus, 1000);
  }

  function tickFocus() {
    if (!state.focus) return;
    const remainingMs = state.focus.endsAt - Date.now();
    if (remainingMs <= 0) {
      el.focusTime.textContent = '0:00';
      el.focusRingProgress.style.strokeDashoffset = 0;
      clearInterval(focusTimerInterval);
      focusTimerInterval = null;
      playChime();
      openModal(el.focusCompleteModal);
      const { x, y } = elCenter(el.focusActive);
      spawnConfetti(x, y, 30);
      return;
    }
    const totalMs = state.focus.minutes * 60 * 1000;
    const pct = remainingMs / totalMs;
    const circumference = 283; // 2 * PI * 45
    el.focusRingProgress.style.strokeDashoffset = String(circumference * (1 - pct));

    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    el.focusTime.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function clearFocus() {
    state.focus = null;
    if (focusTimerInterval) {
      clearInterval(focusTimerInterval);
      focusTimerInterval = null;
    }
    saveState();
    renderFocus();
    renderTasks();
  }

  /* ============================================================
     EGG / COLLECTION
     ============================================================ */

  function buyEgg() {
    if (state.sparkles < EGG_COST) return;
    state.sparkles -= EGG_COST;
    saveState();
    renderStats();
    renderShop();

    el.eggStageShaking.classList.remove('hidden');
    el.eggStageReveal.classList.add('hidden');
    el.eggRevealDup.classList.add('hidden');
    openModal(el.eggModal);

    setTimeout(() => {
      const pet = weightedRandomPet();
      const alreadyOwned = !!state.collection[pet.id];

      state.eggsHatched += 1;

      if (alreadyOwned) {
        const refund = RARITY_REFUND[pet.rarity];
        state.sparkles += refund;
        el.eggDupRefund.textContent = refund;
        el.eggRevealDup.classList.remove('hidden');
      } else {
        state.collection[pet.id] = true;
        state.featuredPetId = pet.id; // newest catch becomes the garden's featured pet
      }

      saveState();
      renderStats();
      renderCollectionPreview();
      renderGardenScene();
      renderShop();

      el.eggReveaRarity.textContent = pet.rarity;
      el.eggReveaRarity.className = 'egg-reveal-rarity ' + pet.rarity;
      el.eggRevealEmoji.innerHTML = petSvgMarkup(pet);
      el.eggRevealName.textContent = pet.name;

      el.eggStageShaking.classList.add('hidden');
      el.eggStageReveal.classList.remove('hidden');

      playSparkleSound();
      const { x, y } = elCenter(el.eggModal);
      const rarityColors = {
        common: ['#a8e6cf', '#dff6ea'],
        rare: ['#ffe08a', '#fff3d6'],
        epic: ['#d9c6ff', '#efe3ff'],
        legendary: CONFETTI_COLORS,
      };
      spawnConfetti(x, y, pet.rarity === 'legendary' ? 80 : 36, rarityColors[pet.rarity]);
    }, 1100);
  }

  /* ============================================================
     MODALS
     ============================================================ */

  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
  }
  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */

  el.addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = el.taskInput.value.trim();
    if (!text) return;
    addTask(text, selectedDifficulty);
    el.taskInput.value = '';
    el.taskInput.focus();
  });

  el.diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      el.diffBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.diff;
    });
  });

  el.taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = e.target.closest('.task-card');
    const id = card.dataset.id;
    const action = btn.dataset.action;
    if (action === 'toggle') toggleTask(id, card);
    else if (action === 'delete') deleteTask(id, card);
    else if (action === 'focus') selectTaskForFocus(id);
  });

  el.gardenClickArea.addEventListener('click', handleGardenClick);
  el.gardenPet.addEventListener('click', () => showPetSpeech());

  el.focusLenBtns.forEach((btn) => {
    btn.addEventListener('click', () => startFocus(parseInt(btn.dataset.min, 10)));
  });
  el.focusCancelBtn.addEventListener('click', clearFocus);

  el.openCollectionBtn.addEventListener('click', () => {
    renderCollectionModal();
    openModal(el.collectionModal);
  });

  el.buyEggBtn.addEventListener('click', buyEgg);

  el.muteBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    saveState();
    renderStats();
  });

  $$('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(document.getElementById(btn.dataset.close));
    });
  });

  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal-overlay').forEach((m) => closeModal(m));
    }
  });

  /* ============================================================
     INIT
     ============================================================ */

  function checkStreakBreak() {
    // if the user missed a day entirely, reset streak on load (but don't punish same-day)
    if (!state.lastCompletionDate) return;
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (state.lastCompletionDate !== today && state.lastCompletionDate !== yesterday) {
      state.streak = 0;
      saveState();
    }
  }

  function init() {
    checkStreakBreak();
    renderAll();
    rotateTip();
    setInterval(rotateTip, 12000);
    if (!prefersReducedMotion) scheduleAmbientPetSpeech();

    // resume an in-progress focus timer across reloads
    if (state.focus) {
      if (state.focus.endsAt <= Date.now()) {
        clearFocus();
      } else {
        tickFocus();
        focusTimerInterval = setInterval(tickFocus, 1000);
      }
    }
  }

  init();
})();
