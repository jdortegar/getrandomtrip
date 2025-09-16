"use client";
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWindow({ messages }: { messages: Message[] }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow mb-4">
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
          <p className={m.role === "user" ? "bg-gray-200 inline-block p-2 rounded-lg" : "bg-yellow-100 inline-block p-2 rounded-lg"}>
            {m.content}
          </p>
        </div>
      ))}
    </div>
  );
}