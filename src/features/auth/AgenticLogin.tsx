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
  { icon: BrainCircuit, ar: 'تفكير وتخطيط متعدد الخطوات', en: 'Multi-step reasoning & planning' },
  { icon: Network, ar: 'Agents وأدوات تعمل معًا', en: 'Agents and tools working together' },
  { icon: Zap, ar: 'تنفيذ ومراقبة وتصحيح ذاتي', en: 'Execution, monitoring & self-recovery' },
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
      <div className="agentic-login__aurora agentic-login__aurora--one" />
      <div className="agentic-login__aurora agentic-login__aurora--two" />
      <div className="agentic-login__grid" />

      <motion.div
        className="agentic-login__orb"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ rotate: { duration: 28, repeat: Infinity, ease: 'linear' }, scale: { duration: 5, repeat: Infinity } }}
      >
        <div className="agentic-login__orb-core"><Bot size={42} strokeWidth={1.5} /></div>
      </motion.div>

      <motion.section
        className="agentic-login__card"
        initial={{ opacity: 0, y: 28, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="agentic-login__brand">
          <motion.div className="agentic-login__logo"
            animate={{ boxShadow: ['0 0 0 0 rgba(45,212,191,0)', '0 0 0 14px rgba(45,212,191,.08)', '0 0 0 0 rgba(45,212,191,0)'] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          ><Sparkles size={23} /></motion.div>
          <div>
            <div className="agentic-login__name">ADAM</div>
            <div className="agentic-login__status"><span /> {isAr ? 'وكيل ذكاء اصطناعي عام وتنفيذي' : 'General Agentic AI'}</div>
          </div>
        </div>

        <div className="agentic-login__headline">
          <span className="agentic-login__eyebrow">{isAr ? 'PERSONAL AI OPERATING SYSTEM' : 'PERSONAL AI OPERATING SYSTEM'}</span>
          <h1>{isAr ? 'مرحباً بك في آدم' : 'Welcome to Adam'}</h1>
          <p>{isAr
            ? 'وكيل عام يفهم الهدف، يخطط، يستخدم الأدوات، ينفّذ، ثم يتحقق من النتيجة.'
            : 'A general agent that understands goals, plans, uses tools, executes, and verifies the result.'}</p>
        </div>

        <div className="agentic-login__features">
          {features.map(({ icon: Icon, ar, en }, i) => (
            <motion.div key={en} initial={{ opacity: 0, x: isAr ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .18 + i * .08 }}>
              <Icon size={17} /><span>{isAr ? ar : en}</span><CheckCircle2 size={14} />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {error && <motion.div className="agentic-login__error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>{error}</motion.div>}
        </AnimatePresence>

        <button className="agentic-login__google" onClick={handleGoogle} disabled={loading}>
          <span className="agentic-login__google-icon">G</span>
          {loading ? (isAr ? 'جاري تأمين الجلسة...' : 'Securing your session...') : (isAr ? 'المتابعة بحساب Google' : 'Continue with Google')}
          <ArrowRight size={17} />
        </button>

        <button className="agentic-login__guest" onClick={() => signInAsGuest(isAr ? 'مستخدم آدم' : 'Adam User')}>
          {isAr ? 'تجربة آدم كزائر' : 'Try Adam as a guest'}
        </button>

        <div className="agentic-login__security"><LockKeyhole size={14} /><span>{isAr ? 'جلسة منفصلة وبيانات المستخدم معزولة' : 'Private session with isolated user data'}</span></div>
        {onOpenAuth && <button className="agentic-login__fallback" onClick={onOpenAuth}>{isAr ? 'خيارات تسجيل الدخول الأخرى' : 'Other sign-in options'}</button>}
      </motion.section>

      <div className="agentic-login__footer"><span>ADAM AI</span><span>•</span><span>AGENTIC INTELLIGENCE</span></div>
    </main>
  );
}
