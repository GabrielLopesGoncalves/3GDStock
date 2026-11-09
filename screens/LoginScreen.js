import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { emailValido, senhaValida } from '../utils/validacaoCredenciais';

const USERS_KEY = '@usuarios';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (route.params?.email) setEmail(route.params.email);
    if (route.params?.registered) {
      Alert.alert('Conta criada', 'Agora entre com seu e-mail e senha.');
      navigation.setParams({ registered: false });
    }
  }, [navigation, route.params?.email, route.params?.registered]);

  const entrar = async () => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !senha) {
      Alert.alert('Dados obrigatórios', 'Informe seu e-mail e sua senha.');
      return;
    }
    if (!emailValido(emailNormalizado)) {
      Alert.alert('E-mail inválido', 'Use um e-mail no formato nome@dominio.com.');
      return;
    }
    if (!senhaValida(senha)) {
      Alert.alert(
        'Senha fora do padrão',
        'Use mais de 6 caracteres, incluindo uma letra maiúscula, um número e um símbolo.'
      );
      return;
    }

    setCarregando(true);
    try {
      const dados = await AsyncStorage.getItem(USERS_KEY);
      const usuarios = dados ? JSON.parse(dados) : [];
      const usuario = usuarios.find((item) => item.email === emailNormalizado);
      const senhaHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        senha
      );

      if (!usuario || usuario.senhaHash !== senhaHash) {
        Alert.alert('Não foi possível entrar', 'Confira seu e-mail e sua senha.');
        return;
      }

      navigation.replace('Lista', { usuarioId: usuario.id });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar as contas salvas neste aparelho.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="home-roof" size={27} color="#f97316" />
              <MaterialCommunityIcons name="cube-outline" size={17} color="#ffffff" style={styles.cubeIcon} />
            </View>
            <Text style={styles.brandName}>3GD<Text style={styles.brandAccent}>Stock</Text></Text>
            <Text style={styles.brandCaption}>GESTÃO DE MATERIAIS</Text>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.eyebrow}>ACESSO AO SISTEMA</Text>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre para consultar e acompanhar seu estoque.</Text>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="voce@empresa.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#94a3b8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoComplete="password"
                onSubmitEditing={entrar}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenha((visivel) => !visivel)}
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={styles.passwordToggle}
              >
                <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, carregando && styles.buttonDisabled]}
              onPress={entrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{carregando ? 'Aguarde...' : 'Entrar'}</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.registerPrompt}>
              <Text style={styles.promptText}>Ainda não tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
                <Text style={styles.registerLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRule} />
            <Text style={styles.footerText}>CONTROLE LOCAL • ACESSO PARA CLIENTES E EQUIPE</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#1d3557' },
  scrollContent: { flexGrow: 1, backgroundColor: '#eaf0f6', paddingBottom: 24 },
  brandHeader: {
    minHeight: 224,
    backgroundColor: '#1d3557',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 35,
  },
  brandMark: {
    width: 58,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cubeIcon: { position: 'absolute', top: 24 },
  brandName: { color: '#ffffff', fontSize: 27, fontWeight: '800' },
  brandAccent: { color: '#f97316' },
  brandCaption: { color: '#cbd5e1', fontSize: 10, fontWeight: '700', marginTop: 6 },
  formArea: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    marginTop: -24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  eyebrow: { color: '#f37207', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  title: { color: '#0f172a', fontSize: 25, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 21 },
  label: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  inputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  input: { flex: 1, height: '100%', color: '#0f172a', fontSize: 14, marginLeft: 10 },
  passwordToggle: { padding: 5 },
  primaryButton: {
    height: 48,
    backgroundColor: '#f37207',
    borderRadius: 8,
    marginTop: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  registerPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 5 },
  promptText: { color: '#64748b', fontSize: 12 },
  registerLink: { color: '#1d3557', fontSize: 12, fontWeight: '800' },
  footer: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24, marginTop: 24 },
  footerRule: { height: 1, backgroundColor: '#cbd5e1', marginBottom: 12 },
  footerText: { color: '#64748b', fontSize: 9, fontWeight: '700', textAlign: 'center' },
});