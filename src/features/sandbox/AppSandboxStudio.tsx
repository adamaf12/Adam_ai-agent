import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Gamepad2,
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  Trash2,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  Download,
  Send,
  Zap,
  SlidersHorizontal,
  Flame,
  Layers,
  ChevronRight,
  Boxes
} from 'lucide-react';
import type { Language } from '../../core/domain';
import { openSafeExternalUrl } from '../../core/utils/mobileWebHandler';
import {
  loadSandboxApps,
  saveSandboxApp,
  deleteSandboxApp,
  type SandboxApp
} from '../../core/appSandboxStorage';
import { getSmartCalculatorAppCode } from '../../core/agent/interactiveAppTemplates';
import { DockerSandboxRunner } from './DockerSandboxRunner';

interface AppSandboxStudioProps {
  language: Language;
  initialAppId?: string;
  onNavigateToChat?: (prompt: string) => void;
}

// Curated Luxury Built-in Templates
const CURATED_MODELS: SandboxApp[] = [
  {
    id: 'adem_smart_calculator',
    title: 'الآلة الحاسبة الذكية التفاعلية (Smart Calculator)',
    prompt: 'برمج لي آلة حاسبة تفاعلية متكاملة تحسب بدقة مع مؤثرات صوتية وتصميم نيون ودعم الأقواس والجذور ولوحة المفاتيح',
    category: 'app',
    createdAt: Date.now() - 1200000,
    code: getSmartCalculatorAppCode(),
  },
  {
    id: 'cyber_space_odyssey',
    title: 'مغامرة الفضاء السايبر (Cyber Space Odyssey)',
    prompt: 'برمج لي لعبة حرب فضاء سايبر متطورة بالكانفاس مع ليزر ومؤثرات صوتية ونجوم 3D وأزرار تحكم باللمس',
    category: 'game',
    createdAt: Date.now() - 3600000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cyber Space Odyssey</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #090d16;
      color: #38bdf8;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .game-card {
      position: relative;
      width: 100%;
      max-width: 480px;
      height: 100vh;
      max-height: 720px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 40px rgba(56, 189, 248, 0.15);
    }
    .hud {
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid #1e293b;
      backdrop-blur: 10px;
      font-size: 13px;
      font-weight: 700;
      z-index: 10;
    }
    .score-badge {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      color: #38bdf8;
    }
    .health-bar-wrap {
      width: 100px;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
    }
    .health-bar {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #10b981);
      transition: width 0.2s ease;
    }
    canvas {
      flex: 1;
      width: 100%;
      display: block;
      background: radial-gradient(circle at center, #0d1527 0%, #030712 100%);
      touch-action: none;
    }
    .controls {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid #1e293b;
    }
    .btn-ctrl {
      background: #1e293b;
      border: 1px solid #38bdf844;
      color: #38bdf8;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      active:scale-95;
    }
    .btn-fire {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: #fff;
      border: none;
      box-shadow: 0 0 15px rgba(2, 132, 199, 0.4);
    }
  </style>
</head>
<body>
  <div class="game-card">
    <div class="hud">
      <div class="score-badge">النقاط: <span id="score">0</span></div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span>الطاقة:</span>
        <div class="health-bar-wrap">
          <div id="health" class="health-bar"></div>
        </div>
      </div>
    </div>
    <canvas id="canvas"></canvas>
    <div class="controls">
      <button id="leftBtn" class="btn-ctrl">◀ يسار</button>
      <button id="fireBtn" class="btn-ctrl btn-fire">⚡ إطلاق</button>
      <button id="rightBtn" class="btn-ctrl">يمين ▶</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const healthEl = document.getElementById('health');

    let width, height;
    function resize() {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight - 120;
    }
    window.addEventListener('resize', resize);
    resize();

    // Audio synth
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function playBeep(freq, type='sine', dur=0.1) {
      try {
        if(!audioCtx) audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch(e){}
    }

    let player = { x: width/2, y: height - 60, size: 24, speed: 6, vx: 0, health: 100 };
    let score = 0;
    let lasers = [];
    let enemies = [];
    let stars = Array.from({length: 45}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() * 2
    }));

    let keys = { left: false, right: false };

    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
      if(e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
      if(e.key === ' ' || e.key === 'ArrowUp') shoot();
    });
    window.addEventListener('keyup', e => {
      if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if(e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });

    const setupBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', e => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', e => { e.preventDefault(); onUp && onUp(); });
      el.addEventListener('mousedown', onDown);
      el.addEventListener('mouseup', () => onUp && onUp());
    };
    setupBtn('leftBtn', () => keys.left = true, () => keys.left = false);
    setupBtn('rightBtn', () => keys.right = true, () => keys.right = false);
    setupBtn('fireBtn', shoot);

    function shoot() {
      lasers.push({ x: player.x, y: player.y - 20, speed: 10 });
      playBeep(880, 'triangle', 0.08);
    }

    setInterval(() => {
      if(player.health > 0) {
        enemies.push({
          x: 20 + Math.random() * (width - 40),
          y: -20,
          speed: 2 + Math.random() * 2.5,
          size: 18
        });
      }
    }, 1200);

    function update() {
      if(keys.left && player.x > 30) player.x -= player.speed;
      if(keys.right && player.x < width - 30) player.x += player.speed;

      // Stars
      stars.forEach(s => {
        s.y += s.speed;
        if(s.y > height) s.y = 0;
      });

      // Lasers
      lasers.forEach((l, i) => {
        l.y -= l.speed;
        if(l.y < 0) lasers.splice(i, 1);
      });

      // Enemies
      enemies.forEach((e, ei) => {
        e.y += e.speed;
        if(e.y > height) enemies.splice(ei, 1);

        // Hit player
        if(Math.hypot(e.x - player.x, e.y - player.y) < player.size + e.size) {
          player.health = Math.max(0, player.health - 20);
          healthEl.style.width = player.health + '%';
          playBeep(160, 'sawtooth', 0.2);
          enemies.splice(ei, 1);
        }

        // Hit laser
        lasers.forEach((l, li) => {
          if(Math.hypot(e.x - l.x, e.y - l.y) < e.size + 8) {
            enemies.splice(ei, 1);
            lasers.splice(li, 1);
            score += 100;
            scoreEl.innerText = score;
            playBeep(440 + Math.random()*200, 'sine', 0.1);
          }
        });
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = '#94a3b8';
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player Ship
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(16, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-16, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Lasers
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      lasers.forEach(l => {
        ctx.fillRect(l.x - 2.5, l.y - 10, 5, 14);
      });

      // Enemies
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if(player.health <= 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('انتهت اللعبة!', width/2, height/2 - 10);
        ctx.fillStyle = '#fff';
        ctx.font = '14px system-ui';
        ctx.fillText('النقاط النهائية: ' + score, width/2, height/2 + 25);
      } else {
        update();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  </script>
</body>
</html>`
  },
  {
    id: 'cyber_pong_neon',
    title: 'سايبر بونغ النيون (Cyber Pong Neon)',
    prompt: 'اصنع لعبة بونغ تفاعلية سريعة ومضيئة بتأثيرات النيون مع ذكاء اصطناعي منافس',
    category: 'game',
    createdAt: Date.now() - 7200000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cyber Pong Neon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #020617;
      color: #10b981;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .game-card {
      width: 100%;
      max-width: 480px;
      background: #0b1120;
      border: 1px solid #10b98144;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 0 35px rgba(16, 185, 129, 0.15);
      display: flex;
      flex-direction: column;
    }
    .hud {
      display: flex;
      justify-content: space-between;
      padding: 14px 20px;
      background: rgba(15, 23, 42, 0.9);
      font-size: 15px;
      font-weight: bold;
      border-bottom: 1px solid #1e293b;
    }
    canvas {
      display: block;
      width: 100%;
      height: 480px;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      touch-action: none;
      cursor: ew-resize;
    }
    .footer-tip {
      padding: 10px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      background: #090e1a;
    }
  </style>
</head>
<body>
  <div class="game-card">
    <div class="hud">
      <div>أنت: <span id="pScore" style="color:#10b981;">0</span></div>
      <div style="color:#38bdf8;">CYBER PONG</div>
      <div>الخصم: <span id="aiScore" style="color:#f43f5e;">0</span></div>
    </div>
    <canvas id="c"></canvas>
    <div class="footer-tip">حرّك إصبعك أو الفأرة يميناً ويساراً لتحريك المضرب</div>
  </div>

  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    const pScoreEl = document.getElementById('pScore');
    const aiScoreEl = document.getElementById('aiScore');

    let w = c.width = 440;
    let h = c.height = 480;

    let pScore = 0, aiScore = 0;
    const paddleW = 80, paddleH = 12;
    let player = { x: w/2 - paddleW/2, y: h - 30 };
    let ai = { x: w/2 - paddleW/2, y: 18, speed: 4 };
    let ball = { x: w/2, y: h/2, vx: 4, vy: 4, r: 7 };

    function move(clientX) {
      const rect = c.getBoundingClientRect();
      const scaleX = w / rect.width;
      player.x = (clientX - rect.left) * scaleX - paddleW / 2;
      player.x = Math.max(0, Math.min(w - paddleW, player.x));
    }

    c.addEventListener('mousemove', e => move(e.clientX));
    c.addEventListener('touchmove', e => {
      if(e.touches.length > 0) move(e.touches[0].clientX);
    });

    function resetBall(dir) {
      ball.x = w/2;
      ball.y = h/2;
      ball.vx = (Math.random() > 0.5 ? 4 : -4);
      ball.vy = dir * 4;
    }

    function loop() {
      // AI Tracking
      const aiCenter = ai.x + paddleW/2;
      if(aiCenter < ball.x - 8) ai.x += ai.speed;
      else if(aiCenter > ball.x + 8) ai.x -= ai.speed;
      ai.x = Math.max(0, Math.min(w - paddleW, ai.x));

      // Ball Movement
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall Bounce
      if(ball.x - ball.r <= 0 || ball.x + ball.r >= w) ball.vx *= -1;

      // Player Paddle Hit
      if(ball.y + ball.r >= player.y && ball.x >= player.x && ball.x <= player.x + paddleW) {
        ball.vy = -Math.abs(ball.vy) * 1.05;
        ball.vx += (ball.x - (player.x + paddleW/2)) * 0.1;
      }

      // AI Paddle Hit
      if(ball.y - ball.r <= ai.y + paddleH && ball.x >= ai.x && ball.x <= ai.x + paddleW) {
        ball.vy = Math.abs(ball.vy) * 1.05;
      }

      // Score
      if(ball.y < 0) {
        pScore++;
        pScoreEl.innerText = pScore;
        resetBall(1);
      } else if(ball.y > h) {
        aiScore++;
        aiScoreEl.innerText = aiScore;
        resetBall(-1);
      }

      // Render
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Center Line
      ctx.strokeStyle = '#1e293b';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(w, h/2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Player Paddle
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.fillRect(player.x, player.y, paddleW, paddleH);

      // AI Paddle
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.fillRect(ai.x, ai.y, paddleW, paddleH);

      // Ball
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'quantum_snake',
    title: 'ثعبان الكوانتوم المضيء (Quantum Snake)',
    prompt: 'برمج لعبة ثعبان كلاسيكية بتصميم مستقبلي نيون أنيق مع لوحة تحكم لمسية D-Pad ونقاط عالية',
    category: 'game',
    createdAt: Date.now() - 10800000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Quantum Snake</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #020617;
      color: #a855f7;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .game-card {
      width: 100%;
      max-width: 440px;
      background: #0b0f19;
      border: 1px solid #a855f733;
      border-radius: 20px;
      box-shadow: 0 0 35px rgba(168, 85, 247, 0.15);
      overflow: hidden;
    }
    .hud {
      display: flex;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid #1e293b;
      font-weight: bold;
      font-size: 14px;
    }
    canvas {
      display: block;
      margin: 0 auto;
      background: #030712;
    }
    .dpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 14px;
      background: #090e1a;
      border-top: 1px solid #1e293b;
      max-width: 260px;
      margin: 0 auto;
    }
    .btn {
      background: #1e293b;
      color: #a855f7;
      border: 1px solid #a855f744;
      padding: 12px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="game-card">
    <div class="hud">
      <div>النقاط: <span id="score" style="color:#a855f7;">0</span></div>
      <div style="color:#f43f5e;">QUANTUM SNAKE</div>
      <div>الأعلى: <span id="high">0</span></div>
    </div>
    <canvas id="gc" width="400" height="360"></canvas>
    <div class="dpad">
      <div></div>
      <button class="btn" onclick="setDir(0,-1)">▲</button>
      <div></div>
      <button class="btn" onclick="setDir(-1,0)">◀</button>
      <button class="btn" onclick="setDir(0,1)">▼</button>
      <button class="btn" onclick="setDir(1,0)">▶</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('gc');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highEl = document.getElementById('high');

    const grid = 20;
    let count = 0;
    let score = 0, high = 0;
    let snake = [{x: 160, y: 160}, {x: 140, y: 160}, {x: 120, y: 160}];
    let dx = grid, dy = 0;
    let food = { x: 280, y: 280 };

    function setDir(x, y) {
      if(x !== 0 && dx === 0) { dx = x * grid; dy = 0; }
      if(y !== 0 && dy === 0) { dy = y * grid; dx = 0; }
    }

    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowUp' && dy === 0) { dy = -grid; dx = 0; }
      else if(e.key === 'ArrowDown' && dy === 0) { dy = grid; dx = 0; }
      else if(e.key === 'ArrowLeft' && dx === 0) { dx = -grid; dy = 0; }
      else if(e.key === 'ArrowRight' && dx === 0) { dx = grid; dy = 0; }
    });

    function loop() {
      requestAnimationFrame(loop);
      if(++count < 6) return;
      count = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move snake
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      // Wrap around walls
      if(head.x < 0) head.x = canvas.width - grid;
      else if(head.x >= canvas.width) head.x = 0;
      if(head.y < 0) head.y = canvas.height - grid;
      else if(head.y >= canvas.height) head.y = 0;

      // Self collision
      for(let i=0; i<snake.length; i++) {
        if(head.x === snake[i].x && head.y === snake[i].y) {
          score = 0;
          scoreEl.innerText = score;
          snake = [{x: 160, y: 160}, {x: 140, y: 160}];
          dx = grid; dy = 0;
          return;
        }
      }

      snake.unshift(head);

      // Eat Food
      if(head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        if(score > high) { high = score; highEl.innerText = high; }
        food.x = Math.floor(Math.random() * (canvas.width / grid)) * grid;
        food.y = Math.floor(Math.random() * (canvas.height / grid)) * grid;
      } else {
        snake.pop();
      }

      // Draw Food
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.fillRect(food.x+2, food.y+2, grid-4, grid-4);

      // Draw Snake
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      snake.forEach((s, idx) => {
        ctx.fillStyle = idx === 0 ? '#c084fc' : '#a855f7';
        ctx.fillRect(s.x+1, s.y+1, grid-2, grid-2);
      });
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },
  {
    id: 'zen_focus_matrix',
    title: 'مصفوفة التركيز ومولد الترددات (Zen Focus Matrix)',
    prompt: 'أنشئ تطبيق مؤقت تركيز بومودورو فاخر مع مولد أصوات وترددات بيئية مهدئة',
    category: 'app',
    createdAt: Date.now() - 14400000,
    code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zen Focus Matrix</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .title {
      font-size: 16px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .timer-circle {
      position: relative;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: radial-gradient(circle, #1e293b 0%, #0b1120 100%);
      border: 3px solid #38bdf844;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.15);
      margin-bottom: 24px;
    }
    .time-display {
      font-size: 38px;
      font-weight: 900;
      font-family: monospace;
      color: #fff;
    }
    .status-text {
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
      margin-top: 4px;
    }
    .controls {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
    }
    .btn-main {
      flex: 1;
      padding: 14px;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: #fff;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;
    }
    .btn-sec {
      padding: 14px 20px;
      border-radius: 16px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #94a3b8;
      font-weight: bold;
      cursor: pointer;
    }
    .sound-matrix {
      width: 100%;
      border-top: 1px solid #1e293b;
      padding-top: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .sound-btn {
      padding: 10px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .sound-btn.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: #38bdf8;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">ZEN FOCUS MATRIX</div>
    <div class="timer-circle">
      <div id="time" class="time-display">25:00</div>
      <div id="status" class="status-text">جلسة تركيز</div>
    </div>
    <div class="controls">
      <button id="toggleBtn" class="btn-main" onclick="toggleTimer()">بدء الجلسة</button>
      <button class="btn-sec" onclick="resetTimer()">إعادة</button>
    </div>
    <div class="sound-matrix">
      <button id="binaural" class="sound-btn" onclick="toggleAmbient(432, 'binaural')">🌊 أمواج ألفا (432Hz)</button>
      <button id="zen" class="sound-btn" onclick="toggleAmbient(528, 'zen')">✨ تردد الصفاء (528Hz)</button>
    </div>
  </div>

  <script>
    let timeLeft = 25 * 60;
    let timerId = null;
    const timeEl = document.getElementById('time');
    const toggleBtn = document.getElementById('toggleBtn');
    let audioCtx = null, activeOsc = null, activeGain = null;

    function renderTime() {
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      timeEl.innerText = m + ':' + s;
    }

    function toggleTimer() {
      if(timerId) {
        clearInterval(timerId);
        timerId = null;
        toggleBtn.innerText = 'استئناف';
      } else {
        timerId = setInterval(() => {
          if(timeLeft > 0) {
            timeLeft--;
            renderTime();
          } else {
            clearInterval(timerId);
            timerId = null;
            toggleBtn.innerText = 'ابدأ من جديد';
          }
        }, 1000);
        toggleBtn.innerText = 'إيقاف مؤقت';
      }
    }

    function resetTimer() {
      if(timerId) clearInterval(timerId);
      timerId = null;
      timeLeft = 25 * 60;
      renderTime();
      toggleBtn.innerText = 'بدء الجلسة';
    }

    function toggleAmbient(freq, btnId) {
      const btn = document.getElementById(btnId);
      if(activeOsc) {
        activeOsc.stop();
        activeOsc.disconnect();
        activeOsc = null;
        document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
        return;
      }
      try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        activeOsc = audioCtx.createOscillator();
        activeGain = audioCtx.createGain();
        activeOsc.type = 'sine';
        activeOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        activeGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        activeOsc.connect(activeGain);
        activeGain.connect(audioCtx.destination);
        activeOsc.start();
        btn.classList.add('active');
      } catch(e){}
    }
  </script>
</body>
</html>`
  }
];

export function AppSandboxStudio({
  language,
  initialAppId,
  onNavigateToChat
}: AppSandboxStudioProps) {
  const isAr = language === 'ar';
  const [apps, setApps] = useState<SandboxApp[]>(() => {
    const saved = loadSandboxApps();
    return saved.length > 0 ? saved : CURATED_MODELS;
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    return initialAppId || CURATED_MODELS[0].id;
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'docker'>('preview');
  const [deviceMode, setDeviceMode] = useState<'fluid' | 'mobile'>('fluid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'game' | 'app'>('all');
  const [copied, setCopied] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeApp = useMemo(() => {
    return apps.find((a) => a.id === selectedId) || apps[0] || CURATED_MODELS[0];
  }, [apps, selectedId]);

  const [editableCode, setEditableCode] = useState(activeApp?.code || '');

  useEffect(() => {
    if (activeApp) {
      setEditableCode(activeApp.code);
    }
  }, [activeApp?.id]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchSearch =
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || app.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [apps, searchQuery, categoryFilter]);

  const handleCopyCode = async () => {
    if (!editableCode) return;
    try {
      await navigator.clipboard.writeText(editableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      const currentSrcDoc = iframeRef.current.srcdoc;
      iframeRef.current.srcdoc = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = currentSrcDoc;
      }, 50);
    }
  };

  const handleOpenNewTab = () => {
    if (!editableCode) return;
    const blob = new Blob([editableCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    openSafeExternalUrl(url);
  };

  const handleDownloadHtml = () => {
    if (!editableCode) return;
    const blob = new Blob([editableCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeApp.title.replace(/[\s\(\)]+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSandboxApp(id);
    const updated = apps.filter((a) => a.id !== id);
    setApps(updated.length > 0 ? updated : CURATED_MODELS);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || CURATED_MODELS[0].id);
    }
  };

  const handleSaveAndRun = () => {
    if (!activeApp) return;
    const updated: SandboxApp = {
      ...activeApp,
      code: editableCode
    };
    saveSandboxApp(updated);
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setActiveTab('preview');
  };

  const handlePromptSubmit = () => {
    const text = promptInput.trim();
    if (!text) return;
    if (onNavigateToChat) {
      onNavigateToChat(isAr ? `برمج لي لعبة أو تطبيق تفاعلي بنسبة 100%: ${text}` : `Build a 100% playable interactive game/app: ${text}`);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[var(--bg)] text-[var(--text)] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 p-0 bg-black' : ''}`}>
      {/* Top Header Bar */}
      {!isFullscreen && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--surface)]/80 border-b border-[var(--border)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-[var(--accent-contrast)] flex items-center justify-center shadow-md shadow-[var(--accent-glow)]">
              <Gamepad2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[var(--text)] leading-tight">
                  {isAr ? 'استوديو الألعاب والتطبيقات' : 'Apps & Games Studio'}
                </h1>
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] font-bold font-mono">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                {isAr ? 'نماذج ألعاب وتطبيقات تفاعلية خفيفة وفائقة السرعة' : 'Curated luxury interactive games & apps'}
              </p>
            </div>
          </div>

          {/* Quick Filters & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="lg:hidden px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--surface-hover)] transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Gamepad2 size={13} />
              <span>
                {mobileSidebarOpen
                  ? isAr
                    ? 'إخفاء النماذج'
                    : 'Hide Models'
                  : isAr
                  ? `النماذج (${apps.length})`
                  : `Models (${apps.length})`}
              </span>
            </button>
            <div className="flex items-center p-0.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              {(['all', 'game', 'app'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {cat === 'all' ? (isAr ? 'الكل' : 'All') : cat === 'game' ? (isAr ? 'ألعاب' : 'Games') : (isAr ? 'تطبيقات' : 'Apps')}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* Main Studio Body (Split Layout: Showcase Cards Carousel / List + Main Stage) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar: Curated Cards Showcase */}
        {!isFullscreen && (
          <aside
            className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--surface)]/40 flex flex-col max-h-56 lg:max-h-full overflow-hidden flex-shrink-0 ${
              mobileSidebarOpen ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                <Search size={14} className="text-[var(--muted)] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في النماذج...' : 'Search models...'}
                  className="bg-transparent border-0 outline-none w-full text-[var(--text)] placeholder-[var(--muted)]"
                />
              </div>
            </div>

            {/* List of Models */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredApps.map((app) => {
                const isSelected = app.id === activeApp.id;
                return (
                  <div
                    key={app.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(app.id);
                      setActiveTab('preview');
                      setMobileSidebarOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedId(app.id);
                        setActiveTab('preview');
                        setMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between group select-none ${
                      isSelected
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                            : 'bg-[var(--surface-2)] text-[var(--muted)] group-hover:text-[var(--accent)]'
                        }`}
                      >
                        {app.category === 'game' ? <Gamepad2 size={16} /> : <Zap size={16} />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold truncate block">
                          {app.title}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] truncate block mt-0.5">
                          {app.category === 'game' ? (isAr ? 'لعبة تفاعلية 60fps' : '60fps Interactive Game') : (isAr ? 'أداة وتطبيق ذكي' : 'Smart Tool & Matrix')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {apps.length > 1 && !CURATED_MODELS.some((c) => c.id === app.id) && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(app.id, e)}
                          className="p-1 rounded-lg text-[var(--muted)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <ChevronRight size={14} className={`text-[var(--muted)] transition-transform ${isSelected ? 'rotate-90 text-[var(--accent)]' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prompt Direct Creator Bar */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] focus-within:border-[var(--accent)]">
                <Sparkles size={14} className="text-[var(--accent)] flex-shrink-0 mx-1" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
                  placeholder={isAr ? 'اطلب برمجة لعبة جديدة...' : 'Ask to build a new game...'}
                  className="bg-transparent border-0 outline-none text-xs w-full text-[var(--text)] placeholder-[var(--muted)]"
                />
                <button
                  type="button"
                  onClick={handlePromptSubmit}
                  disabled={!promptInput.trim()}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Stage & Runner */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">
          {/* Stage Controls Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] gap-2">
            {/* Tab Switcher (Live / Code) */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Play size={12} fill={activeTab === 'preview' ? 'currentColor' : 'none'} />
                <span>{isAr ? 'التشغيل الحي' : 'Live Runner'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('docker')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'docker'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Boxes size={13} className={activeTab === 'docker' ? 'text-white' : 'text-cyan-400'} />
                <span>{isAr ? 'حاوية دوكر' : 'Docker Sandbox'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Code2 size={13} />
                <span>{isAr ? 'محرر الكود' : 'Source Code'}</span>
              </button>
            </div>

            {/* Stage Actions */}
            <div className="flex items-center gap-1.5">
              {activeTab === 'preview' && (
                <>
                  {/* Viewport Switcher */}
                  <button
                    type="button"
                    onClick={() => setDeviceMode((prev) => (prev === 'fluid' ? 'mobile' : 'fluid'))}
                    className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                    title={deviceMode === 'fluid' ? (isAr ? 'محاكاة الهاتف' : 'Mobile Frame') : (isAr ? 'شاشة كاملة' : 'Fluid Frame')}
                  >
                    {deviceMode === 'fluid' ? <Smartphone size={14} /> : <Monitor size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleReload}
                    className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                    title={isAr ? 'إعادة تشغيل' : 'Restart'}
                  >
                    <RotateCcw size={14} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] transition cursor-pointer"
                title={isAr ? 'نسخ الكود' : 'Copy Code'}
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span className="hidden sm:inline">{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                title={isAr ? 'فتح في نافذة جديدة' : 'Open in New Tab'}
              >
                <ExternalLink size={14} />
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                title={isAr ? 'تصدير كملف HTML' : 'Export HTML'}
              >
                <Download size={14} />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer"
                title={isFullscreen ? (isAr ? 'إنهاء وضع المسرح' : 'Exit Fullscreen') : (isAr ? 'وضع المسرح' : 'Theater Fullscreen')}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center p-2 sm:p-4 bg-[var(--bg)]">
            {activeTab === 'preview' ? (
              <div
                className={`h-full transition-all duration-300 flex items-center justify-center ${
                  deviceMode === 'mobile'
                    ? 'w-full max-w-[390px] max-h-[720px] rounded-3xl border-4 border-[#1e293b] shadow-2xl overflow-hidden bg-black'
                    : 'w-full rounded-2xl border border-[var(--border)] overflow-hidden shadow-lg bg-black'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={editableCode}
                  title={activeApp.title}
                  className="w-full h-full border-0 bg-transparent"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                />
              </div>
            ) : activeTab === 'docker' ? (
              <div className="w-full h-full rounded-2xl border border-[var(--border)] overflow-hidden shadow-lg bg-[var(--surface)]">
                <DockerSandboxRunner
                  language={language}
                  initialCode={editableCode}
                  initialLanguage={activeApp.category === 'app' ? 'javascript' : 'html'}
                  onCodeChange={(newCode) => setEditableCode(newCode)}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] text-xs">
                  <span className="font-mono text-[var(--muted)]">{activeApp.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('docker')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm hover:opacity-90 transition cursor-pointer"
                    >
                      <Boxes size={12} />
                      <span>{isAr ? 'تشغيل في الحاوية' : 'Run in Container'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndRun}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-sm hover:opacity-90 transition cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>{isAr ? 'حفظ وتشغيل الكود' : 'Save & Run Live'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={editableCode}
                  onChange={(e) => setEditableCode(e.target.value)}
                  className="flex-1 w-full p-4 bg-[var(--bg)] text-[var(--text)] font-mono text-xs leading-relaxed outline-none border-0 resize-none"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
