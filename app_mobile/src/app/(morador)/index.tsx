import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buscarProblemas, type Problema } from '../../services/problemService';

export default function MoradorHomeScreen() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setProblems(await buscarProblemas());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os problemas da cidade.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PARTICIPAÇÃO CIDADÃ</Text>
        <Text style={styles.title}>O que precisa melhorar no seu bairro?</Text>
        <Text style={styles.subtitle}>Registre, acompanhe e ajude a cuidar da cidade.</Text>
        <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/(morador)/novo-problema')}>
          <Ionicons name="add-circle-outline" size={21} color="#FFF" />
          <Text style={styles.reportText}>Registrar um problema</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Problemas recentes</Text>
        <TouchableOpacity onPress={() => router.push('/(morador)/mapa')}>
          <Text style={styles.mapLink}>Ver no mapa</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#0D8ABC" />
      ) : (
        <FlatList
          data={problems.slice(0, 20)}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={carregar} tintColor="#0D8ABC" />}
          ListEmptyComponent={<Text style={styles.empty}>Ainda não há problemas registrados. Seja o primeiro a contribuir.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(morador)/problema/[id]', params: { id: String(item.id) } })}>
              <View style={styles.cardTop}>
                <Text style={styles.category}>{item.categoria}</Text>
                <Text style={[styles.status, item.status === 'Resolvido' && styles.resolved]}>{item.status}</Text>
              </View>
              <Text style={styles.description} numberOfLines={2}>{item.descricao}</Text>
              <Text style={styles.date}>{new Date(item.data).toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { backgroundColor: '#0D8ABC', padding: 22, paddingTop: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  eyebrow: { color: '#CDEEFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#FFF', fontSize: 25, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#E0F2FE', marginTop: 7, lineHeight: 20 },
  reportButton: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#075F84', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 18 },
  reportText: { color: '#FFF', fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  mapLink: { color: '#0D8ABC', fontWeight: '700' },
  list: { padding: 16, paddingTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  category: { color: '#0D8ABC', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  status: { color: '#0369A1', fontSize: 12, fontWeight: '700' },
  resolved: { color: '#059669' },
  description: { color: '#1E293B', fontSize: 15, lineHeight: 21 },
  date: { color: '#94A3B8', fontSize: 12, marginTop: 10 },
  empty: { color: '#64748B', textAlign: 'center', padding: 24, lineHeight: 21 },
});
