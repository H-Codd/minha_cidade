import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { apagarToken, salvarToken } from './tokenStorage';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  token: string;
  user: Usuario;
}

async function guardarSessao({ token, user }: AuthResponse) {
  await salvarToken(token);
  await AsyncStorage.multiSet([
    ['@minha_cidade_role', user.role],
    ['@minha_cidade_user', JSON.stringify(user)],
  ]);
  return user;
}

export async function realizarLogin(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return guardarSessao(data);
}

export async function cadastrarUsuario(nome: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { nome, email, password });
  return guardarSessao(data);
}

export async function encerrarSessao() {
  await apagarToken();
  await AsyncStorage.multiRemove([
    '@minha_cidade_role',
    '@minha_cidade_user',
  ]);
}
