import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import api from '../services/api';
import { encerrarSessao, type Usuario } from '../services/authService';
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

        let verifiedRole = role;
        try {
          const { data: user } = await api.get<Usuario>('/auth/me');
          if (user.role !== 'admin' && user.role !== 'user') {
            throw new Error('A API retornou um perfil de usuário inválido.');
          }
          verifiedRole = user.role;
          await AsyncStorage.multiSet([
            ['@minha_cidade_role', user.role],
            ['@minha_cidade_user', JSON.stringify(user)],
          ]);
        } catch (error) {
          if (isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
            await encerrarSessao();
            router.replace('/login');
            return;
          }
          console.warn(
            'Não foi possível validar a sessão com a API; usando o perfil salvo neste dispositivo.',
            error instanceof Error ? error.message : error,
          );
        }

        router.replace(verifiedRole === 'admin' ? '/(admin)' : '/(morador)');
      } catch (error) {
        console.error('Erro ao verificar credenciais:', error);
        await encerrarSessao().catch((cleanupError: unknown) => {
          console.error('Não foi possível limpar a sessão local:', cleanupError);
        });
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