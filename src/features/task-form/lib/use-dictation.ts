import { useCallback, useRef, useState } from "react";

import { useSettings } from "@/shared/model";

// Web Speech API пока без типов в lib.dom
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
};

function createRecognition(): null | Recognition {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/** Диктовка: распознанные фразы отдаются в onText по мере готовности */
export function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const rec = useRef<null | Recognition>(null);
  const language = useSettings((s) => s.language);

  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  const supported = Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);

  const stop = useCallback(() => {
    rec.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const r = createRecognition();
    if (!r) return false;
    r.lang = language === "en" ? "en-US" : "ru-RU";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim());
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    rec.current = r;
    setListening(true);
    return true;
  }, [language, onText]);

  return { listening, start, stop, supported };
}
