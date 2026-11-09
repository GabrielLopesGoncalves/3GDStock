import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { emailValido, senhaValida } from '../utils/validacaoCredenciais';

const USERS_KEY = '@usuarios';
const PERFIS = ['Cliente', 'Funcionário'];

const dataNascimentoValida = (valor) => {
  const partes = valor.split('/');
  if (partes.length !== 3 || partes.some((parte) => !/^\d+$/.test(parte))) return false;
  const [dia, mes, ano] = partes.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    valor.length === 10 &&
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia &&
    data <= new Date()
  );
};

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState('Cliente');
  const [carregando, setCarregando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const mostrarAlerta = (titulo, mensagem) => setAlerta({ titulo, mensagem });

  const cadastrar = async () => {
    const nomeLimpo = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();
    const erros = [];

    if (!nomeLimpo) {
      erros.push('Informe seu nome completo.');
    }
    if (!emailNormalizado) {
      erros.push('Informe seu e-mail, por exemplo nome@gmail.com.');
    } else if (!emailValido(emailNormalizado)) {
      erros.push('O e-mail precisa conter @ e terminar em .com. Exemplo: nome@gmail.com.');
    }
    if (!senha) {
      erros.push('Crie uma senha com mais de 6 caracteres, uma letra maiúscula, um número e um símbolo.');
    } else if (!senhaValida(senha)) {
      erros.push('A senha precisa ter mais de 6 caracteres, incluindo uma letra maiúscula, um número e um símbolo. Exemplo: Obra#2026.');
    }
    if (!confirmacao) {
      erros.push('Digite novamente a senha no campo de confirmação.');
    } else if (senha !== confirmacao) {
      erros.push('A confirmação precisa ser igual à senha.');
    }
    if (perfil === 'Funcionário') {
      const cpfNumeros = cpf.replace(/\D/g, '');
      const telefoneNumeros = telefone.replace(/\D/g, '');
      if (cpfNumeros.length !== 11) erros.push('Informe um CPF com 11 números.');
      if (!dataNascimentoValida(dataNascimento)) {
        erros.push('Informe uma data de nascimento válida no formato DD/MM/AAAA.');
      }
      if (telefoneNumeros.length < 10 || telefoneNumeros.length > 13) {
        erros.push('Informe um telefone com DDD e número (10 ou 11 dígitos).');
      }
    }
    if (erros.length > 0) {
      mostrarAlerta('Revise os dados', erros.join('\n'));
      return;
    }

    setCarregando(true);
    try {
      const dados = await AsyncStorage.getItem(USERS_KEY);
      const usuarios = dados ? JSON.parse(dados) : [];
      if (usuarios.some((item) => item.email === emailNormalizado)) {
        mostrarAlerta('E-mail já cadastrado', 'Use outro e-mail ou faça login.');
        return;
      }

      const senhaHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        senha
      );
      usuarios.push({
        id: Date.now().toString(),
        nome: nomeLimpo,
        email: emailNormalizado,
        senhaHash,
        perfil,
        ...(perfil === 'Funcionário' && {
          cpf: cpf.replace(/\D/g, ''),
          dataNascimento,
          telefone: telefone.replace(/\D/g, ''),
        }),
        criadoEm: new Date().toISOString(),
      });
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
      navigation.navigate('Login', { email: emailNormalizado, registered: true });
    } catch (error) {
      mostrarAlerta('Erro ao cadastrar', 'Não foi possível salvar a conta neste aparelho.');
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar para o login"
          >
            <Ionicons name="arrow-back" size={21} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar conta</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formArea}>
            <View style={styles.headingRow}>
              <View style={styles.headingIcon}>
                <Feather name="user-plus" size={20} color="#f37207" />
              </View>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>NOVO ACESSO</Text>
                <Text style={styles.title}>Seus dados</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Escolha como você usa o 3GDStock e informe seus dados.</Text>

            <Text style={styles.label}>Tipo de conta</Text>
            <View style={styles.profileControl}>
              {PERFIS.map((opcao) => {
                const selecionado = perfil === opcao;
                return (
                  <TouchableOpacity
                    key={opcao}
                    style={[styles.profileOption, selecionado && styles.profileOptionSelected]}
                    onPress={() => setPerfil(opcao)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selecionado }}
                  >
                    <Feather
                      name={opcao === 'Cliente' ? 'briefcase' : 'users'}
                      size={16}
                      color={selecionado ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.profileText, selecionado && styles.profileTextSelected]}>
                      {opcao}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {perfil === 'Funcionário' && (
              <View style={styles.employeeFields}>
                <Text style={styles.label}>CPF</Text>
                <View style={styles.inputWrap}>
                  <Feather name="credit-card" size={17} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#94a3b8"
                    value={cpf}
                    onChangeText={setCpf}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>

                <Text style={styles.label}>Data de nascimento</Text>
                <View style={styles.inputWrap}>
                  <Feather name="calendar" size={17} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#94a3b8"
                    value={dataNascimento}
                    onChangeText={setDataNascimento}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                <Text style={styles.label}>Número de telefone</Text>
                <View style={styles.inputWrap}>
                  <Feather name="phone" size={17} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor="#94a3b8"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
            )}

            <Text style={styles.label}>Nome completo</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={17} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Como podemos chamar você?"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={17} color="#64748b" />
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
            <Text style={styles.passwordHint}>Mais de 6 caracteres, 1 maiúscula, 1 número e 1 símbolo</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={17} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor="#94a3b8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <Text style={styles.label}>Confirmar senha</Text>
            <View style={styles.inputWrap}>
              <Feather name="shield" size={17} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#94a3b8"
                value={confirmacao}
                onChangeText={setConfirmacao}
                secureTextEntry
                autoComplete="new-password"
                onSubmitEditing={cadastrar}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, carregando && styles.buttonDisabled]}
              onPress={cadastrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{carregando ? 'Salvando...' : 'Criar minha conta'}</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.localNote}>Conta salva localmente neste aparelho.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={Boolean(alerta)}
        transparent
        animationType="fade"
        onRequestClose={() => setAlerta(null)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertIcon}>
              <Feather name="alert-circle" size={22} color="#f37207" />
            </View>
            <Text style={styles.alertTitle}>{alerta?.titulo}</Text>
            <Text style={styles.alertMessage}>{alerta?.mensagem}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setAlerta(null)}>
              <Text style={styles.alertButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  alertMessage: { color: '#475569', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  alertButton: {
    minHeight: 42,
    minWidth: 110,
    paddingHorizontal: 20,
    backgroundColor: '#f37207',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  alertButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#1d3557' },
  header: {
    minHeight: 56,
    backgroundColor: '#1d3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  headerSpacer: { width: 36 },
  scrollContent: { flexGrow: 1, backgroundColor: '#eaf0f6', padding: 16, paddingBottom: 30 },
  formArea: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 22,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headingRow: { flexDirection: 'row', alignItems: 'center' },
  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#f37207', fontSize: 10, fontWeight: '800', marginBottom: 3 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 12 },
  label: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  passwordHint: { color: '#64748b', fontSize: 10.5, marginTop: -3, marginBottom: 7 },
  profileControl: { flexDirection: 'row', gap: 8 },
  profileOption: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  profileOptionSelected: { backgroundColor: '#1d3557', borderColor: '#1d3557' },
  profileText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  profileTextSelected: { color: '#ffffff' },
  employeeFields: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  inputWrap: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  input: { flex: 1, height: '100%', color: '#0f172a', fontSize: 13, marginLeft: 10 },
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
  primaryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  localNote: { color: '#64748b', textAlign: 'center', fontSize: 11, marginTop: 12 },
});