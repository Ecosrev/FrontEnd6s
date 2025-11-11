// src/components/Chatbox.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { IconButton } from 'react-native-paper';
import Animation from './Animation';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
// IMPORTAÇÃO CORRIGIDA
import { useFontSettings } from '../contexts/FontContext'; 
import faqData from '../data/faq.json';

export default function Chatbox({ visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const flatListRef = useRef();
  
  const theme = useTheme();
  // PEGANDO AS CONFIGURAÇÕES DE FONTE DO CONTEXTO
  const font = useFontSettings(); 
  
  const { speakMessage } = useChat();

  useEffect(() => {
    if (visible) {
      const welcomeMsg = 'Olá! Eu sou o Reciclo. Como posso ajudar você hoje?';
      setMessages([{ id: '1', from: 'bot', text: welcomeMsg }]);
    }
  }, [visible]);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), from: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setMessage('');

    // buscar resposta no JSON local
    const answer = getAnswerFromFAQ(text);
    const botMsg = { id: (Date.now() + 1).toString(), from: 'bot', text: answer };
    setMessages((m) => [...m, botMsg]);
  };

  const getAnswerFromFAQ = (userText) => {
    for (let intent of faqData.intents) {
      const match = intent.questions.find(
        q => q.toLowerCase() === userText.toLowerCase()
      );
      if (match) return intent.answer;
    }
    return "Desculpe, não entendi — tente reformular a pergunta.";
  };

  const renderMessage = ({ item }) => {
    const isBot = item.from === 'bot';

    // Se a fonte não estiver carregada, podemos retornar null ou um placeholder
    if (!font.fontLoaded) return null; 

    return (
      <View
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Image
              source={require('../../assets/mascote.png')}
              style={styles.botAvatarImage}
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            { backgroundColor: isBot ? theme.colors.surface : theme.colors.primary },
          ]}
        >
          <Text
            style={[
              // APLICANDO O TAMANHO E FAMÍLIA DE FONTE
              { 
                fontSize: font.fontSize.md, 
                lineHeight: font.fontSize.md + 5, // Ajuste dinâmico do line height
                fontFamily: font.fontFamily, // Aplica a família de fonte
                color: isBot ? theme.colors.text.primary : theme.colors.text.inverse 
              }
            ]}
          >
            {item.text}
          </Text>

          {isBot && (
            <TouchableOpacity
              onPress={() => speakMessage(item.text)}
              style={styles.speakerButton}
            >
              <IconButton
                icon="volume-high"
                size={18}
                iconColor={theme.colors.primary}
                style={{ margin: 0 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!visible || !font.fontLoaded) return null; // Garante que a fonte esteja carregada antes de renderizar

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <Animation />
              <Text 
                style={[
                  // APLICANDO O TAMANHO E FAMÍLIA DE FONTE
                  { 
                    fontSize: font.fontSize.lg, 
                    fontWeight: '600', 
                    marginLeft: 12, 
                    fontFamily: font.fontFamily, // Aplica a família de fonte
                    color: theme.colors.text.primary 
                  }
                ]}
              >
                Chatbox EcosRev
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor={theme.colors.text.primary}
            />
          </View>

          {/* Chat Content */}
          <View style={styles.content}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messages}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          </View>

          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <TextInput
              style={[
                // APLICANDO O TAMANHO E FAMÍLIA DE FONTE
                {
                  flex: 1,
                  marginHorizontal: 8,
                  padding: 12,
                  borderRadius: theme.borderRadius.round,
                  fontSize: font.fontSize.md,
                  fontFamily: font.fontFamily, // Aplica a família de fonte
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={theme.colors.text.secondary}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={() => sendMessage(message)}
              multiline
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => sendMessage(message)}
              disabled={!message.trim()}
            >
              <IconButton
                icon="send"
                size={24}
                iconColor={
                  message.trim()
                    ? theme.colors.primary
                    : theme.colors.text.secondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// O objeto styles.create permanece o mesmo do seu último código (sem fontes fixas)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  
  container: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  messages: {
    padding: 16,
    flexGrow: 1,
  },
  
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  
  botAvatar: {
    marginRight: 8,
  },
  
  botAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  
  speakerButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  
  sendButton: {
    padding: 4,
  },
});