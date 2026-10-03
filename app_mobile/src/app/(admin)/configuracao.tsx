import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { encerrarSessao } from '../../services/authService';

export default function AdminConfiguracaoScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <Ionicons name="business" size={32} color="#38BDF8" />
        </View>
        {/* Título atualizado para o nome oficial do projeto */}
        <Text style={styles.title}>Minha Cidade</Text>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Painel Administrativo</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Controle de Sistema</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(admin)/gerir-categorias')}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="grid" size={20} color="#0284C7" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowText}>Categorias de Ocorrências</Text>
              <Text style={styles.rowSubtext}>Adicionar ou remover tipos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Segurança Institucional</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(admin)/editar-senha')}>
            <View style={[styles.iconBox, { backgroundColor: '#F8FAFC' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#475569" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowText}>Credenciais de Acesso</Text>
              <Text style={styles.rowSubtext}>Alterar senha do gestor</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={async () => { await encerrarSessao(); router.replace('/login'); }} style={{ marginTop: 40 }}>
          <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Encerrar Sessão</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { alignItems: 'center', paddingVertical: 50, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  headerIconWrapper: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  title: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  badgeText: { color: '#E2E8F0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  content: { padding: 20, paddingTop: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowTextContainer: { flex: 1 },
  rowText: { fontSize: 16, color: '#0F172A', fontWeight: '700' },
  rowSubtext: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});