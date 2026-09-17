import { ArrowLeft, ArrowRight, CalendarDays, Check, Cloud, Mail, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AppPreferences } from '../../core/domain';
import { initialOnboarding, nextStep, previousStep, type OnboardingState } from './onboardingModel';

export function Onboarding({ initial, onComplete }: { initial: AppPreferences; onComplete: (preferences: AppPreferences) => void }) {
  const [state, setState] = useState<OnboardingState>(() => initialOnboarding(initial));
  const isArabic = state.language === 'ar';
  const labels = useMemo(() => isArabic ? {
    welcome: 'مرحباً بك في آدم (ADEM)',
    name: 'كيف تحب أن نناديك؟',
    language: 'اختر لغة الواجهة المفضلة',
    workspace: 'ربط وتكامل مساحة العمل',
    ready: 'المنظومة جاهزة للانطلاق',
    next: 'متابعة',
    back: 'السابق',
    finish: 'بدء استخدام المنظومة',
    optional: 'اختياري - يمكنك التخطي والإعداد لاحقاً'
  } : {
    welcome: 'Welcome to ADEM',
    name: 'What should we call you?',
    language: 'Choose your interface language',
    workspace: 'Connect your workspace',
    ready: 'All systems online & ready',
    next: 'Continue',
    back: 'Back',
    finish: 'Launch ADEM',
    optional: 'Optional - you can configure this anytime later'
  }, [isArabic]);

  const direction = isArabic ? 'rtl' : 'ltr';
  const stepIndex = ['welcome', 'language', 'workspace', 'ready'].indexOf(state.step);
  const advance = () => state.step === 'ready'
    ? onComplete({ agentName: state.agentName.trim() || 'ADEM', language: state.language, theme: 'system', onboardingComplete: true })
    : setState((s) => ({ ...s, step: nextStep(s.step) }));

  const toggle = (service: string) => setState((s) => ({
    ...s,
    connected: s.connected.includes(service) ? s.connected.filter((x) => x !== service) : [...s.connected, service]
  }));

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--text)] transition-colors" dir={direction}>
      <div className="max-w-md w-full rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-md">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 shadow-sm"
            style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8 mt-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)] shadow-sm">
            <Sparkles size={20} className="fill-current" />
          </div>
          <div>
            <span className="text-base font-black tracking-widest text-[var(--text)] font-mono">ADEM</span>
            <span className="text-[10px] block text-[var(--muted)] uppercase font-semibold">Executive AI Agent</span>
          </div>
        </div>

        {/* Step Views */}
        <div className="min-h-[260px] flex flex-col justify-center">
          {state.step === 'welcome' && (
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[var(--accent)]">01 / 04</span>
              <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">{labels.welcome}</h1>
              <p className="text-xs sm:text-sm text-[var(--muted)]">{labels.name}</p>
              <input
                autoFocus
                value={state.agentName}
                onChange={(e) => setState((s) => ({ ...s, agentName: e.target.value }))}
                maxLength={40}
                placeholder="ADEM / آدم"
                onKeyDown={(e) => e.key === 'Enter' && advance()}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
              />
            </div>
          )}

          {state.step === 'language' && (
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[var(--accent)]">02 / 04</span>
              <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">{labels.language}</h1>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {([['ar', 'العربية'], ['en', 'English']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setState((s) => ({ ...s, language: value }))}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      state.language === value
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] font-bold shadow-md'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-base">{label}</span>
                    {state.language === value && <Check size={18} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.step === 'workspace' && (
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[var(--accent)]">03 / 04</span>
              <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">{labels.workspace}</h1>
              <p className="text-xs text-[var(--muted)]">{labels.optional}</p>
              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'google', icon: Cloud, label: 'Google Workspace' },
                  { id: 'calendar', icon: CalendarDays, label: 'Google Calendar' },
                  { id: 'mail', icon: Mail, label: 'Email Integration' },
                ].map(({ id, icon: Icon, label }) => {
                  const active = state.connected.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggle(id)}
                      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)] font-bold'
                          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span className="text-xs font-semibold">{label}</span>
                      </div>
                      {active && <Check size={18} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {state.step === 'ready' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[var(--accent-subtle)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]">
                <Check size={28} />
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent)] block">04 / 04</span>
              <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">{labels.ready}</h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {isArabic ? `${state.agentName || 'المستخدم'}، منظومة ADEM جاهزة لخدمتك بكامل طاقتها.` : `${state.agentName || 'User'}, ADEM is ready to accelerate your workflow.`}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-[var(--border)]">
          {stepIndex > 0 ? (
            <button
              onClick={() => setState((s) => ({ ...s, step: previousStep(s.step) }))}
              className="px-4 py-2.5 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 transition cursor-pointer"
            >
              {isArabic ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              {labels.back}
            </button>
          ) : <div />}

          <button
            onClick={advance}
            disabled={state.step === 'welcome' && state.agentName.trim().length < 2}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-2 transition shadow-md shadow-[var(--accent-glow)] disabled:opacity-40 cursor-pointer"
          >
            <span>{state.step === 'ready' ? labels.finish : labels.next}</span>
            {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
