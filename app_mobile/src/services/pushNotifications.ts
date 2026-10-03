import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

function hasNotificationPermission(permission: Notifications.NotificationPermissionsStatus) {
  return 'granted' in permission && permission.granted === true;
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

export async function registrarNotificacoesPush() {
  if (!Device.isDevice) {
    throw new Error('Notificações push precisam de um dispositivo Android ou iOS físico.');
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Configure o identificador EAS do aplicativo para habilitar notificações.');
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
  await api.put('/users/push-token', { token });
  await AsyncStorage.setItem('@minha_cidade_push_enabled', 'true');
}
