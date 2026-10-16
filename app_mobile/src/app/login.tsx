import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { realizarLogin } from '../services/authService';
import { getApiErrorMessage } from '../services/errorMessage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Dados obrigatórios', 'Informe seu e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const user = await realizarLogin(email.trim(), password);
      router.replace(user.role === 'admin' ? '/(admin)' : '/(morador)');
    } catch (error) {
      Alert.alert('Não foi possível entrar', getApiErrorMessage(error, 'Confira seu e-mail e senha e tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}><Ionicons name="business" size={30} color="#FFF" /></View>
          <Text style={styles.title}>Minha Cidade</Text>
          <Text style={styles.subtitle}>Sua cidade melhor, juntos.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Bem-vindo de volta</Text>
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="voce@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Senha</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={entrar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </TouchableOpacity>
          <Text style={styles.footer}>Ainda não tem conta? <Link href="/cadastro" style={styles.link}>Cadastre-se</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#0D8ABC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 27, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 22, elevation: 2 },
  heading: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 18 },
  label: { color: '#475569', fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 14, color: '#0F172A' },
  button: { backgroundColor: '#0D8ABC', minHeight: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  footer: { textAlign: 'center', color: '#64748B', marginTop: 20 },
  link: { color: '#0D8ABC', fontWeight: '800' },
});
