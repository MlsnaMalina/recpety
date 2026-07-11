"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation() {
  const [supported, setSupported] = useState(false);
  const [listeningId, setListeningId] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => recRef.current?.abort();
  }, []);

  const start = useCallback(
    (id: string, onText: (text: string) => void) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      recRef.current?.abort();

      const rec = new Ctor();
      rec.lang = "cs-CZ";
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) onText(text.trim());
      };
      rec.onerror = () => setListeningId(null);
      rec.onend = () => setListeningId(null);
      recRef.current = rec;
      setListeningId(id);
      try {
        rec.start();
      } catch {
        setListeningId(null);
      }
    },
    []
  );

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListeningId(null);
  }, []);

  return { supported, listeningId, start, stop };
}
