import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function MoradorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D8ABC',
        tabBarInactiveTintColor: '#A0AEC0',
        headerStyle: { backgroundColor: '#0D8ABC' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicial', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="mapa" options={{ title: 'Mapa', tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico', tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="configuracao" options={{ title: 'Configuração', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="novo-problema" options={{ href: null, title: 'Novo problema' }} />
      <Tabs.Screen name="edit-profile" options={{ href: null, title: 'Editar Perfil' }} />
      <Tabs.Screen name="problema/[id]" options={{ href: null, title: 'Detalhes do problema' }} />
    </Tabs>
  );
}