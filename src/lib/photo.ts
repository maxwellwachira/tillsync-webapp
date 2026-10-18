/** Largest the saved photo may be, in characters of its data URL. The Firestore rules allow 40,000. */
const MAX_CHARS = 36_000;
const SIZE = 256;

/**
 * Turns a picked image into a small square JPEG data URL: the middle of the picture is cropped to a square, scaled to
 * 256 px, and compressed until it fits. Throws if the file is not an image the browser can read.
 */
export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('unreadable');
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  for (let q = 0.85; q >= 0.4; q -= 0.1) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('too-big');
}
