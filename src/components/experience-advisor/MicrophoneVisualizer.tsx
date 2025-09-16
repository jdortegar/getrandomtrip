"use client";
export default function MicrophoneVisualizer({ listening }: { listening: boolean }) {
  return (
    <div className="my-4 text-center">
      {listening ? (
        <div className="animate-pulse text-green-600">🎤 Escuchando...</div>
      ) : (
        <div className="text-gray-500">Micrófono inactivo</div>
      )}
    </div>
  );
}