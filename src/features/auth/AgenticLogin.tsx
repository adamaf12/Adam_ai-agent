import React, { useState, useCallback } from 'react';
import { ArrowRight, BrainCircuit, CheckCircle2, LockKeyhole, Network, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import type { Language } from '../../core/domain';

interface AgenticLoginProps {
  language: Language;
  loading?: boolean;
  onOpenAuth?: () => void;
  open?: boolean;
  onClose?: () => void;
  onOpenFallbackAuth?: () => void;
}

const features = [
  { icon: BrainCircuit, ar: 'يفهم الهدف ويحوّله إلى خطة تنفيذ', en: 'Understands goals and turns them into execution plans' },
  { icon: Network, ar: 'يوحّد الوكلاء والأدوات في سير عمل واحد', en: 'Orchestrates agents and tools in one workflow' },
  { icon: Zap, ar: 'ينفّذ ويتحقق ويتعافى من الأخطاء ضمن الحدود', en: 'Executes, verifies and recovers within safe boundaries' },
];

export function AgenticLogin({ language, loading = false, onOpenAuth, open = true, onClose, onOpenFallbackAuth }: AgenticLoginProps) {
  const { signIn, signInAsGuest, error, clearError } = useAuth();
  const isAr = language === 'ar';
  const fallbackAuth = onOpenFallbackAuth || onOpenAuth;

  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const nx = Math.max(-1, Math.min(1, (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1));
    setCoords({ x: nx, y: ny });
  }, []);

  const resetCharacter = useCallback(() => {
    setCoords({ x: 0, y: 0 });
  }, []);

  const handleGoogle = async () => {
    clearError();
    await signIn();
  };

  if (!open) return null;

  const characterX = coords.x * 54;
  const characterY = coords.y * 32;
  const characterRotateY = coords.x * 27;
  const characterRotateX = coords.y * -22;

  return (
    <main
      className="agentic-login"
      dir={isAr ? 'rtl' : 'ltr'}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCharacter}
    >
      {onClose && (
        <button
          type="button"
          className="agentic-login__close"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          title={isAr ? 'إغلاق' : 'Close'}
        >
          ×
        </button>
      )}
      <div className="agentic-login__backdrop" aria-hidden="true" />
      <div className="agentic-login__noise" aria-hidden="true" />
      <div className="agentic-login__aurora agentic-login__aurora--one" />
      <div className="agentic-login__aurora agentic-login__aurora--two" />
      <div className="agentic-login__grid" />

      <div className="agentic-login__scene" aria-hidden="true">
        <div
          className="agentic-login__character transition-transform duration-300 ease-out"
          style={{
            transform: `perspective(1100px) translate3d(${characterX}px, ${characterY}px, 0px) rotateX(${characterRotateX}deg) rotateY(${characterRotateY}deg)`,
          }}
        >
          <div className="agentic-login__character-idle">
            <img
              className="agentic-login__character-image"
              src="/adam-character.svg"
              alt=""
              draggable={false}
              loading="eager"
            />
          </div>
        </div>

        <div className="agentic-login__character-hud">
          <span className="agentic-login__character-hud-kicker">ADAM / 3D CORE</span>
          <strong>{isAr ? 'نواة آدم — جاهزة للعمل' : 'Adam Core — Online'}</strong>
          <small><i /> {isAr ? 'تفاعل حي • تتبع الماوس • جلسة خاصة' : 'Live interaction • mouse tracking • private session'}</small>
        </div>
      </div>

      <section className="agentic-login__card">
        <div className="agentic-login__card-glow" />
        <div className="agentic-login__brand">
          <div className="agentic-login__logo animate-pulse">
            <Sparkles size={23} />
          </div>
          <div>
            <div className="agentic-login__name">Adam <span>AI</span></div>
            <div className="agentic-login__status"><span /> {isAr ? 'General Agentic AI' : 'General Agentic AI'}</div>
          </div>
        </div>

        <div className="agentic-login__headline">
          <div className="agentic-login__access-line">
            <span className="agentic-login__eyebrow">{isAr ? 'PROFILE ACCESS' : 'PROFILE ACCESS'}</span>
            <span className="agentic-login__access-state"><i /> SECURE</span>
          </div>
          <h1>{isAr ? 'مرحباً بك في آدم' : 'Welcome Back'}</h1>
          <p>
            {isAr
              ? 'من محادثة عادية إلى وكيل عام: يفهم نيتك، يبني الخطة، ينسّق الأدوات، ينفّذ، ثم يتحقق من النتيجة.'
              : 'From chat to a general agent: understand intent, build the plan, orchestrate tools, execute, then verify the result.'}
          </p>
        </div>

        <div className="agentic-login__features">
          {features.map(({ icon: Icon, ar, en }) => (
            <div key={en} className="flex items-center gap-2">
              <Icon size={17} />
              <span>{isAr ? ar : en}</span>
              <CheckCircle2 size={14} className="ms-auto text-emerald-400" />
            </div>
          ))}
        </div>

        {error && (
          <div className="agentic-login__error">
            {error}
          </div>
        )}

        <button className="agentic-login__google" onClick={handleGoogle} disabled={loading}>
          <span className="agentic-login__google-icon">G</span>
          {loading ? (isAr ? 'جاري تأمين الجلسة...' : 'Securing your session...') : (isAr ? 'المتابعة بحساب Google' : 'Continue with Google')}
          <ArrowRight size={17} />
        </button>

        <button className="agentic-login__guest" onClick={() => signInAsGuest(isAr ? 'مستخدم آدم' : 'Adam User')}>
          {isAr ? 'الدخول الفوري كزائر' : 'Enter instantly as guest'}
        </button>

        <div className="agentic-login__security">
          <LockKeyhole size={14} />
          <span>{isAr ? 'جلسة خاصة وعزل لبيانات المستخدم' : 'Private session with isolated user data'}</span>
        </div>

        {fallbackAuth && (
          <button className="agentic-login__fallback" onClick={fallbackAuth}>
            {isAr ? 'خيارات تسجيل الدخول الأخرى' : 'Other sign-in options'}
          </button>
        )}
      </section>

      <div className="agentic-login__footer">
        <span>ADAM AI</span><span>•</span><span>AGENTIC INTELLIGENCE</span><span>•</span><span>GENERAL AGENT</span>
      </div>
    </main>
  );
}
