import type { AppPreferences, Language } from '../../core/domain';

export type OnboardingStep = 'welcome' | 'language' | 'workspace' | 'ready';
export interface OnboardingState { agentName: string; language: Language; connected: string[]; step: OnboardingStep; }
export const STEPS: OnboardingStep[] = ['welcome', 'language', 'workspace', 'ready'];
export function nextStep(step: OnboardingStep): OnboardingStep { return STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]; }
export function previousStep(step: OnboardingStep): OnboardingStep { return STEPS[Math.max(STEPS.indexOf(step) - 1, 0)]; }
export function canContinue(state: OnboardingState): boolean { return state.step !== 'welcome' || state.agentName.trim().length >= 2; }
export function initialOnboarding(preferences: AppPreferences): OnboardingState { return { agentName: preferences.agentName, language: preferences.language, connected: [], step: 'welcome' }; }
