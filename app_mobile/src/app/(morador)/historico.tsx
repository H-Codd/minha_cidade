import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';
import type { Problema } from '../../services/problemService';

export default function HistoricoScreen() {
  const router = useRouter();
  const [historico, setHistorico] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarHistorico = useCallback(async () => {
    try {
      const response = await api.get<Problema[]>('/problems/me');
      setHistorico(response.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seu histórico.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarHistorico(); }, [carregarHistorico]));

  const coresStatus = (status: string) => {
    if (status === 'Resolvido') return { bg: '#D1FAE5', text: '#065F46' };
    if (status === 'Em análise') return { bg: '#DBEAFE', text: '#1E40AF' };
    return { bg: '#FEF2F2', text: '#991B1B' };
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#0D8ABC" /><Text style={styles.loadingText}>Buscando seus relatos...</Text></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={historico}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={false} onRefresh={carregarHistorico} tintColor="#0D8ABC" />}
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não registrou nenhum problema.</Text>}
      renderItem={({ item }) => {
        const colors = coresStatus(item.status);
        return (
          <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(morador)/problema/[id]', params: { id: String(item.id) } })}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{item.categoria}</Text>
              <Text style={styles.date}>{new Date(item.data).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.descricao}</Text>
            <View style={styles.footer}>
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.status, { color: colors.text }]}>{item.status}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 15 },
  list: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  category: { fontSize: 12, fontWeight: '800', color: '#0D8ABC', textTransform: 'uppercase' },
  date: { fontSize: 12, color: '#94A3B8' },
  description: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  status: { fontSize: 12, fontWeight: '800' },
});
