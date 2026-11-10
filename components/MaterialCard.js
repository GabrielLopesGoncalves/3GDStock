import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcon from './MaterialIcon';

export default function MaterialCard({ item, onPress }) {
  const getStatusStyles = (status, tipo) => {
    switch (tipo) {
      case 'success':
        return {
          container: styles.badgeSuccess,
          text: styles.badgeTextSuccess,
          dot: styles.dotSuccess,
        };
      case 'warning':
        return {
          container: styles.badgeWarning,
          text: styles.badgeTextWarning,
          dot: styles.dotWarning,
        };
      case 'danger':
        return {
          container: styles.badgeDanger,
          text: styles.badgeTextDanger,
          dot: styles.dotDanger,
        };
      default:
        return {
          container: styles.badgeSuccess,
          text: styles.badgeTextSuccess,
          dot: styles.dotSuccess,
        };
    }
  };

  const statusStyle = getStatusStyles(item.status, item.tipoStatus);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      accessibilityLabel={`Material ${item.nome}, status ${item.status}`}
    >
      {/* Ícone do Material */}
      <MaterialIcon type={item.tipoIcone} />

      {/* Conteúdo Central */}
      <View style={styles.contentContainer}>
        {/* Linha de Título e Status */}
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.nome}
          </Text>
        </View>

        {/* Descrição Curta */}
        <Text style={styles.description} numberOfLines={1}>
          {item.descricao}
        </Text>

        {/* Código e Quantidade em Estoque */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Código: </Text>
          <Text style={styles.infoValue}>{item.codigo}</Text>
          <Text style={styles.infoDivider}> | </Text>
          <Text style={styles.infoLabel}>Estoque: </Text>
          <Text style={styles.infoValue}>{item.estoque} un</Text>
        </View>
      </View>

      {/* Lado Direito: Badge de Status e Chevron */}
      <View style={styles.rightContainer}>
        <View style={[styles.badge, statusStyle.container]}>
          <View style={[styles.statusDot, statusStyle.dot]} />
          <Text style={[styles.badgeText, statusStyle.text]}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#64748b" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d3557',
  },
  infoValue: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
  },
  infoDivider: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginHorizontal: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  // Status Verde
  badgeSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  badgeTextSuccess: {
    color: '#15803d',
  },
  dotSuccess: {
    backgroundColor: '#22c55e',
  },
  // Status Amarelo / Laranja
  badgeWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeTextWarning: {
    color: '#b45309',
  },
  dotWarning: {
    backgroundColor: '#f59e0b',
  },
  // Status Vermelho
  badgeDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  badgeTextDanger: {
    color: '#b91c1c',
  },
  dotDanger: {
    backgroundColor: '#ef4444',
  },
  chevron: {
    marginTop: 'auto',
  },
});
