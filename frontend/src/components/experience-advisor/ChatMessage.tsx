'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MessagePart {
  text: string;
}

interface Message {
  id: string;
  text: string;
  type: 'user' | 'ai';
  sources?: string[];
  isSpeaking?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (message.type === 'ai') {
      let i = 0;
      const typingInterval = setInterval(() => {
        setDisplayedText(message.text.substring(0, i));
        i++;
        if (i > message.text.length) {
          clearInterval(typingInterval);
        }
      }, 10); // Adjust typing speed here
      return () => clearInterval(typingInterval);
    } else {
      setDisplayedText(message.text);
    }
  }, [message.text, message.type]);

  const messageClasses = message.type === 'user'
    ? 'bg-[#D4AF37]/20 text-white self-end rounded-br-none'
    : 'bg-gray-800/70 text-white self-start rounded-bl-none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col max-w-[70%] p-3 rounded-lg shadow-md ${messageClasses}`}
    >
      <p>{displayedText}</p>
      {message.sources && message.sources.length > 0 && (
        <div className="mt-2 text-gray-400 text-xs">
          <p className="font-semibold">Fuentes:</p>
          <ul className="list-disc list-inside">
            {message.sources.map((source, index) => (
              <li key={index}>
                <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {message.type === 'ai' && message.isSpeaking && (
        <motion.div
          className="ml-2 inline-block"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[#D4AF37]">●</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
