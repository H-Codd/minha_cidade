import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

// Interface baseada na tabela Categorias do MySQL (id, nome)
interface Categoria {
  id: string;
  nome: string;
  icone?: string; // Opcional, caso o back-end suporte
  cor?: string;   // Opcional
}

export default function GerirCategoriasScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. LER DADOS (SELECT no Banco de Dados)
  const carregarCategorias = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategorias(response.data); // A API devolve a lista do banco
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as categorias do servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    carregarCategorias();
  }, [carregarCategorias]));

  // 2. INSERIR DADOS (INSERT no Banco de Dados)
  const handleAdicionar = async () => {
    if (!novaCategoria.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/categories', { 
        nome: novaCategoria,
        icone: 'alert-circle-outline', // Padrão genérico
        cor: '#0D8ABC'
      });
      
      // Atualiza a lista na tela imediatamente com o dado que voltou do banco (incluindo o novo ID gerado)
      setCategorias([...categorias, response.data]);
      setNovaCategoria('');
      Alert.alert('Sucesso', 'Categoria salva no banco de dados!');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar a categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. REMOVER DADOS (DELETE no Banco de Dados)
  const apagarCategoriaDoBanco = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      // Remove da tela apenas se o banco apagou com sucesso
      setCategorias(categorias.filter(cat => cat.id !== id));
    } catch {
      Alert.alert('Erro', 'Não foi possível remover a categoria do servidor.');
    }
  };

  const handleDelete = (id: string, nome: string) => {
    Alert.alert('Remover', `Deseja apagar "${nome}" permanentemente do sistema?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => apagarCategoriaDoBanco(id) }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#0D8ABC" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Gestão de Categorias</Text>
        </View>
      </View>

      <View style={styles.addSection}>
        <TextInput 
          style={styles.input} 
          placeholder="Adicionar nova categoria..." 
          value={novaCategoria} 
          onChangeText={setNovaCategoria} 
          editable={!isSubmitting}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdicionar} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Ionicons name="add" size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0D8ABC" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${item.cor || '#0D8ABC'}15` }]}>
                  <Ionicons name={(item.icone as any) || 'list-outline'} size={22} color={item.cor || '#0D8ABC'} />
                </View>
                <Text style={styles.cardText}>{item.nome}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.nome)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#CBD5E0" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// Mantenha os mesmos "styles" do ficheiro anterior aqui...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  addSection: { flexDirection: 'row', padding: 20, gap: 12 },
  input: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 20 },
  addButton: { backgroundColor: '#0D8ABC', width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardText: { fontSize: 16, color: '#334155', fontWeight: '600' },
  deleteButton: { padding: 8 },
});