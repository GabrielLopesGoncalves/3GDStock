import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function MaterialIcon({ type, size = 28, color = '#1e3557' }) {
  const renderIcon = () => {
    switch (type) {
      case 'cement':
        return <MaterialCommunityIcons name="bag-personal-outline" size={size} color={color} />;
      case 'steel':
        return <MaterialCommunityIcons name="layers-triple-outline" size={size} color={color} />;
      case 'paint':
        return <MaterialCommunityIcons name="format-paint" size={size} color={color} />;
      case 'brick':
        return <MaterialCommunityIcons name="wall" size={size} color={color} />;
      case 'pipe':
        return <MaterialCommunityIcons name="pipe" size={size} color={color} />;
      default:
        return <FontAwesome5 name="boxes" size={size - 4} color={color} />;
    }
  };

  return (
    <View style={styles.iconContainer}>
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#edf2f7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
