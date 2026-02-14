// ─── BOSS SYSTEM ───
// "I Signori dell'Abisso" - Original boss fights

// ─── BOSS STATE ───
let boss = null;       // Current boss object
let bossBullets = [];  // Boss projectiles

function getBossType(lvl) {
  if (lvl === 6) return 'mothership';
  if (lvl === 2) return 'midboss';
  if (lvl === 4) return 'midboss2';
  return null;
}

// ─── BOSS INIT ───
function initBoss(type) {
  bossBullets = [];

  if (type === 'midboss') {
    var mbHp = 5 + cycle * 2;
    boss = {
      type: 'midboss',
      x: W / 2 - 12,
      y: -20,
      w: 24,
      h: 16,
      hp: mbHp,
      maxHp: mbHp,
      name: 'GIRU GIRU',
      points: 1000,
      phase: 'normal',    // 'normal' or 'enraged' (below 50% HP)
      moveAngle: 0,
      moveBaseX: W / 2 - 12,
      shootTimer: 0,
      shootInterval: 90,
      hitFlash: 0,
      alive: true,
      animFrame: 0,
      animTimer: 0,
      introY: -20
    };
  } else if (type === 'midboss2') {
    var mb2Hp = 8 + cycle * 3;
    boss = {
      type: 'midboss2',
      x: W / 2 - 12,
      y: -20,
      w: 24,
      h: 16,
      hp: mb2Hp,
      maxHp: mb2Hp,
      name: 'GURA GURA',
      points: 2000,
      phase: 'normal',
      moveAngle: 0,
      moveBaseX: W / 2 - 12,
      shootTimer: 0,
      shootInterval: 70,
      hitFlash: 0,
      alive: true,
      animFrame: 0,
      animTimer: 0,
      introY: -20,
      spinAngle: 0        // Per sparo a cerchio rotante
    };
  } else if (type === 'mothership') {
    var msHp = 18 + cycle * 5;
    boss = {
      type: 'mothership',
      x: W / 2 - 24,
      y: -30,
      w: 48,
      h: 24,
      hp: msHp,
      maxHp: msHp,
      name: 'ASTRONAVE MADRE',
      points: 5000,
      phase: 'shield',      // 'shield', 'attack', 'vulnerable', 'kamikaze'
      phaseTimer: 0,
      phaseDuration: { shield: 180, attack: 220, vulnerable: 180 },
      moveAngle: 0,
      shootTimer: 0,
      shootInterval: 45,
      hitFlash: 0,
      alive: true,
      animFrame: 0,
      animTimer: 0,
      introY: -30,
      introPhase: 0,       // 0=UFO enters, 1=UFO stops, 2=expand to mothership
      introTimer: 0,
      introUfoX: -16,      // UFO starts off-screen left
      shieldVisible: false,
      // Turrets
      turretLeft: { hp: 3, maxHp: 3, alive: true },
      turretRight: { hp: 3, maxHp: 3, alive: true },
      turretShootTimer: 0
    };
  }
}

// ─── BOSS INTRO UPDATE ───
function updateBossIntro() {
  if (!boss) return false;

  if (boss.type === 'midboss' || boss.type === 'midboss2') {
    // Mid-boss enters from the top
    boss.introY += 1.5;
    boss.y = boss.introY;
    if (boss.introY >= 30) {
      boss.y = 30;
      return true; // Intro complete
    }
    return false;
  }

  if (boss.type === 'mothership') {
    boss.introTimer++;

    if (boss.introPhase === 0) {
      // UFO enters from left like normal
      boss.introUfoX += 0.8;
      if (boss.introUfoX >= W / 2 - 8) {
        boss.introUfoX = W / 2 - 8;
        boss.introPhase = 1;
        boss.introTimer = 0;
      }
    } else if (boss.introPhase === 1) {
      // UFO stops, Imperatore Xarion speaks, then expansion
      if (boss.introTimer === 1) {
        speakBoss('Maledetti terrestri! Vi distruggerò!');
      }
      if (boss.introTimer >= 60 && !bossSpeaking) {
        boss.introPhase = 2;
        boss.introTimer = 0;
      }
    } else if (boss.introPhase === 2) {
      // "Expand" from UFO to mothership
      const progress = Math.min(boss.introTimer / 60, 1);
      // Scale effect: interpolate position from UFO center to mothership position
      boss.x = W / 2 - 24 * progress - 8 * (1 - progress);
      boss.y = 18 * (1 - progress) + 20 * progress;
      if (progress >= 1) {
        boss.x = W / 2 - 24;
        boss.y = 20;
        return true; // Intro complete
      }
    }
    return false;
  }

  return true;
}

// ─── BOSS INTRO RENDER ───
function renderBossIntro() {
  if (!boss) return;

  if (boss.type === 'midboss' || boss.type === 'midboss2') {
    const sprite = boss.type === 'midboss2' ? SPRITES.midboss2A : SPRITES.midbossA;
    const color = boss.type === 'midboss2' ? '#ff6600' : COLOR_WHITE;
    drawSprite(sprite, boss.x, boss.y, color);

    // Show name text
    ctx.fillStyle = COLOR_RED;
    ctx.font = '5px "Press Start 2P"';
    ctx.textAlign = 'center';
    const blink = Math.sin(frameCount * 0.1) > 0;
    if (blink) {
      ctx.fillText('WARNING!', W / 2, 10);
    }
    ctx.fillText(boss.name, W / 2, H / 2 + 30);
    ctx.textAlign = 'left';
  }

  if (boss.type === 'mothership') {
    if (boss.introPhase <= 1) {
      // Draw the UFO (same as normal UFO but it stops)
      drawSprite(SPRITES.ufo, boss.introUfoX, 18, COLOR_RED);

      ctx.fillStyle = COLOR_RED;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'center';
      const blink = Math.sin(frameCount * 0.1) > 0;
      if (blink) {
        ctx.fillText('WARNING!', W / 2, 10);
      }
      if (boss.introPhase === 1) {
        // Frase dell'Imperatore con effetto typewriter
        const vegaText = 'MALEDETTI TERRESTRI!';
        const charsToShow = Math.min(Math.floor(boss.introTimer / 4), vegaText.length);
        const displayText = vegaText.substring(0, charsToShow);
        ctx.fillStyle = COLOR_WHITE;
        ctx.font = '4px "Press Start 2P"';
        ctx.fillText('IMPERATORE XARION:', W / 2, H / 2 + 10);
        ctx.fillStyle = COLOR_RED;
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText(displayText, W / 2, H / 2 + 22);
        // Nome boss sotto
        if (boss.introTimer >= 80) {
          const nameBlink = Math.sin(boss.introTimer * 0.15) > 0;
          if (nameBlink) {
            ctx.fillText(boss.name, W / 2, H / 2 + 38);
          }
        }
      }
      ctx.textAlign = 'left';
    } else {
      // Expanding transition: draw mothership with growing alpha/scale feel
      const progress = Math.min(boss.introTimer / 60, 1);
      // Draw mothership sprite (fading in)
      const sprite = SPRITES.mothershipA;
      ctx.globalAlpha = progress;
      drawSprite(sprite, boss.x, boss.y, COLOR_RED);
      ctx.globalAlpha = 1;

      // Also draw fading-out UFO
      if (progress < 0.5) {
        ctx.globalAlpha = 1 - progress * 2;
        drawSprite(SPRITES.ufo, W / 2 - 8, 18, COLOR_RED);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = COLOR_RED;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, W / 2, H / 2 + 40);
      ctx.textAlign = 'left';
    }
  }
}

// ─── BOSS UPDATE ───
function updateBoss() {
  if (!boss || !boss.alive) return;

  boss.animTimer++;
  if (boss.animTimer >= 20) {
    boss.animTimer = 0;
    boss.animFrame = 1 - boss.animFrame;
  }

  if (boss.hitFlash > 0) boss.hitFlash--;
  boss.shootTimer++;

  if (boss.type === 'midboss') {
    updateMidBoss();
  } else if (boss.type === 'midboss2') {
    updateMidBoss2();
  } else if (boss.type === 'mothership') {
    updateMothership();
  }

  // Update boss bullets
  for (let i = bossBullets.length - 1; i >= 0; i--) {
    const b = bossBullets[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.y > H || b.y < 0 || b.x < 0 || b.x > W) {
      bossBullets.splice(i, 1);
      continue;
    }

    // Hit player
    if (b.x >= player.x && b.x <= player.x + player.w &&
        b.y >= player.y && b.y <= player.y + player.h) {
      bossBullets.splice(i, 1);
      // Shield power-up absorbs hit
      if (playerShieldHits > 0) {
        playerShieldHits--;
        playExplosion();
        particles.push({ x: player.x + player.w / 2, y: player.y, vx: 0, vy: -1, life: 15 });
        continue;
      }
      lives--;
      state = STATE.DYING;
      dyingTimer = 60;
      playPlayerDie();
      spawnPlayerExplosion();
      continue;
    }

    // Hit shields
    for (let s of shields) {
      if (!s.alive) continue;
      if (b.x >= s.x && b.x <= s.x + s.w &&
          b.y >= s.y && b.y <= s.y + s.h) {
        s.alive = false;
        bossBullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateMidBoss() {
  const isEnraged = boss.hp <= boss.maxHp / 2;
  boss.phase = isEnraged ? 'enraged' : 'normal';

  // Sinusoidal horizontal movement
  boss.moveAngle += isEnraged ? 0.04 : 0.025;
  boss.x = boss.moveBaseX + Math.sin(boss.moveAngle) * 60;

  // Enraged: occasional dive toward player
  if (isEnraged && Math.sin(boss.moveAngle * 0.3) > 0.9) {
    boss.y = 30 + Math.sin(boss.moveAngle * 2) * 20;
  } else {
    // Return to normal height
    boss.y += (30 - boss.y) * 0.05;
  }

  // Clamp position
  if (boss.x < 2) boss.x = 2;
  if (boss.x > W - boss.w - 2) boss.x = W - boss.w - 2;

  // Shooting
  const shootInt = isEnraged ? 50 : 90;
  if (boss.shootTimer >= shootInt) {
    boss.shootTimer = 0;

    if (isEnraged) {
      // Fan shot (3 bullets)
      [-0.3, 0, 0.3].forEach(function(angle) {
        bossBullets.push({
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h,
          vx: Math.sin(angle) * 1,
          vy: 1.2,
          color: COLOR_RED
        });
      });
    } else {
      // Single aimed shot toward player
      const dx = (player.x + player.w / 2) - (boss.x + boss.w / 2);
      const dy = (player.y) - (boss.y + boss.h);
      const dist = Math.sqrt(dx * dx + dy * dy);
      bossBullets.push({
        x: boss.x + boss.w / 2,
        y: boss.y + boss.h,
        vx: (dx / dist) * 1,
        vy: (dy / dist) * 1,
        color: COLOR_RED
      });
    }
  }
}

function updateMidBoss2() {
  const isEnraged = boss.hp <= boss.maxHp / 2;
  boss.phase = isEnraged ? 'enraged' : 'normal';

  // Movimento a zigzag orizzontale (piu' aggressivo del primo)
  boss.moveAngle += isEnraged ? 0.05 : 0.03;
  boss.x = boss.moveBaseX + Math.sin(boss.moveAngle) * 70;

  // Enraged: scende piu' in basso, piu' minaccioso
  if (isEnraged) {
    boss.y = 30 + Math.sin(boss.moveAngle * 1.5) * 25;
  } else {
    boss.y += (30 - boss.y) * 0.05;
  }

  // Clamp
  if (boss.x < 2) boss.x = 2;
  if (boss.x > W - boss.w - 2) boss.x = W - boss.w - 2;

  // Sparo a cerchio rotante
  const shootInt = isEnraged ? 40 : 70;
  if (boss.shootTimer >= shootInt) {
    boss.shootTimer = 0;
    boss.spinAngle = (boss.spinAngle || 0) + 0.5;

    if (isEnraged) {
      // 4 proiettili in croce rotante
      for (let i = 0; i < 4; i++) {
        const angle = boss.spinAngle + i * (Math.PI / 2);
        bossBullets.push({
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h / 2,
          vx: Math.cos(angle) * 1.2,
          vy: Math.sin(angle) * 1.2,
          color: '#ff6600'
        });
      }
    } else {
      // 3 proiettili in arco rotante
      for (let i = 0; i < 3; i++) {
        const angle = boss.spinAngle + i * (Math.PI * 2 / 3);
        bossBullets.push({
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h,
          vx: Math.sin(angle) * 0.8,
          vy: Math.abs(Math.cos(angle)) * 0.8 + 0.5,
          color: '#ff6600'
        });
      }
    }
  }
}

function updateMothership() {
  boss.phaseTimer++;

  // ─── KAMIKAZE PHASE: sotto 2 HP si lancia contro il player ───
  if (boss.hp <= 3 && boss.phase !== 'kamikaze') {
    boss.phase = 'kamikaze';
    boss.phaseTimer = 0;
    boss.shieldVisible = false;
    boss.kamikazeTextTimer = 0;
    boss.kamikazeCharging = true;
    speakBoss('Vi distruggerò!');
  }

  if (boss.phase === 'kamikaze') {
    boss.kamikazeTextTimer++;

    if (boss.kamikazeCharging) {
      // Pausa drammatica: la nave trema e il testo appare
      boss.kamikazeBaseX = boss.kamikazeBaseX || boss.x;
      boss.kamikazeBaseY = boss.kamikazeBaseY || boss.y;
      boss.x = boss.kamikazeBaseX + (Math.random() - 0.5) * 3;
      boss.y = boss.kamikazeBaseY + (Math.random() - 0.5) * 1.5;

      // Aspetta che la voce finisca, poi inizia la picchiata
      if (boss.kamikazeTextTimer >= 60 && !bossSpeaking) {
        boss.kamikazeCharging = false;
        // Calcola traiettoria fissa verso la posizione ATTUALE del player
        boss.kamikazeTargetX = player.x + player.w / 2 - boss.w / 2;
        boss.kamikazeSpeed = 0.5; // velocita' iniziale, accelera
      }
      return;
    }

    // Picchiata a traiettoria fissa (non insegue, il player puo' schivare)
    boss.kamikazeSpeed += 0.08; // accelerazione
    const dx = boss.kamikazeTargetX - boss.x;
    const horizSpeed = dx * 0.03; // lieve correzione orizzontale
    boss.x += horizSpeed;
    boss.y += boss.kamikazeSpeed;

    // Sparo disperato verso il basso ogni 25 frame
    if (boss.phaseTimer % 25 === 0) {
      bossBullets.push({
        x: boss.x + boss.w / 2,
        y: boss.y + boss.h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2,
        color: COLOR_RED
      });
    }

    // ESITO 3: Collisione con il player → entrambi distrutti, GAME OVER
    if (boss.y + boss.h >= player.y &&
        boss.x + boss.w >= player.x && boss.x <= player.x + player.w) {
      // Boss distrutto nello schianto
      boss.alive = false;
      boss.hp = 0;
      playBossDeath();
      stopBossMusic();
      spawnBossExplosion();
      // Player distrutto - perde tutte le vite
      lives = 0;
      playPlayerDie();
      spawnPlayerExplosion();
      state = STATE.DYING;
      dyingTimer = 60;
      return;
    }

    // ESITO 2: Si schianta al suolo → boss distrutto, player vince!
    if (boss.y + boss.h >= H - 18) {
      boss.alive = false;
      boss.hp = 0;
      score += boss.points + 10000;
      playBossDeath();
      stopBossMusic();
      // Esplosione massiva allo schianto
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: boss.x + Math.random() * boss.w,
          y: H - 18,
          vx: (Math.random() - 0.5) * 5,
          vy: -(Math.random() * 4 + 1),
          life: 30 + Math.random() * 60
        });
      }
      for (let i = 0; i < 10; i++) {
        explosions.push({
          x: boss.x + Math.random() * boss.w,
          y: H - 20 - Math.random() * 10,
          timer: 15 + i * 6
        });
      }
      state = STATE.VICTORY;
      victoryTimer = 0;
      playVictoryFanfare();
      return;
    }

    // Clamp orizzontale
    if (boss.x < 0) boss.x = 0;
    if (boss.x > W - boss.w) boss.x = W - boss.w;
    return;
  }

  // ─── FASI NORMALI (shield / attack / vulnerable) ───

  // Phase cycling
  if (boss.phase === 'shield' && boss.phaseTimer >= boss.phaseDuration.shield) {
    boss.phase = 'attack';
    boss.phaseTimer = 0;
    boss.shieldVisible = false;
  } else if (boss.phase === 'attack' && boss.phaseTimer >= boss.phaseDuration.attack) {
    boss.phase = 'vulnerable';
    boss.phaseTimer = 0;
  } else if (boss.phase === 'vulnerable' && boss.phaseTimer >= boss.phaseDuration.vulnerable) {
    boss.phase = 'shield';
    boss.phaseTimer = 0;
    boss.shieldVisible = true;
  }

  // Movement based on phase
  if (boss.phase === 'shield') {
    // Slow drift
    boss.shieldVisible = true;
    boss.moveAngle += 0.015;
    boss.x = W / 2 - 24 + Math.sin(boss.moveAngle) * 30;
  } else if (boss.phase === 'attack') {
    // Figure-8 pattern
    boss.moveAngle += 0.035;
    boss.x = W / 2 - 24 + Math.sin(boss.moveAngle) * 50;
    boss.y = 20 + Math.sin(boss.moveAngle * 2) * 15;

    // Main gun + turret shooting
    if (boss.shootTimer >= boss.shootInterval) {
      boss.shootTimer = 0;

      // Fan shot from center (3 proiettili)
      [-0.3, 0, 0.3].forEach(function(angle) {
        bossBullets.push({
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h,
          vx: Math.sin(angle) * 0.8,
          vy: 1.2,
          color: COLOR_RED
        });
      });
    }

    // Turret shooting
    boss.turretShootTimer++;
    if (boss.turretShootTimer >= 80) {
      boss.turretShootTimer = 0;

      // Left turret
      if (boss.turretLeft.alive) {
        const dx = (player.x + player.w / 2) - (boss.x + 6);
        const dy = (player.y) - (boss.y + boss.h);
        const dist = Math.sqrt(dx * dx + dy * dy);
        bossBullets.push({
          x: boss.x + 6,
          y: boss.y + boss.h - 2,
          vx: (dx / dist) * 2,
          vy: (dy / dist) * 2,
          color: COLOR_WHITE
        });
      }

      // Right turret
      if (boss.turretRight.alive) {
        const dx = (player.x + player.w / 2) - (boss.x + boss.w - 6);
        const dy = (player.y) - (boss.y + boss.h);
        const dist = Math.sqrt(dx * dx + dy * dy);
        bossBullets.push({
          x: boss.x + boss.w - 6,
          y: boss.y + boss.h - 2,
          vx: (dx / dist) * 2,
          vy: (dy / dist) * 2,
          color: COLOR_WHITE
        });
      }
    }
  } else if (boss.phase === 'vulnerable') {
    // Stop at center, blink
    boss.x += (W / 2 - 24 - boss.x) * 0.08;
    boss.y += (25 - boss.y) * 0.08;
  }

  // Clamp
  if (boss.x < 0) boss.x = 0;
  if (boss.x > W - boss.w) boss.x = W - boss.w;
}

// ─── BOSS COLLISION (player bullet hits boss) ───
function checkBulletBossCollision() {
  if (!boss || !boss.alive || !bullet.active) return false;

  // During shield phase, mothership is invulnerable
  if (boss.type === 'mothership' && boss.phase === 'shield') {
    // Check if bullet hits shield area
    if (bullet.x >= boss.x - 2 && bullet.x <= boss.x + boss.w + 2 &&
        bullet.y >= boss.y - 4 && bullet.y <= boss.y + boss.h + 4) {
      bullet.active = false;
      // Visual feedback: spark
      particles.push({
        x: bullet.x, y: bullet.y,
        vx: (Math.random() - 0.5) * 2, vy: -1,
        life: 10
      });
      return true;
    }
    return false;
  }

  // Check turret hits (mothership only)
  if (boss.type === 'mothership') {
    // Left turret
    if (boss.turretLeft.alive) {
      const tx = boss.x + 2;
      const ty = boss.y + boss.h - 6;
      if (bullet.x >= tx && bullet.x <= tx + 8 &&
          bullet.y >= ty && bullet.y <= ty + 6) {
        boss.turretLeft.hp--;
        bullet.active = false;
        playBossHit();
        if (boss.turretLeft.hp <= 0) {
          boss.turretLeft.alive = false;
          score += 500;
          explosions.push({ x: tx, y: ty, timer: 15 });
          spawnBossParticles(tx + 4, ty + 3, 8);
        }
        return true;
      }
    }
    // Right turret
    if (boss.turretRight.alive) {
      const tx = boss.x + boss.w - 10;
      const ty = boss.y + boss.h - 6;
      if (bullet.x >= tx && bullet.x <= tx + 8 &&
          bullet.y >= ty && bullet.y <= ty + 6) {
        boss.turretRight.hp--;
        bullet.active = false;
        playBossHit();
        if (boss.turretRight.hp <= 0) {
          boss.turretRight.alive = false;
          score += 500;
          explosions.push({ x: tx, y: ty, timer: 15 });
          spawnBossParticles(tx + 4, ty + 3, 8);
        }
        return true;
      }
    }
  }

  // Main body hit
  if (bullet.x >= boss.x && bullet.x <= boss.x + boss.w &&
      bullet.y >= boss.y && bullet.y <= boss.y + boss.h) {
    bullet.active = false;

    // Double damage during vulnerable phase
    const dmg = (boss.type === 'mothership' && boss.phase === 'vulnerable') ? 2 : 1;
    boss.hp -= dmg;
    boss.hitFlash = 6;
    playBossHit();

    if (boss.hp <= 0) {
      boss.alive = false;
      score += boss.points;
      playBossDeath();
      stopBossMusic();
      spawnBossExplosion();

      if (boss.type === 'mothership') {
        // Final victory!
        score += 10000; // Victory bonus
        state = STATE.VICTORY;
        victoryTimer = 0;
        playVictoryFanfare();
      } else {
        // Mid-boss defeated, continue to next level
        state = STATE.LEVEL_CLEAR;
        levelClearTimer = 120;
      }
    }
    return true;
  }

  return false;
}

// ─── BOSS PARTICLES / EXPLOSIONS ───
function spawnBossParticles(cx, cy, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 20 + Math.random() * 30
    });
  }
}

function spawnBossExplosion() {
  if (!boss) return;
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const count = boss.type === 'mothership' ? 60 : 30;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * boss.w,
      y: cy + (Math.random() - 0.5) * boss.h,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30 + Math.random() * 60
    });
  }

  // Multiple staged explosions for mothership
  if (boss.type === 'mothership') {
    for (let i = 0; i < 8; i++) {
      explosions.push({
        x: cx + (Math.random() - 0.5) * boss.w,
        y: cy + (Math.random() - 0.5) * boss.h,
        timer: 15 + i * 8
      });
    }
  } else {
    explosions.push({ x: boss.x, y: boss.y, timer: 20 });
  }
}

// ─── BOSS RENDER ───
function renderBoss() {
  if (!boss || !boss.alive) return;

  // Determine sprite
  let sprite;
  if (boss.type === 'midboss') {
    sprite = boss.animFrame === 0 ? SPRITES.midbossA : SPRITES.midbossB;
  } else if (boss.type === 'midboss2') {
    sprite = boss.animFrame === 0 ? SPRITES.midboss2A : SPRITES.midboss2B;
  } else {
    sprite = boss.animFrame === 0 ? SPRITES.mothershipA : SPRITES.mothershipB;
  }

  // Hit flash effect
  let color;
  if (boss.type === 'mothership') {
    color = COLOR_RED;
  } else if (boss.type === 'midboss2') {
    color = '#ff6600'; // arancione
  } else {
    color = COLOR_WHITE;
  }
  if (boss.hitFlash > 0) {
    color = COLOR_WHITE;
    // Flash between white and original color
    if (boss.hitFlash % 2 === 0) color = '#ffffff';
  }

  // Vulnerable phase blink for mothership
  if (boss.type === 'mothership' && boss.phase === 'vulnerable') {
    if (Math.floor(frameCount / 4) % 2 === 0) {
      color = COLOR_WHITE;
    }
  }

  // Kamikaze phase: lampeggio rosso/bianco furioso
  if (boss.type === 'mothership' && boss.phase === 'kamikaze') {
    color = Math.floor(frameCount / 2) % 2 === 0 ? COLOR_RED : COLOR_WHITE;
  }

  drawSprite(sprite, boss.x, boss.y, color);

  // Kamikaze text during charging pause
  if (boss.type === 'mothership' && boss.phase === 'kamikaze' && boss.kamikazeCharging) {
    ctx.fillStyle = COLOR_RED;
    ctx.font = '5px "Press Start 2P"';
    ctx.textAlign = 'center';
    const vegaText = "TI DISTRUGGERO'!";
    const charsToShow = Math.min(Math.floor(boss.kamikazeTextTimer / 4), vegaText.length);
    ctx.fillText(vegaText.substring(0, charsToShow), W / 2, boss.y + boss.h + 12);
    ctx.textAlign = 'left';
  }

  // Draw shield effect for mothership
  if (boss.type === 'mothership' && boss.shieldVisible && boss.phase === 'shield') {
    // Semi-transparent shield overlay
    ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
    drawSprite(SPRITES.bossShield, boss.x + 12, boss.y - 4, '#4444ff');
    ctx.globalAlpha = 1;
  }

  // Draw turret indicators for mothership
  if (boss.type === 'mothership') {
    if (boss.turretLeft.alive) {
      ctx.fillStyle = COLOR_GREEN;
      ctx.fillRect(boss.x + 4, boss.y + boss.h - 3, 4, 2);
    }
    if (boss.turretRight.alive) {
      ctx.fillStyle = COLOR_GREEN;
      ctx.fillRect(boss.x + boss.w - 8, boss.y + boss.h - 3, 4, 2);
    }
  }

  // Boss bullets
  for (let b of bossBullets) {
    ctx.fillStyle = b.color || COLOR_RED;
    ctx.fillRect(b.x, b.y, 2, 4);
  }
}

// ─── BOSS HP BAR ───
function renderBossHPBar() {
  if (!boss || !boss.alive) return;

  const barW = W - 40;
  const barH = 4;
  const barX = 20;
  const barY = 18;

  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barW, barH);

  // HP fill
  const hpRatio = boss.hp / boss.maxHp;
  let barColor;
  if (hpRatio > 0.5) barColor = COLOR_GREEN;
  else if (hpRatio > 0.25) barColor = '#ffff33';
  else barColor = COLOR_RED;

  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  // Border
  ctx.strokeStyle = '#666666';
  ctx.strokeRect(barX, barY, barW, barH);

  // Boss name above bar
  ctx.fillStyle = COLOR_RED;
  ctx.font = '4px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(boss.name, W / 2, barY - 2);

  // Phase indicator for mothership
  if (boss.type === 'mothership') {
    let phaseText = '';
    if (boss.phase === 'shield') phaseText = 'SCUDO ATTIVO';
    else if (boss.phase === 'attack') phaseText = 'ATTACCO';
    else if (boss.phase === 'vulnerable') phaseText = 'VULNERABILE!';
    else if (boss.phase === 'kamikaze') phaseText = 'ATTACCO FINALE!';
    ctx.fillStyle = boss.phase === 'vulnerable' ? COLOR_GREEN :
                    boss.phase === 'kamikaze' ? COLOR_RED : '#888888';
    ctx.font = '3px "Press Start 2P"';
    ctx.fillText(phaseText, W / 2, barY + barH + 6);
  }

  ctx.textAlign = 'left';
}

// ─── VICTORY STATE ───
let victoryTimer = 0;
let victoryFlash = 0;

function updateVictory() {
  victoryTimer++;
  victoryFlash = Math.sin(victoryTimer * 0.1) > 0 ? 1 : 0;
  updateParticles();

  // Additional particle bursts during celebration
  if (victoryTimer % 15 === 0 && victoryTimer < 180) {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 0.5,
        life: 30 + Math.random() * 40
      });
    }
  }

  // Screen flash during first frames
  if (victoryTimer < 10) {
    victoryFlash = 2; // white flash
  }

  // After celebration, transition to credits
  if (victoryTimer >= 300) {
    creditsScrollY = H + 20;
    creditsTimer = 0;
    creditsFinished = false;
    state = STATE.CREDITS;
  }
}

// ─── CREDITS STATE ───
let creditsScrollY = 0;
let creditsTimer = 0;

var CREDITS_LINES = [
  { text: 'COSMIC INVADERS', size: 10, color: '#ffffff', gap: 30 },
  { text: 'THE MATHSYNTH LABS MASTER', size: 5, color: '#888888', gap: 20 },
  { text: '', size: 5, color: '', gap: 15 },
  { text: '--- BOSS ---', size: 5, color: '#ff3333', gap: 15 },
  { text: "I SIGNORI DELL'ABISSO", size: 6, color: '#ff3333', gap: 20 },
  { text: '', size: 5, color: '', gap: 15 },
  { text: '--- AI ---', size: 5, color: '#888888', gap: 15 },
  { text: 'MOTHERSHIP AI COMPUTER', size: 5, color: '#ffffff', gap: 12 },
  { text: 'CLAUDE', size: 8, color: '#00ffff', gap: 25 },
  { text: '', size: 5, color: '', gap: 15 },
  { text: '--- ISPIRAZIONE ---', size: 5, color: '#888888', gap: 15 },
  { text: 'CLASSICI ARCADE ANNI 70', size: 5, color: '#33ff33', gap: 20 },
  { text: '', size: 5, color: '', gap: 15 },
  { text: '--- AUDIO ---', size: 5, color: '#888888', gap: 15 },
  { text: 'TONE.JS', size: 6, color: '#ffffff', gap: 25 },
  { text: '', size: 5, color: '', gap: 20 },
  { text: '', size: 5, color: '', gap: 10 },  // placeholder for cycle text
  { text: '', size: 5, color: '', gap: 10 },  // placeholder for next cycle text
  { text: '', size: 5, color: '', gap: 30 },
  { text: '2026 MATHSYNTH LABS', size: 4, color: '#555555', gap: 20 }
];

let creditsFinished = false;

function updateCredits() {
  creditsTimer++;
  creditsScrollY -= 0.5;

  // Calculate total height of credits
  var totalH = 0;
  for (var i = 0; i < CREDITS_LINES.length; i++) {
    totalH += CREDITS_LINES[i].gap;
  }

  // When credits have fully scrolled, show choice
  if (creditsScrollY + totalH < -20) {
    creditsFinished = true;
  }

  // Allow skip to choice screen
  if (creditsTimer > 60 && !creditsFinished && (keys['Enter'] || keys['Space'])) {
    keys['Enter'] = false;
    keys['Space'] = false;
    creditsFinished = true;
  }

  // Choice screen: Enter = NG+, Escape = end
  if (creditsFinished) {
    if (keys['Enter'] || keys['Space']) {
      keys['Enter'] = false;
      keys['Space'] = false;
      startNewGamePlus();
    } else if (keys['Escape']) {
      keys['Escape'] = false;
      if (isHighScore(score)) {
        hsEntryName = '';
        hsEntryPos = 0;
        hsEntryChars = [0, 0, 0];
        hsEntryConfirmed = 0;
        state = STATE.HIGH_SCORE_ENTRY;
      } else {
        state = STATE.TITLE;
        titleIdleTimer = 0;
      }
    }
  }
}

function renderCredits() {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  var y = creditsScrollY;

  for (var i = 0; i < CREDITS_LINES.length; i++) {
    var line = CREDITS_LINES[i];
    var textToDraw = line.text;

    // Dynamic cycle lines
    if (i === CREDITS_LINES.length - 4) {
      textToDraw = 'CICLO ' + (cycle + 1) + ' COMPLETATO!';
      line.color = '#ffff33';
      line.size = 6;
    } else if (i === CREDITS_LINES.length - 3) {
      textToDraw = 'PREPARATI PER IL CICLO ' + (cycle + 2) + '...';
      line.color = COLOR_WHITE;
      line.size = 5;
    }

    if (textToDraw && y > -15 && y < H + 15) {
      ctx.fillStyle = line.color;
      ctx.font = line.size + 'px "Press Start 2P"';
      ctx.fillText(textToDraw, W / 2, y);
    }
    y += line.gap;
  }

  // Score display at bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = '5px "Press Start 2P"';
  ctx.fillText('SCORE: ' + score, W / 2, H - 16);

  if (creditsFinished) {
    // Choice screen
    var blink = Math.sin(creditsTimer * 0.08) > 0;
    if (blink) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText('INVIO = CONTINUA', W / 2, H / 2 - 10);
      ctx.fillText('ESC = FINE', W / 2, H / 2 + 5);
    }
  } else if (creditsTimer > 60) {
    // Skip hint
    var blink2 = Math.sin(creditsTimer * 0.08) > 0;
    if (blink2) {
      ctx.fillStyle = '#555555';
      ctx.font = '3px "Press Start 2P"';
      ctx.fillText('PREMI INVIO', W / 2, H - 5);
    }
  }

  ctx.textAlign = 'left';
}

function renderVictory() {
  // Screen flash
  if (victoryFlash === 2) {
    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Draw particles
  for (let p of particles) {
    const alpha = p.life / 60;
    ctx.globalAlpha = alpha;
    const colors = [COLOR_RED, COLOR_GREEN, COLOR_WHITE, '#ffff33'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Explosions
  for (let ex of explosions) {
    drawSprite(SPRITES.explosion, ex.x, ex.y, COLOR_RED);
  }

  // Victory text
  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('VITTORIA!', W / 2, H / 2 - 30);

  ctx.fillStyle = COLOR_RED;
  ctx.font = '5px "Press Start 2P"';
  ctx.fillText('ASTRONAVE MADRE DISTRUTTA', W / 2, H / 2 - 10);

  ctx.fillStyle = COLOR_GREEN;
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('BONUS +10000', W / 2, H / 2 + 10);

  ctx.fillStyle = COLOR_WHITE;
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('SCORE: ' + score, W / 2, H / 2 + 30);

  if (victoryTimer > 120) {
    const blink = Math.sin(victoryTimer * 0.08) > 0;
    if (blink) {
      ctx.fillStyle = '#888888';
      ctx.font = '4px "Press Start 2P"';
      ctx.fillText('TERRA SALVATA!', W / 2, H / 2 + 50);
    }
  }

  ctx.textAlign = 'left';
}
