import { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ChevronUp,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { ANDROID_OAUTH_CONFIG, isAndroidNative } from '../core/utils/permissionManager';
import { useAuth } from '../core/auth/AuthContext';

interface AndroidOAuthSetupCardProps {
  language: 'ar' | 'en';
  defaultExpanded?: boolean;
}

export function AndroidOAuthSetupCard({ language, defaultExpanded = false }: AndroidOAuthSetupCardProps) {
  const isAr = language === 'ar';
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { signIn, loading, user } = useAuth();
  const isNative = isAndroidNative();

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      id="android-oauth-setup-card"
      className="p-5 sm:p-6 rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-sky-950/40 text-slate-100 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
            <KeyRound size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-base font-bold text-slate-100">
                {isAr ? 'تسجيل الدخول لتطبيق الأندرويد (Google OAuth)' : 'Android Google Sign-In (OAuth Client)'}
              </strong>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                <Smartphone size={11} />
                <span>com.adam.aiagent</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {isAr
                ? 'ربط تسجيل الدخول الرسمي بحساب Google على هواتف أندرويد عبر معرّف عميل Android في Google Cloud Console.'
                : 'Connect official Google Sign-In for Android devices using the Android OAuth client in Google Cloud Console.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <a
            href={ANDROID_OAUTH_CONFIG.createClientUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <ExternalLink size={14} />
            <span>{isAr ? 'إنشاء عميل في Google Cloud' : 'Create in Cloud Console'}</span>
          </a>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={expanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'عرض البيانات' : 'Show details')}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Quick Google Sign In Action if inside Android */}
      {isNative && !user && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>{isAr ? 'يمكنك بدء تسجيل الدخول الآن بحساب Google مباشرة على هاتفك:' : 'Sign in directly with your Google Account on your device:'}</span>
          </div>
          <button
            type="button"
            onClick={signIn}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <LogIn size={14} />
            <span>{loading ? (isAr ? 'جاري الاتصال...' : 'Connecting...') : (isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google')}</span>
          </button>
        </div>
      )}

      {/* Expandable Technical Details & Parameters for Google Cloud Console */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-slate-800 space-y-4 text-xs animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px] text-slate-300">
              <span className="font-semibold text-sky-400 block mb-1">
                {isAr ? 'خطوات إنشاء عميل Android في Google Cloud Console:' : 'Steps to create Android Client in Google Cloud Console:'}
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>{isAr ? 'اختر نوع التطبيق: ' : 'Select Application type: '} <strong className="text-slate-200">Android (أندرويد)</strong></li>
                <li>{isAr ? 'الاسم: ' : 'Name: '} <strong className="text-slate-200">Adam AI Agent Android</strong></li>
                <li>{isAr ? 'الصق اسم الحزمة وبصمة شهادة SHA-1 الموجودة أدناه.' : 'Paste Package name and SHA-1 certificate fingerprint below.'}</li>
                <li>{isAr ? 'اضغط "إنشاء" (Create).' : 'Click "Create".'}</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Package Name */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isAr ? 'اسم الحزمة (Package name):' : 'Package Name:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(ANDROID_OAUTH_CONFIG.packageName, 'pkg')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedField === 'pkg' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedField === 'pkg' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
              <code className="block font-mono text-xs text-sky-300 select-all break-all dir-ltr text-left bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                {ANDROID_OAUTH_CONFIG.packageName}
              </code>
            </div>

            {/* Project ID */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isAr ? 'معرّف المشروع (Project ID):' : 'Project ID:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(ANDROID_OAUTH_CONFIG.projectId, 'pid')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedField === 'pid' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedField === 'pid' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
              <code className="block font-mono text-xs text-sky-300 select-all break-all dir-ltr text-left bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                {ANDROID_OAUTH_CONFIG.projectId}
              </code>
            </div>

            {/* SHA-1 Fingerprint */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isAr ? 'بصمة شهادة SHA-1 (المطلوبة):' : 'SHA-1 Certificate Fingerprint (Required):'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                    {isAr ? 'شهادة التوقيع الرسمية' : 'Official Release Keystore'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(ANDROID_OAUTH_CONFIG.sha1, 'sha1')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  {copiedField === 'sha1' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedField === 'sha1' ? (isAr ? 'تم نسخ بصمة SHA-1' : 'Copied') : (isAr ? 'نسخ SHA-1' : 'Copy SHA-1')}</span>
                </button>
              </div>
              <code className="block font-mono text-xs text-amber-300 font-bold select-all break-all dir-ltr text-left bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30">
                {ANDROID_OAUTH_CONFIG.sha1}
              </code>
            </div>

            {/* SHA-256 Fingerprint */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isAr ? 'بصمة شهادة SHA-256 (إضافية):' : 'SHA-256 Certificate Fingerprint (Optional):'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(ANDROID_OAUTH_CONFIG.sha256, 'sha256')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedField === 'sha256' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedField === 'sha256' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
              <code className="block font-mono text-[11px] text-slate-300 select-all break-all dir-ltr text-left bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                {ANDROID_OAUTH_CONFIG.sha256}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
