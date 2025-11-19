import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
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
  const flatListRef = useRef();
  
  const theme = useTheme();
  const font = useFontSettings(); 
  const { speakMessage } = useChat();

  useEffect(() => {
    if (visible) {
      const welcomeMsg = 'Olá! Eu sou o Reciclo. Como posso ajudar você hoje?';
      setMessages([{ id: '1', from: 'bot', text: welcomeMsg }]);
    }
  }, [visible]);

  // Verificar disponibilidade e permissões
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
  
      const result = await ExpoSpeechRecognitionModule.getSupportedLocales();
      
      setRecognitionAvailable(true);
      console.log('Reconhecimento de voz disponível');
      
    } catch (error) {
      console.log('Reconhecimento de voz não disponível:', error);
      setRecognitionAvailable(false);
    }
  };


  useSpeechRecognitionEvent('start', () => {
    console.log('Gravação iniciada');
    setIsRecording(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Gravação terminada');
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('Resultado:', event.results);
    const transcript = event.results[0]?.transcript;
    
    if (transcript) {
      setMessage(transcript);
      
  
      if (event.isFinal) {
        sendMessage(transcript);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Erro no reconhecimento:', event.error);
    setIsRecording(false);
    
    if (event.error !== 'no-speech') {
      Alert.alert('Erro', `Não foi possível reconhecer sua voz: ${event.message || 'Tente novamente.'}`);
    }
  });

  const startRecording = async () => {
    try {
  
      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir o uso do microfone para usar o reconhecimento de voz.');
        return;
      }

   
      setMessage('');
      
      // Tentar iniciar reconhecimento diretamente
      // O módulo vai verificar internamente se está disponível
      await ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false, 
        requiresOnDeviceRecognition: false,
      });
      
      console.log('Reconhecimento iniciado com sucesso');
      
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
      setIsRecording(false);
      
      // Mensagem de erro mais específica
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('not available') || errorMessage.includes('não disponível')) {
        Alert.alert(
          'Não disponível', 
          'O reconhecimento de voz não está disponível. Verifique se os Serviços do Google estão atualizados nas configurações do seu dispositivo.'
        );
      } else {
        Alert.alert('Erro', `Não foi possível iniciar o reconhecimento de voz: ${errorMessage}`);
      }
    }
  };

  const stopRecording = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Erro ao parar reconhecimento:', error);
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

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .trim();
  };

  const getAnswerFromFAQ = (userText) => {
    const normalizedUserText = normalizeText(userText);
    
    // 1. Tentar match exato primeiro
    for (let intent of faqData.intents) {
      const exactMatch = intent.questions.find(
        q => normalizeText(q) === normalizedUserText
      );
      if (exactMatch) return intent.answer;
    }
    
    // 2. Tentar match parcial (contém as palavras-chave)
    for (let intent of faqData.intents) {
      const partialMatch = intent.questions.find(q => {
        const normalizedQuestion = normalizeText(q);
        const userWords = normalizedUserText.split(' ');
        
        // Se 70% ou mais das palavras do usuário estão na pergunta
        const matchingWords = userWords.filter(word => 
          word.length > 2 && normalizedQuestion.includes(word)
        );
        
        return matchingWords.length >= Math.ceil(userWords.length * 0.5);
      });
      
      if (partialMatch) return intent.answer;
    }
    
    // 3. Busca por palavras-chave importantes
    const keywords = {
      'cadastro': [1, 2],
      'login': [3],
      'senha': [4, 5],
      'pontos': [6, 10, 23, 28],
      'qr': [7, 22],
      'qrcode': [7, 22],
      'beneficios': [8, 9, 26],
      'resgatar': [9, 23],
      'historico': [11],
      'perfil': [12],
      'sair': [13],
      'acessibilidade': [14],
      'fonte': [14],
      'descartar': [15, 16],
      'residuos': [15],
      'lixo': [15],
      'eletronico': [15],
      'coleta': [16],
      'ponto': [16],
      'seguranca': [17],
      'dados': [17],
      'problema': [18],
      'erro': [18],
      'bug': [18],
      'suporte': [19],
      'ajuda': [19],
      'contato': [19],
      'reciclar': [20],
      'reciclagem': [20],
      'ambiental': [20],
    };
    
    for (let [keyword, intentIds] of Object.entries(keywords)) {
      if (normalizedUserText.includes(keyword)) {
        const intent = faqData.intents.find(i => intentIds.includes(i.id));
        if (intent) return intent.answer;
      }
    }
    
    return "Desculpe, não entendi – tente reformular a pergunta. Você pode perguntar sobre cadastro, login, pontos, QR code, benefícios, descarte de resíduos, entre outros assuntos.";
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
      <KeyboardAvoidingView 
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
},

container: {
  flex: 1,
  marginTop: 'auto',
  maxHeight: '80%',
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