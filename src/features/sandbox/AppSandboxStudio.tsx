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
  PlusCircle,
  FileCode,
  Search,
  Maximize2,
  Minimize2,
  Terminal,
  Volume2,
  Flame,
  ShieldCheck,
  Download,
  Share2,
  Cpu,
  AlertCircle,
  Layers,
  Sliders,
  Box,
  Radio,
  FileText,
  Zap,
  Sun,
  Eye,
  Send,
  HelpCircle
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  loadSandboxApps,
  saveSandboxApp,
  deleteSandboxApp,
  type SandboxApp
} from '../../core/appSandboxStorage';
import {
  DEFAULT_UE5_CONFIG,
  type UE5ConnectionConfig,
  generateUnrealCppHeader,
  generateUnrealCppSource,
  generateUnrealPythonScript,
  generateUnrealRemoteControlPreset,
  sendCommandToUnreal
} from '../../core/unrealEngineBridge';

interface AppSandboxStudioProps {
  language: Language;
  initialAppId?: string;
  onNavigateToChat?: (prompt: string) => void;
}

const copyLabels = {
  ar: {
    title: 'استوديو تطوير ومشغل الألعاب والتطبيقات 2026',
    subtitle: 'بيئة متقدمة لتشغيل، فحص، وتطوير ألعاب وتطبيقات الويب التفاعلية مع دعم التحقق المباشر من الطرفية والفيزياء والمؤثرات الصوتية.',
    userRequest: 'طلب المستخدم الأصلي:',
    previewTab: 'المعاينة والتشغيل المباشر',
    codeTab: 'محرر ومختبر الكود',
    deviceMode: 'نمط العرض',
    responsive: 'شاشة كاملة',
    mobile: 'هاتف ذكي',
    reload: 'إعادة تشغيل',
    openNewTab: 'فتح في نافذة مستقلة',
    copyCode: 'نسخ الكود',
    copied: 'تم النسخ!',
    savedApps: 'مكتبة الألعاب والتطبيقات',
    newGamePrompt: 'اطلب من ADAM برمجة لعبة أو تطبيق ثلاثي الأبعاد...',
    generateBtn: 'توليد وتشغيل',
    emptyList: 'لا توجد ألعاب أو تطبيقات محفوظة بعد.',
    deleteConfirm: 'حذف من السجل',
    all: 'الكل',
    games: 'ألعاب',
    apps: 'تطبيقات',
    searchPlaceholder: 'بحث في الألعاب والتطبيقات...',
    saveAndRun: 'حفظ وتشغيل مباشر',
    downloadHtml: 'تصدير HTML',
    codeSaved: 'تم حفظ الكود بنجاح!',
    terminalCheck: 'فحص الطرفية والسينتاكس',
    checking: 'جارٍ الفحص...',
    terminalSuccess: 'تم التحقق من سلامة الكود والسينتاكس بنجاح ⚡',
    terminalError: 'يوجد خطأ في سينتاكس الكود:',
    snippetsTitle: 'إضافات ومؤثرات سريعة للألعاب:',
    addAudio: 'مؤثرات صوتية (Web Audio)',
    addParticles: 'محرك انفجار الجسيمات (Particles)',
    addControls: 'أزرار تحكم لمسية (D-Pad)',
    addHighScore: 'حفظ أعلى نتيجة (Storage)',
    fullscreen: 'وضع المسرح / شاشة كاملة',
    exitFullscreen: 'إغلاق ملء الشاشة',
    unrealTab: 'جسر Unreal Engine 5',
    unrealSubtitle: 'ربط محرك الألعاب بمحرك Unreal Engine 5 عبر Web Remote Control و Pixel Streaming ومولد C++ و Python',
    ueController: 'التحكم الحي في العالم (Remote Control)',
    ueCpp: 'تصدير كود C++ (Actor / Pawn)',
    uePython: 'بناء المستوى بالبايثون (Python Lib)',
    uePreset: 'إعدادات Remote Preset (JSON)',
    ueStreaming: 'البث المباشر (Pixel Streaming)',
    ueGuide: 'دليل التوصيل والتشغيل',
    ueStatus: 'حالة الاتصال بمحرك Unreal Engine',
    ueTestConnect: 'اختبار الاتصال',
    ueConnected: 'متصل بمحرك Unreal Engine 5 🚀',
    ueDisconnected: 'غير متصل (يعمل بنمط المحاكاة المباشرة)',
    spawnActor: 'توليد ممثل/مجسم ثلاثي الأبعاد في Unreal',
    adjustLight: 'ضبط إضاءة وبيئة العالم',
    triggerAction: 'إطلاق ليزر / حركة باللعبة',
    execPython: 'تشغيل سكريبت بايثون في محرر Unreal',
    copyHeader: 'نسخ C++ Header (.h)',
    copySource: 'نسخ C++ Source (.cpp)',
    copyPy: 'نسخ سكريبت بايثون (.py)',
    templatePong: '🏓 قالب لعبة Pong',
    templateSnake: '🐍 قالب لعبة الثعبان',
    gameConsole: 'طرفية تشغيل اللعبة وأخطاء الـ Runtime',
    clearConsole: 'مسح السجلات',
    downloadCppZip: 'تحميل حزمة C++ / Python',
  },
  en: {
    templatePong: '🏓 Pong Template',
    templateSnake: '🐍 Snake Template',
    gameConsole: 'Live Game Runtime Console & Logs',
    clearConsole: 'Clear Logs',
    title: 'Game & App Sandbox Studio 2026',
    subtitle: 'Advanced development & execution environment for interactive Web games and apps with Terminal sandbox syntax validation, Web Audio, and particle physics.',
    userRequest: 'User Request:',
    previewTab: 'Live Interactive Runner',
    codeTab: 'Source Code & Lab',
    deviceMode: 'Display Mode',
    responsive: 'Desktop / Fluid',
    mobile: 'Mobile Device',
    reload: 'Restart Game',
    openNewTab: 'Open in New Tab',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    savedApps: 'Games & Apps Library',
    newGamePrompt: 'Ask ADAM to build a new 3D/2D game or application...',
    generateBtn: 'Generate & Run',
    emptyList: 'No saved games or apps yet.',
    deleteConfirm: 'Delete',
    all: 'All',
    games: 'Games',
    apps: 'Apps',
    searchPlaceholder: 'Search games & apps...',
    saveAndRun: 'Save & Run Live',
    downloadHtml: 'Export HTML',
    codeSaved: 'Code Saved Successfully!',
    terminalCheck: 'Terminal Sandbox Check',
    checking: 'Checking...',
    terminalSuccess: 'Syntax & Code verified clean by Node Sandbox ⚡',
    terminalError: 'Syntax error detected:',
    snippetsTitle: 'Game Engine Quick Boosters:',
    addAudio: 'Audio Synthesizer (Web Audio)',
    addParticles: 'Particle Physics Engine',
    addControls: 'Virtual Touch Controls',
    addHighScore: 'High Score System',
    fullscreen: 'Theater / Fullscreen Mode',
    exitFullscreen: 'Exit Fullscreen',
    unrealTab: 'Unreal Engine 5 Bridge',
    unrealSubtitle: 'Integrate Game Sandbox with Unreal Engine 5 via Web Remote Control, Pixel Streaming, and C++/Python Generators',
    ueController: 'Live World Actuator (Remote Control)',
    ueCpp: 'Export C++ Actor (.h / .cpp)',
    uePython: 'Python Level Generator',
    uePreset: 'Remote Preset (JSON)',
    ueStreaming: 'Pixel Streaming (WebRTC)',
    ueGuide: 'Step-by-Step Setup Guide',
    ueStatus: 'Unreal Engine Connection Status',
    ueTestConnect: 'Test Connection',
    ueConnected: 'Connected to Unreal Engine 5 🚀',
    ueDisconnected: 'Simulated Bridge (Offline / Standby)',
    spawnActor: 'Spawn 3D Actor in UE5 World',
    adjustLight: 'Adjust World Lighting & Atmosphere',
    triggerAction: 'Trigger Game Action / Laser',
    execPython: 'Execute Python Script in UE Editor',
    copyHeader: 'Copy C++ Header (.h)',
    copySource: 'Copy C++ Source (.cpp)',
    copyPy: 'Copy Python Script (.py)',
    downloadCppZip: 'Export C++ / Python Package',
  }
};

export function AppSandboxStudio({
  language,
  initialAppId,
  onNavigateToChat
}: AppSandboxStudioProps) {
  const t = copyLabels[language];
  const [apps, setApps] = useState<SandboxApp[]>(() => loadSandboxApps());
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    if (initialAppId && apps.some((a) => a.id === initialAppId)) {
      return initialAppId;
    }
    return apps[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'unreal'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile'>('responsive');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterCategory, setFilterCategory] = useState<'all' | 'game' | 'app'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [editedCode, setEditedCode] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Terminal Sandbox Validation state
  const [isCheckingTerminal, setIsCheckingTerminal] = useState(false);
  const [terminalResult, setTerminalResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Unreal Engine 5 Integration state
  const [ueConfig, setUeConfig] = useState<UE5ConnectionConfig>(DEFAULT_UE5_CONFIG);
  const [ueSubTab, setUeSubTab] = useState<'controller' | 'cpp' | 'python' | 'preset' | 'streaming' | 'guide'>('controller');
  const [isTestingUE, setIsTestingUE] = useState(false);
  const [ueTestFeedback, setUeTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingUECommand, setIsSendingUECommand] = useState(false);
  const [ueLogs, setUeLogs] = useState<Array<{ id: string; time: string; action: string; status: 'ok' | 'err'; message: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      action: 'INIT_BRIDGE',
      status: 'ok',
      message: 'Unreal Engine 5 Bridge ready. Web Remote Control & Pixel Streaming configured.'
    }
  ]);
  const [spawnActorType, setSpawnActorType] = useState<'space_pawn' | 'drone' | 'asteroid' | 'light'>('space_pawn');
  const [actorX, setActorX] = useState(0);
  const [actorY, setActorY] = useState(0);
  const [actorZ, setActorZ] = useState(150);
  const [sunIntensity, setSunIntensity] = useState(10);
  const [sunPitch, setSunPitch] = useState(-45);
  const [copiedUeSnippet, setCopiedUeSnippet] = useState<string | null>(null);

  // Live Game Runtime Console state
  const [gameConsoleLogs, setGameConsoleLogs] = useState<Array<{ id: string; time: string; level: string; message: string }>>([]);
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ADAM_GAME_CONSOLE') {
        setGameConsoleLogs(prev => [
          {
            id: Math.random().toString(36).slice(2, 7),
            time: new Date().toLocaleTimeString(),
            level: event.data.level || 'log',
            message: event.data.message || ''
          },
          ...prev.slice(0, 49)
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep selected app and editedCode in sync
  useEffect(() => {
    if (initialAppId) {
      setSelectedAppId(initialAppId);
    }
  }, [initialAppId]);

  const selectedApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0] || null;
  }, [apps, selectedAppId]);

  useEffect(() => {
    if (selectedApp) {
      setEditedCode(selectedApp.code);
      setTerminalResult(null);
    }
  }, [selectedApp]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory =
        filterCategory === 'all' ? true : app.category === filterCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [apps, filterCategory, searchQuery]);

  // Build bundled HTML using editedCode so live changes reflect immediately
  const bundledHtml = useMemo(() => {
    if (!selectedApp) return '';
    let raw = editedCode || selectedApp.code;

    const consoleScript = `<script>
  (function() {
    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;
    function sendMsg(type, args) {
      try {
        window.parent.postMessage({
          type: 'ADAM_GAME_CONSOLE',
          level: type,
          message: Array.from(args).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        }, '*');
      } catch(e) {}
    }
    console.log = function() { sendMsg('log', arguments); origLog.apply(console, arguments); };
    console.error = function() { sendMsg('error', arguments); origError.apply(console, arguments); };
    console.warn = function() { sendMsg('warn', arguments); origWarn.apply(console, arguments); };
    window.onerror = function(msg, url, line, col, error) {
      sendMsg('error', 'Uncaught Error: ' + msg + ' (Line ' + (line || 0) + ')');
      return false;
    };
  })();
</script>`;

    if (raw.includes('<!DOCTYPE html>') || raw.includes('<html')) {
      if (!raw.includes('tailwindcss') && !raw.includes('<style')) {
        raw = raw.replace(
          '<head>',
          '<head><script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>'
        );
      }
      if (raw.includes('<head>')) {
        raw = raw.replace('<head>', `<head>\n${consoleScript}`);
      }
      return raw;
    }

    return `<!DOCTYPE html>
<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedApp.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  ${consoleScript}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #app-root {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="app-root">
    ${raw}
  </div>
</body>
</html>`;
  }, [selectedApp, editedCode, language]);

  const handleCopyCode = () => {
    if (!selectedApp) return;
    navigator.clipboard.writeText(editedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndRun = () => {
    if (!selectedApp) return;
    const updatedApp: SandboxApp = {
      ...selectedApp,
      code: editedCode
    };
    saveSandboxApp(updatedApp);
    setApps(loadSandboxApps());
    setSaveSuccess(true);
    setReloadKey((k) => k + 1);
    setActiveTab('preview');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDownloadHtml = () => {
    if (!selectedApp) return;
    const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedApp.id || 'game'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenWindow = () => {
    if (!bundledHtml) return;
    const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSandboxApp(id);
    setApps(updated);
    if (selectedAppId === id) {
      setSelectedAppId(updated[0]?.id || '');
    }
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    if (onNavigateToChat) {
      onNavigateToChat(
        `برمج لي تطبيق أو لعبة تفاعلية كاملة برمجياً كود HTML/JS: ${customPrompt.trim()}`
      );
    }
  };

  // Direct Terminal Sandbox Validator
  const handleTerminalValidation = async () => {
    if (!editedCode) return;
    setIsCheckingTerminal(true);
    setTerminalResult(null);

    try {
      // Extract script contents to validate with Node VM
      const scriptMatches = editedCode.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
      let jsCode = '';
      if (scriptMatches) {
        jsCode = scriptMatches
          .map((s) => s.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, ''))
          .join('\n;\n');
      } else {
        jsCode = editedCode;
      }

      const response = await fetch('/api/terminal-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_syntax',
          language: 'javascript',
          code: jsCode
        })
      });

      const data = await response.json();
      if (data.valid || data.success) {
        setTerminalResult({
          success: true,
          message: t.terminalSuccess,
          details: `Node Sandbox Syntax OK (Checked in ${data.executionTimeMs || 4}ms)`
        });
      } else {
        setTerminalResult({
          success: false,
          message: `${t.terminalError} ${data.error || 'Syntax parsing error'}`,
          details: data.details || data.output
        });
      }
    } catch {
      // Fallback local syntax evaluation
      try {
        const scriptMatches = editedCode.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
        if (scriptMatches) {
          scriptMatches.forEach((s) => {
            const clean = s.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
            new Function(clean);
          });
        }
        setTerminalResult({
          success: true,
          message: t.terminalSuccess,
          details: 'Local JS Engine: No syntax errors detected.'
        });
      } catch (err: unknown) {
        setTerminalResult({
          success: false,
          message: `${t.terminalError} ${(err as Error).message}`
        });
      }
    } finally {
      setIsCheckingTerminal(false);
    }
  };

  // Game Engine snippet booster
  const handleInjectSnippet = (type: 'audio' | 'particles' | 'dpad' | 'highscore') => {
    let snippet = '';
    if (type === 'audio') {
      snippet = `
// --- Web Audio SFX Engine ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let sfxAudioCtx = null;
function playSound(type = 'laser') {
  try {
    if (!sfxAudioCtx) sfxAudioCtx = new AudioCtx();
    const osc = sfxAudioCtx.createOscillator();
    const gain = sfxAudioCtx.createGain();
    const now = sfxAudioCtx.currentTime;
    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.stop(now + 0.15);
    } else if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.stop(now + 0.2);
    }
    osc.connect(gain);
    gain.connect(sfxAudioCtx.destination);
    osc.start();
  } catch(e) {}
}
`;
    } else if (type === 'particles') {
      snippet = `
// --- Particle Explosions Engine ---
let fxParticles = [];
function createExplosion(x, y, color = '#38bdf8', count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 1.5;
    fxParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02,
      color,
      size: Math.random() * 3 + 2
    });
  }
}
function updateParticles(ctx) {
  fxParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (ctx && p.life > 0) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  if (ctx) ctx.globalAlpha = 1.0;
  fxParticles = fxParticles.filter(p => p.life > 0);
}
`;
    } else if (type === 'highscore') {
      snippet = `
// --- Local Storage High Score Manager ---
const GAME_HIGH_SCORE_KEY = 'adam_game_highscore';
function getHighScore() {
  return parseInt(localStorage.getItem(GAME_HIGH_SCORE_KEY) || '0', 10);
}
function saveHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(GAME_HIGH_SCORE_KEY, score.toString());
    return true;
  }
  return false;
}
`;
    }

    if (snippet) {
      if (editedCode.includes('</script>')) {
        setEditedCode(editedCode.replace('</script>', `${snippet}\n</script>`));
      } else {
        setEditedCode(editedCode + `\n<script>${snippet}</script>`);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleLoadTemplate = (type: 'pong' | 'snake') => {
    let templateCode = '';
    if (type === 'pong') {
      templateCode = `<div class="flex flex-col items-center justify-center gap-3 p-4">
  <h2 class="text-xl font-bold text-emerald-400 font-mono">🏓 Retro Pong Arcade</h2>
  <canvas id="pongCanvas" width="480" height="320" class="bg-black border-2 border-emerald-500/50 rounded-xl shadow-2xl cursor-crosshair"></canvas>
  <div class="text-xs text-slate-400 flex gap-4">
    <span>Controls: Move Mouse / W & S</span>
    <span>Score: <strong id="scoreDisplay" class="text-emerald-300">0</strong></span>
  </div>
</div>
<script>
  const canvas = document.getElementById('pongCanvas');
  const ctx = canvas.getContext('2d');
  let playerY = 120, aiY = 120, ballX = 240, ballY = 160, ballVx = 4, ballVy = 3, score = 0;
  
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    playerY = e.clientY - rect.top - 30;
    if (playerY < 0) playerY = 0;
    if (playerY > 260) playerY = 260;
  });

  function update() {
    ballX += ballVx;
    ballY += ballVy;
    if (ballY <= 10 || ballY >= 310) ballVy *= -1;
    
    if (aiY + 30 < ballY) aiY += 3;
    else if (aiY + 30 > ballY) aiY -= 3;
    
    if (ballX <= 25 && ballY >= playerY && ballY <= playerY + 60) {
      ballVx *= -1.05;
      score++;
      document.getElementById('scoreDisplay').innerText = score;
    }
    if (ballX >= 455 && ballY >= aiY && ballY <= aiY + 60) {
      ballVx *= -1.05;
    }
    if (ballX < 0 || ballX > 480) {
      ballX = 240; ballY = 160; ballVx = 4; score = 0;
      document.getElementById('scoreDisplay').innerText = score;
    }
  }

  function draw() {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 480, 320);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(15, playerY, 10, 60);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(455, aiY, 10, 60);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI*2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
</script>`;
    } else if (type === 'snake') {
      templateCode = `<div class="flex flex-col items-center justify-center gap-3 p-4">
  <h2 class="text-xl font-bold text-emerald-400 font-mono">🐍 Retro Snake Game</h2>
  <canvas id="snakeCanvas" width="360" height="360" class="bg-black border-2 border-emerald-500/50 rounded-xl shadow-2xl"></canvas>
  <div class="text-xs text-slate-400 flex gap-4">
    <span>Use Arrow Keys</span>
    <span>Score: <strong id="snakeScore" class="text-emerald-300">0</strong></span>
  </div>
</div>
<script>
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const grid = 20;
  let snake = [{x: 160, y: 160}, {x: 140, y: 160}];
  let food = {x: 200, y: 200};
  let dx = grid, dy = 0, score = 0;

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -grid; dy = 0; }
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -grid; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = grid; dy = 0; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = grid; }
  });

  function gameLoop() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x < 0 || head.x >= 360 || head.y < 0 || head.y >= 360 || snake.some(s => s.x === head.x && s.y === head.y)) {
      snake = [{x: 160, y: 160}, {x: 140, y: 160}];
      score = 0; dx = grid; dy = 0;
      document.getElementById('snakeScore').innerText = score;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      document.getElementById('snakeScore').innerText = score;
      food = {x: Math.floor(Math.random()*18)*grid, y: Math.floor(Math.random()*18)*grid};
    } else {
      snake.pop();
    }

    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 360, 360);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(food.x, food.y, grid-2, grid-2);
    ctx.fillStyle = '#10b981';
    snake.forEach(s => ctx.fillRect(s.x, s.y, grid-2, grid-2));
  }
  setInterval(gameLoop, 100);
</script>`;
    }

    if (templateCode) {
      setEditedCode(templateCode);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleTestUeConnection = async () => {
    setIsTestingUE(true);
    setUeTestFeedback(null);
    try {
      const res = await sendCommandToUnreal(ueConfig, 'test_connection');
      setUeConfig(prev => ({ ...prev, connected: res.success, latencyMs: res.executionTimeMs }));
      setUeTestFeedback({
        success: res.success,
        message: res.message
      });
      setUeLogs(prev => [
        {
          id: Math.random().toString(36).slice(2, 7),
          time: new Date().toLocaleTimeString(),
          action: 'TEST_CONNECTION',
          status: res.success ? 'ok' : 'err',
          message: res.message
        },
        ...prev.slice(0, 19)
      ]);
    } catch (err: any) {
      setUeTestFeedback({
        success: false,
        message: err?.message || 'Connection test failed'
      });
    } finally {
      setIsTestingUE(false);
    }
  };

  const handleSendUeAction = async (action: 'spawn_actor' | 'execute_python' | 'adjust_lighting' | 'fire_action', payload?: any) => {
    setIsSendingUECommand(true);
    try {
      const res = await sendCommandToUnreal(ueConfig, action, payload);
      setUeLogs(prev => [
        {
          id: Math.random().toString(36).slice(2, 7),
          time: new Date().toLocaleTimeString(),
          action: action.toUpperCase(),
          status: res.success ? 'ok' : 'err',
          message: res.message
        },
        ...prev.slice(0, 19)
      ]);
    } catch (err: any) {
      setUeLogs(prev => [
        {
          id: Math.random().toString(36).slice(2, 7),
          time: new Date().toLocaleTimeString(),
          action: action.toUpperCase(),
          status: 'err',
          message: err?.message || 'Error executing action'
        },
        ...prev.slice(0, 19)
      ]);
    } finally {
      setIsSendingUECommand(false);
    }
  };

  const handleCopyUeSnippet = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedUeSnippet(key);
    setTimeout(() => setCopiedUeSnippet(null), 2000);
  };

  const handleDownloadCppZip = () => {
    const title = selectedApp?.title || 'AdamGame';
    const headerCode = generateUnrealCppHeader(title);
    const sourceCode = generateUnrealCppSource(title);
    const pyCode = generateUnrealPythonScript(title, selectedApp?.category);
    const presetCode = generateUnrealRemoteControlPreset(title);

    const combined = `// ==============================================================================
// 🎮 ADAM UNREAL ENGINE 5 INTEGRATION PACKAGE (2026)
// Game: ${title}
// Generated for: Unreal Engine 5.4+
// ==============================================================================

// ======================== [FILE 1: AAdamGameActor.h] ========================
${headerCode}

// ======================= [FILE 2: AAdamGameActor.cpp] =======================
${sourceCode}

// ====================== [FILE 3: build_adam_scene.py] ======================
${pyCode}

// ======================= [FILE 4: RemotePreset.json] =======================
${presetCode}
`;
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UnrealEngine5_${title.replace(/\s+/g, '_')}_Bundle.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="feature-page" style={{ maxWidth: '1400px' }} ref={containerRef}>
      {/* Header */}
      <div className="feature-heading">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="eyebrow flex items-center gap-1.5 text-emerald-400">
              <Gamepad2 size={16} />
              ADEM / HIGH-SPEED 3D GAME & APP RUNNER
            </span>
            <h1 className="text-xl sm:text-2xl font-black">{t.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 font-bold transition-all shadow-md"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {isFullscreen ? t.exitFullscreen : t.fullscreen}
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 mt-4`}>
        {/* Left Sidebar: List of Games & Apps (Hidden in Fullscreen) */}
        {!isFullscreen && (
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Quick Prompt Creation */}
            <div className="settings-card bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <form onSubmit={handleCreatePrompt} className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  {t.newGamePrompt}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? 'مثال: لعبة حرب الفضاء 3D، لعبة سباق نيون...'
                        : 'e.g. 3D Space flight shooter, neon arcade...'
                    }
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!customPrompt.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50 shadow-md"
                  >
                    <PlusCircle size={14} />
                    {t.generateBtn}
                  </button>
                </div>
              </form>
            </div>

            {/* Library & Filter */}
            <div className="settings-card bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileCode size={14} className="text-indigo-400" />
                  {t.savedApps} ({filteredApps.length})
                </span>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`px-2 py-0.5 rounded-md ${filterCategory === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    {t.all}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('game')}
                    className={`px-2 py-0.5 rounded-md ${filterCategory === 'game' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    {t.games}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('app')}
                    className={`px-2 py-0.5 rounded-md ${filterCategory === 'app' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    {t.apps}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 rtl:left-auto rtl:right-3"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-8 text-xs text-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Apps List */}
              <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredApps.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    {t.emptyList}
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedAppId(app.id);
                          setActiveTab('preview');
                          setReloadKey((k) => k + 1);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              app.category === 'game'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {app.category === 'game' ? (
                              <Gamepad2 size={16} />
                            ) : (
                              <Code2 size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className={`font-semibold truncate ${
                                isSelected ? 'text-emerald-400 font-bold' : 'text-slate-200'
                              }`}
                            >
                              {app.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {app.prompt || app.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500">
                                {new Date(app.createdAt).toLocaleDateString(
                                  language === 'ar' ? 'ar-DZ' : 'en-US',
                                  { month: 'short', day: 'numeric' }
                                )}
                              </span>
                              {app.id === 'space_shooter_3d' && (
                                <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/30 font-bold">
                                  3D Starfield
                                </span>
                              )}
                              {app.id === 'cyber_breakout' && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-bold">
                                  Cyberpunk FX
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(app.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md transition-colors"
                          title={t.deleteConfirm}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right / Main Sandbox Runner & Code Inspector */}
        <div className={`${isFullscreen ? 'col-span-1' : 'lg:col-span-8'} flex flex-col gap-4`}>
          {selectedApp ? (
            <div className="settings-card bg-slate-900/95 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* User Request Banner */}
              <div className="bg-slate-950/90 border-b border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {selectedApp.category === 'game' ? '🎮 لعبة تفاعلية 2026' : '📱 تطبيق مخصص'}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm truncate">
                      {selectedApp.title}
                    </h3>
                  </div>
                  {selectedApp.prompt && (
                    <div className="mt-1.5 text-xs text-slate-300 flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <strong className="text-emerald-400 shrink-0">{t.userRequest}</strong>
                      <span className="italic text-slate-300 select-text">"{selectedApp.prompt}"</span>
                    </div>
                  )}
                </div>

                {/* Main Action Tabs */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'preview'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Play size={13} />
                      {t.previewTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'code'
                          ? 'bg-indigo-500 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 size={13} />
                      {t.codeTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('unreal')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'unreal'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers size={13} />
                      <span>{t.unrealTab}</span>
                      <span className="text-[9px] bg-slate-950/80 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                        UE 5.4+
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-toolbar for Runner */}
              {activeTab === 'preview' && (
                <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-slate-950/80 border-b border-slate-800/80 text-xs gap-2">
                  {/* Device mode */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeviceMode('responsive')}
                      className={`p-1 rounded-md text-xs flex items-center gap-1 ${
                        deviceMode === 'responsive'
                          ? 'bg-slate-800 text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                      title={t.responsive}
                    >
                      <Monitor size={14} />
                      <span className="hidden sm:inline">{t.responsive}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceMode('mobile')}
                      className={`p-1 rounded-md text-xs flex items-center gap-1 ${
                        deviceMode === 'mobile'
                          ? 'bg-slate-800 text-emerald-400 font-medium'
                          : 'text-slate-400'
                      }`}
                      title={t.mobile}
                    >
                      <Smartphone size={14} />
                      <span className="hidden sm:inline">{t.mobile}</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowConsole(!showConsole)}
                      className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                        showConsole
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title={t.gameConsole}
                    >
                      <Terminal size={13} />
                      <span className="hidden sm:inline">Console</span>
                      {gameConsoleLogs.length > 0 && (
                        <span className="bg-amber-500 text-slate-950 font-bold px-1.5 rounded-full text-[10px]">
                          {gameConsoleLogs.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                      title={t.reload}
                    >
                      <RotateCcw size={13} />
                      <span className="hidden sm:inline">{t.reload}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadHtml}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                      title={t.downloadHtml}
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">{t.downloadHtml}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWindow}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                      title={t.openNewTab}
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">{t.openNewTab}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Body: Live Sandbox, Source Code, or Unreal Engine 5 Bridge */}
              <div className="p-4 bg-slate-950/40 min-h-[540px] flex items-center justify-center">
                {activeTab === 'preview' ? (
                  <div
                    className={`w-full flex flex-col items-center transition-all duration-300 ${
                      deviceMode === 'mobile' ? 'max-w-[420px]' : 'max-w-full'
                    }`}
                  >
                    <div
                      className={`w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl relative ${
                        deviceMode === 'mobile'
                          ? 'aspect-[9/16] max-h-[660px]'
                          : isFullscreen
                          ? 'h-[80vh]'
                          : 'min-h-[540px]'
                      }`}
                    >
                      <iframe
                        key={`${selectedApp.id}-${reloadKey}`}
                        srcDoc={bundledHtml}
                        title={selectedApp.title}
                        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                        className="w-full h-full border-0 absolute inset-0 bg-[#090d16]"
                      />
                    </div>

                    {/* Game Runtime Console & Error Inspector Drawer */}
                    {showConsole && (
                      <div className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                            <Terminal size={14} />
                            {t.gameConsole}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setGameConsoleLogs([])}
                              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {t.clearConsole}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowConsole(false)}
                              className="text-[10px] text-slate-400 hover:text-slate-200"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto font-mono text-[11px] flex flex-col gap-1 pr-1">
                          {gameConsoleLogs.length === 0 ? (
                            <div className="text-slate-500 py-3 text-center italic">No console logs or errors recorded yet. Play your game or inspect output here.</div>
                          ) : (
                            gameConsoleLogs.map((log) => (
                              <div
                                key={log.id}
                                className={`p-1.5 rounded border flex items-start gap-2 ${
                                  log.level === 'error'
                                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                                    : log.level === 'warn'
                                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span className="text-[10px] opacity-60 shrink-0">{log.time}</span>
                                <span className="uppercase text-[9px] px-1 rounded bg-black/40 shrink-0 font-bold">{log.level}</span>
                                <span className="break-all">{log.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'code' ? (
                  <div className="w-full flex flex-col gap-3">
                    {/* Code Editor Toolbar */}
                    <div className="flex flex-wrap justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                          <Terminal size={14} />
                          Live Sandbox Code Editor
                        </span>
                        {saveSuccess && (
                          <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            {t.codeSaved}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Terminal Syntax Validator */}
                        <button
                          type="button"
                          onClick={handleTerminalValidation}
                          disabled={isCheckingTerminal}
                          className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-50"
                          title={t.terminalCheck}
                        >
                          <ShieldCheck size={13} className={isCheckingTerminal ? 'animate-spin' : ''} />
                          {isCheckingTerminal ? t.checking : t.terminalCheck}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadHtml}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                          title={t.downloadHtml}
                        >
                          <Download size={13} className="text-indigo-400" />
                          {t.downloadHtml}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                        >
                          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          {copied ? t.copied : t.copyCode}
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveAndRun}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg"
                        >
                          <Play size={13} />
                          {t.saveAndRun}
                        </button>
                      </div>
                    </div>

                    {/* Game Booster Snippets Quick Bar */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Flame size={13} className="text-amber-400" />
                        {t.snippetsTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate('pong')}
                        className="bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors font-medium"
                      >
                        <Gamepad2 size={12} />
                        {t.templatePong}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate('snake')}
                        className="bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors font-medium"
                      >
                        <Gamepad2 size={12} />
                        {t.templateSnake}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInjectSnippet('audio')}
                        className="bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Volume2 size={12} />
                        {t.addAudio}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInjectSnippet('particles')}
                        className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Flame size={12} />
                        {t.addParticles}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInjectSnippet('highscore')}
                        className="bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Cpu size={12} />
                        {t.addHighScore}
                      </button>
                    </div>

                    {/* Terminal Feedback Box */}
                    {terminalResult && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                          terminalResult.success
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {terminalResult.success ? (
                          <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold">{terminalResult.message}</p>
                          {terminalResult.details && (
                            <pre className="text-[11px] opacity-80 mt-1 font-mono whitespace-pre-wrap">
                              {terminalResult.details}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="w-full h-[450px] bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-emerald-500 resize-y leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  /* Unreal Engine 5 Bridge Full Workspace */
                  <div className="w-full flex flex-col gap-4">
                    {/* UE5 Bridge Top Connection Bar */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                          <Layers size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200">
                              {t.unrealTab}
                            </h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${
                                ueConfig.connected
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ueConfig.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                                }`}
                              />
                              {ueConfig.connected ? t.ueConnected : t.ueDisconnected}
                            </span>
                            {ueConfig.latencyMs !== undefined && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {ueConfig.latencyMs}ms
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.unrealSubtitle}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs text-slate-300 font-mono">
                          <span className="text-slate-500 text-[10px] mr-1">REST:</span>
                          <input
                            type="text"
                            value={ueConfig.httpHost}
                            onChange={(e) => setUeConfig({ ...ueConfig, httpHost: e.target.value })}
                            className="bg-transparent text-xs text-slate-200 outline-none w-24"
                          />
                          <span className="text-slate-500 text-[10px]">:{ueConfig.httpPort}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleTestUeConnection}
                          disabled={isTestingUE}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
                        >
                          <Radio size={13} className={isTestingUE ? 'animate-spin' : ''} />
                          {isTestingUE ? t.checking : t.ueTestConnect}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadCppZip}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-semibold transition-colors"
                        >
                          <Download size={13} className="text-amber-400" />
                          {t.downloadCppZip}
                        </button>
                      </div>
                    </div>

                    {/* Feedback message banner if present */}
                    {ueTestFeedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                          ueTestFeedback.success
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">{ueTestFeedback.message}</p>
                        </div>
                      </div>
                    )}

                    {/* UE5 Sub-Navigation */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setUeSubTab('controller')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'controller'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sliders size={13} />
                        {t.ueController}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUeSubTab('cpp')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'cpp'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Code2 size={13} />
                        {t.ueCpp}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUeSubTab('python')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'python'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText size={13} />
                        {t.uePython}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUeSubTab('preset')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'preset'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Box size={13} />
                        {t.uePreset}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUeSubTab('streaming')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'streaming'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Eye size={13} />
                        {t.ueStreaming}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUeSubTab('guide')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                          ueSubTab === 'guide'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <HelpCircle size={13} />
                        {t.ueGuide}
                      </button>
                    </div>

                    {/* Sub-tab 1: Live Controller */}
                    {ueSubTab === 'controller' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Spawner & Trigger Controls */}
                        <div className="flex flex-col gap-3">
                          {/* Actor Spawner */}
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <Box size={14} />
                              {t.spawnActor}
                            </h5>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Actor Class</label>
                                <select
                                  value={spawnActorType}
                                  onChange={(e: any) => setSpawnActorType(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                                >
                                  <option value="space_pawn">🚀 Space Fighter Pawn</option>
                                  <option value="drone">👾 Enemy Cyber Drone</option>
                                  <option value="asteroid">🪨 Space Asteroid Mesh</option>
                                  <option value="light">💡 Point Light Actor</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Coordinates (X, Y, Z)</label>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    value={actorX}
                                    onChange={(e) => setActorX(Number(e.target.value))}
                                    className="w-1/3 bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200"
                                    title="X"
                                  />
                                  <input
                                    type="number"
                                    value={actorY}
                                    onChange={(e) => setActorY(Number(e.target.value))}
                                    className="w-1/3 bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200"
                                    title="Y"
                                  />
                                  <input
                                    type="number"
                                    value={actorZ}
                                    onChange={(e) => setActorZ(Number(e.target.value))}
                                    className="w-1/3 bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200"
                                    title="Z"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleSendUeAction('spawn_actor', {
                                  actorClass: spawnActorType,
                                  location: { x: actorX, y: actorY, z: actorZ },
                                  rotation: { pitch: 0, yaw: 0, roll: 0 },
                                  label: `Adam_${spawnActorType}_${Date.now()}`
                                })
                              }
                              disabled={isSendingUECommand}
                              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <Zap size={14} />
                              Spawn in Unreal Engine 5 World
                            </button>
                          </div>

                          {/* Lighting & Environment Controls */}
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <Sun size={14} />
                              {t.adjustLight}
                            </h5>

                            <div className="flex flex-col gap-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Sun Light Intensity ({sunIntensity} Lux)</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="30"
                                  value={sunIntensity}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSunIntensity(val);
                                    handleSendUeAction('adjust_lighting', { sunIntensity: val, sunPitch });
                                  }}
                                  className="w-40"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Sun Pitch Angle ({sunPitch}°)</span>
                                <input
                                  type="range"
                                  min="-90"
                                  max="0"
                                  value={sunPitch}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSunPitch(val);
                                    handleSendUeAction('adjust_lighting', { sunIntensity, sunPitch: val });
                                  }}
                                  className="w-40"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Game Action Triggers */}
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                            <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <Flame size={14} />
                              {t.triggerAction}
                            </h5>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendUeAction('fire_action', { action: 'RemoteFireLaser', power: 100 })}
                                className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Zap size={13} />
                                Fire Laser Cannon
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendUeAction('fire_action', { action: 'RemoteApplyDamage', damage: 25 })}
                                className="bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/30 p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Flame size={13} />
                                Apply Hit Damage (-25)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Real-Time Live Execution Log */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                              <Terminal size={14} className="text-emerald-400" />
                              Unreal Remote Control Live Terminal
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ueLogs.length} events
                            </span>
                          </div>

                          <div className="bg-black/90 p-3 rounded-xl border border-slate-800/90 font-mono text-[11px] h-[340px] overflow-y-auto flex flex-col gap-1.5 text-slate-300">
                            {ueLogs.map((log) => (
                              <div key={log.id} className="flex items-start gap-2 border-b border-slate-900 pb-1">
                                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                <span
                                  className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                                    log.status === 'ok'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {log.action}
                                </span>
                                <span className="text-slate-300 select-text leading-relaxed">
                                  {log.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 2: C++ Exporter */}
                    {ueSubTab === 'cpp' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 gap-2">
                          <span className="text-xs text-amber-400 font-mono font-semibold flex items-center gap-1.5">
                            <Code2 size={14} />
                            AAdamGameActor.h & AAdamGameActor.cpp (Unreal Engine 5.4+)
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyUeSnippet(generateUnrealCppHeader(selectedApp?.title || 'AdamGame'), 'cpp_h')}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                            >
                              {copiedUeSnippet === 'cpp_h' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              {t.copyHeader}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyUeSnippet(generateUnrealCppSource(selectedApp?.title || 'AdamGame'), 'cpp_src')}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                            >
                              {copiedUeSnippet === 'cpp_src' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              {t.copySource}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-amber-400 font-bold block mb-1 font-mono">AAdamGameActor.h</span>
                            <pre className="w-full h-[380px] bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-200 font-mono overflow-y-auto leading-relaxed">
                              {generateUnrealCppHeader(selectedApp?.title || 'AdamGame')}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] text-sky-400 font-bold block mb-1 font-mono">AAdamGameActor.cpp</span>
                            <pre className="w-full h-[380px] bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-200 font-mono overflow-y-auto leading-relaxed">
                              {generateUnrealCppSource(selectedApp?.title || 'AdamGame')}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 3: Python Generator */}
                    {ueSubTab === 'python' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 gap-2">
                          <span className="text-xs text-amber-400 font-mono font-semibold flex items-center gap-1.5">
                            <FileText size={14} />
                            build_adam_scene.py (Unreal Engine Editor Python Script)
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyUeSnippet(generateUnrealPythonScript(selectedApp?.title || 'AdamGame', selectedApp?.category), 'py')}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                            >
                              {copiedUeSnippet === 'py' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              {t.copyPy}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSendUeAction('execute_python', {
                                  script: generateUnrealPythonScript(selectedApp?.title || 'AdamGame', selectedApp?.category)
                                })
                              }
                              disabled={isSendingUECommand}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-md"
                            >
                              <Play size={13} />
                              {t.execPython}
                            </button>
                          </div>
                        </div>

                        <pre className="w-full h-[400px] bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 font-mono overflow-y-auto leading-relaxed">
                          {generateUnrealPythonScript(selectedApp?.title || 'AdamGame', selectedApp?.category)}
                        </pre>
                      </div>
                    )}

                    {/* Sub-tab 4: Remote Preset JSON */}
                    {ueSubTab === 'preset' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-xs text-amber-400 font-mono font-semibold flex items-center gap-1.5">
                            <Box size={14} />
                            Remote Control Preset Configuration (JSON)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUeSnippet(generateUnrealRemoteControlPreset(selectedApp?.title || 'AdamGame'), 'preset')}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-colors"
                          >
                            {copiedUeSnippet === 'preset' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            {t.copyCode}
                          </button>
                        </div>

                        <pre className="w-full h-[380px] bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-amber-300/90 font-mono overflow-y-auto leading-relaxed">
                          {generateUnrealRemoteControlPreset(selectedApp?.title || 'AdamGame')}
                        </pre>
                      </div>
                    )}

                    {/* Sub-tab 5: Pixel Streaming WebRTC */}
                    {ueSubTab === 'streaming' && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold">Signaling Server:</span>
                            <input
                              type="text"
                              value={ueConfig.pixelStreamingUrl}
                              onChange={(e) => setUeConfig({ ...ueConfig, pixelStreamingUrl: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono w-48 text-xs"
                            />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Default UE5 Pixel Streaming WebRTC Port: 8888
                          </span>
                        </div>

                        <div className="w-full aspect-[16/9] max-h-[480px] bg-black rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden shadow-2xl">
                          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-2.5 max-w-md z-10">
                            <Radio size={28} className="text-amber-400 animate-pulse" />
                            <h4 className="text-sm font-bold text-slate-200">
                              Unreal Engine Pixel Streaming Viewport
                            </h4>
                            <p className="text-xs text-slate-400">
                              {language === 'ar'
                                ? 'لبدء البث المباشر للفيديو بدقة 4K ومعدل 60 إطاراً في الثانية من محرك Unreal Engine 5، شغّل المشروع باستخدام الراية: -PixelStreamingIP=localhost -PixelStreamingPort=8888'
                                : 'To stream 4K 60FPS real-time viewport from Unreal Engine 5, launch your UE5 project with: -PixelStreamingIP=localhost -PixelStreamingPort=8888'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 6: Step-by-Step Setup Guide */}
                    {ueSubTab === 'guide' && (
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
                        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                          <HelpCircle size={16} />
                          {language === 'ar'
                            ? 'دليل ربط استوديو الألعاب بمحرك Unreal Engine 5 في 3 خطوات بسيطة'
                            : '3-Step Setup Guide to Connect with Unreal Engine 5'}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                              Step 1: Plugins
                            </span>
                            <h5 className="font-bold text-slate-100">
                              {language === 'ar' ? 'تفعيل الإضافات في محرك Unreal' : 'Enable UE5 Plugins'}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {language === 'ar'
                                ? 'افتح مشروعك في UE5 -> اذهب إلى Edit -> Plugins وفعل: "Web Remote Control" و "Remote Control WebSockets" و "Python Editor Script Plugin".'
                                : 'In UE5 Editor -> Edit -> Plugins -> Enable "Web Remote Control", "Remote Control WebSockets", and "Python Editor Script Plugin".'}
                            </p>
                          </div>

                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                              Step 2: Config Settings
                            </span>
                            <h5 className="font-bold text-slate-100">
                              {language === 'ar' ? 'إعدادات المنافذ في DefaultEngine.ini' : 'Port Configuration'}
                            </h5>
                            <pre className="bg-black/80 p-2 rounded text-[10px] text-emerald-300 font-mono">
{`[/Script/RemoteControl.RemoteControlSettings]
bEnableRemoteControl=True
HttpPort=30010
WebSocketsPort=30020`}
                            </pre>
                          </div>

                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                              Step 3: Connect & Spawn
                            </span>
                            <h5 className="font-bold text-slate-100">
                              {language === 'ar' ? 'الاختبار والتحكم الحي' : 'Test & Real-Time Actuation'}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {language === 'ar'
                                ? 'اضغط على "اختبار الاتصال"، ثم استخدم لوحة التحكم لتوليد الممثلين وتغيير الإضاءة وتشغيل سكريبتات البايثون في عالم اللعبة مباشرة!'
                                : 'Click "Test Connection", then use the Live World Actuator to spawn actors, adjust sun lights, and run Python scripts in UE5 in real-time!'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="settings-card text-center py-16 text-slate-500">
              {t.emptyList}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

