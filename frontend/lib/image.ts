/**
 * Shrinks big photos in the browser before upload. Vercel functions reject request bodies over ~4.5 MB,
 * and a phone photo is often 5-10 MB. Small files and GIF/SVG are sent untouched.
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; name: string }> {
  const keep = { blob: file as Blob, name: file.name };

  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return keep;
  if (file.size <= 1.5 * 1024 * 1024) return keep;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return keep;
  }

  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return keep;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= 3.5 * 1024 * 1024) {
      return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' };
    }
  }

  return keep;
}
