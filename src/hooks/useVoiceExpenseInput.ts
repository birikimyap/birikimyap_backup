import { useEffect, useMemo, useState } from "react";

import { ParsedVoiceExpense, parseTurkishExpense } from "@/utils/voiceExpense";

type PermissionStatus = "unknown" | "granted" | "denied" | "unsupported";

type SpeechRecognitionModule = {
  addListener: (eventName: string, listener: (event: any) => void) => { remove: () => void };
  abort: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean; status?: string }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
};

function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  try {
    const module = require("expo-speech-recognition").ExpoSpeechRecognitionModule;
    return module?.start && module?.requestPermissionsAsync ? module : null;
  } catch {
    return null;
  }
}

export function useVoiceExpenseInput() {
  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(speechModule ? "unknown" : "unsupported");

  const parsedExpense: ParsedVoiceExpense = useMemo(() => {
    const parsed = parseTurkishExpense(transcript);

    if (transcript.trim()) {
      console.log("[voice-expense] parsing result", parsed);
    }

    return parsed;
  }, [transcript]);

  useEffect(() => {
    if (!speechModule) {
      return undefined;
    }

    const startListener = speechModule.addListener("start", () => {
      setIsListening(true);
      setError("");
    });
    const endListener = speechModule.addListener("end", () => {
      setIsListening(false);
    });
    const resultListener = speechModule.addListener("result", (event) => {
      const nextTranscript = event.results?.[0]?.transcript?.trim() || "";
      console.log("[voice-expense] transcript result", {
        transcript: nextTranscript,
        isFinal: event.isFinal,
        results: event.results
      });

      if (nextTranscript) {
        setTranscript(nextTranscript);
      }
    });
    const errorListener = speechModule.addListener("error", (event) => {
      const message = event.error === "not-allowed" ? "Mikrofon izni gerekli." : "Ses anlaşılamadı, tekrar dene.";
      setIsListening(false);
      setError(message);
      console.log("[voice-expense] listening started", { ok: false, error: event });
    });

    return () => {
      startListener.remove();
      endListener.remove();
      resultListener.remove();
      errorListener.remove();
    };
  }, [speechModule]);

  async function startListening() {
    if (!speechModule) {
      const message = "Expo Go’da gerçek ses tanıma desteklenmiyor. Development build gerekir.";
      setPermissionStatus("unsupported");
      setError(message);
      setIsListening(false);
      console.log("[voice-expense] listening started", { ok: false, reason: "speech module unavailable" });
      return;
    }

    setError("");

    let permission: { granted: boolean; status?: string };

    try {
      permission = await speechModule.requestPermissionsAsync();
      console.log("[voice-expense] permission result", permission);
    } catch (permissionError) {
      setPermissionStatus("unsupported");
      setError("Expo Go’da gerçek ses tanıma desteklenmiyor. Development build gerekir.");
      setIsListening(false);
      console.log("[voice-expense] permission result", { granted: false, error: permissionError });
      return;
    }

    if (!permission.granted) {
      setPermissionStatus("denied");
      setError("Mikrofon izni gerekli.");
      return;
    }

    setPermissionStatus("granted");
    setTranscript("");
    setIsListening(true);

    try {
      speechModule.start({
        lang: "tr-TR",
        interimResults: true,
        continuous: false,
        contextualStrings: ["kahve", "market", "alışveriş", "taksi", "benzin", "yemek", "lira", "harcadım", "aldım"]
      });
      console.log("[voice-expense] listening started", { ok: true, lang: "tr-TR" });
    } catch (startError) {
      setPermissionStatus("unsupported");
      setError("Expo Go’da gerçek ses tanıma desteklenmiyor. Development build gerekir.");
      setIsListening(false);
      console.log("[voice-expense] listening started", { ok: false, error: startError });
    }
  }

  function stopListening() {
    if (!speechModule) {
      setIsListening(false);
      return;
    }

    speechModule.stop();
    setIsListening(false);
  }

  useEffect(() => {
    return () => {
      speechModule?.abort();
    };
  }, [speechModule]);

  return {
    isListening,
    transcript,
    error,
    permissionStatus,
    startListening,
    stopListening,
    setTranscript,
    parsedExpense
  };
}
