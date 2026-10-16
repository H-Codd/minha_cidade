import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { TERESINA_MAP_BOUNDS } from './mapCoordinates';
import type { Problema } from '../services/problemService';

interface ProblemMapProps {
  problems: Problema[];
  onSelect: (problem: Problema) => void;
}

export default function ProblemMap({ problems, onSelect }: ProblemMapProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const bounds = TERESINA_MAP_BOUNDS;
  const locatedProblems = problems.filter(
    (problem) =>
      Number.isFinite(problem.latitude) &&
      Number.isFinite(problem.longitude) &&
      problem.latitude >= bounds.minLatitude &&
      problem.latitude <= bounds.maxLatitude &&
      problem.longitude >= bounds.minLongitude &&
      problem.longitude <= bounds.maxLongitude,
  );

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLongitude},${bounds.minLatitude},${bounds.maxLongitude},${bounds.maxLatitude}&layer=mapnik`;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <iframe
        title="Mapa de problemas urbanos — OpenStreetMap"
        src={embedUrl}
        style={styles.map}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {locatedProblems.map((problem) => {
        const left =
          ((problem.longitude - bounds.minLongitude) /
            (bounds.maxLongitude - bounds.minLongitude)) *
          size.width;
        const top =
          ((bounds.maxLatitude - problem.latitude) /
            (bounds.maxLatitude - bounds.minLatitude)) *
          size.height;

        return (
          <TouchableOpacity
            key={problem.id}
            accessibilityRole="button"
            accessibilityLabel={`${problem.categoria}: ${problem.descricao}. Status: ${problem.status}`}
            onPress={() => onSelect(problem)}
            style={[
              styles.marker,
              {
                left: Math.max(0, Math.min(left - 17, size.width - 34)),
                top: Math.max(0, Math.min(top - 34, size.height - 42)),
              },
              problem.status === 'Resolvido' && styles.resolvedMarker,
            ]}
          >
            <Text style={styles.markerText}>●</Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
      {locatedProblems.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum problema com localização para exibir.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 320, overflow: 'hidden', position: 'relative' },
  map: {
    width: '100%',
    height: '100%',
    minHeight: 320,
    borderWidth: 0,
  },
  marker: {
    position: 'absolute',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#0D8ABC',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    cursor: 'pointer',
  },
  resolvedMarker: { backgroundColor: '#10B981' },
  markerText: { color: '#FFFFFF', fontSize: 14 },
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
  empty: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFFE8',
  },
  emptyText: { color: '#475569', textAlign: 'center' },
});
