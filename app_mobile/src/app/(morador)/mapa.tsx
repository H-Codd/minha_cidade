import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import ProblemMap from '../../components/ProblemMap';
import { buscarProblemas, type Problema } from '../../services/problemService';

export default function MapaScreen() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setProblems(await buscarProblemas());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os pontos do mapa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Problemas da cidade</Text>
      <Text style={styles.subtitle}>Toque em um marcador para ver detalhes e participar da conversa.</Text>
      {loading ? <ActivityIndicator style={styles.loading} size="large" color="#0D8ABC" /> : (
        <ProblemMap problems={problems} onSelect={(problem) => router.push({ pathname: '/(morador)/problema/[id]', params: { id: String(problem.id) } })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '800', paddingHorizontal: 18, paddingTop: 18 },
  subtitle: { color: '#64748B', paddingHorizontal: 18, paddingVertical: 10 },
  loading: { flex: 1 },
});
