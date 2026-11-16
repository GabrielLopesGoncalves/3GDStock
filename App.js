import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ListaScreen from './screens/ListaScreen';
import DetalheScreen from './screens/DetalheScreen';
import LoginScreen from './screens/LoginScreen';
import CadastroScreen from './screens/CadastroScreen';

import { inicializarBanco } from './database/database';

const Stack = createNativeStackNavigator();

export default function App() {
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState('');
  const prepararBanco = async () => {
    setErro('');
    try {
      await inicializarBanco();
      setPronto(true);
    } catch (error) {
      console.error('Erro ao abrir SQLite:', error);
      setErro('Não foi possível abrir o banco de materiais.');
    }
  };
  useEffect(() => { prepararBanco(); }, []);
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 500;

  if (!pronto) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {erro ? <>
            <Text>{erro}</Text>
            <Button title="Tentar novamente" onPress={prepararBanco} />
          </> : <><ActivityIndicator /><Text>Carregando materiais...</Text></>}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={[styles.rootContainer, isWebDesktop && styles.webDesktopWrapper]}>
        <View style={[styles.appContainer, isWebDesktop && styles.webPhoneFrame]}>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#1d3557" />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: 'Entrar no 3GDStock' }}
              />
              <Stack.Screen
                name="Cadastro"
                component={CadastroScreen}
                options={{ title: 'Criar conta' }}
              />
              <Stack.Screen 
                name="Lista" 
                component={ListaScreen} 
                options={{ title: '3GDStock - Materiais' }}
              />
              <Stack.Screen 
                name="Detalhe" 
                component={DetalheScreen} 
                options={{ title: 'Detalhes do Material' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#eaf0f6',
  },
  webDesktopWrapper: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  webPhoneFrame: {
    width: 440,
    maxWidth: '100%',
    height: '96%',
    maxHeight: 880,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
});

