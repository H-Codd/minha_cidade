import { create } from 'axios';
import { Platform } from 'react-native';
import { lerToken } from './tokenStorage';

const api = create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'),
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await lerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
