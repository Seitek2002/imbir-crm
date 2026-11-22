import type { Attachment, MessageKind } from "../api/types";
import { uid } from "./id";
import { compressImage, readFileAsDataUrl } from "./image";

const MAX_INLINE_FILE = 350 * 1024;

/**
 * Файл → вложение для отправки. Фото ужимаются и хранятся целиком,
 * небольшие файлы — тоже; видео и крупные файлы — только метаданные
 * (в демо их негде хранить, вместо превью рисуется заглушка).
 */
export async function fileToAttachment(
  file: File,
): Promise<{ attachment: Attachment; kind: MessageKind }> {
  if (file.type.startsWith("image/") && !file.type.includes("svg")) {
    const { url, width, height } = await compressImage(file);
    return {
      kind: "image",
      attachment: {
        id: uid("a"),
        name: file.name,
        mime: "image/jpeg",
        size: Math.round(url.length * 0.75),
        url,
        width,
        height,
      },
    };
  }
  if (file.type.startsWith("video/")) {
    const durationSec = await probeVideoDuration(file).catch(() => 0);
    return {
      kind: "video",
      attachment: {
        id: uid("a"),
        name: file.name,
        mime: file.type,
        size: file.size,
        durationSec,
        placeholder: "video",
      },
    };
  }
  const url =
    file.size <= MAX_INLINE_FILE ? await readFileAsDataUrl(file) : undefined;
  return {
    kind: "file",
    attachment: {
      id: uid("a"),
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      url,
    },
  };
}

function probeVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(v.duration || 0));
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video"));
    };
    v.src = url;
  });
}
