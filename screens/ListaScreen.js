import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import MaterialCard from '../components/MaterialCard';
import { MATERIAIS_INICIAIS } from '../data/mockData';

export default function ListaScreen({ navigation }) {
  const [materiais, setMateriais] = useState(MATERIAIS_INICIAIS);
  const [busca, setBusca] = useState('');

  // Carregar materiais salvos
  useEffect(() => {
  carregarMateriais();
}, []);

const carregarMateriais = async () => {
  try {
    const dadosSalvos = await AsyncStorage.getItem('@materiais');

    if (dadosSalvos) {
      setMateriais(JSON.parse(dadosSalvos));
    } else {
      await AsyncStorage.setItem(
        '@materiais',
        JSON.stringify(MATERIAIS_INICIAIS)
      );

      setMateriais(MATERIAIS_INICIAIS);
    }
  } catch (error) {
    console.log('Erro ao carregar materiais:', error);
  }
};

// funcao para salvar
const salvarMateriais = async (novosMateriais) => {
  try {
    await AsyncStorage.setItem(
      '@materiais',
      JSON.stringify(novosMateriais)
    );

    setMateriais(novosMateriais);
  } catch (error) {
    console.log('Erro ao salvar materiais:', error);
  }
};


  // Estados para o Modal de Novo Material
  const [modalVisible, setModalVisible] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [novoUnidade, setNovoUnidade] = useState('un');
  const [novoCategoria, setNovoCategoria] = useState('Alvenaria');
  const [novoStatus, setNovoStatus] = useState('Em estoque');
  const [novoLocalizacao, setNovoLocalizacao] = useState('');
  const [novoFornecedor, setNovoFornecedor] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoEstoqueMinimo, setNovoEstoqueMinimo] = useState('');

  // Filtragem dos materiais por texto de busca
  const materiaisFiltrados = materiais.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.codigo.toLowerCase().includes(termo) ||
      item.descricao.toLowerCase().includes(termo) ||
      item.categoria.toLowerCase().includes(termo)
    );
  });

  // Navegação para a Tela de Detalhes
  const handleItemPress = (material) => {
    navigation.navigate('Detalhe', { material });
  };

  // Ação do Botão Adicionar / Novo Material
const handleNovoMaterialPress = () => {
  setModalVisible(true);
};

// Cadastro de Novo Material - Fase 2
const handleCadastrarMaterial = async () => {
  if (!novoNome.trim()) {
    Alert.alert(
      'Campo obrigatório',
      'Informe o nome do material.'
    );
    return;
  }

  const novoMaterial = {
    id: Date.now().toString(),
    nome: novoNome.trim(),
    codigo: novoCodigo.trim().toUpperCase(),
    descricao: novoDescricao.trim() || 'Material de construção civil',
    categoria: novoCategoria,
    estoque: Number(novoEstoque) || 0,
    estoqueMinimo: Number(novoEstoqueMinimo) || 0,
    unidade: novoUnidade,
    localizacao: novoLocalizacao || 'Almoxarifado Principal',
    fornecedor: novoFornecedor || 'Fornecedor Padrão',
    precoUnitario: Number(novoPreco) || 0,
    status: novoStatus,
    tipoStatus:
      novoStatus === 'Em falta'
        ? 'danger'
        : novoStatus === 'Estoque baixo'
        ? 'warning'
        : 'success'
  };

  const novaLista = [
    novoMaterial,
    ...materiais
  ];

  await salvarMateriais(novaLista);

  setModalVisible(false);

  setNovoNome('');
  setNovoCodigo('');
  setNovoDescricao('');
  setNovoEstoque('');
  setNovoCategoria('Alvenaria');
  setNovoUnidade('un');
  setNovoStatus('Em estoque');
  setNovoLocalizacao('');
  setNovoFornecedor('');
  setNovoPreco('');
  setNovoEstoqueMinimo('');

  Alert.alert(
    'Sucesso! 🎉',
    'Material cadastrado e salvo com sucesso.'
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1d3557" />

      {/* Barra de Topo do Sistema */}
      <Header />

      {/* Conteúdo Principal */}
      <View style={styles.container}>
        {/* Cabeçalho da Seção com Título e Botão "+ NOVO MATERIAL" */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrapper}>
            <Text style={styles.pageTitle}>Materiais</Text>
            <Text style={styles.pageSubtitle}>Lista de materiais cadastrados</Text>
          </View>

          <TouchableOpacity
            style={styles.btnNovoMaterial}
            onPress={handleNovoMaterialPress}
            activeOpacity={0.8}
            accessibilityLabel="Adicionar novo material"
          >
            <Feather name="plus" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.btnNovoMaterialText}>NOVO MATERIAL</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar materiais..."
            placeholderTextColor="#94a3b8"
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Registros */}
        <FlatList
          data={materiaisFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MaterialCard item={item} onPress={handleItemPress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory-2" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                {busca ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {busca
                  ? 'Verifique os termos digitados na busca.'
                  : 'Toque no botão "+ NOVO MATERIAL" acima para adicionar novos itens ao estoque.'}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Barra Inferior (Footer escuro com design do mockup) */}
      <View style={styles.bottomBar} />

      {/* Modal de Cadastro de Material (Fase 1 / Em Breve SQLite) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Novo Material</Text>
                <Text style={styles.modalSubtitle}>Cadastrar item no estoque (3GDStock)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <Text style={styles.inputLabel}>Nome do Material *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex.: Argamassa AC-III 20kg"
                placeholderTextColor="#94a3b8"
                value={novoNome}
                onChangeText={setNovoNome}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Código *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex.: ARG003"
                    placeholderTextColor="#94a3b8"
                    value={novoCodigo}
                    onChangeText={setNovoCodigo}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Estoque Inicial *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex.: 45"
                    placeholderTextColor="#94a3b8"
                    value={novoEstoque}
                    onChangeText={setNovoEstoque}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Categoria</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex.: Alvenaria"
                    placeholderTextColor="#94a3b8"
                    value={novoCategoria}
                    onChangeText={setNovoCategoria}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Unidade</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ex.: sacos, un, kg"
                    placeholderTextColor="#94a3b8"
                    value={novoUnidade}
                    onChangeText={setNovoUnidade}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Status de Estoque</Text>
              <View style={styles.statusSelectRow}>
                {['Em estoque', 'Estoque baixo', 'Em falta'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusOption,
                      novoStatus === st && styles.statusOptionSelected,
                    ]}
                    onPress={() => setNovoStatus(st)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        novoStatus === st && styles.statusOptionTextSelected,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Descrição / Especificação</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Breve descrição sobre o material..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={3}
                value={novoDescricao}
                onChangeText={setNovoDescricao}
              />

              <View style={styles.faseInfoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#1d3557" />
                <Text style={styles.faseInfoText}>
                  <Text style={{ fontWeight: '700' }}>Fase 2:</Text> Os materiais cadastrados são salvos localmente usando AsyncStorage.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSalvar}
                onPress={handleCadastrarMaterial}
              >
                <Text style={styles.btnSalvarText}>Salvar Material</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  padding: 20,
},

modalContent: {
  backgroundColor: '#FFFFFF',
  borderRadius: 15,
  padding: 20,
  maxHeight: '90%',
},

modalTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginBottom: 20,
},

input: {
  borderWidth: 1,
  borderColor: '#CCCCCC',
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
  backgroundColor: '#FFFFFF',
},

saveButton: {
  backgroundColor: '#F57C00',
  padding: 14,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 10,
},

saveButtonText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},

cancelButton: {
  padding: 14,
  alignItems: 'center',
  marginTop: 5,
},

cancelButtonText: {
  color: '#666666',
  fontWeight: 'bold',
},
  safeArea: {
    flex: 1,
    backgroundColor: '#1d3557',
  },
  container: {
    flex: 1,
    backgroundColor: '#eaf0f6',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrapper: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  btnNovoMaterial: {
    backgroundColor: '#f37207',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#f37207',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  btnNovoMaterialText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1e293b',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  btnFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnFiltrosAtivo: {
    backgroundColor: '#e2e8f0',
    borderColor: '#94a3b8',
  },
  btnFiltrosText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
  btnFiltrosTextAtivo: {
    color: '#1d3557',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipAtivo: {
    backgroundColor: '#1d3557',
    borderColor: '#1d3557',
  },
  chipAtivoVerde: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  chipAtivoAmarelo: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  chipAtivoVermelho: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextAtivo: {
    color: '#ffffff',
  },
  chipTextAtivoVerde: {
    color: '#15803d',
  },
  chipTextAtivoAmarelo: {
    color: '#b45309',
  },
  chipTextAtivoVermelho: {
    color: '#b91c1c',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomBar: {
    height: 48,
    backgroundColor: '#1d3557',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
  },
  formTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  statusOptionSelected: {
    backgroundColor: '#1d3557',
    borderColor: '#1d3557',
  },
  statusOptionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  statusOptionTextSelected: {
    color: '#ffffff',
  },
  faseInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  faseInfoText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1e40af',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnCancelarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  btnSalvar: {
    backgroundColor: '#f37207',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnSalvarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
