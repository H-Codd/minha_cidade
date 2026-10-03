import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const tokenKey = '@minha_cidade_token';

export async function lerToken() {
  return Platform.OS === 'web'
    ? AsyncStorage.getItem(tokenKey)
    : SecureStore.getItemAsync(tokenKey);
}

export async function salvarToken(token: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(tokenKey, token);
  } else {
    await SecureStore.setItemAsync(tokenKey, token);
  }
}

export async function apagarToken() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(tokenKey);
  } else {
    await SecureStore.deleteItemAsync(tokenKey);
  }
}
