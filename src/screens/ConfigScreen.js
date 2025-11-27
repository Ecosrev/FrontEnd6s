//src\screens\ConfigScreen.js
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../contexts/ThemeContext";
import { useFontSettings } from "../contexts/FontContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from '../version';

const ConfigScreen = () => {
  const { colors, themeMode, updateThemeMode, spacing } = useTheme();
  const { fontSize, updateFontSize, fontPreference, updateFontPreference } = useFontSettings();
  const [currentThemeMode, setCurrentThemeMode] = useState(themeMode);
  const [currentFontPreference, setCurrentFontPreference] = useState(fontPreference);
  const [latestVersion, setLatestVersion] = useState(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const navigation = useNavigation();

  // Configurações do repositório GitHub
  const GITHUB_OWNER = "Ecosrev"; 
  const GITHUB_REPO = "FrontEnd6s";
  
  // Link do Google Drive para download do APK
  const DOWNLOAD_URL = "https://drive.google.com/file/d/1bfan-ow3i3DbMVeEI6vHYEGvK2sWSSVJ/view?usp=sharing";

  useEffect(() => {
    setCurrentThemeMode(themeMode);
    setCurrentFontPreference(fontPreference);
  }, [themeMode, fontPreference]);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const compareVersions = (v1, v2) => {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  };

  const checkForUpdates = async () => {
    try {
      setIsLoadingVersion(true);
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const version = data.tag_name.replace(/^v/, '');
        setLatestVersion(version);
        
        const comparison = compareVersions(version, APP_VERSION);
        setUpdateAvailable(comparison > 0);
        
      } else {
        const tagsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/tags`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (tagsResponse.ok) {
          const tags = await tagsResponse.json();
          if (tags.length > 0) {
            const version = tags[0].name.replace(/^v/, '');
            setLatestVersion(version);
            
            const comparison = compareVersions(version, APP_VERSION);
            setUpdateAvailable(comparison > 0);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar versão do GitHub:', error);
    } finally {
      setIsLoadingVersion(false);
    }
  };

  const handleUpdatePress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(DOWNLOAD_URL);
      if (canOpen) {
        await Linking.openURL(DOWNLOAD_URL);
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível abrir o link de download.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao tentar abrir o link de download.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleThemeChange = (mode) => {
    setCurrentThemeMode(mode);
    updateThemeMode(mode);
  };

  const handleFontSizeChange = (size) => {
    updateFontSize(size);
  };

  const handleFontPreferenceChange = (font) => {
    setCurrentFontPreference(font);
    updateFontPreference(font);
  };

  const getRadioButtonStyle = (isSelected) => {
    const borderColor = themeMode === 'dark' ? '#fff' : '#000';
    const backgroundColor = isSelected ? colors.primary : 'transparent';

    return {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      borderColor: borderColor,
      backgroundColor: backgroundColor,
    };
  };

  return (
    <SafeAreaView edges={['left','right','bottom']} style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView>
        <Text style={[styles.title, { color: colors.primary, fontSize: fontSize.lg }]}>Configurações</Text>

        {/* Opção de Tema */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.md }]}>Tema</Text>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Automático</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentThemeMode === "automatic")}
              onPress={() => handleThemeChange("automatic")}
            />
          </View>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Claro</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentThemeMode === "light")}
              onPress={() => handleThemeChange("light")}
            />
          </View>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Escuro</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentThemeMode === "dark")}
              onPress={() => handleThemeChange("dark")}
            />
          </View>
        </View>

        {/* Opção de Tamanho da Fonte */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.md }]}>Tamanho da Fonte</Text>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Pequeno</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentFontPreference === "small")}
              onPress={() => handleFontPreferenceChange("small")}
            />
          </View>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Médio</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentFontPreference === "medium")}
              onPress={() => handleFontPreferenceChange("medium")}
            />
          </View>
          <View style={[styles.optionRow, { borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Grande</Text>
            <TouchableOpacity
              style={getRadioButtonStyle(currentFontPreference === "large")}
              onPress={() => handleFontPreferenceChange("large")}
            />
          </View>
        </View>

        {/* Versão do App */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.md }]}>Versão do App</Text>
          
          <View style={styles.versionContainer}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm, fontWeight: 'bold' }]}>
                Versão Atual: {APP_VERSION}
              </Text>
              {latestVersion && (
                <Text style={[styles.optionText, { color: colors.text.secondary, fontSize: fontSize.xs, marginTop: 4 }]}>
                  Última versão disponível: {latestVersion}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={checkForUpdates}
              style={styles.refreshButton}
              disabled={isLoadingVersion}
            >
              {isLoadingVersion ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Botão de Atualização */}
          {updateAvailable && (
            <TouchableOpacity 
              style={[styles.updateButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdatePress}
            >
              <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[styles.updateButtonText, { fontSize: fontSize.sm }]}>
                Baixar versão {latestVersion}
              </Text>
            </TouchableOpacity>
          )}

          {/* Mensagem quando está atualizado */}
          {latestVersion && !updateAvailable && !isLoadingVersion && (
            <View style={[styles.upToDateNotice, { backgroundColor: colors.success + '15' || '#4CAF5015', borderColor: colors.success || '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success || '#4CAF50'} style={{ marginRight: 8 }} />
              <Text style={[styles.upToDateText, { color: colors.success || '#4CAF50', fontSize: fontSize.xs }]}>
                Seu app está atualizado
              </Text>
            </View>
          )}
        </View>

        {/* Contato / Suporte */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.md }]}>Contato / Suporte</Text>
          <TouchableOpacity style={[styles.optionRow, { borderColor: colors.border }]} onPress={async () => {
            const email = 'ecosrev.suporte@gmail.com';
            const subject = encodeURIComponent('Contato - Suporte EcosRev');
            let userInfo = { nome: '', email: '', id: '' };
            try {
              const storedUser = await AsyncStorage.getItem('user');
              if (storedUser) {
                const parsed = JSON.parse(storedUser);
                userInfo.nome = parsed.nome || parsed.name || '';
                userInfo.email = parsed.email || '';
                userInfo.id = parsed._id || parsed.id || '';
              }
            } catch (err) {
              console.warn('Não foi possível ler usuário do AsyncStorage:', err);
            }
            const bodyText = `Olá, preciso de suporte.\n\nNome: ${userInfo.nome}\nEmail: ${userInfo.email}\nID do usuário: ${userInfo.id}\nVersão do App: ${APP_VERSION}\n\nDescreva seu problema:`;
            const body = encodeURIComponent(bodyText);
            const url = `mailto:${email}?subject=${subject}&body=${body}`;
            try {
              const can = await Linking.canOpenURL(url);
              if (can) await Linking.openURL(url);
            } catch (err) {
              console.error('Erro ao abrir email:', err);
            }
          }}>
            <Text style={[styles.optionText, { color: colors.text.primary, fontSize: fontSize.sm }]}>Enviar email para suporte</Text>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botão de Voltar para Tela Inicial */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
        style={styles.backHomeButton}
      >
        <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        <Text style={[styles.backHomeText, { color: colors.text.primary, fontSize: fontSize.sm }]}>
          Voltar para tela inicial
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  optionText: {
    flex: 1,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  refreshButton: {
    padding: 5,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  upToDateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  upToDateText: {
    flex: 1,
    fontWeight: '600',
  },
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backHomeText: {
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
});

export default ConfigScreen;