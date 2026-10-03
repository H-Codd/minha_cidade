import MapView, { Callout, Marker, UrlTile } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import type { Problema } from '../services/problemService';

interface ProblemMapProps {
  problems: Problema[];
  onSelect: (problem: Problema) => void;
}

export default function ProblemMap({ problems, onSelect }: ProblemMapProps) {
  const firstLocated = problems.find(
    (problem) => Number.isFinite(problem.latitude) && Number.isFinite(problem.longitude),
  );

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapType="none"
        initialRegion={{
          latitude: firstLocated?.latitude ?? -23.5505,
          longitude: firstLocated?.longitude ?? -46.6333,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          zIndex={-1}
        />
        {problems.map((problem) => (
          <Marker
            key={problem.id}
            coordinate={{ latitude: problem.latitude, longitude: problem.longitude }}
            pinColor={problem.status === 'Resolvido' ? '#10B981' : '#0D8ABC'}
          >
            <Callout onPress={() => onSelect(problem)}>
              <View style={styles.callout}>
                <Text style={styles.category}>{problem.categoria}</Text>
                <Text numberOfLines={2}>{problem.descricao}</Text>
                <Text style={styles.status}>{problem.status} · Toque para abrir</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 320, overflow: 'hidden' },
  callout: { width: 210, padding: 6, gap: 4 },
  category: { color: '#0D8ABC', fontWeight: '800', textTransform: 'uppercase' },
  status: { color: '#64748B', fontSize: 12, marginTop: 4 },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#FFFFFFE8',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  attributionText: { fontSize: 10, color: '#475569' },
});
