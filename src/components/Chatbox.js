// src/components/Chatbox.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import Animation from './Animation';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { useFontSettings } from '../contexts/FontContext'; 
import faqData from '../data/faq.json';

export default function Chatbox({ visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const recognitionRef = useRef(null);
  const flatListRef = useRef();
  const transcriptRef = useRef(''); // Usar ref ao invés de state
  
  const theme = useTheme();
  const font = useFontSettings(); 
  const { speakMessage } = useChat();

  useEffect(() => {
    if (visible) {
      const welcomeMsg = 'Olá! Eu sou o Reciclo. Como posso ajudar você hoje?';
      setMessages([{ id: '1', from: 'bot', text: welcomeMsg }]);
    }
  }, [visible]);

  // Verificar se o reconhecimento de voz está disponível
  useEffect(() => {
    checkRecognitionAvailability();
    
    // Cleanup ao desmontar
    return () => {
      if (recognitionRef.current && Platform.OS === 'web') {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const checkRecognitionAvailability = () => {
    if (Platform.OS === 'web') {
      // Verificar se o navegador suporta Web Speech API
      const webSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setRecognitionAvailable(webSupport);
      
      if (webSupport) {
        // Inicializar Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.continuous = true; // Mudar para true para não desligar rápido
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          // Apenas armazenar na ref, NÃO atualizar o campo de texto
          transcriptRef.current = transcript;
          
          console.log('Transcrição:', transcript); // Debug
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Erro no reconhecimento:', event.error);
          setIsRecording(false);
          
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            Alert.alert('Erro', 'Não foi possível reconhecer sua voz. Tente novamente.');
          }
        };
        
        recognitionRef.current.onend = () => {
          console.log('Reconhecimento terminou. Texto:', transcriptRef.current); // Debug
          setIsRecording(false);
          
          // Enviar a mensagem se houver texto
          const finalText = transcriptRef.current.trim();
          if (finalText) {
            console.log('Enviando mensagem:', finalText); // Debug
            sendMessage(finalText);
            transcriptRef.current = ''; // Limpar a ref
          }
        };
      } else {
        console.log('Web Speech API não disponível. Use Chrome ou Edge.');
      }
    } else {
      // Para mobile, assumir disponível (requer development build)
      setRecognitionAvailable(true);
    }
  };

  const startRecording = async () => {
    if (!recognitionAvailable) {
      Alert.alert(
        'Não disponível', 
        Platform.OS === 'web' 
          ? 'Use o navegador Chrome ou Edge para reconhecimento de voz.'
          : 'Reconhecimento de voz requer um development build. Não funciona no Expo Go.'
      );
      return;
    }

    try {
      setIsRecording(true);
      transcriptRef.current = ''; // Limpar transcrição anterior
      setMessage(''); // Limpar campo de texto
      
      if (Platform.OS === 'web') {
        // Usar Web Speech API nativa
        recognitionRef.current.start();
        console.log('Gravação iniciada'); // Debug
      } else {
        // Para mobile (requer development build e expo-speech-recognition)
        Alert.alert(
          'Development Build necessário',
          'O reconhecimento de voz não funciona no Expo Go. Você precisa criar um development build para usar essa funcionalidade no celular.'
        );
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setIsRecording(false);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Parando gravação manualmente'); // Debug
      if (Platform.OS === 'web' && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // O onend vai lidar com o envio da mensagem
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      setIsRecording(false);
    }
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), from: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setMessage('');

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
              { 
                fontSize: font.fontSize.md, 
                lineHeight: font.fontSize.md + 5,
                fontFamily: font.fontFamily,
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

  if (!visible || !font.fontLoaded) return null;

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
                  { 
                    fontSize: font.fontSize.lg, 
                    fontWeight: '600', 
                    marginLeft: 12, 
                    fontFamily: font.fontFamily,
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
                {
                  flex: 1,
                  marginHorizontal: 8,
                  padding: 12,
                  borderRadius: theme.borderRadius.round,
                  fontSize: font.fontSize.md,
                  fontFamily: font.fontFamily,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Digite ou fale sua mensagem..."
              placeholderTextColor={theme.colors.text.secondary}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={() => sendMessage(message)}
              multiline
            />

            {/* Botão de Microfone */}
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && { backgroundColor: theme.colors.error }
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <IconButton
                icon={isRecording ? "stop" : "microphone"}
                size={24}
                iconColor={isRecording ? "#fff" : theme.colors.primary}
              />
            </TouchableOpacity>

            {/* Botão de Enviar */}
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

          {/* Indicador de Gravação */}
          {isRecording && (
            <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.recordingText}>🎤 Ouvindo...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
  
  botMessageContainer: {
    justifyContent: 'flex-start',
  },

  userMessageContainer: {
    justifyContent: 'flex-end',
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

  micButton: {
    padding: 4,
    borderRadius: 20,
  },
  
  sendButton: {
    padding: 4,
  },

  recordingIndicator: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  recordingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});