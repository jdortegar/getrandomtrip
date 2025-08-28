'use client'
import { MessageCircle } from 'lucide-react'

export default function ChatFab() {
  return (
    <button
      type="button"
      aria-label="Abrir chat"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-white shadow-lg hover:bg-violet-500"
      onClick={() => alert('Chat (dummy)')}
    >
      <MessageCircle size={18} />
      Chat
    </button>
  )
}
