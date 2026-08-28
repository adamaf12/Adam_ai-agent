import React, { useState, useMemo } from 'react';
import { X, Palette, CheckCircle2, Sparkles, Search, SlidersHorizontal, Volume2 } from 'lucide-react';
import { AppTheme } from '../types';
import { playAlertSound } from '../lib/alertFeedback';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  isArabic: boolean;
}

export interface ThemeOption {
  id: AppTheme;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  bgGradient: string;
  cardPreviewBg: string;
  accentBadge: string;
  accentBorder: string;
  tag: string;
  category: 'cyber' | 'luxury' | 'nature' | 'minimal' | 'executive';
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    nameAr: 'العقيق الزمردي القيادي (Emerald Obsidian)',
    nameEn: 'Emerald Obsidian Dark',
    descriptionAr: 'المظهر القيادي الداكن الافتراضي بلمسات الزمرد اللامعة المريحة للعين',
    descriptionEn: 'Sleek executive obsidian canvas with glowing emerald accents',
    bgGradient: 'from-slate-950 via-slate-900 to-emerald-950',
    cardPreviewBg: 'bg-slate-900 border-emerald-500/40 text-emerald-400',
    accentBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accentBorder: 'border-emerald-500',
    tag: 'افتراضي القيادة 💎',
    category: 'executive',
  },
  {
    id: 'emerald_quantum',
    nameAr: 'الكمومي الزمردي المتأين (Quantum Ionized Emerald)',
    nameEn: 'Quantum Ionized Emerald',
    descriptionAr: 'أخضر زمردي كمومي فائق التوهج مع إضاءات ليزرية تمنح شعور المعامل المستقبلية',
    descriptionEn: 'High-tech ionized quantum glowing green with hyper-modern lab aesthetic',
    bgGradient: 'from-slate-950 via-emerald-950 to-teal-950',
    cardPreviewBg: 'bg-emerald-950/80 border-emerald-400/80 text-teal-200 font-mono',
    accentBadge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    accentBorder: 'border-emerald-400',
    tag: 'كمومي زمردي 🧪',
    category: 'cyber',
  },
  {
    id: 'cyber_neon_tokyo',
    nameAr: 'طوكيو سايبر نيون (Electric Cyber Tokyo)',
    nameEn: 'Electric Cyber Tokyo Cyan & Magenta',
    descriptionAr: 'طاقة ليلية كهربائية مستوحاة من أضواء شينجوكو مع تباين صارخ بين الفوشيا والسماوي المتأين',
    descriptionEn: 'Electric Shinjuku night aesthetic with pulsing cyber magenta and cyan ion glow',
    bgGradient: 'from-purple-950 via-indigo-950 to-pink-950',
    cardPreviewBg: 'bg-purple-950/90 border-pink-500/80 text-cyan-300 font-mono',
    accentBadge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    accentBorder: 'border-pink-500',
    tag: 'طوكيو نيون 🗼',
    category: 'cyber',
  },
  {
    id: 'midnight_ocean',
    nameAr: 'محيط منتصف الليل السحيق (Deep Midnight Ocean)',
    nameEn: 'Deep Midnight Ocean',
    descriptionAr: 'أعماق المحيط الهادئة مع لمسات متوهجة باللون الأكوا المائي والأزرق المارينا المهدئ للأعصاب',
    descriptionEn: 'Tranquil abyssal ocean depths with luminescent aqua marine highlights',
    bgGradient: 'from-slate-950 via-blue-950 to-cyan-950',
    cardPreviewBg: 'bg-blue-950/90 border-cyan-400/80 text-cyan-300',
    accentBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    accentBorder: 'border-cyan-400',
    tag: 'محيط عميق 🌊',
    category: 'nature',
  },
  {
    id: 'luxury_gold',
    nameAr: 'الذهبي الإمبراطوري (Imperial Luxury Gold)',
    nameEn: 'Imperial Gold & Onyx',
    descriptionAr: 'فخامة سوداء فاخرة مطعّمة بالذهب الخالص والبرونز الإمبراطوري',
    descriptionEn: 'Ultra-luxurious obsidian canvas with pure metallic gold highlights',
    bgGradient: 'from-stone-950 via-neutral-950 to-amber-950',
    cardPreviewBg: 'bg-neutral-900 border-yellow-500/60 text-yellow-300',
    accentBadge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    accentBorder: 'border-yellow-500',
    tag: 'ذهب إمبراطوري 🏆',
    category: 'luxury',
  },
  {
    id: 'solar_flare_gold',
    nameAr: 'التوهج الشمسي البركاني (Solar Flare Gold)',
    nameEn: 'Solar Flare Gold & Amber',
    descriptionAr: 'انفجار ناري دافئ من الذهب والشمس الملتهبة مع خلفيات بركانية غنية وعميقة',
    descriptionEn: 'Fiery gold solar explosion with deep obsidian volcanic background',
    bgGradient: 'from-stone-950 via-amber-950 to-orange-950',
    cardPreviewBg: 'bg-stone-900 border-amber-500/80 text-amber-300',
    accentBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    accentBorder: 'border-amber-500',
    tag: 'توهج شمسي ☀️',
    category: 'luxury',
  },
  {
    id: 'dracula_vampire',
    nameAr: 'دراكولا فيوليت الأسطوري (Dracula Mythic Violet)',
    nameEn: 'Mythic Dracula Violet & Blood Orange',
    descriptionAr: 'غموض ملكي أنيق بدرجات البنفسجي المخملي الفاخر وتطعيمات برتقالية دافئة ساحرة',
    descriptionEn: 'Elegant nocturnal velvet purple with mythic crimson & blood orange highlights',
    bgGradient: 'from-black via-purple-950 to-stone-950',
    cardPreviewBg: 'bg-purple-950/90 border-purple-400/80 text-pink-300',
    accentBadge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    accentBorder: 'border-purple-500',
    tag: 'دراكولا ملكي 🦇',
    category: 'luxury',
  },
  {
    id: 'rose_gold_luxury',
    nameAr: 'الذهب الوردي والكوارتز (Rose Gold & Quartz Luxury)',
    nameEn: 'Rose Gold & Quartz Luxury',
    descriptionAr: 'نعومة راقية تجمع بين الذهب الوردي الفاخر والكوارتز البلوري النقي',
    descriptionEn: 'Refined rose gold elegance framed by pure crystal quartz accents',
    bgGradient: 'from-stone-950 via-rose-950 to-pink-950',
    cardPreviewBg: 'bg-rose-950/80 border-rose-400/80 text-rose-200',
    accentBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    accentBorder: 'border-rose-400',
    tag: 'ذهب وردي 🌸',
    category: 'luxury',
  },
  {
    id: 'carbon_fiber_stealth',
    nameAr: 'الكاربون فايبر التكتيكي (Tactical Carbon Stealth)',
    nameEn: 'Tactical Carbon Stealth & Blaze Orange',
    descriptionAr: 'مظهر تكتيكي رياضي أسود كربوني مع خطوط إرشادية برتقالية مشعة مستوحاة من سيارات السباق',
    descriptionEn: 'Motorsport-grade matte carbon fiber weave with blazing hazard orange accents',
    bgGradient: 'from-black via-zinc-950 to-stone-950',
    cardPreviewBg: 'bg-zinc-900 border-orange-500/80 text-orange-300 font-mono',
    accentBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    accentBorder: 'border-orange-500',
    tag: 'كاربون تكتيكي 🏎️',
    category: 'cyber',
  },
  {
    id: 'monochrome_minimalist',
    nameAr: 'المونوكروم البسيط الفائق (Pure Monochrome OLED)',
    nameEn: 'Pure Monochrome OLED High Contrast',
    descriptionAr: 'أقصى درجات التباين والوضوح باللونين الأبيض والأسود النقي لشاشات OLED وتوفير الطاقة',
    descriptionEn: 'Absolute zero pure black with razor-sharp white precision for maximum OLED clarity',
    bgGradient: 'from-black via-black to-zinc-950',
    cardPreviewBg: 'bg-zinc-900 border-white/80 text-white font-mono',
    accentBadge: 'bg-white/20 text-white border-white/40',
    accentBorder: 'border-white',
    tag: 'مونوكروم فائق ⚪',
    category: 'minimal',
  },
  {
    id: 'nordic_forest',
    nameAr: 'غابة الصنوبر الاسكندنافية (Nordic Pine Forest)',
    nameEn: 'Nordic Pine Forest & Natural Moss',
    descriptionAr: 'طبيعة جبلية ساحرة بدرجات الأخضر الزمردي الغابي والرمادي الصخري العضوي',
    descriptionEn: 'Serene mountain pine forest with organic moss green and alpine stone grey',
    bgGradient: 'from-slate-950 via-emerald-950 to-teal-950',
    cardPreviewBg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200',
    accentBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    accentBorder: 'border-emerald-500',
    tag: 'طبيعة هادئة 🌲',
    category: 'nature',
  },
  {
    id: 'cyberpunk',
    nameAr: 'سايبر بانك نيون (Cyberpunk Neon Gold & Violet)',
    nameEn: 'Cyberpunk Neon',
    descriptionAr: 'مظهر مستقبلي جريء باللون البنفسجي والذهب النيون لمحبّي التقنية الفائقة',
    descriptionEn: 'Futuristic electric violet & yellow neon high-tech theme',
    bgGradient: 'from-purple-950 via-slate-950 to-indigo-950',
    cardPreviewBg: 'bg-purple-950/80 border-amber-400/60 text-amber-300',
    accentBadge: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    accentBorder: 'border-amber-400',
    tag: 'تقنية فائقة ⚡',
    category: 'cyber',
  },
  {
    id: 'sapphire',
    nameAr: 'الملكي السفير الأزرق (Royal Sapphire Blue)',
    nameEn: 'Royal Sapphire',
    descriptionAr: 'أزرق ياقوتي ملكي مع إضاءات معدنية زرقاء تبعث على الثقة والهدوء',
    descriptionEn: 'Deep royal sapphire & metallic azure for premium focus',
    bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
    cardPreviewBg: 'bg-blue-950/80 border-blue-400/60 text-blue-300',
    accentBadge: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    accentBorder: 'border-blue-500',
    tag: 'ملكي فاخر 💎',
    category: 'luxury',
  },
  {
    id: 'sunset',
    nameAr: 'غروب الشمس الذهبي (Amber Sunset & Crimson)',
    nameEn: 'Amber Sunset',
    descriptionAr: 'ألوان دافئة مستوحاة من الشفق القطبي وغروب الشمس بخلفيات قرمزية دافئة',
    descriptionEn: 'Warm crimson background with glowing amber & ruby accents',
    bgGradient: 'from-slate-950 via-rose-950 to-amber-950',
    cardPreviewBg: 'bg-rose-950/80 border-orange-500/60 text-amber-300',
    accentBadge: 'bg-rose-500/20 text-orange-300 border-orange-400/40',
    accentBorder: 'border-rose-500',
    tag: 'شفق دافئ 🌅',
    category: 'nature',
  },
  {
    id: 'espresso',
    nameAr: 'القهوة والكراميل الدافئ (Warm Espresso)',
    nameEn: 'Warm Espresso & Caramel',
    descriptionAr: 'ألوان القهوة المحمصة والكراميل الدافئ لمظهر مريح للعين أثناء جلسات العمل الطويلة',
    descriptionEn: 'Rich roasted espresso & warm caramel accents for comfortable viewing',
    bgGradient: 'from-stone-950 via-amber-950 to-stone-900',
    cardPreviewBg: 'bg-stone-900 border-amber-600/60 text-amber-200',
    accentBadge: 'bg-amber-600/20 text-amber-200 border-amber-500/40',
    accentBorder: 'border-amber-600',
    tag: 'قهوة دافئة ☕',
    category: 'executive',
  },
  {
    id: 'matrix_hologram',
    nameAr: 'ماتريكس الهولوغرام التقني (Matrix Cyber Green)',
    nameEn: 'Matrix Cyber Hologram',
    descriptionAr: 'مظهر الماتريكس الرقمي الأخضر المتوهج المستقبلي مع لمسات كود الهولوغرام',
    descriptionEn: 'Glow matrix cyber green theme with holographic digital code styling',
    bgGradient: 'from-black via-zinc-950 to-emerald-950',
    cardPreviewBg: 'bg-black border-emerald-400/80 text-emerald-400 font-mono',
    accentBadge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/50',
    accentBorder: 'border-emerald-400',
    tag: 'هولوغرام رقمي 💚',
    category: 'cyber',
  },
  {
    id: 'nordic_aurora',
    nameAr: 'الشفق القطبي الاسكندنافي (Nordic Aurora Boreal)',
    nameEn: 'Nordic Aurora Boreal',
    descriptionAr: 'مستوحى من الشفق القطبي الشمالي بألوان الفيروزي والأرجواني المتوهج',
    descriptionEn: 'Breathtaking Northern Lights palette with electric cyan and magenta auroras',
    bgGradient: 'from-slate-950 via-teal-950 to-fuchsia-950',
    cardPreviewBg: 'bg-slate-950 border-cyan-400/70 text-fuchsia-300',
    accentBadge: 'bg-cyan-500/20 text-cyan-300 border-fuchsia-400/40',
    accentBorder: 'border-cyan-400',
    tag: 'شفق قطبي 🌌',
    category: 'nature',
  },
  {
    id: 'deep_space',
    nameAr: 'سديم الفضاء السحيق (Deep Cosmic Nebula)',
    nameEn: 'Deep Cosmic Nebula',
    descriptionAr: 'خلفية الفضاء الكوني مع غبار النجوم الأرجواني والأزرق الفلكي',
    descriptionEn: 'Galactic deep space layout infused with cosmic dust & indigo nebulae',
    bgGradient: 'from-black via-indigo-950 to-slate-950',
    cardPreviewBg: 'bg-indigo-950/80 border-indigo-400/70 text-indigo-200',
    accentBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    accentBorder: 'border-indigo-400',
    tag: 'فضاء سحيق 🪐',
    category: 'cyber',
  },
  {
    id: 'titanium_glass',
    nameAr: 'التيتانيوم الكريستالي الزجاجي (Frosted Titanium)',
    nameEn: 'Frosted Titanium Glass',
    descriptionAr: 'زجاج كريستالي مطفي بلون التيتانيوم العصري مع انعكاسات ثلجية فائقة',
    descriptionEn: 'Ultra-modern frosted titanium metallic glass layout with icy cyan borders',
    bgGradient: 'from-slate-900 via-zinc-900 to-cyan-950',
    cardPreviewBg: 'bg-slate-800/80 border-cyan-300/60 text-cyan-200 backdrop-blur-md',
    accentBadge: 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40',
    accentBorder: 'border-cyan-300',
    tag: 'زجاج تيتانيوم ❄️',
    category: 'minimal',
  },
  {
    id: 'glitch_matrix',
    nameAr: 'ماتريكس الجليتش السريالي (Surreal Glitch Matrix)',
    nameEn: 'Surreal Glitch Matrix',
    descriptionAr: 'ثيم خارج عن المألوف بمؤثرات تشويش بصرية رقمية بين الفيروزي والوردي النيون',
    descriptionEn: 'Avant-garde digital glitch aesthetics with electric cyan & neon hot pink',
    bgGradient: 'from-black via-zinc-950 to-pink-950',
    cardPreviewBg: 'bg-black/90 border-pink-500/70 text-cyan-300 font-mono',
    accentBadge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    accentBorder: 'border-pink-500',
    tag: 'جليتش سريالي ⚡',
    category: 'cyber',
  },
  {
    id: 'crimson_samurai',
    nameAr: 'الساموراي القرمزي (Crimson Samurai Onyx)',
    nameEn: 'Crimson Samurai Onyx',
    descriptionAr: 'تباين شرس وفخم بين الأسود القاتم والأحمر القرمزي المشتعل بلمسات يابانية عصرية',
    descriptionEn: 'Fierce luxury high-contrast deep onyx with blazing blood-crimson aura',
    bgGradient: 'from-zinc-950 via-red-950 to-stone-950',
    cardPreviewBg: 'bg-zinc-950/90 border-red-500/80 text-red-200',
    accentBadge: 'bg-red-500/20 text-red-300 border-red-500/40',
    accentBorder: 'border-red-500',
    tag: 'ساموراي أحمر ⚔️',
    category: 'luxury',
  },
  {
    id: 'synthwave_retro',
    nameAr: 'السينث ويف المستقبلي 1984 (Retro Synthwave 80s)',
    nameEn: 'Retro Synthwave 80s Sunset',
    descriptionAr: 'أجواء شمس الثمانينات النيونية بتدرجات الأرجواني الفاقع والبرتقالي الساحر',
    descriptionEn: 'Iconic retro 80s neon purple & electric sunset orange cyber grid vibes',
    bgGradient: 'from-purple-950 via-fuchsia-950 to-orange-950',
    cardPreviewBg: 'bg-purple-950/80 border-fuchsia-400/80 text-orange-200',
    accentBadge: 'bg-fuchsia-500/20 text-fuchsia-300 border-orange-400/40',
    accentBorder: 'border-fuchsia-400',
    tag: 'سينث ويف 🕶️',
    category: 'cyber',
  },
  {
    id: 'light',
    nameAr: 'الشمالي الألبيني النقي (Nordic Clean White)',
    nameEn: 'Nordic Clean Light',
    descriptionAr: 'مظهر فاتح ناصع وعصري للغاية مع تباطؤ بصري مريح للتركيز والقراءة',
    descriptionEn: 'Crisp Nordic white layout with high contrast typography',
    bgGradient: 'from-slate-100 via-white to-slate-200',
    cardPreviewBg: 'bg-white border-slate-300 text-slate-800 shadow-sm',
    accentBadge: 'bg-teal-100 text-teal-800 border-teal-300',
    accentBorder: 'border-teal-500',
    tag: 'فاتح نقي ❄️',
    category: 'minimal',
  },
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  isArabic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => [
    { id: 'all', labelAr: 'كافة الثيمات', labelEn: 'All Themes', count: THEME_OPTIONS.length },
    { id: 'cyber', labelAr: 'سايبر ومستقبلي ⚡', labelEn: 'Cyber & Neon', count: THEME_OPTIONS.filter((t) => t.category === 'cyber').length },
    { id: 'luxury', labelAr: 'فخامة وملكي 💎', labelEn: 'Luxury & Royal', count: THEME_OPTIONS.filter((t) => t.category === 'luxury').length },
    { id: 'nature', labelAr: 'طبيعي وشفق 🌿', labelEn: 'Nature & Aurora', count: THEME_OPTIONS.filter((t) => t.category === 'nature').length },
    { id: 'executive', labelAr: 'قيادي وداكن 👔', labelEn: 'Executive & Dark', count: THEME_OPTIONS.filter((t) => t.category === 'executive').length },
    { id: 'minimal', labelAr: 'بسيط ومونوكروم ⚪', labelEn: 'Minimal & Light', count: THEME_OPTIONS.filter((t) => t.category === 'minimal').length },
  ], []);

  const filteredThemes = useMemo(() => {
    return THEME_OPTIONS.filter((t) => {
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.nameAr.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.descriptionAr.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleSelectWithFeedback = (themeId: AppTheme) => {
    try {
      playAlertSound('crystal_bell', 0.4);
    } catch {}
    onSelectTheme(themeId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isArabic ? 'معرض الثيمات الفاخرة والمظاهر العالمية' : 'Luxury & Cyber Theme Universe'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/30">
                  {THEME_OPTIONS.length} {isArabic ? 'ثيماً متطوراً' : 'Pro Themes'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isArabic
                  ? 'اختر مظهرك المفضل من بين 20+ تصميماً فائق الدقة مع استجابة لحظية وألوان سينمائية'
                  : 'Select your preferred visual aesthetic with real-time feedback and cinema-grade palettes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'ابحث عن اسم الثيم، اللون، الطراز، أو الوسم...' : 'Search themes by name, mood or tag...'}
              className="w-full ps-10 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 theme-scrollbar">
          {filteredThemes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
              <p className="text-xs">{isArabic ? 'لم يتم العثور على ثيم يطابق بحثك' : 'No themes match your search query'}</p>
            </div>
          ) : (
            filteredThemes.map((themeItem) => {
              const isSelected = currentTheme === themeItem.id;

              return (
                <div
                  key={themeItem.id}
                  onClick={() => handleSelectWithFeedback(themeItem.id)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r ${themeItem.bgGradient} shadow-md relative overflow-hidden group hover:scale-[1.008] ${
                    isSelected ? `${themeItem.accentBorder} ring-2 ring-emerald-500/50` : 'border-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  {/* Information */}
                  <div className="space-y-1.5 z-10 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{isArabic ? themeItem.nameAr : themeItem.nameEn}</span>
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${themeItem.accentBadge}`}>
                        {themeItem.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isArabic ? themeItem.descriptionAr : themeItem.descriptionEn}
                    </p>
                  </div>

                  {/* Micro Preview Card & Selection Status */}
                  <div className="flex items-center justify-between md:justify-end gap-3 z-10 shrink-0">
                    <div className={`px-3 py-2 rounded-xl border text-[11px] font-mono flex items-center gap-2 ${themeItem.cardPreviewBg}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'معاينة الواجهة' : 'UI Preview'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 animate-pulse">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isArabic ? 'نشط الآن' : 'Active'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 cursor-pointer"
                        >
                          {isArabic ? 'تطبيق الثيم' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'يتم حفظ مظهرك المختار تلقائياً في ذاكرة جهازك فوراً' : 'Selected theme is auto-saved locally in real-time'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
