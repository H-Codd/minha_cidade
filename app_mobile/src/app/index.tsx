import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { lerToken } from '../services/tokenStorage';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checarPermissao() {
      try {
        const token = await lerToken();
        const role = await AsyncStorage.getItem('@minha_cidade_role');

        if (!token) {
          router.replace('/login');
          return;
        }

        if (role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(morador)');
        }
      } catch (error) {
        console.error('Erro ao verificar credenciais:', error);
        router.replace('/login');
      }
    }

    checarPermissao();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});