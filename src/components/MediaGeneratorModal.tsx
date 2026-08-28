import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Video,
  Image as ImageIcon,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  RefreshCw,
  Film,
  Camera,
  Layers,
  Clock,
  Music,
  Send,
  Sliders,
  Sparkle,
  Trash2,
  Upload,
  Wand2,
  Maximize2,
  Zap,
  SlidersHorizontal,
  Contrast,
  Eye,
  Edit3,
  List,
  Clapperboard,
  ShieldAlert,
} from 'lucide-react';
import { saveLocalFile } from '../lib/storage';
import {
  ShotType,
  CameraMotion as DirectorCameraMotion,
  LensType,
  LightingType,
  ColorGrade,
  buildCinematicPrompt,
  DEFAULT_NEGATIVE_PROMPT,
  SHOT_TYPE_MAP,
  CAMERA_MOTION_MAP,
  LENS_MAP,
  LIGHTING_MAP,
  COLOR_GRADE_MAP,
  generateShotList,
  ShotListItem,
} from '../lib/cinematicPromptEngine';

interface GeneratedMediaItem {
  id: string;
  type: 'image' | 'video' | 'nano_banana_edit';
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  mediaUrl: string;
  posterUrl?: string;
  sourceImage?: string;
  editMode?: string;
  style: string;
  aspectRatio: string;
  durationSeconds?: number;
  cameraMotion?: string;
  createdAt: string;
}

interface MediaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  initialImageToEdit?: string;
  initialTab?: 'nano_banana_edit' | 'image' | 'video';
  onSendToChat?: (content: string, attachmentUrl?: string) => void;
}

export const MediaGeneratorModal: React.FC<MediaGeneratorModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  initialImageToEdit,
  initialTab = 'nano_banana_edit',
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'nano_banana_edit' | 'image' | 'video'>(
    initialTab || 'nano_banana_edit'
  );

  // Nano Banana Image Edit States
  const [sourceImage, setSourceImage] = useState<string | null>(initialImageToEdit || null);
  const [editMode, setEditMode] = useState<string>('free_edit');
  const [editPrompt, setEditPrompt] = useState<string>('');

  // Generation Input States
  const [selectedEngine, setSelectedEngine] = useState<string>('nano_banana_pro');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [cameraMotion, setCameraMotion] = useState('zoom_in');

  // Hollywood Director Mode States (Cinematic Prompt Engineer Layer)
  const [isDirectorMode, setIsDirectorMode] = useState<boolean>(true);
  const [shotType, setShotType] = useState<ShotType>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).shotType || 'auto' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [directorCameraMotion, setDirectorCameraMotion] = useState<DirectorCameraMotion>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).directorCameraMotion || 'auto' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [lens, setLens] = useState<LensType>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).lens || 'auto' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [lighting, setLighting] = useState<LightingType>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).lighting || 'auto' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [colorGrade, setColorGrade] = useState<ColorGrade>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).colorGrade || 'auto' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [negativePrompt, setNegativePrompt] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_director_prefs');
      return stored ? JSON.parse(stored).negativePrompt || DEFAULT_NEGATIVE_PROMPT : DEFAULT_NEGATIVE_PROMPT;
    } catch {
      return DEFAULT_NEGATIVE_PROMPT;
    }
  });
  const [isMultiShot, setIsMultiShot] = useState<boolean>(false);
  const [customEnhancedPrompt, setCustomEnhancedPrompt] = useState<string>('');
  const [isEditingEnhancedPrompt, setIsEditingEnhancedPrompt] = useState<boolean>(false);

  // Status & History States
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mediaHistory, setMediaHistory] = useState<GeneratedMediaItem[]>(() => {
    try {
      const stored = localStorage.getItem('noor_ai_media_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentResult, setCurrentResult] = useState<GeneratedMediaItem | null>(null);

  // Video Canvas Player States
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialImageToEdit) {
      setSourceImage(initialImageToEdit);
      setActiveTab('nano_banana_edit');
    }
  }, [initialImageToEdit]);

  useEffect(() => {
    try {
      localStorage.setItem('noor_ai_media_history', JSON.stringify(mediaHistory.slice(-25)));
    } catch (e) {
      console.error('Failed to save media history:', e);
    }
  }, [mediaHistory]);

  // Save Director preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        'noor_ai_director_prefs',
        JSON.stringify({ shotType, directorCameraMotion, lens, lighting, colorGrade, negativePrompt })
      );
    } catch (e) {
      console.error('Failed to save director preferences:', e);
    }
  }, [shotType, directorCameraMotion, lens, lighting, colorGrade, negativePrompt]);

  // Compute Live Hollywood Cinematic Prompt
  const rawTargetPrompt = activeTab === 'nano_banana_edit' ? editPrompt || 'تعديل احترافي للصورة' : prompt;

  const liveCinematicBuild = buildCinematicPrompt(
    rawTargetPrompt || 'مشهد سينمائي فاخر بدقة 8K',
    activeTab === 'nano_banana_edit' ? 'nano_banana_edit' : activeTab,
    {
      shotType,
      cameraMotion: directorCameraMotion,
      lens,
      lighting,
      colorGrade,
      aspectRatio,
      negativePrompt,
      isMultiShot,
    },
    style
  );

  const activeEnhancedPrompt = customEnhancedPrompt.trim() || liveCinematicBuild.enhancedPrompt;
  const shotList: ShotListItem[] = isMultiShot
    ? generateShotList(rawTargetPrompt || 'مشهد سينمائي فاخر', 3, {
        shotType,
        cameraMotion: directorCameraMotion,
        lens,
        lighting,
        colorGrade,
        aspectRatio,
        negativePrompt,
      })
    : [];

  // Handle Video Canvas Animation Rendering
  useEffect(() => {
    if (!currentResult || currentResult.type !== 'video' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentResult.posterUrl || currentResult.mediaUrl;
    imageObjRef.current = img;

    let startTime: number | null = null;
    const durationMs = (currentResult.durationSeconds || 5) * 1000;

    const renderFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % durationMs;
      const progress = elapsed / durationMs;
      setVideoProgress(progress);

      if (ctx && img.complete) {
        const cw = canvas.width;
        const ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        let scale = 1.0;
        let dx = 0;
        let dy = 0;
        let rotation = 0;

        if (currentResult.cameraMotion === 'zoom_in' || currentResult.cameraMotion === 'slow_dolly_in') {
          scale = 1.0 + progress * 0.25;
        } else if (currentResult.cameraMotion === 'orbit') {
          scale = 1.1;
          dx = Math.sin(progress * Math.PI * 2) * (cw * 0.05);
          dy = Math.cos(progress * Math.PI * 2) * (ch * 0.03);
          rotation = Math.sin(progress * Math.PI * 2) * 0.02;
        } else if (currentResult.cameraMotion === 'pan_right' || currentResult.cameraMotion === 'tracking_shot') {
          scale = 1.15;
          dx = (progress - 0.5) * (cw * 0.15);
        } else if (currentResult.cameraMotion === 'drone' || currentResult.cameraMotion === 'crane_shot') {
          scale = 1.2 - Math.abs(progress - 0.5) * 0.2;
          dy = (progress - 0.5) * (ch * 0.1);
        } else if (currentResult.cameraMotion === 'slow_motion' || currentResult.cameraMotion === 'steadicam_glide') {
          scale = 1.05 + progress * 0.08;
        }

        ctx.save();
        ctx.translate(cw / 2 + dx, ch / 2 + dy);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch);
        ctx.restore();

        ctx.save();
        const gradient = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.2, cw / 2, ch / 2, cw * 0.7);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cw, ch);

        for (let i = 0; i < 15; i++) {
          const px = ((Math.sin(i * 99 + progress * 5) + 1) / 2) * cw;
          const py = ((Math.cos(i * 33 + progress * 3) + 1) / 2) * ch;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + 0.25 * Math.sin(progress * Math.PI * 4 + i)})`;
          ctx.fill();
        }
        ctx.restore();
      }

      if (isPlayingVideo) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    img.onload = () => {
      canvas.width = img.width || 1280;
      canvas.height = img.height || 720;
      renderFrame(performance.now());
    };

    if (isPlayingVideo) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentResult, isPlayingVideo]);

  if (!isOpen) return null;

  const nanoBananaPresets = [
    {
      id: 'free_edit',
      nameAr: '🎨 تعديل حر بالأمر النصي',
      nameEn: 'Custom Prompt Edit',
      descAr: 'اكتب ما تريد إضافته أو تعديله بالحرف',
      descEn: 'Modify photo according to custom text instruction',
    },
    {
      id: 'upscale_4k',
      nameAr: '⚡ تحسين وتوضيح الجودة 4K',
      nameEn: '4K Resolution Upscale',
      descAr: 'زيادة الوضوح وتصفية التفاصيل بدقة فائقة',
      descEn: 'Enhance details, sharpen edges, and clear noise',
    },
    {
      id: 'anime',
      nameAr: '🎨 تحويل إلى أنمي / كرتون',
      nameEn: 'Anime & Manga Style',
      descAr: 'تحويل الصورة إلى طراز أنمي احترافي',
      descEn: 'Transform photo into anime style art',
    },
    {
      id: 'remove_bg',
      nameAr: '🎭 عزل واستبدال الخلفية',
      nameEn: 'Smart BG Removal',
      descAr: 'عزل العنصر وتغيير المشهد الخلفي بذكاء',
      descEn: 'Isolate main object and replace background',
    },
    {
      id: '3d_render',
      nameAr: '🧊 تحويل إلى ثري دي 3D',
      nameEn: '3D Render & Sculpt',
      descAr: 'تحويل الصورة لمجسم 3D سينمائي',
      descEn: 'Convert image into Octane 3D render',
    },
    {
      id: 'cyberpunk',
      nameAr: '🌆 طراز نيون وسايبورغ',
      nameEn: 'Neon Cyberpunk Aesthetic',
      descAr: 'إضافة أضواء النيون والطراز المستقبلي',
      descEn: 'Add futuristic neon and cyberpunk vibe',
    },
    {
      id: 'portrait',
      nameAr: '🧼 تصفية الوجه والبورتريه',
      nameEn: 'Portrait & Skin Filter',
      descAr: 'تحسين الإضاءة وتنعيم البشرة احترافياً',
      descEn: 'Professional portrait lighting & face touchup',
    },
  ];

  const imageEngineOptions = [
    {
      id: 'nano_banana_pro',
      nameAr: '🎨 High Quality Pro (المحرك الرئيسي 4K)',
      nameEn: 'High Quality Pro 4K (Primary Engine)',
      descAr: 'المحرك الافتراضي الأقوى والأعلى دقة لتوليد وتعديل الصور بدقة فائقة 4K',
      descEn: 'Default primary engine for high fidelity 4K image generation & editing',
      badge: 'الافتراضي ⭐',
      isDefault: true,
    },
    {
      id: 'nano_banana_turbo',
      nameAr: '⚡ Fast Turbo Engine (المحرك السريع الخاطف)',
      nameEn: 'Fast Turbo Engine (Ultra Fast)',
      descAr: 'المحرك الفائق السرعة لمعالجة ومعاينة الصور فورياً',
      descEn: 'Ultra fast engine for instant processing',
      badge: 'سريع ⚡',
      isDefault: false,
    },
    {
      id: 'nano_banana_realism',
      nameAr: '📸 Photorealism 8K (واقعية فائقة)',
      nameEn: 'Photorealism 8K Engine',
      descAr: 'محرك متخصص للصور الفوتوغرافية الحقيقية مع إضاءة سينمائية',
      descEn: 'Lifelike camera photography rendering',
      badge: 'واقعي 📸',
      isDefault: false,
    },
    {
      id: 'nano_banana_anime',
      nameAr: '🎨 Anime & Digital Art (أنمي وفن رقمي)',
      nameEn: 'Anime & Digital Art Engine',
      descAr: 'محرك متخصص في رسم الأنمي، المانغا والفن الرقمي الخيالي',
      descEn: 'Specialized in anime, manga & digital art',
      badge: 'فن أنمي 🎨',
      isDefault: false,
    },
  ];

  const styleOptions = [
    { id: 'cinematic', nameAr: '🎬 سينمائي هوليوود', nameEn: 'Hollywood Cinematic' },
    { id: 'photorealistic', nameAr: '📸 واقعي 8K', nameEn: 'Photorealistic' },
    { id: 'anime', nameAr: '🎨 أنمي / مانغا', nameEn: 'Anime Art' },
    { id: '3d_render', nameAr: '🧊 مجسم 3D', nameEn: '3D Render' },
    { id: 'cyberpunk', nameAr: '🌆 نيون سايبورغ', nameEn: 'Cyberpunk' },
    { id: 'fantasy', nameAr: '🐉 خيالي سحري', nameEn: 'Fantasy Art' },
  ];

  const aspectRatios = [
    { id: '21:9', label: '21:9 (سينمائي فائق / Ultra-Wide)', icon: '🎬' },
    { id: '16:9', label: '16:9 (عريض / شاشة)', icon: '📺' },
    { id: '1:1', label: '1:1 (مربع / سوشيال)', icon: '🟦' },
    { id: '9:16', label: '9:16 (ستوري / ريلز)', icon: '📱' },
    { id: '4:3', label: '4:3 (كلاسيكي)', icon: '🖼️' },
    { id: '3:4', label: '3:4 (بورتريه)', icon: '📲' },
  ];

  const cameraMotions = [
    { id: 'slow_dolly_in', nameAr: '🔍 تقريب هادئ (Slow Dolly-In)', nameEn: 'Slow Dolly-In' },
    { id: 'tracking_shot', nameAr: '⏩ تتبع جانبي (Tracking Shot)', nameEn: 'Tracking Shot' },
    { id: 'crane_shot', nameAr: '🏗️ لقطة رافعة (Crane Shot)', nameEn: 'Crane Shot' },
    { id: 'steadicam_glide', nameAr: '🎥 حركة ستيديكام (Steadicam Glide)', nameEn: 'Steadicam Glide' },
    { id: 'drone', nameAr: '🛸 طائرة درون (Drone View)', nameEn: 'Drone View' },
    { id: 'orbit', nameAr: '🔄 دوران 360 (Orbit)', nameEn: 'Orbit 360' },
    { id: 'fast_lateral', nameAr: '⚡ تتبع سريع (Fast Lateral)', nameEn: 'Fast Motion' },
  ];

  const sampleNanoBananaPrompts = [
    'غير خلفية الصورة إلى جبال الألب السويسرية المغطاة بالثلوج',
    'أضف سيارات طائرة وأضواء نيون أرجوانية في الخلفية',
    'حول الصورة لطراز أنيميشن عالي الدقة',
    'حسن وضوح الصورة واجعل الإضاءة سينمائية دافئة بدقة 4K',
  ];

  const sampleGrokVideoPrompts = [
    '🎬 مشهد طائرة درون تحلق ببطء فوق مدينة مستقبلية مغطاة بكتل النيون بدقة 8K',
    '🏎️ سيارة رياضية فائقة تنطلق عبر صحراء نيفادا بتصوير بطيء 120fps وفيزياء واقعية',
    '🌌 رائد فضاء يطفو خارج المحطة الدولية مع انعكاس السديم الملون على الخوذة',
    '🐉 تنين أسطوري مجنح ينفث اللهب بين السحاب في مشهد سينمائي خارق',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isArabic ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessMedia = async () => {
    const targetPrompt = activeTab === 'nano_banana_edit' ? editPrompt || 'تعديل احترافي للصورة' : prompt;
    if (!targetPrompt.trim() && activeTab !== 'nano_banana_edit') return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          engine: activeTab === 'video' ? 'video' : selectedEngine,
          editMode: activeTab === 'nano_banana_edit' ? editMode : undefined,
          sourceImage: activeTab === 'nano_banana_edit' ? sourceImage : undefined,
          prompt: targetPrompt,
          customEnhancedPrompt: activeEnhancedPrompt,
          negativePrompt: liveCinematicBuild.negativePrompt,
          directorOptions: {
            shotType,
            cameraMotion: directorCameraMotion,
            lens,
            lighting,
            colorGrade,
            negativePrompt: liveCinematicBuild.negativePrompt,
            isMultiShot,
          },
          style,
          aspectRatio,
          durationSeconds,
          cameraMotion,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'خطأ أثناء المعالجة بواسطة محرك الوسائط');
      }

      const newItem: GeneratedMediaItem = {
        id: 'media-' + Date.now(),
        type: activeTab,
        prompt: targetPrompt,
        enhancedPrompt: data.enhancedPrompt || activeEnhancedPrompt,
        negativePrompt: data.negativePrompt || liveCinematicBuild.negativePrompt,
        mediaUrl: data.mediaUrl,
        posterUrl: data.posterUrl,
        sourceImage: sourceImage || undefined,
        editMode: data.editMode || editMode,
        style: data.style || style,
        aspectRatio: data.aspectRatio || aspectRatio,
        durationSeconds: data.durationSeconds || durationSeconds,
        cameraMotion: data.cameraMotion || cameraMotion,
        createdAt: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setCurrentResult(newItem);
      setMediaHistory((prev) => [newItem, ...prev]);

      const ext = activeTab === 'video' ? 'mp4' : 'png';
      saveLocalFile(`media_${activeTab}_${Date.now()}.${ext}`, data.mediaUrl || targetPrompt);

      if (activeTab === 'video') {
        setIsPlayingVideo(true);
      }
    } catch (e: any) {
      alert(isArabic ? `فشل محرك الوسائط: ${e.message}` : `Media Engine failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendResultToChat = (item: GeneratedMediaItem) => {
    if (onSendToChat) {
      const text =
        item.type === 'video'
          ? `📹 تم إنشاء فيديو سينمائي بمستوى هوليوود 8K:\n"${item.prompt}"\n\n🎬 **البرومبت السينمائي المحسن**:\n\`${item.enhancedPrompt || item.prompt}\``
          : item.type === 'nano_banana_edit'
          ? `🎨 تم تعديل الصورة بنجاح عبر محرك المعالجة الذكي ⚡ (وضع: ${item.editMode || 'تعديل حر'}):\n"${item.prompt}"`
          : `🎨 تم توليد صورة سينمائية فائقة الجودة 8K ⚡:\n"${item.prompt}"`;
      onSendToChat(text, item.mediaUrl);
      onClose();
    }
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-amber-200 shadow-inner flex items-center justify-center">
              <Clapperboard className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-wide flex items-center gap-1.5">
                  <span>
                    {isArabic
                      ? 'استوديو توليد وتعديل الصور والفيديوهات السينمائي (Hollywood-Grade AI Studio) 🎬🎨'
                      : 'Hollywood AI Image & Video Studio 🎬🎨'}
                  </span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow-xs">
                  HOLLYWOOD CINEMA
                </span>
              </div>
              <p className="text-xs text-amber-100 opacity-95">
                {isArabic
                  ? 'محرك هندسة البرومبت السينمائي الفائق (Cinematic Prompt Engineer) لإنتاج مشاهد فوتوغرافية وفيديوهات 8K بمستوى إخراج هوليوود 2026'
                  : 'Cinematic Prompt Engineer Engine for 8K Hollywood-grade image & video synthesis'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 theme-scrollbar">
          {/* Main Mode Selector Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-inner">
              <button
                onClick={() => setActiveTab('nano_banana_edit')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'nano_banana_edit'
                    ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>{isArabic ? 'تعديل الصور' : 'Image Editor'}</span>
              </button>

              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'image'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isArabic ? 'توليد صور سينمائية' : 'Cinematic Photos'}</span>
              </button>

              <button
                onClick={() => setActiveTab('video')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'video'
                    ? 'bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-cyan-300" />
                <span>{isArabic ? 'فيديو سينمائي 🎬' : 'Hollywood Video 🎬'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls & Inputs */}
            <div className="lg:col-span-7 space-y-5 bg-slate-50/80 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {/* Image Processing Engine Selector */}
              {activeTab !== 'video' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? 'تحديد محرك معالجة الصور (Image Processing Engine):' : 'Select Image Processing Engine:'}</span>
                    </label>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                      {imageEngineOptions.find((e) => e.id === selectedEngine)?.badge || 'الافتراضي ⭐'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {imageEngineOptions.map((eng) => {
                      const isSelected = selectedEngine === eng.id;
                      return (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setSelectedEngine(eng.id)}
                          className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-xs ring-1 ring-amber-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold flex items-center gap-1">
                              {isArabic ? eng.nameAr : eng.nameEn}
                            </span>
                            {eng.isDefault && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                                {isArabic ? 'الرئيسي' : 'PRIMARY'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] opacity-80 font-normal leading-tight">
                            {isArabic ? eng.descAr : eng.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. NANO BANANA EDIT TAB CONTROLS */}
              {activeTab === 'nano_banana_edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                        <span>{isArabic ? 'الصورة المراد تعديلها (Upload Image):' : 'Source Photo to Edit:'}</span>
                      </span>
                      {sourceImage && (
                        <button
                          onClick={() => setSourceImage(null)}
                          className="text-[11px] text-rose-500 hover:underline font-semibold"
                        >
                          {isArabic ? 'إزالة الصورة' : 'Remove'}
                        </button>
                      )}
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {sourceImage ? (
                      <div className="relative group rounded-2xl border-2 border-dashed border-amber-500/50 bg-slate-900/60 p-2 overflow-hidden flex items-center justify-center">
                        <img
                          src={sourceImage}
                          alt="Source To Edit"
                          className="max-h-48 rounded-xl object-contain shadow-lg"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{isArabic ? 'تغيير الصورة' : 'Change Image'}</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-white dark:bg-slate-900 transition space-y-2 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isArabic ? 'اضغط هنا لرفع الصورة من جهازك' : 'Click to upload image'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isArabic ? 'يدعم صيغ PNG, JPG, WEBP حتى 15 ميجابايت' : 'Supports PNG, JPG, WEBP up to 15MB'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preset Edit Modes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isArabic ? 'وضع تعديل الصورة (Preset Mode):' : 'Edit Mode Preset:'}</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                      {nanoBananaPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setEditMode(preset.id)}
                          className={`p-2.5 rounded-xl text-right border transition text-xs flex flex-col justify-between ${
                            editMode === preset.id
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            {isArabic ? preset.nameAr : preset.nameEn}
                          </span>
                          <span className="text-[10px] opacity-75 font-normal mt-0.5">
                            {isArabic ? preset.descAr : preset.descEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Text Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isArabic ? 'أوامر وتعليمات التعديل النصية (Text Instructions):' : 'Custom Edit Instructions:'}
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => {
                        setEditPrompt(e.target.value);
                        setCustomEnhancedPrompt('');
                      }}
                      placeholder={
                        isArabic
                          ? 'اكتب التعديلات المطلوبة (مثال: غير لون الملابس، أضف خلفية بركانية سينمائية، حول ملامح الوجه...)'
                          : 'Describe instructions (e.g. swap background to snowy mountains, add cyberpunk lights...)'
                      }
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition resize-none"
                    />

                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {sampleNanoBananaPrompts.map((sample, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setEditPrompt(sample);
                              setCustomEnhancedPrompt('');
                            }}
                            className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition truncate max-w-xs"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. IMAGE GENERATION TAB CONTROLS */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>{isArabic ? 'وصف الصورة المطلوبة (Prompt):' : 'Detailed Image Prompt:'}</span>
                      <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 font-mono">
                        8K Hollywood UHD
                      </span>
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setCustomEnhancedPrompt('');
                      }}
                      placeholder={
                        isArabic
                          ? 'اكتب وصفاً دقيقاً للصورة (مثال: رجل يمشي ببطء في الشارع ليلاً تحيط به أضواء نيون زرقاء...)'
                          : 'Describe the image scene in detail...'
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isArabic ? 'النمط الفني والبصري (Style):' : 'Visual Art Style:'}</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {styleOptions.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setStyle(st.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition ${
                            style === st.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isArabic ? st.nameAr : st.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. VIDEO GENERATION TAB CONTROLS */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-cyan-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-sm shadow-md">
                      🎬
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-cyan-900 dark:text-cyan-200">
                        {isArabic ? 'محرك توليد الفيديو السينمائي الفائق (Hollywood Video Engine)' : 'Hollywood Cinematic Video Engine'}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {isArabic ? 'إنتاج مقاطع 8K مع حركة كاميرا حية، فيزياء حركية، وتناسق إضاءة زمنية' : '8K motion physics, live camera dynamics & 60fps fluid cinema rendering'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {isArabic ? 'وصف المشهد الفيديوي (Video Scene Prompt):' : 'Video Prompt:'}
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setCustomEnhancedPrompt('');
                      }}
                      placeholder={
                        isArabic
                          ? 'اكتب وصفاً حركياً سينمائياً (مثال: طائرة درون تحلق ببطء فوق مدينة مستقبلية بأضواء نيون بدقة 8K...)'
                          : 'Describe the cinematic video scene...'
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none transition resize-none"
                    />

                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {isArabic ? '💡 نماذج سريعة للمشاهد:' : '💡 Cinema Prompts:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sampleGrokVideoPrompts.map((sample, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setPrompt(sample);
                              setCustomEnhancedPrompt('');
                            }}
                            className="text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition truncate max-w-xs text-right"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🎬 HOLLYWOOD DIRECTOR MODE (Cinematic Prompt Engineer Controls) */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>{isArabic ? 'وضع المخرج السينمائي (Hollywood Director Mode)' : 'Hollywood Director Mode'}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-black">
                          2026
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {isArabic
                          ? 'تحكم بدقة الكاميرا، نوع اللقطة، العدسة، الإضاءة، والتلوين السينمائي'
                          : 'Fine-tune Shot Type, Lens, Lighting, Color Grade & Negative Prompts'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDirectorMode(!isDirectorMode)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/30 transition flex items-center gap-1"
                  >
                    <span>{isDirectorMode ? (isArabic ? 'إخفاء الإعدادات' : 'Hide Controls') : (isArabic ? 'عرض وضع المخرج' : 'Show Controls')}</span>
                  </button>
                </div>

                {isDirectorMode && (
                  <div className="space-y-3 animate-fadeIn text-xs">
                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Shot Type */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isArabic ? 'نوع اللقطة وزاوية الكاميرا:' : 'Shot Type & Angle:'}</span>
                        </label>
                        <select
                          value={shotType}
                          onChange={(e) => setShotType(e.target.value as ShotType)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(SHOT_TYPE_MAP).map(([key, val]) => (
                            <option key={key} value={key}>
                              {isArabic ? val.ar : val.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Camera Motion */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Film className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isArabic ? 'حركة الكاميرا السينمائية:' : 'Camera Motion:'}</span>
                        </label>
                        <select
                          value={directorCameraMotion}
                          onChange={(e) => setDirectorCameraMotion(e.target.value as DirectorCameraMotion)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(CAMERA_MOTION_MAP).map(([key, val]) => (
                            <option key={key} value={key}>
                              {isArabic ? val.ar : val.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Lens & Optics */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isArabic ? 'العدسة والتصوير (Optics & Bokeh):' : 'Lens & Optics:'}</span>
                        </label>
                        <select
                          value={lens}
                          onChange={(e) => setLens(e.target.value as LensType)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(LENS_MAP).map(([key, val]) => (
                            <option key={key} value={key}>
                              {isArabic ? val.ar : val.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Lighting */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{isArabic ? 'الإضاءة السينمائية (Lighting):' : 'Cinematic Lighting:'}</span>
                        </label>
                        <select
                          value={lighting}
                          onChange={(e) => setLighting(e.target.value as LightingType)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(LIGHTING_MAP).map(([key, val]) => (
                            <option key={key} value={key}>
                              {isArabic ? val.ar : val.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Color Grade */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Contrast className="w-3.5 h-3.5 text-teal-400" />
                          <span>{isArabic ? 'التلوين والمزاج (Color Grading):' : 'Color Grading & Mood:'}</span>
                        </label>
                        <select
                          value={colorGrade}
                          onChange={(e) => setColorGrade(e.target.value as ColorGrade)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {Object.entries(COLOR_GRADE_MAP).map(([key, val]) => (
                            <option key={key} value={key}>
                              {isArabic ? val.ar : val.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Aspect Ratio */}
                      <div>
                        <label className="block text-[11px] font-bold text-amber-200/90 mb-1 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{isArabic ? 'نسبة الأبعاد السينمائية (Aspect Ratio):' : 'Aspect Ratio:'}</span>
                        </label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-amber-400"
                        >
                          {aspectRatios.map((ar) => (
                            <option key={ar.id} value={ar.id}>
                              {ar.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    <div>
                      <label className="block text-[11px] font-bold text-rose-300 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        <span>{isArabic ? 'البرومبت السلبي المستبعد (Negative Prompts):' : 'Negative Prompts Filter:'}</span>
                      </label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="blurry, low quality, extra limbs, watermark..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-rose-900/50 text-slate-200 text-xs focus:ring-1 focus:ring-rose-400"
                      />
                    </div>

                    {/* Multi-Shot Shot List Option */}
                    {activeTab === 'video' && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="multiShotToggle"
                            checked={isMultiShot}
                            onChange={(e) => setIsMultiShot(e.target.checked)}
                            className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                          />
                          <label htmlFor="multiShotToggle" className="text-xs font-bold text-amber-200 cursor-pointer">
                            {isArabic ? 'تفعيل سلسلة لقطات متصلة (3-Shot List Sequence)' : 'Enable 3-Shot Sequence (Shot Chaining)'}
                          </label>
                        </div>
                        {isMultiShot && (
                          <span className="text-[10px] bg-cyan-900/80 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/40 font-mono">
                            3 Shots Chained 🎬
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ⚡ LIVE HOLLYWOOD CINEMATIC PROMPT PREVIEW BOX */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 text-slate-100 border border-amber-500/30 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isArabic ? 'معاينة البرومبت السينمائي المحسّن (Live Cinematic Prompt Preview):' : 'Enhanced Prompt Preview:'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingEnhancedPrompt) {
                        setCustomEnhancedPrompt(activeEnhancedPrompt);
                      }
                      setIsEditingEnhancedPrompt(!isEditingEnhancedPrompt);
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingEnhancedPrompt ? (isArabic ? 'اعتماد البرومبت' : 'Apply Prompt') : (isArabic ? 'تعديل يدوي' : 'Edit Manually')}</span>
                  </button>
                </div>

                {isEditingEnhancedPrompt ? (
                  <textarea
                    value={customEnhancedPrompt || activeEnhancedPrompt}
                    onChange={(e) => setCustomEnhancedPrompt(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-amber-400 text-amber-100 font-mono text-[11px] focus:outline-none"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-100/90 font-mono text-[11px] leading-relaxed break-words space-y-1">
                    <p>{activeEnhancedPrompt}</p>
                    <p className="text-[10px] text-rose-400/90 font-sans border-t border-slate-800/80 pt-1">
                      🚫 Negative Filter: {liveCinematicBuild.negativePrompt}
                    </p>
                  </div>
                )}

                {/* Display Active Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    🎬 {SHOT_TYPE_MAP[shotType]?.ar || 'لقطة متوسطة'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                    🎥 {CAMERA_MOTION_MAP[directorCameraMotion]?.ar || 'تقريب هادئ'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    👁️ {LENS_MAP[lens]?.ar || 'عدسة 35mm'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30">
                    ⚡ {LIGHTING_MAP[lighting]?.ar || 'إضاءة حجمية'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    🎨 {COLOR_GRADE_MAP[colorGrade]?.ar || 'تلوين هوليوود'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                    📐 {aspectRatio}
                  </span>
                </div>

                {/* Multi Shot List Display */}
                {isMultiShot && shotList.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <List className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'قائمة اللقطات السينمائية المتصلة (Shot List Chaining):' : 'Multi-Shot Sequence Shot List:'}</span>
                    </span>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      {shotList.map((shot) => (
                        <div key={shot.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          <span className="text-amber-300 font-bold block">{shot.id}. {shot.shotName}</span>
                          <span className="opacity-80 block truncate">{shot.enhancedPrompt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Duration & FPS Selector for Video */}
              {activeTab === 'video' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isArabic ? 'مدة الفيديو السينمائي:' : 'Duration:'}</span>
                    </label>
                    <select
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value={3}>3 {isArabic ? 'ثوانٍ (مشهد سريع)' : 'Seconds (Quick)'}</option>
                      <option value={5}>5 {isArabic ? 'ثوانٍ (مشهد سينمائي)' : 'Seconds (Cinema)'}</option>
                      <option value={8}>8 {isArabic ? 'ثوانٍ (8K IMAX)' : 'Seconds (IMAX 8K)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-teal-500" />
                      <span>{isArabic ? 'دقة ومعدل الإطارات:' : 'Quality & FPS:'}</span>
                    </label>
                    <div className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 text-xs font-bold flex items-center justify-between">
                      <span>8K IMAX</span>
                      <span className="text-[10px] bg-cyan-600 text-slate-950 px-1.5 py-0.5 rounded-md font-black">60 FPS</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Main Button */}
              <button
                onClick={handleProcessMedia}
                disabled={isGenerating || (activeTab !== 'nano_banana_edit' && !prompt.trim())}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2.5 transition-all transform active:scale-98 ${
                  isGenerating || (activeTab !== 'nano_banana_edit' && !prompt.trim())
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                    : activeTab === 'nano_banana_edit'
                    ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:brightness-110 shadow-amber-500/25'
                    : activeTab === 'image'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:brightness-110 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:brightness-110 shadow-cyan-500/25'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>
                      {isArabic
                        ? activeTab === 'nano_banana_edit'
                          ? 'جاري معالجة الصورة عبر محرك الذكاء الاصطناعي ⚡...'
                          : activeTab === 'video'
                          ? 'جاري توليد الفيديو السينمائي هوليوود ⚡...'
                          : 'جاري توليد الصورة بمستوى هوليوود 🎨...'
                        : activeTab === 'video'
                        ? 'Rendering Hollywood Video ⚡...'
                        : 'Processing Image...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-5 h-5 text-amber-200" />
                    <span>
                      {isArabic
                        ? activeTab === 'nano_banana_edit'
                          ? 'تطبيق التعديلات الآن ⚡'
                          : activeTab === 'image'
                          ? 'توليد الصورة السينمائية الآن 🎨'
                          : 'صناعة الفيديو السينمائي الآن ⚡'
                        : activeTab === 'nano_banana_edit'
                        ? 'Apply Edit ⚡'
                        : activeTab === 'video'
                        ? 'Generate Hollywood Video ⚡'
                        : 'Generate AI Media'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Result & Preview Display */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className="flex-1 min-h-[380px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner p-3">
                {isGenerating ? (
                  <div className="text-center p-8 space-y-4">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
                      <Sparkles className="w-8 h-8 animate-spin-slow" />
                    </div>
                    <p className="text-sm font-semibold text-amber-200">
                      {isArabic
                        ? activeTab === 'nano_banana_edit'
                          ? 'جاري تطبيق خوارزمية تعديل وتحسين الصورة السينمائية...'
                          : 'جاري تطبيق هندسة البرومبت السينمائي وتوليد الإطارات بدقة 8K...'
                        : 'Rendering Hollywood grade cinematic media...'}
                    </p>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-amber-400 animate-pulse w-3/4 rounded-full"></div>
                    </div>
                  </div>
                ) : currentResult ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {currentResult.type === 'video' ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center rounded-xl overflow-hidden group">
                        <canvas
                          ref={canvasRef}
                          className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs">
                          <button
                            onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                            className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 transition text-white shadow-md"
                          >
                            {isPlayingVideo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <div className="flex-1 mx-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-100"
                              style={{ width: `${videoProgress * 100}%` }}
                            />
                          </div>

                          <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                            Hollywood Video ⚡ | {currentResult.durationSeconds || 5}s | 8K 60FPS
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-2 group">
                        <img
                          src={currentResult.mediaUrl}
                          alt={currentResult.prompt}
                          referrerPolicy="no-referrer"
                          className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl"
                        />
                        <div className="mt-2 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                            <span>⚡ Hollywood 8K Cinema</span>
                            <span>•</span>
                            <span>{currentResult.editMode || 'معدل بامتياز'}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-3 text-slate-500">
                    <Clapperboard className="w-12 h-12 mx-auto opacity-30 text-amber-400" />
                    <p className="text-xs font-medium text-slate-400">
                      {isArabic
                        ? 'اكتب طلبك واضبط إعدادات المخرج، وسيقوم المحرك بتوليد النتيجة السينمائية هنا'
                        : 'Enter your prompt and click generate to preview Hollywood cinematic results'}
                    </p>
                  </div>
                )}
              </div>

              {/* Result Toolbar Action Buttons */}
              {currentResult && (
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={currentResult.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`cinema_${currentResult.type}_${Date.now()}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'تحميل PNG' : 'Download PNG'}</span>
                    </a>

                    <button
                      onClick={() => handleCopyText(currentResult.enhancedPrompt || currentResult.prompt, currentResult.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 transition"
                    >
                      {copiedId === currentResult.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'نسخ البرومبت المحسن' : 'Copy Enhanced Prompt'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {onSendToChat && (
                    <button
                      onClick={() => handleSendResultToChat(currentResult)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:brightness-110 transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'إرسال إلى المحادثة' : 'Send to Chat'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* History Gallery */}
              {mediaHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>{isArabic ? 'معرض المشاهد والإنتاجات السينمائية:' : 'History Gallery:'}</span>
                    <span className="text-[11px] font-normal text-slate-500">{mediaHistory.length} {isArabic ? 'عنصر' : 'items'}</span>
                  </h4>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {mediaHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setCurrentResult(item);
                          if (item.type === 'video') setIsPlayingVideo(true);
                        }}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition transform hover:scale-105 group ${
                          currentResult?.id === item.id ? 'border-amber-500 shadow-md' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <img
                          src={item.posterUrl || item.mediaUrl}
                          alt={item.prompt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white">
                            <Video className="w-3 h-3 text-cyan-400" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="absolute bottom-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
