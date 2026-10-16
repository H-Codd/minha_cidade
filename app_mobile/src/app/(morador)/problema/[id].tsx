import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../../services/api';
import type { Problema } from '../../../services/problemService';

interface Comentario {
  id: number;
  comentario: string;
  data: string;
  nome_usuario: string;
}

function obterNomeDoAutor(nomeUsuario: string) {
  const nome = nomeUsuario.trim();
  return nome && !nome.includes('@') ? nome : 'Morador';
}

export default function ProblemaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [problem, setProblem] = useState<Problema | null>(null);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [problemResponse, commentsResponse] = await Promise.all([
        api.get<Problema>(`/problems/${id}`),
        api.get<Comentario[]>(`/problems/${id}/comments`),
      ]);
      setProblem(problemResponse.data);
      setComments(commentsResponse.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o relato e a conversa.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const enviarComentario = async () => {
    if (comment.trim().length < 2) return;
    setSending(true);
    try {
      await api.post(`/problems/${id}/comments`, { comentario: comment.trim() });
      setComment('');
      await carregar();
    } catch {
      Alert.alert('Não foi possível comentar', 'Faça login novamente e tente outra vez.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0D8ABC" /></View>;
  if (!problem) return <View style={styles.center}><Text style={styles.muted}>Relato não encontrado.</Text></View>;

  const photoUrl = problem.foto ? `${api.defaults.baseURL}${problem.foto}` : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
        <Text style={styles.category}>{problem.categoria}</Text>
        <Text style={styles.description}>{problem.descricao}</Text>
        <Text style={styles.status}>Status: {problem.status}</Text>
        <Text style={styles.date}>{new Date(problem.data).toLocaleString('pt-BR')}</Text>
        {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />}
        <Text style={styles.location}>Localização: {Number(problem.latitude).toFixed(5)}, {Number(problem.longitude).toFixed(5)}</Text>
      </View>
      <Text style={styles.heading}>Conversa da comunidade</Text>
      <Text style={styles.muted}>Compartilhe informações úteis sobre este problema.</Text>
      <View style={styles.commentForm}>
        <TextInput style={styles.input} placeholder="Escreva um comentário..." value={comment} onChangeText={setComment} multiline maxLength={500} />
        <TouchableOpacity style={styles.send} onPress={enviarComentario} disabled={sending}>
          {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
      {comments.map((item) => (
        <View key={item.id} style={styles.commentCard}>
          <Text style={styles.author}>{obterNomeDoAutor(item.nome_usuario)}</Text>
          <Text style={styles.commentText}>{item.comentario}</Text>
          <Text style={styles.date}>{new Date(item.data).toLocaleString('pt-BR')}</Text>
        </View>
      ))}
      {!comments.length && <Text style={styles.empty}>Ainda não há comentários neste relato.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  card: { backgroundColor: '#FFF', padding: 17, borderRadius: 18, elevation: 2 },
  category: { color: '#0D8ABC', fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
  description: { color: '#1E293B', fontWeight: '700', fontSize: 18, lineHeight: 25, marginTop: 8 },
  status: { color: '#0369A1', fontWeight: '700', marginTop: 12 },
  date: { color: '#94A3B8', fontSize: 12, marginTop: 6 },
  photo: { width: '100%', height: 220, borderRadius: 12, marginTop: 14, backgroundColor: '#E2E8F0' },
  location: { color: '#64748B', fontSize: 12, marginTop: 12 },
  heading: { color: '#1E293B', fontSize: 20, fontWeight: '800', marginTop: 22 },
  muted: { color: '#64748B', marginTop: 5 },
  commentForm: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14, marginBottom: 12 },
  input: { flex: 1, minHeight: 48, maxHeight: 120, padding: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, color: '#1E293B' },
  send: { backgroundColor: '#0D8ABC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  sendText: { color: '#FFF', fontWeight: '800' },
  commentCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  author: { color: '#0F172A', fontWeight: '800', marginBottom: 5 },
  commentText: { color: '#334155', lineHeight: 20 },
  empty: { color: '#94A3B8', textAlign: 'center', padding: 20 },
});
