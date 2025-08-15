"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import ChatWindow from "@/components/experience-advisor/ChatWindow";
import ChatInput from "@/components/experience-advisor/ChatInput";
import MicrophoneVisualizer from "@/components/experience-advisor/MicrophoneVisualizer";
import PersonaSelector from "@/components/experience-advisor/PersonaSelector";
import TripBuddyCardReader from "@/components/TripBuddyCardReader";
import { streamExperienceMessage } from "@/services/geminiExperienceService";
import { personas } from "@/constants/personas";
import { reverseGeocodeGoogle } from "@/lib/geocode";
import { COUNTRY_TONE, applyCountryStyle } from "@/lib/tone";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isSpeaking?: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
}

// --- Helpers for more natural TTS ---
function splitIntoSpeakableChunks(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .replace(/\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g, "")
    .split(/(?<=[\.!?…])\s+/);
  return sentences.filter((s) => s.trim().length > 0);
}

function sanitizeForSpeech(text: string): string {
  let t = text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(coma|punto|signo de exclamación|signo de interrogación|barra)\b/gi, "")
    .replace(/[\[\]{}<>]/g, "")
    .replace(/\s{2,}/g, " ");
  t = t.replace(/\b\d{3,}\b/g, (m) => `${m.length} dígitos`);
  return t.trim();
}

function maskCoordinates(text: string, placeLabel?: string): string {
  if (!text) return text;
  const coordPattern = /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/g;
  return text.replace(coordPattern, () => (placeLabel ? `cerca de ${placeLabel}` : "cerca de aquí"));
}

const TripBuddyPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<"MX" | "AR" | "US" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>("default");
  const [cardReaderMode, setCardReaderMode] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speakQueueRef = useRef<string[]>([]);
  const speakingRef = useRef<boolean>(false);

  // Voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      const loadVoices = () => {
        voicesRef.current = speechSynthesisRef.current?.getVoices() || [];
      };
      speechSynthesisRef.current.onvoiceschanged = loadVoices;
      loadVoices();
    } else {
      setError((prev) => (prev ? prev + " Y síntesis de voz." : "Tu navegador no soporta síntesis de voz."));
    }
  }, []);

  const pickVoice = useCallback(
    (personaId: string): { voice: SpeechSynthesisVoice | null; lang: string } => {
      const persona = personas.find((p) => p.id === personaId);
      const desired = (persona as any)?.voiceURI;
      const desiredLang = (persona as any)?.ttsLang || "es-ES";

      const byName = desired ? voicesRef.current.find((v) => v.name === desired) : null;
      if (byName) return { voice: byName, lang: byName.lang || desiredLang };

      const regional = voicesRef.current.find((v) => v.lang?.toLowerCase() === desiredLang.toLowerCase());
      if (regional) return { voice: regional, lang: regional.lang };

      const langOnly = desiredLang.split("-")[0];
      const languageMatch = voicesRef.current.find((v) => v.lang?.toLowerCase().startsWith(langOnly));
      if (languageMatch) return { voice: languageMatch, lang: languageMatch.lang };

      const latam = voicesRef.current.find((v) => /es-(mx|ar|cl|co|pe|uy|ve|pa|cr|do|ec|gt)/i.test(v.lang || ""));
      if (latam) return { voice: latam, lang: latam.lang };
      const spain = voicesRef.current.find((v) => v.lang === "es-ES");
      if (spain) return { voice: spain, lang: spain.lang };
      const anyEs = voicesRef.current.find((v) => v.lang?.startsWith("es"));
      if (anyEs) return { voice: anyEs, lang: anyEs.lang };
      return { voice: null, lang: desiredLang };
    },
    []
  );

  // Speech queue
  const flushSpeechQueue = useCallback(
    (personaId: string) => {
      if (!speechSynthesisRef.current || speakingRef.current) return;
      const { voice, lang } = pickVoice(personaId);
      const next = speakQueueRef.current.shift();
      if (!next) return;

      const utterance = new SpeechSynthesisUtterance(next);
      utterance.voice = voice || null;
      utterance.lang = lang;
      utterance.pitch = 1;
      utterance.rate = 0.98;
      utterance.onstart = () => {
        speakingRef.current = true;
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        speakingRef.current = false;
        setIsSpeaking(false);
        if (speakQueueRef.current.length > 0) setTimeout(() => flushSpeechQueue(personaId), 120);
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      };
      speechSynthesisRef.current.speak(utterance);
    },
    [pickVoice]
  );

  const queueSpeak = useCallback(
    (text: string, personaId: string) => {
      const placeAware = maskCoordinates(text, placeName || undefined);
      const toned = applyCountryStyle(placeAware, countryCode);
      const sanitized = sanitizeForSpeech(toned);
      const chunks = splitIntoSpeakableChunks(sanitized);
      if (chunks.length === 0) return;
      speakQueueRef.current.push(...chunks);
      flushSpeechQueue(personaId);
    },
    [flushSpeechQueue, placeName, countryCode]
  );

  // Geolocation + Google reverse geocoding
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setUserLocation(loc);
          try {
            const { label, country } = await reverseGeocodeGoogle(loc.latitude, loc.longitude, "es");
            setPlaceName(label || null);
            setCountryCode((country as any) || null);
          } catch {}
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("No pudimos obtener tu ubicación. Algunas recomendaciones podrían ser menos precisas.");
        }
      );
    } else {
      setError("Tu navegador no soporta geolocalización. Algunas recomendaciones podrían ser menos precisas.");
    }
  }, []);

  // STT init
  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current!.continuous = false;
      recognitionRef.current!.interimResults = false;

      const persona = personas.find((p) => p.id === currentPersonaId) as any;
      const recLang = persona?.sttLang || persona?.ttsLang || persona?.lang || (countryCode === "US" ? "en-US" : "es-ES");
      recognitionRef.current!.lang = recLang;

      recognitionRef.current!.onstart = () => {
        setIsListening(true);
        if (speechSynthesisRef.current?.speaking) speechSynthesisRef.current.cancel();
        setIsSpeaking(false);
      };
      recognitionRef.current!.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognitionRef.current!.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Error de reconocimiento de voz: ${event.error}`);
        setIsListening(false);
      };
      recognitionRef.current!.onend = () => setIsListening(false);
    } else {
      setError("Tu navegador no soporta reconocimiento de voz.");
    }
  }, [currentPersonaId, countryCode]);

  const handleVoiceStart = () => recognitionRef.current?.start();
  const handleVoiceStop = () => recognitionRef.current?.stop();

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const newUserMessage: Message = { id: Date.now().toString(), content: text, role: "user" };
      setMessages((prev) => [...prev, newUserMessage]);
      setIsLoading(true);
      setError(null);

      try {
        let currentAIResponse = "";
        let currentSources: string[] = [];

        const prelude = countryCode && COUNTRY_TONE[countryCode] ? COUNTRY_TONE[countryCode].prelude : "";
        const systemStyle = `${prelude} No leas coordenadas ni puntuación literal. Si recibes latitud/longitud, responde con un nombre de lugar aproximado (barrio/colonia/ciudad). Sé breve y específico.`;

        await streamExperienceMessage(
          [...messages, newUserMessage],
          userLocation?.latitude || null,
          userLocation?.longitude || null,
          currentPersonaId,
          (chunk: any) => {
            if (chunk.functionCall) {
              const { name } = chunk.functionCall;
              const toolCallMessage = `¡Entendido! Simulando la acción: ${name}.`;
              setMessages((prev) => [...prev, { id: Date.now().toString(), content: toolCallMessage, role: "assistant", isSpeaking: true }]);
              queueSpeak(toolCallMessage, currentPersonaId);
            } else {
              currentAIResponse += chunk.text;
              currentSources = [...new Set([...(currentSources || []), ...(chunk.sources || [])])];

              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: currentAIResponse, sources: currentSources } : m));
                }
                return [...prev, { id: Date.now().toString(), content: currentAIResponse, role: "assistant", sources: currentSources, isSpeaking: true }];
              });

              const lastChar = chunk.text.slice(-1);
              if (/[.!?…]/.test(lastChar)) queueSpeak(currentAIResponse, currentPersonaId);
            }
          },
          (err: any) => {
            setError(err.message);
            setIsLoading(false);
            queueSpeak("Lo siento, hubo un error al procesar tu solicitud.", currentPersonaId);
          },
          { systemStyle, country: countryCode }
        );

        if (currentAIResponse && !/[.!?…]$/.test(currentAIResponse)) queueSpeak(currentAIResponse, currentPersonaId);
      } catch (err: any) {
        setError(err.message);
        queueSpeak("Lo siento, hubo un error inesperado.", currentPersonaId);
      } finally {
        setIsLoading(false);
        setMessages((prev) => prev.map((m) => (m.role === "assistant" ? { ...m, isSpeaking: false } : m)));
      }
    },
    [messages, userLocation, currentPersonaId, queueSpeak, countryCode]
  );

  // Initial greeting
  useEffect(() => {
    const persona = personas.find((p) => p.id === currentPersonaId);
    const personaName = persona ? persona.name.split(" ")[0] : "Aura";
    if (messages.length === 0 && (userLocation !== null || error)) {
      const here = placeName ? `por ${placeName}` : "por aquí";
      const initialMessageText = `¡Hola! Soy ${personaName}, tu TripBuddy. ¿Qué te gustaría descubrir ${here} hoy?`;
      setMessages([{ id: "initial-greeting", content: initialMessageText, role: "assistant", isSpeaking: true }]);
      queueSpeak(initialMessageText, currentPersonaId);
    }
  }, [userLocation, error, currentPersonaId, messages.length, placeName, queueSpeak]);

  // --- UI ---
  const demoCards = [
    { title: "Taquería de barrio con salsas caseras", dist: "a 3 min", body: "Tacos al pastor bien marcados y jugo fresco. Ideal para algo rápido." },
    { title: "Museo pequeño con piezas locales", dist: "a 8 min", body: "Curaduría íntima. Los jueves hay charla con artistas." },
    { title: "Mirador escondido", dist: "a 12 min", body: "Atardecer con vista a la ciudad. Lleva algo para sentarte." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#111827] to-[#0A2240] text-white py-12 md:py-16 px-4 md:px-8 relative overflow-hidden font-sans">
      {/* Background video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.video
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 1 }}
          autoPlay
          loop
          muted
          playsInline
          src="/videos/bg-experiences.mp4"
        />
      </div>
      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 max-w-5xl mx-auto flex flex-col h-full gap-6">
        {/* Hero / Intro */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif text-[#D4AF37] drop-shadow-lg">TripBuddy</h1>
          <p className="text-xl md:text-2xl font-medium">Tu compañero de viaje. Que sí sabe dónde estás.</p>
          <p className="max-w-3xl mx-auto text-base md:text-lg text-white/90">
            TripBuddy no es una IA. Es tu cómplice digital. Te muestra joyitas ocultas, lugares con alma y tips reales,
            justo cuando los necesitás.
          </p>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-white/70">
            Desde recomendaciones en la esquina hasta historias que nadie más te cuenta. TripBuddy es la voz local que
            vive en tu bolsillo.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                queueSpeak("TripBuddy activado. ¿Listo para descubrir algo inolvidable cerca de ti?", currentPersonaId);
                // Inicia reconocimiento de voz al activarlo:
                if (!isListening) setTimeout(() => recognitionRef.current?.start(), 150);
              }}
              className="px-5 py-3 rounded-2xl bg-[#D4AF37] text-black font-semibold shadow-lg hover:shadow-xl transition"
            >
              👉 Activar TripBuddy
            </button>
            <a
              href="#chat"
              className="px-5 py-3 rounded-2xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
            >
              👉 Descubrí qué hay cerca
            </a>
          </div>
        </section>

        {error && <div className="bg-red-800/70 text-white p-3 rounded-lg text-center">{error}</div>}

        {/* Toggle layout: Chat vs Card Reader */}
        <div className="flex items-center justify-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={cardReaderMode} onChange={(e) => setCardReaderMode(e.target.checked)} />
            Modo lector con cards (menos chat)
          </label>
        </div>

        {/* Personas */}
        <PersonaSelector onSelectPersona={setCurrentPersonaId} currentPersonaId={currentPersonaId} />

        {/* Reader UI */}
        {cardReaderMode ? (
          <TripBuddyCardReader cards={demoCards} onSpeak={(t) => queueSpeak(t, currentPersonaId)} />
        ) : (
          <div id="chat" className="flex-grow">
            <ChatWindow messages={messages} />
          </div>
        )}

        <MicrophoneVisualizer listening={isListening} />

        <ChatInput
          onSend={(text) => { void handleSendMessage(text); }}
          onVoiceStart={() => recognitionRef.current?.start()}
          onVoiceStop={() => recognitionRef.current?.stop()}
          isListening={isListening}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default TripBuddyPage;
