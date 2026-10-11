import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Film,
  Image as ImageIcon,
  Wand2,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Maximize2,
  Check,
  Zap,
  Sliders,
  Layers,
  Camera,
  Share2,
  Code2,
  Cpu,
  Palette,
  Sun,
  Moon,
  X,
  FileCode,
  ZoomIn,
  Video,
  Eye,
  Settings,
  Scissors,
  Flame,
  ArrowRight,
  MonitorPlay,
  Sparkle,
} from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';

export type StudioTab = 'image' | 'video' | 'vector' | 'gallery';
export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '21:9';

export type ImageStyle =
  | 'photorealistic'
  | 'cinematic'
  | 'anime'
  | 'cyberpunk'
  | 'unreal5'
  | 'oil_painting'
  | 'product_studio'
  | 'fantasy'
  | 'minimalist'
  | 'concept_art';

export type MediaEngineChoice =
  | 'auto'
  | 'gemini-image'
  | 'imagen-3'
  | 'flux-pro'
  | 'midjourney'
  | 'flux-turbo';

export type VideoMotion =
  | 'drone_fpv'
  | 'orbit_360'
  | 'dolly_zoom'
  | 'slow_motion'
  | 'pan_horizontal'
  | 'hyperlapse'
  | 'cinematic_steady';

export interface SemanticAnalysis {
  subject: string;
  environment: string;
  lighting: string;
  camera: string;
  motion?: string;
  mood: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'vector';
  engine?: string;
  title: string;
  originalPrompt: string;
  enhancedPrompt: string;
  negativePrompt?: string;
  semanticAnalysis?: SemanticAnalysis;
  explanationAr?: string;
  url: string;
  posterUrl?: string;
  svgCode?: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  style: string;
  motion?: VideoMotion;
  duration?: number;
  fps?: number;
  seed: number;
  createdAt: number;
}

interface MediaStudioProps {
  language: Language;
  onNavigate?: (view: ViewId) => void;
  onRunPromptInChat?: (prompt: string) => void;
}

const ENGINE_CHOICES: Array<{
  id: MediaEngineChoice;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  badge: string;
}> = [
  {
    id: 'auto',
    nameAr: 'الموجه الذكي التلقائي',
    nameEn: 'Smart Neural Router',
    descAr: 'يختار المحرك الأنسب تلقائياً بناءً على نمط الطلب ومستوى الواقعية',
    descEn: 'Intelligently routes to optimal engine based on prompt aesthetic',
    icon: '⚡',
    badge: 'OPTIMAL',
  },
  {
    id: 'gemini-image',
    nameAr: 'Google Gemini 3.1 Flash Lite',
    nameEn: 'Google Gemini 3.1 Flash Lite',
    descAr: 'محرك قوقل الرسمي فائق السرعة لتوليد وتعديل الصور بدقة أصلية',
    descEn: 'Official native Google vision pipeline with editing capability',
    icon: '✨',
    badge: 'OFFICIAL GOOGLE',
  },
  {
    id: 'imagen-3',
    nameAr: 'Google Imagen 3 (Studio 8K)',
    nameEn: 'Google Imagen 3 (Studio 8K)',
    descAr: 'أعلى دقة واقعية فوتوغرافية ومحاكاة الاستوديو من قوقل ديب مايند',
    descEn: 'DeepMind studio realism, authentic textures & lighting physics',
    icon: '💎',
    badge: 'STUDIO 8K',
  },
  {
    id: 'flux-pro',
    nameAr: 'FLUX.1 Pro Ultra-Precision',
    nameEn: 'FLUX.1 Pro Ultra-Precision',
    descAr: 'إضاءة حجمية ملحمية وتفاصيل مادية مجهرية عبر أحدث شبكات الانتشار',
    descEn: 'Breathtaking volumetric depth, skin textures & epic composition',
    icon: '🔥',
    badge: 'FLUX PRO',
  },
  {
    id: 'midjourney',
    nameAr: 'Midjourney v6 Cinema Style',
    nameEn: 'Midjourney v6 Cinema Style',
    descAr: 'إخراج سينمائي بلوني أفلام 70mm وعدسات أنامورفيك وعزل بصري ناعم',
    descEn: '70mm anamorphic bokeh, film stock color grading & artistic depth',
    icon: '🎬',
    badge: 'CINEMA',
  },
  {
    id: 'flux-turbo',
    nameAr: 'FLUX Turbo الخاطف',
    nameEn: 'FLUX Turbo Ultra-Fast',
    descAr: 'توليد فوري فائق السرعة خلال ثانية واحدة للعصف الذهني',
    descEn: 'Instant sub-second generation for real-time creative flow',
    icon: '⚡',
    badge: '< 1s SPEED',
  },
];

const STYLE_OPTIONS: Array<{ id: ImageStyle; nameAr: string; nameEn: string; icon: string }> = [
  { id: 'cinematic', nameAr: 'سينمائي IMAX 70mm', nameEn: 'Cinematic IMAX', icon: '🎬' },
  { id: 'photorealistic', nameAr: 'واقعية فوتوغرافية 8K', nameEn: 'Photorealistic 8K', icon: '📸' },
  { id: 'unreal5', nameAr: 'ثلاثي الأبعاد Unreal 5.4', nameEn: '3D Unreal Engine 5', icon: '💎' },
  { id: 'anime', nameAr: 'أنمي فاخر Ghibli/Shinkai', nameEn: 'Anime Visual Art', icon: '🎌' },
  { id: 'cyberpunk', nameAr: 'سايبربانك نيون مستقبلي', nameEn: 'Cyberpunk Neon', icon: '⚡' },
  { id: 'product_studio', nameAr: 'استوديو إعلاني تجاري', nameEn: 'Commercial Studio', icon: '🏛️' },
  { id: 'oil_painting', nameAr: 'لوحة زيتية كلاسيكية', nameEn: 'Oil Painting', icon: '🎨' },
  { id: 'fantasy', nameAr: 'عوالم وأساطير فانتزي', nameEn: 'Mythic Fantasy', icon: '🌌' },
  { id: 'concept_art', nameAr: 'رسم تخطيطي فني ArtStation', nameEn: 'Concept Art', icon: '🖌️' },
  { id: 'minimalist', nameAr: 'مينيمالي حديث نقي', nameEn: 'Minimalist Clean', icon: '📐' },
];

const ASPECT_OPTIONS: Array<{ id: AspectRatio; nameAr: string; nameEn: string; ratio: string }> = [
  { id: '16:9', nameAr: 'شاشة عريضة', nameEn: 'Landscape', ratio: '16:9' },
  { id: '1:1', nameAr: 'مربع', nameEn: 'Square', ratio: '1:1' },
  { id: '9:16', nameAr: 'طولي (ريلز / هاتف)', nameEn: 'Portrait / Reels', ratio: '9:16' },
  { id: '4:3', nameAr: 'شاشة كلاسيكية', nameEn: 'Standard', ratio: '4:3' },
  { id: '21:9', nameAr: 'ألترا وايد سينمائي', nameEn: 'Cinemascope', ratio: '21:9' },
];

const MOTION_OPTIONS: Array<{ id: VideoMotion; nameAr: string; nameEn: string }> = [
  { id: 'drone_fpv', nameAr: 'درون سينمائي سريع FPV', nameEn: 'FPV Drone Flythrough' },
  { id: 'orbit_360', nameAr: 'دوران 360° حول الهدف', nameEn: '360° Orbital Camera' },
  { id: 'dolly_zoom', nameAr: 'تقريب دولي زووم (Dolly Zoom)', nameEn: 'Vertigo Dolly Zoom' },
  { id: 'slow_motion', nameAr: 'تصوير بطيء فائق النعومة 120fps', nameEn: 'Ultra Slow Motion' },
  { id: 'cinematic_steady', nameAr: 'كاميرا سينمائية مثبتة SteadyCam', nameEn: 'SteadyCam Motion' },
  { id: 'pan_horizontal', nameAr: 'تتبع أفقي بانورامي هادئ', nameEn: 'Panoramic Tracking Pan' },
  { id: 'hyperlapse', nameAr: 'هايبر لابس متسارع ديناميكي', nameEn: 'Dynamic Hyperlapse' },
];

const PROMPT_INSPIRATIONS_IMAGE = [
  { ar: 'صقر عربي ذهبي ملكي يحلق فوق رمال صحراء العلا عند الغروب مع إضاءة دافئة', en: 'Royal golden Arabian falcon soaring over Al-Ula sandstone dunes at sunset' },
  { ar: 'سيارة خارقة ديناميكية تسير في شوارع طوكيو ليلاً تحت المطر مع انعكاسات النيون', en: 'Futuristic hypercar racing through Tokyo neon streets in rain reflections' },
  { ar: 'بورتريه فوتوغرافي فائق الدقة 8K لمحارب قديم بعيون ثاقبة وإضاءة درامية جانبية', en: 'Cinematic 8K portrait of ancient warrior with piercing eyes and dramatic rim lighting' },
  { ar: 'واحة مائية خيالية في كوكب كريستالي مع شلالات متوهجة باللون البنفسجي والزمردي', en: 'Ethereal alien oasis on a crystal planet with bioluminescent waterfalls' },
];

const PROMPT_INSPIRATIONS_VIDEO = [
  { ar: 'لقطة درون سينمائية FPV تندفع بسرعة وسلاسة عبر ناطحات سحاب مدينة نيوم الذكية ليلاً', en: 'Cinematic FPV drone sweeping through futuristic NEOM skyscraper canyons at night' },
  { ar: 'دوران سينمائي 360 درجة حول يخت فاخر يبحر في مياه البحر الأحمر الفيروزية النقية', en: '360 degree orbital camera around luxury yacht cutting through turquoise Red Sea waters' },
  { ar: 'تصوير بطيء فائق لقطرات مطر تسقط على بتلات زهرة لوتس متوهجة في ضوء الفجر', en: 'Ultra slow-motion water droplets splashing on glowing lotus petal at dawn' },
  { ar: 'تقريب دولي سينمائي درامي على رائد فضاء يستكشف آثاراً حجرية عملاقة على كوكب المريخ', en: 'Cinematic vertigo dolly zoom on astronaut discovering colossal ancient ruins on Mars' },
];

const PROMPT_INSPIRATIONS_VECTOR = [
  { ar: 'شعار تقني تجريدي لشركة ذكاء اصطناعي بتدرج نيون سيان وبنفسجي وخطوط هندسية حادة', en: 'Minimalist geometric cybernetic AI logo with neon cyan and purple gradient' },
  { ar: 'تميمة صقر عربي ملكي بأسلوب فيكتور عصري وخطوط هندسية متناسقة قابلة للتحجيم', en: 'Modern vector mascot emblem of a royal golden falcon with sleek geometric curves' },
  { ar: 'أيقونة مكوك فضاء مستقبلي ينطلق نحو مجرة دائرية بألوان متوهجة وخلفية نقية', en: 'Futuristic space shuttle launching towards a spiral galaxy flat vector badge' },
  { ar: 'رسم بياني شبكي للبنية السحابية الرقمية مع عقد متصلة ومسارات بيانات متوهجة', en: 'Cloud computing network architecture infographic with glowing nodes and data flows' },
];

const QUICK_OPTICAL_MODIFIERS = [
  { labelAr: 'إضاءة سينمائية', labelEn: 'Cinematic Light', text: 'volumetric dramatic rim lighting, soft shadow depth' },
  { labelAr: 'الساعة الذهبية', labelEn: 'Golden Hour', text: 'warm golden hour sunset glow, amber rays, atmospheric haze' },
  { labelAr: 'عدسة 85mm بورتري', labelEn: '85mm Prime', text: 'shot on 85mm f/1.8 lens, creamy optical bokeh depth of field' },
  { labelAr: 'نيون سايبربانك', labelEn: 'Cyber Neon', text: 'vibrant dual-tone cyan and magenta neon glow, wet reflections' },
  { labelAr: 'استوديو سوفت بوكس', labelEn: 'Studio Softbox', text: 'commercial product photography, large softbox key lighting, crisp reflections' },
  { labelAr: 'ريندر Unreal 5.4', labelEn: 'Unreal Engine 5', text: '3D CGI render, Unreal Engine 5.4, ray-traced global illumination, 8k textures' },
];

export function MediaStudio({ language, onNavigate, onRunPromptInChat }: MediaStudioProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<StudioTab>('image');
  const [selectedEngine, setSelectedEngine] = useState<MediaEngineChoice>('auto');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('cinematic');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('16:9');
  const [selectedMotion, setSelectedMotion] = useState<VideoMotion>('drone_fpv');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Vector Display States
  const [vectorViewMode, setVectorViewMode] = useState<'preview' | 'code'>('preview');
  const [svgBackdrop, setSvgBackdrop] = useState<'dark' | 'light' | 'grid'>('dark');

  // Image-to-Image / Camera Reference State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isImg2Img, setIsImg2Img] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Prompt Expander State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<{
    enhancedPromptEn: string;
    explanationAr: string;
    negativePrompt: string;
    semanticAnalysis?: SemanticAnalysis;
  } | null>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Gallery State
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video' | 'vector'>('all');

  // Video Simulation Loop
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<any>(null);

  // Real-Time VFX Shaders & Color Grading
  const [colorGrade, setColorGrade] = useState<'normal' | 'cinematic_noir' | 'cyberpunk' | 'golden_hour' | 'hdr' | 'emerald_matrix'>('normal');
  const [superResolution, setSuperResolution] = useState<boolean>(true);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);

  const getFilterStyle = () => {
    let filterString = '';
    switch (colorGrade) {
      case 'cinematic_noir':
        filterString = 'contrast(1.2) brightness(0.95) saturate(1.1) sepia(0.12)';
        break;
      case 'cyberpunk':
        filterString = 'hue-rotate(185deg) saturate(1.4) contrast(1.2)';
        break;
      case 'golden_hour':
        filterString = 'sepia(0.25) saturate(1.3) contrast(1.05) brightness(1.02)';
        break;
      case 'hdr':
        filterString = 'contrast(1.3) saturate(1.35) brightness(1.05)';
        break;
      case 'emerald_matrix':
        filterString = 'hue-rotate(80deg) saturate(1.3) contrast(1.2)';
        break;
      default:
        filterString = 'none';
        break;
    }
    return {
      filter: filterString,
      imageRendering: superResolution ? ('crisp-edges' as const) : ('auto' as const),
    };
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/media/gallery');
      const data = await res.json();
      if (data.ok && Array.isArray(data.gallery)) {
        setGallery(data.gallery);
        if (!currentResult && data.gallery.length > 0) {
          setCurrentResult(data.gallery[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load media gallery:', e);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Video Player Simulation Loop
  useEffect(() => {
    if (currentResult?.type === 'video' && isVideoPlaying) {
      const step = 2 * videoSpeed;
      videoIntervalRef.current = setInterval(() => {
        setVideoProgress((p) => (p >= 100 ? 0 : p + step));
      }, 100);
    } else {
      clearInterval(videoIntervalRef.current);
    }
    return () => clearInterval(videoIntervalRef.current);
  }, [currentResult, isVideoPlaying, videoSpeed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setIsImg2Img(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/media/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: activeTab === 'video' ? 'video' : 'image',
          style: selectedStyle,
          motion: selectedMotion,
          aspectRatio: selectedAspect,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnhancedResult({
          enhancedPromptEn: data.enhancedPromptEn,
          explanationAr: data.explanationAr,
          negativePrompt: data.negativePrompt,
          semanticAnalysis: data.semanticAnalysis,
        });
      }
    } catch (e) {
      console.warn('Prompt enhance failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAppendModifier = (text: string) => {
    setPrompt((prev) => (prev.trim() ? `${prev.trim()}, ${text}` : text));
  };

  const handleGenerateVariations = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setCustomSeed(nextSeed.toString());
    setTimeout(() => {
      handleGenerate();
    }, 50);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(isAr ? 'تحليل النوايا الدلالية ومواءمة محركات الإخراج…' : 'Synthesizing prompt & routing pipeline…');

    try {
      const seedNum = customSeed.trim() ? Number(customSeed) : Math.floor(Math.random() * 999999);
      let endpoint = '/api/media/generate-image';
      let payload: any = {
        prompt,
        style: selectedStyle,
        aspectRatio: selectedAspect,
        seed: seedNum,
        engine: selectedEngine,
      };

      if (activeTab === 'vector') {
        endpoint = '/api/media/generate-vector';
        payload = {
          prompt,
          style: selectedStyle,
        };
      } else if (activeTab === 'video') {
        endpoint = '/api/media/generate-video';
        payload = {
          prompt,
          style: selectedStyle,
          motion: selectedMotion,
          aspectRatio: selectedAspect,
          seed: seedNum,
        };
      } else if (isImg2Img && sourceImage) {
        endpoint = '/api/media/image-to-image';
        payload = {
          prompt,
          sourceImage,
          style: selectedStyle,
          aspectRatio: selectedAspect,
          seed: seedNum,
        };
      }

      setTimeout(() => {
        setGenerationStep(
          activeTab === 'vector'
            ? (isAr ? 'بناء المسارات الهندسية والتدرجات عبر Neural SVG…' : 'Synthesizing vector paths & gradients via Neural SVG…')
            : activeTab === 'video'
            ? (isAr ? 'محاكاة اللقطات الحركية وضبط الإضاءة والديناميكية عبر Veo 3…' : 'Rendering cinematic camera motion via Google Veo 3…')
            : isImg2Img
            ? (isAr ? 'معالجة الصورة المرجعية وتطبيق التعديل العصبي…' : 'Processing reference image & neural restyling…')
            : (isAr ? `توليد الصورة بدقة فائقة عبر محرك ${selectedEngine}…` : `Synthesizing high-res textures via ${selectedEngine}…`)
        );
      }, 1000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok && data.item) {
        setCurrentResult(data.item);
        fetchGallery();
      }
    } catch (e) {
      console.warn('Generation failed:', e);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = enhancedResult?.enhancedPromptEn || currentResult?.enhancedPrompt || prompt;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySvgCode = () => {
    if (!currentResult?.svgCode) return;
    navigator.clipboard.writeText(currentResult.svgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setGallery((g) => g.filter((item) => item.id !== id));
        if (currentResult?.id === id) {
          setCurrentResult(gallery.find((item) => item.id !== id) || null);
        }
      }
    } catch (e) {
      console.warn('Delete failed:', e);
    }
  };

  const filteredGallery = useMemo(() => {
    if (galleryFilter === 'all') return gallery;
    return gallery.filter((item) => item.type === galleryFilter);
  }, [gallery, galleryFilter]);

  return (
    <section className="feature-page max-w-7xl mx-auto px-3 sm:px-6 py-6 select-none animate-fadeIn">
      {/* Studio Header (Strict Zero-Pill & Clean Typography) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono tracking-wider mb-1">
            <span>ADEM MEDIA SUITE 2026</span>
            <span aria-hidden="true">·</span>
            <span>GOOGLE IMAGEN 3</span>
            <span aria-hidden="true">·</span>
            <span>GOOGLE VEO 3</span>
            <span aria-hidden="true">·</span>
            <span>FLUX.1 PRO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            {isAr ? 'استوديو الصور والفيديوهات الخارق' : 'Master Multi-Engine Media Studio'}
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'منظومة بصرية متكاملة لتوليد الصور الفوتوغرافية بدقة 8K، الفيديوهات السينمائية بمحرك Google Veo 3، والرسوم المتجهية البرمجية SVG.'
              : 'End-to-end multimodal production suite for 8K photorealism, Google Veo 3 cinematic video dynamics, and scalable Vector SVGs.'}
          </p>
        </div>

        {/* Clean Interactive Tab Switcher (Segmented Control) */}
        <div className="flex items-center p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] self-start md:self-auto text-xs shrink-0 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'image'
                ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <ImageIcon size={14} />
            <span>{isAr ? 'توليد الصور' : 'Images'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'video'
                ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Video size={14} />
            <span>{isAr ? 'فيديو Veo 3 السينمائي' : 'Veo 3 Cinema'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vector')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'vector'
                ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Code2 size={14} />
            <span>{isAr ? 'فيكتور SVG' : 'Vector SVG'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              fetchGallery();
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'gallery'
                ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Layers size={14} />
            <span>{isAr ? 'المعرض' : 'Gallery'}</span>
            <span className="text-[10px] opacity-80 font-mono ms-0.5">({gallery.length})</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      {activeTab !== 'gallery' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-start">
          {/* Left Panel: Creation Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Engine Selection Bar (Image Tab) */}
            {activeTab === 'image' && (
              <div className="p-4 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                  <span className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-cyan-400" />
                    <span>{isAr ? 'محرك التوليد العصبي:' : 'Neural Engine:'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {ENGINE_CHOICES.find((e) => e.id === selectedEngine)?.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ENGINE_CHOICES.map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setSelectedEngine(eng.id)}
                      className={`p-2.5 rounded-2xl border text-start transition cursor-pointer flex flex-col justify-between min-h-[64px] ${
                        selectedEngine === eng.id
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base">{eng.icon}</span>
                        <span className="text-[9px] font-mono opacity-70 uppercase">{eng.badge}</span>
                      </div>
                      <span className="text-xs font-bold truncate mt-1">
                        {isAr ? eng.nameAr : eng.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Composer Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>
                    {activeTab === 'vector'
                      ? (isAr ? 'وصف الرسم المتجهي والشعار:' : 'Vector / Logo Prompt:')
                      : activeTab === 'video'
                      ? (isAr ? 'وصف المشهد السينمائي والحركة:' : 'Cinematic Scene & Camera Prompt:')
                      : (isAr ? 'وصف العمل البصري المراد توليده:' : 'Visual Masterpiece Prompt:')}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Wand2 size={12} className={isEnhancing ? 'animate-spin' : ''} />
                  <span>{isEnhancing ? (isAr ? 'جاري التحسين…' : 'Enhancing…') : (isAr ? 'تعزيز سينمائي تلقائي ✨' : 'Enhance Prompt ✨')}</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'vector'
                    ? (isAr ? 'مثال: شعار تقني مينيمالي لشركة ذكاء اصطناعي بخطوط هندسية متناسقة وتدرج ألوان متوهج…' : 'e.g. Minimalist cybernetic AI tech emblem with sleek gradients and clean geometric lines…')
                    : activeTab === 'video'
                    ? (isAr ? 'مثال: لقطة درون سينمائية FPV تندفع بسرعة بين أبراج مدينة ذكية مستقبلية في الليل مع أضواء النيون…' : 'e.g. Cinematic FPV drone swooping through futuristic skyscraper canyons at night with wet neon reflections…')
                    : (isAr ? 'مثال: صقر عربي ذهبي ملكي يحلق فوق رمال صحراء العلا عند الغروب مع إضاءة شمسية دافئة وعزل 85mm…' : 'e.g. Royal golden Arabian falcon soaring over sandstone dunes at sunset, 85mm lens, volumetric light…')
                }
                rows={3}
                className="w-full p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition resize-none leading-relaxed"
              />

              {/* Quick Modifiers */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-[var(--muted)] font-medium shrink-0">
                  {isAr ? 'إضافات بصرية سريعة:' : 'Modifiers:'}
                </span>
                {QUICK_OPTICAL_MODIFIERS.map((mod, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendModifier(mod.text)}
                    className="px-2 py-0.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text)] transition cursor-pointer font-medium"
                  >
                    + {isAr ? mod.labelAr : mod.labelEn}
                  </button>
                ))}
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                <span className="text-[11px] text-[var(--muted)] font-medium block">
                  {isAr ? 'أفكار مقترحة جاهزة للتجربة:' : 'Inspirations:'}
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {(activeTab === 'vector'
                    ? PROMPT_INSPIRATIONS_VECTOR
                    : activeTab === 'video'
                    ? PROMPT_INSPIRATIONS_VIDEO
                    : PROMPT_INSPIRATIONS_IMAGE
                  ).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(isAr ? s.ar : s.en)}
                      className="px-2.5 py-1 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text)] transition text-start cursor-pointer truncate max-w-xs shrink-0"
                    >
                      {isAr ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image-to-Image / Camera Reference Section */}
              {activeTab === 'image' && (
                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                      <Camera size={13} className="text-emerald-400" />
                      <span>{isAr ? 'تعديل صورة مرجعية (Image-to-Image):' : 'Image-to-Image Reference & Restyling:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsImg2Img(!isImg2Img);
                        if (isImg2Img) setSourceImage(null);
                      }}
                      className={`text-[11px] px-2.5 py-0.5 rounded-xl font-medium transition cursor-pointer ${
                        isImg2Img
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                      }`}
                    >
                      {isImg2Img ? (isAr ? 'مفعل ✓' : 'Active ✓') : (isAr ? 'تفعيل رفع صورة' : 'Enable Img2Img')}
                    </button>
                  </div>

                  {isImg2Img && (
                    <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {sourceImage ? (
                        <div className="flex items-center gap-3 w-full">
                          <img
                            src={sourceImage}
                            alt="Source"
                            className="w-12 h-12 object-cover rounded-xl border border-emerald-500/30"
                          />
                          <div className="flex-1 text-xs">
                            <span className="text-emerald-400 font-semibold block">
                              {isAr ? 'تم تحميل الصورة المرجعية بنجاح' : 'Reference image loaded'}
                            </span>
                            <span className="text-[var(--muted)] text-[11px]">
                              {isAr ? 'اكتب التعديل المطلوب وسيقوم المحرك بإعادة إنتاجها' : 'Type prompt above to apply neural restyling'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSourceImage(null)}
                            className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-[var(--muted)]">
                            {isAr ? 'اختر صورة من جهازك للتحويل أو التعديل:' : 'Select an image to restyle or transform:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Camera size={13} />
                            <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Enhanced Output Box */}
              {enhancedResult && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Zap size={13} className="text-amber-400" />
                      <span>{isAr ? 'البرومبت المعزز سينمائياً:' : 'Cinematic Master Prompt:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(enhancedResult.enhancedPromptEn);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-black/40 p-2.5 rounded-xl border border-indigo-900/40">
                    {enhancedResult.enhancedPromptEn}
                  </p>
                </div>
              )}
            </div>

            {/* Artistic Style Matrix (Image & Vector) */}
            {activeTab !== 'video' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                  <span className="flex items-center gap-1.5">
                    <Palette size={14} className="text-purple-400" />
                    <span>{isAr ? 'الأسلوب الفني والجمالي:' : 'Artistic Style:'}</span>
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.[isAr ? 'nameAr' : 'nameEn']}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                        selectedStyle === style.id
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="text-base">{style.icon}</span>
                      <span className="text-[11px] font-bold leading-tight">
                        {isAr ? style.nameAr : style.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Motion Direction Matrix (Video Tab) */}
            {activeTab === 'video' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                  <span className="flex items-center gap-1.5">
                    <MonitorPlay size={14} className="text-rose-400" />
                    <span>{isAr ? 'حركة الكاميرا والإخراج السينمائي (Google Veo 3):' : 'Camera Motion Dynamics (Google Veo 3):'}</span>
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {MOTION_OPTIONS.find((m) => m.id === selectedMotion)?.[isAr ? 'nameAr' : 'nameEn']}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MOTION_OPTIONS.map((mot) => (
                    <button
                      key={mot.id}
                      type="button"
                      onClick={() => setSelectedMotion(mot.id)}
                      className={`p-2.5 rounded-2xl border text-start transition cursor-pointer flex items-center justify-between ${
                        selectedMotion === mot.id
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="text-xs font-bold">{isAr ? mot.nameAr : mot.nameEn}</span>
                      <span className="text-[10px] font-mono opacity-70">60 FPS</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio & Form Factor */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span className="flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-400" />
                  <span>{isAr ? 'أبعاد ونسب الصورة / الفيديو:' : 'Aspect Ratio & Framing:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  {showAdvanced ? (isAr ? 'إخفاء الإعدادات المتقدمة' : 'Hide Advanced') : (isAr ? 'إعدادات متقدمة' : 'Advanced')}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ASPECT_OPTIONS.map((asp) => (
                  <button
                    key={asp.id}
                    type="button"
                    onClick={() => setSelectedAspect(asp.id)}
                    className={`p-2 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedAspect === asp.id
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{asp.ratio}</span>
                    <span className="text-[10px] leading-tight opacity-80">{isAr ? asp.nameAr : asp.nameEn}</span>
                  </button>
                ))}
              </div>

              {showAdvanced && (
                <div className="pt-3 border-t border-[var(--border)] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--muted)] block mb-1">Seed (بذرة التوليد):</label>
                      <input
                        type="text"
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        placeholder={isAr ? 'عشوائي تلقائي' : 'Random seed'}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--muted)] block mb-1">
                        {isAr ? 'المحرك الفعال:' : 'Active Pipeline:'}
                      </label>
                      <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-emerald-400 font-mono">
                        {selectedEngine.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{generationStep || (isAr ? 'جاري التوليد بدقة فائقة…' : 'Synthesizing media…')}</span>
                </>
              ) : (
                <>
                  {activeTab === 'vector' ? (
                    <Code2 size={16} />
                  ) : activeTab === 'video' ? (
                    <Video size={16} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  <span>
                    {activeTab === 'vector'
                      ? (isAr ? 'توليد رسم وكود SVG الآن' : 'Synthesize Vector SVG Now')
                      : activeTab === 'video'
                      ? (isAr ? 'إخراج فيديو Veo 3 السينمائي الآن' : 'Render Veo 3 Cinema Video Now')
                      : (isAr ? `توليد العمل البصري بدقة فائقة الآن` : 'Generate Masterpiece Now')}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Viewport Stage (5 cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="p-4 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] shadow-xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    {currentResult?.type === 'vector'
                      ? (isAr ? 'منصة الفيكتور والكود (SVG Canvas)' : 'SVG Vector Canvas')
                      : currentResult?.type === 'video'
                      ? (isAr ? 'مسرح عرض الفيديو (Veo 3 Cinema)' : 'Veo 3 Cinema Stage')
                      : (isAr ? 'منصة المعاينة فائقة الدقة (8K Viewer)' : '8K Master Stage')}
                  </h3>
                </div>

                {currentResult && (
                  <div className="flex items-center gap-1.5">
                    {currentResult.engine && (
                      <span className="text-[10px] font-mono text-cyan-400">
                        {currentResult.engine}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="p-1 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] transition"
                      title={isAr ? 'تكبير كامل' : 'Fullscreen'}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport Box */}
              <div
                className={`relative rounded-2xl overflow-hidden border border-[var(--border)] aspect-video flex items-center justify-center shadow-inner ${
                  currentResult?.type === 'vector'
                    ? svgBackdrop === 'light'
                      ? 'bg-white'
                      : svgBackdrop === 'grid'
                      ? 'bg-slate-950 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px]'
                      : 'bg-slate-950'
                    : 'bg-slate-950'
                }`}
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
                      <Sparkles size={18} className="absolute inset-0 m-auto text-[var(--accent)] animate-pulse" />
                    </div>
                    <div className="text-xs font-semibold text-[var(--text)] animate-pulse">
                      {generationStep || (isAr ? 'جاري بناء التكوين البصري…' : 'Building visual composition…')}
                    </div>
                  </div>
                ) : currentResult ? (
                  <>
                    {/* Vector Display */}
                    {currentResult.type === 'vector' ? (
                      vectorViewMode === 'preview' ? (
                        currentResult.svgCode ? (
                          <div
                            className="w-full h-full p-4 flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: currentResult.svgCode }}
                          />
                        ) : (
                          <img
                            src={currentResult.url}
                            alt={currentResult.title}
                            className="w-full h-full object-contain p-4"
                          />
                        )
                      ) : (
                        <div className="w-full h-full p-3 overflow-auto bg-slate-950 text-left font-mono text-[10px] text-cyan-300">
                          <pre className="whitespace-pre-wrap">{currentResult.svgCode || '<svg>...</svg>'}</pre>
                        </div>
                      )
                    ) : (
                      <img
                        src={currentResult.url}
                        alt={currentResult.title}
                        referrerPolicy="no-referrer"
                        style={getFilterStyle()}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          currentResult.type === 'video' && isVideoPlaying ? 'scale-105 brightness-105' : 'scale-100'
                        }`}
                      />
                    )}

                    {/* Video Simulation Overlay */}
                    {currentResult.type === 'video' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded-md">
                            Google Veo 3 · 60 FPS
                          </span>
                          <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded-md">
                            Motion: {currentResult.motion || 'FPV Drone'}
                          </span>
                        </div>

                        {/* Player Controls & Progress Bar */}
                        <div className="space-y-2">
                          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full transition-all duration-100 ease-linear"
                              style={{ width: `${videoProgress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-white text-xs">
                            <button
                              type="button"
                              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition cursor-pointer"
                            >
                              {isVideoPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
                            </button>
                            <span className="text-[10px] font-mono text-slate-300">
                              00:0{Math.floor((videoProgress / 100) * 5)} / 00:05
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-[var(--muted)] text-xs">
                    {isAr ? 'المسرح جاهز. اكتب وصفاً واضغط على زر التوليد.' : 'Studio is ready. Enter prompt and generate.'}
                  </div>
                )}
              </div>

              {/* Vector Mode Quick Toolbar */}
              {currentResult?.type === 'vector' && (
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setVectorViewMode('preview')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        vectorViewMode === 'preview' ? 'bg-cyan-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      {isAr ? 'معاينة بصرية' : 'Visual View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVectorViewMode('code')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                        vectorViewMode === 'code' ? 'bg-cyan-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      <FileCode size={12} />
                      <span>{isAr ? 'كود SVG' : 'SVG Code'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSvgBackdrop('dark')}
                      className={`p-1 rounded-md ${svgBackdrop === 'dark' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--muted)]'}`}
                      title={isAr ? 'خلفية داكنة' : 'Dark'}
                    >
                      <Moon size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgBackdrop('light')}
                      className={`p-1 rounded-md ${svgBackdrop === 'light' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--muted)]'}`}
                      title={isAr ? 'خلفية فاتحة' : 'Light'}
                    >
                      <Sun size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgBackdrop('grid')}
                      className={`p-1 rounded-md text-[10px] font-mono ${svgBackdrop === 'grid' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--muted)]'}`}
                      title={isAr ? 'شبكة شفافة' : 'Grid'}
                    >
                      #
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Color Grade & VFX Deck */}
              {currentResult && currentResult.type !== 'vector' && (
                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text)]">
                    <span className="flex items-center gap-1.5">
                      <Palette size={12} className="text-cyan-400" />
                      <span>{isAr ? 'معالجة الألوان وتأثيرات الإخراج:' : 'Color Grade & VFX Shaders:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuperResolution((s) => !s)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                        superResolution
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]'
                      }`}
                    >
                      {superResolution ? '8K SHARP' : 'RAW'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'normal', ar: 'الأصلي RAW', en: 'Raw' },
                      { id: 'cinematic_noir', ar: 'سينمائي 70mm', en: 'Cinema 70mm' },
                      { id: 'cyberpunk', ar: 'نيون سايبر', en: 'Cyber Neon' },
                      { id: 'golden_hour', ar: 'غروب ذهبي', en: 'Golden Hour' },
                      { id: 'hdr', ar: 'استوديو HDR', en: 'Studio HDR' },
                      { id: 'emerald_matrix', ar: 'ماتريكس زمردي', en: 'Emerald Matrix' },
                    ].map((lut) => (
                      <button
                        key={lut.id}
                        type="button"
                        onClick={() => setColorGrade(lut.id as any)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-semibold transition cursor-pointer border ${
                          colorGrade === lut.id
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                        }`}
                      >
                        {isAr ? lut.ar : lut.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar Below Preview */}
              {currentResult && (
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)] truncate">{currentResult.title}</h4>
                    <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5 font-mono">
                      {currentResult.enhancedPrompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] flex-wrap">
                    {/* Quick Variation */}
                    <button
                      type="button"
                      onClick={handleGenerateVariations}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
                      <span>{isAr ? 'تنويع جديد' : 'New Variation'}</span>
                    </button>

                    {/* Download */}
                    {currentResult.type === 'vector' && currentResult.svgCode ? (
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([currentResult.svgCode || ''], { type: 'image/svg+xml' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `adam_vector_${currentResult.id}.svg`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download size={13} />
                        <span>{isAr ? 'تحميل .SVG' : 'Download .SVG'}</span>
                      </button>
                    ) : (
                      <a
                        href={currentResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`adam_${currentResult.type}_${currentResult.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download size={13} />
                        <span>{isAr ? 'تنزيل فائق الدقة' : 'Download HD'}</span>
                      </a>
                    )}

                    {/* Copy Vector Code or Prompt */}
                    {currentResult.type === 'vector' && currentResult.svgCode ? (
                      <button
                        type="button"
                        onClick={handleCopySvgCode}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedSvg ? <Check size={13} className="text-emerald-400" /> : <Code2 size={13} />}
                        <span>{copiedSvg ? (isAr ? 'تم النسخ' : 'Copied SVG') : (isAr ? 'نسخ كود SVG' : 'Copy SVG')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ البرومبت' : 'Copy Prompt')}</span>
                      </button>
                    )}

                    {/* Send to Chat for continuous exploration */}
                    <button
                      type="button"
                      onClick={() => {
                        const message = `أريدك أن تفحص وتطور هذا العمل البصري الذي تم توليده في استوديو الوسائط:\n- العنوان: "${currentResult.title}"\n- الوصف: "${currentResult.originalPrompt}"\n- المحرك: ${currentResult.engine || 'ADEM Visual Engine'}`;
                        if (onRunPromptInChat) {
                          onRunPromptInChat(message);
                        } else if (onNavigate) {
                          onNavigate('chat');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Share2 size={13} />
                      <span>{isAr ? 'ناقش في المحادثة' : 'Discuss in Chat'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vault / Gallery View */
        <div className="my-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'all' ? 'bg-[var(--accent)] text-slate-950' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({gallery.length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'image' ? 'bg-[var(--accent)] text-slate-950' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? 'الصور' : 'Images'} ({gallery.filter((g) => g.type === 'image').length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'video' ? 'bg-[var(--accent)] text-slate-950' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? 'الفيديوهات' : 'Videos'} ({gallery.filter((g) => g.type === 'video').length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('vector')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'vector' ? 'bg-[var(--accent)] text-slate-950' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? 'الفيكتور وSVG' : 'Vector SVG'} ({gallery.filter((g) => g.type === 'vector').length})
              </button>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGallery.map((item) => {
              const isVector = item.type === 'vector';
              const isVideo = item.type === 'video';

              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] group hover:border-[var(--border-strong)] transition-all flex flex-col"
                >
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {isVector && item.svgCode ? (
                      <div
                        className="w-full h-full p-4 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: item.svgCode }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    <div className="absolute top-2 start-2 flex items-center gap-1">
                      <span className="text-[10px] font-mono text-white bg-black/70 px-2 py-0.5 rounded-md uppercase">
                        {isVector ? 'SVG' : isVideo ? 'VEO 3' : 'IMG'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-2 end-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text)] line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-1 leading-relaxed">
                        {item.originalPrompt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt(item.originalPrompt);
                          setActiveTab(item.type);
                          setCurrentResult(item);
                        }}
                        className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                      >
                        {isAr ? 'فتح بالأستوديو' : 'Open in Studio'}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGallery.length === 0 && !galleryLoading && (
            <div className="text-center py-16 text-[var(--muted)] text-xs">
              {isAr ? 'المعرض فارغ حالياً. قم بتوليد صورة أو فيكتور أو فيديو لحفظها هنا.' : 'Gallery is empty. Generate media to view it here.'}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && currentResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 end-0 text-white hover:text-cyan-400 p-2 cursor-pointer"
            >
              <X size={24} />
            </button>
            <div className="w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-slate-800">
              {currentResult.type === 'vector' && currentResult.svgCode ? (
                <div
                  className="w-full h-full p-8 flex items-center justify-center max-w-2xl max-h-[70vh]"
                  dangerouslySetInnerHTML={{ __html: currentResult.svgCode }}
                />
              ) : (
                <img
                  src={currentResult.url}
                  alt={currentResult.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                />
              )}
            </div>
            <div className="mt-3 text-center text-xs text-slate-300 max-w-xl">
              <span className="font-bold text-white block mb-1">{currentResult.title}</span>
              <span className="text-[11px] text-slate-400 font-mono">{currentResult.enhancedPrompt}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
