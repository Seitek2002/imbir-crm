/**
 * Ужимает картинку до maxSide по большей стороне и отдаёт JPEG data URL.
 * Нужно, чтобы фото из чата помещались в localStorage (лимит ~5 МБ).
 */
export async function compressImage(
  file: File,
  maxSide = 1280,
  quality = 0.8,
): Promise<{ height: number; url: string; width: number }> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = bitmapUrl;
    });
    const scale = Math.min(
      1,
      maxSide / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, width, height);
    return { url: canvas.toDataURL("image/jpeg", quality), width, height };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
