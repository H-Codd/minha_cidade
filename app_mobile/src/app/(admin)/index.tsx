import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProblemMap from '../../components/ProblemMap';
import api from '../../services/api';
import { buscarProblemas, type Problema } from '../../services/problemService';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'lista' | 'mapa'>('lista');
  const [ocorrencias, setOcorrencias] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarOcorrencias = useCallback(async () => {
    try {
      setOcorrencias(await buscarProblemas());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências do banco de dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    carregarOcorrencias();
  }, [carregarOcorrencias]));

  const atualizarNoBanco = async (id: number, novoStatus: Problema['status']) => {
    try {
      const { data } = await api.put<{
        notificationSent: boolean;
        notificationError?: string;
        statusUnchanged?: boolean;
      }>(`/problems/${id}/status`, { status: novoStatus });
      setOcorrencias((current) => current.map((item) => item.id === id ? { ...item, status: novoStatus } : item));
      Alert.alert(
        'Status atualizado',
        data.statusUnchanged
          ? 'O relato já estava com este status.'
          : data.notificationSent
            ? 'O morador recebeu uma notificação push.'
            : data.notificationError
              ? `O status foi salvo, mas a notificação falhou: ${data.notificationError}`
              : 'O status foi salvo. O morador ainda não ativou as notificações neste dispositivo.',
      );
    } catch {
      Alert.alert('Erro', 'Falha ao comunicar com a API para atualizar o status.');
    }
  };

  const handleAtualizarStatus = (problem: Problema) => {
    Alert.alert('Atualizar status', `Relato: ${problem.categoria}`, [
      { text: 'Em análise', onPress: () => atualizarNoBanco(problem.id, 'Em análise') },
      { text: 'Resolvido', onPress: () => atualizarNoBanco(problem.id, 'Resolvido') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Central de Ocorrências</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'lista' && styles.toggleBtnActive]} onPress={() => setViewMode('lista')}>
            <Ionicons name="list" size={18} color={viewMode === 'lista' ? '#FFF' : '#64748B'} />
            <Text style={[styles.toggleText, viewMode === 'lista' && styles.toggleTextActive]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'mapa' && styles.toggleBtnActive]} onPress={() => setViewMode('mapa')}>
            <Ionicons name="map" size={18} color={viewMode === 'mapa' ? '#FFF' : '#64748B'} />
            <Text style={[styles.toggleText, viewMode === 'mapa' && styles.toggleTextActive]}>Mapa</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.categoriesButton} onPress={() => router.push('/(admin)/gerir-categorias')}>
          <Ionicons name="options-outline" size={18} color="#0D8ABC" />
          <Text style={styles.categoriesText}>Gerir categorias</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#0D8ABC" /></View>
      ) : viewMode === 'mapa' ? (
        <ProblemMap problems={ocorrencias} onSelect={(problem) => router.push({ pathname: '/(morador)/problema/[id]', params: { id: String(problem.id) } })} />
      ) : (
        <FlatList
          data={ocorrencias}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onRefresh={carregarOcorrencias}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum problema registrado ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.categoria}</Text>
                <Text style={[styles.status, item.status === 'Resolvido' && styles.statusResolved]}>{item.status}</Text>
              </View>
              <Text style={styles.description}>{item.descricao}</Text>
              <View style={styles.location}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.locationText}>{Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.data).toLocaleString('pt-BR')}</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAtualizarStatus(item)}>
                <Text style={styles.actionButtonText}>Atualizar status</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFF', paddingTop: 55, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 23, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#0D8ABC' },
  toggleText: { marginLeft: 8, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#FFF' },
  categoriesButton: { flexDirection: 'row', gap: 7, alignSelf: 'flex-end', alignItems: 'center', paddingTop: 12 },
  categoriesText: { color: '#0D8ABC', fontWeight: '700' },
  loading: { flex: 1, justifyContent: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  category: { color: '#0D8ABC', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  status: { color: '#0369A1', fontSize: 12, fontWeight: '800' },
  statusResolved: { color: '#059669' },
  description: { color: '#1E293B', fontSize: 15, lineHeight: 21 },
  location: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 9, marginTop: 12 },
  locationText: { color: '#64748B', fontSize: 12, marginLeft: 6 },
  date: { color: '#94A3B8', fontSize: 12, marginTop: 9 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#0D8ABC', padding: 11, borderRadius: 11, marginTop: 13 },
  actionButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 30 },
});
