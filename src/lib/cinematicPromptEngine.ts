/**
 * Hollywood-Grade Cinematic Prompt Engineer Layer (2026 Standard)
 * Converts basic user prompts into professional, multi-layered cinematic prompts.
 */

export type ShotType =
  | 'auto'
  | 'extreme_close_up'
  | 'close_up'
  | 'medium_shot'
  | 'wide_shot'
  | 'establishing_shot'
  | 'over_the_shoulder'
  | 'low_angle'
  | 'high_angle'
  | 'eye_level'
  | 'dutch_tilt'
  | 'worm_eye_view'
  | 'god_perspective'
  | 'macro_quantum';

export type CameraMotion =
  | 'auto'
  | 'slow_dolly_in'
  | 'tracking_shot'
  | 'crane_shot'
  | 'steadicam_glide'
  | 'static_tripod'
  | 'slow_ascending_crane'
  | 'fast_lateral'
  | 'fpv_hyperlapse'
  | 'bullet_time_matrix'
  | 'orbital_360'
  | 'vertigo_dolly_zoom';

export type LensType =
  | 'auto'
  | '35mm_prime'
  | '85mm_portrait'
  | 'anamorphic'
  | 'deep_focus'
  | 'probe_macro_lens'
  | 'hasselblad_medium_format'
  | 'vintage_anamorphic_flare';

export type LightingType =
  | 'auto'
  | 'golden_hour'
  | 'volumetric'
  | 'three_point'
  | 'harsh_noir'
  | 'backlit_silhouette'
  | 'soft_window'
  | 'practical_neon'
  | 'bioluminescent_glow'
  | 'cyber_holographic'
  | 'god_rays_celestial'
  | 'surreal_iridescent';

export type ColorGrade =
  | 'auto'
  | 'teal_orange'
  | 'desaturated_moody'
  | 'hdr_contrast'
  | 'warm_sunset'
  | 'cold_cinematic_blue'
  | 'synthwave_magenta_cyan'
  | 'matrix_emerald_glitch'
  | 'vintage_kodachrome'
  | 'quantum_monochrome';

export interface DirectorOptions {
  shotType?: ShotType;
  cameraMotion?: CameraMotion;
  lens?: LensType;
  lighting?: LightingType;
  colorGrade?: ColorGrade;
  aspectRatio?: string;
  negativePrompt?: string;
  isMultiShot?: boolean;
  characterAnchor?: string;
  environmentAnchor?: string;
  wardrobeAnchor?: string;
}

export interface ShotListItem {
  id: number;
  shotName: string;
  shotType: ShotType;
  cameraMotion: CameraMotion;
  prompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
}

export const DEFAULT_NEGATIVE_PROMPT =
  'blurry, distorted anatomy, extra limbs, low quality, watermark, oversaturated, unnatural motion, flickering, inconsistent lighting, noise, artifacts, ugly facial features, poorly drawn hands, missing fingers, low resolution, bad proportions';

export const SHOT_TYPE_MAP: Record<ShotType, { en: string; ar: string }> = {
  auto: { en: 'Auto Director Choice', ar: 'اختيار المخرج التلقائي' },
  extreme_close_up: { en: 'Extreme Close-Up (ECU)', ar: 'لقطة قريبة جدًا (تفاصيل دقيقة)' },
  close_up: { en: 'Close-Up Shot (CU)', ar: 'لقطة قريبة (تعبيرات الوجه)' },
  medium_shot: { en: 'Medium Shot (MS)', ar: 'لقطة متوسطة (نصف الجسم)' },
  wide_shot: { en: 'Wide Shot (WS)', ar: 'لقطة واسعة (المحيط والشخصية)' },
  establishing_shot: { en: 'Establishing Shot', ar: 'لقطة افتتاحية عامة للمكان' },
  over_the_shoulder: { en: 'Over-The-Shoulder (OTS)', ar: 'من فوق الكتف (حوار)' },
  low_angle: { en: 'Low Angle Shot', ar: 'زاوية منخفضة (منظور مهيب)' },
  high_angle: { en: 'High Angle Shot', ar: 'زاوية مرتفعة (منظور علوي)' },
  eye_level: { en: 'Eye-Level Shot', ar: 'مستوى العين الطبيعي' },
  dutch_tilt: { en: 'Dutch Tilt Angle', ar: 'زاوية مائلة (توتر وتشويق)' },
  worm_eye_view: { en: "Worm's-Eye Ground View", ar: 'منظور أرضي عملاق (Worm-Eye)' },
  god_perspective: { en: 'God Perspective Top-Down', ar: 'منظور علوي سماوي بانورامي' },
  macro_quantum: { en: 'Macro Quantum Hyper-Detail', ar: 'لقطة ماكرو جزيئية فائقة الدقة' },
};

export const CAMERA_MOTION_MAP: Record<CameraMotion, { en: string; ar: string }> = {
  auto: { en: 'Auto Dynamic Physics', ar: 'حركة فيزياء تلقائية' },
  slow_dolly_in: { en: 'Slow Dolly-In towards subject', ar: 'تقريب بطيء وهادئ (Dolly-In)' },
  tracking_shot: { en: 'Smooth Lateral Tracking Shot', ar: 'تتبع جانبي سلس (Tracking)' },
  crane_shot: { en: 'Sweeping High Crane Shot', ar: 'لقطة رافعة سينمائية (Crane)' },
  steadicam_glide: { en: 'Steadicam Organic Glide', ar: 'حركة ستيديكام انسيابية (Steadicam)' },
  static_tripod: { en: 'Static Tripod Shot (Locked)', ar: 'ثبات كاميرا سينمائي (Static)' },
  slow_ascending_crane: { en: 'Slow Ascending Crane Lift', ar: 'صعود رأس ببطء (Ascending Lift)' },
  fast_lateral: { en: 'Fast Lateral Motion Tracking', ar: 'تتبع حركي سريع (Fast Motion)' },
  fpv_hyperlapse: { en: 'FPV Drone Dynamic Hyperlapse', ar: 'طيران درون FPV فائق السرعة' },
  bullet_time_matrix: { en: '360° Frozen Bullet-Time Matrix', ar: 'تجميد الزمن ماتريكس بوليت تايم 360°' },
  orbital_360: { en: 'Smooth 360° Orbital Rotation', ar: 'دوران مداري دائري 360 درجة' },
  vertigo_dolly_zoom: { en: 'Vertigo Hitch-cock Dolly Zoom', ar: 'تأثير زووم الدوار (Vertigo Dolly-Zoom)' },
};

export const LENS_MAP: Record<LensType, { en: string; ar: string }> = {
  auto: { en: 'Auto Optical Selection', ar: 'عدسة تلقائية حسب المشهد' },
  '35mm_prime': { en: '35mm Prime Lens (Cinematic Perspective)', ar: 'عدسة 35mm سينمائية واسعة' },
  '85mm_portrait': { en: '85mm Portrait Lens (Creamy Bokeh)', ar: 'عدسة 85mm بورتريه مع عزل خفي' },
  anamorphic: { en: 'Anamorphic Lens (Wide Flares)', ar: 'عدسة أنامورفيك مع توهج أفق سينمائي' },
  deep_focus: { en: 'Deep Focus Lens (Full Scene Clarity)', ar: 'عمق ميداني كامل ووضوح شامل' },
  probe_macro_lens: { en: 'Laowa 24mm Probe Macro Lens', ar: 'عدسة الماكرو الأنبوبية الثورية 24mm' },
  hasselblad_medium_format: { en: 'Hasselblad Medium Format 100MP Optics', ar: 'عدسات هاسيلبلاد المتوسطة 100MP' },
  vintage_anamorphic_flare: { en: 'Vintage 1970s Anamorphic Blue Flare', ar: 'عدسة كلاسيكية بوهج أزرق كلاسيكي' },
};

export const LIGHTING_MAP: Record<LightingType, { en: string; ar: string }> = {
  auto: { en: 'Auto Intelligent Lighting', ar: 'إضاءة ذكية متكيفة' },
  golden_hour: { en: 'Golden Hour Sunset Rays', ar: 'إضاءة الساعة الذهبية والغروب Warm Sunset' },
  volumetric: { en: 'Volumetric Raytraced Beams', ar: 'أشعة ضوئية حجمية مجسمة Volumetric' },
  three_point: { en: 'Three-Point Studio Lighting', ar: 'إضاءة استوديو احترافية ثلاثية' },
  harsh_noir: { en: 'Harsh Noir Chiaroscuro Shadows', ar: 'ظلال سينمائية درامية حادة Noir' },
  backlit_silhouette: { en: 'Backlit Silhouette Glow', ar: 'إضاءة خلفية وتوهج شبحي Silhouette' },
  soft_window: { en: 'Soft Diffused Window Light', ar: 'ضوء نافذة ناعم وموزع Soft Light' },
  practical_neon: { en: 'Practical Cyberpunk Neon Lights', ar: 'إضاءة نيون واقعية غنية بالردود' },
  bioluminescent_glow: { en: 'Bioluminescent Organic Deep Glow', ar: 'توهج عضوي كيميائي خيالي Bioluminescent' },
  cyber_holographic: { en: 'Prismatic Holographic Cyber Refractions', ar: 'انكسارات هولوغرافية ليزرية مستقبلية' },
  god_rays_celestial: { en: 'God Rays Crepuscular Celestial Beams', ar: 'أشعة شمس سماوية مهيبة Crepuscular Rays' },
  surreal_iridescent: { en: 'Surreal Iridescent Pearlescent Sheen', ar: 'لمعان لؤلؤي سريالي متقلب الألوان' },
};

export const COLOR_GRADE_MAP: Record<ColorGrade, { en: string; ar: string }> = {
  auto: { en: 'Auto Color Grade', ar: 'تلوين تلقائي متناسق' },
  teal_orange: { en: 'Teal & Orange Hollywood Grade', ar: 'تلوين هوليوودي (Teal & Orange)' },
  desaturated_moody: { en: 'Desaturated Moody Tones', ar: 'ألوان باهتة درامية سوداوية Moody' },
  hdr_contrast: { en: 'High Contrast Vivid HDR', ar: 'تباين عالي وألوان غنية HDR' },
  warm_sunset: { en: 'Warm Sunset Amber Palette', ar: 'لوحة ألوان دافئة برتقالية' },
  cold_cinematic_blue: { en: 'Cold Cinematic Blue Atmosphere', ar: 'أجواء سينمائية زرقاء باردة' },
  synthwave_magenta_cyan: { en: 'Retro Synthwave Neon Magenta & Cyan', ar: 'سينث ويف نيون قرمزي وفيروزي' },
  matrix_emerald_glitch: { en: 'Matrix Phosphor Emerald Glitch', ar: 'تلوين مصفوفة ماتريكس الأخضر الزمردي' },
  vintage_kodachrome: { en: 'Vintage 1960s Kodachrome Film Grain', ar: 'ألوان كوداكروم كلاسيكية غنية بالحبيبات' },
  quantum_monochrome: { en: 'Quantum High-Contrast Silver Monochrome', ar: 'أحادي فضي عالي التباين فوتوغرافي' },
};

/**
 * Intelligently infers optimal director settings based on keywords in the prompt if set to 'auto'.
 */
export function autoInferOptions(rawPrompt: string, mediaType: 'image' | 'video' | 'nano_banana_edit'): Required<DirectorOptions> {
  const p = rawPrompt.toLowerCase();

  let shotType: ShotType = 'medium_shot';
  let cameraMotion: CameraMotion = mediaType === 'video' ? 'slow_dolly_in' : 'static_tripod';
  let lens: LensType = '35mm_prime';
  let lighting: LightingType = 'volumetric';
  let colorGrade: ColorGrade = 'teal_orange';

  // Inferences for Shot Type & Lens
  if (p.includes('وجه') || p.includes('عين') || p.includes('ملامح') || p.includes('face') || p.includes('portrait') || p.includes('close up') || p.includes('بورتريه')) {
    shotType = 'close_up';
    lens = '85mm_portrait';
  } else if (p.includes('مدينة') || p.includes('صحراء') || p.includes('جبل') || p.includes('شارع واسع') || p.includes('city') || p.includes('landscape') || p.includes('wide')) {
    shotType = 'establishing_shot';
    lens = '35mm_prime';
  } else if (p.includes('قوة') || p.includes('مهيب') || p.includes('عملاق') || p.includes('ضخم') || p.includes('low angle') || p.includes('hero')) {
    shotType = 'low_angle';
    lens = 'anamorphic';
  }

  // Inferences for Lighting & Color Grade
  if (p.includes('ليل') || p.includes('ليلا') || p.includes('ظلام') || p.includes('نيون') || p.includes('night') || p.includes('dark') || p.includes('neon')) {
    lighting = 'practical_neon';
    colorGrade = 'cold_cinematic_blue';
  } else if (p.includes('غروب') || p.includes('شمس') || p.includes('sunset') || p.includes('golden')) {
    lighting = 'golden_hour';
    colorGrade = 'warm_sunset';
  } else if (p.includes('غموض') || p.includes('رعب') || p.includes('noir') || p.includes('mystery')) {
    lighting = 'harsh_noir';
    colorGrade = 'desaturated_moody';
  }

  // Inferences for Video Motion
  if (mediaType === 'video') {
    if (p.includes('طائرة') || p.includes('طيارة') || p.includes('درون') || p.includes('drone') || p.includes('طيران')) {
      cameraMotion = 'crane_shot';
    } else if (p.includes('جري') || p.includes('ركض') || p.includes('سيارة') || p.includes('سباق') || p.includes('running') || p.includes('car')) {
      cameraMotion = 'fast_lateral';
    } else if (p.includes('مشي') || p.includes('يمشي') || p.includes('تحرك') || p.includes('walking')) {
      cameraMotion = 'steadicam_glide';
    }
  }

  return {
    shotType,
    cameraMotion,
    lens,
    lighting,
    colorGrade,
    aspectRatio: mediaType === 'video' ? '16:9' : '16:9',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    isMultiShot: false,
    characterAnchor: '',
    environmentAnchor: '',
    wardrobeAnchor: '',
  };
}

/**
 * Transforms a raw prompt into a Hollywood-Grade Cinematic Prompt
 */
export function buildCinematicPrompt(
  rawPrompt: string,
  mediaType: 'image' | 'video' | 'nano_banana_edit',
  options: DirectorOptions = {},
  style: string = 'cinematic'
): { enhancedPrompt: string; negativePrompt: string; inferredOptions: DirectorOptions } {
  const inferred = autoInferOptions(rawPrompt, mediaType);

  const selectedShotType = options.shotType && options.shotType !== 'auto' ? options.shotType : inferred.shotType;
  const selectedCameraMotion = options.cameraMotion && options.cameraMotion !== 'auto' ? options.cameraMotion : inferred.cameraMotion;
  const selectedLens = options.lens && options.lens !== 'auto' ? options.lens : inferred.lens;
  const selectedLighting = options.lighting && options.lighting !== 'auto' ? options.lighting : inferred.lighting;
  const selectedColorGrade = options.colorGrade && options.colorGrade !== 'auto' ? options.colorGrade : inferred.colorGrade;
  const finalNegativePrompt = options.negativePrompt?.trim() || DEFAULT_NEGATIVE_PROMPT;

  // 1. Environment & Lighting Description
  const lightingDesc = LIGHTING_MAP[selectedLighting]?.en || 'Volumetric cinematic lighting';
  const colorGradeDesc = COLOR_GRADE_MAP[selectedColorGrade]?.en || 'Teal and orange cinematic color grade';

  // 2. Subject & Motion
  const cleanUserPrompt = rawPrompt.trim();

  // 3. Camera Behavior & Lens
  const shotTypeDesc = SHOT_TYPE_MAP[selectedShotType]?.en || 'Medium Shot';
  const lensDesc = LENS_MAP[selectedLens]?.en || '35mm Prime Lens';
  const cameraMotionDesc = CAMERA_MOTION_MAP[selectedCameraMotion]?.en || 'Slow dolly-in';

  // 4. Anchors for consistency
  const anchors: string[] = [];
  if (options.characterAnchor?.trim()) anchors.push(`character consistency: ${options.characterAnchor.trim()}`);
  if (options.environmentAnchor?.trim()) anchors.push(`environment consistency: ${options.environmentAnchor.trim()}`);
  if (options.wardrobeAnchor?.trim()) anchors.push(`wardrobe & clothing consistency: ${options.wardrobeAnchor.trim()}`);
  const anchorString = anchors.length > 0 ? `, ${anchors.join(', ')}` : '';

  // Construct structured prompt following the 5-layer architecture
  // Layer 1: Environment & Lighting First
  // Layer 2: Subject/Character & Action
  // Layer 3: Camera Behavior & Lens
  // Layer 4: Mood & Color Grading
  // Layer 5: Technical Specs & Render Engine
  let constructed = '';

  if (mediaType === 'video') {
    constructed = `[Environment & Lighting]: Set in detailed atmospheric scene, illuminated by ${lightingDesc}. [Subject & Motion]: ${cleanUserPrompt}. [Camera Motion]: Framed in ${shotTypeDesc}, executed with ${cameraMotionDesc}, optics: ${lensDesc}. [Color & Mood]: ${colorGradeDesc}, IMAX cinematography. [Technical Specs]: 24fps cinematic motion rate, temporal consistency, lighting continuity, wardrobe consistency, ultra smooth 60fps fluid dynamics, photorealistic 8K render${anchorString}`;
  } else {
    constructed = `[Environment & Lighting]: Atmospheric surroundings lit by ${lightingDesc}. [Subject]: ${cleanUserPrompt}. [Camera & Optics]: Framed in ${shotTypeDesc}, shot on ${lensDesc}, sharp focus, shallow depth of field, creamy bokeh. [Color & Mood]: ${colorGradeDesc}, dramatic depth. [Technical Specs]: 8K UHD, photorealistic masterwork photography, 70mm IMAX cinematography, hyper-detailed render${anchorString}`;
  }

  return {
    enhancedPrompt: constructed,
    negativePrompt: finalNegativePrompt,
    inferredOptions: {
      shotType: selectedShotType,
      cameraMotion: selectedCameraMotion,
      lens: selectedLens,
      lighting: selectedLighting,
      colorGrade: selectedColorGrade,
      aspectRatio: options.aspectRatio || inferred.aspectRatio,
      negativePrompt: finalNegativePrompt,
      isMultiShot: !!options.isMultiShot,
      characterAnchor: options.characterAnchor || '',
      environmentAnchor: options.environmentAnchor || '',
      wardrobeAnchor: options.wardrobeAnchor || '',
    },
  };
}

/**
 * Generates a Multi-Shot Sequence (Shot List) with Visual Anchor Inheritance
 */
export function generateShotList(
  basePrompt: string,
  shotCount: number = 3,
  baseOptions: DirectorOptions = {}
): ShotListItem[] {
  const infer = autoInferOptions(basePrompt, 'video');

  const shots: ShotListItem[] = [];
  const shotTypes: ShotType[] = ['establishing_shot', 'medium_shot', 'close_up', 'low_angle', 'extreme_close_up'];
  const cameraMotions: CameraMotion[] = ['crane_shot', 'tracking_shot', 'slow_dolly_in', 'fast_lateral', 'steadicam_glide'];

  for (let i = 0; i < shotCount; i++) {
    const sType = shotTypes[i % shotTypes.length];
    const cMotion = cameraMotions[i % cameraMotions.length];

    const shotName = i === 0 ? 'Establishing Shot (افتتاح المشهد)' : i === 1 ? 'Action / Motion Tracking Shot (تتبع الحركة)' : `Reaction / Close-Up Shot (استجابة كلوزأب ${i + 1})`;

    const customOptions: DirectorOptions = {
      ...baseOptions,
      shotType: sType,
      cameraMotion: cMotion,
      characterAnchor: baseOptions.characterAnchor || basePrompt,
      environmentAnchor: baseOptions.environmentAnchor || basePrompt,
      wardrobeAnchor: baseOptions.wardrobeAnchor || 'consistent wardrobe across all shots',
    };

    const { enhancedPrompt, negativePrompt } = buildCinematicPrompt(basePrompt, 'video', customOptions);

    shots.push({
      id: i + 1,
      shotName,
      shotType: sType,
      cameraMotion: cMotion,
      prompt: `${basePrompt} - Shot ${i + 1}`,
      enhancedPrompt,
      negativePrompt,
    });
  }

  return shots;
}
