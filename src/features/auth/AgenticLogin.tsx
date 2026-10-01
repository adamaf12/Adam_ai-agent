import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
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
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const characterX = useSpring(useTransform(cursorX, [-1, 1], [-54, 54]), { stiffness: 125, damping: 16, mass: 0.75 });
  const characterY = useSpring(useTransform(cursorY, [-1, 1], [-32, 32]), { stiffness: 125, damping: 16, mass: 0.75 });
  const characterRotateY = useSpring(useTransform(cursorX, [-1, 1], [-27, 27]), { stiffness: 115, damping: 15, mass: 0.85 });
  const characterRotateX = useSpring(useTransform(cursorY, [-1, 1], [22, -22]), { stiffness: 115, damping: 15, mass: 0.85 });


  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    cursorX.set(Math.max(-1, Math.min(1, event.clientX / Math.max(window.innerWidth, 1) * 2 - 1)));
    cursorY.set(Math.max(-1, Math.min(1, event.clientY / Math.max(window.innerHeight, 1) * 2 - 1)));
  };

  const resetCharacter = () => {
    cursorX.set(0);
    cursorY.set(0);
  };

  const handleGoogle = async () => {
    clearError();
    await signIn();
  };

  if (!open) return null;

  return (
    <main className="agentic-login" dir={isAr ? 'rtl' : 'ltr'} onPointerMove={handlePointerMove} onPointerLeave={resetCharacter}>
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
        <motion.div
          className="agentic-login__character"
          style={{
            x: characterX,
            y: characterY,
            rotateX: characterRotateX,
            rotateY: characterRotateY,
            transformPerspective: 1100,
          }}
        >
          <motion.div
            className="agentic-login__character-idle"
            animate={{ y: [0, -8, 0], rotateZ: [-0.6, 0.6, -0.6], scale: [1, 1.018, 1] }}
            transition={{
              y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
              rotateZ: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <img
              className="agentic-login__character-image"
              src="/adam-character.svg"
              alt=""
              draggable={false}
              loading="eager"
            />

          </motion.div>
        </motion.div>

        <div className="agentic-login__character-hud">
          <span className="agentic-login__character-hud-kicker">ADAM / 3D CORE</span>
          <strong>{isAr ? 'نواة آدم — جاهزة للعمل' : 'Adam Core — Online'}</strong>
          <small><i /> {isAr ? 'تفاعل حي • تتبع الماوس • جلسة خاصة' : 'Live interaction • mouse tracking • private session'}</small>
        </div>
      </div>

      <motion.section
        className="agentic-login__card"
        initial={{ opacity: 0, y: 32, scale: .94, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: .75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="agentic-login__card-glow" />
        <div className="agentic-login__brand">
          <motion.div
            className="agentic-login__logo"
            animate={{ rotateY: [0, 180, 360], boxShadow: ['0 0 0 0 rgba(45,212,191,0)', '0 0 0 14px rgba(45,212,191,.08)', '0 0 0 0 rgba(45,212,191,0)'] }}
            transition={{ rotateY: { duration: 7, repeat: Infinity, ease: 'linear' }, boxShadow: { duration: 2.8, repeat: Infinity } }}
          >
            <Sparkles size={23} />
          </motion.div>
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
          {features.map(({ icon: Icon, ar, en }, i) => (
            <motion.div
              key={en}
              initial={{ opacity: 0, x: isAr ? 14 : -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: .2 + i * .09 }}
            >
              <Icon size={17} />
              <span>{isAr ? ar : en}</span>
              <CheckCircle2 size={14} />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="agentic-login__error"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

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
      </motion.section>

      <div className="agentic-login__footer">
        <span>ADAM AI</span><span>•</span><span>AGENTIC INTELLIGENCE</span><span>•</span><span>GENERAL AGENT</span>
      </div>
    </main>
  );
}
