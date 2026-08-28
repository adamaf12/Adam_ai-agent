/**
 * Image Utilities for Downloading and Processing PNG Images
 */

export async function downloadImageAsPng(imageUrl: string, filename: string = 'edited-image'): Promise<void> {
  return new Promise((resolve) => {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1024;
        canvas.height = img.naturalHeight || img.height || 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${cleanFilename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          resolve();
          return;
        }
      } catch (err) {
        console.warn('Canvas PNG conversion failed due to CORS, attempting blob fallback:', err);
      }
      fallbackDownload();
    };

    img.onerror = () => {
      fallbackDownload();
    };

    function fallbackDownload() {
      fetch(imageUrl, { mode: 'cors' })
        .then((res) => res.blob())
        .then((blob) => {
          const pngBlob = new Blob([blob], { type: 'image/png' });
          const blobUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${cleanFilename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          resolve();
        })
        .catch(() => {
          const a = document.createElement('a');
          a.href = imageUrl;
          a.target = '_blank';
          a.download = `${cleanFilename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          resolve();
        });
    }

    img.src = imageUrl;
  });
}
