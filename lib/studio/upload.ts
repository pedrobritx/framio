import { TARGET } from '../frame';

/**
 * Bring-your-own image, read entirely in the browser. Files are downscaled to
 * the Frame's longest edge (so localStorage stays light and exports stay crisp)
 * and returned as a JPEG data URL — shared by the Library uploader and the
 * Frame Studio drop-to-crop entry so both behave identically.
 */

const MAX_EDGE = TARGET.width; // 3840 — no need to keep more than the Frame can show

export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** Strip the extension and tidy separators into a readable title. */
export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

/** Read a file, downscaling oversized images, into a JPEG data URL. */
export function fileToDataUrl(
  file: File,
): Promise<{ url: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ url: canvas.toDataURL('image/jpeg', 0.92), w, h });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
