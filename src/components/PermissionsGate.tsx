import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Mic,
  Camera,
  Bell,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

interface PermissionsState {
  microphone: boolean;
  camera: boolean;
  notifications: boolean;
  geolocation: boolean;
}

interface PermissionsGateProps {
  children: React.ReactNode;
  isArabic: boolean;
}

export const PermissionsGate: React.FC<PermissionsGateProps> = ({
  children,
  isArabic,
}) => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    microphone: false,
    camera: false,
    notifications: false,
    geolocation: false,
  });

  const [isChecking, setIsChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to check if running in App/Standalone/Capacitor mode vs regular website
  const isAppEnvironment = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isCapacitor = !!(window as any).Capacitor;
    const isMobileAppUserAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && isStandalone;
    return isStandalone || isCapacitor || isMobileAppUserAgent;
  };

  useEffect(() => {
    checkPermissionsState();
  }, []);

  const checkPermissionsState = async () => {
    setIsChecking(true);
    let micOk = false;
    let camOk = false;
    let notifOk = false;
    let geoOk = false;

    // Check Notification
    if ('Notification' in window) {
      notifOk = Notification.permission === 'granted';
    } else {
      notifOk = true;
    }

    // Check navigator.permissions query if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
        micOk = micStatus.state === 'granted';
      } catch (e) {}

      try {
        const camStatus = await navigator.permissions.query({ name: 'camera' as any });
        camOk = camStatus.state === 'granted';
      } catch (e) {}

      try {
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' as any });
        geoOk = geoStatus.state === 'granted';
      } catch (e) {}
    }

    const savedGranted =
      localStorage.getItem('adam_essential_permissions_granted') === 'true' ||
      localStorage.getItem('adam_all_permissions_granted') === 'true' ||
      localStorage.getItem('adam_permissions_permanently_granted') === 'true';

    // Once accepted once, all permissions stay permanently accepted!
    const newState = {
      microphone: true, // Always true if saved or tested
      camera: camOk || savedGranted,
      notifications: notifOk || savedGranted,
      geolocation: geoOk || savedGranted,
    };

    if (savedGranted) {
      newState.microphone = true;
      newState.camera = true;
      newState.notifications = true;
      newState.geolocation = true;
    } else {
      newState.microphone = micOk;
    }

    setPermissions(newState);

    const inApp = isAppEnvironment();

    if (inApp && !savedGranted && !micOk) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }

    setIsChecking(false);
  };

  const requestEssentialPermissions = async () => {
    setErrorMessage(null);
    setIsChecking(true);

    const updatedPermissions = { ...permissions };

    // 1. Primary Mandatory Permission: Microphone (Voice Agent)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      updatedPermissions.microphone = true;
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      updatedPermissions.microphone = false;
    }

    // 2. Optional: Camera
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStream.getTracks().forEach((track) => track.stop());
      updatedPermissions.camera = true;
    } catch (err) {
      // Camera is optional
      updatedPermissions.camera = false;
    }

    // 3. Optional: Notifications
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        updatedPermissions.notifications = res === 'granted';
      } catch (err) {
        updatedPermissions.notifications = false;
      }
    } else {
      updatedPermissions.notifications = true;
    }

    // 4. Optional: Geolocation
    if ('geolocation' in navigator) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            updatedPermissions.geolocation = true;
            resolve();
          },
          () => {
            updatedPermissions.geolocation = false;
            resolve();
          },
          { timeout: 3000 }
        );
      });
    } else {
      updatedPermissions.geolocation = true;
    }

    // Permanently mark permissions as accepted once granted or requested
    localStorage.setItem('adam_essential_permissions_granted', 'true');
    localStorage.setItem('adam_all_permissions_granted', 'true');
    localStorage.setItem('adam_permissions_permanently_granted', 'true');

    setPermissions({
      microphone: true,
      camera: true,
      notifications: true,
      geolocation: true,
    });

    setIsLocked(false);
    setErrorMessage(null);
    setIsChecking(false);
  };

  // Skip optional & proceed if in app mode
  const handleProceedAnyway = () => {
    localStorage.setItem('adam_essential_permissions_granted', 'true');
    localStorage.setItem('adam_all_permissions_granted', 'true');
    localStorage.setItem('adam_permissions_permanently_granted', 'true');
    setPermissions({
      microphone: true,
      camera: true,
      notifications: true,
      geolocation: true,
    });
    setIsLocked(false);
  };

  // If locked (in App mode without essential audio permission), show permission gate
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 text-center my-auto">
          
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>{isArabic ? 'صلاحيات تطبيق أدم المحمول' : 'Adam App Permissions'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {isArabic ? 'تفعيل الصلاحيات الأساسية للتطبيق 📲' : 'Enable Required App Permissions'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              {isArabic
                ? 'عند استخدام تطبيق أدم المباشر على الهاتف، تلزم صلاحية الميكروفون لتشغيل الأوامر الصوتية والوكيل الاصطناعي الذكي.'
                : 'When using Adam AI native mobile app, microphone permission is required to operate voice features.'}
            </p>
          </div>

          {/* Permissions Checklist */}
          <div className="grid grid-cols-1 gap-2.5 text-right dir-rtl">
            
            {/* Microphone - MANDATORY */}
            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              permissions.microphone
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${permissions.microphone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs md:text-sm text-white">
                      {isArabic ? 'الميكروفون والصوت' : 'Microphone & Audio'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                      {isArabic ? 'إجباري ⭐' : 'Required ⭐'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'التحكم الصوتي والاستماع المباشر' : 'Voice commands & audio agent'}
                  </p>
                </div>
              </div>
              {permissions.microphone ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  {isArabic ? 'ممنوح' : 'Granted'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <XCircle className="w-4 h-4" />
                  {isArabic ? 'مطلوب' : 'Required'}
                </span>
              )}
            </div>

            {/* Camera - OPTIONAL */}
            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              permissions.camera
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${permissions.camera ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs md:text-sm text-white">
                      {isArabic ? 'الكاميرا والوسائط' : 'Camera & Media'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-bold">
                      {isArabic ? 'اختياري' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'التقاط الصور ومعالجتها بالذكاء الاصطناعي' : 'Photo capture & AI analysis'}
                  </p>
                </div>
              </div>
              {permissions.camera ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="text-slate-500 text-xs">{isArabic ? 'اختياري' : 'Optional'}</span>
              )}
            </div>

            {/* Notifications - OPTIONAL */}
            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              permissions.notifications
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${permissions.notifications ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs md:text-sm text-white">
                      {isArabic ? 'الإشعارات والتنبيهات' : 'Notifications'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-bold">
                      {isArabic ? 'اختياري' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'تنبيهات البريد والتذكيرات الذكية' : 'Background alerts & reminders'}
                  </p>
                </div>
              </div>
              {permissions.notifications ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="text-slate-500 text-xs">{isArabic ? 'اختياري' : 'Optional'}</span>
              )}
            </div>

            {/* Geolocation - OPTIONAL */}
            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              permissions.geolocation
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${permissions.geolocation ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs md:text-sm text-white">
                      {isArabic ? 'الموقع الجغرافي' : 'Location'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-bold">
                      {isArabic ? 'اختياري' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isArabic ? 'الطقس والأماكن القريبة' : 'Local weather & location tools'}
                  </p>
                </div>
              </div>
              {permissions.geolocation ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="text-slate-500 text-xs">{isArabic ? 'اختياري' : 'Optional'}</span>
              )}
            </div>

          </div>

          {/* Error Message if Denied */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 text-right dir-rtl">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={requestEssentialPermissions}
              disabled={isChecking}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{isArabic ? 'جاري فحص الصلاحيات...' : 'Checking Permissions...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-bounce" />
                  <span>{isArabic ? 'منح الصلاحيات للبرنامج 🛡️' : 'Grant Required Permissions 🛡️'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleProceedAnyway}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isArabic ? 'المتابعة إلى التطبيق فوراً 🚀' : 'Skip & Continue to App 🚀'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return <>{children}</>;
};
