/**
 * ADEM Autonomous Interactive App & Game Engine
 * 100% Functional, zero-mock, high-precision single-file HTML5/CSS3/JavaScript applications
 * with real arithmetic calculations, reactive state, localStorage persistence,
 * tactile Web Audio synthesizers, keyboard listeners, and mobile touch controls.
 */

export function getSmartCalculatorAppCode(title = 'الآلة الحاسبة الذكية التفاعلية (Smart Calculator)'): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
    body {
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 12px;
      overflow-x: hidden;
    }
    .calculator-wrapper {
      width: 100%;
      max-width: 360px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.35);
      backdrop-filter: blur(16px);
      border-radius: 28px;
      padding: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
    }
    .header-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sound-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: #10b981;
    }
    .display-screen {
      background: #030712;
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 20px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-end;
      min-height: 96px;
      direction: ltr;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.9);
      overflow: hidden;
    }
    .history-line {
      font-size: 13px;
      color: #64748b;
      min-height: 20px;
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .main-line {
      font-size: 34px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.5px;
      word-break: break-all;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      transition: color 0.15s ease;
    }
    .grid-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
    }
    button.calc-btn {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(71, 85, 105, 0.6);
      border-radius: 16px;
      padding: 14px 0;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    }
    button.calc-btn:hover {
      background: #334155;
      border-color: #64748b;
      transform: translateY(-1px);
    }
    button.calc-btn:active {
      transform: scale(0.94);
      background: #475569;
    }
    button.calc-btn.op {
      background: #064e3b;
      color: #34d399;
      border-color: #059669;
    }
    button.calc-btn.op:hover {
      background: #047857;
      color: #a7f3d0;
    }
    button.calc-btn.fn {
      background: #1e1b4b;
      color: #818cf8;
      border-color: #4338ca;
    }
    button.calc-btn.fn:hover {
      background: #312e81;
    }
    button.calc-btn.clear {
      background: #7f1d1d;
      color: #fca5a5;
      border-color: #991b1b;
    }
    button.calc-btn.clear:hover {
      background: #991b1b;
    }
    button.calc-btn.equal {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #022c22;
      border-color: #34d399;
      font-size: 22px;
      font-weight: 900;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    button.calc-btn.equal:hover {
      background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      transform: translateY(-1px) scale(1.02);
    }
    .footer-hint {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <div class="calculator-wrapper">
    <div class="header-bar">
      <div class="header-title">
        <span>⚡ ADEM PRO CALCULATOR</span>
      </div>
      <span class="sound-badge" id="soundStatus">🔊 الصوت نشط</span>
    </div>

    <div class="display-screen">
      <div class="history-line" id="historyView"></div>
      <div class="main-line" id="displayView">0</div>
    </div>

    <div class="grid-buttons">
      <button class="calc-btn clear" onclick="handleClearAll()">AC</button>
      <button class="calc-btn clear" onclick="handleBackspace()">⌫</button>
      <button class="calc-btn fn" onclick="handlePercentage()">%</button>
      <button class="calc-btn op" onclick="handleOperator('/')">÷</button>

      <button class="calc-btn fn" onclick="handleParenthesis('(')">(</button>
      <button class="calc-btn fn" onclick="handleParenthesis(')')">)</button>
      <button class="calc-btn fn" onclick="handleSquareRoot()">√</button>
      <button class="calc-btn op" onclick="handleOperator('*')">×</button>

      <button class="calc-btn" onclick="handleNumber('7')">7</button>
      <button class="calc-btn" onclick="handleNumber('8')">8</button>
      <button class="calc-btn" onclick="handleNumber('9')">9</button>
      <button class="calc-btn op" onclick="handleOperator('-')">−</button>

      <button class="calc-btn" onclick="handleNumber('4')">4</button>
      <button class="calc-btn" onclick="handleNumber('5')">5</button>
      <button class="calc-btn" onclick="handleNumber('6')">6</button>
      <button class="calc-btn op" onclick="handleOperator('+')">+</button>

      <button class="calc-btn" onclick="handleNumber('1')">1</button>
      <button class="calc-btn" onclick="handleNumber('2')">2</button>
      <button class="calc-btn" onclick="handleNumber('3')">3</button>
      <button class="calc-btn fn" onclick="handleToggleSign()">±</button>

      <button class="calc-btn" onclick="handleNumber('0')" style="grid-column: span 2;">0</button>
      <button class="calc-btn" onclick="handleDecimal()">.</button>
      <button class="calc-btn equal" onclick="handleCalculate()">=</button>
    </div>

    <div class="footer-hint">
      يدعم لوحة المفاتيح: الأرقام، العمليات (+ - * /)، Enter للحساب، Escape للمسح
    </div>
  </div>

  <script>
    let currentExpression = '0';
    let lastResult = null;
    let hasEvaluated = false;

    const displayEl = document.getElementById('displayView');
    const historyEl = document.getElementById('historyView');

    function playClickSound(frequency = 520, type = 'sine', duration = 0.04) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }

    function updateDisplay() {
      displayEl.innerText = formatDisplay(currentExpression);
      if (displayEl.innerText.length > 12) {
        displayEl.style.fontSize = '24px';
      } else if (displayEl.innerText.length > 8) {
        displayEl.style.fontSize = '28px';
      } else {
        displayEl.style.fontSize = '34px';
      }
    }

    function formatDisplay(exp) {
      return exp.replace(/\\*/g, '×').replace(/\\//g, '÷');
    }

    function handleNumber(num) {
      playClickSound(600, 'sine', 0.03);
      if (currentExpression === '0' || currentExpression === 'Error' || hasEvaluated) {
        currentExpression = num;
        hasEvaluated = false;
      } else {
        currentExpression += num;
      }
      updateDisplay();
    }

    function handleOperator(op) {
      playClickSound(750, 'triangle', 0.05);
      if (currentExpression === 'Error') {
        currentExpression = '0';
      }
      hasEvaluated = false;
      const lastChar = currentExpression.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        currentExpression = currentExpression.slice(0, -1) + op;
      } else {
        currentExpression += op;
      }
      updateDisplay();
    }

    function handleDecimal() {
      playClickSound(650, 'sine', 0.03);
      if (hasEvaluated || currentExpression === 'Error') {
        currentExpression = '0.';
        hasEvaluated = false;
        updateDisplay();
        return;
      }
      const parts = currentExpression.split(/[+\\-*\\/]/);
      const currentNumber = parts[parts.length - 1];
      if (!currentNumber.includes('.')) {
        currentExpression += '.';
        updateDisplay();
      }
    }

    function handleClearAll() {
      playClickSound(300, 'sawtooth', 0.08);
      currentExpression = '0';
      historyEl.innerText = '';
      lastResult = null;
      hasEvaluated = false;
      updateDisplay();
    }

    function handleBackspace() {
      playClickSound(450, 'triangle', 0.04);
      if (currentExpression === 'Error' || hasEvaluated) {
        currentExpression = '0';
        hasEvaluated = false;
      } else if (currentExpression.length > 1) {
        currentExpression = currentExpression.slice(0, -1);
      } else {
        currentExpression = '0';
      }
      updateDisplay();
    }

    function handleParenthesis(p) {
      playClickSound(700, 'sine', 0.03);
      if (currentExpression === '0' || currentExpression === 'Error') {
        currentExpression = p;
      } else {
        currentExpression += p;
      }
      hasEvaluated = false;
      updateDisplay();
    }

    function handleSquareRoot() {
      playClickSound(850, 'sine', 0.06);
      try {
        const val = safeEvaluate(currentExpression);
        if (val < 0) {
          currentExpression = 'Error';
        } else {
          historyEl.innerText = '√(' + currentExpression + ')';
          const res = Math.sqrt(val);
          currentExpression = cleanNumber(res);
          hasEvaluated = true;
        }
      } catch (e) {
        currentExpression = 'Error';
      }
      updateDisplay();
    }

    function handlePercentage() {
      playClickSound(720, 'sine', 0.04);
      try {
        const val = safeEvaluate(currentExpression);
        historyEl.innerText = currentExpression + ' %';
        currentExpression = cleanNumber(val / 100);
        hasEvaluated = true;
      } catch (e) {
        currentExpression = 'Error';
      }
      updateDisplay();
    }

    function handleToggleSign() {
      playClickSound(580, 'sine', 0.04);
      try {
        if (currentExpression === '0' || currentExpression === 'Error') return;
        if (currentExpression.startsWith('-')) {
          currentExpression = currentExpression.slice(1);
        } else {
          currentExpression = '-' + currentExpression;
        }
      } catch (e) {}
      updateDisplay();
    }

    function handleCalculate() {
      playClickSound(920, 'sine', 0.09);
      if (currentExpression === 'Error') return;
      try {
        const expr = currentExpression;
        const result = safeEvaluate(expr);
        if (!isFinite(result) || isNaN(result)) {
          historyEl.innerText = formatDisplay(expr) + ' =';
          currentExpression = 'Error';
        } else {
          historyEl.innerText = formatDisplay(expr) + ' =';
          currentExpression = cleanNumber(result);
          lastResult = result;
          hasEvaluated = true;
        }
      } catch (err) {
        historyEl.innerText = formatDisplay(currentExpression) + ' =';
        currentExpression = 'Error';
      }
      updateDisplay();
    }

    function cleanNumber(num) {
      const precision = 10;
      return String(parseFloat(Number(num).toFixed(precision)));
    }

    function safeEvaluate(str) {
      const sanitized = str.replace(/[^0-9+\\-*\\/.()]/g, '');
      if (!sanitized) return 0;
      const fn = new Function('return (' + sanitized + ')');
      return fn();
    }

    window.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handleDecimal();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClearAll();
      } else if (e.key === '(' || e.key === ')') {
        handleParenthesis(e.key);
      } else if (e.key === '%') {
        handlePercentage();
      }
    });

    updateDisplay();
  </script>
</body>
</html>`;
}

export function getInteractiveTodoAppCode(title = 'تطبيق المهام الذكي التفاعلي (Smart Task Matrix)'): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .app-card {
      width: 100%;
      max-width: 480px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.3);
      backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-bar {
      height: 6px;
      background: #1e293b;
      border-radius: 99px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #10b981);
      width: 0%;
      transition: width 0.3s ease;
    }
    .input-group {
      display: flex;
      gap: 8px;
    }
    input.task-input {
      flex: 1;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 12px 16px;
      color: #f8fafc;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    input.task-input:focus {
      border-color: #38bdf8;
    }
    .priority-select {
      background: #020617;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 0 10px;
      color: #94a3b8;
      font-size: 12px;
      outline: none;
    }
    button.add-btn {
      background: #38bdf8;
      color: #020617;
      border: none;
      border-radius: 14px;
      padding: 0 18px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.1s;
    }
    button.add-btn:active { transform: scale(0.95); }
    .filters {
      display: flex;
      gap: 6px;
      background: #020617;
      padding: 4px;
      border-radius: 12px;
      border: 1px solid #1e293b;
    }
    .filter-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn.active {
      background: #1e293b;
      color: #38bdf8;
    }
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 12px 14px;
      transition: all 0.2s;
    }
    .task-item.completed {
      opacity: 0.55;
      border-color: #0f172a;
    }
    .task-item.completed .task-text {
      text-decoration: line-through;
      color: #64748b;
    }
    .checkbox {
      width: 22px;
      height: 22px;
      border-radius: 8px;
      border: 2px solid #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .checkbox.checked {
      background: #10b981;
      border-color: #10b981;
      color: #022c22;
      font-weight: 900;
    }
    .task-text {
      flex: 1;
      font-size: 14px;
      word-break: break-word;
    }
    .p-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .p-high { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .p-med { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .p-low { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .del-btn {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
    }
    .del-btn:hover { color: #ef4444; }
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #64748b;
      font-size: 13px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1e293b;
      padding-top: 12px;
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      font-size: 12px;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="app-card">
    <div class="header">
      <div>
        <div class="title">⚡ ADEM TASK MATRIX</div>
        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      </div>
      <span id="statsBadge" style="font-size: 12px; color: #38bdf8; font-weight: 700;">0 / 0</span>
    </div>

    <form class="input-group" onsubmit="handleAddTask(event)">
      <input type="text" id="taskInput" class="task-input" placeholder="أضف مهمة جديدة واضغط Enter..." required>
      <select id="prioritySelect" class="priority-select">
        <option value="high">عالي 🔴</option>
        <option value="med" selected>متوسط 🟡</option>
        <option value="low">عادي 🔵</option>
      </select>
      <button type="submit" class="add-btn">إضافة</button>
    </form>

    <div class="filters">
      <button type="button" class="filter-btn active" onclick="setFilter('all', this)">الكل</button>
      <button type="button" class="filter-btn" onclick="setFilter('active', this)">النشطة</button>
      <button type="button" class="filter-btn" onclick="setFilter('completed', this)">المكتملة</button>
    </div>

    <div class="task-list" id="taskList"></div>

    <div class="footer">
      <span id="countText">0 مهام متبقية</span>
      <button type="button" class="clear-btn" onclick="clearCompleted()">حذف المكتملة</button>
    </div>
  </div>

  <script>
    let tasks = JSON.parse(localStorage.getItem('adem_todos') || '[]');
    let currentFilter = 'all';

    function playTone(freq, dur) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch(e) {}
    }

    function saveAndRender() {
      localStorage.setItem('adem_todos', JSON.stringify(tasks));
      renderTasks();
    }

    function handleAddTask(e) {
      e.preventDefault();
      const input = document.getElementById('taskInput');
      const priority = document.getElementById('prioritySelect').value;
      const text = input.value.trim();
      if (!text) return;

      tasks.unshift({
        id: Date.now().toString(),
        text,
        priority,
        completed: false,
        createdAt: Date.now()
      });

      input.value = '';
      playTone(600, 0.05);
      saveAndRender();
    }

    function toggleTask(id) {
      tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      playTone(800, 0.06);
      saveAndRender();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      playTone(350, 0.08);
      saveAndRender();
    }

    function clearCompleted() {
      tasks = tasks.filter(t => !t.completed);
      playTone(400, 0.1);
      saveAndRender();
    }

    function setFilter(filter, el) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderTasks();
    }

    function renderTasks() {
      const list = document.getElementById('taskList');
      let filtered = tasks;
      if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
      if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">لا توجد مهام في هذه القائمة حالياً. 🚀</div>';
      } else {
        list.innerHTML = filtered.map(t => {
          const pClass = t.priority === 'high' ? 'p-high' : t.priority === 'med' ? 'p-med' : 'p-low';
          const pLabel = t.priority === 'high' ? 'أولوية قصوى' : t.priority === 'med' ? 'متوسطة' : 'عادية';
          return \`
            <div class="task-item \${t.completed ? 'completed' : ''}">
              <div class="checkbox \${t.completed ? 'checked' : ''}" onclick="toggleTask('\${t.id}')">
                \${t.completed ? '✓' : ''}
              </div>
              <span class="task-text">\${escapeHtml(t.text)}</span>
              <span class="p-badge \${pClass}">\${pLabel}</span>
              <button type="button" class="del-btn" onclick="deleteTask('\${t.id}')">✕</button>
            </div>
          \`;
        }).join('');
      }

      // Progress & Counters
      const total = tasks.length;
      const done = tasks.filter(t => t.completed).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      document.getElementById('progressFill').style.width = pct + '%';
      document.getElementById('statsBadge').innerText = done + ' / ' + total + ' (' + pct + '%)';
      document.getElementById('countText').innerText = (total - done) + ' مهام متبقية';
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Initial default task if first run
    if (tasks.length === 0) {
      tasks = [
        { id: '1', text: 'تطوير تطبيق تفاعلي مع ADEM', priority: 'high', completed: true, createdAt: Date.now() },
        { id: '2', text: 'تجربة إضافة وحذف المهام وتغيير الفلاتر', priority: 'med', completed: false, createdAt: Date.now() },
      ];
    }

    renderTasks();
  </script>
</body>
</html>`;
}

export function getPrecisionStopwatchTimerAppCode(title = 'المؤقت وساعة الإيقاف الذكية (Precision Chrono)'): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .chrono-card {
      width: 100%;
      max-width: 400px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(168, 85, 247, 0.3);
      backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.15);
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    .mode-tabs {
      display: flex;
      background: #020617;
      padding: 4px;
      border-radius: 14px;
      border: 1px solid #1e293b;
    }
    .mode-tab {
      flex: 1;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 0;
      border-radius: 10px;
      cursor: pointer;
    }
    .mode-tab.active {
      background: #1e293b;
      color: #c084fc;
    }
    .timer-display {
      font-size: 48px;
      font-weight: 900;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #f8fafc;
      direction: ltr;
      padding: 20px 0;
      background: #020617;
      border-radius: 20px;
      border: 1px solid #1e293b;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
    }
    .millis {
      font-size: 24px;
      color: #c084fc;
    }
    .btn-row {
      display: flex;
      gap: 10px;
    }
    .btn {
      flex: 1;
      padding: 14px 0;
      border-radius: 14px;
      font-weight: 800;
      font-size: 15px;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-start { background: #10b981; color: #022c22; }
    .btn-pause { background: #f59e0b; color: #451a03; }
    .btn-lap { background: #1e293b; color: #c084fc; border: 1px solid #334155; }
    .btn-reset { background: #ef4444; color: #450a0a; }
    .presets {
      display: flex;
      gap: 6px;
      justify-content: center;
    }
    .preset-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 11px;
      cursor: pointer;
    }
    .laps-container {
      max-height: 140px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .lap-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #020617;
      border-radius: 10px;
      font-size: 12px;
      font-family: ui-monospace, monospace;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <div class="chrono-card">
    <div class="mode-tabs">
      <button class="mode-tab active" onclick="switchMode('stopwatch', this)">ساعة إيقاف</button>
      <button class="mode-tab" onclick="switchMode('timer', this)">مؤقت تنازلي</button>
    </div>

    <div class="timer-display" id="display">00:00.00</div>

    <div class="presets" id="presetsRow" style="display: none;">
      <button class="preset-btn" onclick="setTimerSec(60)">1 دقيقة</button>
      <button class="preset-btn" onclick="setTimerSec(300)">5 دقائق</button>
      <button class="preset-btn" onclick="setTimerSec(900)">15 دقيقة</button>
      <button class="preset-btn" onclick="setTimerSec(1500)">25 دقيقة (بومودورو)</button>
    </div>

    <div class="btn-row">
      <button class="btn btn-start" id="mainBtn" onclick="toggleStart()">بدء</button>
      <button class="btn btn-lap" id="secBtn" onclick="handleSecondary()">دورة (Lap)</button>
      <button class="btn btn-reset" onclick="handleReset()">إعادة ضبط</button>
    </div>

    <div class="laps-container" id="lapsList"></div>
  </div>

  <script>
    let mode = 'stopwatch';
    let running = false;
    let startTime = 0;
    let elapsedTime = 0;
    let intervalId = null;
    let laps = [];
    let timerTargetSec = 300;
    let timerRemainingMs = 300000;

    function playBeep(freq = 800, dur = 0.1) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch(e) {}
    }

    function switchMode(newMode, el) {
      handleReset();
      mode = newMode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('presetsRow').style.display = mode === 'timer' ? 'flex' : 'none';
      document.getElementById('secBtn').style.display = mode === 'timer' ? 'none' : 'block';
      updateUI();
    }

    function toggleStart() {
      if (running) {
        pause();
      } else {
        start();
      }
    }

    function start() {
      running = true;
      playBeep(900, 0.05);
      document.getElementById('mainBtn').innerText = 'إيقاف مؤقت';
      document.getElementById('mainBtn').className = 'btn btn-pause';

      if (mode === 'stopwatch') {
        startTime = Date.now() - elapsedTime;
        intervalId = setInterval(() => {
          elapsedTime = Date.now() - startTime;
          updateUI();
        }, 30);
      } else {
        const end = Date.now() + timerRemainingMs;
        intervalId = setInterval(() => {
          timerRemainingMs = Math.max(0, end - Date.now());
          updateUI();
          if (timerRemainingMs <= 0) {
            pause();
            playAlarm();
          }
        }, 50);
      }
    }

    function pause() {
      running = false;
      playBeep(450, 0.05);
      clearInterval(intervalId);
      document.getElementById('mainBtn').innerText = 'استئناف';
      document.getElementById('mainBtn').className = 'btn btn-start';
    }

    function handleReset() {
      pause();
      elapsedTime = 0;
      timerRemainingMs = timerTargetSec * 1000;
      laps = [];
      document.getElementById('lapsList').innerHTML = '';
      document.getElementById('mainBtn').innerText = 'بدء';
      updateUI();
    }

    function handleSecondary() {
      if (mode === 'stopwatch' && running) {
        laps.unshift(formatTime(elapsedTime));
        playBeep(700, 0.03);
        renderLaps();
      }
    }

    function setTimerSec(sec) {
      timerTargetSec = sec;
      handleReset();
    }

    function playAlarm() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playBeep(1000, 0.15), i * 200);
      }
    }

    function formatTime(ms) {
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      const cs = Math.floor((ms % 1000) / 10);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
    }

    function updateUI() {
      const ms = mode === 'stopwatch' ? elapsedTime : timerRemainingMs;
      document.getElementById('display').innerText = formatTime(ms);
    }

    function renderLaps() {
      const list = document.getElementById('lapsList');
      list.innerHTML = laps.map((lap, i) => \`
        <div class="lap-item">
          <span>دورة \${laps.length - i}</span>
          <span>\${lap}</span>
        </div>
      \`).join('');
    }

    updateUI();
  </script>
</body>
</html>`;
}

export function getNeonCanvasDrawingAppCode(title = 'استوديو الرسم الرقمي الذكي (Canvas Paint Studio)'): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 8px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 18px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }
    .colors {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .color-swatch {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.1s;
    }
    .color-swatch.active {
      border-color: #ffffff;
      transform: scale(1.15);
    }
    .tools {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn.active {
      background: #38bdf8;
      color: #020617;
    }
    .canvas-container {
      flex: 1;
      min-height: 380px;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      position: relative;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: crosshair;
      touch-action: none;
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <div class="colors">
      <div class="color-swatch active" style="background:#020617;" onclick="setColor('#020617', this)"></div>
      <div class="color-swatch" style="background:#ef4444;" onclick="setColor('#ef4444', this)"></div>
      <div class="color-swatch" style="background:#3b82f6;" onclick="setColor('#3b82f6', this)"></div>
      <div class="color-swatch" style="background:#10b981;" onclick="setColor('#10b981', this)"></div>
      <div class="color-swatch" style="background:#f59e0b;" onclick="setColor('#f59e0b', this)"></div>
      <div class="color-swatch" style="background:#a855f7;" onclick="setColor('#a855f7', this)"></div>
      <input type="color" id="customColor" onchange="setColor(this.value)" style="width:28px; height:28px; border:none; border-radius:50%; cursor:pointer;">
    </div>

    <div class="tools">
      <label style="font-size:12px; color:#94a3b8;">الحجم:
        <input type="range" id="sizeRange" min="2" max="40" value="6" oninput="brushSize=this.value" style="width:70px;">
      </label>
      <button class="btn" id="eraserBtn" onclick="toggleEraser()">ممحاة</button>
      <button class="btn" onclick="clearCanvas()">مسح الكل</button>
      <button class="btn" style="background:#10b981; color:#022c22;" onclick="downloadDrawing()">💾 حفظ الصورة</button>
    </div>
  </div>

  <div class="canvas-container" id="container">
    <canvas id="paintCanvas"></canvas>
  </div>

  <script>
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('container');

    let drawing = false;
    let currentColor = '#020617';
    let brushSize = 6;
    let isEraser = false;

    function resize() {
      const rect = container.getBoundingClientRect();
      const img = ctx.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(img, 0, 0);
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);

    function setColor(color, el) {
      isEraser = false;
      currentColor = color;
      document.getElementById('eraserBtn').classList.remove('active');
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    function toggleEraser() {
      isEraser = !isEraser;
      document.getElementById('eraserBtn').classList.toggle('active', isEraser);
    }

    function clearCanvas() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function downloadDrawing() {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'adem_drawing.png';
      a.click();
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function start(e) {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      draw(e);
    }

    function draw(e) {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    function stop() {
      drawing = false;
      ctx.beginPath();
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stop);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stop);
  </script>
</body>
</html>`;
}

export function getNeonSnakeGameCode(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cyber Neon Snake</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 12px;
    }
    .game-card {
      width: 100%;
      max-width: 400px;
      background: #090d16;
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(56, 189, 248, 0.2);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 800;
      font-size: 13px;
    }
    .score-badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 4px 10px;
      border-radius: 12px;
      color: #38bdf8;
    }
    canvas {
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      background: #020617;
      border-radius: 18px;
      border: 1px solid #1e293b;
      display: block;
    }
    .controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      padding: 8px;
      border-radius: 16px;
    }
    .d-btn {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      padding: 14px 0;
      border-radius: 14px;
      font-size: 18px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .d-btn:active { transform: scale(0.92); background: #0284c7; color: white; }
    .restart-btn {
      background: #10b981;
      color: #022c22;
      border: none;
      padding: 10px 0;
      border-radius: 12px;
      font-weight: 800;
      cursor: pointer;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="game-card">
    <div class="hud">
      <span class="score-badge" id="score">النقاط: 0</span>
      <span style="color:#10b981;">⚡ NEON SNAKE</span>
      <span class="score-badge" id="highScore">الأعلى: 0</span>
    </div>
    <canvas id="c" width="400" height="400"></canvas>
    <div class="controls">
      <div></div>
      <button class="d-btn" onclick="changeDir('UP')">▲</button>
      <div></div>
      <button class="d-btn" onclick="changeDir('LEFT')">◀</button>
      <button class="d-btn" onclick="changeDir('DOWN')">▼</button>
      <button class="d-btn" onclick="changeDir('RIGHT')">▶</button>
    </div>
    <button class="restart-btn" onclick="initGame()">🔄 بدء / إعادة تشغيل اللعبة</button>
  </div>

  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('highScore');

    const GRID = 20;
    const TILES = canvas.width / GRID;

    let snake = [];
    let food = { x: 5, y: 5 };
    let dx = 1, dy = 0;
    let score = 0;
    let highScore = Number(localStorage.getItem('adem_snake_high') || 0);
    let gameLoop = null;
    let isGameOver = false;

    highScoreEl.innerText = 'الأعلى: ' + highScore;

    function playSound(freq, duration) {
      try {
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audio.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audio.currentTime + duration);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + duration);
      } catch(e) {}
    }

    function initGame() {
      if (gameLoop) clearInterval(gameLoop);
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dx = 1; dy = 0;
      score = 0;
      scoreEl.innerText = 'النقاط: 0';
      isGameOver = false;
      spawnFood();
      gameLoop = setInterval(update, 110);
    }

    function spawnFood() {
      food = {
        x: Math.floor(Math.random() * TILES),
        y: Math.floor(Math.random() * TILES),
      };
    }

    function update() {
      if (isGameOver) return;
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      if (head.x < 0) head.x = TILES - 1;
      if (head.x >= TILES) head.x = 0;
      if (head.y < 0) head.y = TILES - 1;
      if (head.y >= TILES) head.y = 0;

      for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
          gameOver();
          return;
        }
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = 'النقاط: ' + score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('adem_snake_high', highScore);
          highScoreEl.innerText = 'الأعلى: ' + highScore;
        }
        playSound(880, 0.08);
        spawnFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function draw() {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(food.x * GRID + GRID/2, food.y * GRID + GRID/2, GRID/2 - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#38bdf8' : '#0284c7';
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      });
      ctx.shadowBlur = 0;
    }

    function gameOver() {
      isGameOver = true;
      clearInterval(gameLoop);
      playSound(220, 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px sans-serif';
      ctx.fillText('النقاط: ' + score, canvas.width / 2, canvas.height / 2 + 25);
    }

    function changeDir(dir) {
      if (dir === 'UP' && dy !== 1) { dx = 0; dy = -1; }
      if (dir === 'DOWN' && dy !== -1) { dx = 0; dy = 1; }
      if (dir === 'LEFT' && dx !== 1) { dx = -1; dy = 0; }
      if (dir === 'RIGHT' && dx !== -1) { dx = 1; dy = 0; }
      playSound(400, 0.02);
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') changeDir('UP');
      if (e.key === 'ArrowDown') changeDir('DOWN');
      if (e.key === 'ArrowLeft') changeDir('LEFT');
      if (e.key === 'ArrowRight') changeDir('RIGHT');
    });

    initGame();
  </script>
</body>
</html>`;
}
