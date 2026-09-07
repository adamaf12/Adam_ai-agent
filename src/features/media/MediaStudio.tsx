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
  Eye,
  Camera,
  Share2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';

type StudioTab = 'image' | 'video' | 'gallery';

type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '21:9';

type ImageStyle =
  | 'photorealistic'
  | 'cinematic'
  | 'anime'
  | 'cyberpunk'
  | 'unreal5'
  | 'oil_painting'
  | 'product_studio'
  | 'fantasy'
  | 'minimalist';

type VideoMotion =
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

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  originalPrompt: string;
  enhancedPrompt: string;
  negativePrompt?: string;
  semanticAnalysis?: SemanticAnalysis;
  explanationAr?: string;
  url: string;
  posterUrl?: string;
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

export function MediaStudio({ language, onNavigate, onRunPromptInChat }: MediaStudioProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<StudioTab>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('cinematic');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('16:9');
  const [selectedMotion, setSelectedMotion] = useState<VideoMotion>('drone_fpv');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Gallery State
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video'>('all');

  // Video Animation Simulation
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<any>(null);

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
      videoIntervalRef.current = setInterval(() => {
        setVideoProgress(p => (p >= 100 ? 0 : p + 2));
      }, 100);
    } else {
      clearInterval(videoIntervalRef.current);
    }
    return () => clearInterval(videoIntervalRef.current);
  }, [currentResult, isVideoPlaying]);

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

  // Handle Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(isAr ? 'تحليل النوايا الدلالية ومواءمة الأسلوب الفني…' : 'Analyzing semantic intent & camera aesthetics…');

    try {
      const seedNum = customSeed.trim() ? Number(customSeed) : Math.floor(Math.random() * 999999);
      let endpoint = '/api/media/generate-image';
      let payload: any = {
        prompt,
        style: selectedStyle,
        aspectRatio: selectedAspect,
        seed: seedNum,
      };

      if (activeTab === 'video') {
        endpoint = '/api/media/generate-video';
        payload = {
          prompt,
          style: selectedStyle,
          motion: selectedMotion,
          aspectRatio: selectedAspect,
          duration: 5,
          fps: 60,
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
          activeTab === 'video'
            ? (isAr ? 'محاكاة حركة الكاميرا والعمق البصري 60fps…' : 'Synthesizing motion dynamics & 60fps frame interpolation…')
            : isImg2Img
            ? (isAr ? 'معالجة الصورة المرفوعة وتحويل نمطها بالذكاء الاصطناعي…' : 'Processing image-to-image transformation…')
            : (isAr ? 'توليد البكسلات عالية الدقة وتوزيع الإضاءة الحجمية…' : 'Rendering high-resolution textures & volumetric lighting…')
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

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setGallery(g => g.filter(item => item.id !== id));
        if (currentResult?.id === id) {
          setCurrentResult(gallery.find(item => item.id !== id) || null);
        }
      }
    } catch (e) {
      console.warn('Delete failed:', e);
    }
  };

  const filteredGallery = useMemo(() => {
    if (galleryFilter === 'all') return gallery;
    return gallery.filter(item => item.type === galleryFilter);
  }, [gallery, galleryFilter]);

  return (
    <section className="feature-page max-w-7xl mx-auto px-4 py-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles size={12} className="fill-current" />
              ULTRA AI MEDIA STUDIO v3.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FLUX & CINEMATIC MOTION
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {isAr ? 'استوديو توليد الصور والفيديوهات السينمائية فائق القوة' : 'Ultra-Powerful AI Image & Video Studio'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
            {isAr
              ? 'محرك بصري وسينمائي معاد بناؤه بالكامل من الصفر؛ يفهم لغتك بعمق، يضخم أوامرك تلقائياً بإضاءات وزوايا تصوير سينمائية، ويولد صوراً وفيديوهات مذهلة بدقة 8K.'
              : 'Rebuilt from the ground up with deep semantic comprehension, AI prompt expansion, camera motion synthesis, and ultra-high-resolution rendering.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon size={14} />
            <span>{isAr ? 'استوديو الصور' : 'Image Studio'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film size={14} />
            <span>{isAr ? 'استوديو الفيديو السينمائي' : 'Video Cinema'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              fetchGallery();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{isAr ? 'المعرض والتحميلات' : 'Vault'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-300 font-mono">
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
            {/* Prompt Input Box */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Wand2 size={14} className="text-indigo-400" />
                  {activeTab === 'video'
                    ? (isAr ? 'صف المشهد السينمائي وحركة الكاميرا:' : 'Describe your cinematic video scene:')
                    : (isAr ? 'صف الصورة التي تتخيلها باللغة العربية أو الإنجليزية:' : 'Describe the image you want to create:')}
                </label>

                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} className={isEnhancing ? 'animate-spin' : ''} />
                  <span>{isEnhancing ? (isAr ? 'جاري الفهم والتعزيز…' : 'Enhancing…') : (isAr ? 'تعزيز وفهم ذكي بالـ AI 🪄' : 'AI Smart Enhance 🪄')}</span>
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  activeTab === 'video'
                    ? (isAr ? 'مثال: لقطة درون سريعة تندفع بين ناطحات سحاب مدينة مستقبلية ليلاً مع أضواء نيون وانعكاسات مطر…' : 'e.g. Cinematic FPV drone flying between neo-tokyo skyscrapers at night with rain reflections…')
                    : isImg2Img
                    ? (isAr ? 'مثال: حول هذه الصورة إلى لوحة زيتية كلاسيكية مع إضاءة درامية مذهلة…' : 'e.g. Transform this image into a classical oil painting with dramatic lighting…')
                    : (isAr ? 'مثال: صقر عربي ذهبي يحلق فوق رمال صحراء العلا عند الغروب، إضاءة ذهبية وواقعية 8k…' : 'e.g. Majestic golden Arabian falcon soaring over desert sand dunes at golden hour…')
                }
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />

              {/* Image-to-Image / Camera Refiner Section */}
              {activeTab === 'image' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Camera size={14} className="text-emerald-400" />
                      {isAr ? 'تعديل أو تحويل صورة (Image-to-Image / Camera):' : 'Image-to-Image / Camera Reference:'}
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
                      {isImg2Img ? (isAr ? 'مفعل (تعديل صورة)' : 'Active (Img2Img)') : (isAr ? 'تفعيل رفع صورة / كاميرا' : 'Enable Img2Img')}
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
                              {isAr ? 'اكتب أمر التعديل أعلاه (مثال: حول النمط أو غير الإضاءة)' : 'Type modification instruction above'}
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
                            {isAr ? 'اختر صورة من جهازك أو التقطها بكاميرا الهاتف:' : 'Choose from device or snap with camera:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md"
                          >
                            <Camera size={14} />
                            <span>{isAr ? 'رفع أو التقاط صورة' : 'Upload / Snap Photo'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Inspiration Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  {isAr ? 'أفكار ملهمة مقترحة بنقرة واحدة:' : 'Inspiring quick prompts:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTab === 'video' ? PROMPT_SUGGESTIONS_VIDEO : PROMPT_SUGGESTIONS_IMAGE).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(isAr ? s.ar : s.en)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition text-left cursor-pointer truncate max-w-xs"
                    >
                      {isAr ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>

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
                  
                  {/* Semantic Comprehension Matrix */}
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
                        {enhancedResult.semanticAnalysis.motion && (
                          <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 sm:col-span-2">
                            <span className="text-rose-400 font-semibold block mb-0.5">🌊 {isAr ? 'الحركة والديناميكية:' : 'Motion Dynamics:'}</span>
                            <span className="text-slate-300">{enhancedResult.semanticAnalysis.motion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-300 leading-normal flex items-start gap-1.5 pt-1 border-t border-indigo-900/40">
                    <span className="text-sm">💡</span>
                    <span>{enhancedResult.explanationAr}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Artistic Styles Matrix */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Compass size={14} className="text-indigo-400" />
                {isAr ? 'النمط الفني والإخراجي (Aesthetic Style):' : 'Artistic & Cinematic Style:'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_OPTIONS.map(st => {
                  const active = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer border ${
                        active
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
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

            {/* Video Motion Matrix (If in Video Tab) */}
            {activeTab === 'video' && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Camera size={14} className="text-emerald-400" />
                  {isAr ? 'حركة الكاميرا وديناميكية المشهد (Camera Motion Dynamics):' : 'Camera Motion Dynamics:'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MOTION_OPTIONS.map(m => {
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
                        <div className="text-left">
                          <div className="font-semibold text-white">{isAr ? m.nameAr : m.nameEn}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aspect Ratio & Advanced Options */}
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
                {ASPECT_OPTIONS.map(asp => {
                  const active = selectedAspect === asp.id;
                  return (
                    <button
                      key={asp.id}
                      type="button"
                      onClick={() => setSelectedAspect(asp.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
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
                        onChange={e => setCustomSeed(e.target.value)}
                        placeholder={isAr ? 'عشوائي تلقائي' : 'Random seed'}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        {isAr ? 'معدل الإطارات والفريمات:' : 'FPS / Quality Preset:'}
                      </label>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono">
                        60 FPS Cinema HD
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{generationStep || (isAr ? 'جاري التوليد بدقة فائقة…' : 'Generating in Ultra HD…')}</span>
                </>
              ) : (
                <>
                  {activeTab === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
                  <span>
                    {activeTab === 'video'
                      ? (isAr ? 'بدء إخراج وتوليد الفيديو السينمائي الآن' : 'Render Cinematic Video Now')
                      : (isAr ? 'توليد الصورة بجودة 8K الفائقة الآن' : 'Generate 8K Masterpiece Now')}
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
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentResult?.type === 'video'
                      ? (isAr ? 'مسرح العرض السينمائي (Cinema Stage)' : 'Cinema Player Stage')
                      : (isAr ? 'منصة المعاينة فائقة الدقة (8K Viewer)' : '8K Master Stage')}
                  </h3>
                </div>

                {currentResult && (
                  <span className="text-[11px] font-mono text-indigo-400">
                    {currentResult.aspectRatio} • Seed: {currentResult.seed}
                  </span>
                )}
              </div>

              {/* Viewport Box */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group shadow-inner">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                      <Sparkles size={20} className="absolute inset-0 m-auto text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-semibold text-white animate-pulse">
                      {generationStep || (isAr ? 'جاري بناء المحتوى السينمائي…' : 'Building visual composition…')}
                    </div>
                    <div className="text-[11px] text-slate-400 max-w-xs">
                      {isAr
                        ? 'محاكاة الإضاءة العالمية وتتبع الأشعة والعدسات البصرية'
                        : 'Simulating ray-tracing global illumination & optical flares'}
                    </div>
                  </div>
                ) : currentResult ? (
                  <>
                    <img
                      src={currentResult.url}
                      alt={currentResult.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        currentResult.type === 'video' && isVideoPlaying ? 'scale-105 filter brightness-105' : 'scale-100'
                      }`}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/1280/720`;
                        }
                      }}
                    />

                    {/* Video Simulation Overlay */}
                    {currentResult.type === 'video' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            CINEMA 60FPS
                          </span>
                          <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded-md">
                            Motion: {currentResult.motion || 'Drone Pan'}
                          </span>
                        </div>

                        {/* Player Controls & Progress Bar */}
                        <div className="space-y-2">
                          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full transition-all duration-100 ease-linear"
                              style={{ width: `${videoProgress}%` }}
                            ></div>
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

              {/* Action Bar Below Preview */}
              {currentResult && (
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{currentResult.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-mono">
                      {currentResult.enhancedPrompt}
                    </p>
                  </div>

                  {currentResult.semanticAnalysis && (
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>{isAr ? 'فهم الذكاء الاصطناعي للمشهد:' : 'AI Vision Interpretation:'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300">
                        <div>
                          <span className="text-indigo-400 font-medium">🎯 {isAr ? 'الهدف:' : 'Subject:'} </span>
                          <span>{currentResult.semanticAnalysis.subject}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-medium">🌍 {isAr ? 'البيئة:' : 'Environment:'} </span>
                          <span>{currentResult.semanticAnalysis.environment}</span>
                        </div>
                        <div>
                          <span className="text-amber-400 font-medium">💡 {isAr ? 'الإضاءة:' : 'Lighting:'} </span>
                          <span>{currentResult.semanticAnalysis.lighting}</span>
                        </div>
                        <div>
                          <span className="text-sky-400 font-medium">🎥 {isAr ? 'الكاميرا:' : 'Camera:'} </span>
                          <span>{currentResult.semanticAnalysis.camera}</span>
                        </div>
                        {currentResult.semanticAnalysis.motion && (
                          <div className="sm:col-span-2">
                            <span className="text-rose-400 font-medium">🌊 {isAr ? 'الحركة:' : 'Motion:'} </span>
                            <span>{currentResult.semanticAnalysis.motion}</span>
                          </div>
                        )}
                      </div>
                      {currentResult.explanationAr && (
                        <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-900">
                          {currentResult.explanationAr}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={currentResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`adam_${currentResult.type}_${currentResult.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={13} />
                      <span>{isAr ? 'تنزيل بجودة أصلية' : 'Download HD'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ البرومبت' : 'Copy Prompt')}</span>
                    </button>

                    {onRunPromptInChat && (
                      <button
                        type="button"
                        onClick={() => onRunPromptInChat(currentResult.originalPrompt)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Share2 size={13} />
                        <span>{isAr ? 'إرسال للمحادثة' : 'Send to Chat'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vault / Gallery View */
        <div className="my-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({gallery.length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('image')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الصور فقط' : 'Images'} ({gallery.filter(g => g.type === 'image').length})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  galleryFilter === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {isAr ? 'الفيديوهات فقط' : 'Videos'} ({gallery.filter(g => g.type === 'video').length})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchGallery}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={galleryLoading ? 'animate-spin' : ''} />
              <span>{isAr ? 'تحديث' : 'Sync'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map(item => {
              const isVideo = item.type === 'video';
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden group hover:border-indigo-500/50 transition-all shadow-md hover:shadow-2xl flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isVideo ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-slate-300 text-[10px] font-mono">
                        {item.aspectRatio}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer opacity-0 group-hover:opacity-100"
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
                      <span className="text-slate-500">
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
                          className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                        >
                          {isAr ? 'تعديل بالأستوديو' : 'Load in Studio'}
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
              {isAr ? 'المعرض فارغ حالياً. قم بتوليد صورة أو فيديو لحفظها هنا.' : 'Vault is empty. Generate media to populate.'}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
