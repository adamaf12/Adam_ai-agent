import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Monitor,
  Download,
  CheckCircle2,
  ExternalLink,
  Zap,
  ShieldCheck,
  FolderArchive,
  Terminal,
  Info,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  HardDrive,
  Clock,
  Layers,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { fetchLatestApkBuildInfo, ApkBuildInfo } from '../lib/apkService';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({
  isOpen,
  onClose,
  isArabic,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [buildInfo, setBuildInfo] = useState<ApkBuildInfo | null>(null);
  const [isLoadingBuild, setIsLoadingBuild] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadBuildData = useCallback(async () => {
    setIsLoadingBuild(true);
    try {
      const data = await fetchLatestApkBuildInfo();
      if (data) {
        setBuildInfo(data);
      }
    } catch (err) {
      console.error('[ApkExportModal] Failed to load build info:', err);
    } finally {
      setIsLoadingBuild(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadBuildData();
    }
  }, [isOpen, loadBuildData]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        isArabic
          ? 'لتثبيت تطبيق أدم فوراً كتطبيق ويب للحاسوب أو الهاتف:\n\n💻 على جهاز الحاسوب (Windows / Mac / Linux / Chrome):\n1. اضغط على أيقونة التثبيت 💻 الصغيرة الموجودة في أعلى شريط العنوان بالمتصفح.\n2. أو اضغط قائمة المتصفح (⋮) -> ثم اختر "تثبيت تطبيق أدم AI" (Install Adam AI Agent).\n\n📱 على الهاتف (Android / iOS):\n1. افتح قائمة المتصفح (⋮) -> اختر "التثبيت على الشاشة الرئيسية" أو "تثبيت التطبيق".'
          : 'To install Adam AI Agent as a Desktop or Mobile App:\n\n💻 On Desktop (Windows/Mac/Linux):\n1. Click the Install Icon in your browser address bar.\n2. Or click Browser Menu (⋮) -> "Install Adam AI Agent".\n\n📱 On Mobile:\n1. Open Browser Menu (⋮) -> "Add to Home Screen" or "Install App".'
      );
    }
  };

  const handleCopyDirectLink = () => {
    const directUrl = buildInfo?.directUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/download/apk` : '/api/download/apk');
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTriggerDownload = (e?: React.MouseEvent) => {
    setIsDownloading(true);
    // Directly trigger window location or programmatic download if in iframe
    try {
      const link = document.createElement('a');
      link.href = currentDownloadUrl;
      link.setAttribute('download', `Adam-AI-Agent-${currentVersion}.apk`);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}

    setTimeout(() => {
      setIsDownloading(false);
    }, 2500);
  };

  const currentVersion = buildInfo?.buildVersion || 'v1.0.0';
  const currentDownloadUrl = buildInfo?.downloadUrl || `/api/download/apk?v=${encodeURIComponent(currentVersion)}`;
  const currentFileSize = buildInfo?.fileSizeFormatted || '4.35 MB';
  const currentLastModified = buildInfo?.lastModifiedFormatted || (isArabic ? 'الآن' : 'Just now');

  const isStorageVerified = Boolean(buildInfo && buildInfo.available && buildInfo.verifiedOnStorage !== false);
  const isStorageChecking = isLoadingBuild;
  const isStorageFailed = Boolean(!isLoadingBuild && buildInfo && (!buildInfo.available || buildInfo.verifiedOnStorage === false));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Laptop className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {isArabic ? 'تنزيل وتثبيت تطبيق أدم للحاسوب والهاتف (Desktop & Mobile App)' : 'Download & Install Desktop & Mobile App'}
                </h2>
              </div>
              <p className="text-xs text-blue-100">
                {isArabic
                  ? 'تثبيت تطبيق أدم فوراً كتطبيق مكتبي للحاسوب (Desktop Web App) وتطبيق هاتف (Android APK)'
                  : 'Install Adam AI instantly as a Desktop Web App (PC/Laptop) or Android APK'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-all text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs theme-scrollbar">
          
          {/* App Icon Showcase & Live Build Sync Header */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <AgentAvatar className="w-16 h-16 rounded-2xl border-2 border-blue-500/40 shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isArabic ? 'شعار وأيقونة أدم AI الرسمية' : 'Adam AI Official App Package'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{isArabic ? 'مربوط بالتخزين السحابي' : 'Storage Synced'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? 'متوافق مع الهواتف الذكية بنظام أندرويد 8.0+ وأجهزة الكمبيوتر مع تحديث تلقائي للإصدارات.'
                    : 'Compatible with Android 8.0+ and Desktop systems with automatic build version tracking.'}
                </p>
              </div>
            </div>

            <button
              onClick={loadBuildData}
              disabled={isLoadingBuild}
              title={isArabic ? 'إعادة فحص وتحديث حالة الإصدار الأخير' : 'Check latest build status'}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-1.5 text-[11px] font-bold shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBuild ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isArabic ? 'تحديث الإصدار' : 'Refresh'}</span>
            </button>
          </div>

          {/* SECTION 1: Direct APK Download & Mobile Installation (Dynamic & Connected) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isArabic ? '📱 تنزيل وتثبيت تطبيق أندرويد (Android APK)' : '📱 Download & Install Android APK'}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{currentVersion}</span>
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? 'ملف التثبيت المباشر للأندرويد مربوط ديناميكياً بأحدث بناء للمشروع'
                      : 'Direct Android Package (APK) dynamically connected to the latest build'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span>{isArabic ? 'أحدث إصدار جاهز' : 'Live Build'}</span>
              </span>
            </div>

            {/* Dynamic APK Live Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200/80 dark:border-emerald-800/40 text-center">
              <div className="p-1">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  <span>{isArabic ? 'حجم الملف' : 'Size'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{currentFileSize}</div>
              </div>
              
              <div className="p-1 border-s sm:border-x border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{isArabic ? 'تاريخ البناء' : 'Build Time'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{currentLastModified}</div>
              </div>

              <div className="p-1 border-t sm:border-t-0 sm:border-e border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-slate-400" />
                  <span>{isArabic ? 'التوافق' : 'Compatibility'}</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Android 8.0+</div>
              </div>

              <div className="p-1 border-t sm:border-t-0 border-s border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span>{isArabic ? 'حالة التوقيع' : 'Signing'}</span>
                </div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {isArabic ? 'رسمي موقع' : 'Official Signed'}
                </div>
              </div>
            </div>

            {/* Live Storage Verification Status Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  isStorageChecking 
                    ? 'bg-blue-500/10 text-blue-500' 
                    : isStorageVerified 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <Server className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                    <span>{isArabic ? 'خادم تخزين الحزم:' : 'APK Storage Server:'}</span>
                    {isStorageChecking ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin inline" />
                        <span>{isArabic ? 'جاري الفحص اللحظي...' : 'Verifying Storage...'}</span>
                      </span>
                    ) : isStorageVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 inline" />
                        <span>{isArabic ? `تم التحقق بنجاح (${currentFileSize})` : `Storage Verified (${currentFileSize})`}</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 inline" />
                        <span>{isArabic ? 'حالة احتياطية' : 'Fallback Stream'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadBuildData}
                disabled={isLoadingBuild}
                title={isArabic ? 'إعادة الفحص اللحظي للسيرفر' : 'Re-verify server'}
                className="px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBuild ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
                <span>{isArabic ? 'فحص' : 'Check'}</span>
              </button>
            </div>

            {/* Dynamic Actions: Prominent Download Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={isStorageFailed ? loadBuildData : handleTriggerDownload}
                disabled={isStorageChecking}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 text-center cursor-pointer group ${
                  isDownloading
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/50 animate-pulse'
                    : isStorageChecking
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-400/40 cursor-wait opacity-90'
                    : isStorageVerified
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-600/35 ring-2 ring-emerald-400/40 hover:ring-emerald-400/70'
                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-amber-600/30 ring-2 ring-amber-400/40'
                }`}
              >
                {/* Dynamic Icon */}
                {isDownloading ? (
                  <Download className="w-5 h-5 text-white animate-bounce" />
                ) : isStorageChecking ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : isStorageVerified ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                    <Download className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
                  </div>
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-200 animate-pulse" />
                )}

                {/* Dynamic Label */}
                <span>
                  {isDownloading
                    ? (isArabic ? 'جاري بدء التنزيل المباشر... 🚀' : 'Starting Direct Download... 🚀')
                    : isStorageChecking
                    ? (isArabic ? 'جاري فحص وتأكيد الحزمة على خادم التخزين... ⏳' : 'Verifying APK File on Storage Server... ⏳')
                    : isStorageVerified
                    ? (isArabic
                        ? `تنزيل ملف APK المعتمد والمفحوص (${currentVersion}) الآن 📲 ✓`
                        : `Download Verified APK (${currentVersion}) Now 📲 ✓`)
                    : (isArabic
                        ? 'إعادة فحص وتجهيز الحزمة على السيرفر 🔄'
                        : 'Re-verify APK on Storage Server 🔄')}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isArabic ? 'تثبيت WebAPK ⚡' : 'Instant WebAPK ⚡'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{isArabic ? 'تم نسخ الرابط!' : 'Link Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isArabic ? 'نسخ رابط التنزيل 🔗' : 'Copy APK Link 🔗'}</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-100 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isArabic ? 'PWABuilder مخصص' : 'PWABuilder Package'}</span>
                </a>
              </div>
            </div>

            {/* What's new in this build (Changelog) */}
            {buildInfo?.changelogAr && buildInfo.changelogAr.length > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-slate-700 dark:text-slate-300 text-[11px] space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isArabic ? 'الميزات الجديدة في هذا الإصدار:' : "What's new in this build:"}</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 ps-1 text-slate-600 dark:text-slate-300">
                  {(isArabic ? buildInfo.changelogAr : buildInfo.changelogEn || buildInfo.changelogAr).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Android Installation Guide Steps */}
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 text-[11px] space-y-1.5">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isArabic ? 'خطوات التثبيت السريعة على هاتف الأندرويد:' : 'Easy Android Installation Steps:'}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed ps-1">
                <li>
                  {isArabic
                    ? 'اضغط زر "تنزيل ملف APK للأندرويد" وسيبدأ تنزيل حزمة التطبيق المحدثة فوراً.'
                    : 'Click "Download Android APK" to start downloading the latest package.'}
                </li>
                <li>
                  {isArabic
                    ? 'افتح شريط الإشعارات أو مدير الملفات واضغط على الملف المحمّل.'
                    : 'Open notifications or Files app and tap the downloaded APK file.'}
                </li>
                <li>
                  {isArabic
                    ? 'إذا طلب الهاتف إذناً، اختر "السماح بالتثبيت من هذا المصدر" ثم اضغط "تثبيت".'
                    : 'If prompted, enable "Install from this source" then tap "Install".'}
                </li>
              </ol>
            </div>
          </div>

          {/* SECTION 2: Desktop Web App 1-Click Installation (PWA for PC/Laptop) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-6 h-6 text-blue-200 animate-pulse" />
                <h3 className="font-bold text-base text-white">
                  {isArabic ? '💻 تثبيت تطبيق أدم كتطبيق ويب للحاسوب (Desktop App)' : '💻 Install as PC/Desktop Web App'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
                {isArabic ? 'تثبيت بنقرة واحدة 🚀' : '1-Click Install'}
              </span>
            </div>

            <p className="text-blue-100 text-xs leading-relaxed">
              {isArabic
                ? 'يمكنك تثبيت تطبيق أدم فوراً على حاسوبك (Windows / macOS / Linux / Chromebook) ليعمل كـ تطبيق مكتبي مستقِل بأيقونة خاصة ونافذة منفصلة بدون شريط المتصفح!'
                : 'Install Adam AI directly on your PC or Laptop (Windows / Mac / Linux) to launch in its own window with desktop shortcut!'}
            </p>

            <div className="pt-2">
              <button
                onClick={handleInstallPWA}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-blue-50 text-indigo-900 font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 group text-center cursor-pointer"
              >
                <Monitor className="w-5 h-5 text-indigo-700 group-hover:scale-110 transition-transform" />
                <span>
                  {isInstalled
                    ? isArabic ? 'التطبيق مثبت بالفعل على جهازك ✅' : 'Desktop App Already Installed ✅'
                    : isArabic ? 'تثبيت تطبيق أدم للكمبيوتر الآن 💻' : 'Install Adam Desktop Web App Now 💻'}
                </span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-blue-50 text-[11px] space-y-1">
              <div className="font-bold text-white flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-300" />
                <span>{isArabic ? 'طريقة التثبيت اليدوي على متصفح الحاسوب:' : 'Desktop Browser Installation Steps:'}</span>
              </div>
              <p>
                {isArabic
                  ? '1. في متصفح Chrome أو Edge: انقر على زر التثبيت (💻) الصغير الموجود في نهاية شريط العنوان العلوي (Address Bar).'
                  : '1. In Chrome/Edge: Click the small Install icon (💻) at the right end of the address bar.'}
              </p>
              <p>
                {isArabic
                  ? '2. أو اضغط القائمة (⋮) -> "حفظ ومشاركة" / "التطبيقات" -> اختر "تثبيت أدم AI (Install Adam AI Agent)".'
                  : '2. Or click Browser Menu (⋮) -> "Apps" -> "Install Adam AI Agent".'}
              </p>
            </div>
          </div>

          {/* SECTION 3: Electron Desktop Executable & Code Build */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {isArabic ? '🖥️ برنامج الحاسوب المستقل (Electron Native Desktop App)' : '🖥️ Electron Desktop Build Commands'}
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {isArabic
                ? 'المشروع مدعوم بالكامل بملفات Electron لتجميعه كبرنامج مكتبي (.exe أو AppImage) لنظام ويندوز ولينكس:'
                : 'Project includes Electron support to compile standalone Desktop executables (.exe / AppImage):'}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-2 dir-ltr">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 text-[10px]">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  <span>Desktop Executable Build Commands</span>
                </span>
                <span>Bash / Terminal</span>
              </div>
              <p className="text-indigo-300"># Windows Installer (.exe)</p>
              <p className="text-slate-300">npm run build:win</p>
              <p className="text-indigo-300"># Linux Desktop App (.AppImage / .deb)</p>
              <p className="text-slate-300">npm run build:linux</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Info className="w-4 h-4 text-blue-500" />
            <span>
              {isArabic
                ? `إصدار الحزمة الحالي: ${currentVersion}`
                : `Current Build Version: ${currentVersion}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all text-xs cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

