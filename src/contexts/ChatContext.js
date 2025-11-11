// src/contexts/ChatContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isChatVisible, setIsChatVisible] = useState(false);

  const openChat = () => setIsChatVisible(true);
  const closeChat = () => setIsChatVisible(false);

  // Text-to-Speech (fala)
  const speakMessage = useCallback(async (text) => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const ptVoice = voices.find(v => v.language === 'pt-BR');
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) await Speech.stop();

      Speech.speak(text, {
        language: 'pt-BR',
        rate: 1.0,
        pitch: 1.2,
        voice: ptVoice?.identifier,
      });
    } catch (error) {
      console.error('Erro ao falar:', error);
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      isChatVisible,
      openChat,
      closeChat,
      speakMessage,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat deve ser usado dentro de ChatProvider');
  return context;
}