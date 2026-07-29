import { useEffect, useMemo, useState } from "react";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

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
    if (ExpoSpeechRecognitionModule && typeof ExpoSpeechRecognitionModule.start === "function") {
      return ExpoSpeechRecognitionModule as unknown as SpeechRecognitionModule;
    }
  } catch (e) {
    console.log("[voice-expense] module fallback", e);
  }
  return null;
}

export function useVoiceExpenseInput() {
  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    speechModule ? "unknown" : "unsupported"
  );

  const parsedExpense: ParsedVoiceExpense = useMemo(() => {
    return parseTurkishExpense(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!speechModule) return undefined;

    // PRE-REQUEST PERMISSION ON MOUNT SO IT WORKS ON FIRST TAP WITHOUT RESTART
    speechModule.requestPermissionsAsync().then((res) => {
      if (res.granted) {
        setPermissionStatus("granted");
      }
    }).catch(() => {});

    const startListener = speechModule.addListener("start", () => {
      setIsListening(true);
      setError("");
    });

    const endListener = speechModule.addListener("end", () => {
      setIsListening(false);
    });

    const resultListener = speechModule.addListener("result", (event) => {
      const text = event.results?.[0]?.transcript?.trim() || "";
      if (text) {
        setTranscript(text);
      }
    });

    const errorListener = speechModule.addListener("error", (event) => {
      if (event.error === "no-speech") return;
      setIsListening(false);
      console.log("[voice-expense] error event:", event);
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
      setPermissionStatus("unsupported");
      setError("Ses tanıma bu cihazda kullanılamıyor.");
      return;
    }

    try {
      const permission = await speechModule.requestPermissionsAsync();
      if (!permission.granted) {
        setPermissionStatus("denied");
        setError("Mikrofon izni verilmedi.");
        return;
      }
      setPermissionStatus("granted");
    } catch {
      setPermissionStatus("unsupported");
      return;
    }

    setError("");
    setTranscript("");

    try {
      speechModule.stop();
      speechModule.abort();
    } catch {}

    setTimeout(() => {
      try {
        speechModule.start({
          lang: "tr-TR",
          interimResults: true,
          continuous: true,
          addsPunctuation: true
        });
      } catch (e) {
        console.log("[voice-expense] start error", e);
        try {
          speechModule.start({
            lang: "tr-TR",
            interimResults: true
          });
        } catch (e2) {
          setIsListening(false);
          setError("Mikrofon başlatılamadı, lütfen tekrar deneyin.");
        }
      }
    }, 250);
  }

  function stopListening() {
    if (!speechModule) return;
    try {
      speechModule.stop();
      speechModule.abort();
    } catch {}
    setIsListening(false);
  }

  function clearTranscript() {
    setTranscript("");
  }

  return {
    isListening,
    transcript,
    error,
    permissionStatus,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
    parsedExpense
  };
}
