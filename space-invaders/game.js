// ─── CANVAS SETUP ───
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SCALE = 3;
const W = 224;
const H = 256;
canvas.width = W * SCALE;
canvas.height = H * SCALE;
ctx.imageSmoothingEnabled = false;
ctx.scale(SCALE, SCALE);

// ─── COLORS (cellophane overlay zones) ───
const COLOR_RED = '#ff3333';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#33ff33';
const GREEN_DIM = '#1a8a1a';
const GREEN_DARK = '#0d440d';
const BG = '#000000';

function getZoneColor(y) {
  if (y < 32) return COLOR_RED;
  if (y < 184) return COLOR_WHITE;
  return COLOR_GREEN;
}

// ─── GAME STATE ───
const STATE = {
  INTRO: -1,
  TITLE: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  LEVEL_CLEAR: 3,
  DYING: 4,
  HIGH_SCORE_ENTRY: 5,
  HIGH_SCORES: 6,
  DEMO: 7,
  BOSS_INTRO: 8,
  BOSS_FIGHT: 9,
  VICTORY: 10
};

let state = STATE.INTRO;
let introPlayed = false;

// ─── INTRO ANIMATION STATE ───
const intro = {
  frame: 0,
  titleChars: 0,
  titleDone: false,
  scoreLineIndex: 0,
  scoreCharIndex: 0,
  scoresDone: false,
  phase: 0,
  alienX: W + 10,
  alienTargetX: 0,
  yVisible: true,
  yFlipped: true,
  alienCarriesY: false,
  phaseTimer: 0,
  playY: 220,
  playTextX: W/2,
  readyBlink: 0
};
let score = 0;
let lives = 3;
let level = 1;
let extraLifeAwarded = false;
const EXTRA_LIFE_SCORE = 1500;
let frameCount = 0;
let dyingTimer = 0;
let levelClearTimer = 0;

// Demo / attract mode
let demoMode = false;
let titleIdleTimer = 0;
const DEMO_IDLE_FRAMES = 600;
let demoShootTimer = 0;

// First interaction unlocks audio
let userHasInteracted = false;
function onFirstInteraction() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    initAudio();
  }
}
window.addEventListener('keydown', onFirstInteraction, { once: false });
window.addEventListener('mousedown', onFirstInteraction, { once: false });
window.addEventListener('touchstart', onFirstInteraction, { once: false });

// UFO deterministic scoring
let shotsFired = 0;
const UFO_SCORE_PATTERN = [100,50,50,100,150,100,100,50,300,100,100,100,50,150,100];
let ufoFromLeft = true;

// Wave Y offsets
const WAVE_Y_OFFSETS = [0, 8, 16, 24, 32, 40, 48, 48];

// Player
let player = { x: W / 2 - 6, y: H - 32, w: 13, h: 8, speed: 1.5 };
let bullet = { x: 0, y: 0, active: false, speed: 3 };

// Boss fight: multi-shot + velocita' aumentata
const BOSS_BULLET_SPEED = 5;
const BOSS_MAX_BULLETS = 3;
let bossFightBullets = []; // Array di proiettili player durante boss fight
let bossShootCooldown = 0;

// Invaders
let invaders = [];
let invaderDir = 1;
let invaderMoveTimer = 0;
let invaderMoveInterval = 45;
let invaderBullets = [];
let invaderAnimFrame = 0;
let moveSound = 0;

// UFO
let ufo = { x: -16, y: 18, active: false, speed: 0.5, timer: 0 };

// Shields
let shields = [];
const shieldData = [
  '  000000  ',
  ' 00000000 ',
  '0000000000',
  '0000000000',
  '0000000000',
  '000    000'
];

// Particles
let particles = [];
let explosions = [];

// Boss intro timer
let bossIntroTimer = 0;

// ─── HIGH SCORES ───
let highScores = [
  { name: 'AAA', score: 0 },
  { name: 'BBB', score: 0 },
  { name: 'CCC', score: 0 }
];

let hsEntryName = '';
let hsCursorBlink = 0;

const HS_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
let hsEntryPos = 0;
let hsEntryChars = [0, 0, 0];
let hsEntryConfirmed = 0;

function loadHighScores() {
  try {
    const saved = localStorage.getItem('spaceInvadersHighScores');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        highScores = parsed;
      }
    }
  } catch (e) {}
}

function saveHighScores() {
  try {
    localStorage.setItem('spaceInvadersHighScores', JSON.stringify(highScores));
  } catch (e) {}
}

function isHighScore(s) {
  if (s <= 0) return false;
  if (highScores.length < 3) return true;
  return s > highScores[highScores.length - 1].score;
}

function addHighScore(name, s) {
  name = name.padEnd(3, ' ').substring(0, 3).toUpperCase();
  highScores.push({ name: name, score: s });
  highScores.sort(function(a, b) { return b.score - a.score; });
  highScores = highScores.slice(0, 3);
  saveHighScores();
}

function getTopHighScore() {
  if (highScores.length === 0) return 0;
  return highScores[0].score;
}

loadHighScores();

// ─── INPUT ───
const keys = {};
window.addEventListener('keydown', function(e) {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    e.preventDefault();
  }

  if (state === STATE.HIGH_SCORE_ENTRY) {
    e.preventDefault();
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      hsEntryChars[hsEntryPos] = (hsEntryChars[hsEntryPos] - 1 + HS_CHARS.length) % HS_CHARS.length;
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      hsEntryChars[hsEntryPos] = (hsEntryChars[hsEntryPos] + 1) % HS_CHARS.length;
    } else if (e.code === 'Space' || e.code === 'Enter') {
      hsEntryConfirmed++;
      if (hsEntryConfirmed >= 3) {
        hsEntryName = HS_CHARS[hsEntryChars[0]] + HS_CHARS[hsEntryChars[1]] + HS_CHARS[hsEntryChars[2]];
        addHighScore(hsEntryName, score);
        state = STATE.HIGH_SCORES;
        keys['Enter'] = false;
        keys['Space'] = false;
      } else {
        hsEntryPos = hsEntryConfirmed;
      }
    } else if (e.code === 'Backspace' && hsEntryConfirmed > 0) {
      hsEntryConfirmed--;
      hsEntryPos = hsEntryConfirmed;
    } else if (e.key.length === 1 && /[A-Za-z0-9]/.test(e.key)) {
      const idx = HS_CHARS.indexOf(e.key.toUpperCase());
      if (idx >= 0) {
        hsEntryChars[hsEntryPos] = idx;
        hsEntryConfirmed++;
        if (hsEntryConfirmed >= 3) {
          hsEntryName = HS_CHARS[hsEntryChars[0]] + HS_CHARS[hsEntryChars[1]] + HS_CHARS[hsEntryChars[2]];
          addHighScore(hsEntryName, score);
          state = STATE.HIGH_SCORES;
          keys['Enter'] = false;
          keys['Space'] = false;
        } else {
          hsEntryPos = hsEntryConfirmed;
        }
      }
    }
  }
});
window.addEventListener('keyup', function(e) { keys[e.code] = false; });

// Mobile
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnFire = document.getElementById('btnFire');

let hsLeftRepeat = null;
let hsRightRepeat = null;

function hsMobileScroll(dir) {
  if (state === STATE.HIGH_SCORE_ENTRY) {
    hsEntryChars[hsEntryPos] = (hsEntryChars[hsEntryPos] + dir + HS_CHARS.length) % HS_CHARS.length;
  }
}

btnLeft.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (state === STATE.HIGH_SCORE_ENTRY) {
    hsMobileScroll(-1);
    hsLeftRepeat = setInterval(function() { hsMobileScroll(-1); }, 150);
  } else {
    keys['ArrowLeft'] = true;
  }
});
btnLeft.addEventListener('touchend', function(e) {
  e.preventDefault();
  keys['ArrowLeft'] = false;
  if (hsLeftRepeat) { clearInterval(hsLeftRepeat); hsLeftRepeat = null; }
});
btnRight.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (state === STATE.HIGH_SCORE_ENTRY) {
    hsMobileScroll(1);
    hsRightRepeat = setInterval(function() { hsMobileScroll(1); }, 150);
  } else {
    keys['ArrowRight'] = true;
  }
});
btnRight.addEventListener('touchend', function(e) {
  e.preventDefault();
  keys['ArrowRight'] = false;
  if (hsRightRepeat) { clearInterval(hsRightRepeat); hsRightRepeat = null; }
});
btnFire.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (state === STATE.HIGH_SCORE_ENTRY) {
    hsEntryConfirmed++;
    if (hsEntryConfirmed >= 3) {
      hsEntryName = HS_CHARS[hsEntryChars[0]] + HS_CHARS[hsEntryChars[1]] + HS_CHARS[hsEntryChars[2]];
      addHighScore(hsEntryName, score);
      state = STATE.HIGH_SCORES;
      keys['Enter'] = false;
      keys['Space'] = false;
    } else {
      hsEntryPos = hsEntryConfirmed;
    }
  } else {
    keys['Space'] = true;
    if (state === STATE.TITLE || state === STATE.GAME_OVER || state === STATE.HIGH_SCORES || state === STATE.INTRO) {
      keys['Enter'] = true;
    }
  }
});
btnFire.addEventListener('touchend', function(e) {
  e.preventDefault();
  keys['Space'] = false;
  keys['Enter'] = false;
});

// ─── INIT FUNCTIONS ───
function initShields() {
  shields = [];
  const positions = [32, 77, 122, 167];
  positions.forEach(function(sx) {
    for (let r = 0; r < shieldData.length; r++) {
      for (let c = 0; c < shieldData[r].length; c++) {
        if (shieldData[r][c] === '0') {
          shields.push({ x: sx + c * 2, y: H - 48 + r * 2, w: 2, h: 2, alive: true });
        }
      }
    }
  });
}

function initInvaders() {
  invaders = [];
  const waveIndex = Math.min(level - 1, WAVE_Y_OFFSETS.length - 1);
  const waveOffset = WAVE_Y_OFFSETS[waveIndex];
  const BASE_Y = 48;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 11; col++) {
      let type, points;
      if (row === 0) { type = 2; points = 30; }
      else if (row < 3) { type = 3; points = 20; }
      else { type = 1; points = 10; }

      invaders.push({
        x: 26 + col * 16,
        y: BASE_Y + row * 16 + waveOffset,
        type: type,
        points: points,
        alive: true
      });
    }
  }
  invaderDir = 1;
  invaderMoveInterval = Math.max(8, 45 - (level - 1) * 5);
  invaderMoveTimer = 0;
  invaderAnimFrame = 0;
  invaderBullets = [];
  moveSound = 0;
}

function initGame() {
  score = 0;
  lives = 3;
  level = 1;
  extraLifeAwarded = false;
  shotsFired = 0;
  ufoFromLeft = true;
  demoMode = false;
  boss = null;
  bossBullets = [];
  bossFightBullets = [];
  bossShootCooldown = 0;
  player.x = W / 2 - 6;
  bullet.active = false;
  particles = [];
  explosions = [];
  ufo.active = false;
  ufo.timer = 0;
  initInvaders();
  initShields();
  state = STATE.PLAYING;
}

function initDemo() {
  score = 0;
  lives = 1;
  level = 1;
  shotsFired = 0;
  ufoFromLeft = true;
  demoMode = true;
  demoShootTimer = 0;
  player.x = W / 2 - 6;
  bullet.active = false;
  particles = [];
  explosions = [];
  ufo.active = false;
  ufo.timer = 0;
  boss = null;
  bossBullets = [];
  bossFightBullets = [];
  bossShootCooldown = 0;
  initInvaders();
  initShields();
  state = STATE.DEMO;
}

function startLevel() {
  player.x = W / 2 - 6;
  bullet.active = false;
  particles = [];
  explosions = [];
  ufo.active = false;
  ufo.timer = 0;
  boss = null;
  bossBullets = [];
  bossFightBullets = [];
  bossShootCooldown = 0;
  initInvaders();
  initShields();
  state = STATE.PLAYING;
}

// ─── TRIGGER BOSS ───
function triggerBossIfNeeded() {
  const bossType = getBossType(level);
  if (bossType && !demoMode) {
    initBoss(bossType);
    bossIntroTimer = 0;
    state = STATE.BOSS_INTRO;
    playBossIntro();
    // Clear remaining invader stuff
    invaders = [];
    invaderBullets = [];
    ufo.active = false;
    return true;
  }
  return false;
}

// ─── UPDATE ───
function checkExtraLife() {
  if (!extraLifeAwarded && !demoMode && score >= EXTRA_LIFE_SCORE) {
    extraLifeAwarded = true;
    lives++;
    // Suono vita extra
    if (audioStarted) {
      try {
        shootSynth.triggerAttackRelease('C5', '0.1');
        setTimeout(function() { shootSynth.triggerAttackRelease('E5', '0.1'); }, 100);
        setTimeout(function() { shootSynth.triggerAttackRelease('G5', '0.15'); }, 200);
      } catch(e) {}
    }
  }
}

function update() {
  frameCount++;
  checkExtraLife();

  if (state === STATE.INTRO) {
    intro.frame++;
    updateIntro();
    if (keys['Enter'] || keys['Space'] || keys['Escape']) {
      state = STATE.TITLE;
      introPlayed = true;
      titleIdleTimer = 0;
      keys['Enter'] = false;
      keys['Space'] = false;
      keys['Escape'] = false;
    }
    return;
  }

  if (state === STATE.TITLE) {
    titleIdleTimer++;
    if (keys['Enter'] || keys['Space']) {
      initAudio();
      initGame();
      keys['Enter'] = false;
      keys['Space'] = false;
      titleIdleTimer = 0;
    } else if (keys['KeyH']) {
      state = STATE.HIGH_SCORES;
      keys['KeyH'] = false;
      titleIdleTimer = 0;
    } else if (titleIdleTimer >= DEMO_IDLE_FRAMES) {
      titleIdleTimer = 0;
      initDemo();
    }
    return;
  }

  if (state === STATE.DEMO) {
    if (keys['Enter'] || keys['Space'] || keys['Escape'] ||
        keys['ArrowLeft'] || keys['ArrowRight']) {
      state = STATE.TITLE;
      titleIdleTimer = 0;
      keys['Enter'] = false;
      keys['Space'] = false;
      keys['Escape'] = false;
      keys['ArrowLeft'] = false;
      keys['ArrowRight'] = false;
      return;
    }
    updateDemo();
    return;
  }

  if (state === STATE.HIGH_SCORES) {
    if (keys['Enter'] || keys['Space'] || keys['Escape']) {
      state = STATE.TITLE;
      titleIdleTimer = 0;
      keys['Enter'] = false;
      keys['Space'] = false;
      keys['Escape'] = false;
    }
    return;
  }

  if (state === STATE.HIGH_SCORE_ENTRY) {
    return;
  }

  if (state === STATE.GAME_OVER) {
    if (keys['Enter'] || keys['Space']) {
      state = STATE.TITLE;
      titleIdleTimer = 0;
      keys['Enter'] = false;
      keys['Space'] = false;
    }
    return;
  }

  if (state === STATE.VICTORY) {
    updateVictory();
    return;
  }

  if (state === STATE.DYING) {
    if (demoMode && (keys['Enter'] || keys['Space'] || keys['Escape'])) {
      state = STATE.TITLE;
      titleIdleTimer = 0;
      demoMode = false;
      stopBossMusic();
      keys['Enter'] = false;
      keys['Space'] = false;
      keys['Escape'] = false;
      return;
    }
    dyingTimer--;
    if (dyingTimer <= 0) {
      if (demoMode) {
        state = STATE.TITLE;
        titleIdleTimer = 0;
        demoMode = false;
      } else if (lives <= 0) {
        stopBossMusic();
        if (isHighScore(score)) {
          hsEntryName = '';
          hsEntryPos = 0;
          hsEntryChars = [0, 0, 0];
          hsEntryConfirmed = 0;
          state = STATE.HIGH_SCORE_ENTRY;
        } else {
          state = STATE.GAME_OVER;
        }
      } else {
        player.x = W / 2 - 6;
        bullet.active = false;
        bossFightBullets = [];
        bossShootCooldown = 0;
        // Return to boss fight if boss is still alive
        if (boss && boss.alive) {
          state = STATE.BOSS_FIGHT;
        } else {
          state = STATE.PLAYING;
        }
      }
    }
    updateParticles();
    return;
  }

  if (state === STATE.LEVEL_CLEAR) {
    levelClearTimer--;
    if (levelClearTimer <= 0) {
      level++;
      // Check if next level has a boss
      if (!triggerBossIfNeeded()) {
        startLevel();
      }
    }
    return;
  }

  // ─── BOSS INTRO STATE ───
  if (state === STATE.BOSS_INTRO) {
    bossIntroTimer++;
    const introDone = updateBossIntro();
    if (introDone) {
      state = STATE.BOSS_FIGHT;
      startBossMusic(boss.type);
    }
    return;
  }

  // ─── BOSS FIGHT STATE ───
  if (state === STATE.BOSS_FIGHT) {
    updateBossFight();
    return;
  }

  // ─── PLAYING STATE ───

  // Player movement
  if (keys['ArrowLeft'] && player.x > 2) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < W - player.w - 2) player.x += player.speed;

  // Shoot
  if (keys['Space'] && !bullet.active) {
    bullet.x = player.x + 6;
    bullet.y = player.y - 2;
    bullet.active = true;
    shotsFired++;
    playShoot();
    keys['Space'] = false;
  }

  // Bullet movement
  if (bullet.active) {
    bullet.y -= bullet.speed;
    if (bullet.y < 8) bullet.active = false;

    // Hit invader
    for (let inv of invaders) {
      if (!inv.alive) continue;
      const sz = getInvaderSize(inv.type);
      if (bullet.x >= inv.x && bullet.x <= inv.x + sz.w &&
          bullet.y >= inv.y && bullet.y <= inv.y + sz.h) {
        inv.alive = false;
        bullet.active = false;
        score += inv.points;
        playExplosion();
        explosions.push({ x: inv.x, y: inv.y, timer: 12 });

        const alive = invaders.filter(function(i) { return i.alive; }).length;
        if (alive > 0) {
          invaderMoveInterval = Math.max(2, Math.floor(3 + alive * 0.7 - (level - 1) * 0.3));
        }

        if (alive === 0) {
          // Check if this level triggers a boss
          const bossType = getBossType(level);
          if (bossType && !demoMode) {
            // Transition to boss after brief pause
            state = STATE.LEVEL_CLEAR;
            levelClearTimer = 60;
          } else {
            state = STATE.LEVEL_CLEAR;
            levelClearTimer = 90;
          }
        }
        break;
      }
    }

    // Hit shield
    for (let s of shields) {
      if (!s.alive) continue;
      if (bullet.x >= s.x && bullet.x <= s.x + s.w &&
          bullet.y >= s.y && bullet.y <= s.y + s.h) {
        s.alive = false;
        bullet.active = false;
        break;
      }
    }

    // Hit UFO
    if (ufo.active &&
        bullet.x >= ufo.x && bullet.x <= ufo.x + 16 &&
        bullet.y >= ufo.y && bullet.y <= ufo.y + 7) {
      ufo.active = false;
      bullet.active = false;
      const ufoScoreIndex = (shotsFired - 1) % UFO_SCORE_PATTERN.length;
      const ufoPoints = UFO_SCORE_PATTERN[ufoScoreIndex];
      score += ufoPoints;
      playExplosion();
      explosions.push({ x: ufo.x, y: ufo.y, timer: 20, text: ufoPoints.toString() });
    }
  }

  // Invader movement
  invaderMoveTimer++;
  if (invaderMoveTimer >= invaderMoveInterval) {
    invaderMoveTimer = 0;
    invaderAnimFrame = 1 - invaderAnimFrame;

    let hitEdge = false;
    for (let inv of invaders) {
      if (!inv.alive) continue;
      const sz = getInvaderSize(inv.type);
      if ((invaderDir > 0 && inv.x + sz.w >= W - 4) ||
          (invaderDir < 0 && inv.x <= 4)) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      invaderDir *= -1;
      for (let inv of invaders) {
        if (inv.alive) inv.y += 4;
      }
    } else {
      for (let inv of invaders) {
        if (inv.alive) inv.x += invaderDir * 2;
      }
    }

    playInvaderMove(moveSound);
    moveSound = (moveSound + 1) % 4;

    // Invader shooting
    const aliveInvaders = invaders.filter(function(i) { return i.alive; });
    if (aliveInvaders.length > 0 && invaderBullets.length < 3 && Math.random() < 0.3) {
      const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
      const sz = getInvaderSize(shooter.type);
      invaderBullets.push({ x: shooter.x + sz.w / 2, y: shooter.y + sz.h, speed: 1 + level * 0.2 });
    }

    // Check if invaders reached player zone
    for (let inv of invaders) {
      if (inv.alive && inv.y + 8 >= player.y) {
        lives = 0;
        state = STATE.DYING;
        dyingTimer = 60;
        playPlayerDie();
        spawnPlayerExplosion();
        return;
      }
    }

    // Invaders erode shields on contact
    for (let inv of invaders) {
      if (!inv.alive) continue;
      const sz = getInvaderSize(inv.type);
      for (let s of shields) {
        if (!s.alive) continue;
        if (inv.x < s.x + s.w && inv.x + sz.w > s.x &&
            inv.y < s.y + s.h && inv.y + sz.h > s.y) {
          s.alive = false;
        }
      }
    }
  }

  // Invader bullets
  for (let i = invaderBullets.length - 1; i >= 0; i--) {
    const b = invaderBullets[i];
    b.y += b.speed;

    if (b.y > H) {
      invaderBullets.splice(i, 1);
      continue;
    }

    // Hit player
    if (b.x >= player.x && b.x <= player.x + player.w &&
        b.y >= player.y && b.y <= player.y + player.h) {
      invaderBullets.splice(i, 1);
      lives--;
      state = STATE.DYING;
      dyingTimer = 60;
      playPlayerDie();
      spawnPlayerExplosion();
      continue;
    }

    // Hit shield
    for (let s of shields) {
      if (!s.alive) continue;
      if (b.x >= s.x && b.x <= s.x + s.w &&
          b.y >= s.y && b.y <= s.y + s.h) {
        s.alive = false;
        invaderBullets.splice(i, 1);
        break;
      }
    }
  }

  // UFO
  if (!ufo.active) {
    ufo.timer++;
    if (ufo.timer >= 1536) {
      ufo.active = true;
      ufo.timer = 0;
      if (ufoFromLeft) {
        ufo.x = -16;
        ufo.speed = 0.5;
      } else {
        ufo.x = W + 16;
        ufo.speed = -0.5;
      }
      ufoFromLeft = !ufoFromLeft;
    }
  } else {
    ufo.x += ufo.speed;
    if (frameCount % 12 === 0) playUfo();
    if (ufo.x > W + 16 || ufo.x < -16) ufo.active = false;
  }

  // Particles & Explosions
  updateParticles();

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) explosions.splice(i, 1);
  }
}

// ─── BOSS FIGHT UPDATE ───
function updateBossFight() {
  // Player movement
  if (keys['ArrowLeft'] && player.x > 2) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < W - player.w - 2) player.x += player.speed;

  // Shoot - multi-shot: fino a BOSS_MAX_BULLETS proiettili simultanei
  if (bossShootCooldown > 0) bossShootCooldown--;
  if (keys['Space'] && bossFightBullets.length < BOSS_MAX_BULLETS && bossShootCooldown <= 0) {
    bossFightBullets.push({
      x: player.x + 6,
      y: player.y - 2,
      active: true
    });
    shotsFired++;
    playShoot();
    bossShootCooldown = 6; // breve cooldown tra un colpo e l'altro
    keys['Space'] = false;
  }

  // Bullet movement + boss collision (multi-shot)
  for (let i = bossFightBullets.length - 1; i >= 0; i--) {
    const b = bossFightBullets[i];
    b.y -= BOSS_BULLET_SPEED;
    if (b.y < 8) {
      bossFightBullets.splice(i, 1);
      continue;
    }

    // Check boss hit - temporaneamente imposta bullet globale per compatibilita'
    const oldBullet = { x: bullet.x, y: bullet.y, active: bullet.active };
    bullet.x = b.x;
    bullet.y = b.y;
    bullet.active = true;
    checkBulletBossCollision();
    if (!bullet.active) {
      // Il proiettile ha colpito il boss
      bossFightBullets.splice(i, 1);
      bullet.x = oldBullet.x;
      bullet.y = oldBullet.y;
      bullet.active = oldBullet.active;
      continue;
    }
    bullet.x = oldBullet.x;
    bullet.y = oldBullet.y;
    bullet.active = oldBullet.active;

    // Hit shield
    let hitShield = false;
    for (let s of shields) {
      if (!s.alive) continue;
      if (b.x >= s.x && b.x <= s.x + s.w &&
          b.y >= s.y && b.y <= s.y + s.h) {
        s.alive = false;
        bossFightBullets.splice(i, 1);
        hitShield = true;
        break;
      }
    }
  }

  // Update boss
  updateBoss();

  // Particles & Explosions
  updateParticles();

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) explosions.splice(i, 1);
  }
}

function spawnPlayerExplosion() {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 30 + Math.random() * 30
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ─── DEMO AI ───
function updateDemo() {
  frameCount++;

  const aliveInvaders = invaders.filter(function(i) { return i.alive; });

  if (aliveInvaders.length === 0) {
    state = STATE.TITLE;
    titleIdleTimer = 0;
    return;
  }

  let lowestInv = aliveInvaders[0];
  for (let i = 1; i < aliveInvaders.length; i++) {
    if (aliveInvaders[i].y > lowestInv.y ||
        (aliveInvaders[i].y === lowestInv.y &&
         Math.abs(aliveInvaders[i].x - player.x) < Math.abs(lowestInv.x - player.x))) {
      lowestInv = aliveInvaders[i];
    }
  }

  const sz = getInvaderSize(lowestInv.type);
  const targetX = lowestInv.x + sz.w / 2 - player.w / 2;
  const diff = targetX - player.x;

  if (Math.abs(diff) > 2) {
    player.x += diff > 0 ? player.speed : -player.speed;
  }

  if (player.x < 2) player.x = 2;
  if (player.x > W - player.w - 2) player.x = W - player.w - 2;

  demoShootTimer++;
  if (!bullet.active && demoShootTimer > 20 + Math.random() * 30) {
    bullet.x = player.x + 6;
    bullet.y = player.y - 2;
    bullet.active = true;
    shotsFired++;
    playShoot();
    demoShootTimer = 0;
  }

  // Bullet movement
  if (bullet.active) {
    bullet.y -= bullet.speed;
    if (bullet.y < 8) bullet.active = false;

    for (let inv of invaders) {
      if (!inv.alive) continue;
      const isz = getInvaderSize(inv.type);
      if (bullet.x >= inv.x && bullet.x <= inv.x + isz.w &&
          bullet.y >= inv.y && bullet.y <= inv.y + isz.h) {
        inv.alive = false;
        bullet.active = false;
        score += inv.points;
        playExplosion();
        explosions.push({ x: inv.x, y: inv.y, timer: 12 });

        const alive = invaders.filter(function(i) { return i.alive; }).length;
        if (alive > 0) {
          invaderMoveInterval = Math.max(2, Math.floor(3 + alive * 0.7));
        }
        break;
      }
    }

    for (let s of shields) {
      if (!s.alive) continue;
      if (bullet.x >= s.x && bullet.x <= s.x + s.w &&
          bullet.y >= s.y && bullet.y <= s.y + s.h) {
        s.alive = false;
        bullet.active = false;
        break;
      }
    }

    if (ufo.active &&
        bullet.x >= ufo.x && bullet.x <= ufo.x + 16 &&
        bullet.y >= ufo.y && bullet.y <= ufo.y + 7) {
      ufo.active = false;
      bullet.active = false;
      const ufoScoreIndex = (shotsFired - 1) % UFO_SCORE_PATTERN.length;
      const ufoPoints = UFO_SCORE_PATTERN[ufoScoreIndex];
      score += ufoPoints;
      playExplosion();
      explosions.push({ x: ufo.x, y: ufo.y, timer: 20, text: ufoPoints.toString() });
    }
  }

  // Invader movement
  invaderMoveTimer++;
  if (invaderMoveTimer >= invaderMoveInterval) {
    invaderMoveTimer = 0;
    invaderAnimFrame = 1 - invaderAnimFrame;

    let hitEdge = false;
    for (let inv of invaders) {
      if (!inv.alive) continue;
      const isz = getInvaderSize(inv.type);
      if ((invaderDir > 0 && inv.x + isz.w >= W - 4) ||
          (invaderDir < 0 && inv.x <= 4)) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      invaderDir *= -1;
      for (let inv of invaders) {
        if (inv.alive) inv.y += 4;
      }
    } else {
      for (let inv of invaders) {
        if (inv.alive) inv.x += invaderDir * 2;
      }
    }

    playInvaderMove(moveSound);
    moveSound = (moveSound + 1) % 4;

    if (aliveInvaders.length > 0 && invaderBullets.length < 3 && Math.random() < 0.3) {
      const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
      const ssz = getInvaderSize(shooter.type);
      invaderBullets.push({ x: shooter.x + ssz.w / 2, y: shooter.y + ssz.h, speed: 1.2 });
    }

    for (let inv of invaders) {
      if (inv.alive && inv.y + 8 >= player.y) {
        state = STATE.TITLE;
        titleIdleTimer = 0;
        return;
      }
    }

    for (let inv of invaders) {
      if (!inv.alive) continue;
      const isz = getInvaderSize(inv.type);
      for (let s of shields) {
        if (!s.alive) continue;
        if (inv.x < s.x + s.w && inv.x + isz.w > s.x &&
            inv.y < s.y + s.h && inv.y + isz.h > s.y) {
          s.alive = false;
        }
      }
    }
  }

  // Invader bullets
  for (let i = invaderBullets.length - 1; i >= 0; i--) {
    const b = invaderBullets[i];
    b.y += b.speed;

    if (b.y > H) {
      invaderBullets.splice(i, 1);
      continue;
    }

    if (b.x >= player.x && b.x <= player.x + player.w &&
        b.y >= player.y && b.y <= player.y + player.h) {
      playPlayerDie();
      spawnPlayerExplosion();
      state = STATE.DYING;
      demoMode = true;
      lives = 0;
      dyingTimer = 60;
      invaderBullets.splice(i, 1);
      continue;
    }

    for (let s of shields) {
      if (!s.alive) continue;
      if (b.x >= s.x && b.x <= s.x + s.w &&
          b.y >= s.y && b.y <= s.y + s.h) {
        s.alive = false;
        invaderBullets.splice(i, 1);
        break;
      }
    }
  }

  // UFO
  if (!ufo.active) {
    ufo.timer++;
    if (ufo.timer >= 1536) {
      ufo.active = true;
      ufo.timer = 0;
      if (ufoFromLeft) {
        ufo.x = -16;
        ufo.speed = 0.5;
      } else {
        ufo.x = W + 16;
        ufo.speed = -0.5;
      }
      ufoFromLeft = !ufoFromLeft;
    }
  } else {
    ufo.x += ufo.speed;
    if (frameCount % 12 === 0) playUfo();
    if (ufo.x > W + 16 || ufo.x < -16) ufo.active = false;
  }

  updateParticles();

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) explosions.splice(i, 1);
  }
}

// ─── RENDER ───
function render() {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  if (state === STATE.INTRO) {
    drawIntroScreen();
    return;
  }

  if (state === STATE.TITLE) {
    drawTitleScreen();
    return;
  }

  if (state === STATE.HIGH_SCORES) {
    drawHighScoresScreen();
    return;
  }

  if (state === STATE.HIGH_SCORE_ENTRY) {
    drawHighScoreEntry();
    return;
  }

  if (state === STATE.GAME_OVER) {
    drawGameOverScreen();
    return;
  }

  if (state === STATE.VICTORY) {
    renderVictory();
    return;
  }

  if (state === STATE.BOSS_INTRO) {
    drawHUD();
    // Ground line
    ctx.fillStyle = COLOR_GREEN;
    ctx.fillRect(0, H - 16, W, 1);
    // Shields
    ctx.fillStyle = COLOR_GREEN;
    for (let s of shields) {
      if (s.alive) ctx.fillRect(s.x, s.y, s.w, s.h);
    }
    // Player
    drawSprite(SPRITES.player, player.x, player.y, COLOR_GREEN);
    // Boss intro animation
    renderBossIntro();
    // Lives
    for (let i = 0; i < lives - 1; i++) {
      drawSprite(SPRITES.player, 4 + i * 16, H - 14, GREEN_DIM);
    }
    return;
  }

  if (state === STATE.BOSS_FIGHT) {
    drawBossFightScreen();
    return;
  }

  // PLAYING / DEMO / DYING / LEVEL_CLEAR rendering

  // HUD
  drawHUD();

  // Ground line
  ctx.fillStyle = COLOR_GREEN;
  ctx.fillRect(0, H - 16, W, 1);

  // Shields
  ctx.fillStyle = COLOR_GREEN;
  for (let s of shields) {
    if (s.alive) ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  // Player
  if (state === STATE.DYING) {
    drawSprite(SPRITES.playerExplosion, player.x, player.y, COLOR_GREEN);
  } else {
    drawSprite(SPRITES.player, player.x, player.y, COLOR_GREEN);
  }

  // Player bullet
  if (bullet.active) {
    ctx.fillStyle = getZoneColor(bullet.y);
    ctx.fillRect(bullet.x, bullet.y, 1, 4);
  }

  // Invaders
  for (let inv of invaders) {
    if (!inv.alive) continue;
    let sprite;
    if (inv.type === 1) sprite = invaderAnimFrame === 0 ? SPRITES.invader1a : SPRITES.invader1b;
    else if (inv.type === 2) sprite = invaderAnimFrame === 0 ? SPRITES.invader2a : SPRITES.invader2b;
    else sprite = invaderAnimFrame === 0 ? SPRITES.invader3a : SPRITES.invader3b;
    drawSprite(sprite, inv.x, inv.y, getZoneColor(inv.y + 4));
  }

  // Invader bullets
  for (let b of invaderBullets) {
    ctx.fillStyle = getZoneColor(b.y);
    const zigzag = Math.floor(b.y / 3) % 2;
    ctx.fillRect(b.x + zigzag, b.y, 1, 3);
  }

  // UFO
  if (ufo.active) {
    drawSprite(SPRITES.ufo, ufo.x, ufo.y, COLOR_RED);
  }

  // Explosions
  for (let ex of explosions) {
    const exColor = getZoneColor(ex.y);
    if (ex.text) {
      ctx.fillStyle = exColor;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText(ex.text, ex.x, ex.y + 4);
    } else {
      drawSprite(SPRITES.explosion, ex.x, ex.y, exColor);
    }
  }

  // Particles
  for (let p of particles) {
    const alpha = p.life / 60;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLOR_GREEN;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Level clear message
  if (state === STATE.LEVEL_CLEAR) {
    ctx.fillStyle = BG;
    ctx.fillRect(W/2 - 50, H/2 - 12, 100, 24);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.strokeRect(W/2 - 50, H/2 - 12, 100, 24);
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('LIVELLO ' + level, W/2, H/2 - 2);
    ctx.fillText('COMPLETATO!', W/2, H/2 + 8);
    ctx.textAlign = 'left';
  }

  // Lives
  for (let i = 0; i < lives - 1; i++) {
    drawSprite(SPRITES.player, 4 + i * 16, H - 14, GREEN_DIM);
  }

  // Demo mode overlay
  if (state === STATE.DEMO || (state === STATE.DYING && demoMode)) {
    const blink = Math.sin(frameCount * 0.08) > 0;
    if (blink) {
      ctx.fillStyle = COLOR_WHITE;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('PREMI INVIO PER GIOCARE', W/2, 26);
      ctx.textAlign = 'left';
    }
  }
}

// ─── BOSS FIGHT SCREEN ───
function drawBossFightScreen() {
  drawHUD();

  // Ground line
  ctx.fillStyle = COLOR_GREEN;
  ctx.fillRect(0, H - 16, W, 1);

  // Shields
  ctx.fillStyle = COLOR_GREEN;
  for (let s of shields) {
    if (s.alive) ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  // Player
  if (state === STATE.DYING) {
    drawSprite(SPRITES.playerExplosion, player.x, player.y, COLOR_GREEN);
  } else {
    drawSprite(SPRITES.player, player.x, player.y, COLOR_GREEN);
  }

  // Player bullets (multi-shot)
  for (let b of bossFightBullets) {
    ctx.fillStyle = getZoneColor(b.y);
    ctx.fillRect(b.x, b.y, 1, 4);
  }

  // Boss
  renderBoss();

  // Boss HP bar
  renderBossHPBar();

  // Explosions
  for (let ex of explosions) {
    const exColor = getZoneColor(ex.y);
    if (ex.text) {
      ctx.fillStyle = exColor;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText(ex.text, ex.x, ex.y + 4);
    } else {
      drawSprite(SPRITES.explosion, ex.x, ex.y, exColor);
    }
  }

  // Particles
  for (let p of particles) {
    const alpha = p.life / 60;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLOR_GREEN;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Lives
  for (let i = 0; i < lives - 1; i++) {
    drawSprite(SPRITES.player, 4 + i * 16, H - 14, GREEN_DIM);
  }
}

function drawHUD() {
  ctx.fillStyle = COLOR_RED;
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + score.toString().padStart(5, '0'), 4, 12);
  ctx.textAlign = 'center';
  ctx.fillText('LV' + level, W/2, 12);
  ctx.textAlign = 'right';
  ctx.fillText('HI ' + getTopHighScore().toString().padStart(5, '0'), W - 4, 12);
  ctx.textAlign = 'left';

  // Lives count
  ctx.fillStyle = COLOR_GREEN;
  ctx.font = '5px "Press Start 2P"';
  ctx.fillText('x' + lives, 4, H - 4);
}

// ─── INTRO ANIMATION ───
const introScoreRows = [
  { sprite: SPRITES.ufo, label: '= ??? PTS', y: 100 },
  { sprite: SPRITES.invader2a, label: '= 30 PTS', y: 118 },
  { sprite: SPRITES.invader3a, label: '= 20 PTS', y: 134 },
  { sprite: SPRITES.invader1a, label: '= 10 PTS', y: 150 }
];

const INTRO_TYPE_SPEED = 9;
const INTRO_ROW_PAUSE = 24;
const INTRO_TITLE_SPEED = 4;

const PLAY_X = W/2;
const PLAY_Y = 220;
const Y_OFFSET_X = 18;

function updateIntro() {
  const f = intro.frame;

  if (intro.phase === 0) {
    const titleLen = 14;
    if (intro.titleChars < titleLen) {
      if (f % INTRO_TITLE_SPEED === 0) intro.titleChars++;
    } else if (!intro.titleDone) {
      intro.titleDone = true;
      intro.phaseTimer = f;
    }

    if (intro.titleDone && f > intro.phaseTimer + 20) {
      if (intro.scoreLineIndex < introScoreRows.length) {
        if (f % INTRO_TYPE_SPEED === 0) {
          const maxChars = introScoreRows[intro.scoreLineIndex].label.length;
          intro.scoreCharIndex++;
          if (intro.scoreCharIndex > maxChars) {
            intro.scoreLineIndex++;
            intro.scoreCharIndex = 0;
          }
        }
      } else if (!intro.scoresDone) {
        intro.scoresDone = true;
        intro.phaseTimer = f;
      }
    }

    if (intro.scoresDone && f > intro.phaseTimer + 30) {
      intro.phase = 1;
      intro.phaseTimer = f;
      intro.alienX = W + 10;
      intro.alienTargetX = PLAY_X + Y_OFFSET_X + 2;
    }
  }

  if (intro.phase === 1) {
    intro.alienX += (intro.alienTargetX - intro.alienX) * 0.06;
    if (Math.abs(intro.alienX - intro.alienTargetX) < 1) {
      intro.alienX = intro.alienTargetX;
      if (f > intro.phaseTimer + 90) {
        intro.phase = 2;
        intro.phaseTimer = f;
        intro.yVisible = false;
        intro.alienCarriesY = true;
        intro.yFlipped = true;
      }
    }
  }

  if (intro.phase === 2) {
    intro.alienX += 1.2;
    if (intro.alienX > W + 20) {
      intro.phase = 3;
      intro.phaseTimer = f;
      intro.alienX = W + 20;
      intro.yFlipped = false;
    }
  }

  if (intro.phase === 3) {
    if (f > intro.phaseTimer + 60) {
      intro.alienX += (intro.alienTargetX - intro.alienX) * 0.06;
      if (Math.abs(intro.alienX - intro.alienTargetX) < 1) {
        intro.alienX = intro.alienTargetX;
        if (f > intro.phaseTimer + 180) {
          intro.phase = 4;
          intro.phaseTimer = f;
          intro.yVisible = true;
          intro.yFlipped = false;
          intro.alienCarriesY = false;
        }
      }
    }
  }

  if (intro.phase === 4) {
    intro.alienX += 1.5;
    if (f > intro.phaseTimer + 90) {
      state = STATE.TITLE;
      introPlayed = true;
    }
  }
}

function drawIntroScreen() {
  const titleFull = 'COSMIC INVADERS';
  const titleShow = titleFull.substring(0, intro.titleChars);

  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';

  if (titleShow.length <= 5) {
    ctx.fillText(titleShow, W/2, 50);
  } else {
    ctx.fillText('SPACE', W/2, 50);
    ctx.fillText(titleShow.substring(6), W/2, 68);
  }

  if (intro.titleDone) {
    ctx.fillStyle = '#888888';
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('*SCORE ADVANCE TABLE*', W/2, 88);
  }

  ctx.font = '5px "Press Start 2P"';
  for (let i = 0; i < introScoreRows.length; i++) {
    const row = introScoreRows[i];

    if (i < intro.scoreLineIndex) {
      drawSprite(row.sprite, W/2 - 30, row.y - 4, COLOR_WHITE);
      ctx.fillStyle = COLOR_WHITE;
      ctx.textAlign = 'left';
      ctx.fillText(row.label, W/2 - 14, row.y + 2);
    } else if (i === intro.scoreLineIndex && intro.scoreCharIndex > 0) {
      drawSprite(row.sprite, W/2 - 30, row.y - 4, COLOR_WHITE);
      ctx.fillStyle = COLOR_WHITE;
      ctx.textAlign = 'left';
      ctx.fillText(row.label.substring(0, intro.scoreCharIndex), W/2 - 14, row.y + 2);
    }
  }

  if (intro.scoresDone) {
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';

    ctx.fillText('PLA', PLAY_X - 5, PLAY_Y);

    if (intro.yVisible) {
      if (intro.yFlipped) {
        ctx.save();
        ctx.translate(PLAY_X + Y_OFFSET_X - 5, PLAY_Y);
        ctx.scale(1, -1);
        ctx.fillText('Y', 0, 3);
        ctx.restore();
      } else {
        ctx.fillText('Y', PLAY_X + Y_OFFSET_X - 5, PLAY_Y);
      }
    }

    if (intro.phase >= 1 && intro.phase <= 4) {
      const alienY = PLAY_Y - 10;
      drawSprite(SPRITES.invader3a, intro.alienX, alienY, COLOR_WHITE);

      if (intro.alienCarriesY) {
        ctx.fillStyle = COLOR_WHITE;
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        if (intro.yFlipped) {
          ctx.save();
          ctx.translate(intro.alienX - 6, PLAY_Y);
          ctx.scale(1, -1);
          ctx.fillText('Y', 0, 3);
          ctx.restore();
        } else {
          ctx.fillText('Y', intro.alienX - 6, PLAY_Y);
        }
      }
    }
  }

  const skipBlink = Math.sin(intro.frame * 0.08) > 0;
  if (skipBlink) {
    ctx.fillStyle = '#555555';
    ctx.font = '4px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('PREMI UN TASTO', W/2, 248);
  }
  ctx.textAlign = 'left';
}

function drawTitleScreen() {
  const flicker = Math.sin(frameCount * 0.05) > -0.9;

  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE', W/2, 50);
  ctx.fillText('INVADERS', W/2, 68);

  ctx.font = '5px "Press Start 2P"';
  const demos = [
    { sprite: SPRITES.ufo, y: 100, label: '= ??? PTS' },
    { sprite: SPRITES.invader2a, y: 118, label: '= 30 PTS' },
    { sprite: SPRITES.invader3a, y: 134, label: '= 20 PTS' },
    { sprite: SPRITES.invader1a, y: 150, label: '= 10 PTS' }
  ];

  for (let d of demos) {
    drawSprite(d.sprite, W/2 - 30, d.y - 4, COLOR_WHITE);
    ctx.fillStyle = COLOR_WHITE;
    ctx.textAlign = 'left';
    ctx.fillText(d.label, W/2 - 14, d.y + 2);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888888';
  ctx.font = '4px "Press Start 2P"';
  ctx.fillText('-- HIGH SCORES --', W/2, 170);

  ctx.font = '4px "Press Start 2P"';
  for (let i = 0; i < highScores.length; i++) {
    const hs = highScores[i];
    ctx.fillStyle = i === 0 ? COLOR_WHITE : '#888888';
    ctx.fillText(
      (i + 1) + '. ' + hs.name + '  ' + hs.score.toString().padStart(5, '0'),
      W/2, 182 + i * 10
    );
  }

  ctx.fillStyle = flicker ? COLOR_WHITE : '#888888';
  ctx.font = '5px "Press Start 2P"';
  ctx.fillText('PREMI INVIO', W/2, 225);

  ctx.fillStyle = '#555555';
  ctx.font = '4px "Press Start 2P"';
  ctx.fillText('H = HI-SCORES', W/2, 237);
  ctx.fillText('2026 MATHSYNTH LABS', W/2, 248);
  ctx.textAlign = 'left';
}

function drawHighScoresScreen() {
  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('HIGH SCORES', W/2, 50);

  ctx.fillRect(W/2 - 60, 58, 120, 1);

  for (let i = 0; i < highScores.length; i++) {
    const hs = highScores[i];
    const y = 90 + i * 20;

    ctx.fillStyle = i === 0 ? COLOR_WHITE : '#888888';
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';

    if (i === 0) {
      ctx.fillText('*', W/2 - 50, y);
      ctx.fillText('*', W/2 + 50, y);
    }

    ctx.fillText((i + 1) + '.', W/2 - 36, y);
    ctx.fillText(hs.name, W/2, y);
    ctx.fillText(hs.score.toString().padStart(5, '0'), W/2 + 40, y);
  }

  drawSprite(SPRITES.invader2a, 20, 180, '#555555');
  drawSprite(SPRITES.invader2a, W - 26, 180, '#555555');

  const flicker = Math.sin(frameCount * 0.05) > -0.9;
  ctx.fillStyle = flicker ? COLOR_WHITE : '#888888';
  ctx.font = '5px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('PREMI INVIO', W/2, 210);

  ctx.fillStyle = '#555555';
  ctx.font = '4px "Press Start 2P"';
  ctx.fillText('2026 MATHSYNTH LABS', W/2, 240);
  ctx.textAlign = 'left';
}

function drawHighScoreEntry() {
  drawHUD();
  hsCursorBlink++;

  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('NUOVO RECORD!', W/2, H/2 - 36);

  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('SCORE: ' + score, W/2, H/2 - 20);

  ctx.font = '5px "Press Start 2P"';
  ctx.fillStyle = '#888888';
  ctx.fillText('INSERISCI INIZIALI', W/2, H/2 - 6);

  const startX = W/2 - 18;
  const charY = H/2 + 16;
  const blink = Math.floor(hsCursorBlink / 15) % 2 === 0;

  for (let i = 0; i < 3; i++) {
    const ch = HS_CHARS[hsEntryChars[i]];
    const isCurrent = (i === hsEntryPos && i >= hsEntryConfirmed);
    const isConfirmed = (i < hsEntryConfirmed);
    const cx = startX + i * 14;

    if (isCurrent) {
      ctx.fillStyle = COLOR_GREEN;
      ctx.font = '4px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('\u25B2', cx, charY - 10);
      ctx.fillText('\u25BC', cx, charY + 12);

      ctx.fillStyle = blink ? COLOR_WHITE : COLOR_GREEN;
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText(ch === ' ' ? '_' : ch, cx, charY);
    } else if (isConfirmed) {
      ctx.fillStyle = COLOR_WHITE;
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(ch === ' ' ? '_' : ch, cx, charY);
    } else {
      ctx.fillStyle = '#444444';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('_', cx, charY);
    }
  }

  ctx.fillStyle = '#555555';
  ctx.font = '4px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('\u25C0 \u25B6 SCORRI   FIRE CONFERMA', W/2, H/2 + 36);
  ctx.textAlign = 'left';
}

function drawGameOverScreen() {
  drawHUD();
  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W/2, H/2 - 10);

  ctx.font = '5px "Press Start 2P"';
  ctx.fillText('SCORE: ' + score, W/2, H/2 + 6);

  const flicker = Math.sin(frameCount * 0.05) > -0.9;
  ctx.fillStyle = flicker ? COLOR_WHITE : '#888888';
  ctx.fillText('PREMI INVIO', W/2, H/2 + 34);
  ctx.textAlign = 'left';
}

// ─── GAME LOOP ───
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// ─── RESPONSIVE CANVAS SIZING ───
function resizeCanvas() {
  const isMobile = window.innerWidth <= 700;
  if (!isMobile) {
    canvas.style.width = '';
    canvas.style.height = '';
    return;
  }
  const monitor = document.querySelector('.monitor');
  const controls = document.querySelector('.mobile-controls');
  const monitorPad = parseInt(getComputedStyle(monitor).paddingLeft) * 2 + 4;
  const maxW = window.innerWidth - 16 - monitorPad;
  const controlsH = controls ? controls.offsetHeight + 12 : 80;
  const maxH = window.innerHeight - controlsH - 32 - monitorPad;
  const aspect = H / W;
  let newW = maxW;
  let newH = newW * aspect;
  if (newH > maxH) {
    newH = maxH;
    newW = newH / aspect;
  }
  canvas.style.width = Math.floor(newW) + 'px';
  canvas.style.height = Math.floor(newH) + 'px';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', function() { setTimeout(resizeCanvas, 200); });
resizeCanvas();

// ─── SERVICE WORKER ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) {
        console.log('Service Worker registrato:', reg.scope);
      })
      .catch(function(err) {
        console.log('Service Worker errore:', err);
      });
  });
}
