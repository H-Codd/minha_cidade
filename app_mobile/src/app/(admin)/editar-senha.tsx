import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../services/api';

export default function EditarSenhaScreen() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    if (novaSenha.length < 8) {
      Alert.alert('Senha inválida', 'A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', { currentPassword: senhaAtual, newPassword: novaSenha });
      Alert.alert('Sucesso', 'Senha atualizada com segurança.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a senha. Confira a senha atual e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#0D8ABC" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Credenciais de Acesso</Text>
          <Text style={styles.headerSubtitle}>Atualizar senha do administrador</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningCard}>
          <Ionicons name="shield-checkmark" size={24} color="#059669" />
          <Text style={styles.warningText}>
            Para garantir a segurança do sistema da Prefeitura, utilize uma senha forte com letras, números e símbolos.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Senha Atual</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              secureTextEntry 
              placeholder="Digite a sua senha atual"
              placeholderTextColor="#94A3B8"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Nova Senha Segura</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#0D8ABC" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              secureTextEntry 
              placeholder="Digite a nova senha"
              placeholderTextColor="#94A3B8"
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
          </View>

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="shield-half-outline" size={20} color="#0D8ABC" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              secureTextEntry 
              placeholder="Repita a nova senha"
              placeholderTextColor="#94A3B8"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <>
            <Text style={styles.saveButtonText}>Atualizar Credenciais</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  content: { padding: 20 },
  
  warningCard: { flexDirection: 'row', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 24, alignItems: 'center' },
  warningText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#065F46', lineHeight: 20 },
  
  formCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 3, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8, marginBottom: 24 },
  
  saveButton: { flexDirection: 'row', backgroundColor: '#0D8ABC', paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#0D8ABC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});