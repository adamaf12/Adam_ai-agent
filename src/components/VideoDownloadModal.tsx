import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Play,
  Film,
  Music,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Share2,
  Sparkles,
  Info,
  Youtube,
  Video,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  platform: string;
  qualities: { id: string; label: string; note: string }[];
  url: string;
}

interface DownloadStatus {
  id: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  fileName?: string;
  downloadUrl?: string;
  error?: string;
}

interface VideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  isArabic?: boolean;
}

export const VideoDownloadModal: React.FC<VideoDownloadModalProps> = ({
  isOpen,
  onClose,
  initialUrl = '',
  isArabic = true,
}) => {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Download job state
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Disclaimer notice state
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialUrl && initialUrl !== urlInput) {
        setUrlInput(initialUrl);
        handleFetchInfo(initialUrl);
      }
      // Check disclaimer
      const accepted = localStorage.getItem('adam_video_download_disclaimer_accepted');
      if (!accepted) {
        setShowDisclaimer(true);
      }
    } else {
      resetState();
    }
  }, [isOpen, initialUrl]);

  // Poll status when downloading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (downloadJobId && isDownloading) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/video/status/${downloadJobId}`);
          if (res.ok) {
            const data: DownloadStatus = await res.json();
            setDownloadStatus(data);
            if (data.status === 'completed' || data.status === 'error') {
              setIsDownloading(false);
            }
          }
        } catch (e) {
          console.error('Failed to poll status', e);
        }
      }, 800);
    }
    return () => clearInterval(interval);
  }, [downloadJobId, isDownloading]);

  const resetState = () => {
    setVideoInfo(null);
    setErrorMessage(null);
    setDownloadJobId(null);
    setDownloadStatus(null);
    setIsDownloading(false);
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('adam_video_download_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const handleFetchInfo = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || urlInput;
    if (!urlToFetch || !urlToFetch.trim().startsWith('http')) {
      setErrorMessage(
        isArabic
          ? 'يرجى إدخال رابط فيديو صحيح يبدأ بـ http:// أو https://'
          : 'Please enter a valid video URL starting with http:// or https://'
      );
      return;
    }

    setIsLoadingInfo(true);
    setErrorMessage(null);
    setVideoInfo(null);
    setDownloadStatus(null);

    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر جلب بيانات الفيديو');
      }

      setVideoInfo(data);
      setSelectedQuality('best');
    } catch (e: any) {
      setErrorMessage(
        e.message ||
          (isArabic
            ? 'فشل جلب معلومات الفيديو. قد يكون الرابط خاصاً، محذوفاً، أو غير مدعوم.'
            : 'Failed to fetch video info. The link may be private, deleted, or unsupported.')
      );
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleStartDownload = async () => {
    if (!videoInfo) return;

    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadStatus({
      id: '',
      status: 'downloading',
      progress: 0,
      speed: '0 KB/s',
      eta: isArabic ? 'جاري الاتصال بالخادم...' : 'Connecting to server...',
    });

    try {
      const res = await fetch('/api/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoInfo.url, quality: selectedQuality }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر بدء تحميل الفيديو');
      }

      setDownloadJobId(data.jobId);
    } catch (e: any) {
      setIsDownloading(false);
      setErrorMessage(e.message || 'حدث خطأ أثناء الاتصال ببدء التحميل.');
    }
  };

  const handleCopyDownloadLink = () => {
    if (downloadStatus?.downloadUrl) {
      const fullUrl = window.location.origin + downloadStatus.downloadUrl;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {isArabic ? 'وضع تحميل الفيديو الشامل' : 'Universal Video Download Mode'}
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  yt-dlp Engine 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isArabic
                  ? 'تحميل الفيديوهات من يوتيوب، تيك توك، إنستغرام، فيسبوك، تويتر/X وغيرها بجودات متعددة وصوت MP3'
                  : 'Download videos from YouTube, TikTok, Instagram, Facebook, Twitter/X and more.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* First-Time Disclaimer Alert Banner */}
        {showDisclaimer && (
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  {isArabic ? 'تنبيه حول الاستخدام الشخصي والعادل:' : 'Fair Use & Rights Notice:'}
                </p>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  {isArabic
                    ? 'هذه الميزة مخصصة فقط لتحميل المحتوى للاستخدام الشخصي أو المحتوى الذي تملك حق تحميله، احتراماً لحقوق صانعي المحتوى وشروط استخدام المنصات.'
                    : 'This tool is intended solely for personal use or content you own, respecting creator rights and platform policies.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleAcceptDisclaimer}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold shrink-0 transition"
            >
              {isArabic ? 'فهمت ذلك' : 'Got it'}
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Input & Paste Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>{isArabic ? 'أدخل رابط الفيديو المراد تحليله وتحميله:' : 'Enter Video URL:'}</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {isArabic ? 'يدعم جميع المنصات العالمية' : 'Supports all major platforms'}
              </span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={
                    isArabic
                      ? 'https://www.youtube.com/watch?v=... أو TikTok, Instagram, FB, X'
                      : 'Paste YouTube, TikTok, Instagram, FB, Twitter link...'
                  }
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchInfo();
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                <Film className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-500" />
              </div>

              <button
                onClick={() => handleFetchInfo()}
                disabled={isLoadingInfo || !urlInput.trim()}
                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0 active:scale-95"
              >
                {isLoadingInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isArabic ? 'جاري التحليل...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isArabic ? 'جلب ومعاينة' : 'Inspect Link'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Supported Platforms Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                {isArabic ? 'المنصات المدعومة:' : 'Supported:'}
              </span>
              {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter/X', 'Vimeo', 'Dailymotion'].map(
                (platform) => (
                  <span
                    key={platform}
                    className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[10px] border border-slate-700/50"
                  >
                    {platform}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{isArabic ? 'خطأ في معالجة الفيديو:' : 'Video Processing Error:'}</p>
                <p className="text-rose-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Video Preview Card */}
          {videoInfo && (
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-emerald-500/30 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Thumbnail Preview */}
                <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/80 drop-shadow-md" />
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                    {videoInfo.duration}
                  </span>
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] font-bold text-white uppercase">
                    {videoInfo.platform}
                  </span>
                </div>

                {/* Video Info Details */}
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {videoInfo.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>
                      {isArabic ? 'صانع المحتوى:' : 'Uploader:'}{' '}
                      <strong className="text-slate-200">{videoInfo.uploader}</strong>
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    {isArabic
                      ? 'جاهز للتحميل بجودات عالية أو ملف صوتي MP3'
                      : 'Ready for high-quality video or MP3 download'}
                  </p>
                </div>
              </div>

              {/* Quality Options Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-emerald-400" />
                  <span>{isArabic ? 'اختر جودة التحميل المطلوبة:' : 'Select Download Quality:'}</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {videoInfo.qualities.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuality(q.id)}
                      disabled={isDownloading}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 ${
                        selectedQuality === q.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{q.label}</span>
                        {q.id === 'mp3' ? (
                          <Music className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400/80 leading-tight line-clamp-1">
                        {q.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Trigger Button */}
              {!downloadStatus && (
                <div className="pt-2">
                  <button
                    onClick={handleStartDownload}
                    disabled={isDownloading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isArabic
                        ? `بدء تحميل الفيديو (${selectedQuality})`
                        : `Start Video Download (${selectedQuality})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Download Progress & Status Box */}
          {downloadStatus && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  {downloadStatus.status === 'downloading' && (
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  )}
                  {downloadStatus.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {downloadStatus.status === 'error' && (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="text-slate-200">
                    {downloadStatus.status === 'downloading' &&
                      (isArabic ? 'جاري تحميل الفيديو في الخلفية...' : 'Downloading video...')}
                    {downloadStatus.status === 'completed' &&
                      (isArabic ? 'اكتمل التحميل بنجاح! جاهز للحفظ' : 'Download Completed Successfully!')}
                    {downloadStatus.status === 'error' &&
                      (isArabic ? 'فشل تحميل الفيديو' : 'Download Failed')}
                  </span>
                </div>

                <span className="font-mono text-emerald-400 text-sm">
                  {downloadStatus.progress.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    downloadStatus.status === 'completed'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : downloadStatus.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 animate-pulse'
                  }`}
                  style={{ width: `${Math.min(100, downloadStatus.progress)}%` }}
                />
              </div>

              {/* Download Details: Speed & ETA */}
              {downloadStatus.status === 'downloading' && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>
                    {isArabic ? 'سرعة التحميل:' : 'Speed:'} {downloadStatus.speed}
                  </span>
                  <span>
                    {isArabic ? 'الوقت المتبقي:' : 'ETA:'} {downloadStatus.eta}
                  </span>
                </div>
              )}

              {/* Completed Actions (Save & Share) */}
              {downloadStatus.status === 'completed' && downloadStatus.downloadUrl && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href={downloadStatus.downloadUrl}
                    download={downloadStatus.fileName || 'video.mp4'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isArabic ? 'حفظ الملف إلى جهازك' : 'Save File to Device'}</span>
                  </a>

                  <button
                    onClick={handleCopyDownloadLink}
                    className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{isArabic ? 'نسخ رابط التحميل' : 'Copy Download Link'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>
              {isArabic
                ? 'يتم تنفيذه عبر محرك yt-dlp الآمن على الخادم لحفظ خصوصيتك'
                : 'Powered by yt-dlp engine on backend server'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
