import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation,
  Play,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  Clock,
  Mic,
  Volume2,
  Square,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  GraduationCap,
  FileText,
  Layers,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Palette,
  Share2,
  Sliders,
  CheckCircle2,
  Eye,
  FileCode,
  Flame,
  Shield,
  Lightbulb,
  ExternalLink,
  Info
} from 'lucide-react';
import type { Language } from '../../core/domain';
import type {
  UniversityPresentation,
  UniversitySlide,
  PresentationTheme,
  PresentationType,
  AcademicDegree
} from './types';

interface UniversityPresentationStudioProps {
  language: Language;
  onNavigateToChat?: (prompt: string) => void;
}

// Preset themes configuration
const THEME_STYLES: Record<
  PresentationTheme,
  {
    nameAr: string;
    nameFr: string;
    nameEn: string;
    bgClass: string;
    cardBg: string;
    accentBorder: string;
    accentText: string;
    badgeBg: string;
    badgeText: string;
    gradientHeader: string;
    textColor: string;
    textMuted: string;
    calloutBg: string;
    previewColors: string[];
  }
> = {
  'oxford-navy': {
    nameAr: 'أوكسفورد الملكي (أزرق ملكي وذهبي)',
    nameFr: 'Oxford Navy & Platine (Classique Royal)',
    nameEn: 'Oxford Navy & Royal Gold',
    bgClass: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900/90 border-slate-800',
    accentBorder: 'border-amber-500/50',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-300',
    gradientHeader: 'from-blue-600 via-indigo-600 to-amber-500',
    textColor: 'text-slate-100',
    textMuted: 'text-slate-400',
    calloutBg: 'bg-gradient-to-r from-blue-950/60 to-slate-900/80 border-amber-500/30',
    previewColors: ['#0f172a', '#1e3a8a', '#f59e0b'],
  },
  'emerald-scholar': {
    nameAr: 'الزمرد الأكاديمي (أخضر زمردي حديث)',
    nameFr: 'Emerald Scholar (Sciences & Tech)',
    nameEn: 'Emerald Scholar & Teal',
    bgClass: 'bg-zinc-950 text-zinc-100',
    cardBg: 'bg-zinc-900/90 border-zinc-800',
    accentBorder: 'border-emerald-500/50',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    gradientHeader: 'from-emerald-500 via-teal-500 to-cyan-500',
    textColor: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    calloutBg: 'bg-gradient-to-r from-emerald-950/60 to-zinc-900/80 border-emerald-500/30',
    previewColors: ['#09090b', '#059669', '#14b8a6'],
  },
  'sorbonne-crimson': {
    nameAr: 'السوربون الكلاسيكي (عنابي ورمادي)',
    nameFr: 'Sorbonne Bordeaux (Lettres, Droit & Santé)',
    nameEn: 'Sorbonne Crimson & Slate',
    bgClass: 'bg-stone-950 text-stone-100',
    cardBg: 'bg-stone-900/90 border-stone-800',
    accentBorder: 'border-rose-500/50',
    accentText: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    badgeText: 'text-rose-300',
    gradientHeader: 'from-rose-600 via-amber-600 to-red-600',
    textColor: 'text-stone-100',
    textMuted: 'text-stone-400',
    calloutBg: 'bg-gradient-to-r from-rose-950/60 to-stone-900/80 border-rose-500/30',
    previewColors: ['#0c0a09', '#be123c', '#f43f5e'],
  },
  'cyber-terminal': {
    nameAr: 'سيبراني رقمي (أسود تيرمينال ونيون)',
    nameFr: 'Cyber Terminal (Informatique & IA)',
    nameEn: 'Obsidian Cyber Terminal',
    bgClass: 'bg-black text-cyan-50',
    cardBg: 'bg-zinc-950 border-cyan-900/50',
    accentBorder: 'border-cyan-500/50',
    accentText: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30',
    badgeText: 'text-cyan-300',
    gradientHeader: 'from-cyan-400 via-blue-500 to-purple-500',
    textColor: 'text-cyan-50',
    textMuted: 'text-cyan-200/60',
    calloutBg: 'bg-cyan-950/40 border-cyan-500/40',
    previewColors: ['#000000', '#06b6d4', '#3b82f6'],
  },
  'swiss-minimal': {
    nameAr: 'سويسري هادئ (أبيض نقي كلاسيكي)',
    nameFr: 'Swiss Minimalist (Épuré & Lumineux)',
    nameEn: 'Swiss Minimalist Clean',
    bgClass: 'bg-slate-50 text-slate-900',
    cardBg: 'bg-white border-slate-200 shadow-sm',
    accentBorder: 'border-blue-600/50',
    accentText: 'text-blue-700',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    gradientHeader: 'from-blue-700 to-indigo-800',
    textColor: 'text-slate-900',
    textMuted: 'text-slate-600',
    calloutBg: 'bg-blue-50/70 border-blue-200',
    previewColors: ['#f8fafc', '#2563eb', '#1e293b'],
  },
};

export function UniversityPresentationStudio({
  language,
  onNavigateToChat,
}: UniversityPresentationStudioProps) {
  const isAr = language === 'ar';

  // Generator form inputs
  const [topic, setTopic] = useState(
    isAr
      ? 'تصميم ونمذجة منصة ذكاء اصطناعي متكاملة للرعاية الصحية الذكية'
      : "Conception et Réalisation d'une Plateforme Intelligente avec IA & Microservices"
  );
  const [degree, setDegree] = useState<AcademicDegree>('master');
  const [presentationType, setPresentationType] = useState<PresentationType>('pfe');
  const [slideCount, setSlideCount] = useState<number>(12);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [docLanguage, setDocLanguage] = useState<'fr' | 'ar' | 'en'>(isAr ? 'ar' : 'fr');
  const [studentName, setStudentName] = useState(isAr ? 'الطالب الباحث' : 'Nom du Candidat');
  const [supervisorName, setSupervisorName] = useState(isAr ? 'أ.د. المشرف الأكاديمي' : 'Pr. Encadrant de Thèse');
  const [university, setUniversity] = useState(
    isAr ? 'جامعة العلوم والتكنولوجيا' : 'Université des Sciences & Faculté d’Ingénierie'
  );

  // Active Presentation State
  const [presentation, setPresentation] = useState<UniversityPresentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<PresentationTheme>('oxford-navy');
  const [viewMode, setViewMode] = useState<'deck' | 'slideshow' | 'presenter' | 'handout'>('deck');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Presenter Mode Live Defense Timer
  const [defenseSecondsElapsed, setDefenseSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [prompterFontSize, setPrompterFontSize] = useState<number>(16);

  // Laser Pointer in Slideshow
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  // Audio Speech synthesis for defense speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Editing slide state
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const slideshowContainerRef = useRef<HTMLDivElement>(null);

  // Auto-generate a starter presentation on first load if null
  useEffect(() => {
    if (!presentation) {
      handleGeneratePresentation();
    }
  }, []);

  // Timer interval for Presenter Mode
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setDefenseSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Keyboard navigation for Slideshow & Presenter mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'slideshow' || viewMode === 'presenter') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          handleNextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          handlePrevSlide();
        } else if (e.key === 'Escape') {
          setViewMode('deck');
          setLaserActive(false);
        } else if (e.key.toLowerCase() === 'f') {
          toggleFullScreen();
        } else if (e.key.toLowerCase() === 'l') {
          setLaserActive((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, presentation, currentSlideIndex]);

  // Handle Generate Presentation API
  const handleGeneratePresentation = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/academic/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          degree,
          presentationType,
          slideCount,
          language: docLanguage,
          targetDurationMinutes: durationMinutes,
          studentName,
          supervisorName,
          university,
        }),
      });
      const data = await res.json();
      if (data.ok && data.presentation) {
        setPresentation({
          ...data.presentation,
          id: `pres-${Date.now()}`,
          theme: selectedTheme,
          createdAt: new Date().toISOString(),
        });
        setCurrentSlideIndex(0);
        setDefenseSecondsElapsed(0);
        setIsTimerRunning(false);
      }
    } catch (err) {
      console.error('Error generating presentation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSlide = () => {
    if (!presentation) return;
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      slideshowContainerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleMouseMoveLaser = (e: React.MouseEvent) => {
    if (!laserActive || !slideshowContainerRef.current) return;
    const rect = slideshowContainerRef.current.getBoundingClientRect();
    setLaserPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Rehearsal Speech Audio Playback
  const handleToggleSpeechPlayback = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = docLanguage === 'fr' ? 'fr-FR' : docLanguage === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Quick preset topic applicator
  const applyPresetTopic = (
    presetTopic: string,
    presetDegree: AcademicDegree,
    presetType: PresentationType,
    presetLang: 'fr' | 'ar' | 'en'
  ) => {
    setTopic(presetTopic);
    setDegree(presetDegree);
    setPresentationType(presetType);
    setDocLanguage(presetLang);
  };

  const currentSlide = presentation?.slides[currentSlideIndex] || presentation?.slides[0];
  const theme = THEME_STYLES[selectedTheme];

  // Timing calculations
  const totalTargetSeconds = (presentation?.totalDurationMinutes || durationMinutes) * 60;
  const timerRatio = Math.min(defenseSecondsElapsed / totalTargetSeconds, 1);
  const formattedElapsed = `${String(Math.floor(defenseSecondsElapsed / 60)).padStart(2, '0')}:${String(
    defenseSecondsElapsed % 60
  ).padStart(2, '0')}`;
  const formattedTotal = `${String(Math.floor(totalTargetSeconds / 60)).padStart(2, '0')}:00`;

  const paceStatus = useMemo(() => {
    if (!presentation) return 'ontrack';
    const slideTargetFraction = (currentSlideIndex + 1) / presentation.slides.length;
    const timeFraction = defenseSecondsElapsed / totalTargetSeconds;
    if (timeFraction > 0.95) return 'danger';
    if (timeFraction > slideTargetFraction + 0.15) return 'behind';
    if (timeFraction < slideTargetFraction - 0.2) return 'ahead';
    return 'ontrack';
  }, [presentation, currentSlideIndex, defenseSecondsElapsed, totalTargetSeconds]);

  // Export functions
  const handleExportHTML = () => {
    if (!presentation) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="${presentation.language}">
<head>
  <meta charset="UTF-8">
  <title>${presentation.topic} — Soutenance Académique</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .slide-active { display: flex; }
    .slide-hidden { display: none; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between p-6">
  <header class="flex justify-between items-center pb-4 border-b border-slate-800 text-sm">
    <div class="font-bold text-amber-400">${presentation.topic}</div>
    <div class="text-slate-400">${presentation.degree} | ${presentation.university || ''}</div>
  </header>
  
  <main id="slide-container" class="flex-1 flex items-center justify-center py-6">
    ${presentation.slides
      .map(
        (s, idx) => `
      <div id="slide-${idx}" class="${idx === 0 ? 'slide-active' : 'slide-hidden'} w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-10 flex-col shadow-2xl space-y-6">
        <div class="flex justify-between items-center">
          <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">${s.category}</span>
          <span class="text-xs text-slate-400">Slide ${idx + 1} / ${presentation.slides.length}</span>
        </div>
        <h2 class="text-3xl font-extrabold text-white">${s.title}</h2>
        ${s.subtitle ? `<p class="text-sm text-slate-400">${s.subtitle}</p>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          ${s.points
            .map(
              (p) => `
            <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span class="font-bold text-amber-300 block mb-1">${p.boldPrefix}</span>
              <span class="text-slate-300 text-sm leading-relaxed">${p.text}</span>
            </div>`
            )
            .join('')}
        </div>
        ${s.callout ? `<div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-semibold">${s.callout}</div>` : ''}
        <div class="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          <strong class="text-amber-400 block mb-1">Discours Oral :</strong>
          ${s.speakerNotes.speechText}
        </div>
      </div>`
      )
      .join('')}
  </main>

  <footer class="flex justify-between items-center pt-4 border-t border-slate-800 text-sm">
    <button onclick="prevSlide()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">← Précédent</button>
    <span id="counter" class="text-slate-400 font-semibold">1 / ${presentation.slides.length}</span>
    <button onclick="nextSlide()" class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold">Suivant →</button>
  </footer>

  <script>
    let current = 0;
    const total = ${presentation.slides.length};
    function show(index) {
      for(let i=0; i<total; i++) {
        document.getElementById('slide-'+i).className = (i === index) ? 'slide-active w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-10 flex-col shadow-2xl space-y-6' : 'slide-hidden';
      }
      document.getElementById('counter').innerText = (index+1) + ' / ' + total;
    }
    function nextSlide() { if(current < total-1) { current++; show(current); } }
    function prevSlide() { if(current > 0) { current--; show(current); } }
    window.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if(e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Soutenance_${presentation.topic.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_').slice(0, 30)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullScript = () => {
    if (!presentation) return;
    let fullText = `# ${presentation.topic}\n## ${isAr ? 'النص الكامل لإلقاء العرض الأكاديمي' : 'Texte Intégral du Discours de Soutenance'}\n`;
    fullText += `${isAr ? 'الطالب الباحث' : 'Candidat'}: ${presentation.studentName || studentName}\n`;
    fullText += `${isAr ? 'المشرف' : 'Encadrant'}: ${presentation.supervisorName || supervisorName}\n`;
    fullText += `${isAr ? 'المدة التقديرية' : 'Durée'}: ${presentation.totalDurationMinutes} min\n\n---\n\n`;

    presentation.slides.forEach((s) => {
      fullText += `### Slide ${s.slideNumber}: ${s.title} (${s.category})\n`;
      fullText += `⏱️ Durée estimée: ${s.speakerNotes.durationSeconds}s\n`;
      fullText += `💡 Conseil posture: ${s.speakerNotes.deliveryTips}\n\n`;
      fullText += `🎙️ DISCOURS MOT À MOT :\n"${s.speakerNotes.speechText}"\n\n`;
      if (s.juryQA && s.juryQA.length > 0) {
        fullText += `⚖️ QUESTION DU JURY ANTICIPÉE :\n`;
        s.juryQA.forEach((q) => {
          fullText += `• Question: ${q.question}\n• Réponse modèle: ${q.modelAnswer}\n`;
        });
      }
      fullText += `\n----------------------------------------\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Discours_Soutenance_${presentation.topic.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBeamer = () => {
    if (!presentation) return;
    let tex = `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{beaver}
\\usepackage[utf8]{inputenc}
\\title[${presentation.degree}]{${presentation.topic}}
\\author{${presentation.studentName || studentName}}
\\institute{${presentation.university || university}}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}
`;
    presentation.slides.forEach((s) => {
      tex += `
\\begin{frame}{${s.category}}{${s.title}}
  \\begin{itemize}
${s.points.map((p) => `    \\item \\textbf{${p.boldPrefix}} ${p.text}`).join('\n')}
  \\end{itemize}
  ${s.callout ? `\\begin{alertblock}{Message Clé}\n    ${s.callout}\n  \\end{alertblock}` : ''}
  \\note{${s.speakerNotes.speechText.replace(/%/g, '\\%')}}
\\end{frame}
`;
    });
    tex += `\\end{document}`;

    const blob = new Blob([tex], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation_beamer.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintHandout = () => {
    window.print();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 text-[var(--foreground)]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-sunken)] to-[var(--surface)] p-6 sm:p-8 mb-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide mb-3">
              <Presentation className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? 'محرك بناء عروض التخرج والدفاع الأكاديمي فائق الاحترافية'
                  : 'Générateur de Soutenances & Présentations Universitaires PFE de Haute Précision'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)] mb-2.5">
              {isAr ? 'صانع عروض التخرج والماستر والدكتوراه (Présentation PFE)' : 'Studio Universitaire de Soutenance & Présentations PFE'}
            </h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
              {isAr
                ? 'أنشئ عروضاً تقديمية أكاديمية بمستوى مشرفي اللجان: شرائح مهيكلة، ملاحظات إلقاء شفهية كلمة بكلمة، أسئلة وفخاخ اللجنة المحتملة مع إجاباتها النموذجية، ومؤقت دفاع ذكي.'
                : 'Structurez votre soutenance universitaire avec rigueur : diapositives denses, discours oral minuté mot à mot pour le jury, questions-pièges anticipées avec réponses modèles, et prompteur intelligent.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'slideshow' ? 'deck' : 'slideshow')}
              disabled={!presentation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isAr ? 'عرض ملء الشاشة' : 'Lancer le Diaporama'}</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'presenter' ? 'deck' : 'presenter')}
              disabled={!presentation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>{isAr ? 'شاشة الملقي (المحاضر)' : 'Mode Présentateur'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-[var(--foreground-muted)] whitespace-nowrap flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {isAr ? 'نماذج جاهزة سريعة:' : 'Modèles rapides :'}
        </span>
        {[
          {
            label: isAr ? 'PFE إعلام آلي وذكاء اصطناعي' : 'PFE Informatique & IA',
            topic: "Conception et Réalisation d'une Plateforme Intelligente avec IA & Microservices",
            degree: 'master' as const,
            type: 'pfe' as const,
            lang: 'fr' as const,
          },
          {
            label: isAr ? 'PFE هندسة وروبوتيك IoT' : 'PFE Robotique & IoT',
            topic: "Système Autonome de Télésurveillance Embarquée & IoT en Temps Réel",
            degree: 'engineering' as const,
            type: 'pfe' as const,
            lang: 'fr' as const,
          },
          {
            label: isAr ? 'دفاع أطروحة الدكتوراه' : 'Thèse de Doctorat (PhD)',
            topic: "Modélisation Formelle et Apprentissage Auto-Supervisé sur Graphes Complexes",
            degree: 'phd' as const,
            type: 'thesis' as const,
            lang: 'fr' as const,
          },
          {
            label: isAr ? 'مذكرة تخرج بالعربية' : 'Soutenance en Arabe',
            topic: 'تصميم ونمذجة منصة ذكاء اصطناعي للرعاية الصحية الذكية والتشخيص المبكر',
            degree: 'master' as const,
            type: 'pfe' as const,
            lang: 'ar' as const,
          },
          {
            label: isAr ? 'سيمينار / عرض محاضرة' : 'Exposé de Module',
            topic: 'Sécurité des Systèmes Distribués et Architectures Zero-Trust',
            degree: 'bachelor' as const,
            type: 'expose' as const,
            lang: 'fr' as const,
          },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => applyPresetTopic(item.topic, item.degree, item.type, item.lang)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-elevated)] hover:bg-amber-500/20 hover:text-amber-300 border border-[var(--border)] whitespace-nowrap transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* GENERATION CONFIGURATION DRAWER / CARD */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
              {isAr ? 'تخصيص موضوع وتفاصيل العرض الأكاديمي' : 'Paramètres de la Soutenance & Générateur IA'}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
            Gemini Flash 2.5 / Pro Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Topic Title */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'عنوان مذكرة التخرج أو المشروع' : 'Titre / Sujet du Projet ou Mémoire'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isAr ? 'مثال: نظام ذكي لمراقبة المحاصيل...' : "Ex: Développement d'un système intelligent..."}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Academic Degree */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'الطور / الدرجة العلمية' : 'Diplôme / Cycle Académique'}
            </label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value as AcademicDegree)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="bachelor">{isAr ? 'ليسانس / بكالوريوس (Licence / Bachelor)' : 'Licence (L3) / Bachelor'}</option>
              <option value="master">{isAr ? 'ماستر (Master / Mémoire PFE)' : 'Master (M2) / PFE Fin d’Études'}</option>
              <option value="engineering">{isAr ? 'مهندس دولة (Diplôme d’Ingénieur)' : 'École d’Ingénieur / Cycle Ingénieur'}</option>
              <option value="phd">{isAr ? 'دكتوراه (Doctorat / Thèse)' : 'Doctorat (PhD) / Thèse de Recherche'}</option>
              <option value="medicine">{isAr ? 'طب / صيدلة (Médecine / Pharmacie)' : 'Thèse d’Exercice Médecine / Pharmacie'}</option>
              <option value="preparatory">{isAr ? 'أقسام تحضيرية TIPE' : 'Classes Préparatoires (TIPE / TPE)'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Presentation Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'نوع العرض' : 'Format Soutenance'}
            </label>
            <select
              value={presentationType}
              onChange={(e) => setPresentationType(e.target.value as PresentationType)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
            >
              <option value="pfe">{isAr ? 'سوتنانس تخرج (PFE)' : 'Soutenance PFE'}</option>
              <option value="thesis">{isAr ? 'دفاع أطروحة بحث' : 'Thèse de Recherche'}</option>
              <option value="expose">{isAr ? 'عرض محاضرة (Exposé)' : 'Exposé de Module'}</option>
              <option value="startup">{isAr ? 'مشروع مقاولاتي / بيتج' : 'Pitch Projet Innovant'}</option>
              <option value="internship">{isAr ? 'تقرير تربص (Stage)' : 'Rapport de Stage'}</option>
            </select>
          </div>

          {/* Slide Count */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'عدد الشرائح' : 'Nombre de Diapos'}
            </label>
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
            >
              <option value="8">{isAr ? '8 شرائح (مكثف وسريع)' : '8 slides (Synthétique 10 min)'}</option>
              <option value="12">{isAr ? '12 شريحة (قياسي PFE)' : '12 slides (Standard 15 min)'}</option>
              <option value="16">{isAr ? '16 شريحة (شامل ومفصل)' : '16 slides (Détaillé 20 min)'}</option>
              <option value="20">{isAr ? '20 شريحة (ماستر / دكتوراه)' : '20 slides (Complet 30 min)'}</option>
            </select>
          </div>

          {/* Target Duration */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'مدة الإلقاء' : 'Temps Alloué'}
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
            >
              <option value="10">10 {isAr ? 'دقائق' : 'minutes'}</option>
              <option value="15">15 {isAr ? 'دقيقة (المعيار الأكاديمي)' : 'minutes (Standard)'}</option>
              <option value="20">20 {isAr ? 'دقيقة (ماستر)' : 'minutes (Master)'}</option>
              <option value="30">30 {isAr ? 'دقيقة (دكتوراه)' : 'minutes (Doctorat)'}</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--foreground-muted)]">
              {isAr ? 'لغة العرض' : 'Langue'}
            </label>
            <select
              value={docLanguage}
              onChange={(e) => setDocLanguage(e.target.value as 'fr' | 'ar' | 'en')}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
            >
              <option value="fr">Français (Académique PFE)</option>
              <option value="ar">العربية (أكاديمية فصحى)</option>
              <option value="en">English (International)</option>
            </select>
          </div>
        </div>

        {/* Additional Candidate & Supervisor Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder={isAr ? 'اسم الطالب / الباحث' : 'Nom du Candidat'}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
          />
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder={isAr ? 'اسم الأستاذ المشرف' : 'Nom de l’Encadrant'}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
          />
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder={isAr ? 'اسم الجامعة أو الكلية' : 'Université / Établissement'}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs text-[var(--foreground)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Theme Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[var(--foreground-muted)] flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              {isAr ? 'الثيم:' : 'Style :'}
            </span>
            {(Object.keys(THEME_STYLES) as PresentationTheme[]).map((thm) => (
              <button
                key={thm}
                onClick={() => setSelectedTheme(thm)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedTheme === thm
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex -space-x-1">
                  {THEME_STYLES[thm].previewColors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-black/40"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span>{isAr ? THEME_STYLES[thm].nameAr.split(' ')[0] : THEME_STYLES[thm].nameFr.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGeneratePresentation}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>{isAr ? 'جاري الصياغة الأكاديمية...' : 'Génération en cours...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'توليد العرض الاحترافي كاملاً' : 'Générer la Soutenance Complète'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ACTION BAR & EXPORT TOOLS */}
      {presentation && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--foreground)] px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
              {presentation.slides.length} {isAr ? 'شرائح' : 'diapositives'}
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              {isAr ? 'المدة المستهدفة:' : 'Durée :'} {presentation.totalDurationMinutes} min
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-sunken)] border border-[var(--border)] text-xs font-semibold transition-colors"
              title="Télécharger une présentation autonome HTML offline"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تصدير HTML تفاعلي' : 'Export HTML Interactif'}</span>
            </button>

            <button
              onClick={handleExportFullScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-sunken)] border border-[var(--border)] text-xs font-semibold transition-colors"
              title="Télécharger le script oral intégral mot à mot"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'نص الإلقاء كاملاً (.md)' : 'Discours Oral Complet'}</span>
            </button>

            <button
              onClick={handleExportBeamer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-sunken)] border border-[var(--border)] text-xs font-semibold transition-colors"
              title="Exporter pour LaTeX Beamer"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>LaTeX Beamer (.tex)</span>
            </button>

            <button
              onClick={handlePrintHandout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-sunken)] border border-[var(--border)] text-xs font-semibold transition-colors"
              title="Imprimer le support de soutenance pour le jury"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'طباعة بطاقات اللجنة' : 'Imprimer Fiches Jury'}</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODES: 1. DECK (STANDARD) 2. PRESENTER CONSOLE 3. SLIDESHOW */}

      {/* ============================================================== */}
      {/* 1. DECK OVERVIEW & ACTIVE SLIDE VIEWER */}
      {/* ============================================================== */}
      {viewMode === 'deck' && presentation && currentSlide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Thumbnails Navigator (Left / 3 cols) */}
          <div className="lg:col-span-3 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{isAr ? 'فهرس الشرائح' : 'Sommaire des Diapos'}</span>
              <span>{presentation.slides.length}</span>
            </div>

            {presentation.slides.map((s, idx) => {
              const isSelected = idx === currentSlideIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-full text-start p-3 rounded-2xl border transition-all relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/5'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground-muted)]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-400/90 truncate max-w-[140px]">
                      {s.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] line-clamp-1 mb-1">{s.title}</h4>
                  <p className="text-[10px] text-[var(--foreground-muted)] line-clamp-1">
                    {s.points[0]?.text || ''}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Center Main Slide Preview (6 cols) */}
          <div className="lg:col-span-9 space-y-5">
            {/* The Slide Canvas */}
            <div
              className={`rounded-3xl border ${theme.cardBg} ${theme.bgClass} p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 min-h-[460px] flex flex-col justify-between`}
            >
              {/* Header Badges */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} border`}
                    >
                      {currentSlide.category}
                    </span>
                    <span className={`text-xs ${theme.textMuted}`}>
                      {presentation.degree} • {presentation.university || university}
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-black/30 ${theme.textMuted}`}>
                    {currentSlideIndex + 1} / {presentation.slides.length}
                  </span>
                </div>

                {/* Slide Title */}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 leading-tight">
                  {currentSlide.title}
                </h2>
                {currentSlide.subtitle && (
                  <p className={`text-sm sm:text-base font-medium ${theme.accentText} mb-6`}>
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {/* Dynamic Slide Body Layout */}
              <div className="my-auto py-4">
                {/* Layout: metrics-3col */}
                {currentSlide.layout === 'metrics-3col' && currentSlide.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {currentSlide.metrics.map((m, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-md"
                      >
                        <div className={`text-2xl sm:text-3xl font-black ${theme.accentText} mb-1`}>{m.value}</div>
                        <div className={`text-xs font-medium ${theme.textMuted}`}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentSlide.points.map((pt, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-start gap-2.5"
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme.accentText}`} />
                      <div className="text-xs sm:text-sm leading-relaxed">
                        <strong className="font-bold text-white block mb-0.5">{pt.boldPrefix}</strong>
                        <span className={theme.textMuted}>{pt.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mathematical formula block if present */}
                {currentSlide.latexFormula && (
                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-amber-300 text-center">
                    {currentSlide.latexFormula}
                  </div>
                )}
              </div>

              {/* Key takeaway callout */}
              {currentSlide.callout && (
                <div className={`mt-4 p-3.5 rounded-2xl border ${theme.calloutBg} text-xs font-semibold`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className={`w-3.5 h-3.5 ${theme.accentText}`} />
                    <span className={`font-bold ${theme.accentText}`}>
                      {isAr ? 'الرسالة الجوهرية للجنة المناقشة:' : 'Message clé à retenir pour le jury :'}
                    </span>
                  </div>
                  <p className="leading-relaxed text-white/90">{currentSlide.callout}</p>
                </div>
              )}
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--surface-elevated)] disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isAr ? 'الشريحة السابقة' : 'Précédent'}</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md px-2">
                {presentation.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentSlideIndex ? 'w-6 bg-amber-400' : 'bg-[var(--border-strong)] hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextSlide}
                disabled={currentSlideIndex === presentation.slides.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 disabled:opacity-30"
              >
                <span>{isAr ? 'الشريحة التالية' : 'Suivant'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* SPEAKER SPEECH & JURY DEFENSE BOX (CRITICAL FOR STUDENTS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* Speaker Oral Speech */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      {isAr ? 'ماذا تقول للجنة بالتحديد (الكلام الشفهي):' : 'Discours Oral Mot à Mot pour le Jury :'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold">
                      ⏱️ {currentSlide.speakerNotes.durationSeconds}s
                    </span>
                    <button
                      onClick={() => handleToggleSpeechPlayback(currentSlide.speakerNotes.speechText)}
                      className="p-1 rounded-lg bg-[var(--surface-elevated)] hover:bg-amber-500/20 text-[var(--foreground-muted)] hover:text-amber-400 transition-colors"
                      title="Écouter le discours"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(currentSlide.speakerNotes.speechText, 'speech')}
                      className="p-1 rounded-lg bg-[var(--surface-elevated)] hover:bg-amber-500/20 text-[var(--foreground-muted)] hover:text-amber-400 transition-colors"
                      title="Copier le discours"
                    >
                      {isCopied === 'speech' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] text-xs sm:text-sm text-[var(--foreground)] leading-relaxed italic">
                  "{currentSlide.speakerNotes.speechText}"
                </div>

                <div className="text-[11px] text-[var(--foreground-muted)] flex items-start gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-blue-400 font-semibold">{isAr ? 'نصيحة الإلقاء: ' : 'Conseil posture : '}</strong>
                    {currentSlide.speakerNotes.deliveryTips}
                  </span>
                </div>
              </div>

              {/* Anticipated Jury Traps & Questions */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      {isAr ? 'أسئلة وفخاخ اللجنة المحتملة وإجاباتها النموذجية:' : 'Questions-Pièges du Jury & Réponses Modèles :'}
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold">
                    FAQ Soutenance
                  </span>
                </div>

                {currentSlide.juryQA && currentSlide.juryQA.length > 0 ? (
                  <div className="space-y-3">
                    {currentSlide.juryQA.map((qa, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-xs font-bold text-amber-300">{qa.question}</div>
                        </div>
                        <div className="pl-5 text-xs text-[var(--foreground-muted)] leading-relaxed">
                          <strong className="text-emerald-400 font-semibold block mb-0.5">
                            {isAr ? 'الإجابة النموذجية الموصى بها:' : 'Réponse modèle recommandée :'}
                          </strong>
                          {qa.modelAnswer}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] text-xs text-[var(--foreground-muted)] text-center">
                    {isAr ? 'لا توجد فخاخ معقدة مسجلة لهذه الشريحة التمهيدية.' : 'Diapositive fluide sans piège majeur.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PRESENTER CONSOLE (FOR DEFENSE REHEARSAL & LIVE TIMER) */}
      {/* ============================================================== */}
      {viewMode === 'presenter' && presentation && currentSlide && (
        <div className="space-y-6">
          {/* Top Presenter Bar */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                {isAr ? 'شاشة الإلقاء المباشر' : 'Console Présentateur'}
              </span>
              <span className="text-sm font-extrabold text-white">
                Slide {currentSlideIndex + 1} / {presentation.slides.length}
              </span>
            </div>

            {/* Defense Stopwatch */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/50 border border-slate-700">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-lg font-black text-amber-300">{formattedElapsed}</span>
                <span className="text-xs text-slate-500">/ {formattedTotal}</span>
              </div>

              {/* Status Pace Pill */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  paceStatus === 'danger'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : paceStatus === 'behind'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {paceStatus === 'danger'
                  ? isAr ? 'انتهى الوقت! اختم فوراً' : 'Temps critique !'
                  : paceStatus === 'behind'
                  ? isAr ? 'أسرع قليلاً' : 'Rythme lent'
                  : isAr ? 'الوتيرة ممتازة' : 'Rythme optimal'}
              </span>

              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  isTimerRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isTimerRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'بدء التوقيت' : 'Démarrer')}
              </button>

              <button
                onClick={() => {
                  setDefenseSecondsElapsed(0);
                  setIsTimerRunning(false);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                title="Réinitialiser le chrono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setViewMode('deck')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              {isAr ? 'العودة للمنصة' : 'Quitter Mode Présentateur'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Current Slide Display (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className={`rounded-3xl border ${theme.cardBg} ${theme.bgClass} p-8 shadow-2xl min-h-[380px] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                      {currentSlide.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {currentSlideIndex + 1} / {presentation.slides.length}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mb-1">{currentSlide.title}</h3>
                  {currentSlide.subtitle && <p className="text-xs text-amber-400 mb-4">{currentSlide.subtitle}</p>}
                </div>

                <div className="space-y-2 py-4">
                  {currentSlide.points.map((p, i) => (
                    <div key={i} className="text-xs leading-relaxed text-slate-300">
                      <strong className="text-white">• {p.boldPrefix} </strong>
                      {p.text}
                    </div>
                  ))}
                </div>

                {currentSlide.callout && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300">
                    {currentSlide.callout}
                  </div>
                )}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs disabled:opacity-40"
                >
                  ← {isAr ? 'السابقة' : 'Précédente'}
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === presentation.slides.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-40"
                >
                  {isAr ? 'التالية' : 'Suivante'} →
                </button>
              </div>
            </div>

            {/* Prompter Notes & Next Slide Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Teleprompter Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      {isAr ? 'الملقن الشفهي المباشر (Prompteur):' : 'Prompteur Oral Direct :'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPrompterFontSize((s) => Math.max(s - 2, 12))}
                      className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setPrompterFontSize((s) => Math.min(s + 2, 24))}
                      className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div
                  className="p-4 rounded-2xl bg-black/40 border border-slate-800/80 leading-relaxed text-amber-200/90 font-medium"
                  style={{ fontSize: `${prompterFontSize}px` }}
                >
                  "{currentSlide.speakerNotes.speechText}"
                </div>

                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-300">
                  <strong>💡 {isAr ? 'تنبيه: ' : 'Conseil : '}</strong>
                  {currentSlide.speakerNotes.deliveryTips}
                </div>
              </div>

              {/* Next Slide Preview */}
              {currentSlideIndex < presentation.slides.length - 1 && (
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isAr ? 'الشريحة القادمة:' : 'Diapositive Suivante :'}
                  </span>
                  <div className="text-xs font-bold text-white">
                    {presentation.slides[currentSlideIndex + 1].title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {presentation.slides[currentSlideIndex + 1].points[0]?.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FULLSCREEN SLIDESHOW WITH LASER POINTER */}
      {/* ============================================================== */}
      {viewMode === 'slideshow' && presentation && currentSlide && (
        <div
          ref={slideshowContainerRef}
          onMouseMove={handleMouseMoveLaser}
          className={`fixed inset-0 z-50 ${theme.bgClass} flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden`}
        >
          {/* Virtual Laser Pointer Dot */}
          {laserActive && (
            <div
              className="absolute pointer-events-none rounded-full bg-red-500 blur-[1px] shadow-[0_0_15px_#ff0000] z-50 transition-transform duration-75"
              style={{
                width: 14,
                height: 14,
                transform: `translate(${laserPos.x - 7}px, ${laserPos.y - 7}px)`,
              }}
            />
          )}

          {/* Top Minimal Bar */}
          <div className="flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText} border`}>
                {currentSlide.category}
              </span>
              <span className={`text-xs ${theme.textMuted}`}>{presentation.topic}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLaserActive((prev) => !prev)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  laserActive
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/30'
                    : 'bg-white/10 text-white/80 border-white/20'
                }`}
              >
                🔴 {isAr ? 'مؤشر الليزر (L)' : 'Pointeur Laser (L)'}
              </button>
              <span className="text-xs font-bold opacity-60">
                {currentSlideIndex + 1} / {presentation.slides.length}
              </span>
              <button
                onClick={() => setViewMode('deck')}
                className="px-3 py-1 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20"
              >
                ✕ {isAr ? 'إغلاق (Esc)' : 'Quitter (Esc)'}
              </button>
            </div>
          </div>

          {/* Slide Body in Fullscreen */}
          <div className="max-w-5xl mx-auto w-full my-auto space-y-8">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-white leading-tight">
                {currentSlide.title}
              </h1>
              {currentSlide.subtitle && (
                <p className={`text-lg sm:text-xl font-medium ${theme.accentText}`}>
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            {currentSlide.metrics && (
              <div className="grid grid-cols-3 gap-4">
                {currentSlide.metrics.map((m, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <div className={`text-3xl sm:text-4xl font-black ${theme.accentText}`}>{m.value}</div>
                    <div className="text-xs text-white/60 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentSlide.points.map((pt, i) => (
                <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-base font-bold text-white">• {pt.boldPrefix}</div>
                  <div className={`text-sm leading-relaxed ${theme.textMuted}`}>{pt.text}</div>
                </div>
              ))}
            </div>

            {currentSlide.callout && (
              <div className={`p-4 rounded-2xl border ${theme.calloutBg} text-sm font-semibold text-white/90`}>
                💡 {currentSlide.callout}
              </div>
            )}
          </div>

          {/* Bottom Progress Bar & Navigation */}
          <div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mb-3 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{
                  width: `${((currentSlideIndex + 1) / presentation.slides.length) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-white/60">
              <span>{isAr ? 'استخدم الأسهم ➔ / ⬅ للتنقل، أو المسافة' : 'Touches ← / → ou Espace pour naviguer'}</span>
              <span>{Math.round(((currentSlideIndex + 1) / presentation.slides.length) * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
