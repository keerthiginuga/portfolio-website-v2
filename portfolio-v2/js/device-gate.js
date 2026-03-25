(function () {
  'use strict';

  var BREAKPOINT = 1024;
  var BEST_SCORE_KEY = 'v2-mobile-gate-best-score';
  var OVERLAY_ID = 'v2-device-gate';

  var overlayEl = null;
  var restartBtn = null;
  var canvasEl = null;
  var ctx = null;
  var scoreEl = null;
  var bestEl = null;
  var gameOverEl = null;

  var rafId = null;
  var resizeRaf = null;
  var lastTs = 0;
  var pausedByVisibility = false;

  var sceneStars = [];
  var sceneShift = 0;

  var game = {
    running: false,
    over: false,
    score: 0,
    best: 0,
    elapsed: 0,
    speed: 280,
    spawnTimer: 0,
    groundY: 0,
    player: {
      x: 44,
      y: 0,
      w: 34,
      h: 36,
      vy: 0,
      onGround: true
    },
    obstacles: []
  };

  var CFG = {
    gravity: 2100,
    jumpVelocity: 760,
    baseSpeed: 280,
    maxSpeed: 620,
    speedRamp: 8,
    spawnMin: 0.72,
    spawnMax: 1.6,
    scoreRate: 14,
    groundRatio: 0.78,
    maxDelta: 0.04
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function isBlockedViewport() {
    return window.innerWidth < BREAKPOINT;
  }

  function readBestScore() {
    try {
      var raw = window.localStorage.getItem(BEST_SCORE_KEY);
      var parsed = raw ? Number(raw) : 0;
      return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    } catch (err) {
      return 0;
    }
  }

  function writeBestScore(value) {
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(value));
    } catch (err) {
      // Ignore storage failures.
    }
  }

  function setGatedClass(isGated) {
    if (!document.documentElement || !document.body) return;
    document.documentElement.classList.toggle('v2-device-gated', isGated);
    document.body.classList.toggle('v2-device-gated', isGated);
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(Math.floor(game.score));
    if (bestEl) bestEl.textContent = String(Math.floor(game.best));
  }

  function buildOverlay() {
    var el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.className = 'v2-device-gate';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'v2-device-gate-title');
    el.setAttribute('aria-describedby', 'v2-device-gate-copy');

    el.innerHTML = '' +
      '<div class="v2-device-gate__stars" aria-hidden="true"></div>' +
      '<div class="v2-device-gate__frame">' +
      '  <div class="v2-device-gate__content">' +
      '    <section class="v2-device-gate__message">' +
      '      <div class="v2-device-gate__pixel-icon" aria-hidden="true">' +
      '        <svg viewBox="0 0 64 38" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      '          <g fill="currentColor">' +
      '            <rect x="6" y="21" width="4" height="4"/><rect x="10" y="17" width="4" height="8"/><rect x="14" y="13" width="4" height="12"/>' +
      '            <rect x="18" y="9" width="4" height="16"/><rect x="22" y="9" width="4" height="16"/><rect x="26" y="13" width="4" height="12"/>' +
      '            <rect x="30" y="17" width="4" height="8"/><rect x="34" y="17" width="4" height="8"/><rect x="38" y="21" width="4" height="4"/>' +
      '            <rect x="24" y="5" width="16" height="4"/><rect x="36" y="9" width="12" height="4"/><rect x="44" y="13" width="8" height="4"/>' +
      '            <rect x="26" y="25" width="4" height="6"/><rect x="16" y="25" width="4" height="6"/><rect x="4" y="29" width="56" height="2"/>' +
      '          </g>' +
      '        </svg>' +
      '      </div>' +
      '      <h1 id="v2-device-gate-title">Best viewed on desktop</h1>' +
      '      <p id="v2-device-gate-copy">Sorry - this experience is currently optimized for PC/desktop. Mobile experience is being worked on.</p>' +
      '      <p class="v2-device-gate__try">Try:</p>' +
      '      <ul>' +
      '        <li>Switch to a laptop or desktop for full experience</li>' +
      '        <li>Play the mini runner while you are here</li>' +
      '      </ul>' +
      '    </section>' +
      '    <section class="v2-device-gate__game" aria-label="Mini runner game">' +
      '      <div class="v2-device-gate__hud">' +
      '        <span>Score <b data-score>0</b></span>' +
      '        <span>Best <b data-best>0</b></span>' +
      '      </div>' +
      '      <div class="v2-device-gate__playfield">' +
      '        <canvas class="v2-device-gate__canvas" data-canvas aria-label="Runner game"></canvas>' +
      '        <div class="v2-device-gate__game-over" data-game-over hidden>' +
      '          <p>Game Over</p>' +
      '          <button type="button" data-restart aria-label="Restart game">Restart (R)</button>' +
      '        </div>' +
      '      </div>' +
      '      <p class="v2-device-gate__hint">Tap / Space / Arrow Up to jump</p>' +
      '    </section>' +
      '  </div>' +
      '</div>';

    return el;
  }

  function createStars() {
    sceneStars = [];
    for (var i = 0; i < 56; i += 1) {
      sceneStars.push({
        x: Math.random(),
        y: Math.random() * 0.7,
        r: randomBetween(0.6, 1.9),
        layer: randomBetween(0.2, 1)
      });
    }
  }

  function resetGameState() {
    game.score = 0;
    game.elapsed = 0;
    game.speed = CFG.baseSpeed;
    game.spawnTimer = randomBetween(0.45, 1.1);
    game.over = false;
    game.player.vy = 0;
    game.player.onGround = true;
    game.player.y = game.groundY - game.player.h;
    game.obstacles = [];
    sceneShift = 0;
    updateHud();
    if (gameOverEl) gameOverEl.hidden = true;
  }

  function resizeCanvas() {
    if (!canvasEl || !ctx) return;

    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = null;
      var dpr = window.devicePixelRatio || 1;
      var rect = canvasEl.getBoundingClientRect();
      var cssW = Math.max(280, Math.floor(rect.width));
      var cssH = Math.max(170, Math.floor(rect.height || 210));

      canvasEl.width = Math.floor(cssW * dpr);
      canvasEl.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      game.groundY = Math.floor(cssH * CFG.groundRatio);
      game.player.y = game.groundY - game.player.h;
    });
  }

  function spawnObstacle(canvasWidth) {
    var tall = Math.random() > 0.55;
    var width = tall ? randomBetween(12, 18) : randomBetween(18, 30);
    var height = tall ? randomBetween(28, 42) : randomBetween(18, 28);

    game.obstacles.push({
      x: canvasWidth + randomBetween(10, 42),
      w: width,
      h: height
    });
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function jump() {
    if (!game.running || game.over) return;
    if (!game.player.onGround) return;
    game.player.vy = -CFG.jumpVelocity;
    game.player.onGround = false;
  }

  function restart() {
    resetGameState();
    startLoop();
  }

  function endGame() {
    game.over = true;
    game.running = false;
    if (gameOverEl) gameOverEl.hidden = false;

    var scoreFloor = Math.floor(game.score);
    if (scoreFloor > game.best) {
      game.best = scoreFloor;
      writeBestScore(scoreFloor);
      updateHud();
    }

    stopLoop();
  }

  function drawPlayer(x, y) {
    ctx.save();
    ctx.fillStyle = '#f3f3f3';
    ctx.fillRect(x + 7, y + 3, 13, 12);
    ctx.fillRect(x + 18, y + 8, 9, 7);
    ctx.fillRect(x + 5, y + 15, 20, 9);
    ctx.fillRect(x + 3, y + 21, 12, 8);
    ctx.fillRect(x + 17, y + 21, 8, 8);
    ctx.fillRect(x + 8, y + 29, 4, 6);
    ctx.fillRect(x + 18, y + 29, 4, 6);
    ctx.fillStyle = '#101010';
    ctx.fillRect(x + 21, y + 11, 2, 2);
    ctx.restore();
  }

  function drawObstacle(ob) {
    var baseY = game.groundY - ob.h;
    ctx.save();
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(ob.x, baseY, ob.w, ob.h);
    if (ob.h > 30) {
      ctx.fillRect(ob.x - 5, baseY + 8, 6, 4);
      ctx.fillRect(ob.x + ob.w - 1, baseY + 12, 6, 4);
    }
    ctx.restore();
  }

  function renderBackground(width, height) {
    ctx.clearRect(0, 0, width, height);

    var sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#0a0a0a');
    sky.addColorStop(0.62, '#1a1a1a');
    sky.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    for (var i = 0; i < sceneStars.length; i += 1) {
      var s = sceneStars[i];
      var sx = ((s.x * width) - (sceneShift * s.layer)) % width;
      if (sx < 0) sx += width;
      var sy = s.y * height;
      ctx.fillStyle = 'rgba(245, 245, 245, 0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    var horizon = ctx.createRadialGradient(width * 0.66, game.groundY - 10, 20, width * 0.66, game.groundY - 10, 220);
    horizon.addColorStop(0, 'rgba(212, 212, 212, 0.6)');
    horizon.addColorStop(1, 'rgba(212, 212, 212, 0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, game.groundY - 120, width, 180);

    var grass = ctx.createLinearGradient(0, game.groundY, 0, height);
    grass.addColorStop(0, '#dadada');
    grass.addColorStop(0.22, '#9c9c9c');
    grass.addColorStop(0.52, '#353535');
    grass.addColorStop(1, '#0f0f0f');
    ctx.fillStyle = grass;
    ctx.fillRect(0, game.groundY, width, height - game.groundY);

    ctx.strokeStyle = 'rgba(228, 228, 228, 0.28)';
    for (var g = 0; g < width; g += 18) {
      var tilt = (Math.sin((g + sceneShift * 0.14) * 0.06) * 7);
      ctx.beginPath();
      ctx.moveTo(g, game.groundY + 2);
      ctx.lineTo(g + tilt, game.groundY - 10);
      ctx.stroke();
    }
  }

  function tick(ts) {
    if (!canvasEl || !ctx || !overlayEl) return;

    if (!lastTs) lastTs = ts;
    var dt = clamp((ts - lastTs) / 1000, 0.001, CFG.maxDelta);
    lastTs = ts;

    var width = canvasEl.clientWidth;
    var height = canvasEl.clientHeight;

    game.elapsed += dt;
    game.speed = Math.min(CFG.maxSpeed, CFG.baseSpeed + (game.elapsed * CFG.speedRamp));
    game.score += dt * CFG.scoreRate;
    updateHud();

    sceneShift += game.speed * dt * 0.3;

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnObstacle(width);
      var speedFactor = clamp((game.speed - CFG.baseSpeed) / (CFG.maxSpeed - CFG.baseSpeed), 0, 1);
      game.spawnTimer = randomBetween(CFG.spawnMin - (speedFactor * 0.22), CFG.spawnMax - (speedFactor * 0.25));
    }

    game.player.vy += CFG.gravity * dt;
    game.player.y += game.player.vy * dt;

    if (game.player.y >= game.groundY - game.player.h) {
      game.player.y = game.groundY - game.player.h;
      game.player.vy = 0;
      game.player.onGround = true;
    }

    for (var i = game.obstacles.length - 1; i >= 0; i -= 1) {
      var ob = game.obstacles[i];
      ob.x -= game.speed * dt;

      if (ob.x + ob.w < -8) {
        game.obstacles.splice(i, 1);
        continue;
      }

      var playerHitbox = {
        x: game.player.x + 3,
        y: game.player.y + 2,
        w: game.player.w - 6,
        h: game.player.h - 2
      };

      var obstacleHitbox = {
        x: ob.x + 1,
        y: game.groundY - ob.h,
        w: ob.w - 2,
        h: ob.h
      };

      if (intersects(playerHitbox, obstacleHitbox)) {
        endGame();
        break;
      }
    }

    renderBackground(width, height);
    drawPlayer(game.player.x, game.player.y);
    for (var j = 0; j < game.obstacles.length; j += 1) {
      drawObstacle(game.obstacles[j]);
    }

    if (game.running && !game.over) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startLoop() {
    stopLoop();
    lastTs = 0;
    game.running = true;
    game.over = false;
    rafId = requestAnimationFrame(tick);
  }

  function onKeyDown(event) {
    if (!overlayEl) return;
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      event.preventDefault();
      if (game.over) {
        restart();
      } else {
        jump();
      }
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      restart();
    }
  }

  function onPointerDown(event) {
    if (!overlayEl) return;
    if (!canvasEl) return;

    var target = event.target;
    if (target === restartBtn) return;
    if (gameOverEl && gameOverEl.contains(target)) return;

    if (game.over) {
      restart();
    } else {
      jump();
    }
  }

  function onVisibilityChange() {
    if (!overlayEl) return;

    if (document.hidden) {
      pausedByVisibility = game.running && !game.over;
      stopLoop();
      return;
    }

    if (pausedByVisibility && !game.over) {
      pausedByVisibility = false;
      startLoop();
    }
  }

  function unbindGameEvents() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('visibilitychange', onVisibilityChange);

    if (restartBtn) {
      restartBtn.removeEventListener('click', restart);
    }

  }

  function removeOverlay() {
    stopLoop();
    unbindGameEvents();

    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }

    restartBtn = null;
    canvasEl = null;
    ctx = null;
    scoreEl = null;
    bestEl = null;
    gameOverEl = null;
    pausedByVisibility = false;

    setGatedClass(false);
  }

  function mountOverlay() {
    if (overlayEl || !document.body) return;

    overlayEl = buildOverlay();
    document.body.appendChild(overlayEl);
    setGatedClass(true);

    restartBtn = overlayEl.querySelector('[data-restart]');
    canvasEl = overlayEl.querySelector('[data-canvas]');
    scoreEl = overlayEl.querySelector('[data-score]');
    bestEl = overlayEl.querySelector('[data-best]');
    gameOverEl = overlayEl.querySelector('[data-game-over]');

    if (!canvasEl) return;
    ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    createStars();
    resizeCanvas();

    game.best = readBestScore();
    updateHud();
    resetGameState();

    if (restartBtn) restartBtn.addEventListener('click', restart);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    document.addEventListener('visibilitychange', onVisibilityChange);

    startLoop();

    window.setTimeout(function () {
      if (restartBtn) restartBtn.focus();
    }, 0);
  }

  function evaluateGate() {
    if (!document.body) return;

    if (isBlockedViewport()) {
      mountOverlay();
      resizeCanvas();
    } else {
      removeOverlay();
    }
  }

  function init() {
    evaluateGate();
    window.addEventListener('resize', evaluateGate, { passive: true });
    window.addEventListener('orientationchange', evaluateGate, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
