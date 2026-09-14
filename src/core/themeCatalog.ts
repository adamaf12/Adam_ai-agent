import type { Theme } from './domain';

export type ThemeCatalogItem = {
  id: Theme;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  tone: Theme;
  badge?: { ar: string; en: string };
};

export const THEME_CATALOG: readonly ThemeCatalogItem[] = [
  {
    id: 'system',
    label: { ar: 'تلقائي النظام', en: 'System Default' },
    description: { ar: 'يتزامن تلقائيًا مع مظهر نظام جهازك.', en: 'Matches your OS appearance automatically.' },
    tone: 'system',
  },
  {
    id: 'dark',
    label: { ar: 'نيون داكن (الافتراضي)', en: 'Emerald Dark (Default)' },
    description: { ar: 'أسود فحمي مع لمسات زمردية أنيقة وتوهج عصري.', en: 'Deep carbon black with vibrant emerald accents.' },
    tone: 'dark',
    badge: { ar: 'الافتراضي', en: 'Default' },
  },
  {
    id: 'midnight',
    label: { ar: 'سواد منتصف الليل OLED', en: 'Midnight OLED' },
    description: { ar: 'سواد نقي وموفر للطاقة مريح جداً للعين.', en: 'True pitch OLED black with minimal titanium gray.' },
    tone: 'midnight',
    badge: { ar: 'OLED نقي', en: 'Pure OLED' },
  },
  {
    id: 'light',
    label: { ar: 'أبيض ناصع ونقي', en: 'Pure Crisp Light' },
    description: { ar: 'واجهة بيضاء مريحة وساطعة للمهام والنهار.', en: 'Bright, high-contrast clarity for daytime focus.' },
    tone: 'light',
  },
  {
    id: 'glass',
    label: { ar: 'زجاجي كريستالي', en: 'Crystal Glass Light' },
    description: { ar: 'شفافية زجاجية مضيئة مع تدرجات لونية هادئة.', en: 'Frosted crystal light glass with soft dispersion.' },
    tone: 'glass',
    badge: { ar: 'زجاجي', en: 'Glass' },
  },
  {
    id: 'glass-dark',
    label: { ar: 'زجاج أوبسيديان داكن', en: 'Obsidian Glass Dark' },
    description: { ar: 'زجاج بلوري معتم فائق العمق والشفافية.', en: 'Dark frosted glass for sleek futuristic vibes.' },
    tone: 'glass-dark',
    badge: { ar: 'داكن زجاجي', en: 'Dark Glass' },
  },
  {
    id: 'aurora',
    label: { ar: 'الشفق القطبي السينمائي', en: 'Aurora Indigo' },
    description: { ar: 'تدرجات لونية مستوحاة من أضواء الشمال والبنفسج.', en: 'Deep northern lights glow with soft violet tones.' },
    tone: 'aurora',
    badge: { ar: 'سينمائي', en: 'Cinematic' },
  },
  {
    id: 'ocean',
    label: { ar: 'أزرق المحيط السماوي', en: 'Deep Ocean & Cyan' },
    description: { ar: 'أزرق بحري عميق مع عناصر سماوية منعشة.', en: 'Maritime blues with vibrant cyan electric accents.' },
    tone: 'ocean',
  },
  {
    id: 'cyberpunk',
    label: { ar: 'سايبر بانك نيون', en: 'Cyberpunk Neon' },
    description: { ar: 'ألوان نيون جريئة تجمع بين الأصفر الذهبي والفيروزي.', en: 'High-octane neon yellow, cyan, and dark grid.' },
    tone: 'cyberpunk',
    badge: { ar: 'مستقبلي', en: 'Futuristic' },
  },
  {
    id: 'coffee',
    label: { ar: 'قهوة ودافئ كابتشينو', en: 'Warm Coffee & Latte' },
    description: { ar: 'درجات الكاراميل والقهوة الدافئة المريحة للقراءة.', en: 'Earthy espresso and warm creamy caramel tones.' },
    tone: 'coffee',
  },
  {
    id: 'royal',
    label: { ar: 'أرجواني ملكي فاخر', en: 'Imperial Royal Purple' },
    description: { ar: 'بنفسجي ياقوتي مخملي لإحساس فخم وراقي.', en: 'Velvet amethyst purple with radiant lilac hints.' },
    tone: 'royal',
    badge: { ar: 'فاخر', en: 'Royal' },
  },
  {
    id: 'crimson',
    label: { ar: 'ياقوت قرمزي دافئ', en: 'Crimson Ruby' },
    description: { ar: 'خلفية مخملية داكنة مع توهج أحمر ياقوتي عميق.', en: 'Deep velvet noir with intense glowing crimson ruby tones.' },
    tone: 'crimson',
    badge: { ar: 'جديد', en: 'New' },
  },
  {
    id: 'matrix',
    label: { ar: 'ماتريكس الطرفية الرقمية', en: 'Matrix Hacker Terminal' },
    description: { ar: 'أخضر فوسفوري كلاسيكي مستوحى من شاشات الهاكرز.', en: 'Iconic monochrome phosphor green on digital deep obsidian.' },
    tone: 'matrix',
    badge: { ar: 'كود وهاكر', en: 'Hacker' },
  },
  {
    id: 'dracula',
    label: { ar: 'دراكولا الليلي الشهير', en: 'Dracula Gothic Pro' },
    description: { ar: 'أزرق داكن كلاسيكي مع تدرجات زهرية وسماوية الباستيل.', en: 'Legendary developer palette with vampire slate and pastel highlights.' },
    tone: 'dracula',
    badge: { ar: 'مطورين', en: 'Dev Pick' },
  },
  {
    id: 'nord',
    label: { ar: 'نورد الجليدي الإسكندنافي', en: 'Arctic Nord Frost' },
    description: { ar: 'درجات برودة القطب الشمالي الرمادية والزرقاء الهادئة.', en: 'Calm arctic slate, icy cyan, and sub-zero aesthetic.' },
    tone: 'nord',
    badge: { ar: 'هادئ', en: 'Minimal' },
  },
  {
    id: 'synthwave',
    label: { ar: 'سينث ويف ريترو 80s', en: '80s Retro Synthwave' },
    description: { ar: 'تدرج شمس الغروب النيون والماجينتا والبنفسجي الصاخب.', en: 'Neon magenta, laser sunset violet, and retro cyber-grid.' },
    tone: 'synthwave',
    badge: { ar: 'ريترو', en: 'Retro 80s' },
  },
  {
    id: 'forest',
    label: { ar: 'غابة الصنوبر والطبيعة', en: 'Deep Pine Forest' },
    description: { ar: 'خضار نباتي هادئ مستوحى من الطبيعة وغابات الصنوبر.', en: 'Earthy botanical moss green and evergreen pine serenity.' },
    tone: 'forest',
  },
  {
    id: 'gold',
    label: { ar: 'الذهب الأسود الملكي 24k', en: 'Black Gold Luxury 24k' },
    description: { ar: 'فحم أسود راقي مع حواف وتفاصيل ذهبية عيار 24.', en: 'Ultra-luxurious titanium charcoal with burnished champagne gold.' },
    tone: 'gold',
    badge: { ar: 'نخبة', en: 'Elite' },
  },
  {
    id: 'solar',
    label: { ar: 'توهج شمس الغروب', en: 'Solar Flare & Sunset' },
    description: { ar: 'توهج عنبري ناري دافئ من أشعة الشمس وانعكاسات النحاس.', en: 'Fiery copper dusk, radiant solar amber, and warm embers.' },
    tone: 'solar',
  },
  {
    id: 'rose',
    label: { ar: 'روز كوارتز أنيق', en: 'Rose Quartz & Blush' },
    description: { ar: 'مزيج باستيل وردي أنثوي هادئ وفاتح ومريح.', en: 'Soft pastel dusty rose with warm quartz stone aesthetics.' },
    tone: 'rose',
    badge: { ar: 'باستيل', en: 'Pastel' },
  },
  {
    id: 'stranger-things',
    label: { ar: 'سترينجر ثينقز (Stranger Things)', en: 'Stranger Things (Upside Down)' },
    description: { ar: 'أجواء هوكينز وعالم The Upside Down الغامض بأحمر نيون ثمانينات وسواد كوني عميق.', en: '80s Hawkins retro synth, glowing crimson neon, and ominous Upside Down atmosphere.' },
    tone: 'stranger-things',
    badge: { ar: 'سينمائي', en: 'Series' },
  },
  {
    id: 'outer-banks',
    label: { ar: 'أوتر بانكس (Outer Banks)', en: 'Outer Banks (OBX Paradise)' },
    description: { ar: 'غروب جزيرة كيلدير وسحر المحيط الأطلسي ببرتقالي دافئ وتركواز ساحلي مغامر.', en: 'Kildare Island golden hour, coastal surf amber, tropical turquoise, and Pogue adventures.' },
    tone: 'outer-banks',
    badge: { ar: 'سينمائي', en: 'Series' },
  },
  {
    id: 'game-of-thrones',
    label: { ar: 'صراع العروش (Game of Thrones)', en: 'Game of Thrones (Iron Throne)' },
    description: { ar: 'عرش ويستروس الحديدي، فحم الفاليريان، ونيران التنانين المتوهجة بذهب وياقوت تارجاريان.', en: 'Westeros Iron Throne steel, Targaryen dragon fire embers, Valyrian charcoal, and gold sigils.' },
    tone: 'game-of-thrones',
    badge: { ar: 'سينمائي', en: 'Series' },
  },
] as const;
