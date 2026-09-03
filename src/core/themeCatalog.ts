import type { Theme } from './domain';

export type ThemeCatalogItem = { id: Theme; label: { ar: string; en: string }; description: { ar: string; en: string }; tone: 'system' | 'light' | 'dark' | 'aurora'; };

export const THEME_CATALOG: readonly ThemeCatalogItem[] = [
  { id:'system', label:{ar:'النظام',en:'System'}, description:{ar:'يتبع مظهر جهازك تلقائيًا.',en:'Follows your device appearance automatically.'}, tone:'system' },
  { id:'light', label:{ar:'فاتح',en:'Light'}, description:{ar:'واجهة واضحة ومريحة للاستخدام اليومي.',en:'Clean and bright for everyday use.'}, tone:'light' },
  { id:'dark', label:{ar:'داكن',en:'Dark'}, description:{ar:'مظهر هادئ للتركيز والمحادثات الطويلة.',en:'Calm contrast for focused conversations.'}, tone:'dark' },
  { id:'aurora', label:{ar:'Aurora',en:'Aurora'}, description:{ar:'توهج لوني اختياري بطابع Adam.',en:'An optional cinematic color glow.'}, tone:'aurora' },
] as const;

export const GLASS_OPTION = {
  label: { ar:'Glass', en:'Glass' },
  description: { ar:'طبقة زجاجية اختيارية فوق أي ثيم — لا تغيّر هوية Adam.', en:'An optional glass layer over any theme — Adam stays Adam.' },
} as const;
