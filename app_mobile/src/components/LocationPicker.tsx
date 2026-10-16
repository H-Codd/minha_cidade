import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { TERESINA, TERESINA_MAP_BOUNDS } from './mapCoordinates';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  initialLocation: Coordinates | null;
  onCancel: () => void;
  onConfirm: (location: Coordinates) => void;
}

function createPickerHtml(initialLocation: Coordinates | null) {
  const initial = JSON.stringify(initialLocation);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #e8eef0; }
      .selection-pin { background: transparent; border: 0; }
      .selection-pin span {
        display: block; width: 28px; height: 28px; border: 3px solid white; border-radius: 50%;
        background: #0D8ABC; box-shadow: 0 2px 7px #0006;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const bounds = [
        [${TERESINA_MAP_BOUNDS.minLatitude}, ${TERESINA_MAP_BOUNDS.minLongitude}],
        [${TERESINA_MAP_BOUNDS.maxLatitude}, ${TERESINA_MAP_BOUNDS.maxLongitude}]
      ];
      const map = L.map('map').setView(
        [${TERESINA.latitude}, ${TERESINA.longitude}],
        14
      );
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      map.fitBounds(bounds, { padding: [12, 12] });

      const icon = L.divIcon({
        className: 'selection-pin',
        html: '<span></span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      let marker = null;
      const setLocation = (latitude, longitude) => {
        if (marker) marker.setLatLng([latitude, longitude]);
        else marker = L.marker([latitude, longitude], { icon }).addTo(map);
        window.ReactNativeWebView.postMessage(JSON.stringify({ latitude, longitude }));
      };

      const initialLocation = ${initial};
      if (initialLocation) {
        setLocation(initialLocation.latitude, initialLocation.longitude);
      }
      map.on('click', (event) => {
        setLocation(event.latlng.lat, event.latlng.lng);
      });
    </script>
  </body>
</html>`;
}

export default function LocationPicker({
  initialLocation,
  onCancel,
  onConfirm,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(initialLocation);
  const [mapError, setMapError] = useState(false);
  const html = useMemo(() => createPickerHtml(initialLocation), [initialLocation]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const location = JSON.parse(event.nativeEvent.data) as Coordinates;
      if (
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude) &&
        location.latitude >= -90 &&
        location.latitude <= 90 &&
        location.longitude >= -180 &&
        location.longitude <= 180
      ) {
        setSelectedLocation(location);
      }
    } catch {
      setMapError(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha o local do problema</Text>
      <Text style={styles.subtitle}>Toque no mapa para marcar o ponto exato.</Text>
      <View style={styles.mapContainer}>
        <WebView
          style={styles.map}
          source={{ html, baseUrl: 'https://www.openstreetmap.org' }}
          originWhitelist={['https://*']}
          javaScriptEnabled
          onMessage={handleMessage}
          onError={() => setMapError(true)}
          onLoadStart={() => setMapError(false)}
          accessibilityLabel="Mapa para escolher o local do problema"
        />
        {mapError && (
          <View style={styles.mapError}>
            <Text style={styles.message}>Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.</Text>
          </View>
        )}
        {!selectedLocation && !mapError && (
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.message}>Toque no mapa para marcar o local</Text>
          </View>
        )}
      </View>
      {selectedLocation && (
        <Text style={styles.coordinates}>
          Local selecionado: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
        </Text>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirm, !selectedLocation && styles.disabled]}
          onPress={() => selectedLocation && onConfirm(selectedLocation)}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmText}>Confirmar local</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  title: { color: '#0F172A', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#64748B', marginTop: 6, marginBottom: 12 },
  mapContainer: { flex: 1, minHeight: 240, overflow: 'hidden', borderRadius: 14, position: 'relative' },
  map: { flex: 1, backgroundColor: '#E8EEF0' },
  mapError: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFFE8',
  },
  hint: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFFE8',
  },
  message: { color: '#475569', textAlign: 'center' },
  coordinates: { color: '#475569', fontSize: 13, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  cancelText: { color: '#475569', fontWeight: '700' },
  confirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0D8ABC',
  },
  confirmText: { color: '#FFF', fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
