# Integração gratuita de mapa e notificações

## Mapa e geolocalização

O backend já exige e salva `latitude` e `longitude` no `POST /issues`. Na interface web, use a Geolocation API do navegador para obter a posição e Leaflet com os tiles do OpenStreetMap para exibir e marcar os pontos. Essa combinação não exige chave do Google nem cobrança. A localização do navegador depende da permissão do usuário e de HTTPS (localhost também é aceito).

Exemplo de mapa e marcador selecionável:

```html
<div id="map" style="height: 400px"></div>
<script>
  const map = L.map('map').setView([-15.78, -47.93], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker;
  function markPoint(latitude, longitude) {
    if (marker) marker.setLatLng([latitude, longitude]);
    else marker = L.marker([latitude, longitude]).addTo(map);
    map.setView([latitude, longitude], 16);
  }

  map.on('click', ({ latlng }) => markPoint(latlng.lat, latlng.lng));
  navigator.geolocation?.getCurrentPosition(({ coords }) => {
    markPoint(coords.latitude, coords.longitude);
  });
</script>
```

Carregue Leaflet conforme a instalação usada pelo seu frontend. Para gravar o ponto, envie esses valores numéricos no JSON de criação de ocorrência junto com `description` e `category_id`, usando `Authorization: Bearer <token>`.

## Notificações Web Push

Copie `.env.example` para `.env`, gere um par VAPID gratuito e preencha as chaves no `.env`:

```sh
npx web-push generate-vapid-keys
```

Não publique `VAPID_PRIVATE_KEY`. A API expõe `GET /notifications/public-key`; com o token de usuário, o navegador envia `subscription.toJSON()` para `POST /notifications/subscribe`. O usuário recebe push quando um administrador altera o status de uma ocorrência dele. Use `DELETE /notifications/subscribe` com `{ "endpoint": "..." }` para cancelar uma inscrição.

O cliente deve registrar `/service-worker.js`, solicitar permissão e criar a inscrição com `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: <chave pública VAPID decodificada> })`. As rotas de inscrição exigem autenticação e o navegador deve estar em HTTPS (localhost é permitido para desenvolvimento).