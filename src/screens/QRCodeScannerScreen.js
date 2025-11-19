import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSettings } from '../contexts/FontContext';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function QRCodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [scannedData, setScannedData] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const theme = useTheme();
  const { fontSize, fontFamily } = useFontSettings();
  const [token, setToken] = useState(null);
  const navigation = useNavigation();
  const scanningRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Reseta o estado quando a tela ganha/perde foco
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      setScanned(false);
      scanningRef.current = false;
      setCameraReady(false);
      
      // Pequeno delay para garantir que a câmera inicialize
      const timer = setTimeout(() => {
        setCameraReady(true);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        setIsFocused(false);
        setScanned(false);
        scanningRef.current = false;
        setCameraReady(false);
      };
    }, [])
  );

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permissionText, { color: theme.colors.text.primary, fontSize: fontSize.md, fontFamily }]}>
          Precisamos de permissão para usar a câmera
        </Text>
        <Button
          onPress={requestPermission}
          title="Permitir Câmera"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  const fetchUserPoints = async () => {
    if (!token) return 0;

    try {
      const response = await api.get(`/usuario/pontos`, {
        headers: { "access-token": token }
      });

      if (response.data) {
        return response.data.pontos;
      }
    } catch (error) {
      console.error("Error fetching user points:", error);
    }

    return 0;
  };

  const updateUserPoints = async (pontos, hash) => {
    if (!token) return;

    const currentPoints = await fetchUserPoints();
    const newPoints = currentPoints + pontos;

    await api.put(
      `/usuario/pontos`,
      { pontos: newPoints },
      { headers: { "access-token": token } }
    );

    await api.post(`/hist/pontos`, {
        idUsuario: await AsyncStorage.getItem('user'),
        pontos: pontos,
        id: hash
    })
      .then(response => {
        console.log('Resposta:', response.data);
      })
      .catch(error => {
        console.error('Erro:', error);
      });
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanningRef.current) return;
    scanningRef.current = true;

    try {
      const parsedData = JSON.parse(data);
      setScanned(true);
      setScannedData(parsedData);

      await updateUserPoints(parsedData.pontos, parsedData.hash);
      setAlertVisible(true);
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      scanningRef.current = false;
      setScanned(false);
    }
  };

  const handleCloseAlert = () => {
    setAlertVisible(false);
    setScanned(false);
    scanningRef.current = false;
    navigation.navigate('Main', { screen: 'HomeTab' });
  };

  // Não renderiza a câmera se a tela não estiver focada ou não estiver pronta
  if (!isFocused || !cameraReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary, fontSize: fontSize.sm, fontFamily }]}>
          Iniciando câmera...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        barCodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={styles.scanArea}>
            <Text style={[styles.overlayText, { fontSize: fontSize.md, fontFamily, color: theme.colors.text.primary }]}>
              Posicione o QR Code dentro da área
            </Text>
          </View>
        </View>
      </CameraView>

      <CustomAlert
        visible={alertVisible}
        title="QR Code Escaneado"
        message={`Você recebeu ${scannedData.pontos} pontos!`}
        onClose={handleCloseAlert}
        onConfirm={() => {
          setAlertVisible(false);
          setScanned(false);
          scanningRef.current = false;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
});