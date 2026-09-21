export interface SandboxApp {
  id: string;
  title: string;
  prompt: string;
  code: string;
  category: 'game' | 'app' | 'tool';
  createdAt: number;
}

const STORAGE_KEY = 'adam_sandbox_apps';

const DEFAULT_SANDBOX_APPS: SandboxApp[] = [
  {
    id: 'space_shooter_3d',
    title: 'حرب الفضاء ثلاثية الأبعاد (3D Space Defender)',
    prompt: 'برمج لي لعبة حرب فضاء 3D تفاعلية مع ليزر ومؤثرات صوتية ونجوم متحركة وثلاثية الأبعاد',
    category: 'game',
    createdAt: Date.now() - 1800000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-select=none">
  <title>3D Space Defender</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020617;
      color: #38bdf8;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      user-select: none;
    }
    .game-container {
      position: relative;
      width: 100%;
      max-width: 480px;
      background: #0b0f19;
      border: 2px solid #0284c744;
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.2);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hud {
      width: 100%;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid #1e293b;
      font-size: 13px;
      font-weight: 700;
      z-index: 10;
    }
    .health-bar-container {
      width: 100px;
      height: 10px;
      background: #1e293b;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .health-bar {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #10b981);
      transition: width 0.2s ease;
    }
    canvas {
      display: block;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      cursor: crosshair;
      touch-action: none;
    }
    .touch-controls {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 10px 16px;
      background: rgba(15, 23, 42, 0.9);
      border-top: 1px solid #1e293b;
    }
    .btn {
      background: #1e293b;
      border: 1px solid #38bdf844;
      color: #38bdf8;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      touch-action: manipulation;
    }
    .btn:active { background: #38bdf8; color: #020617; }
    .btn-fire {
      background: linear-gradient(135deg, #e11d48, #be123c);
      color: #fff;
      border: none;
      box-shadow: 0 0 15px rgba(225, 29, 72, 0.4);
    }
    .btn-fire:active { background: #f43f5e; }
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(2, 6, 23, 0.88);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      z-index: 20;
      backdrop-filter: blur(4px);
    }
  </style>
</head>
<body>
  <div class="game-container">
    <div class="hud">
      <div>النقاط: <span id="score-val" style="color:#38bdf8;">0</span></div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span>الدرع:</span>
        <div class="health-bar-container">
          <div class="health-bar" id="health-bar"></div>
        </div>
      </div>
      <div>مستوى: <span id="level-val" style="color:#a855f7;">1</span></div>
    </div>

    <canvas id="game-canvas" width="440" height="460"></canvas>

    <div class="touch-controls">
      <button class="btn" id="btn-left">◀ يسار</button>
      <button class="btn btn-fire" id="btn-fire">🔥 إطلاق ليزر</button>
      <button class="btn" id="btn-right">يمين ▶</button>
    </div>

    <div class="overlay" id="overlay">
      <h2 style="font-size:22px; color:#38bdf8; font-weight:800;">🚀 3D Space Defender</h2>
      <p style="font-size:13px; color:#94a3b8; text-align:center; padding:0 20px;">
        تحكّم بالسفينة عبر الأسهم أو الأزرار، أطلق الليزر ودمر نيازك وسفن الفضاء المعادية!
      </p>
      <button class="btn btn-fire" style="padding:12px 30px; font-size:15px;" onclick="startGame()">
        ابدأ المعركة الفضائية 🎮
      </button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score-val');
    const healthEl = document.getElementById('health-bar');
    const levelEl = document.getElementById('level-val');
    const overlay = document.getElementById('overlay');

    // Web Audio Synthesizer
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function playLaserSound() {
      try {
        if (!audioCtx) audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch(e){}
    }

    function playExplodeSound() {
      try {
        if (!audioCtx) audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch(e){}
    }

    // Game state
    let player = { x: 220, y: 390, vx: 0, health: 100, maxHealth: 100 };
    let stars = [];
    let lasers = [];
    let enemies = [];
    let particles = [];
    let score = 0;
    let level = 1;
    let isRunning = false;
    let keys = {};

    // Generate 3D Starfield
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 800 + 1
      });
    }

    function spawnEnemy() {
      if (!isRunning) return;
      enemies.push({
        x: (Math.random() - 0.5) * 400,
        y: -100,
        z: 800,
        type: Math.random() > 0.4 ? 'drone' : 'asteroid',
        radius: 20 + Math.random() * 15,
        rot: 0,
        speed: 4 + level * 1.2
      });
    }

    function addExplosion(x, y, color) {
      playExplodeSound();
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          color: color || '#f59e0b'
        });
      }
    }

    function fireLaser() {
      if (!isRunning) return;
      playLaserSound();
      lasers.push({ x: player.x - 14, y: player.y - 10, vy: -12 });
      lasers.push({ x: player.x + 14, y: player.y - 10, vy: -12 });
    }

    function startGame() {
      player = { x: 220, y: 390, vx: 0, health: 100, maxHealth: 100 };
      lasers = [];
      enemies = [];
      particles = [];
      score = 0;
      level = 1;
      scoreEl.innerText = score;
      healthEl.style.width = '100%';
      levelEl.innerText = level;
      isRunning = true;
      overlay.style.display = 'none';
    }

    function gameOver() {
      isRunning = false;
      overlay.style.display = 'flex';
      overlay.innerHTML = \`
        <h2 style="font-size:22px; color:#ef4444; font-weight:800;">💥 تحطمت سفينتك!</h2>
        <p style="font-size:14px; color:#e2e8f0;">النقاط النهائية: <strong style="color:#38bdf8;">\${score}</strong> | المستوى: \${level}</p>
        <button class="btn btn-fire" style="padding:12px 30px; font-size:15px;" onclick="startGame()">
          إعادة المحاولة 🔄
        </button>
      \`;
    }

    // Controls
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        fireLaser();
      }
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });

    // Touch controls
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnFire = document.getElementById('btn-fire');

    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowLeft'] = true; });
    btnLeft.addEventListener('touchend', () => { keys['ArrowLeft'] = false; });
    btnLeft.addEventListener('mousedown', () => { keys['ArrowLeft'] = true; });
    btnLeft.addEventListener('mouseup', () => { keys['ArrowLeft'] = false; });

    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowRight'] = true; });
    btnRight.addEventListener('touchend', () => { keys['ArrowRight'] = false; });
    btnRight.addEventListener('mousedown', () => { keys['ArrowRight'] = true; });
    btnRight.addEventListener('mouseup', () => { keys['ArrowRight'] = false; });

    btnFire.addEventListener('click', () => { fireLaser(); });

    // Enemy spawn interval
    setInterval(spawnEnemy, 1100);

    function update() {
      if (!isRunning) return;

      // Player Movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= 7;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += 7;
      player.x = Math.max(30, Math.min(canvas.width - 30, player.x));

      // Stars in 3D
      stars.forEach(star => {
        star.z -= 6 + level * 2;
        if (star.z <= 1) {
          star.z = 800;
          star.x = (Math.random() - 0.5) * 600;
          star.y = (Math.random() - 0.5) * 600;
        }
      });

      // Lasers
      lasers.forEach(l => { l.y += l.vy; });
      lasers = lasers.filter(l => l.y > -20);

      // Enemies 3D perspective projection
      enemies.forEach((enemy, eIdx) => {
        enemy.z -= enemy.speed;
        enemy.rot += 0.04;

        // 3D to 2D projection
        const k = 300 / Math.max(1, enemy.z);
        const screenX = canvas.width / 2 + enemy.x * k;
        const screenY = 160 + enemy.y * k + (800 - enemy.z) * 0.35;
        const screenRadius = enemy.radius * k;

        // Collision with Lasers
        lasers.forEach((laser, lIdx) => {
          const dist = Math.hypot(laser.x - screenX, laser.y - screenY);
          if (dist < screenRadius + 10 && enemy.z < 700) {
            addExplosion(screenX, screenY, enemy.type === 'drone' ? '#38bdf8' : '#fb923c');
            enemies.splice(eIdx, 1);
            lasers.splice(lIdx, 1);
            score += enemy.type === 'drone' ? 25 : 15;
            scoreEl.innerText = score;
            if (score > level * 150) {
              level++;
              levelEl.innerText = level;
            }
          }
        });

        // Collision with Player
        if (enemy.z < 80 && Math.hypot(player.x - screenX, player.y - screenY) < 35) {
          addExplosion(player.x, player.y, '#ef4444');
          enemies.splice(eIdx, 1);
          player.health -= 25;
          healthEl.style.width = Math.max(0, player.health) + '%';
          if (player.health <= 0) {
            gameOver();
          }
        }
      });
      enemies = enemies.filter(e => e.z > 10);

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
      });
      particles = particles.filter(p => p.life > 0);
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw 3D Starfield
      stars.forEach(star => {
        const k = 280 / star.z;
        const px = canvas.width / 2 + star.x * k;
        const py = canvas.height / 2 + star.y * k;
        const size = Math.max(1, (1 - star.z / 800) * 3);
        const alpha = Math.max(0.2, (1 - star.z / 800));

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          ctx.fillStyle = \`rgba(255, 255, 255, \${alpha})\`;
          ctx.fillRect(px, py, size, size);
        }
      });

      // Draw Enemies
      enemies.forEach(enemy => {
        const k = 300 / Math.max(1, enemy.z);
        const screenX = canvas.width / 2 + enemy.x * k;
        const screenY = 160 + enemy.y * k + (800 - enemy.z) * 0.35;
        const r = Math.max(4, enemy.radius * k);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(enemy.rot);

        if (enemy.type === 'drone') {
          // Cyber Drone
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r, r);
          ctx.lineTo(-r, r);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Red core
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Asteroid
          ctx.strokeStyle = '#f59e0b';
          ctx.fillStyle = '#292524';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Lasers
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      lasers.forEach(l => {
        ctx.fillRect(l.x - 2, l.y, 4, 16);
      });
      ctx.shadowBlur = 0;

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Player Space Fighter Ship
      if (isRunning) {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Thruster flame
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-8, 16);
        ctx.lineTo(0, 26 + Math.random() * 8);
        ctx.lineTo(8, 16);
        ctx.closePath();
        ctx.fill();

        // Ship body
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(20, 16);
        ctx.lineTo(0, 8);
        ctx.lineTo(-20, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    function loop() {
      update();
      render();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'cyber_breakout',
    title: 'تكسير الكتل سايبربانك (Cyberpunk Breakout 2026)',
    prompt: 'اصنع لي لعبة تكسير كتل نيون Breakout مع مضرب وفيزياء ارتداد ومؤثرات صوتية ومكافآت',
    category: 'game',
    createdAt: Date.now() - 2500000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyberpunk Breakout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030712;
      color: #10b981;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      user-select: none;
      padding: 10px;
    }
    .card {
      background: #0f172a;
      border: 2px solid #10b98133;
      border-radius: 20px;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.15);
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      max-width: 440px;
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 14px;
      font-weight: 700;
      color: #34d399;
    }
    canvas {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      cursor: crosshair;
      touch-action: none;
    }
    .btn {
      background: #059669;
      color: #022c22;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-weight: 800;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span>النقاط: <span id="score">0</span></span>
      <span>المحاولات: <span id="lives">❤️❤️❤️</span></span>
    </div>
    <canvas id="canvas" width="380" height="420"></canvas>
    <div style="font-size:12px; color:#94a3b8;" id="status">حرّك المضرب بالماوس أو اللمس 🕹️</div>
    <button class="btn" onclick="initGame()">إعادة اللعبة 🔄</button>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const statusEl = document.getElementById('status');

    let paddle = { x: 150, y: 390, w: 80, h: 12 };
    let ball = { x: 190, y: 250, vx: 4, vy: -4, radius: 6 };
    let bricks = [];
    let score = 0;
    let lives = 3;
    let gameOver = false;

    // Web Audio FX
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audio = null;
    function beep(freq, duration) {
      try {
        if (!audio) audio = new AudioCtx();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.setValueAtTime(freq, audio.currentTime);
        gain.gain.setValueAtTime(0.15, audio.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audio.currentTime + duration);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + duration);
      } catch(e){}
    }

    function initBricks() {
      bricks = [];
      const rows = 5;
      const cols = 6;
      const colors = ['#f43f5e', '#fb923c', '#facc15', '#38bdf8', '#10b981'];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: c * 60 + 14,
            y: r * 22 + 40,
            w: 52,
            h: 16,
            color: colors[r],
            alive: true
          });
        }
      }
    }

    function initGame() {
      paddle = { x: 150, y: 390, w: 80, h: 12 };
      ball = { x: 190, y: 250, vx: 4, vy: -4, radius: 6 };
      score = 0;
      lives = 3;
      gameOver = false;
      scoreEl.innerText = score;
      livesEl.innerText = '❤️❤️❤️';
      statusEl.innerText = 'استمر في اللعب! 🔥';
      initBricks();
    }

    function movePaddle(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, x - paddle.w / 2));
    }

    canvas.addEventListener('mousemove', e => movePaddle(e.clientX));
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches[0]) movePaddle(e.touches[0].clientX);
    });

    initGame();

    function update() {
      if (gameOver) return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Walls
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.vx = -ball.vx;
        beep(300, 0.05);
      }
      if (ball.y - ball.radius < 0) {
        ball.vy = -ball.vy;
        beep(350, 0.05);
      }

      // Bottom death
      if (ball.y + ball.radius > canvas.height) {
        lives--;
        beep(120, 0.2);
        if (lives <= 0) {
          livesEl.innerText = '💀';
          gameOver = true;
          statusEl.innerText = 'انتهت المحاولات! اضغط إعادة اللعبة 🔄';
          return;
        }
        livesEl.innerText = '❤️'.repeat(lives);
        ball.x = 190;
        ball.y = 250;
        ball.vy = -4;
      }

      // Paddle collision
      if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.h &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w
      ) {
        const hitOffset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hitOffset * 5.5;
        ball.vy = -Math.abs(ball.vy);
        beep(500, 0.08);
      }

      // Brick collisions
      bricks.forEach(b => {
        if (!b.alive) return;
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + b.w &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + b.h
        ) {
          b.alive = false;
          ball.vy = -ball.vy;
          score += 20;
          scoreEl.innerText = score;
          beep(650, 0.08);
        }
      });

      if (bricks.every(b => !b.alive)) {
        gameOver = true;
        statusEl.innerText = '🏆 فزت بالمرحلة بالكامل! أحسنت!';
      }
    }

    function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bricks
      bricks.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // Paddle
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'snake_game',
    title: 'لعبة الثعبان الكلاسيكية (Retro Snake)',
    prompt: 'اصنع لي لعبة ثعبان كلاسيكية مع عداد نقاط وألوان نيون وحفظ أعلى نتيجة',
    category: 'game',
    createdAt: Date.now() - 3600000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snake Game</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #00ffaa;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 12px;
      user-select: none;
    }
    .game-box {
      background: #111827;
      border: 2px solid #00ffaa33;
      box-shadow: 0 0 25px rgba(0,255,170,0.15);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      max-width: 440px;
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 14px;
      font-weight: 700;
    }
    canvas {
      background: #030712;
      border: 1px solid #1f2937;
      border-radius: 10px;
      max-width: 100%;
    }
    .controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      width: 160px;
      margin-top: 4px;
    }
    .btn {
      background: #1f2937;
      color: #00ffaa;
      border: 1px solid #374151;
      padding: 10px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      text-align: center;
    }
    .btn:active { background: #00ffaa; color: #000; }
    .status { font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="game-box">
    <div class="header">
      <span>النقاط: <span id="score">0</span></span>
      <span>أعلى نتيجة: <span id="high">0</span></span>
    </div>
    <canvas id="canvas" width="360" height="360"></canvas>
    <div class="status" id="status">استخدم الأسهم أو الأزرار للتحكم 🎮</div>
    <div class="controls">
      <div></div>
      <button class="btn" onclick="changeDir('UP')">⬆️</button>
      <div></div>
      <button class="btn" onclick="changeDir('LEFT')">⬅️</button>
      <button class="btn" onclick="changeDir('DOWN')">⬇️</button>
      <button class="btn" onclick="changeDir('RIGHT')">➡️</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const grid = 18;
    let snake = [{x: 9, y: 9}];
    let dir = 'RIGHT';
    let nextDir = 'RIGHT';
    let food = {x: 15, y: 15};
    let score = 0;
    let high = localStorage.getItem('snake_high') || 0;
    document.getElementById('high').innerText = high;
    let gameOver = false;

    function randomFood() {
      return {
        x: Math.floor(Math.random() * (canvas.width / grid)),
        y: Math.floor(Math.random() * (canvas.height / grid))
      };
    }

    function changeDir(d) {
      if (gameOver) { reset(); return; }
      if (d === 'UP' && dir !== 'DOWN') nextDir = 'UP';
      if (d === 'DOWN' && dir !== 'UP') nextDir = 'DOWN';
      if (d === 'LEFT' && dir !== 'RIGHT') nextDir = 'LEFT';
      if (d === 'RIGHT' && dir !== 'LEFT') nextDir = 'RIGHT';
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') changeDir('UP');
      if (e.key === 'ArrowDown') changeDir('DOWN');
      if (e.key === 'ArrowLeft') changeDir('LEFT');
      if (e.key === 'ArrowRight') changeDir('RIGHT');
    });

    function reset() {
      snake = [{x: 9, y: 9}];
      dir = 'RIGHT';
      nextDir = 'RIGHT';
      food = randomFood();
      score = 0;
      gameOver = false;
      document.getElementById('score').innerText = score;
      document.getElementById('status').innerText = 'استمر في اللعب! 🔥';
    }

    function update() {
      if (gameOver) return;
      dir = nextDir;
      const head = { ...snake[0] };
      if (dir === 'UP') head.y--;
      if (dir === 'DOWN') head.y++;
      if (dir === 'LEFT') head.x--;
      if (dir === 'RIGHT') head.x++;

      const maxGridX = canvas.width / grid;
      const maxGridY = canvas.height / grid;

      if (head.x < 0 || head.x >= maxGridX || head.y < 0 || head.y >= maxGridY || snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver = true;
        document.getElementById('status').innerText = 'انتهت اللعبة! اضغط أي زر لإعادة البدء 🔄';
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').innerText = score;
        if (score > high) {
          high = score;
          localStorage.setItem('snake_high', high);
          document.getElementById('high').innerText = high;
        }
        food = randomFood();
      } else {
        snake.pop();
      }
    }

    function draw() {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Food
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(food.x * grid + 1, food.y * grid + 1, grid - 2, grid - 2);

      // Snake
      ctx.shadowBlur = 8;
      snake.forEach((s, idx) => {
        ctx.fillStyle = idx === 0 ? '#10b981' : '#059669';
        ctx.shadowColor = '#10b981';
        ctx.fillRect(s.x * grid + 1, s.y * grid + 1, grid - 2, grid - 2);
      });
      ctx.shadowBlur = 0;
    }

    setInterval(() => {
      update();
      draw();
    }, 120);
  </script>
</body>
</html>`
  },
  {
    id: 'tic_tac_toe',
    title: 'لعبة إكس أو التفاعلية (Tic-Tac-Toe AI)',
    prompt: 'برمج لي لعبة XO تفاعلية مع ذكاء اصطناعي وتصميم داكن أنيق',
    category: 'game',
    createdAt: Date.now() - 7200000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tic Tac Toe</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 380px;
      width: 100%;
    }
    h1 { font-size: 20px; color: #38bdf8; }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
      aspect-ratio: 1;
    }
    .cell {
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 12px;
      font-size: 36px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cell:hover { background: #1e293b; border-color: #38bdf8; }
    .cell.x { color: #f43f5e; }
    .cell.o { color: #10b981; }
    .status { font-size: 14px; font-weight: 600; color: #94a3b8; }
    .reset-btn {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>لعبة إكس أو (X / O)</h1>
    <div class="status" id="status">دورك للعب (X)</div>
    <div class="board" id="board">
      <div class="cell" onclick="makeMove(0)"></div>
      <div class="cell" onclick="makeMove(1)"></div>
      <div class="cell" onclick="makeMove(2)"></div>
      <div class="cell" onclick="makeMove(3)"></div>
      <div class="cell" onclick="makeMove(4)"></div>
      <div class="cell" onclick="makeMove(5)"></div>
      <div class="cell" onclick="makeMove(6)"></div>
      <div class="cell" onclick="makeMove(7)"></div>
      <div class="cell" onclick="makeMove(8)"></div>
    </div>
    <button class="reset-btn" onclick="resetGame()">إعادة اللعب 🔄</button>
  </div>

  <script>
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let active = true;

    const wins = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];

    function makeMove(idx) {
      if (!active || board[idx] !== '') return;
      board[idx] = 'X';
      render();

      if (checkWin('X')) {
        document.getElementById('status').innerText = '🎉 مبروك! لقد فزت!';
        active = false;
        return;
      }

      if (board.every(c => c !== '')) {
        document.getElementById('status').innerText = 'تعادل! 🤝';
        active = false;
        return;
      }

      // Simple AI Move
      document.getElementById('status').innerText = 'الخصم يفكر...';
      active = false;
      setTimeout(() => {
        const emptyIndices = board.map((val, i) => val === '' ? i : null).filter(val => val !== null);
        if (emptyIndices.length > 0) {
          const aiMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          board[aiMove] = 'O';
          render();
          if (checkWin('O')) {
            document.getElementById('status').innerText = 'فاز الخصم (O) 🤖';
          } else if (board.every(c => c !== '')) {
            document.getElementById('status').innerText = 'تعادل! 🤝';
          } else {
            document.getElementById('status').innerText = 'دورك للعب (X)';
            active = true;
          }
        }
      }, 400);
    }

    function checkWin(player) {
      return wins.some(combo => combo.every(idx => board[idx] === player));
    }

    function render() {
      const cells = document.querySelectorAll('.cell');
      cells.forEach((cell, idx) => {
        cell.innerText = board[idx];
        cell.className = 'cell ' + (board[idx] ? board[idx].toLowerCase() : '');
      });
    }

    function resetGame() {
      board = ['', '', '', '', '', '', '', '', ''];
      active = true;
      document.getElementById('status').innerText = 'دورك للعب (X)';
      render();
    }
  </script>
</body>
</html>`
  },
  {
    id: 'calculator_app',
    title: 'الآلة الحاسبة الذكية (Smart Calculator)',
    prompt: 'برمج لي آلة حاسبة تفاعلية عصرية بتصميم داكن نيون وحساب العمليات المباشرة',
    category: 'app',
    createdAt: Date.now() - 10800000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Calculator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .calc-card {
      background: #111827;
      border: 1px solid #10b98144;
      border-radius: 24px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      color: #10b981;
      display: flex;
      justify-content: space-between;
    }
    .screen {
      background: #030712;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 18px 16px;
      text-align: left;
      direction: ltr;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      word-break: break-all;
    }
    .history { font-size: 13px; color: #6b7280; min-height: 18px; }
    .display { font-size: 32px; font-weight: 800; color: #f9fafb; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    button {
      background: #1f2937;
      color: #e5e7eb;
      border: 1px solid #374151;
      border-radius: 14px;
      padding: 16px 0;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.1s;
    }
    button:active { transform: scale(0.96); filter: brightness(1.2); }
    button.op { background: #064e3b; color: #34d399; border-color: #059669; }
    button.eq { background: #10b981; color: #022c22; border-color: #34d399; font-weight: 900; }
    button.clear { background: #7f1d1d; color: #f87171; border-color: #991b1b; }
  </style>
</head>
<body>
  <div class="calc-card">
    <div class="title">
      <span>ADEM Smart Calc</span>
      <span>⚡ Neon Edition</span>
    </div>
    <div class="screen">
      <div class="history" id="history"></div>
      <div class="display" id="display">0</div>
    </div>
    <div class="grid">
      <button class="clear" onclick="clearAll()">C</button>
      <button class="op" onclick="append('(')">(</button>
      <button class="op" onclick="append(')')">)</button>
      <button class="op" onclick="append('/')">÷</button>

      <button onclick="append('7')">7</button>
      <button onclick="append('8')">8</button>
      <button onclick="append('9')">9</button>
      <button class="op" onclick="append('*')">×</button>

      <button onclick="append('4')">4</button>
      <button onclick="append('5')">5</button>
      <button onclick="append('6')">6</button>
      <button class="op" onclick="append('-')">−</button>

      <button onclick="append('1')">1</button>
      <button onclick="append('2')">2</button>
      <button onclick="append('3')">3</button>
      <button class="op" onclick="append('+')">+</button>

      <button onclick="append('0')">0</button>
      <button onclick="append('.')">.</button>
      <button class="clear" onclick="backspace()">⌫</button>
      <button class="eq" onclick="calculate()">=</button>
    </div>
  </div>

  <script>
    let expr = '';
    const display = document.getElementById('display');
    const history = document.getElementById('history');

    function append(char) {
      if (expr === '0' && char !== '.') expr = '';
      expr += char;
      display.innerText = expr;
    }

    function clearAll() {
      expr = '';
      display.innerText = '0';
      history.innerText = '';
    }

    function backspace() {
      expr = expr.slice(0, -1);
      display.innerText = expr || '0';
    }

    function calculate() {
      try {
        if (!expr) return;
        history.innerText = expr;
        const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/');
        const sanitized = normalized.replace(/[^0-9+\-*/().]/g, '');
        const res = Function('"use strict"; return (' + sanitized + ');')();
        if (isNaN(res) || !isFinite(res)) throw new Error('Invalid');
        display.innerText = res;
        expr = String(res);
      } catch (e) {
        display.innerText = 'خطأ';
        expr = '';
      }
    }
  </script>
</body>
</html>`
  },
  {
    id: 'drawing_canvas',
    title: 'استوديو الرسم الرقمي النيون (Neon Drawing Studio)',
    prompt: 'برمج لي تطبيق رسم رقمي تفاعلي مع لوحة ألوان نيون وممحاة وتحكم بحجم الفرشاة وحفظ العمل كصورة',
    category: 'app',
    createdAt: Date.now() - 18000000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Drawing Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #070a12;
      color: #f1f5f9;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 12px;
      user-select: none;
    }
    .studio {
      width: 100%;
      max-width: 600px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #1e293b;
      padding: 10px 14px;
      border-radius: 14px;
    }
    .palette {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .color-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .color-btn.active {
      border-color: #ffffff;
      transform: scale(1.25);
    }
    .tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    button.tool-btn {
      background: #334155;
      color: #f8fafc;
      border: 1px solid #475569;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.15s;
    }
    button.tool-btn:hover { background: #475569; }
    button.tool-btn.active { background: #10b981; color: #022c22; }
    canvas {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      cursor: crosshair;
      touch-action: none;
      width: 100%;
      height: 380px;
    }
  </style>
</head>
<body>
  <div class="studio">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-size:14px; font-weight:800; color:#10b981;">🎨 استوديو الرسم النيون</h3>
      <span style="font-size:11px; color:#94a3b8;">ADEM Creative Canvas</span>
    </div>
    
    <div class="toolbar">
      <div class="palette">
        <div class="color-btn active" style="background:#10b981;" onclick="setColor('#10b981', this)"></div>
        <div class="color-btn" style="background:#38bdf8;" onclick="setColor('#38bdf8', this)"></div>
        <div class="color-btn" style="background:#f43f5e;" onclick="setColor('#f43f5e', this)"></div>
        <div class="color-btn" style="background:#facc15;" onclick="setColor('#facc15', this)"></div>
        <div class="color-btn" style="background:#a855f7;" onclick="setColor('#a855f7', this)"></div>
        <div class="color-btn" style="background:#ffffff;" onclick="setColor('#ffffff', this)"></div>
      </div>
      
      <div class="tools">
        <input type="range" id="size" min="2" max="30" value="4" style="width:70px;" onchange="brushSize=this.value">
        <button class="tool-btn" onclick="clearCanvas()">مسح 🗑️</button>
        <button class="tool-btn" style="background:#059669; color:#fff;" onclick="saveImage()">حفظ 📥</button>
      </div>
    </div>

    <canvas id="canvas"></canvas>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let painting = false;
    let currentColor = '#10b981';
    let brushSize = 4;

    function resize() {
      canvas.width = canvas.parentElement.clientWidth - 32;
      canvas.height = 380;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    function setColor(color, el) {
      currentColor = color;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
    }

    function startPosition(e) {
      painting = true;
      draw(e);
    }
    function finishedPosition() {
      painting = false;
      ctx.beginPath();
    }
    function draw(e) {
      if (!painting) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = currentColor;
      ctx.shadowColor = currentColor;
      ctx.shadowBlur = 8;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', finishedPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchstart', startPosition);
    canvas.addEventListener('touchend', finishedPosition);
    canvas.addEventListener('touchmove', draw);

    function clearCanvas() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0;
    }

    function saveImage() {
      const link = document.createElement('a');
      link.download = 'adem_drawing.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  </script>
</body>
</html>`
  },
  {
    id: 'unit_converter',
    title: 'محول الوحدات والعملات (Smart Converter)',
    prompt: 'برمج لي محول وحدات تفاعلي وسهل الاستخدام يشمل العملات والطول والوزن والحرارة',
    category: 'tool',
    createdAt: Date.now() - 21600000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Converter</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #111827;
      border: 1px solid #0284c744;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .title { font-size: 15px; font-weight: 800; color: #38bdf8; display: flex; justify-content: space-between; }
    .tabs { display: flex; gap: 6px; background: #030712; padding: 4px; border-radius: 12px; }
    .tab { flex: 1; border: 0; background: transparent; color: #94a3b8; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; }
    .tab.active { background: #0284c7; color: #fff; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 11px; color: #94a3b8; }
    input, select { background: #1f2937; border: 1px solid #374151; color: #fff; padding: 12px; border-radius: 10px; font-size: 14px; outline: none; }
    .result-box { background: #082f49; border: 1px solid #0284c7; padding: 16px; border-radius: 12px; text-align: center; }
    .result-val { font-size: 24px; font-weight: 800; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">
      <span>محول الوحدات الذكي</span>
      <span>⚡ Multi-Converter</span>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="setMode('currency', this)">عملات</button>
      <button class="tab" onclick="setMode('length', this)">طول</button>
      <button class="tab" onclick="setMode('weight', this)">وزن</button>
    </div>
    
    <div class="input-group">
      <label>القيمة للتحويل:</label>
      <input type="number" id="val" value="100" oninput="calc()">
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
      <div class="input-group">
        <label>من:</label>
        <select id="from" onchange="calc()"></select>
      </div>
      <div class="input-group">
        <label>إلى:</label>
        <select id="to" onchange="calc()"></select>
      </div>
    </div>

    <div class="result-box">
      <div style="font-size:11px; color:#7dd3fc; margin-bottom:4px;">النتيجة الدقيقة:</div>
      <div class="result-val" id="res">--</div>
    </div>
  </div>

  <script>
    let mode = 'currency';
    const data = {
      currency: {
        units: ['USD (دولار)', 'EUR (يورو)', 'SAR (ريال سعودي)', 'AED (درهم إماراتي)', 'DZD (دينار جزائري)'],
        rates: { 'USD (دولار)': 1, 'EUR (يورو)': 0.92, 'SAR (ريال سعودي)': 3.75, 'AED (درهم إماراتي)': 3.67, 'DZD (دينار جزائري)': 134.5 }
      },
      length: {
        units: ['متر (m)', 'كيلومتر (km)', 'سنتيمتر (cm)', 'ميل (mi)', 'قدم (ft)'],
        rates: { 'متر (m)': 1, 'كيلومتر (km)': 0.001, 'سنتيمتر (cm)': 100, 'ميل (mi)': 0.000621371, 'قدم (ft)': 3.28084 }
      },
      weight: {
        units: ['كيلوغرام (kg)', 'غرام (g)', 'باوند (lb)', 'أونصة (oz)'],
        rates: { 'كيلوغرام (kg)': 1, 'غرام (g)': 1000, 'باوند (lb)': 2.20462, 'أونصة (oz)': 35.274 }
      }
    };

    function setMode(m, el) {
      mode = m;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      renderOptions();
    }

    function renderOptions() {
      const from = document.getElementById('from');
      const to = document.getElementById('to');
      from.innerHTML = ''; to.innerHTML = '';
      data[mode].units.forEach((u, i) => {
        from.innerHTML += '<option value="' + u + '" ' + (i===0?'selected':'') + '>' + u + '</option>';
        to.innerHTML += '<option value="' + u + '" ' + (i===1?'selected':'') + '>' + u + '</option>';
      });
      calc();
    }

    function calc() {
      const val = parseFloat(document.getElementById('val').value) || 0;
      const f = document.getElementById('from').value;
      const t = document.getElementById('to').value;
      const rates = data[mode].rates;
      if (!rates[f] || !rates[t]) return;
      const inBase = val / rates[f];
      const out = inBase * rates[t];
      document.getElementById('res').innerText = (Math.round(out * 100) / 100).toLocaleString();
    }

    renderOptions();
  </script>
</body>
</html>`
  },
  {
    id: 'pomodoro_executive',
    title: 'مؤقت التركيز والإنتاجية التنفيذي (Executive Pomodoro 2026)',
    prompt: 'برمج لي مؤقت تركيز بومودورو تنفيذي راقي مع تحكم بالأصوات وإحصائيات جلسات العمل والراحة',
    category: 'app',
    createdAt: Date.now() - 900000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Focus Timer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060b0e;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: #0c1419;
      border: 1px solid #10b98133;
      border-radius: 28px;
      padding: 28px 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.06);
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.3);
      color: #34d399;
      font-size: 11px;
      font-weight: 700;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .modes {
      display: flex;
      gap: 6px;
      background: #060b0e;
      padding: 4px;
      border-radius: 14px;
      margin-bottom: 24px;
      border: 1px solid #1e293b;
    }
    .mode-btn {
      flex: 1;
      padding: 8px;
      border: 0;
      background: transparent;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .mode-btn.active {
      background: #10b981;
      color: #04110b;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }
    .timer-ring {
      position: relative;
      width: 220px;
      height: 220px;
      margin: 0 auto 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: radial-gradient(circle, #0e1a20 60%, #060b0e 100%);
      border: 3px solid #10b98144;
      box-shadow: 0 0 30px rgba(16,185,129,0.15);
    }
    .time {
      font-size: 48px;
      font-weight: 900;
      font-family: monospace;
      color: #f8fafc;
      letter-spacing: -2px;
    }
    .status-text {
      font-size: 11px;
      color: #10b981;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .controls {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .btn {
      padding: 12px 28px;
      border: 0;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-start {
      background: #10b981;
      color: #04110b;
      box-shadow: 0 4px 16px rgba(16,185,129,0.4);
    }
    .btn-start:hover { background: #34d399; }
    .btn-reset {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-reset:hover { background: #334155; }
    .stats {
      display: flex;
      justify-content: space-around;
      border-top: 1px solid #1e293b;
      padding-top: 16px;
      font-size: 12px;
      color: #94a3b8;
    }
    .stat-val { font-size: 18px; font-weight: 800; color: #f8fafc; display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">⚡ ADAM EXECUTIVE POMODORO</div>
    <div class="modes">
      <button class="mode-btn active" onclick="setMode('work')">تركيز عمل (25m)</button>
      <button class="mode-btn" onclick="setMode('short')">استراحة قصيرة (5m)</button>
      <button class="mode-btn" onclick="setMode('long')">استراحة مطولة (15m)</button>
    </div>
    <div class="timer-ring">
      <div class="time" id="display">25:00</div>
      <div class="status-text" id="status">جاهز للبدء</div>
    </div>
    <div class="controls">
      <button class="btn btn-start" id="startBtn" onclick="toggleTimer()">بدء الجلسة</button>
      <button class="btn btn-reset" onclick="resetTimer()">إعادة ضبط</button>
    </div>
    <div class="stats">
      <div><span class="stat-val" id="completedCount">0</span>جلسات مكتملة</div>
      <div><span class="stat-val" id="focusMinutes">0</span>دقيقة تركيز</div>
    </div>
  </div>
  <script>
    let durations = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
    let currentMode = 'work';
    let timeLeft = durations.work;
    let timer = null;
    let completed = 0;
    let totalMinutes = 0;

    function playBeep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch(e) {}
    }

    function updateDisplay() {
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      document.getElementById('display').innerText = m + ':' + s;
    }

    function setMode(mode) {
      if (timer) clearInterval(timer);
      timer = null;
      currentMode = mode;
      timeLeft = durations[mode];
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('startBtn').innerText = 'بدء الجلسة';
      document.getElementById('status').innerText = mode === 'work' ? 'جلسة تركيز' : 'فترة استراحة';
      updateDisplay();
    }

    function toggleTimer() {
      const btn = document.getElementById('startBtn');
      if (timer) {
        clearInterval(timer);
        timer = null;
        btn.innerText = 'استئناف';
        document.getElementById('status').innerText = 'مؤقت متوقف';
      } else {
        btn.innerText = 'إيقاف مؤقت';
        document.getElementById('status').innerText = currentMode === 'work' ? 'جارٍ التركيز...' : 'استراحة نشطة...';
        timer = setInterval(() => {
          if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
          } else {
            clearInterval(timer);
            timer = null;
            playBeep();
            if (currentMode === 'work') {
              completed++;
              totalMinutes += 25;
              document.getElementById('completedCount').innerText = completed;
              document.getElementById('focusMinutes').innerText = totalMinutes;
              alert('ممتاز! أنهيت جلسة التركيز بنجاح.');
              setMode('short');
            } else {
              alert('انتهت الاستراحة، حان وقت استئناف العمل!');
              setMode('work');
            }
          }
        }, 1000);
      }
    }

    function resetTimer() {
      if (timer) clearInterval(timer);
      timer = null;
      timeLeft = durations[currentMode];
      document.getElementById('startBtn').innerText = 'بدء الجلسة';
      document.getElementById('status').innerText = 'جاهز للبدء';
      updateDisplay();
    }
  </script>
</body>
</html>`
  },
  {
    id: 'markdown_pro_editor',
    title: 'محرر ومصمم ماركداون الاحترافي (Markdown Live Pro)',
    prompt: 'برمج لي محرر نصوص Markdown احترافي وسريع مع معاينة حية وتصدير وحساب الكلمات',
    category: 'tool',
    createdAt: Date.now() - 400000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Live Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030712;
      color: #f3f4f6;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      padding: 12px 20px;
      background: #0b0f19;
      border-bottom: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-size: 14px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 8px; }
    .toolbar { display: flex; gap: 8px; align-items: center; }
    .btn {
      background: #111827;
      border: 1px solid #374151;
      color: #e5e7eb;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn:hover { background: #1f2937; color: #10b981; }
    .main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
    }
    @media(max-width: 680px) { .main { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
    textarea {
      width: 100%;
      height: 100%;
      background: #080d1a;
      color: #93c5fd;
      border: 0;
      border-left: 1px solid #1f2937;
      padding: 16px;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      outline: none;
    }
    .preview {
      width: 100%;
      height: 100%;
      padding: 20px;
      overflow-y: auto;
      background: #030712;
      line-height: 1.7;
    }
    .preview h1 { font-size: 22px; color: #10b981; margin-bottom: 12px; border-bottom: 1px solid #1f2937; padding-bottom: 6px; }
    .preview h2 { font-size: 18px; color: #38bdf8; margin: 16px 0 8px; }
    .preview p { margin-bottom: 12px; color: #d1d5db; font-size: 13px; }
    .preview ul { margin-right: 20px; margin-bottom: 12px; }
    .preview code { background: #1f2937; color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .footer {
      padding: 8px 20px;
      background: #0b0f19;
      border-top: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">📝 MARKDOWN LIVE PRO</div>
    <div class="toolbar">
      <button class="btn" onclick="copyMd()">نسخ النص</button>
      <button class="btn" onclick="downloadMd()">تصدير .md</button>
    </div>
  </header>
  <div class="main">
    <textarea id="editor" oninput="render()"># مرحباً بك في محرر Markdown لـ Adam

هذا المحرر السريع يمكنك من صياغة ملاحظاتك ومقالاتك وتقاريرك بلمح البصر.

## الميزات الرئيسية:
- كتابة سلسة ومباشرة مع معاينة حية.
- دعم العناوين والقوائم والأكواد البرمجية.
- حساب فوري لعدد الكلمات والحروف.

\`\`\`javascript
const agent = "Adam AI";
console.log(\`Running on \${agent}\`);
\`\`\`

ابدأ بالكتابة هنا مباشرة وسينعكس التنسيق فوراً على اليمين!</textarea>
    <div class="preview" id="preview"></div>
  </div>
  <div class="footer">
    <span id="wordCount">0 كلمة • 0 حرف</span>
    <span>Adam AI Sandbox Engine</span>
  </div>
  <script>
    function render() {
      const raw = document.getElementById('editor').value;
      document.getElementById('wordCount').innerText = raw.trim().split(/\\s+/).filter(Boolean).length + ' كلمة • ' + raw.length + ' حرف';
      
      let html = raw
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\\*\\*(.*?)\\*\\*/gim, '<strong>$1</strong>')
        .replace(/\\*(.*?)\\*/gim, '<em>$1</em>')
        .replace(/^\\- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/\\n/gim, '<br>');
      document.getElementById('preview').innerHTML = html;
    }
    function copyMd() {
      navigator.clipboard.writeText(document.getElementById('editor').value);
      alert('تم نسخ نص Markdown إلى الحافظة');
    }
    function downloadMd() {
      const blob = new Blob([document.getElementById('editor').value], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.md';
      a.click();
    }
    render();
  </script>
</body>
</html>`
  }
];

export function loadSandboxApps(): SandboxApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SANDBOX_APPS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SANDBOX_APPS;
    
    // Merge any missing default apps into existing library
    const existingIds = new Set(parsed.map((a: SandboxApp) => a.id));
    const missingDefaults = DEFAULT_SANDBOX_APPS.filter((def) => !existingIds.has(def.id));
    return [...parsed, ...missingDefaults];
  } catch {
    return DEFAULT_SANDBOX_APPS;
  }
}

export function saveSandboxApp(app: Omit<SandboxApp, 'id' | 'createdAt'> & { id?: string }): SandboxApp {
  const current = loadSandboxApps();
  const newApp: SandboxApp = {
    id: app.id || `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: app.title || 'تطبيق جديد',
    prompt: app.prompt || '',
    code: app.code,
    category: app.category || (app.code.includes('canvas') || app.code.includes('game') ? 'game' : 'app'),
    createdAt: Date.now(),
  };

  const filtered = current.filter((item) => item.id !== newApp.id);
  const updated = [newApp, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch {}
  return newApp;
}

export function deleteSandboxApp(id: string): SandboxApp[] {
  const current = loadSandboxApps();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Wraps code into a complete, executable HTML document with Tailwind and icon support if needed
 */
export function wrapCodeIntoExecutableApp(rawCode: string, title = 'Interactive App'): string {
  if (rawCode.includes('<!DOCTYPE html>') || (rawCode.includes('<html') && rawCode.includes('</html>'))) {
    return rawCode;
  }

  // If it's a snippet with HTML elements or script/canvas
  const hasScript = rawCode.includes('<script>') || rawCode.includes('function ') || rawCode.includes('const ') || rawCode.includes('let ');
  const isPureJs = !rawCode.includes('<') && (rawCode.includes('const ') || rawCode.includes('function ') || rawCode.includes('document.'));

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      margin: 0;
    }
  </style>
</head>
<body>
  ${isPureJs ? `<div id="app" class="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center"></div><script>${rawCode}</script>` : rawCode}
</body>
</html>`;
}

/**
 * Extracts runnable code and metadata from a message
 */
export function extractAppCode(content: string): { code: string; isGameOrApp: boolean } | null {
  if (!content) return null;

  // Extract from markdown code blocks
  const codeBlockRegex = /```(?:html|jsx|tsx|javascript|js)?\s*([\s\S]*?)```/g;
  let match;
  const blocks: string[] = [];
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match[1]?.trim()) {
      blocks.push(match[1].trim());
    }
  }

  let codeToRun: string | null = null;
  if (blocks.length > 0) {
    codeToRun =
      blocks.find(
        (b) =>
          b.includes('<html') ||
          b.includes('<!DOCTYPE') ||
          (b.includes('<div') &&
            (b.includes('<script') ||
              b.includes('<style') ||
              b.includes('<button') ||
              b.includes('<canvas') ||
              b.includes('class='))) ||
          (b.includes('document.createElement') && b.includes('addEventListener'))
      ) || null;
  }

  if (!codeToRun && /<!DOCTYPE html>|<html\b/i.test(content)) {
    codeToRun = content.trim();
  }

  if (!codeToRun) return null;

  const wrapped = wrapCodeIntoExecutableApp(codeToRun);
  const lower = wrapped.toLowerCase();
  const isGameOrApp =
    lower.includes('<canvas') ||
    lower.includes('game') ||
    lower.includes('score') ||
    lower.includes('button') ||
    lower.includes('script') ||
    lower.includes('calculator') ||
    lower.includes('player') ||
    lower.includes('tic-tac-toe') ||
    lower.includes('snake') ||
    lower.includes('app');

  return { code: wrapped, isGameOrApp };
}
