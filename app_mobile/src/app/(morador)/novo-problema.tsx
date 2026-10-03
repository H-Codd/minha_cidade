import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { buscarCategorias, enviarOcorrencia, type Categoria } from '../../services/problemService';

export default function NovoProblemaScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarCategorias()
      .then(setCategories)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar as categorias.'));
  }, []);

  const selecionarFoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para anexar uma imagem do problema.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const enviar = async () => {
    if (!categoryId || description.trim().length < 10 || !photo) {
      Alert.alert('Complete o relato', 'Selecione uma categoria, descreva o problema com pelo menos 10 caracteres e anexe uma foto.');
      return;
    }
    setLoading(true);
    try {
      const problem = await enviarOcorrencia(description, categoryId, photo);
      Alert.alert('Relato enviado', 'A prefeitura já pode acompanhar este problema.', [
        { text: 'Ver relato', onPress: () => router.replace({ pathname: '/(morador)/problema/[id]', params: { id: String(problem.id) } }) },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Novo problema</Text>
      <Text style={styles.subtitle}>Conte o que está acontecendo. Sua localização será marcada no mapa.</Text>
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, categoryId === category.id && styles.categorySelected]}>
            <Text style={[styles.categoryText, categoryId === category.id && styles.categoryTextSelected]}>{category.nome}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.description}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex.: buraco grande na faixa da direita, em frente ao número 120..."
        multiline
        maxLength={1000}
        textAlignVertical="top"
      />
      <Text style={styles.counter}>{description.length}/1000</Text>
      <Text style={styles.label}>Foto do local</Text>
      <TouchableOpacity style={styles.photoButton} onPress={selecionarFoto}>
        <Ionicons name="camera-outline" size={22} color="#0D8ABC" />
        <Text style={styles.photoText}>{photo ? 'Trocar foto' : 'Adicionar foto'}</Text>
      </TouchableOpacity>
      {photo && <Image source={{ uri: photo }} style={styles.preview} />}
      <View style={styles.locationNotice}>
        <Ionicons name="location" size={19} color="#0D8ABC" />
        <Text style={styles.locationText}>A localização atual será anexada ao enviar.</Text>
      </View>
      <TouchableOpacity style={styles.submit} onPress={enviar} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Enviar para a prefeitura</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 25, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', lineHeight: 21, marginTop: 7, marginBottom: 18 },
  label: { color: '#334155', fontWeight: '800', marginBottom: 9, marginTop: 14 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 13 },
  categorySelected: { backgroundColor: '#E0F2FE', borderColor: '#0D8ABC' },
  categoryText: { color: '#475569', fontWeight: '700' },
  categoryTextSelected: { color: '#0369A1' },
  description: { minHeight: 130, backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 14, padding: 14, color: '#1E293B' },
  counter: { textAlign: 'right', color: '#94A3B8', fontSize: 12, marginTop: 5 },
  photoButton: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BAE6FD', borderStyle: 'dashed', borderRadius: 14, padding: 18 },
  photoText: { color: '#0D8ABC', fontWeight: '800' },
  preview: { width: '100%', height: 220, borderRadius: 14, marginTop: 12, backgroundColor: '#E2E8F0' },
  locationNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E0F2FE', padding: 12, borderRadius: 12, marginTop: 16 },
  locationText: { flex: 1, color: '#075985', fontSize: 13 },
  submit: { backgroundColor: '#0D8ABC', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
