import type { Theme } from './domain';

export type ThemeCatalogItem = {
  id: Theme;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  tone: 'system' | 'light' | 'dark' | 'glass' | 'glass-dark' | 'aurora';
};

export const THEME_CATALOG: readonly ThemeCatalogItem[] = [
  { id: 'system', label: { ar: 'النظام', en: 'System' }, description: { ar: 'يتبع مظهر جهازك تلقائيًا.', en: 'Follows your device appearance automatically.' }, tone: 'system' },
  { id: 'light', label: { ar: 'فاتح', en: 'Light' }, description: { ar: 'واجهة نظيفة وواضحة للعمل اليومي.', en: 'Clean and bright for everyday work.' }, tone: 'light' },
  { id: 'dark', label: { ar: 'داكن', en: 'Dark' }, description: { ar: 'هدوء بصري مع تباين مريح.', en: 'Calm contrast for focused work.' }, tone: 'dark' },
  { id: 'glass', label: { ar: 'Glass', en: 'Glass' }, description: { ar: 'زجاج شفاف بإحساس مستقبلي خفيف.', en: 'Translucent glass with a refined feel.' }, tone: 'glass' },
  { id: 'glass-dark', label: { ar: 'Glass Dark', en: 'Glass Dark' }, description: { ar: 'زجاج داكن عميق للمظهر الليلي.', en: 'Deep glass for a premium night mode.' }, tone: 'glass-dark' },
  { id: 'aurora', label: { ar: 'Aurora', en: 'Aurora' }, description: { ar: 'توهج لوني هادئ بطابع سينمائي.', en: 'Soft cinematic color with an aurora glow.' }, tone: 'aurora' },
] as const;
