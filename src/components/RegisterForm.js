// src/components/RegisterForm.js
import React, { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSettings } from '../contexts/FontContext';
import CustomAlert from './CustomAlert';
import api from '../services/api';

// Funções de máscara
const maskCPF = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

const maskCEP = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
};

export default function RegisterForm({ onClose }) {
  const navigation = useNavigation();
  const theme = useTheme();
  const { fontSize } = useFontSettings();

  const [showPassword, setShowPassword] = useState(false);
  const [useExampleData, setUseExampleData] = useState(false);
  const [errors, setErrors] = useState({});

  // Estados dos campos
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    showCancelButton: false,
    onConfirm: () => {},
  });

  const showAlert = (title, message, onConfirm = null, showCancelButton = false) => {
    setAlertConfig({
      title,
      message,
      showCancelButton,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
    });
    setAlertVisible(true);
  };

  const exampleValues = {
    name: 'Maria Exemplo',
    cpf: '123.456.789-01',
    celular: '(11) 99999-8888',
    email: 'maria.exemplo@example.com',
    password: 'Exemplo@123',
    logradouro: 'Rua das Flores',
    numero: '100',
    complemento: '',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001-000'
  };

  const applyExampleData = () => {
    if (useExampleData) {
      setName(exampleValues.name);
      setCpf(exampleValues.cpf);
      setCelular(exampleValues.celular);
      setEmail(exampleValues.email);
      setPassword(exampleValues.password);
      setLogradouro(exampleValues.logradouro);
      setNumero(exampleValues.numero);
      setComplemento(exampleValues.complemento);
      setBairro(exampleValues.bairro);
      setCidade(exampleValues.cidade);
      setEstado(exampleValues.estado);
      setCep(exampleValues.cep);
    } else {
      setName('');
      setCpf('');
      setCelular('');
      setEmail('');
      setPassword('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setEstado('');
      setCep('');
    }
  };

  React.useEffect(() => {
    applyExampleData();
  }, [useExampleData]);

  const validateFields = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!password.trim()) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateFields()) {
      showAlert(
        'Erro de validação',
        'Preencha os campos obrigatórios corretamente'
      );
      return;
    }

    try {
      const response = await api.post('/usuario', {
        nome: name,
        email: email,
        senha: password,
        tipo: "Cliente",
        cpf: cpf.replace(/\D/g, ''),
        celular: celular.replace(/\D/g, ''),
        // Campos de endereço separados
        logradouro: logradouro.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim().toUpperCase() || null,
        cep: cep.replace(/\D/g, '') || null,
      });

      showAlert(
        'Sucesso!',
        'Cadastro realizado com sucesso!',
        () => {
          setAlertVisible(false);
          onClose();
        }
      );
    } catch (error) {
      let msg = '';
      if (error.response) {
        msg += `Status: ${error.response.status}\n`;
        if (error.response.data && error.response.data.errors) {
          msg += error.response.data.errors.map(e => e.msg).join("\n");
        } else if (error.response.data && error.response.data.message) {
          msg += error.response.data.message;
        } else {
          msg += JSON.stringify(error.response.data);
        }
      } else if (error.request) {
        msg = 'Sem resposta do servidor. Verifique sua conexão ou se o backend está online.';
      } else if (error.message) {
        msg = `Erro: ${error.message}`;
      } else {
        msg = `Erro desconhecido: ${JSON.stringify(error)}`;
      }
      showAlert('Erro no cadastro', msg);
      console.error("Erro no cadastro:", error);
    }
  };

  const fetchAddressByCEP = async () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) {
      showAlert(
        'CEP inválido',
        'Informe um CEP com 8 dígitos para buscar.'
      );
      return;
    }
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await resp.json();
      if (j.erro) throw new Error('CEP não encontrado');
      
      setLogradouro(j.logradouro || '');
      setBairro(j.bairro || '');
      setCidade(j.localidade || '');
      setEstado(j.uf || '');
      showAlert(
        'Endereço preenchido',
        'Logradouro, bairro, cidade e estado preenchidos a partir do CEP.'
      );
    } catch (error) {
      console.error('ViaCEP erro', error);
      showAlert('Erro', 'Não foi possível buscar o CEP.');
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    fontSize: fontSize.md,
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: fontSize.sm,
    marginBottom: 8,
    marginTop: -2,
  };

  const labelStyle = {
    color: theme.colors.text.primary,
    fontSize: fontSize.md,
    marginBottom: 6,
    fontWeight: '500',
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
        <Text style={[styles.title, { color: theme.colors.primary, fontSize: fontSize.xl }]}>Cadastro</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            status={useExampleData ? 'checked' : 'unchecked'}
            onPress={() => setUseExampleData(!useExampleData)}
            color={theme.colors.primary}
          />
          <TouchableOpacity onPress={() => setUseExampleData(!useExampleData)}>
            <Text style={{ color: theme.colors.text.primary }}>
              {useExampleData ? 'Usando dados de exemplo' : 'Mostrar dados de exemplo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nome Completo */}
        <Text style={labelStyle}>Nome Completo *</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Digite seu nome completo"
          placeholderTextColor={theme.colors.text.secondary}
        />
        {errors.name && <Text style={errorStyle}>{errors.name}</Text>}

        {/* CPF */}
        <Text style={labelStyle}>CPF</Text>
        <TextInput
          style={inputStyle}
          value={cpf}
          onChangeText={(text) => setCpf(maskCPF(text))}
          placeholder="000.000.000-00"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
          maxLength={14}
        />
        {errors.cpf && <Text style={errorStyle}>{errors.cpf}</Text>}

        {/* Celular */}
        <Text style={labelStyle}>Celular</Text>
        <TextInput
          style={inputStyle}
          value={celular}
          onChangeText={(text) => setCelular(maskPhone(text))}
          placeholder="(00) 00000-0000"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="phone-pad"
          maxLength={15}
        />
        {errors.celular && <Text style={errorStyle}>{errors.celular}</Text>}

        {/* Email */}
        <Text style={labelStyle}>Email *</Text>
        <TextInput
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={errorStyle}>{errors.email}</Text>}

        {/* Senha */}
        <Text style={labelStyle}>Senha *</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={theme.colors.text.secondary}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={{ position: 'absolute', right: 12, top: 12 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ color: theme.colors.primary }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={errorStyle}>{errors.password}</Text>}

        {/* CEP */}
        <Text style={labelStyle}>CEP</Text>
        <TextInput
          style={inputStyle}
          value={cep}
          onChangeText={(text) => setCep(maskCEP(text))}
          placeholder="00000-000"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
          maxLength={9}
        />
        {errors.cep && <Text style={errorStyle}>{errors.cep}</Text>}

        {/* Botão Buscar CEP */}
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={fetchAddressByCEP}
            style={[styles.cepButton, { borderColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.primary }}>Buscar por CEP</Text>
          </TouchableOpacity>
        </View>

        {/* Logradouro */}
        <Text style={labelStyle}>Logradouro</Text>
        <TextInput
          style={inputStyle}
          value={logradouro}
          onChangeText={setLogradouro}
          placeholder="Rua, Avenida, etc."
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Número */}
        <Text style={labelStyle}>Número</Text>
        <TextInput
          style={inputStyle}
          value={numero}
          onChangeText={setNumero}
          placeholder="Número"
          placeholderTextColor={theme.colors.text.secondary}
          keyboardType="numeric"
        />

        {/* Complemento */}
        <Text style={labelStyle}>Complemento</Text>
        <TextInput
          style={inputStyle}
          value={complemento}
          onChangeText={setComplemento}
          placeholder="Apto, Bloco, etc."
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Bairro */}
        <Text style={labelStyle}>Bairro</Text>
        <TextInput
          style={inputStyle}
          value={bairro}
          onChangeText={setBairro}
          placeholder="Bairro"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Cidade */}
        <Text style={labelStyle}>Cidade</Text>
        <TextInput
          style={inputStyle}
          value={cidade}
          onChangeText={setCidade}
          placeholder="Cidade"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Estado */}
        <Text style={labelStyle}>Estado</Text>
        <TextInput
          style={inputStyle}
          value={estado}
          onChangeText={(text) => setEstado(text.toUpperCase())}
          placeholder="UF"
          placeholderTextColor={theme.colors.text.secondary}
          maxLength={2}
          autoCapitalize="characters"
        />

        {/* Botão Cadastrar */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleRegister}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text.inverse, fontSize: fontSize.md }]}>
            Cadastrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.link}>
          <Text style={[styles.linkText, { color: theme.colors.primary, fontSize: fontSize.sm }]}>
            Já tem uma conta? Faça login
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* CustomAlert */}
      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancelButton={alertConfig.showCancelButton}
        singleButtonText="OK"
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {},
  cepButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  }
});