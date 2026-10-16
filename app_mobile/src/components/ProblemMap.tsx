import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { TERESINA, TERESINA_MAP_BOUNDS } from './mapCoordinates';
import type { Problema } from '../services/problemService';

interface ProblemMapProps {
  problems: Problema[];
  onSelect: (problem: Problema) => void;
}

function createMapHtml(problems: Problema[]) {
  const mapProblems = JSON.stringify(
    problems.map((problem) => ({
      id: problem.id,
      latitude: problem.latitude,
      longitude: problem.longitude,
      category: problem.categoria,
      description: problem.descricao,
      status: problem.status,
      resolved: problem.status === 'Resolvido',
    })),
  ).replace(/[<>&]/g, (character) => {
    const escapes: Record<string, string> = {
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
    };
    return escapes[character];
  });

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #e8eef0; }
      .leaflet-container { font-family: sans-serif; }
      .problem-pin { background: transparent; border: 0; }
      .problem-pin span {
        display: flex; width: 32px; height: 32px; align-items: center; justify-content: center;
        border: 2px solid white; border-radius: 50%; background: #0D8ABC; color: white;
        font-size: 14px; box-shadow: 0 2px 6px #0005;
      }
      .problem-pin.resolved span { background: #10B981; }
      .popup { min-width: 180px; }
      .popup-category { color: #0D8ABC; font-weight: 800; text-transform: uppercase; }
      .popup-description { margin: 6px 0; }
      .popup-status { color: #64748B; font-size: 12px; }
      .popup button {
        width: 100%; margin-top: 9px; padding: 9px; border: 0; border-radius: 7px;
        background: #0D8ABC; color: white; font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const problems = ${mapProblems};
      const map = L.map('map', { zoomControl: true }).setView(
        [${TERESINA.latitude}, ${TERESINA.longitude}],
        13
      );
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const bounds = [
        [${TERESINA_MAP_BOUNDS.minLatitude}, ${TERESINA_MAP_BOUNDS.minLongitude}],
        [${TERESINA_MAP_BOUNDS.maxLatitude}, ${TERESINA_MAP_BOUNDS.maxLongitude}]
      ];
      map.fitBounds(bounds, { padding: [12, 12] });

      problems.forEach((problem) => {
        const icon = L.divIcon({
          className: 'problem-pin' + (problem.resolved ? ' resolved' : ''),
          html: '<span>●</span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        const marker = L.marker([problem.latitude, problem.longitude], { icon }).addTo(map);
        const popup = document.createElement('div');
        popup.className = 'popup';

        const category = document.createElement('div');
        category.className = 'popup-category';
        category.textContent = problem.category;
        popup.appendChild(category);

        const description = document.createElement('div');
        description.className = 'popup-description';
        description.textContent = problem.description;
        popup.appendChild(description);

        const status = document.createElement('div');
        status.className = 'popup-status';
        status.textContent = problem.status;
        popup.appendChild(status);

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Ver relato';
        button.addEventListener('click', () => {
          window.ReactNativeWebView.postMessage(String(problem.id));
        });
        popup.appendChild(button);
        marker.bindPopup(popup);
      });
    </script>
  </body>
</html>`;
}

export default function ProblemMap({ problems, onSelect }: ProblemMapProps) {
  const [mapError, setMapError] = useState(false);
  const locatedProblems = useMemo(
    () =>
      problems.filter(
        (problem) =>
          Number.isFinite(problem.latitude) &&
          Number.isFinite(problem.longitude) &&
          problem.latitude >= TERESINA_MAP_BOUNDS.minLatitude &&
          problem.latitude <= TERESINA_MAP_BOUNDS.maxLatitude &&
          problem.longitude >= TERESINA_MAP_BOUNDS.minLongitude &&
          problem.longitude <= TERESINA_MAP_BOUNDS.maxLongitude,
      ),
    [problems],
  );
  const html = useMemo(() => createMapHtml(locatedProblems), [locatedProblems]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const problemId = Number(event.nativeEvent.data);
    if (!Number.isSafeInteger(problemId)) return;

    const problem = locatedProblems.find((item) => item.id === problemId);
    if (problem) onSelect(problem);
  };

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html, baseUrl: 'https://www.openstreetmap.org' }}
        originWhitelist={['https://*']}
        javaScriptEnabled
        onMessage={handleMessage}
        onError={() => setMapError(true)}
        onLoadStart={() => setMapError(false)}
        accessibilityLabel="Mapa de problemas urbanos"
      />
      {mapError && (
        <View style={styles.error}>
          <Text style={styles.errorText}>Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.</Text>
        </View>
      )}
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
  map: { flex: 1, backgroundColor: '#E8EEF0' },
  error: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFFE8',
  },
  errorText: { color: '#475569', textAlign: 'center' },
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
