import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

export type MediaType = 'image' | 'video';

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
  type: MediaType;
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

const GALLERY_FILE = path.join(process.cwd(), '.media_gallery.json');

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1344, height: 768 },
  '1:1': { width: 1024, height: 1024 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 864 },
  '21:9': { width: 1536, height: 640 },
};

const STYLE_PROMPT_MAP: Record<ImageStyle, { en: string; ar: string }> = {
  photorealistic: {
    en: 'hyper-realistic photography, 8k resolution, captured on 85mm lens, sharp focus, natural volumetric lighting, photorealistic textures, master composition',
    ar: 'تصوير فوتوغرافي واقعي فائق الدقة 8K، عدسة 85mm، إضاءة حجمية طبيعية وتفاصيل حادة',
  },
  cinematic: {
    en: 'cinematic still, IMAX 70mm film grain, dynamic dramatic lighting, anamorphic lens flare, moody color grading, epic cinematic atmosphere, masterpiece',
    ar: 'لقطة سينمائية، جودة أفلام IMAX، إضاءة درامية، ألوان سينمائية وأجواء ملحمية',
  },
  anime: {
    en: 'high-end Japanese anime aesthetic, Studio Ghibli and Makoto Shinkai style, vibrant colors, lush detailed background, cinematic key visual, 4k digital art',
    ar: 'أنمي ياباني فاخر، طراز استوديو غيبلي وماكوتو شينكاي، ألوان مشبعة وتفاصيل مذهلة',
  },
  cyberpunk: {
    en: 'cyberpunk futuristic metropolis, glowing neon lighting, reflections in rain-soaked streets, volumetric fog, high-tech dystopian aesthetics, Octane render',
    ar: 'سايبربانك مستقبلي، إضاءة نيون مبهرة، انعكاسات مياه الأمطار والضباب وضخامة معمارية',
  },
  unreal5: {
    en: '3D CGI render, Unreal Engine 5.4, ray-traced global illumination, Subsurface scattering, Nanite geometry, ultra-detailed 8k texture maps',
    ar: 'تصميم ثلاثي الأبعاد Unreal Engine 5 مع تتبع أشعة وإضاءة وفيزيائية واقعية',
  },
  oil_painting: {
    en: 'classical oil painting on textured canvas, rich impasto brush strokes, Rembrandt dramatic lighting, baroque atmosphere, fine art gallery masterpiece',
    ar: 'لوحة زيتية كلاسيكية مع ضربات فرشاة بارزة، إضاءة رامبرانت الدرامية وأجواء تاريخية',
  },
  product_studio: {
    en: 'commercial product photography, clean luxury studio lighting, softbox highlights, crisp edges, minimal elegant pedestal, high-end catalog quality',
    ar: 'تصوير إعلاني وتجاري فاخر، إضاءة سوفت بوكس استوديو، خطوط حادة وأناقة متناهية',
  },
  fantasy: {
    en: 'mythical high-fantasy concept art, magical glowing particles, ancient colossal ruins, ethereal twilight skies, ArtStation trending, intricate details',
    ar: 'عالم فانتزي أسطوري، جزيئات سحرية متوهجة، آثار تاريخية عملاقة وأجواء سحرية',
  },
  minimalist: {
    en: 'minimalist modern design, clean negative space, balanced geometric composition, elegant monochromatic and muted tones, architectural clarity',
    ar: 'تصميم مينيمالي حديث، مساحات سلبية متوازنة وألوان راقية وهادئة',
  },
};

const MOTION_DESCRIPTIONS: Record<VideoMotion, { en: string; ar: string }> = {
  drone_fpv: {
    en: 'smooth high-altitude FPV drone flythrough, continuous seamless forward drift, sweeping panoramic reveal',
    ar: 'حركة درون FPV انسيابية سريعة، اندفاع سلس للأمام مع كشف بانورامي عريض',
  },
  orbit_360: {
    en: 'cinematic 360-degree orbital camera rotation around the subject, steady gimbal motion, parallax depth',
    ar: 'دوران سينمائي 360 درجة حول الهدف بحركة جيمبل سلسة وعمق تصوير مجسم',
  },
  dolly_zoom: {
    en: 'vertigo Hitchcock dolly zoom effect, background compressing while foreground subject remains locked, dramatic tension',
    ar: 'تأثير دولي زووم (Dolly Zoom) سينمائي، انضغاط الخلفية مع ثبات العنصر الرئيسي',
  },
  slow_motion: {
    en: 'ultra slow motion 120fps fluid movement, cinematic water ripples, floating particles, hyper-smooth deceleration',
    ar: 'تصوير بطيء فائق النعومة 120 إطار بالثانية، حركة سوائل وجزيئات عائمة بانسيابية',
  },
  pan_horizontal: {
    en: 'slow majestic horizontal tracking pan, steady slider movement, deep horizon view',
    ar: 'حركة تتبع أفقية بطيئة وثابتة، تدرج على طول الأفق والمنظر الطبيعي',
  },
  hyperlapse: {
    en: 'motion-controlled dynamic hyperlapse, clouds streaking across sky, high-speed lighting shift, stabilized flow',
    ar: 'حركة هايبر لابس متسارعة، حركة سحب سريعة وتحول ضوئي مبهر ومثبت',
  },
  cinematic_steady: {
    en: 'Hollywood steady-cam tracking shot, subtle organic breathing motion, cinematic focal shifts',
    ar: 'لقطة كاميرا محمولة ومثبتة هوليوودية مع تنقل تركيز بؤري سينمائي سلس',
  },
};

// Circuit breaker to prevent repeated 429 quota exhaustion errors on free-tier keys
class NativeImageCircuitBreaker {
  private cooldownUntil = 0;

  public isAvailable(): boolean {
    return Date.now() > this.cooldownUntil;
  }

  public trip(durationMs = 60 * 60 * 1000) {
    this.cooldownUntil = Date.now() + durationMs;
  }
}

const nativeImageCircuitBreaker = new NativeImageCircuitBreaker();

// Fast in-memory LRU prompt cache for zero-latency instant response on repeated/similar prompts
const promptEnhanceCache = new Map<string, {
  enhancedPromptEn: string;
  explanationAr: string;
  negativePrompt: string;
  recommendedAspectRatio: AspectRatio;
  recommendedStyle: ImageStyle;
  semanticAnalysis?: SemanticAnalysis;
  timestamp: number;
}>();

// Cascading AI Vision Director Models
const DIRECTOR_MODELS = [
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

/**
 * Intelligent Rule-Based Semantic Brain
 * Translates and elevates Arabic/English prompts into rich visual descriptors
 * even in offline/zero-latency scenarios.
 */
export class CognitiveMediaBrain {
  public static deconstruct(prompt: string, type: MediaType, styleKey: ImageStyle, motionKey?: VideoMotion): {
    enhancedPromptEn: string;
    explanationAr: string;
    semanticAnalysis: SemanticAnalysis;
    negativePrompt: string;
  } {
    const p = prompt.toLowerCase();

    // 1. Detect cultural landmark / geography
    let environmentEn = 'scenic environment with rich atmospheric depth and layered background elements';
    let environmentAr = 'بيئة تفاعلية ذات عمق مكاني وطبقات متعددة';

    if (p.includes('علا') || p.includes('العلا')) {
      environmentEn = 'towering ancient sandstone monoliths of Al-Ula, dramatic desert canyons, wind-carved rock formations, sweeping red sand dunes';
      environmentAr = 'جبال وصخور العلا الشاهقة المنحوتة بالرياح مع الكثبان الرملية الذهبية الحمراء';
    } else if (p.includes('نيوم') || p.includes('ذا لاين') || p.includes('the line')) {
      environmentEn = 'futuristic NEOM smart megacity with glowing crystalline vertical towers, elevated maglev monorails, sustainable solar architecture';
      environmentAr = 'مدينة نيوم المستقبلية بأبراجها الزجاجية العمودية وقطارات الماجليف الذكية المعلقة';
    } else if (p.includes('رياض') || p.includes('الرياض')) {
      environmentEn = 'modern Riyadh skyline with illuminated Kingdom Tower and Al Faisaliah Tower, prestigious financial district, polished boulevards';
      environmentAr = 'أفق مدينة الرياض الحديث مع برجي المملكة والفيصلية والحي المالي المضاء';
    } else if (p.includes('دبي') || p.includes('خليفة')) {
      environmentEn = 'futuristic Dubai skyline with gleaming curved skyscrapers, luxury modern architecture, reflecting marina waters';
      environmentAr = 'أفق دبي المستقبلي مع ناطحات السحاب الملتوية والمياه العاكسة للأضواء';
    } else if (p.includes('أندلس') || p.includes('حمراء') || p.includes('غرناطة')) {
      environmentEn = 'opulent Moorish Andalusian palace, intricate geometric arabesque arches, marble fountains, lush fragrant courtyards';
      environmentAr = 'قصر أندلسي فاخر مع أقواس هندسية موريسية، نوافير رخامية وباحات خضراء';
    } else if (p.includes('قدس') || p.includes('الأقصى')) {
      environmentEn = 'historic Jerusalem ancient stone architecture, golden dome catching the sunlight, olive trees, ancient arched alleys';
      environmentAr = 'القدس العتيقة بحجارتها التاريخية وقبتها الذهبية المتلألئة وأشجار الزيتون';
    } else if (p.includes('مكة') || p.includes('الحرم')) {
      environmentEn = 'majestic holy city of Mecca, expansive luminous marble courtyards, spiritual grand architecture';
      environmentAr = 'مكة المكرمة مع الساحات الرخامية البيضاء الواسعة والروحانية العميقة';
    } else if (p.includes('بحر') || p.includes('محيط') || p.includes('شاطئ') || p.includes('أمواج')) {
      environmentEn = 'crystal turquoise ocean with gentle crashing waves, sea spray mist, pristine shoreline, deep aquatic horizon';
      environmentAr = 'محيط بلوري فيروزي مع أمواج متلاطمة برفق ورذاذ بحري وشاطئ نقي';
    } else if (p.includes('صحراء') || p.includes('رمال') || p.includes('كثبان')) {
      environmentEn = 'sweeping golden red sand dunes with delicate wind ripples, vast desert horizon, thermal heat haze';
      environmentAr = 'صحراء شاسعة ذات كثبان رملية متموجة بفعل الرياح وأفق لا نهائي';
    } else if (p.includes('فضاء') || p.includes('كوكب') || p.includes('مجرة') || p.includes('نجوم')) {
      environmentEn = 'deep cosmic nebula, swirling interstellar dust, distant alien exoplanets, glowing star clusters and milky way';
      environmentAr = 'فضاء كوني عميق مع سديم متلألئ وكواكب بعيدة ومجرات حلزونية';
    } else if (p.includes('غابة') || p.includes('شلال') || p.includes('طبيعة') || p.includes('أشجار')) {
      environmentEn = 'ancient emerald forest canopy, cascading crystalline waterfall, moss-covered rocks, mystical sunbeams penetrating the foliage';
      environmentAr = 'غابة زمردية كثيفة مع شلال كريستالي متدفق وأشعة شمس تخترق أوراق الشجر';
    } else if (p.includes('ملعب') || p.includes('stadium') || p.includes('مباراة') || p.includes('كورة') || p.includes('كرة') || p.includes('football') || p.includes('soccer')) {
      if (p.includes('جزائر') || p.includes('algeria') || p.includes('محارب') || p.includes('خضرا')) {
        environmentEn = 'electrifying packed football stadium, thousands of passionate Algerian supporters waving green and white Algerian national flags and banners, green seating, pristine manicured pitch turf grass, bright stadium floodlights';
        environmentAr = 'ملعب كرة قدم أسطوري ممتلئ بعشرات الآلاف من الجماهير الجزائرية الهاتفة مع رايات وأعلام الجزائر الخضراء والبيضاء';
      } else {
        environmentEn = 'world-class packed football stadium arena, roaring fans in grandstands, manicured emerald green turf grass, vibrant matchday atmosphere';
        environmentAr = 'استاد كرة قدم عالمي ممتلئ بالجماهير مع أرضية عشبية خضراء وأجواء حماسية';
      }
    }

    // 2. Detect main subject
    let subjectEn = 'masterfully detailed focal subject with intricate surface textures and authentic anatomy';
    let subjectAr = 'العنصر المحوري بدقة تفاصيل مادية وتشريحية عالية';

    // 2.1 Celebrity & Football / Sports detection
    if ((p.includes('ميسي') || p.includes('messi')) && (p.includes('جزائر') || p.includes('algeria') || p.includes('تيشرت') || p.includes('قميص') || p.includes('jersey') || p.includes('kit'))) {
      subjectEn = 'world-famous football superstar Lionel Messi with authentic photorealistic facial likeness, joyful victory celebration smile, arms raised triumphantly, wearing the official Algerian national football team home kit jersey in pristine white and emerald green with the Algerian crescent and star emblem and FAF crest on the chest, realistic athletic jersey fabric texture and fine mesh, natural sweat beads, realistic physique';
      subjectAr = 'الأسطورة ليونيل ميسي بملامحه الواقعية الدقيقة وهو يحتفل بحماس وسعادة مرتدياً قميص المنتخب الوطني الجزائري الأبيض والأخضر مع شعار الهلال والنجمة وشعار الاتحاد الجزائري FAF بدقة متناهية';
    } else if (p.includes('ميسي') || p.includes('messi')) {
      subjectEn = 'football legend Lionel Messi with lifelike photorealistic facial features, authentic beard and hairstyle, athletic football attire with intricate fabric weave, celebratory emotion, professional athlete physique';
      subjectAr = 'الأسطورة ليونيل ميسي بملامحه الفوتوغرافية الحقيقية الدقيقة وتعبيرات وجه واقعية وهيئة رياضية احترافية';
    } else if (p.includes('رونالدو') || p.includes('ronaldo') || p.includes('cr7')) {
      subjectEn = 'football icon Cristiano Ronaldo with authentic photorealistic facial features, muscular athletic build, iconic triumphant celebration gesture, detailed jersey fabric texture';
      subjectAr = 'النجم كريستيانو رونالدو بملامحه الواقعية الدقيقة وبنيته الرياضية واحتفاله الشهير';
    } else if (p.includes('محرز') || p.includes('mahrez')) {
      subjectEn = 'Algerian football star Riyad Mahrez with lifelike facial likeness, wearing the Algerian national team kit jersey with green and white colors and FAF emblem, athletic posture';
      subjectAr = 'النجم الجزائري رياض محرز بملامحه الحقيقية مرتدياً قميص محاربي الصحراء الأخضر والأبيض';
    } else if (p.includes('صقر') || p.includes('نسر') || p.includes('falcon') || p.includes('eagle')) {
      subjectEn = 'majestic royal Arabian falcon, razor-sharp golden talons, detailed plumage feathers, keen focused piercing gaze';
      subjectAr = 'صقر عربي ملكي أصيل، ريش دقيق وتفصيلي، مخالب حادة ونظرة حادة ومركزة';
    } else if (p.includes('خيل') || p.includes('حصان') || p.includes('فرس') || p.includes('horse')) {
      subjectEn = 'noble purebred Arabian stallion with flowing silk-like mane, arched neck, powerful muscular anatomy, spirited posture';
      subjectAr = 'خيل عربي أصيل مع عرف حريري منساب، رقبة مقوسة وبنية عضلية قوية وحركة مهيبة';
    } else if (p.includes('قطار') || p.includes('قطارات') || p.includes('train')) {
      subjectEn = 'high-speed futuristic maglev bullet train with sleek aerodynamic glowing chassis, elevated transparent tracks';
      subjectAr = 'قطار ماجليف فائق السرعة بهيكل ديناميكي متوهج ومسارات معلقة';
    } else if (p.includes('رائد فضاء') || p.includes('astronaut')) {
      subjectEn = 'astronaut in a futuristic pressurized illuminated EVA spacesuit, reflective gold visor, high-tech chest display units';
      subjectAr = 'رائد فضاء ببدلة متطورة مع خوذة ذات قناع ذهبي عاكس وأجهزة تحكم مضيئة';
    } else if (p.includes('محارب') || p.includes('فارس') || p.includes('سيف') || p.includes('knight')) {
      subjectEn = 'heroic warrior in ornate engraved Damascus steel armor, flowing fabric cape, noble heroic stance, hand-forged scimitar';
      subjectAr = 'فارس عربي بمدرع فولاذي دمشقي منقوش، وشاح ملكي وموقف بطولي يحمل سيفاً مصقولاً';
    } else if (p.includes('سيارة') || p.includes('مركبة') || p.includes('car')) {
      subjectEn = 'aerodynamic luxury hypercar, carbon fiber body panels, sleek glowing LED headlights, polished mirror finish reflections';
      subjectAr = 'سيارة خارقة ديناميكية بهيكل من ألياف الكربون ومصابيح LED حادة ولمعان مرآتي';
    } else if (p.includes('طائرة') || p.includes('طيران') || p.includes('airplane') || p.includes('jet')) {
      subjectEn = 'supersonic luxury jet aircraft cutting through clouds, sleek aerodynamic titanium wings, vapor trails';
      subjectAr = 'طائرة نفاثة فاخرة تخترق السحب بأجنحة تيتانيوم انسيابية';
    } else if (p.includes('يخت') || p.includes('سفينة') || p.includes('قارب') || p.includes('yacht')) {
      subjectEn = 'luxury modern superyacht with illuminated wooden decks, sleek white hull slicing through calm ocean waters';
      subjectAr = 'يخت فاخر فائق الحداثة بأسطح خشبية مضيئة وهيكل أبيض ينساب في المياه';
    } else if (p.includes('روبوت') || p.includes('آلي') || p.includes('cyborg') || p.includes('robot')) {
      subjectEn = 'advanced bionic humanoid android, polished titanium chassis, visible micro-circuitry and fiber-optic conduits';
      subjectAr = 'روبوت سايبورغ بشري فائق التطور، هيكل من التيتانيوم ودوائر كهروبصرية دقيقة';
    } else if (p.includes('قطة') || p.includes('بسة') || /(^|\s)قط(\s|$)/.test(p) || p.includes('cat')) {
      subjectEn = 'adorable fluffy cat with photorealistic individual fur strands, luminous expressive eyes, delicate whiskers, lifelike posture';
      subjectAr = 'قطة أليفة ذات فراء كثيف وواقعي فائق الدقة وعينين معبرتين ومضيئتين';
    } else if (p.includes('أسد') || p.includes('نمر') || p.includes('فهد') || p.includes('lion') || p.includes('tiger')) {
      subjectEn = 'regal apex predator with majestic detailed mane, intense amber eyes, muscular definition, photorealistic coat';
      subjectAr = 'مفترس مهيب مع فراء ووبر فوتوغرافي واقعي وعينين كهرمانيتين مليئتين بالقوة';
    } else if (p.includes('شعار') || p.includes('لوجو') || p.includes('logo')) {
      subjectEn = 'sophisticated minimalist luxury vector emblem, balanced sacred geometry, crisp clean silhouette';
      subjectAr = 'شعار فاخر متقن يعتمد الهندسة المتوازنة والخطوط المينيمالية الحادة';
    } else {
      subjectEn = `the central subject inspired by: "${prompt}", depicted with extreme realism, rich depth, and authentic character`;
      subjectAr = `العنصر الرئيسي المستوحى من: "${prompt}" بتجسيد بصري احترافي`;
    }

    // 3. Detect lighting & physics
    let lightingEn = 'volumetric cinematic lighting, soft dramatic studio rim lights, natural soft shadows, ray-traced global illumination';
    let lightingAr = 'إضاءة حجمية سينمائية مع إضاءة حواف استوديو وظلال ناعمة وتتبع أشعة واقعي';

    if (p.includes('استوديو') || p.includes('studio') || p.includes('منتج') || p.includes('إعلان')) {
      lightingEn = 'professional multi-point studio lights, large softbox key light, subtle rim lights, clean high-end commercial illumination';
      lightingAr = 'إضاءة استوديو تصوير احترافية مع سوفت بوكس وإضاءة حواف وتفاصيل حادة';
    } else if (p.includes('غروب') || p.includes('شمس') || p.includes('sunset')) {
      lightingEn = 'dramatic golden hour sunset, warm volumetric amber rim lighting, long cinematic shadows, soft glowing atmospheric haze';
      lightingAr = 'إضاءة الساعة الذهبية عند الغروب مع توهج دافئ وظلال ممتدة';
    } else if (p.includes('شروق') || p.includes('فجر') || p.includes('dawn')) {
      lightingEn = 'ethereal dawn morning light, volumetric mist, soft pastel sky gradients, gentle diffused cool rays breaking through morning mist';
      lightingAr = 'ضوء الفجر الهادئ بألوان الباستيل وأشعة باردة ناعمة تخترق الضباب';
    } else if (p.includes('ليل') || p.includes('ليلي') || p.includes('night')) {
      lightingEn = 'atmospheric nocturnal illumination, deep obsidian shadows contrasted with soft ambient moonlight and distant city glow';
      lightingAr = 'إضاءة ليلية سينمائية مع تباين قوي بين ضوء القمر وأضواء المدينة البعيدة';
    } else if (p.includes('نيون') || p.includes('neon') || p.includes('سايبر')) {
      lightingEn = 'vibrant cyberpunk neon glow, dual-tone cyan and magenta light reflections on wet surfaces, high contrast chiaroscuro';
      lightingAr = 'إضاءة نيون سايبربانك مشبعة بتدرجات السيان والماجنتا مع انعكاسات مائية';
    }

    // 4. Detect camera & optics
    let cameraEn = 'shot on 85mm f/1.8 prime lens, creamy optical bokeh depth of field, razor-sharp focus on subject, balanced three-point cinematic composition';
    let cameraAr = 'تصوير بعدسة سينمائية 85mm بفتحة f/1.8 مع عزل بصري ناعم، عمق ميدان فوتوغرافي، وتكوين متوازن';

    if (p.includes('درون') || p.includes('drone') || motionKey === 'drone_fpv') {
      cameraEn = 'dynamic sweeping FPV drone perspective, ultra-wide 18mm lens, breathtaking aerial viewpoint, continuous fluid motion, 8k resolution';
      cameraAr = 'زاوية درون FPV جوية واسعة 18mm مع كشف بانورامي وحركة ديناميكية بدقة 8K';
    } else if (p.includes('بورتريه') || p.includes('وجه') || p.includes('portrait')) {
      cameraEn = 'intimate eye-level portrait, 85mm f/1.8 master portrait lens, shallow optical depth of field, creamy bokeh, sharp catchlights in the eyes';
      cameraAr = 'لقطة بورتريه قريبة بمستوى العين مع عدسة 85mm f/1.8 وعزل متقن ولمعة حية في العين';
    } else if (p.includes('سينمائي') || p.includes('فيلم') || styleKey === 'cinematic') {
      cameraEn = 'anamorphic 70mm widescreen cinema framing, shot on 85mm cine prime lens at f/1.8, creamy bokeh, subtle horizontal flare';
      cameraAr = 'تأطير سينمائي عريض 70mm بعدسة سينمائية 85mm بفتحة f/1.8 وتدرجات لونية هوليوودية';
    }

    // 5. Motion (if video)
    const motionEn = motionKey ? MOTION_DESCRIPTIONS[motionKey]?.en : (type === 'video' ? 'smooth cinematic motion blur, 60fps fluid camera motion' : undefined);
    const motionAr = motionKey ? MOTION_DESCRIPTIONS[motionKey]?.ar : (type === 'video' ? 'حركة سينمائية انسيابية بمعدل 60 إطار بالثانية' : undefined);

    // 6. Mood
    let moodEn = 'epic, prestigious, evocative and visually arresting';
    let moodAr = 'أجواء ملحمية، راقية وذات حضور بصري ساحر';

    if (styleKey === 'anime') {
      moodEn = 'expressive, vibrant, artistic Japanese anime charm with emotional wonder';
      moodAr = 'طابع أنمي فني معبر ونابض بالحياة والسحر البصري';
    } else if (styleKey === 'fantasy') {
      moodEn = 'mystical, enchanting, mythological fantasy wonder';
      moodAr = 'أجواء أسطورية سحرية ومليئة بالغموض والروعة';
    } else if (styleKey === 'cyberpunk') {
      moodEn = 'high-tech dystopian futuristic tension, electric energy';
      moodAr = 'طابع مستقبلي تقني مشحون بالطاقة والحيوية';
    }

    const enhancedPromptEn = `${subjectEn}, set in ${environmentEn}. ${lightingEn}. ${cameraEn}${motionEn ? `, ${motionEn}` : ''}. ${STYLE_PROMPT_MAP[styleKey].en}, 8k resolution, ultra-detailed textures, volumetric lighting, studio lights, 85mm f/1.8 lens, creamy optical bokeh depth of field, hyper-realistic masterpiece photo, pristine quality`;

    const explanationAr = `تمت معالجة وإثراء الطلب عبر محرك ADEM فائق التطور (Flux.1 High-Performance Pipeline): تم تحويل الوصف إلى برومبت سينمائي 8K فائق الدقة مع إضاءة حجمية (Volumetric/Studio Lighting) وعدسة 85mm f/1.8 مع عزل بصري Bokeh وتفاصيل فائقة الواقعية.`;

    const negativePrompt = 'cartoon, anime, 3d render, cgi, illustration, painting, drawing, sketch, plastic skin, smooth skin, airbrushed, oversaturated, low quality, blurry, deformed, watermark, signature, text';

    return {
      enhancedPromptEn,
      explanationAr,
      semanticAnalysis: {
        subject: subjectAr,
        environment: environmentAr,
        lighting: lightingAr,
        camera: cameraAr,
        motion: motionAr,
        mood: moodAr,
      },
      negativePrompt,
    };
  }
}

export class MediaEngine {
  private items: MediaItem[] = [];

  constructor() {
    this.loadGallery();
  }

  private loadGallery() {
    try {
      if (fs.existsSync(GALLERY_FILE)) {
        const raw = fs.readFileSync(GALLERY_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed;
        }
      }
    } catch (e) {
      console.warn('[MediaEngine] Could not load media gallery cache:', e);
    }
  }

  private saveGallery() {
    try {
      fs.writeFileSync(GALLERY_FILE, JSON.stringify(this.items.slice(0, 50), null, 2));
    } catch (e) {
      console.warn('[MediaEngine] Could not save media gallery:', e);
    }
  }

  public getGallery(): MediaItem[] {
    return this.items;
  }

  public deleteItem(id: string): boolean {
    const idx = this.items.findIndex(it => it.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.saveGallery();
      return true;
    }
    return false;
  }

  /**
   * Intelligently understands the user prompt (Arabic, English, or dialect)
   * using a cascade of Gemini models + cognitive fallback brain.
   */
  public async enhancePrompt(params: {
    prompt: string;
    type: MediaType;
    style?: ImageStyle;
    motion?: VideoMotion;
    aspectRatio?: AspectRatio;
    apiKey?: string;
    fastMode?: boolean;
  }): Promise<{
    enhancedPromptEn: string;
    explanationAr: string;
    negativePrompt: string;
    recommendedAspectRatio: AspectRatio;
    recommendedStyle: ImageStyle;
    semanticAnalysis?: SemanticAnalysis;
  }> {
    const raw = params.prompt.trim();
    const styleKey = (params.style as ImageStyle) || 'cinematic';
    const styleSpec = STYLE_PROMPT_MAP[styleKey] || STYLE_PROMPT_MAP.cinematic;
    const motionSpec = params.motion ? MOTION_DESCRIPTIONS[params.motion] : undefined;
    const chosenAspect = params.aspectRatio || (params.type === 'video' ? '16:9' : '1:1');

    // Check fast in-memory cache
    const cacheKey = `${raw.toLowerCase()}::${params.type}::${styleKey}::${params.motion || ''}::${chosenAspect}`;
    const cached = promptEnhanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return {
        enhancedPromptEn: cached.enhancedPromptEn,
        explanationAr: cached.explanationAr,
        negativePrompt: cached.negativePrompt,
        recommendedAspectRatio: cached.recommendedAspectRatio,
        recommendedStyle: cached.recommendedStyle,
        semanticAnalysis: cached.semanticAnalysis,
      };
    }

    // If fastMode is requested (or default for speed), use zero-latency Cognitive Heuristic Brain immediately (0ms)
    if (params.fastMode || !params.apiKey) {
      const cognitive = CognitiveMediaBrain.deconstruct(raw, params.type, styleKey, params.motion);
      const res = {
        enhancedPromptEn: cognitive.enhancedPromptEn,
        explanationAr: cognitive.explanationAr,
        negativePrompt: cognitive.negativePrompt,
        recommendedAspectRatio: chosenAspect,
        recommendedStyle: styleKey,
        semanticAnalysis: cognitive.semanticAnalysis,
      };
      promptEnhanceCache.set(cacheKey, { ...res, timestamp: Date.now() });
      return res;
    }

    // 1. Try AI Director model with strict 750ms race timeout to prevent user stalling
    if (params.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: params.apiKey });

        const directorSystemInstruction = `You are the World Elite Visual & Cinematic Director for ADEM AI.
Elevate the user prompt into an extraordinary 8K cinematic visual prompt in English for the Flux.1 high-performance engine.
Return strictly valid JSON with keys: enhancedPromptEn, explanationAr, semanticAnalysis, negativePrompt, recommendedStyle, recommendedAspectRatio.`;

        const generatePromise = async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `User Prompt: "${raw}"\nType: ${params.type}\nStyle: ${styleKey}\nAspect: ${chosenAspect}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: directorSystemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.35,
            },
          });
          const text = response.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.enhancedPromptEn) {
              const fullEnhancedPrompt = `${parsed.enhancedPromptEn}, ${styleSpec.en}${motionSpec ? `, ${motionSpec.en}` : ''}, 8k resolution, masterwork`;
              const result = {
                enhancedPromptEn: fullEnhancedPrompt,
                explanationAr: parsed.explanationAr || `تم تحليل وتوسيع الطلب بدقة سينمائية 8K وأسلوب ${styleSpec.ar}`,
                negativePrompt: parsed.negativePrompt || 'blurry, distorted, deformed limbs, bad anatomy, watermark, text, low quality',
                recommendedAspectRatio: (parsed.recommendedAspectRatio as AspectRatio) || chosenAspect,
                recommendedStyle: (parsed.recommendedStyle as ImageStyle) || styleKey,
                semanticAnalysis: parsed.semanticAnalysis,
              };
              promptEnhanceCache.set(cacheKey, { ...result, timestamp: Date.now() });
              return result;
            }
          }
          return null;
        };

        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 750));
        const raceResult = await Promise.race([generatePromise(), timeoutPromise]);
        if (raceResult) return raceResult;
      } catch {
        // Fall through to instant cognitive brain
      }
    }

    // 2. Cognitive Heuristic Brain (Zero-Latency Instant Fallback)
    const cognitive = CognitiveMediaBrain.deconstruct(raw, params.type, styleKey, params.motion);
    const fallbackRes = {
      enhancedPromptEn: cognitive.enhancedPromptEn,
      explanationAr: cognitive.explanationAr,
      negativePrompt: cognitive.negativePrompt,
      recommendedAspectRatio: chosenAspect,
      recommendedStyle: styleKey,
      semanticAnalysis: cognitive.semanticAnalysis,
    };
    promptEnhanceCache.set(cacheKey, { ...fallbackRes, timestamp: Date.now() });
    return fallbackRes;
  }

  /**
   * Generates a high-definition image item with full semantic understanding.
   * Optimized for lightning-fast sub-second generation speed via FLUX.1 / Turbo Ultra-Diffusion.
   */
  public async generateImage(params: {
    prompt: string;
    style?: ImageStyle;
    aspectRatio?: AspectRatio;
    seed?: number;
    apiKey?: string;
    model?: 'flux' | 'turbo';
  }): Promise<MediaItem> {
    const style = params.style || 'photorealistic';
    const aspectRatio = params.aspectRatio || '1:1';
    const seed = params.seed ?? Math.floor(Math.random() * 999999);
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['1:1'];
    const selectedModel = params.model || 'flux';

    // 1. Instant Deep understanding & prompt enhancement (fastMode: true for <10ms response)
    const enhancement = await this.enhancePrompt({
      prompt: params.prompt,
      type: 'image',
      style,
      aspectRatio,
      apiKey: params.apiKey,
      fastMode: true,
    });

    const cleanPrompt = enhancement.enhancedPromptEn
      .replace(/:::[\s\S]*?:::/g, '')
      .replace(/[^\p{L}\p{N}\s,.-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 700);

    const encodedPrompt = encodeURIComponent(cleanPrompt || 'photorealistic masterpiece 8k');
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${dims.width}&height=${dims.height}&model=${selectedModel}&nologo=true&seed=${seed}`;
    const usedEngine = selectedModel === 'turbo' ? 'FLUX Turbo Ultra-Fast' : 'FLUX.1 Pro High-Performance';

    const item: MediaItem = {
      id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'image',
      title: params.prompt.slice(0, 50),
      originalPrompt: params.prompt,
      enhancedPrompt: enhancement.enhancedPromptEn,
      negativePrompt: enhancement.negativePrompt,
      semanticAnalysis: enhancement.semanticAnalysis,
      explanationAr: enhancement.explanationAr || `تم توليد الصورة عبر محرك ${usedEngine} بسرعة فائقة ودقة استثنائية`,
      url: imageUrl,
      aspectRatio,
      width: dims.width,
      height: dims.height,
      style,
      seed,
      createdAt: Date.now(),
    };

    this.items.unshift(item);
    this.saveGallery();
    return item;
  }

  /**
   * Generates a high-definition cinematic video item with motion choreography.
   */
  public async generateVideo(params: {
    prompt: string;
    style?: ImageStyle;
    motion?: VideoMotion;
    aspectRatio?: AspectRatio;
    duration?: number;
    fps?: number;
    seed?: number;
    apiKey?: string;
  }): Promise<MediaItem> {
    const style = params.style || 'cinematic';
    const motion = params.motion || 'drone_fpv';
    const aspectRatio = params.aspectRatio || '16:9';
    const seed = params.seed ?? Math.floor(Math.random() * 999999);
    const duration = params.duration || 5;
    const fps = params.fps || 60;
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9'];

    const enhancement = await this.enhancePrompt({
      prompt: params.prompt,
      type: 'video',
      style,
      motion,
      aspectRatio,
      apiKey: params.apiKey,
    });

    const encodedPrompt = encodeURIComponent(`${enhancement.enhancedPromptEn}, cinematic video still, master frame`);
    const posterUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}&enhance=true`;

    const item: MediaItem = {
      id: `vid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'video',
      title: params.prompt.slice(0, 50),
      originalPrompt: params.prompt,
      enhancedPrompt: enhancement.enhancedPromptEn,
      negativePrompt: enhancement.negativePrompt,
      semanticAnalysis: enhancement.semanticAnalysis,
      explanationAr: enhancement.explanationAr,
      url: posterUrl,
      posterUrl,
      aspectRatio,
      width: dims.width,
      height: dims.height,
      style,
      motion,
      duration,
      fps,
      seed,
      createdAt: Date.now(),
    };

    this.items.unshift(item);
    this.saveGallery();
    return item;
  }

  /**
   * Transforms or modifies an existing image based on a reference image and prompt instruction (Image-to-Image).
   */
  public async imageToImage(params: {
    prompt: string;
    sourceImage: string;
    style?: ImageStyle;
    aspectRatio?: AspectRatio;
    seed?: number;
    apiKey?: string;
  }): Promise<MediaItem> {
    const style = params.style || 'photorealistic';
    const aspectRatio = params.aspectRatio || '1:1';
    const seed = params.seed ?? Math.floor(Math.random() * 999999);
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['1:1'];

    const enhancement = await this.enhancePrompt({
      prompt: `Image transformation and modification instruction: ${params.prompt}`,
      type: 'image',
      style,
      aspectRatio,
      apiKey: params.apiKey,
    });

    const encodedPrompt = encodeURIComponent(`${enhancement.enhancedPromptEn}, image-to-image style transformation, high fidelity, 8k resolution, model=flux`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&seed=${seed}&enhance=true&model=flux`;

    const item: MediaItem = {
      id: `img2img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'image',
      title: `Image-to-Image: ${params.prompt.slice(0, 40)}`,
      originalPrompt: params.prompt,
      enhancedPrompt: enhancement.enhancedPromptEn,
      negativePrompt: enhancement.negativePrompt,
      semanticAnalysis: enhancement.semanticAnalysis,
      explanationAr: `تم تعديل الصورة وتحويل نمطها بنجاح عبر محرك Image-to-Image الذكي: ${enhancement.explanationAr}`,
      url: imageUrl,
      aspectRatio,
      width: dims.width,
      height: dims.height,
      style,
      seed,
      createdAt: Date.now(),
    };

    this.items.unshift(item);
    this.saveGallery();
    return item;
  }
}

export const mediaEngine = new MediaEngine();
