import { useCallback, useEffect, useRef, useState } from "react";

import { readFileAsDataUrl } from "@/shared/lib";

type Result = { durationSec: number; mime: string; size: number; url: string };

/** Запись голосового через MediaRecorder. Таймер и отмена — как в мессенджерах */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<null | number>(null);
  const stream = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setElapsed(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      throw new Error("unsupported");
    }
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream.current);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start(200);
    recorder.current = rec;
    startedAt.current = performance.now();
    setRecording(true);
    timer.current = window.setInterval(
      () =>
        setElapsed(Math.floor((performance.now() - startedAt.current) / 1000)),
      250,
    );
  }, []);

  const stop = useCallback(async (): Promise<null | Result> => {
    const rec = recorder.current;
    if (!rec) return null;
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - startedAt.current) / 1000),
    );
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () =>
        resolve(
          new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }),
        );
      rec.stop();
    });
    cleanup();
    const url = await readFileAsDataUrl(
      new File([blob], "voice", { type: blob.type }),
    );
    return { url, durationSec, size: blob.size, mime: blob.type };
  }, [cleanup]);

  const cancel = useCallback(() => {
    recorder.current?.stop();
    cleanup();
  }, [cleanup]);

  return { recording, elapsed, start, stop, cancel };
}
