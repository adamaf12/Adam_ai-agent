import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Bot, BrainCircuit, CheckCircle2, LockKeyhole, Network, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import type { Language } from '../../core/domain';

interface AgenticLoginProps {
  language: Language;
  loading?: boolean;
  onOpenAuth?: () => void;
}

const features = [
  { icon: BrainCircuit, ar: 'يفهم الهدف ويحوّله إلى خطة تنفيذ', en: 'Understands goals and turns them into execution plans' },
  { icon: Network, ar: 'يوحّد الوكلاء والأدوات في سير عمل واحد', en: 'Orchestrates agents and tools in one workflow' },
  { icon: Zap, ar: 'ينفّذ ويتحقق ويتعافى من الأخطاء ضمن الحدود', en: 'Executes, verifies and recovers within safe boundaries' },
];

export function AgenticLogin({ language, loading = false, onOpenAuth }: AgenticLoginProps) {
  const { signIn, signInAsGuest, error, clearError } = useAuth();
  const isAr = language === 'ar';

  const handleGoogle = async () => {
    clearError();
    await signIn();
  };

  return (
    <main className="agentic-login" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="agentic-login__noise" aria-hidden="true" />
      <div className="agentic-login__aurora agentic-login__aurora--one" />
      <div className="agentic-login__aurora agentic-login__aurora--two" />
      <div className="agentic-login__grid" />

      <div className="agentic-login__scene" aria-hidden="true">
        <motion.div
          className="agentic-login__planet"
          animate={{ rotateY: 360, rotateZ: [0, 2, -2, 0], scale: [1, 1.025, 1] }}
          transition={{
            rotateY: { duration: 22, repeat: Infinity, ease: 'linear' },
            rotateZ: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className="agentic-login__planet-atmosphere" />
          <div className="agentic-login__planet-grid" />
          <div className="agentic-login__planet-core">
            <motion.div
              className="agentic-login__planet-pulse"
              animate={{ scale: [0.86, 1.18, 0.86], opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Bot size={54} strokeWidth={1.25} />
            <span>ADAM</span>
          </div>
        </motion.div>

        <motion.div className="agentic-login__ring agentic-login__ring--one" animate={{ rotateZ: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}>
          <i />
        </motion.div>
        <motion.div className="agentic-login__ring agentic-login__ring--two" animate={{ rotateZ: -360, rotateX: 64 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
          <i />
        </motion.div>
        <motion.div className="agentic-login__ring agentic-login__ring--three" animate={{ rotateZ: 360, rotateY: 62 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}>
          <i />
        </motion.div>

        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="agentic-login__particle"
            style={{
              '--px': `${(i * 47) % 92}%`,
              '--py': `${(i * 31) % 88}%`,
              '--delay': `${(i % 7) * 0.35}s`,
            } as React.CSSProperties}
            animate={{ y: [0, -12, 0], opacity: [0.12, 0.75, 0.12], scale: [0.7, 1.2, 0.7] }}
            transition={{ duration: 3.5 + (i % 4), repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
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
            <div className="agentic-login__name">ADAM</div>
            <div className="agentic-login__status"><span /> {isAr ? 'General Agentic AI' : 'General Agentic AI'}</div>
          </div>
        </div>

        <div className="agentic-login__headline">
          <span className="agentic-login__eyebrow">{isAr ? 'PERSONAL AI OPERATING SYSTEM' : 'PERSONAL AI OPERATING SYSTEM'}</span>
          <h1>{isAr ? 'مرحباً بك في آدم' : 'Welcome to Adam'}</h1>
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

        {onOpenAuth && (
          <button className="agentic-login__fallback" onClick={onOpenAuth}>
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
