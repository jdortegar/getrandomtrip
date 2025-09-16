"use client";
import { useState } from "react";

export interface ChatInputProps {
  onSend: (msg: string) => void | Promise<void>;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
}

export default function ChatInput({
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  isLoading = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const msg = value.trim();
    setValue("");
    void onSend(msg);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isLoading ? 'Enviando...' : 'Escribe tu mensaje...'}
        className="flex-1 rounded border px-3 py-2"
        disabled={isLoading}
      />
      <button type="submit" className="rounded px-4 py-2 border" disabled={isLoading}>
        Enviar
      </button>
      {onVoiceStart && (
        <button type="button" onClick={onVoiceStart} className="rounded px-3 py-2 border" disabled={isListening}>
          🎙️
        </button>
      )}
      {onVoiceStop && isListening && (
        <button type="button" onClick={onVoiceStop} className="rounded px-3 py-2 border">
          ⏹️
        </button>
      )}
    </form>
  );
}
