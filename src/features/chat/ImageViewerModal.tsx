import { useState } from 'react';
import { Download, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageViewerModalProps {
  imageUrl: string | null;
  altText?: string;
  onClose: () => void;
  language: 'ar' | 'en';
}

export function ImageViewerModal({
  imageUrl,
  altText,
  onClose,
  language,
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const isAr = language === 'ar';

  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `adam-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Controls Bar */}
          <div className="w-full flex items-center justify-between pb-3 text-slate-200">
            <span className="text-sm font-medium text-slate-300 truncate max-w-md">
              {altText || (isAr ? 'عرض الصورة' : 'Image Viewer')}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
                title={isAr ? 'تكبير' : 'Zoom In'}
              >
                <ZoomIn size={17} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
                title={isAr ? 'تصغير' : 'Zoom Out'}
              >
                <ZoomOut size={17} />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
                  title={isAr ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
                >
                  <Minimize2 size={17} />
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center gap-1 text-xs px-3"
                title={isAr ? 'تحميل الصورة' : 'Download Image'}
              >
                <Download size={15} />
                <span>{isAr ? 'تحميل' : 'Download'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-200 transition"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Image Container with Scroll & Zoom */}
          <div
            className="w-full flex-1 overflow-auto max-h-[75vh] flex items-center justify-center rounded-2xl bg-slate-900/60 border border-slate-800/80 p-2 select-none"
            onClick={onClose}
          >
            <img
              src={imageUrl}
              alt={altText || 'Expanded view'}
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
