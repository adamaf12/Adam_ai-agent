import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
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
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const characterX = useSpring(useTransform(cursorX, [-1, 1], [-30, 30]), { stiffness: 120, damping: 18, mass: 0.8 });
  const characterY = useSpring(useTransform(cursorY, [-1, 1], [-18, 18]), { stiffness: 120, damping: 18, mass: 0.8 });
  const characterRotateY = useSpring(useTransform(cursorX, [-1, 1], [-18, 18]), { stiffness: 110, damping: 16, mass: 0.9 });
  const characterRotateX = useSpring(useTransform(cursorY, [-1, 1], [14, -14]), { stiffness: 110, damping: 16, mass: 0.9 });
  const characterGlowX = useTransform(cursorX, [-1, 1], ['22%', '78%']);
  const characterGlowY = useTransform(cursorY, [-1, 1], ['18%', '82%']);
  const [characterSrc, setCharacterSrc] = useState('https://i.pinimg.com/originals/b9/29/84/b92984d3cf394fb4421bd48e9641c964.jpg');

  useEffect(() => {
    let disposed = false;
    const source = 'https://i.pinimg.com/originals/b9/29/84/b92984d3cf394fb4421bd48e9641c964.jpg';
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (disposed) return;
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, width, height);
        const data = pixels.data;
        const rowBackground = new Float32Array(height * 3);
        const border = Math.max(16, Math.floor(width * 0.045));

        // Estimate the orange studio backdrop row-by-row from both side borders.
        for (let y = 0; y < height; y += 1) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let x = 0; x < border; x += 2) {
            const i = (y * width + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
          }
          for (let x = width - border; x < width; x += 2) {
            const i = (y * width + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
          }
          rowBackground[y * 3] = r / count;
          rowBackground[y * 3 + 1] = g / count;
          rowBackground[y * 3 + 2] = b / count;
        }

        // Build a chroma/texture-aware background candidate, then flood-fill only
        // regions connected to the canvas edges. This preserves the orange sweater.
        const candidate = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let head = 0, tail = 0;
        const mark = (x: number, y: number) => {
          const p = y * width + x;
          if (candidate[p] === 1) {
            candidate[p] = 2;
            queue[tail++] = p;
          }
        };

        for (let y = 0; y < height; y += 1) {
          for (const x of [0, width - 1]) mark(x, y);
        }
        for (let x = 0; x < width; x += 1) {
          mark(x, 0);
          mark(x, height - 1);
        }

        for (let y = 0; y < height; y += 1) {
          const br = rowBackground[y * 3];
          const bg = rowBackground[y * 3 + 1];
          const bb = rowBackground[y * 3 + 2];
          for (let x = 0; x < width; x += 1) {
            const p = y * width + x;
            const i = p * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const dr = r - br, dg = g - bg, db = b - bb;
            const distance = Math.sqrt(dr * dr + dg * dg + db * db);
            const left = x > 0 ? ((data[i - 4] + data[i - 3] + data[i - 2]) / 3) : ((r + g + b) / 3);
            const right = x + 1 < width ? ((data[i + 4] + data[i + 5] + data[i + 6]) / 3) : ((r + g + b) / 3);
            const up = y > 0 ? ((data[i - width * 4] + data[i - width * 4 + 1] + data[i - width * 4 + 2]) / 3) : ((r + g + b) / 3);
            const down = y + 1 < height ? ((data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3) : ((r + g + b) / 3);
            const texture = Math.abs(left - right) + Math.abs(up - down);
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
            candidate[p] = distance < 48 && texture < 55 && saturation > 0.35 && maxChannel > 125 ? 1 : 0;
          }
        }

        // Re-seed only from actual border pixels.
        head = 0; tail = 0;
        for (let y = 0; y < height; y += 1) {
          if (candidate[y * width] === 1) mark(0, y);
          if (candidate[y * width + width - 1] === 1) mark(width - 1, y);
        }
        for (let x = 0; x < width; x += 1) {
          if (candidate[x] === 1) mark(x, 0);
          if (candidate[(height - 1) * width + x] === 1) mark(x, height - 1);
        }

        while (head < tail) {
          const p = queue[head++];
          const x = p % width;
          const y = (p / width) | 0;
          const neighbors = [
            p - 1, p + 1, p - width, p + width
          ];
          if (x > 0 && candidate[neighbors[0]] === 1) { candidate[neighbors[0]] = 2; queue[tail++] = neighbors[0]; }
          if (x + 1 < width && candidate[neighbors[1]] === 1) { candidate[neighbors[1]] = 2; queue[tail++] = neighbors[1]; }
          if (y > 0 && candidate[neighbors[2]] === 1) { candidate[neighbors[2]] = 2; queue[tail++] = neighbors[2]; }
          if (y + 1 < height && candidate[neighbors[3]] === 1) { candidate[neighbors[3]] = 2; queue[tail++] = neighbors[3]; }
        }

        for (let p = 0; p < width * height; p += 1) {
          if (candidate[p] === 2) data[p * 4 + 3] = 0;
        }

        // The original image contains two enclosed orange gaps between the legs/shoes.
        // Remove those narrow background slivers without touching the orange sweater.
        for (let y = 950; y < Math.min(1265, height); y += 1) {
          for (let x = 482; x < Math.min(499, width); x += 1) data[(y * width + x) * 4 + 3] = 0;
        }
        for (let y = 1340; y < Math.min(1440, height); y += 1) {
          for (let x = 484; x < Math.min(505, width); x += 1) data[(y * width + x) * 4 + 3] = 0;
        }
        for (let y = Math.max(0, height - 36); y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const p = (y * width + x) * 4;
            data[p + 3] = 0;
          }
        }

        ctx.putImageData(pixels, 0, 0);
        const cutout = canvas.toDataURL('image/png');
        if (!disposed) setCharacterSrc(cutout);
      } catch {
        // Keep the original image if the CDN disallows canvas access.
      }
    };
    image.onerror = () => {};
    image.src = source;
    return () => {
      disposed = true;
    };
  }, []);

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

  return (
    <main className="agentic-login" dir={isAr ? 'rtl' : 'ltr'} onPointerMove={handlePointerMove} onPointerLeave={resetCharacter}>
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
            <motion.div className="agentic-login__character-light" style={{ left: characterGlowX, top: characterGlowY }} />
            <div className="agentic-login__character-shadow" />
            <img
              className="agentic-login__character-image"
              src={characterSrc}
              alt=""
              draggable={false}
              loading="eager"
              referrerPolicy="no-referrer"
            />
            <div className="agentic-login__character-glass" />
          </motion.div>
        </motion.div>
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
