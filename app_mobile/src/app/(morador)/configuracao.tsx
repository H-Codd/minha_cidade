import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';
import { encerrarSessao, type Usuario } from '../../services/authService';
import { registrarNotificacoesPush } from '../../services/pushNotifications';

export default function MoradorConfiguracaoScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet(['@minha_cidade_user', '@minha_cidade_push_enabled']).then((values) => {
      const storedUser = values[0][1];
      if (storedUser) setUser(JSON.parse(storedUser) as Usuario);
      setPushEnabled(values[1][1] === 'true');
    });
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    setPushLoading(true);
    try {
      if (enabled) {
        await registrarNotificacoesPush();
      } else {
        await api.put('/users/push-token', { token: null });
        await AsyncStorage.setItem('@minha_cidade_push_enabled', 'false');
      }
      setPushEnabled(enabled);
    } catch (error) {
      Alert.alert('Notificações', error instanceof Error ? error.message : 'Não foi possível atualizar esta preferência.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleLogout = async () => {
    await encerrarSessao();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarImage}><Ionicons name="person" size={42} color="#0D8ABC" /></View>
        </View>
        <Text style={styles.userName}>{user?.nome || 'Morador'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>A Minha Conta</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(morador)/edit-profile')}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}><Ionicons name="person-outline" size={22} color="#0D8ABC" /></View>
            <Text style={styles.rowText}>Editar Dados Pessoais</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(morador)/historico')}>
            <View style={[styles.iconBox, { backgroundColor: '#F8FAFC' }]}><Ionicons name="time-outline" size={22} color="#475569" /></View>
            <Text style={styles.rowText}>Histórico de Ocorrências</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Preferências da App</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}><Ionicons name="notifications-outline" size={22} color="#D97706" /></View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowText}>Notificações Push</Text>
              <Text style={styles.rowSubtext}>Alertas de atualização da prefeitura</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={handlePushToggle} disabled={pushLoading} trackColor={{ false: '#E2E8F0', true: '#BAE6FD' }} thumbColor={pushEnabled ? '#0D8ABC' : '#F8FAFC'} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#64748B" />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  profileHeader: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 4 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#F0F9FF', backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  userEmail: { fontSize: 15, color: '#64748B', marginTop: 4 },
  content: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4, marginTop: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowTextContainer: { flex: 1 },
  rowText: { fontSize: 16, color: '#1E293B', fontWeight: '700', flex: 1 },
  rowSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 76 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', marginTop: 32, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  logoutText: { color: '#475569', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});