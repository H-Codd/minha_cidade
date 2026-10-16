import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';
import type { Usuario } from '../../services/authService';

export default function EditarPerfilScreen() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    api.get<Usuario>('/auth/me').then(({ data }) => {
      if (!active) return;
      setNome(data.nome);
      setEmail(data.email);
    }).catch(() => {
      if (active) Alert.alert('Erro', 'Não foi possível carregar seus dados de perfil.');
    });
    return () => { active = false; };
  }, []));

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissao.granted === false) {
      Alert.alert('Aviso', 'Autorize o acesso à galeria para alterar a foto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  };

  const handleSalvar = async () => {
    if (!nome || !email) return Alert.alert('Erro', 'Nome e email são obrigatórios.');
    setLoading(true);
    try {
      const { data } = await api.put<Usuario>('/users/profile', {
        name: nome, email: email, ...(novaSenha && { password: novaSenha, currentPassword: senhaAtual })
      });
      await AsyncStorage.setItem('@minha_cidade_user', JSON.stringify(data));
      Alert.alert('Sucesso', 'Dados atualizados!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      Alert.alert('Erro', message || 'Falha ao atualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0284C7', '#0369A1']} style={styles.headerBackground}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </LinearGradient>

      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={escolherFoto}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#94A3B8" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor="#94A3B8" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Segurança</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha Atual</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput style={styles.input} value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry placeholder="Sua senha atual" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="Deixe em branco para manter" />
          </View>
        </View>

        <TouchableOpacity onPress={handleSalvar} disabled={loading}>
          <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.saveButton}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  headerBackground: { height: 160, paddingTop: 50, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { position: 'absolute', top: 50, left: 16, zIndex: 10 },
  headerTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#FFF' },
  
  profileSection: { alignItems: 'center', marginTop: -60 },
  avatarContainer: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#FFF' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#E2E8F0', borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0284C7', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  
  formCard: { backgroundColor: '#FFF', margin: 20, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
  
  saveButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});