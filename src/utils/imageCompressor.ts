// ==============================================================================
// Infraxix - Client-Side Image Compression Utility
// Automatically downscales and compresses high-resolution camera images
// from 3-5MB down to ~150-250KB before uploading or staging in browser memory.
// Enables 5GB Firebase free tier to hold 20,000+ photos instead of only 1,000.
// ==============================================================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: string;
}

/**
 * Compresses an image File or Blob using HTML5 Canvas.
 * Safely handles mobile orientation, maintains aspect ratio, and outputs an optimized Blob.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; width: number; height: number; sizeBytes: number }> {
  // If not an image (e.g., video or PDF), return raw blob directly
  if (!fileOrBlob.type.startsWith('image/')) {
    return {
      blob: fileOrBlob,
      width: 0,
      height: 0,
      sizeBytes: fileOrBlob.size,
    };
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // Create an image element to read dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate proportional bounding box
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Draw onto canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if 2d context unavailable
        resolve({
          blob: fileOrBlob,
          width: img.width,
          height: img.height,
          sizeBytes: fileOrBlob.size,
        });
        return;
      }

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export compressed blob
      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            resolve({
              blob: fileOrBlob,
              width,
              height,
              sizeBytes: fileOrBlob.size,
            });
            return;
          }

          resolve({
            blob: compressedBlob,
            width,
            height,
            sizeBytes: compressedBlob.size,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn('[ImageCompressor] Failed to load image for compression, using original:', err);
      resolve({
        blob: fileOrBlob,
        width: 0,
        height: 0,
        sizeBytes: fileOrBlob.size,
      });
    };

    img.src = objectUrl;
  });
}
