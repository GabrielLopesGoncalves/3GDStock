import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import MaterialIcon from '../components/MaterialIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DetalheScreen({ route, navigation }) {
  // Recebe o item passado por parâmetro na navegação ou utiliza dados padrão caso acessado diretamente
  const { material } = route.params || {
    material: {
      id: '1',
      nome: 'Cimento CP 50kg',
      descricao: 'Saco de cimento Portland composto',
      codigo: 'CMN001',
      estoque: 120,
      unidade: 'un (sacos 50kg)',
      estoqueMinimo: 30,
      status: 'Em estoque',
      tipoStatus: 'success',
      categoria: 'Alvenaria / Cimento',
      localizacao: 'Galpão A - Palete 04',
      fornecedor: 'Votorantim Cimentos',
      precoUnitario: 'R$ 38,50',
      valorTotalEstoque: 'R$ 4.620,00',
      detalhes: 'Cimento Portland CP II-Z-32 de alta resistência inicial e excelente trabalhabilidade, indicado para fundações, estruturas de concreto armado, argamassas de assentamento e revestimentos em geral.',
      tipoIcone: 'cement',
    },
  };

  const [estoqueAtual, setEstoqueAtual] = useState(material.estoque);

  const [statusAtual, setStatusAtual] = useState(material.status);

  const getStatusColor = (tipo) => {
    switch (tipo) {
      case 'success':
        return { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#f59e0b' };
      case 'danger':
        return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444' };
      default:
        return { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' };
    }
  };

  const statusColor = getStatusColor(material.tipoStatus);

  const handleEntradaEstoque = () => {
    Alert.alert(
      'Registrar Entrada de Material',
      `Deseja adicionar +10 unidades ao estoque de "${material.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar (+10)',
          onPress: () => {
            setEstoqueAtual((prev) => prev + 10);
            Alert.alert('Sucesso!', 'Entrada registrada com sucesso no 3GDStock!');
          },
        },
      ]
    );
  };

  const handleSaidaEstoque = () => {
    if (estoqueAtual <= 0) {
      Alert.alert('Atenção', 'Material sem saldo disponível para saída!');
      return;
    }

    Alert.alert(
      'Registrar Saída de Material',
      `Deseja registrar a retirada de 5 unidades de "${material.nome}" para a obra?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar (-5)',
          onPress: () => {
            setEstoqueAtual((prev) => Math.max(0, prev - 5));
            Alert.alert('Sucesso!', 'Saída registrada com sucesso no 3GDStock!');
          },
        },
      ]
    );
  };

  const alterarStatus = async (novoStatus) => {
  try {
    const dadosSalvos = await AsyncStorage.getItem('@materiais');

    if (!dadosSalvos) {
      return;
    }

    const materiais = JSON.parse(dadosSalvos);

    const novaLista = materiais.map((item) => {
      if (item.id === material.id) {
        return {
          ...item,
          status: novoStatus
        };
      }

      return item;
    });

    await AsyncStorage.setItem(
      '@materiais',
      JSON.stringify(novaLista)
    );

    setStatusAtual(novoStatus);

    Alert.alert(
      'Status atualizado',
      `O status foi alterado para "${novoStatus}".`
    );

  } catch (error) {
    console.log(
      'Erro ao alterar status:',
      error
    );

    Alert.alert(
      'Erro',
      'Não foi possível alterar o status.'
    );
  }
};

  return (

    
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1d3557" />

      {/* Barra Superior / Header de Detalhes com botão Voltar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.btnVoltarTop}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Voltar para a lista"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
          <Text style={styles.btnVoltarTopText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.headerBarTitle}>Detalhes do Material</Text>

        <TouchableOpacity
          style={styles.headerBarAction}
          onPress={() =>
            Alert.alert(
              'Compartilhar',
              `Ficha técnica do material ${material.nome} (Código: ${material.codigo}) gerada.`
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Card Principal: Ícone, Título e Indicador de Estoque */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <MaterialIcon type={material.tipoIcone} size={36} />
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>{material.nome}</Text>
              <Text style={styles.heroSubtitle}>{material.descricao}</Text>
            </View>
          </View>

          {/* Tag de Status */}
          <View style={styles.badgeWrapper}>
            <View
              style={[
                styles.badge,
                { backgroundColor: statusColor.bg, borderColor: statusColor.border },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
              <Text style={[styles.badgeText, { color: statusColor.text }]}>
                {material.status}
              </Text>
            </View>
            <Text style={styles.codeText}>Ref: {material.codigo}</Text>
          </View>

          {/* Destaque da Quantidade Atual em Estoque */}
          <View style={styles.stockHighlightBox}>
            <View>
              <Text style={styles.stockHighlightLabel}>Quantidade em Estoque</Text>
              <Text style={styles.stockHighlightValue}>
                {estoqueAtual}{' '}
                <Text style={styles.stockHighlightUnit}>{material.unidade}</Text>
              </Text>
            </View>
            <View style={styles.stockMinBox}>
              <Text style={styles.stockMinLabel}>Mínimo Segurança</Text>
              <Text style={styles.stockMinValue}>{material.estoqueMinimo} un</Text>
            </View>
          </View>
        </View>

        {/* Card de Ações Rápidas de Movimentação */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Movimentações de Estoque</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.btnEntrada}
              onPress={handleEntradaEstoque}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down-circle" size={20} color="#15803d" />
              <Text style={styles.btnEntradaText}>Registrar Entrada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSaida}
              onPress={handleSaidaEstoque}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#b91c1c" />
              <Text style={styles.btnSaidaText}>Registrar Saída</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card de Informações Técnicas e Localização */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Especificações & Localização</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Código / SKU</Text>
              <Text style={styles.infoItemValue}>{material.codigo}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Categoria</Text>
              <Text style={styles.infoItemValue}>{material.categoria}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Localização no Almoxarifado</Text>
              <Text style={styles.infoItemValue}>{material.localizacao}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Fornecedor Principal</Text>
              <Text style={styles.infoItemValue}>{material.fornecedor}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Preço Unitário Estimado</Text>
              <Text style={styles.infoItemValue}>{material.precoUnitario}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Valor Total em Estoque</Text>
              <Text style={[styles.infoItemValue, { color: '#1d3557', fontWeight: '800' }]}>
                {material.valorTotalEstoque}
              </Text>
            </View>
          </View>
        </View>

        {/* Card de Descrição Detalhada */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Descrição Técnica</Text>
          <Text style={styles.detalhesText}>{material.detalhes}</Text>
        </View>

        {/* Alteração de Status - Fase 2 */}
<View style={styles.statusContainer}>

  <Text style={styles.sectionTitle}>
    Alterar Status
  </Text>

  <Text style={styles.currentStatus}>
    Status atual: {statusAtual}
  </Text>

  <TouchableOpacity
    style={styles.statusButton}
    onPress={() => alterarStatus('Em estoque')}
  >
    <Text style={styles.statusButtonText}>
      Em estoque
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.statusButton}
    onPress={() => alterarStatus('Estoque baixo')}
  >
    <Text style={styles.statusButtonText}>
      Estoque baixo
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.statusButton}
    onPress={() => alterarStatus('Em falta')}
  >
    <Text style={styles.statusButtonText}>
      Em falta
    </Text>
  </TouchableOpacity>

</View>

        {/* Botão Principal Voltar para a Lista */}
        <TouchableOpacity
          style={styles.btnVoltarPrincipal}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityLabel="Voltar para lista de materiais"
        >
          <Ionicons name="arrow-back-circle-outline" size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.btnVoltarPrincipalText}>Voltar para a Lista</Text>
        </TouchableOpacity>


        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
  marginTop: 20,
  padding: 15,
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
},

currentStatus: {
  fontSize: 16,
  marginBottom: 15,
},

statusButton: {
  backgroundColor: '#1976D2',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 8,
},

statusButtonText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},
  safeArea: {
    flex: 1,
    backgroundColor: '#1d3557',
  },
  headerBar: {
    backgroundColor: '#1d3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
  },
  btnVoltarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  btnVoltarTopText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerBarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerBarAction: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: '#eaf0f6',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  badgeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stockHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stockHighlightLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  stockHighlightValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d3557',
    marginTop: 2,
  },
  stockHighlightUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stockMinBox: {
    alignItems: 'flex-end',
  },
  stockMinLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  stockMinValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e05d06',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnEntrada: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  btnEntradaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803d',
  },
  btnSaida: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  btnSaidaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b91c1c',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoItemLabel: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
  },
  infoItemValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  detalhesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  btnVoltarPrincipal: {
    backgroundColor: '#1d3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    marginTop: 4,
  },
  btnVoltarPrincipalText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
