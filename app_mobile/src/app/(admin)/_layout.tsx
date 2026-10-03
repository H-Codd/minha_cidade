import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D8ABC',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 10 },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Ocorrências', tabBarIcon: ({ color }) => <Ionicons name="alert-circle-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="configuracao" 
        options={{ title: 'Configurações', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} 
      />
      {/* Telas secundárias ocultas da barra */}
      <Tabs.Screen name="gerir-categorias" options={{ href: null }} />
      <Tabs.Screen name="editar-senha" options={{ href: null }} />
    </Tabs>
  );
}