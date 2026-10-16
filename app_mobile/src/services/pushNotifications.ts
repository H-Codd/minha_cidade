import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

function hasNotificationPermission(permission: NotificationPermissionsStatus) {
  return 'granted' in permission && permission.granted === true;
}

export async function registrarNotificacoesPush() {
  if (!Device.isDevice) {
    throw new Error('Notificações push precisam de um dispositivo Android ou iOS físico.');
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error('Notificações push remotas não funcionam no Expo Go. Instale uma build de desenvolvimento ou de produção do app.');
  }

  let Notifications: typeof import('expo-notifications');
  try {
    Notifications = await import('expo-notifications');
  } catch (error) {
    if (error instanceof Error && error.message.includes('ExpoTopicSubscriptionModule')) {
      throw new Error('O módulo de notificações não está incluído nesta build. Gere e instale uma nova build de desenvolvimento do app.');
    }
    throw error;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const configuredProjectIds = [
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    Constants.easConfig?.projectId,
    Constants.expoConfig?.extra?.eas?.projectId,
  ];
  const projectId = configuredProjectIds.find(
    (value): value is string =>
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
  if (!projectId) {
    throw new Error('O ID do projeto EAS não está configurado ou é inválido. Configure EXPO_PUBLIC_EAS_PROJECT_ID com o UUID do projeto em expo.dev ou vincule o app com npx eas init.');
  }

  const current = await Notifications.getPermissionsAsync();
  const permission =
    hasNotificationPermission(current)
      ? current
      : await Notifications.requestPermissionsAsync();
  if (!hasNotificationPermission(permission)) {
    throw new Error('Permissão para notificações não concedida.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Atualizações de problemas',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)) {
    throw new Error('O Expo não retornou um token de notificação válido. Confira as credenciais de push da build.');
  }
  await api.put('/users/push-token', { token });
  await AsyncStorage.setItem('@minha_cidade_push_enabled', 'true');
}
