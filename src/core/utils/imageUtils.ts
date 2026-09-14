/**
 * Image processing utilities for client-side compression,
 * base64 encoding, and multimodal vision preparation.
 */

export interface ProcessedImage {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
}

/**
 * Reads a File object and processes it into an optimized base64 Data URL.
 * Automatically downscales ultra-large phone photos (e.g. 10MB+) to max 1920px
 * to optimize upload speed and token efficiency while maintaining razor-sharp detail.
 */
export async function processImageFile(file: File, maxDimension = 1920, quality = 0.88): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file format.'));
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Downscale if larger than max dimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw dataUrl if canvas context unavailable
            resolve({
              id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              mimeType: file.type || 'image/jpeg',
              dataUrl: reader.result as string,
              sizeBytes: file.size,
            });
            return;
          }

          // Draw with high quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Use image/jpeg for photos, image/png for transparent images
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);

          resolve({
            id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType,
            dataUrl,
            sizeBytes: Math.round((dataUrl.length * 3) / 4),
          });
        } catch (err) {
          // Fallback to raw reader output
          resolve({
            id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            dataUrl: reader.result as string,
            sizeBytes: file.size,
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable size (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
