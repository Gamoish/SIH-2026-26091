/**
 * Turning a picked file into the stored profile photo.
 *
 * Extracted from the phone's EditPhotoScreen when the desktop grew its own
 * picker: the size, the crop and the quality are the one thing the two layouts
 * must not disagree about, since they write the same session field.
 *
 * The session is persisted to localStorage, so the photo has to stay small.
 * 256px square at JPEG q0.8 lands around 15-20KB.
 * Deliberately a fixed centre crop, with no pinch-to-reposition. Add an interactive
 * cropper only if users actually complain about the framing.
 */
export const PHOTO_SIZE = 256;

export function toSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no 2d context'));
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}
