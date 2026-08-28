// Audio synthesizer and mobile vibration dispatcher for AutoHeal & Error Alert system

export type AlertSoundType =
  | 'none'
  | 'radar_pulse'
  | 'cyber_chime'
  | 'crystal_bell'
  | 'tech_warning'
  | 'subtle_blip'
  | 'healing_chime';

export type AlertVibrationPattern =
  | 'none'
  | 'single_short'
  | 'double_pulse'
  | 'triple_pulse'
  | 'heartbeat'
  | 'sos_pattern'
  | 'long_buzz';

export interface SoundOption {
  id: AlertSoundType;
  nameAr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface VibrationOption {
  id: AlertVibrationPattern;
  nameAr: string;
  nameEn: string;
  pattern: number[];
  descriptionAr: string;
  descriptionEn: string;
}

export const ALERT_SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'healing_chime',
    nameAr: 'نغمة التعافي والشفاء 🔮',
    nameEn: 'Healing Harmonizer 🔮',
    icon: 'Sparkles',
    descriptionAr: 'نغمة بلورية تصاعدية هادئة تؤكد نجاح وتصحيح الكود',
    descriptionEn: 'Gentle harmonic ascending crystal chime',
  },
  {
    id: 'cyber_chime',
    nameAr: 'رنين سايبر مستقبلي ⚡',
    nameEn: 'Cyber Synth Chime ⚡',
    icon: 'Zap',
    descriptionAr: 'نغمة إلكترونية متطورة بنبضات ثنائية',
    descriptionEn: 'Dual futuristic synthesizer pulse',
  },
  {
    id: 'radar_pulse',
    nameAr: 'نبض الرادار والماسح 📡',
    nameEn: 'Radar Pulse 📡',
    icon: 'Radio',
    descriptionAr: 'تنبيه بتردد مزدوج للرصد البرمجي الذاتي',
    descriptionEn: 'Dual frequency sweeping alert sonar',
  },
  {
    id: 'crystal_bell',
    nameAr: 'جرس بلوري نقي 🔔',
    nameEn: 'Crystal Bell 🔔',
    icon: 'Bell',
    descriptionAr: 'رنين بلوري عالي النقاء للتنبيه الهادئ',
    descriptionEn: 'High frequency crisp bell chime',
  },
  {
    id: 'tech_warning',
    nameAr: 'إنذار تقني وقور ⚠️',
    nameEn: 'Tech Warning ⚠️',
    icon: 'AlertTriangle',
    descriptionAr: 'نغمة تنبيه دقيقة من طبقتين صوتيتين',
    descriptionEn: 'Two-tone decisive technician alert',
  },
  {
    id: 'subtle_blip',
    nameAr: 'نقرة خافتة سريعة 💧',
    nameEn: 'Subtle Blip 💧',
    icon: 'Activity',
    descriptionAr: 'صوت خفيف جداً ومريح للعمل دون إزعاج',
    descriptionEn: 'Minimal soft micro-blip',
  },
  {
    id: 'none',
    nameAr: 'صامت (بدون صوت) 🔕',
    nameEn: 'Silent (No Sound) 🔕',
    icon: 'VolumeX',
    descriptionAr: 'تعطيل الصوت تماماً',
    descriptionEn: 'Mute alert sounds completely',
  },
];

export const ALERT_VIBRATION_OPTIONS: VibrationOption[] = [
  {
    id: 'double_pulse',
    nameAr: 'نبضة مزدوجة ذكية (Double Pulse) 📳',
    nameEn: 'Smart Double Pulse 📳',
    pattern: [70, 60, 70],
    descriptionAr: 'اهتزازان سريعان مريحان لليد',
    descriptionEn: 'Two crisp responsive micro-vibrations',
  },
  {
    id: 'triple_pulse',
    nameAr: 'نبضات ثلاثية سريعة (Triple Pulse) ⚡',
    nameEn: 'Triple Pulse ⚡',
    pattern: [60, 40, 60, 40, 60],
    descriptionAr: 'ثلاث نبضات سريعة لتأكيد إصلاح الأخطاء',
    descriptionEn: 'Three rapid tactile pulses',
  },
  {
    id: 'single_short',
    nameAr: 'نقرة لمسية قصيرة (Haptic Click) 🔘',
    nameEn: 'Single Haptic Click 🔘',
    pattern: [50],
    descriptionAr: 'نقرة واحدة خفيفة ولطيفة',
    descriptionEn: 'Single discreet subtle vibration',
  },
  {
    id: 'heartbeat',
    nameAr: 'نبضات القلب (Heartbeat) 💓',
    nameEn: 'Heartbeat Rhythm 💓',
    pattern: [100, 100, 200, 100, 100],
    descriptionAr: 'نمط اهتزاز إيقاعي يشبه نبض القلب',
    descriptionEn: 'Heartbeat rhythm simulation',
  },
  {
    id: 'sos_pattern',
    nameAr: 'نمط الاستغاثة والإنقاذ (Rescue SOS) 🚨',
    nameEn: 'Emergency Rescue (SOS) 🚨',
    pattern: [50, 40, 50, 40, 50, 100, 150, 60, 150, 60, 150, 100, 50, 40, 50],
    descriptionAr: 'نمط اهتزاز غني للأخطاء البرمجية الهامة',
    descriptionEn: 'Distinct SOS cadence pattern',
  },
  {
    id: 'long_buzz',
    nameAr: 'اهتزاز ممتد (Long Buzz) 📳',
    nameEn: 'Continuous Solid Buzz 📳',
    pattern: [280],
    descriptionAr: 'اهتزاز مميز لمدة ربع ثانية',
    descriptionEn: 'Solid quarter-second vibration feedback',
  },
  {
    id: 'none',
    nameAr: 'بدون اهتزاز 🚫',
    nameEn: 'No Vibration 🚫',
    pattern: [],
    descriptionAr: 'تعطيل الاهتزاز كلياً',
    descriptionEn: 'Disable mobile vibration feedback',
  },
];

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Synthesizes pure crystal audio alerts using Web Audio API without needing external mp3 files.
 */
export function playAlertSound(soundType: AlertSoundType = 'healing_chime', volume: number = 0.4): void {
  if (soundType === 'none') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0.05), 1.0), now);
    masterGain.connect(ctx.destination);

    switch (soundType) {
      case 'healing_chime': {
        // Ascending harmonic chords: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz) -> E6 (1318.5Hz)
        const notes = [698.46, 880.0, 1046.5, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          noteGain.gain.setValueAtTime(0, now + idx * 0.06);
          noteGain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.5);
        });
        break;
      }

      case 'cyber_chime': {
        // Tech dual sine with slight detune
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6

        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.18); // E6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);
        break;
      }

      case 'radar_pulse': {
        // Dual sweeping ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case 'crystal_bell': {
        // High pure bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }

      case 'tech_warning': {
        // Two-tone warning beep
        const freqs = [440, 880];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + i * 0.12);

          gain.gain.setValueAtTime(0.18, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.1);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.12);
        });
        break;
      }

      case 'subtle_blip': {
        // Quick gentle droplet
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
    }
  } catch (err) {
    console.warn('Could not synthesize alert audio:', err);
  }
}

/**
 * Triggers tactile mobile vibration using Navigator.vibrate API
 */
export function triggerAlertVibration(patternType: AlertVibrationPattern = 'double_pulse'): void {
  if (patternType === 'none') return;
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  const option = ALERT_VIBRATION_OPTIONS.find((o) => o.id === patternType);
  if (!option || option.pattern.length === 0) return;

  try {
    navigator.vibrate(option.pattern);
  } catch (e) {
    console.warn('Vibration API error:', e);
  }
}

/**
 * Combined alert dispatcher for AutoHealEngine & diagnostics
 */
export function dispatchAutoHealAlert(
  soundType: AlertSoundType = 'healing_chime',
  vibrationType: AlertVibrationPattern = 'double_pulse',
  volume: number = 0.4
): void {
  playAlertSound(soundType, volume);
  triggerAlertVibration(vibrationType);
}
