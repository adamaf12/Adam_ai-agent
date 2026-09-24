import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  HardDrive,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Play,
  Square,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Activity,
  Boxes,
  Zap,
  Flame,
  AlertTriangle,
  Globe,
  Trash2,
  ChevronDown
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  executeInDockerSandbox,
  getDockerSandboxStatus,
  pruneDockerContainers,
  type SandboxLanguage,
  type SandboxResourceLimits,
  type SandboxExecutionResult,
  type DockerSandboxStatus,
} from '../../core/dockerSandboxApi';

interface DockerSandboxRunnerProps {
  language: Language;
  initialCode?: string;
  initialLanguage?: SandboxLanguage;
  onCodeChange?: (code: string) => void;
}

export function DockerSandboxRunner({
  language: uiLang,
  initialCode = '',
  initialLanguage = 'javascript',
  onCodeChange,
}: DockerSandboxRunnerProps) {
  const isAr = uiLang === 'ar';

  const [code, setCode] = useState(initialCode);
  const [lang, setLang] = useState<SandboxLanguage>(initialLanguage);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  // Resource limits
  const [cpuLimit, setCpuLimit] = useState(1.0);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [networkEnabled, setNetworkEnabled] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SandboxExecutionResult | null>(null);
  const [status, setStatus] = useState<DockerSandboxStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [consoleTab, setConsoleTab] = useState<'all' | 'stdout' | 'stderr' | 'telemetry'>('all');
  const [elapsedTimer, setElapsedTimer] = useState(0);

  const timerRef = useRef<any>(null);

  // Sync with initialCode if provided
  useEffect(() => {
    if (initialCode && !code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Load status on mount
  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      const s = await getDockerSandboxStatus();
      setStatus(s);
    } catch {
      // ignore
    }
  };

  const handlePrune = async () => {
    try {
      await pruneDockerContainers();
      refreshStatus();
    } catch {
      // ignore
    }
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);
    setResult(null);
    setElapsedTimer(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTimer(Date.now() - startTime);
    }, 50);

    try {
      const limits: SandboxResourceLimits = {
        cpuLimit,
        memoryLimitMb,
        timeoutMs,
        networkEnabled,
      };

      const res = await executeInDockerSandbox({
        code,
        language: lang,
        stdin: stdin.trim() ? stdin : undefined,
        limits,
      });

      setResult(res);
      refreshStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
      clearInterval(timerRef.current);
    }
  };

  const handleCopyOutput = async () => {
    const text = result ? `${result.stdout}\n${result.stderr}`.trim() : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Preset code templates
  const loadPreset = (preset: 'hello' | 'cpu' | 'memory' | 'network') => {
    if (preset === 'hello') {
      if (lang === 'python') {
        setCode(`# Python 3.11 Docker Sandbox Benchmark\nimport sys, os, time\n\nprint("Hello from Python container!")\nprint(f"Python: {sys.version.split()[0]} on {sys.platform}")\nprint(f"Container PID: {os.getpid()}")\n\nstart = time.perf_counter()\nnums = [x**2 for x in range(100_000)]\nprint(f"Computed {len(nums):,} squares in {(time.perf_counter() - start)*1000:.2f}ms")\n`);
      } else if (lang === 'bash') {
        setCode(`#!/bin/sh\necho "=== Container Environment Info ==="\necho "Host: $(uname -a)"\necho "Current user: $(id)"\necho "Memory info:"\nfree -h 2>/dev/null || cat /proc/meminfo | head -n 3\necho "CPU cores: $(nproc)"\necho "Done!"\n`);
      } else {
        setCode(`// Node.js 20 Docker Sandbox Benchmark\nconsole.log("🚀 Container started successfully!");\nconsole.log("Node:", process.version, "Platform:", process.platform);\nconsole.log("PID:", process.pid);\n\nconst start = performance.now();\nlet sum = 0;\nfor (let i = 0; i < 1_000_000; i++) sum += i;\nconsole.log("Computed sum 0..1,000,000:", sum.toLocaleString());\nconsole.log("Compute duration:", (performance.now() - start).toFixed(2), "ms");\n`);
      }
    } else if (preset === 'cpu') {
      if (lang === 'python') {
        setCode(`# CPU Stress Test - Demonstrates vCPU quota limits\nimport time\nprint("Starting heavy CPU calculation...")\nstart = time.time()\ntarget = 10_000_000\ncount = 0\nfor i in range(target):\n    count += (i % 7)\nprint(f"Finished {target:,} iterations in {(time.time() - start):.3f}s")\n`);
      } else {
        setCode(`// CPU Quota & Stress Test\nconsole.log("🔥 Starting intensive math benchmark...");\nconst start = Date.now();\nlet primes = [];\nfor (let n = 2; n < 200000; n++) {\n  let isP = true;\n  for (let d = 2; d * d <= n; d++) {\n    if (n % d === 0) { isP = false; break; }\n  }\n  if (isP) primes.push(n);\n}\nconsole.log(\`Found \${primes.length.toLocaleString()} primes up to 200,000 in \${Date.now() - start}ms\`);\n`);
      }
    } else if (preset === 'memory') {
      if (lang === 'python') {
        setCode(`# Memory Allocation Test - Demonstrates container RAM limits & OOM protection\nimport sys\nprint("Allocating memory in chunks until ceiling...")\nchunks = []\ntry:\n    for i in range(1, 200):\n        # Allocate ~5MB per chunk\n        chunks.append(b"A" * (5 * 1024 * 1024))\n        print(f"Allocated {i * 5} MB RAM")\nexcept MemoryError:\n    print("Caught MemoryError! Sandbox memory quota enforced cleanly.")\n`);
      } else {
        setCode(`// Memory Allocation Test - Demonstrates container RAM limit & OOM protection\nconsole.log("📦 Allocating memory blocks to test RAM limit...");\nconst blocks = [];\ntry {\n  for (let i = 1; i <= 200; i++) {\n    // Allocate ~5MB buffer\n    blocks.push(Buffer.alloc(5 * 1024 * 1024, 0x41));\n    console.log(\`Allocated \${i * 5} MB RAM successfully\`);\n  }\n} catch (err) {\n  console.log("RAM allocation caught safely:", err.message);\n}\n`);
      }
    } else if (preset === 'network') {
      if (lang === 'python') {
        setCode(`# Network Air-Gap Isolation Test\nimport urllib.request\nprint("Attempting outbound request to verify network isolation...")\ntry:\n    with urllib.request.urlopen("https://example.com", timeout=3) as resp:\n        print(f"Outbound connection SUCCEEDED (Status: {resp.status})")\nexcept Exception as e:\n    print(f"Network Air-Gap active! Outbound blocked cleanly: {e}")\n`);
      } else {
        setCode(`// Network Air-Gap Isolation Test\nconsole.log("🔒 Probing outbound network connectivity...");\nfetch("https://example.com")\n  .then(res => console.log("Outbound connection allowed:", res.status))\n  .catch(err => console.log("Network air-gapped! Outbound blocked cleanly:", err.message));\n`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)] overflow-hidden font-sans">
      {/* Top Banner: Engine Status & Container Pool */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <Boxes size={14} className="text-cyan-400" />
            <span className="font-bold text-slate-200">
              {isAr ? 'محرك الحاويات' : 'Container Engine'}:
            </span>
            <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
              status?.dockerAvailable
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {status?.dockerAvailable ? 'Docker Engine (cgroups v2)' : 'Isolated Worker (Sandbox PID)'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span>{isAr ? 'الحاويات النشطة:' : 'Active Containers:'}</span>
            <span className="font-mono font-bold text-slate-200">{status?.activeContainersCount ?? 0}</span>
            <span className="mx-1 text-slate-700">|</span>
            <span>{isAr ? 'إجمالي التشغيل:' : 'Total Runs:'}</span>
            <span className="font-mono font-bold text-slate-200">{status?.totalExecutions ?? 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrune}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer text-xs"
            title={isAr ? 'تنظيف الحاويات المؤقتة' : 'Prune Containers'}
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">{isAr ? 'تنظيف الحاويات' : 'Prune Containers'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Language, Resource Limits (CPU / RAM / Timeout / Network), and Run Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--surface)]/90 border-b border-[var(--border)]">
        {/* Language selector & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted)]">{isAr ? 'اللغة:' : 'Language:'}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as SandboxLanguage)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
            >
              <option value="javascript">JavaScript (Node.js 20)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python 3.11</option>
              <option value="bash">Bash / Shell (Alpine)</option>
              <option value="html">HTML5 Test Harness</option>
            </select>
          </div>

          {/* Quick Presets */}
          <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-[var(--border)]">
            <span className="text-[11px] text-[var(--muted)] mr-1">{isAr ? 'نماذج جاهزة:' : 'Presets:'}</span>
            <button
              type="button"
              onClick={() => loadPreset('hello')}
              className="px-2 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[10px] font-mono border border-[var(--border)] transition cursor-pointer"
            >
              Benchmark
            </button>
            <button
              type="button"
              onClick={() => loadPreset('cpu')}
              className="px-2 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[10px] font-mono border border-[var(--border)] transition cursor-pointer text-amber-400"
            >
              CPU Limit
            </button>
            <button
              type="button"
              onClick={() => loadPreset('memory')}
              className="px-2 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[10px] font-mono border border-[var(--border)] transition cursor-pointer text-rose-400"
            >
              RAM / OOM
            </button>
            <button
              type="button"
              onClick={() => loadPreset('network')}
              className="px-2 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[10px] font-mono border border-[var(--border)] transition cursor-pointer text-cyan-400"
            >
              Air-Gap
            </button>
          </div>
        </div>

        {/* Resource Limits Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* CPU Limit */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]" title={isAr ? 'سقف المعالج vCPU' : 'CPU Quota'}>
            <Cpu size={13} className="text-cyan-400" />
            <span className="font-mono text-[11px] text-slate-300 font-bold">{cpuLimit} vCPU</span>
            <select
              value={cpuLimit}
              onChange={(e) => setCpuLimit(parseFloat(e.target.value))}
              className="bg-transparent border-0 text-slate-400 text-[10px] outline-none cursor-pointer"
            >
              <option value="0.25">0.25</option>
              <option value="0.5">0.5</option>
              <option value="1.0">1.0</option>
              <option value="2.0">2.0</option>
            </select>
          </div>

          {/* RAM Limit */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]" title={isAr ? 'الذاكرة العشوائية RAM' : 'Memory Ceiling'}>
            <HardDrive size={13} className="text-amber-400" />
            <span className="font-mono text-[11px] text-slate-300 font-bold">{memoryLimitMb} MB</span>
            <select
              value={memoryLimitMb}
              onChange={(e) => setMemoryLimitMb(parseInt(e.target.value, 10))}
              className="bg-transparent border-0 text-slate-400 text-[10px] outline-none cursor-pointer"
            >
              <option value="64">64MB</option>
              <option value="128">128MB</option>
              <option value="256">256MB</option>
              <option value="512">512MB</option>
            </select>
          </div>

          {/* Timeout */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]" title={isAr ? 'المهلة الزمنية' : 'Execution Timeout'}>
            <Clock size={13} className="text-indigo-400" />
            <span className="font-mono text-[11px] text-slate-300 font-bold">{timeoutMs / 1000}s</span>
            <select
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))}
              className="bg-transparent border-0 text-slate-400 text-[10px] outline-none cursor-pointer"
            >
              <option value="5000">5s</option>
              <option value="10000">10s</option>
              <option value="15000">15s</option>
              <option value="30000">30s</option>
            </select>
          </div>

          {/* Network Toggle */}
          <button
            type="button"
            onClick={() => setNetworkEnabled(!networkEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
              networkEnabled
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
            title={networkEnabled ? (isAr ? 'الشبكة مفعلة' : 'Outbound Network Allowed') : (isAr ? 'معزول هوائياً (بدون شبكة)' : 'Air-Gapped (No Network)')}
          >
            {networkEnabled ? <Globe size={12} /> : <ShieldCheck size={12} />}
            <span>{networkEnabled ? (isAr ? 'الشبكة: مفعلة' : 'Net: Bridge') : (isAr ? 'عزل هوائي' : 'Air-Gapped')}</span>
          </button>

          {/* Stdin Toggle */}
          <button
            type="button"
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer ${
              showStdin ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-[var(--surface-2)] border-[var(--border)] text-slate-400'
            }`}
          >
            stdin
          </button>

          {/* Primary Action Button: Run in Docker */}
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCcw size={13} className="animate-spin" />
                <span>{isAr ? 'جاري التنفيذ...' : 'Running...'} ({Math.round(elapsedTimer)}ms)</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>{isAr ? 'تشغيل في الحاوية' : 'Run in Docker'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Stdin Bar */}
      {showStdin && (
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 text-xs">
          <span className="font-mono text-cyan-400 text-[11px] font-bold">Standard Input (stdin):</span>
          <input
            type="text"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder={isAr ? 'أدخل البيانات النصية المراد إرسالها إلى stdin...' : 'Enter input data passed to process stdin...'}
            className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Main Split Body: Editor on Left/Top, Execution Terminal on Right/Bottom */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Code Editor Panel */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] text-xs text-[var(--muted)]">
            <span className="font-mono text-[11px]">
              {lang === 'javascript' ? 'script.js' : lang === 'typescript' ? 'script.ts' : lang === 'python' ? 'script.py' : lang === 'bash' ? 'script.sh' : 'index.html'}
            </span>
            <span className="text-[10px] text-slate-400">
              {code.length.toLocaleString()} {isAr ? 'حرف' : 'chars'} | {code.split('\n').length} {isAr ? 'سطر' : 'lines'}
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              onCodeChange?.(e.target.value);
            }}
            placeholder={isAr ? 'اكتب أو الصق الشفرة البرمجية هنا...' : 'Write or paste source code here...'}
            className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed outline-none border-0 resize-none selection:bg-cyan-500/30"
            spellCheck={false}
          />
        </div>

        {/* Live Container Console / Output Terminal */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Console Header Tabs */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <Terminal size={14} className="text-cyan-400 mr-1" />
              <button
                type="button"
                onClick={() => setConsoleTab('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  consoleTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'المخرجات' : 'Output'}
              </button>
              <button
                type="button"
                onClick={() => setConsoleTab('stdout')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  consoleTab === 'stdout' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                stdout
              </button>
              <button
                type="button"
                onClick={() => setConsoleTab('stderr')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  consoleTab === 'stderr' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                stderr
              </button>
              <button
                type="button"
                onClick={() => setConsoleTab('telemetry')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  consoleTab === 'telemetry' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'التليمترية' : 'Telemetry'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {result && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    result.exitCode === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    exit: {result.exitCode}
                  </span>
                  <span className="text-slate-400">{result.durationMs}ms</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyOutput}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isAr ? 'نسخ المخرجات' : 'Copy Output'}
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Terminal Screen Display */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed select-text">
            {isRunning && (
              <div className="flex items-center gap-3 text-cyan-400 animate-pulse pb-3">
                <RotateCcw size={14} className="animate-spin" />
                <span>
                  {isAr ? 'الحاوية قيد التشغيل في بيئة معزولة...' : 'Container executing in sandbox environment...'}
                </span>
                <span className="text-slate-500">({elapsedTimer}ms)</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 mb-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-start gap-2">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold">{isAr ? 'فشل تنفيذ الحاوية:' : 'Container Execution Error:'}</div>
                  <div className="text-[11px] mt-1">{errorMsg}</div>
                </div>
              </div>
            )}

            {result ? (
              <div>
                {/* Telemetry View */}
                {consoleTab === 'telemetry' && (
                  <div className="space-y-3 pb-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                        {isAr ? 'معلومات الحاوية المؤقتة' : 'Temporary Container Metadata'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">Container ID:</span> {result.containerId}</div>
                        <div><span className="text-slate-500">Engine:</span> {result.engine}</div>
                        <div><span className="text-slate-500">Wall Clock:</span> {result.durationMs} ms</div>
                        <div><span className="text-slate-500">Memory Peak:</span> {result.peakMemoryMb} MB</div>
                        <div><span className="text-slate-500">Exit Code:</span> {result.exitCode}</div>
                        <div><span className="text-slate-500">Network:</span> {result.resourceLimits.networkEnabled ? 'Enabled' : 'Air-Gapped'}</div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                        {result.engineDetails}
                      </div>
                    </div>

                    {result.oomKilled && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                        <Flame size={14} className="text-rose-400 flex-shrink-0" />
                        <span>{isAr ? 'تم إيقاف الحاوية لتجاوزها حد الذاكرة العشوائية المسموح (OOM Killed).' : 'Container terminated due to exceeding allocated RAM memory quota (OOM Killed).'}</span>
                      </div>
                    )}

                    {result.timedOut && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
                        <Clock size={14} className="text-amber-400 flex-shrink-0" />
                        <span>{isAr ? 'تم إيقاف الحاوية لتجاوزها المهلة الزمنية القصوى (Execution Timed Out).' : 'Container terminated due to exceeding hard wall-clock timeout limit.'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stdout view */}
                {(consoleTab === 'all' || consoleTab === 'stdout') && result.stdout && (
                  <div className="text-slate-100 whitespace-pre-wrap break-words pb-2">
                    {result.stdout}
                  </div>
                )}

                {/* Stderr view */}
                {(consoleTab === 'all' || consoleTab === 'stderr') && result.stderr && (
                  <div className="text-rose-400 whitespace-pre-wrap break-words pb-2 pt-1 border-t border-rose-950/40">
                    {result.stderr}
                  </div>
                )}

                {!result.stdout && !result.stderr && (
                  <div className="text-slate-500 italic">
                    {isAr ? '[تم التنفيذ بنجاح دون أي مخرجات نصية]' : '[Process finished cleanly with no text output]'}
                  </div>
                )}
              </div>
            ) : !isRunning && !errorMsg ? (
              <div className="text-slate-600 flex flex-col items-center justify-center h-full text-center py-10 space-y-2">
                <Boxes size={32} className="opacity-40" />
                <p className="text-xs">
                  {isAr
                    ? 'اضغط على "تشغيل في الحاوية" لتشغيل الكود داخل بيئة دوكر المعزولة بموارد محددة.'
                    : 'Click "Run in Docker" to execute code inside a secure isolated container with strict resource limits.'}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  {status?.dockerAvailable ? 'Docker Engine Connected' : 'Process Sandbox Worker Ready'}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
