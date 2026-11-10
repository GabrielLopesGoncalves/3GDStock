import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ onMenuPress, onNotificationPress, onProfilePress }) {
  const handleMenu = () => {
    if (onMenuPress) onMenuPress();
    else Alert.alert('Menu', 'Navegação lateral do 3GDStock');
  };

  const handleNotification = () => {
    if (onNotificationPress) onNotificationPress();
    else Alert.alert('Notificações', 'Você tem 2 alertas de estoque baixo para reposição.');
  };

  const handleProfile = () => {
    if (onProfilePress) onProfilePress();
    else Alert.alert('Perfil', 'Almoxarife / Gestor de Obras - 3GDStock');
  };

  return (
    <View style={styles.header}>
      {/* Menu Hambúrguer */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={handleMenu}
        activeOpacity={0.7}
        accessibilityLabel="Menu principal"
      >
        <Feather name="menu" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Logotipo Central: Casinha + Caixa com gráfico */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="home-roof" size={26} color="#f97316" style={styles.roofIcon} />
          <MaterialCommunityIcons name="cube-outline" size={16} color="#ffffff" style={styles.boxIcon} />
          <View style={styles.chartBars}>
            <View style={[styles.bar, { height: 4, backgroundColor: '#f97316' }]} />
            <View style={[styles.bar, { height: 7, backgroundColor: '#f97316' }]} />
            <View style={[styles.bar, { height: 10, backgroundColor: '#f97316' }]} />
          </View>
        </View>
        <Text style={styles.logoText}>3GD<Text style={styles.logoTextHighlight}>Stock</Text></Text>
      </View>

      {/* Ações da Direita: Notificações + Usuário */}
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={handleNotification}
          activeOpacity={0.7}
          accessibilityLabel="Notificações"
        >
          <Ionicons name="notifications-outline" size={22} color="#ffffff" />
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconButton, { marginLeft: 10 }]} 
          onPress={handleProfile}
          activeOpacity={0.7}
          accessibilityLabel="Perfil do Usuário"
        >
          <Ionicons name="person-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1d3557',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    borderWidth: 1.5,
    borderColor: '#1d3557',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    position: 'relative',
  },
  roofIcon: {
    position: 'absolute',
    top: -2,
  },
  boxIcon: {
    position: 'absolute',
    bottom: 2,
    left: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 4,
    right: 7,
    gap: 1.5,
  },
  bar: {
    width: 2,
    borderRadius: 1,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoTextHighlight: {
    color: '#f97316',
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
