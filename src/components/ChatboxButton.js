// src/components/ChatboxButton.js
import React, { useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated, Easing, View, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import Chatbox from './Chatbox';
import Animation from './Animation';

// Constantes de layout
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_SIZE = 60; // Tamanho base do botão (width/height em floatingButton)
const MARGIN = 20;

// Posição inicial (canto inferior direito)
const INITIAL_X = SCREEN_WIDTH - BUTTON_SIZE - MARGIN;
const INITIAL_Y = SCREEN_HEIGHT - BUTTON_SIZE - MARGIN - 200; // Ajuste para a sua posição inicial de 240

export default function ChatboxButton() {
  const { isChatVisible, openChat, closeChat } = useChat();
  const theme = useTheme();

  // 1. ANIMAÇÕES EXISTENTES
  const bubbleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 2. NOVOS VALORES DE POSIÇÃO PARA ARRASTO
  // position armazena a posição x e y, e também é o valor para aplicar os estilos.
  const position = useRef(new Animated.ValueXY({ x: INITIAL_X, y: INITIAL_Y })).current;

  // Variável de controle para diferenciar clique de arrasto
  const isDragging = useRef(false);
  const dragThreshold = 5; // Limite de movimento para considerar arrasto

  // 3. PANRESPONDER PARA GESTOS
  const panResponder = useRef(
    PanResponder.create({
      // Permite que o componente responda ao toque/movimento
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      // Início do arrasto
      onPanResponderGrant: () => {
        // Para evitar que a animação inicial interfira no arrasto
        position.setOffset({ x: position.x._value, y: position.y._value });
        position.setValue({ x: 0, y: 0 }); // Zera o valor delta
        isDragging.current = false;
      },

      // Durante o arrasto
      onPanResponderMove: (e, gestureState) => {
        // Se o movimento for maior que o limite, marca como arrasto
        if (Math.abs(gestureState.dx) > dragThreshold || Math.abs(gestureState.dy) > dragThreshold) {
          isDragging.current = true;
        }

        // Calcula a nova posição, limitando dentro da tela
        const newX = position.x._offset + gestureState.dx;
        const newY = position.y._offset + gestureState.dy;

        const boundedX = Math.max(MARGIN, Math.min(newX, SCREEN_WIDTH - BUTTON_SIZE - MARGIN));
        const boundedY = Math.max(MARGIN, Math.min(newY, SCREEN_HEIGHT - BUTTON_SIZE - MARGIN));
        
        // Atualiza a posição animada
        position.setValue({ x: boundedX - position.x._offset, y: boundedY - position.y._offset });
      },

      // Fim do arrasto
      onPanResponderRelease: (e, gestureState) => {
        position.flattenOffset(); // Seta a posição final como o valor base

        // Se NÃO foi arrasto (ou foi um toque rápido)
        if (!isDragging.current) {
          openChat();
        }
        isDragging.current = false;
      },
    }),
  ).current;

  // Efeitos de Animação existentes (mantidos)
  useEffect(() => {
    // ... (Seu código de animação bubblePulse e rotateAnim)
    const bubblePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleAnim, {
          toValue: 1.25,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    bubblePulse.start();
    rotate.start();

    return () => {
      bubblePulse.stop();
      rotate.stop();
    };
  }, [bubbleAnim, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <Animated.View
        // Aplica o PanResponder
        {...panResponder.panHandlers}
        style={[
          styles.floatingButton, 
          { 
            backgroundColor: theme.colors.background,
            // APLICA AS POSIÇÕES DE ARRASTO E REMOVE AS POSIÇÕES FIXAS DO STYLESHEET
            transform: [{ translateX: position.x }, { translateY: position.y }],
            // Adiciona a sombra para dar a sensação de flutuação
            ...theme.shadows.md, 
          }
        ]}
      >
        {/* Ações de toque são tratadas pelo onPanResponderRelease,
            o TouchableOpacity é removido para evitar conflitos de gestos */}
        <View style={styles.contentWrapper}>
            {/* componente de animação/logo */}
            <Animation />

            {/* ícone circular de chat */}
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="chatbubble" size={24} color={theme.colors.primary} />
            </View>
        </View>
      </Animated.View>

      <Chatbox
        visible={isChatVisible}
        onClose={closeChat}
        mascotSource={require('../../assets/logo.png')}
        apiEndpoint="https://sua-api.com/faq"
      />
    </>
  );
}

const styles = StyleSheet.create({
  // O floatingButton agora tem apenas estilos de dimensão e aparência, 
  // as posições 'top', 'bottom', 'left', 'right' foram removidas
  floatingButton: {
    position: 'absolute',
    width: BUTTON_SIZE, // 60
    height: BUTTON_SIZE, // 60
    borderRadius: 100,
    zIndex: 9999, // ZIndex alto para ficar acima de tudo
    justifyContent: 'center',
    alignItems: 'center',
    // O padding e as sombras originais foram removidas daqui para simplificar a aplicação do PanResponder
  },
  contentWrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});