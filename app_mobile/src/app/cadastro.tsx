import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { cadastrarUsuario } from '../services/authService';
import { getApiErrorMessage } from '../services/errorMessage';

export default function CadastroScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const cadastrar = async () => {
    if (!nome.trim() || !email.trim() || senha.length < 8) {
      Alert.alert('Confira seus dados', 'Preencha todos os campos e use uma senha com pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await cadastrarUsuario(nome.trim(), email.trim(), senha);
      router.replace('/(morador)');
    } catch (error) {
      Alert.alert('Não foi possível cadastrar', getApiErrorMessage(error, 'Verifique os dados e tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Participe das melhorias da sua cidade.</Text>
          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome completo" autoCapitalize="words" />
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="voce@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Senha (mínimo 8 caracteres)</Text>
          <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Crie uma senha" secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
          </TouchableOpacity>
          <Text style={styles.footer}>Já tem conta? <Link href="/login" style={styles.link}>Entrar</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 22, elevation: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', marginTop: 5, marginBottom: 16 },
  label: { color: '#475569', fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 14, color: '#0F172A' },
  button: { backgroundColor: '#0D8ABC', minHeight: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  footer: { textAlign: 'center', color: '#64748B', marginTop: 20 },
  link: { color: '#0D8ABC', fontWeight: '800' },
});
