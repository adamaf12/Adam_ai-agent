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
  Compass,
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
  | 'minimalist';

export type MediaEngineChoice =
  | 'auto'
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
    nameAr: 'الذكي التلقائي',
    nameEn: 'Auto Smart Router',
    descAr: 'يختار المحرك الأنسب تلقائياً بناءً على نوع الطلب والأسلوب',
    descEn: 'Automatically selects the optimal engine for prompt & style',
    icon: '🚀',
    badge: 'RECOMMENDED',
  },
  {
    id: 'imagen-3',
    nameAr: 'Google Imagen 3',
    nameEn: 'Google Imagen 3',
    descAr: 'دقة استوديو خارقة، تفاصيل دقيقة، ونصوص مطبوعة نقية',
    descEn: 'Studio realism, typography perfection, state-of-the-art detail',
    icon: '💎',
    badge: 'STUDIO 8K',
  },
  {
    id: 'flux-pro',
    nameAr: 'FLUX.1 Pro Ultra',
    nameEn: 'FLUX.1 Pro Ultra',
    descAr: 'تكوين ملحمي وإضاءة حجمية مع أحدث أوزان النماذج المفتوحة',
    descEn: 'Breathtaking composition, dynamic lighting & textural fidelity',
    icon: '⚡',
    badge: 'HIGH FIDELITY',
  },
  {
    id: 'midjourney',
    nameAr: 'Midjourney v6 Cinema',
    nameEn: 'Midjourney v6 Cinema',
    descAr: 'إخراج سينمائي بهوية ألوان أفلام 70mm وعدسات أنامورفيك',
    descEn: 'Cinematic film grading, 70mm anamorphic bokeh & artistic tone',
    icon: '🎬',
    badge: 'CINEMATIC',
  },
  {
    id: 'flux-turbo',
    nameAr: 'FLUX Turbo الخاطف',
    nameEn: 'FLUX Turbo Ultra-Fast',
    descAr: 'توليد فوري فائق السرعة في ثانية واحدة للعصف الذهني',
    descEn: 'Sub-second real-time preview generation for instant iteration',
    icon: '🏎️',
    badge: '< 1s SPEED',
  },
];

const STYLE_OPTIONS: Array<{ id: ImageStyle; nameAr: string; nameEn: string; icon: string }> = [
  { id: 'cinematic', nameAr: 'سينمائي ملحمي', nameEn: 'Cinematic IMAX', icon: '🎬' },
  { id: 'photorealistic', nameAr: 'واقعية فوتوغرافية 8K', nameEn: 'Photorealistic 8K', icon: '📸' },
  { id: 'anime', nameAr: 'أنمي ياباني فاخر', nameEn: 'Anime Ghibli', icon: '🎌' },
  { id: 'cyberpunk', nameAr: 'سايبربانك ومستقبلي', nameEn: 'Cyberpunk Neon', icon: '⚡' },
  { id: 'unreal5', nameAr: 'ثلاثي الأبعاد Unreal 5', nameEn: '3D CGI Unreal 5', icon: '💎' },
  { id: 'product_studio', nameAr: 'استوديو إعلاني تجاري', nameEn: 'Studio Product', icon: '🏛️' },
  { id: 'oil_painting', nameAr: 'لوحة زيتية كلاسيكية', nameEn: 'Oil Painting', icon: '🎨' },
  { id: 'fantasy', nameAr: 'عوالم وأساطير فانتزي', nameEn: 'Mythic Fantasy', icon: '🌌' },
  { id: 'minimalist', nameAr: 'تصميم مينيمالي حديث', nameEn: 'Minimalist Modern', icon: '📐' },
];

const ASPECT_OPTIONS: Array<{ id: AspectRatio; nameAr: string; nameEn: string; icon: string }> = [
  { id: '16:9', nameAr: 'عريض سينمائي (16:9)', nameEn: 'Landscape (16:9)', icon: '🖥️' },
  { id: '1:1', nameAr: 'مربع متناسق (1:1)', nameEn: 'Square (1:1)', icon: '⏹️' },
  { id: '9:16', nameAr: 'طولي للهاتف (9:16)', nameEn: 'Portrait / Reels (9:16)', icon: '📱' },
  { id: '4:3', nameAr: 'شاشة كلاسيكية (4:3)', nameEn: 'Classic (4:3)', icon: '📺' },
  { id: '21:9', nameAr: 'ألترا وايد سينمائي (21:9)', nameEn: 'Ultra-Wide (21:9)', icon: '🎞️' },
];

const MOTION_OPTIONS: Array<{ id: VideoMotion; nameAr: string; nameEn: string; icon: string }> = [
  { id: 'drone_fpv', nameAr: 'حلقة درون سريعة FPV', nameEn: 'FPV Drone Flythrough', icon: '🚁' },
  { id: 'orbit_360', nameAr: 'دوران سينمائي 360°', nameEn: 'Cinematic 360° Orbit', icon: '🔄' },
  { id: 'dolly_zoom', nameAr: 'تقريب دولي زووم سينمائي', nameEn: 'Cinematic Dolly Zoom', icon: '🔍' },
  { id: 'slow_motion', nameAr: 'تصوير بطيء فائق النعومة', nameEn: 'Ultra Slow Motion', icon: '🌊' },
  { id: 'pan_horizontal', nameAr: 'تتبع أفقي بانورامي', nameEn: 'Panoramic Pan', icon: '↔️' },
  { id: 'hyperlapse', nameAr: 'هايبر لابس متسارع', nameEn: 'Dynamic Hyperlapse', icon: '⚡' },
  { id: 'cinematic_steady', nameAr: 'كاميرا سينمائية مثبتة', nameEn: 'Steady Cam Motion', icon: '🎥' },
];

const PROMPT_SUGGESTIONS_IMAGE = [
  { ar: 'صقر عربي ذهبي يحلق فوق رمال صحراء العلا عند الغروب', en: 'Golden Arabian falcon soaring over Al-Ula sandstone dunes at sunset' },
  { ar: 'سيارة خارقة مستقبلية تسير في شوارع طوكيو ليلاً تحت المطر وضوء النيون', en: 'Futuristic hypercar racing through Tokyo neon streets in rain' },
  { ar: 'واحة مائية خيالية في كوكب كريستالي مع شلالات متوهجة باللون البنفسجي', en: 'Ethereal alien oasis on a crystal planet with bioluminescent waterfalls' },
  { ar: 'بورتريه فوتوغرافي فائق الواقعية لمحارب قديم بعيون ثاقبة وإضاءة درامية', en: 'Ultra-realistic cinematic portrait of ancient warrior with piercing eyes' },
];

const PROMPT_SUGGESTIONS_VIDEO = [
  { ar: 'لقطة درون سينمائية تندفع عبر ناطحات سحاب مدينة نيوم الذكية ليلاً', en: 'Cinematic FPV drone sweeping through futuristic NEOM skyscraper canyons at night' },
  { ar: 'دوران كاميرا 360 درجة حول يخت فاخر يبحر في مياه البحر الأحمر الفيروزية', en: '360 degree orbital camera around luxury yacht cutting through turquoise Red Sea waters' },
  { ar: 'حركة بطيئة فائقة لقطرات ماء تسقط على بتلات زهرة لوتس متوهجة في الفجر', en: 'Ultra slow-motion water droplets splashing on glowing lotus petal at dawn' },
  { ar: 'تقريب دولي سينمائي على رائد فضاء يستكشف آثاراً ضخمة على سطح المريخ', en: 'Cinematic vertigo dolly zoom on astronaut discovering colossal ancient ruins on Mars' },
];

const PROMPT_SUGGESTIONS_VECTOR = [
  { ar: 'شعار تقني تجريدي لشركة ذكاء اصطناعي بتدرج نيون سيان وبنفسجي وخطوط حادة', en: 'Minimalist geometric cybernetic AI logo with neon cyan and purple gradient' },
  { ar: 'تميمة صقر عربي ملكي بأسلوب فيكتور عصري وخطوط هندسية متناسقة', en: 'Modern vector mascot emblem of a royal golden falcon with sleek geometric curves' },
  { ar: 'أيقونة مكوك فضاء مستقبلي ينطلق نحو مجرة دائرية بألوان متوهجة', en: 'Futuristic space shuttle launching towards a spiral galaxy flat vector badge' },
  { ar: 'رسم بياني شبكي للبنية السحابية الرقمية مع عقد متصلة ودوائر متوهجة', en: 'Cloud computing network architecture infographic with glowing nodes and data flows' },
];

const QUICK_MODIFIERS = [
  { labelAr: '✨ إضاءة سينمائية', labelEn: 'Cinematic Lighting', text: 'volumetric dramatic rim lighting, soft shadow depth' },
  { labelAr: '🌅 الساعة الذهبية', labelEn: 'Golden Hour', text: 'warm golden hour sunset glow, amber rays, atmospheric haze' },
  { labelAr: '📸 عدسة 85mm بورتري', labelEn: '85mm Prime Lens', text: 'shot on 85mm f/1.8 lens, creamy optical bokeh depth of field' },
  { labelAr: '⚡ نيون سايبربانك', labelEn: 'Cyberpunk Neon', text: 'vibrant dual-tone cyan and magenta neon glow, wet reflections' },
  { labelAr: '🏛️ استوديو فاخر', labelEn: 'Studio Softbox', text: 'commercial product photography, large softbox key lighting, crisp reflections' },
  { labelAr: '💎 ريندر Unreal 5', labelEn: 'Unreal Engine 5', text: '3D CGI render, Unreal Engine 5.4, ray-traced global illumination, 8k textures' },
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

  // Video Animation Simulation
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<any>(null);

  // Real-Time VFX, Color Grading & Optics
  const [colorGrade, setColorGrade] = useState<'normal' | 'cinematic_noir' | 'cyberpunk' | 'golden_hour' | 'hdr' | 'emerald_matrix'>('normal');
  const [superResolution, setSuperResolution] = useState<boolean>(true);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);
  const [selectedLens, setSelectedLens] = useState<'14mm' | '35mm' | '50mm' | '85mm' | '200mm'>('85mm');
  const [selectedAperture, setSelectedAperture] = useState<'f/1.2' | 'f/2.8' | 'f/5.6' | 'f/11'>('f/1.2');

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

  const handleGenerateVariations = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setCustomSeed(nextSeed.toString());
    setTimeout(() => {
      handleGenerate();
    }, 50);
  };

  // Handle AI Prompt Enhancement
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

  // Append Quick Modifier to Prompt
  const handleAppendModifier = (text: string) => {
    setPrompt((prev) => (prev.trim() ? `${prev.trim()}, ${text}` : text));
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(isAr ? 'تحليل النوايا الدلالية ومواءمة الأسلوب الفني…' : 'Analyzing semantic intent & aesthetic pipeline…');

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
            ? (isAr ? 'بناء المسارات الهندسية والتدرجات عبر ADEM Neural SVG…' : 'Synthesizing vector paths & gradients via Neural SVG…')
            : activeTab === 'video'
            ? (isAr ? 'محاكاة اللقطات الحركية وضبط الإضاءة والديناميكية…' : 'Synthesizing cinematic motion & optical dynamics…')
            : isImg2Img
            ? (isAr ? 'معالجة الصورة المرجعية وتحويل النمط الفني…' : 'Processing image-to-image style transformation…')
            : (isAr ? `توليد الصورة بدقة فائقة عبر محرك ${selectedEngine}…` : `Synthesizing high-res textures via ${selectedEngine} engine…`)
        );
      }, 1200);

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
    <section className="feature-page max-w-7xl mx-auto px-3 sm:px-4 py-6 select-none">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 tracking-wider shadow-sm">
              <Sparkles size={13} className="fill-current animate-pulse text-emerald-300" />
              ADEM / MULTI-ENGINE MEDIA SYSTEM 2026
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline">
              IMAGEN 3 • FLUX.1 PRO • MIDJOURNEY • VECTOR SVG
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {isAr ? 'استوديو الوسائط والمحرك البصري المتطور' : 'Next-Gen Media & Visual Studio'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed font-normal">
            {isAr
              ? 'محرك وسائط هجين فائق الدقة: يدمج Google Imagen 3 و FLUX.1 Pro مع إخراج سينمائي ومولد الفيكتور وSVG البرمجي بدقة مطلقة.'
              : 'Hybrid neural media engine integrating Google Imagen 3, FLUX.1 Pro, cinematic video dynamics, and scalable Vector SVG synthesis.'}
          </p>
        </div>

        {/* Studio 4-Way Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800/90 self-start md:self-auto shadow-inner text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'image'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon size={14} />
            <span>{isAr ? 'توليد الصور' : 'Images'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film size={14} />
            <span>{isAr ? 'الفيديو السينمائي' : 'Video Cinema'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vector')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'vector'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={14} />
            <span>{isAr ? 'فيكتور وSVG' : 'Vector SVG'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              fetchGallery();
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>{isAr ? 'المعرض' : 'Vault'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-slate-300 font-mono">
              {gallery.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      {activeTab !== 'gallery' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-start">
          {/* Left Panel: Controls & Prompt Input (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Engine Selection Bar (when in Image mode) */}
            {activeTab === 'image' && (
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Cpu size={14} className="text-cyan-400" />
                    {isAr ? 'اختر المحرك العصبي (Neural Engine):' : 'Select Neural Engine:'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {ENGINE_CHOICES.find((e) => e.id === selectedEngine)?.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ENGINE_CHOICES.map((eng) => {
                    const active = selectedEngine === eng.id;
                    return (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => setSelectedEngine(eng.id)}
                        className={`p-2.5 rounded-2xl text-start transition cursor-pointer border flex flex-col justify-between ${
                          active
                            ? 'bg-gradient-to-br from-cyan-950/50 to-indigo-950/50 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,254,0.15)] ring-1 ring-cyan-400/30'
                            : 'bg-slate-950/90 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{eng.icon}</span>
                          <span className="font-bold text-xs truncate">{isAr ? eng.nameAr : eng.nameEn}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {isAr ? eng.descAr : eng.descEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prompt Input Box */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Wand2 size={14} className="text-cyan-400" />
                  {activeTab === 'vector'
                    ? (isAr ? 'صف الرسم أو الشعار الفيكتور المطلوب (SVG):' : 'Describe the vector SVG artwork:')
                    : activeTab === 'video'
                    ? (isAr ? 'صف المشهد السينمائي وحركة الكاميرا:' : 'Describe your cinematic video scene:')
                    : (isAr ? 'صف الصورة التي تريد توليدها (عربي أو إنجليزي):' : 'Describe the image you want to create:')}
                </label>

                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} className={isEnhancing ? 'animate-spin' : ''} />
                  <span>{isEnhancing ? (isAr ? 'جاري الفهم والتعزيز…' : 'Enhancing…') : (isAr ? 'المخرج البصري الذكي 🪄' : 'AI Prompt Architect 🪄')}</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  activeTab === 'vector'
                    ? (isAr ? 'مثال: شعار تقني ذكي لشركة روبوتات بهندسة متوازنة وتدرجات نيون سيان وبنفسجي…' : 'e.g. Modern cybernetic robotics company logo with clean geometry and cyan gradient…')
                    : activeTab === 'video'
                    ? (isAr ? 'مثال: لقطة درون سريعة تندفع بين ناطحات سحاب مدينة مستقبلية ليلاً مع أضواء نيون وانعكاسات مطر…' : 'e.g. Cinematic FPV drone flying between neo-tokyo skyscrapers at night with rain reflections…')
                    : isImg2Img
                    ? (isAr ? 'مثال: حول هذه الصورة إلى لوحة زيتية كلاسيكية مع إضاءة درامية مذهلة…' : 'e.g. Transform this image into a classical oil painting with dramatic lighting…')
                    : (isAr ? 'مثال: صقر عربي ذهبي يحلق فوق رمال صحراء العلا عند الغروب، إضاءة ذهبية وواقعية 8k…' : 'e.g. Majestic golden Arabian falcon soaring over desert sand dunes at golden hour…')
                }
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none font-sans"
              />

              {/* Quick Inspiration Modifier Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Palette size={12} className="text-amber-400" />
                  {isAr ? 'إضافات سينمائية بلمسة واحدة (Quick Enhancers):' : 'One-Touch Cinematic Modifiers:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MODIFIERS.map((mod, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAppendModifier(mod.text)}
                      className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-[11px] text-slate-300 transition cursor-pointer"
                    >
                      {isAr ? mod.labelAr : mod.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompt Ideas */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400">
                  {isAr ? 'أفكار مقترحة سريعة:' : 'Suggested inspirations:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTab === 'vector'
                    ? PROMPT_SUGGESTIONS_VECTOR
                    : activeTab === 'video'
                    ? PROMPT_SUGGESTIONS_VIDEO
                    : PROMPT_SUGGESTIONS_IMAGE
                  ).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(isAr ? s.ar : s.en)}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition text-start cursor-pointer truncate max-w-xs"
                    >
                      {isAr ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image-to-Image / Camera Reference Section */}
              {activeTab === 'image' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Camera size={14} className="text-emerald-400" />
                      {isAr ? 'تعديل أو تحويل صورة مرجعية (Image-to-Image):' : 'Image-to-Image Reference & Camera:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsImg2Img(!isImg2Img);
                        if (isImg2Img) setSourceImage(null);
                      }}
                      className={`text-xs px-3 py-1 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        isImg2Img
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Camera size={12} />
                      {isImg2Img ? (isAr ? 'مفعل (تعديل صورة)' : 'Active (Img2Img)') : (isAr ? 'تفعيل رفع صورة' : 'Enable Img2Img')}
                    </button>
                  </div>

                  {isImg2Img && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
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
                            className="w-14 h-14 object-cover rounded-xl border border-emerald-500/30 shadow"
                          />
                          <div className="flex-1 text-xs">
                            <span className="text-emerald-400 font-semibold block">
                              {isAr ? 'تم تحميل الصورة المرجعية بنجاح' : 'Reference image loaded'}
                            </span>
                            <span className="text-slate-400">
                              {isAr ? 'اكتب أمر التعديل أعلاه لتطبيق التغيير الذكي' : 'Type prompt above to apply neural edit'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSourceImage(null)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition cursor-pointer"
                            title={isAr ? 'حذف الصورة' : 'Remove image'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-400">
                            {isAr ? 'اختر صورة من جهازك للتحويل والترقية:' : 'Choose an image from device to restyle:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md"
                          >
                            <Camera size={14} />
                            <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Enhanced Output Box if available */}
              {enhancedResult && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-3 mt-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400 fill-current" />
                      {isAr ? 'الأمر المُعزز سينمائياً (Master AI Prompt):' : 'Cinematic Master Prompt:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(enhancedResult.enhancedPromptEn);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    {enhancedResult.enhancedPromptEn}
                  </p>

                  {enhancedResult.semanticAnalysis && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>{isAr ? 'فهم وتحليل الذكاء الاصطناعي لتفاصيل طلبك:' : 'AI Semantic Comprehension Breakdown:'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                          <span className="text-indigo-400 font-semibold block mb-0.5">🎯 {isAr ? 'العنصر الرئيسي:' : 'Subject:'}</span>
                          <span className="text-slate-300">{enhancedResult.semanticAnalysis.subject}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                          <span className="text-emerald-400 font-semibold block mb-0.5">🌍 {isAr ? 'المكان والبيئة:' : 'Environment:'}</span>
                          <span className="text-slate-300">{enhancedResult.semanticAnalysis.environment}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                          <span className="text-amber-400 font-semibold block mb-0.5">💡 {isAr ? 'الإضاءة والفيزياء:' : 'Lighting:'}</span>
                          <span className="text-slate-300">{enhancedResult.semanticAnalysis.lighting}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                          <span className="text-sky-400 font-semibold block mb-0.5">🎥 {isAr ? 'الكاميرا والعدسة:' : 'Camera:'}</span>
                          <span className="text-slate-300">{enhancedResult.semanticAnalysis.camera}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Artistic Styles Matrix (for image & vector) */}
            {activeTab !== 'video' && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Compass size={14} className="text-cyan-400" />
                  {isAr ? 'النمط الفني والإخراجي (Aesthetic Style):' : 'Artistic & Visual Style:'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map((st) => {
                    const active = selectedStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer border ${
                          active
                            ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">{st.icon}</span>
                        <span className="truncate">{isAr ? st.nameAr : st.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video Motion Matrix (If in Video Tab) */}
            {activeTab === 'video' && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Camera size={14} className="text-emerald-400" />
                  {isAr ? 'حركة الكاميرا وديناميكية المشهد (Camera Motion Dynamics):' : 'Camera Motion Dynamics:'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MOTION_OPTIONS.map((m) => {
                    const active = selectedMotion === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMotion(m.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition cursor-pointer border ${
                          active
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <div className="text-start">
                          <div className="font-semibold text-white">{isAr ? m.nameAr : m.nameEn}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Virtual Camera Optics & Lens Rig (If in Image Tab) */}
            {activeTab === 'image' && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Camera size={14} className="text-cyan-400" />
                    {isAr ? 'البصريات والعدسات السينمائية (Virtual Camera Optics):' : 'Virtual Camera Optics & Lens:'}
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {selectedLens} · {selectedAperture}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 w-12">{isAr ? 'العدسة:' : 'Lens:'}</span>
                    {(['14mm', '35mm', '50mm', '85mm', '200mm'] as const).map((lens) => (
                      <button
                        key={lens}
                        type="button"
                        onClick={() => {
                          setSelectedLens(lens);
                          handleAppendModifier(`captured with ${lens} cine prime lens`);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer border ${
                          selectedLens === lens
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lens}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 w-12">{isAr ? 'الفتحة:' : 'Aperture:'}</span>
                    {(['f/1.2', 'f/2.8', 'f/5.6', 'f/11'] as const).map((ap) => (
                      <button
                        key={ap}
                        type="button"
                        onClick={() => {
                          setSelectedAperture(ap);
                          handleAppendModifier(`aperture ${ap}, creamy optical bokeh`);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer border ${
                          selectedAperture === ap
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ap}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Aspect Ratio & Advanced Options (Image & Video) */}
            {activeTab !== 'vector' && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Sliders size={14} className="text-indigo-400" />
                    {isAr ? 'أبعاد الشاشة والإعدادات (Aspect Ratio):' : 'Aspect Ratio & Parameters:'}
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {showAdvanced ? (isAr ? 'إخفاء المتقدم' : 'Hide Advanced') : (isAr ? 'إعدادات متقدمة' : 'Advanced')}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ASPECT_OPTIONS.map((asp) => {
                    const active = selectedAspect === asp.id;
                    return (
                      <button
                        key={asp.id}
                        type="button"
                        onClick={() => setSelectedAspect(asp.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                          active
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{asp.icon}</span>
                        <span>{isAr ? asp.nameAr : asp.nameEn}</span>
                      </button>
                    );
                  })}
                </div>

                {showAdvanced && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Seed (بذرة التوليد):</label>
                        <input
                          type="text"
                          value={customSeed}
                          onChange={(e) => setCustomSeed(e.target.value)}
                          placeholder={isAr ? 'عشوائي تلقائي' : 'Random seed'}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          {isAr ? 'محرك التوليد النشط:' : 'Active Pipeline:'}
                        </label>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono">
                          {selectedEngine.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Launch Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-emerald-300" />
                  <span>{generationStep || (isAr ? 'جاري التوليد بدقة فائقة…' : 'Generating in Ultra HD…')}</span>
                </>
              ) : (
                <>
                  {activeTab === 'vector' ? (
                    <Code2 size={16} />
                  ) : activeTab === 'video' ? (
                    <Film size={16} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  <span>
                    {activeTab === 'vector'
                      ? (isAr ? 'توليد رسم وكود SVG البرمجي الآن' : 'Synthesize Vector SVG Code Now')
                      : activeTab === 'video'
                      ? (isAr ? 'بدء إخراج وتوليد الفيديو السينمائي الآن' : 'Render Cinematic Video Now')
                      : (isAr ? `توليد الصورة عبر ${selectedEngine === 'auto' ? 'المحرك الأنسب' : selectedEngine}` : 'Generate Masterpiece Now')}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Active Stage / Preview Screen (5 cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentResult?.type === 'vector'
                      ? (isAr ? 'منصة الفيكتور والكود (SVG Canvas)' : 'SVG Vector Canvas')
                      : currentResult?.type === 'video'
                      ? (isAr ? 'مسرح العرض السينمائي (Cinema Stage)' : 'Cinema Player Stage')
                      : (isAr ? 'منصة المعاينة فائقة الدقة (8K Viewer)' : '8K Master Stage')}
                  </h3>
                </div>

                {currentResult && (
                  <div className="flex items-center gap-1.5">
                    {currentResult.engine && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                        {currentResult.engine}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title={isAr ? 'تكبير كامل' : 'Fullscreen'}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport Box */}
              <div
                className={`relative rounded-2xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center group shadow-inner ${
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
                      <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                      <Sparkles size={20} className="absolute inset-0 m-auto text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-semibold text-white animate-pulse">
                      {generationStep || (isAr ? 'جاري بناء التكوين البصري…' : 'Building visual composition…')}
                    </div>
                    <div className="text-[11px] text-slate-400 max-w-xs font-mono">
                      {isAr
                        ? 'محاكاة الإضاءة وتتبع الأشعة والتدرجات اللونية'
                        : 'Simulating neural diffusion & color harmonics'}
                    </div>
                  </div>
                ) : currentResult ? (
                  <>
                    {/* Vector Display: Rendered SVG or Code */}
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
                          currentResult.type === 'video' && isVideoPlaying ? 'scale-105 filter brightness-105' : 'scale-100'
                        }`}
                      />
                    )}

                    {/* Video Simulation Overlay */}
                    {currentResult.type === 'video' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            CINEMA 60FPS
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
                  <div className="text-center p-6 text-slate-500 text-xs">
                    {isAr ? 'المسرح جاهز. اكتب وصفاً واضغط على زر التوليد.' : 'Studio is ready. Enter prompt and generate.'}
                  </div>
                )}
              </div>

              {/* Vector Mode Quick Toolbar */}
              {currentResult?.type === 'vector' && (
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setVectorViewMode('preview')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        vectorViewMode === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isAr ? 'معاينة بصرية' : 'Visual View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVectorViewMode('code')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                        vectorViewMode === 'code' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
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
                      className={`p-1 rounded-md ${svgBackdrop === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                      title={isAr ? 'خلفية داكنة' : 'Dark'}
                    >
                      <Moon size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgBackdrop('light')}
                      className={`p-1 rounded-md ${svgBackdrop === 'light' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                      title={isAr ? 'خلفية فاتحة' : 'Light'}
                    >
                      <Sun size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgBackdrop('grid')}
                      className={`p-1 rounded-md text-[10px] font-mono ${svgBackdrop === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                      title={isAr ? 'شبكة مربعات شفافة' : 'Grid'}
                    >
                      #
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Color Grade & VFX Deck */}
              {currentResult && currentResult.type !== 'vector' && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Palette size={12} className="text-cyan-400" />
                      {isAr ? 'معالجة الألوان وتأثيرات الإخراج (Color Grade & VFX):' : 'Color Grade & Live VFX Shaders:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuperResolution((s) => !s)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                        superResolution
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {superResolution ? '✨ 8K ULTRA SHARP' : 'RAW RES'}
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
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isAr ? lut.ar : lut.en}
                      </button>
                    ))}
                  </div>

                  {currentResult.type === 'video' && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span>{isAr ? 'سرعة عرض الفيديو السينمائي:' : 'Playback Speed:'}</span>
                      <div className="flex items-center gap-1">
                        {[0.5, 1.0, 2.0].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setVideoSpeed(spd)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                              videoSpeed === spd
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar Below Preview */}
              {currentResult && (
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{currentResult.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-mono">
                      {currentResult.enhancedPrompt}
                    </p>
                  </div>

                  {currentResult.explanationAr && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-emerald-300">
                      💡 {currentResult.explanationAr}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 flex-wrap">
                    {/* Quick Variation */}
                    <button
                      type="button"
                      onClick={handleGenerateVariations}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                      title={isAr ? 'توليد تنويع بصري جديد بنفس الوصف' : 'Generate New Variation with same prompt'}
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
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedSvg ? <Check size={13} className="text-emerald-400" /> : <Code2 size={13} />}
                        <span>{copiedSvg ? (isAr ? 'تم نسخ كود SVG' : 'Copied SVG') : (isAr ? 'نسخ كود SVG' : 'Copy SVG')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title={isAr ? 'تابع النقاش والتطوير مع آدم في المحادثة' : 'Discuss with ADAM in Chat'}
                    >
                      <Share2 size={13} />
                      <span>{isAr ? 'ناقش مع آدم' : 'Chat with ADAM'}</span>
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({gallery.length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'image' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الصور فقط' : 'Images'} ({gallery.filter((g) => g.type === 'image').length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'video' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الفيديوهات فقط' : 'Videos'} ({gallery.filter((g) => g.type === 'video').length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('vector')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'vector' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الفيكتور وSVG' : 'Vectors'} ({gallery.filter((g) => g.type === 'vector').length})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchGallery}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={galleryLoading ? 'animate-spin' : ''} />
              <span>{isAr ? 'مزامنة المعرض' : 'Sync'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item) => {
              const isVideo = item.type === 'video';
              const isVector = item.type === 'vector';
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden group hover:border-cyan-500/50 transition-all shadow-md hover:shadow-2xl flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
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
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isVector
                            ? 'bg-emerald-600 text-white'
                            : isVideo
                            ? 'bg-rose-600 text-white'
                            : 'bg-cyan-600 text-white'
                        }`}
                      >
                        {isVector ? 'VECTOR SVG' : isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                      {item.engine && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-cyan-300 text-[9px] font-mono truncate max-w-[120px]">
                          {item.engine}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-2 end-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.originalPrompt}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPrompt(item.originalPrompt);
                            setActiveTab(item.type);
                            setCurrentResult(item);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          {isAr ? 'فتح بالأستوديو' : 'Open in Studio'}
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-slate-400 hover:text-white"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGallery.length === 0 && !galleryLoading && (
            <div className="text-center py-16 text-slate-500 text-xs">
              {isAr ? 'المعرض فارغ حالياً. قم بتوليد صورة أو فيكتور أو فيديو لحفظها هنا.' : 'Vault is empty. Generate media to populate.'}
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
              className="absolute -top-10 end-0 text-white hover:text-cyan-400 p-2"
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
