import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../assets/logo.svg';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSettings } from '../contexts/FontContext';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema } from '../utils/validationSchemas';
import AuthForm from '../components/AuthForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import api from '../services/api';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const theme = useTheme();
    const { fontSize } = useFontSettings();
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);

    const handleLogin = async (values) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            // 1. Fazer login e obter token
            const response = await api.post('/usuario/login', {
                email: values.email,
                senha: values.password,
            });

            const { access_token, redirect_url } = response.data;

            if (!access_token) {
                setErrorMessage('Token de acesso não recebido.');
                alert('Erro: Token de acesso não recebido.');
                return;
            }

            // 2. Configurar o header manualmente ANTES de chamar o AuthContext
            api.defaults.headers.common['access-token'] = access_token;

            // 3. Salvar token usando o AuthContext
            const loginSuccess = await login(access_token);
            
            if (!loginSuccess) {
                setErrorMessage('Erro ao salvar dados de autenticação.');
                alert('Erro ao salvar dados de autenticação.');
                return;
            }

            // 4. Buscar informações do usuário (agora com o token já configurado)
            try {
                const userInfoResponse = await api.get('/usuario/me');

                // 5. Salvar ID do usuário (com validação e conversão para string)
                const userId = userInfoResponse.data._id || userInfoResponse.data.id || userInfoResponse.data.userId;
                
                if (userId) {
                    await AsyncStorage.setItem('user', String(userId));
                } else {
                    console.warn('ID do usuário não encontrado na resposta:', userInfoResponse.data);
                }

                // 6. Verificar se precisa resetar senha
                if (userInfoResponse.data.resetPasswordToken) {
                    alert('Login com senha temporária. Você precisa criar uma nova senha.');
                    await AsyncStorage.setItem('user_email', values.email);
                    navigation.navigate('ResetPassword');
                } else {
                    alert('Login realizado com sucesso!');
                    // A navegação será automática devido ao AuthContext
                }
            } catch (userInfoError) {
                console.error('Erro ao buscar informações do usuário:', userInfoError);
                
                // Mesmo com erro ao buscar dados do usuário, o login foi bem-sucedido
                // então vamos apenas avisar mas continuar
                console.warn('Não foi possível carregar informações do usuário, mas login foi realizado.');
                alert('Login realizado com sucesso!');
            }

        } catch (error) {
            console.error('Login error:', error);

            if (error.response?.data?.errors) {
                const mensagens = error.response.data.errors.map(err => err.msg).join('\n');
                setErrorMessage(mensagens);
                alert(`Erro no login:\n${mensagens}`);
            } else if (error.response?.status === 401) {
                setErrorMessage('Email ou senha incorretos.');
                alert('Email ou senha incorretos.');
            } else {
                setErrorMessage('Erro de conexão com o servidor.');
                alert('Erro de conexão com o servidor.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const loginFields = [
        {
            name: 'email',
            label: 'Email',
            placeholder: 'Insira seu email',
            autoCapitalize: 'none',
            keyboardType: 'email-address'
        },
        {
            name: 'password',
            label: 'Senha',
            placeholder: 'Insira sua senha',
            secureTextEntry: !showPassword
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                {errorMessage && (
                <Text style={[styles.errorMessage, { color: theme.colors.error, fontSize: fontSize.sm }]}>
                    {errorMessage}
                </Text>
                )}

                <AuthForm
                    initialValues={{ email: '', password: '' }}
                    validationSchema={loginSchema}
                    onSubmit={handleLogin}
                    fields={loginFields}
                    isPasswordVisible={showPassword}
                    togglePasswordVisibility={togglePasswordVisibility}
                >
                    {({ handleSubmit }) => (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.primary }]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.text.inverse} />
                            ) : (
                                <Text style={[styles.buttonText, { color: theme.colors.text.inverse, fontSize: fontSize.md }]}>
                                    Login
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </AuthForm>

                <TouchableOpacity
                    onPress={() => setIsForgotPasswordModalVisible(true)}
                    style={styles.forgotPasswordLink}
                >
                    <Text style={[styles.forgotPasswordText, { color: theme.colors.text.primary, fontSize: fontSize.sm }]}>
                        Esqueceu a senha?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setIsRegisterModalVisible(true)}
                    style={styles.link}
                >
                    <Text style={[styles.linkText, { color: theme.colors.text.primary, fontSize: fontSize.sm }]}>
                        Não possui uma conta?
                    </Text>
                </TouchableOpacity>

                <View style={styles.logoContainer}>
                    <Logo width={209} height={98} />
                </View>
                
                <TouchableOpacity
                    onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
                    style={styles.backHomeButton}
                >
                    <Ionicons name="arrow-back" size={18} color={theme.colors.text.primary} />
                    <Text style={[styles.backHomeText, { color: theme.colors.text.primary, fontSize: fontSize.sm }]}>
                        Voltar para tela inicial
                    </Text>
                </TouchableOpacity>

                <Modal
                    visible={isRegisterModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsRegisterModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.background, width: '90%', maxWidth: 480, padding: 12, elevation: 0, shadowOpacity: 0 }]}> 
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setIsRegisterModalVisible(false)}>
                                    <Text style={{ color: theme.colors.primary, fontSize: fontSize.md }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ maxHeight: '75%' }}>
                              <RegisterForm onClose={() => setIsRegisterModalVisible(false)} />
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isForgotPasswordModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsForgotPasswordModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.background, width: '90%', maxWidth: 480, padding: 18 }]}> 
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setIsForgotPasswordModalVisible(false)}>
                                    <Text style={{ color: theme.colors.primary, fontSize: fontSize.md }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ maxHeight: '80%' }}>
                              <ForgotPasswordForm onClose={() => setIsForgotPasswordModalVisible(false)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 350, 
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'red',
    fontSize: 14,
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
  button: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    height: 40,
  },
  link: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  forgotPasswordLink: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  forgotPasswordText: {
    textDecorationLine: 'underline'
  },
  logoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logo: {
    height: 98,
    width: 209,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#555',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
});