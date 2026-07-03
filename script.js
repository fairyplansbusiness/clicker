(() => {
  'use strict';

  /* ============================================================
     DATA
     ============================================================ */

  const STORAGE_KEY = 'bloomQuestSave_v1';

  const DIFFICULTY = {
    small:  { label: 'Small',  emoji: '🌱', sparkles: 6,  xp: 8,  minutes: 8 },
    medium: { label: 'Medium', emoji: '🌿', sparkles: 14, xp: 18, minutes: 30 },
    large:  { label: 'Big',    emoji: '🌳', sparkles: 26, xp: 34, minutes: 60 },
  };

  const GARDEN_STAGES = ['🌰', '🌱', '🌿', '🪴', '🌸', '🌳', '🌺', '🌴'];
  const LEVEL_TITLES = [
    'Tiny Seed', 'Tiny Sprout', 'Budding Buddy', 'Blooming Buddy', 'Petal Pal',
    'Garden Star', 'Meadow Hero', 'Bloom Champion', 'Sparkle Guardian', 'Legendary Green Thumb'
  ];

  const PETS = [
    // common
    { id: 'chick',    name: 'Chirpy',      emoji: '🐣', rarity: 'common' },
    { id: 'hamster',  name: 'Hammy',       emoji: '🐹', rarity: 'common' },
    { id: 'bunny',    name: 'Coco',        emoji: '🐰', rarity: 'common' },
    { id: 'mushroom', name: 'Shroomie',    emoji: '🍄', rarity: 'common' },
    { id: 'clover',   name: 'Lucky Leaf',  emoji: '🍀', rarity: 'common' },
    { id: 'bear',     name: 'Teddy',       emoji: '🧸', rarity: 'common' },
    { id: 'bee',      name: 'Buzzy',       emoji: '🐝', rarity: 'common' },
    { id: 'snail',    name: 'Shelly',      emoji: '🐌', rarity: 'common' },
    // rare
    { id: 'unicorn',  name: 'Glimmer',     emoji: '🦄', rarity: 'rare' },
    { id: 'koala',    name: 'Koa',         emoji: '🐨', rarity: 'rare' },
    { id: 'fox',      name: 'Foxtail',     emoji: '🦊', rarity: 'rare' },
    { id: 'panda',    name: 'Momo',        emoji: '🐼', rarity: 'rare' },
    { id: 'donut',    name: 'Sprinkles',   emoji: '🍩', rarity: 'rare' },
    { id: 'rainbow',  name: 'Skye',        emoji: '🌈', rarity: 'rare' },
    // epic
    { id: 'dragon',   name: 'Emberly',     emoji: '🐲', rarity: 'epic' },
    { id: 'fairy',    name: 'Petalwing',   emoji: '🧚', rarity: 'epic' },
    { id: 'butterfly',name: 'Flutter',     emoji: '🦋', rarity: 'epic' },
    { id: 'cake',     name: 'Frosting',    emoji: '🍰', rarity: 'epic' },
    // legendary
    { id: 'crown',    name: 'Majesty',     emoji: '👑', rarity: 'legendary' },
    { id: 'star',     name: 'Stardust',    emoji: '🌟', rarity: 'legendary' },
    { id: 'gem',      name: 'Crystal',     emoji: '💎', rarity: 'legendary' },
    { id: 'ribbon',   name: 'Bowbow',      emoji: '🎀', rarity: 'legendary' },
    { id: 'phoenix',  name: 'Solstice',    emoji: '🕊️', rarity: 'legendary' },
    { id: 'moon',     name: 'Luna',        emoji: '🌙', rarity: 'legendary' },
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
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      console.warn('Failed to load save, starting fresh.', e);
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

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

    gardenPlant: $('#garden-plant'),
    gardenPet: $('#garden-pet'),
    gardenClickArea: $('#garden-click-area'),

    focusIdle: $('#focus-idle'),
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

  /* ============================================================
     CONFETTI PARTICLE SYSTEM
     ============================================================ */

  const canvas = $('#confetti-canvas');
  const ctx2d = canvas.getContext('2d');
  let particles = [];
  let confettiRunning = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const CONFETTI_COLORS = ['#ff9ec4', '#d9c6ff', '#a8e6cf', '#b4e4ff', '#ffe08a', '#ff6fae'];

  function spawnConfetti(x, y, count = 24, colors = CONFETTI_COLORS) {
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
        shape: Math.random() > 0.5 ? 'circle' : 'square',
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(confettiLoop);
    }
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

  /* ============================================================
     RENDER
     ============================================================ */

  function renderAll() {
    renderStats();
    renderGarden();
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
    el.statTotalTasks.textContent = state.totalTasksCompleted;
    el.statBestStreak.textContent = state.bestStreak;
    el.statEggs.textContent = state.eggsHatched;
  }

  function renderGarden() {
    const stageIdx = Math.min(Math.floor((state.level - 1) / 1.4), GARDEN_STAGES.length - 1);
    el.gardenPlant.textContent = GARDEN_STAGES[stageIdx];
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
      li.className = 'task-card' + (task.done ? ' done' : '') + (state.focus && state.focus.taskId === task.id ? ' focused' : '');
      li.dataset.diff = task.difficulty;
      li.dataset.id = task.id;
      li.innerHTML = `
        <button class="task-check" data-action="toggle" aria-label="Complete quest">${task.done ? '✔' : ''}</button>
        <div class="task-body">
          <div class="task-text"></div>
          <div class="task-meta">
            <span class="task-diff-badge">${diff.emoji} ${diff.label}</span>
            <span>+${diff.sparkles}✨</span>
          </div>
        </div>
        <div class="task-actions">
          ${!task.done ? `<button class="task-focus-btn" data-action="focus" title="Start focus sprint">🍅</button>` : ''}
          <button class="task-del-btn" data-action="delete" title="Delete quest">🗑️</button>
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
      div.textContent = has ? pet.emoji : '❔';
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
    }
  }

  function renderCollectionModal() {
    el.collectionGrid.innerHTML = '';
    PETS.forEach((pet) => {
      const has = !!state.collection[pet.id];
      const div = document.createElement('div');
      div.className = 'collection-card' + (has ? '' : ' locked');
      div.innerHTML = `
        <div class="c-emoji">${has ? pet.emoji : '❔'}</div>
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

    saveState();
    renderStats();
    renderTasks();
    renderGarden();
    renderShop();

    playPop();
    if (cardNode) {
      const { x, y } = elCenter(cardNode);
      spawnConfetti(x, y, 26);
    }
    bouncePet();
  }

  function deleteTask(id, cardNode) {
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

  function bouncePlant() {
    el.gardenPlant.classList.remove('pop');
    void el.gardenPlant.offsetWidth;
    el.gardenPlant.classList.add('pop');
  }

  function bouncePet() {
    el.gardenPet.classList.remove('pop');
    void el.gardenPet.offsetWidth;
    el.gardenPet.classList.add('pop');
  }

  function handleGardenClick(e) {
    state.sparkles += 1;
    saveState();
    renderStats();
    renderShop();
    bouncePlant();
    playPop();
    const rect = el.gardenClickArea.getBoundingClientRect();
    spawnConfetti(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      8,
      ['#ffe08a', '#fff3d6']
    );
  }

  /* ============================================================
     FOCUS TIMER
     ============================================================ */

  function startFocus(minutes) {
    const firstIncomplete = [...state.tasks].sort((a,b)=>a.createdAt-b.createdAt).find((t) => !t.done);
    if (!firstIncomplete) {
      alert('Add a quest first, then start a focus sprint! 🌸');
      return;
    }
    state.focus = {
      taskId: firstIncomplete.id,
      minutes,
      endsAt: Date.now() + minutes * 60 * 1000,
    };
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
      }

      saveState();
      renderStats();
      renderCollectionPreview();
      renderShop();

      el.eggReveaRarity.textContent = pet.rarity;
      el.eggReveaRarity.className = 'egg-reveal-rarity ' + pet.rarity;
      el.eggRevealEmoji.textContent = pet.emoji;
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
    else if (action === 'focus') {
      const task = state.tasks.find((t) => t.id === id);
      if (task && !task.done) {
        state.focus = { taskId: id, minutes: 10, endsAt: Date.now() + 10 * 60 * 1000 };
        saveState();
        renderFocus();
        renderTasks();
        tickFocus();
        if (focusTimerInterval) clearInterval(focusTimerInterval);
        focusTimerInterval = setInterval(tickFocus, 1000);
      }
    }
  });

  el.gardenClickArea.addEventListener('click', handleGardenClick);

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
