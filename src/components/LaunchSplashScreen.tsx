import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, ShieldCheck } from 'lucide-react';
import ademSplashImg from '../assets/images/adem_launch_screen_1787495825686.jpg';

interface LaunchSplashScreenProps {
  onComplete?: () => void;
  isArabic?: boolean;
}

export const LaunchSplashScreen: React.FC<LaunchSplashScreenProps> = ({
  onComplete,
  isArabic = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    // Step animations
    const t1 = setTimeout(() => setLoadingStep(1), 600);
    const t2 = setTimeout(() => setLoadingStep(2), 1200);
    const t3 = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const stepsAr = [
    'تهيئة مصفوفة الذكاء الاصطناعي...',
    'تحميل الحزم المعرفية وذاكرة الأوفلاين...',
    'آدم جاهز للعمل والخدمة فائق السرعة ⚡',
  ];

  const stepsEn = [
    'Initializing Neural AI Matrix...',
    'Loading Knowledge Packs & Offline Memory...',
    'ADEM AI Agent Ready ⚡',
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white select-none cursor-pointer overflow-hidden"
        >
          {/* Background Image with Ambient Glow and Cyber Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={ademSplashImg}
              alt="ADEM AI Agent Launch"
              className="w-full h-full object-cover object-center scale-105 filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80 backdrop-blur-[1px]" />
          </div>

          {/* Foreground Brand Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-sm">
            {/* Pulsing Central Halo Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_50px_rgba(6,182,212,0.45)] flex items-center justify-center">
                <div className="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center border border-cyan-400/30">
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-cyan-200 via-white to-blue-400 bg-clip-text text-transparent tracking-tighter">
                    A
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-1"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white font-mono">
                ADEM <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-xs sm:text-sm text-cyan-200/80 font-medium tracking-widest uppercase">
                {isArabic ? 'المساعد الذكي المستقل فائق السرعة' : 'Autonomous Next-Gen AI Agent'}
              </p>
            </motion.div>

            {/* Loading Indicator & Status */}
            <div className="mt-8 w-full max-w-[240px] space-y-2">
              <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  initial={{ width: '10%' }}
                  animate={{ width: loadingStep === 0 ? '35%' : loadingStep === 1 ? '75%' : '100%' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-slate-300 font-mono text-center truncate"
              >
                {isArabic ? stepsAr[loadingStep] : stepsEn[loadingStep]}
              </motion.p>
            </div>

            {/* Trust Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.8 }}
              className="mt-10 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800/80"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isArabic ? 'محمي بالكامل ومشفر • جاهز للعمل أوفلاين' : 'End-to-End Encrypted • Offline Ready'}</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
