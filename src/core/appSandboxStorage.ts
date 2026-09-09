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
  }
];

export function loadSandboxApps(): SandboxApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SANDBOX_APPS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SANDBOX_APPS;
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
              b.includes('<canvas')))
      ) || null;
  }

  if (!codeToRun && /<!DOCTYPE html>|<html\b/i.test(content)) {
    codeToRun = content.trim();
  }

  if (!codeToRun) return null;

  const lower = codeToRun.toLowerCase();
  const isGameOrApp =
    lower.includes('<canvas') ||
    lower.includes('game') ||
    lower.includes('score') ||
    lower.includes('button') ||
    lower.includes('script') ||
    lower.includes('calculator') ||
    lower.includes('player') ||
    lower.includes('tic-tac-toe') ||
    lower.includes('snake');

  return { code: codeToRun, isGameOrApp };
}
