# Minha Cidade

Aplicativo Expo/React Native para relatos de problemas urbanos e painel da prefeitura. O mapa usa OpenStreetMap sem chave paga; a localização usa os serviços de localização do aparelho; as notificações de mudança de status usam Expo Push.

## API e banco de dados

Requisitos: Node.js 18 ou mais recente e MySQL 8.

1. Crie o banco e as tabelas:

   ```powershell
   Get-Content -Raw server\database\schema.sql | mysql -u root -p
   ```

2. Copie `server\.env.example` para `server\.env` e configure o acesso ao MySQL e um `JWT_SECRET` aleatório com pelo menos 32 caracteres.
3. Instale e inicie a API:

   ```powershell
   cd server
   npm install
   npm start
   ```

   A API fica em `http://localhost:3000`; `GET /health` verifica a conexão.

4. Cadastre uma conta pelo app. Para conceder acesso ao painel municipal, promova uma conta de confiança no banco:

   ```sql
   UPDATE usuarios SET role = 'admin' WHERE email = 'gestor@prefeitura.gov.br';
   ```

   Faça login novamente nessa conta para abrir o painel. O cadastro público sempre cria moradores; não existe criação pública de administradores.

## Aplicativo Android

Na pasta `app_mobile`, instale as dependências e inicie o Expo:

```powershell
npm install
npx expo install expo-notifications react-native-maps expo-dev-client
npx expo start
```

Copie `.env.example` para `.env`. O emulador Android usa `10.0.2.2` para alcançar o servidor local. Em aparelho físico, configure `EXPO_PUBLIC_API_URL` com o endereço IP local do computador, por exemplo `http://192.168.1.20:3000`; o telefone e o computador precisam estar na mesma rede. Para produção, use a URL HTTPS pública da API.

O morador pode criar relatos com categoria, descrição, foto e GPS; consultar o histórico; acompanhar os relatos no mapa e comentar em cada ocorrência. A prefeitura pode consultar os relatos em lista/mapa, alterar status e gerir categorias.

## Notificações

O serviço Expo Push não exige uma conta paga, mas notificações remotas precisam de um dispositivo físico e de uma build nativa. Crie/vincule o projeto EAS, configure credenciais Android (FCM) no EAS e informe o `projectId` em `EXPO_PUBLIC_EAS_PROJECT_ID` ou em `extra.eas.projectId` no app config. Ative as notificações na tela Configuração do morador. O Expo Push é um serviço externo gratuito sem garantia de entrega; a API informa quando o serviço não aceitou uma notificação.

## Publicar na Play Store

1. Ajuste `expo.android.package` em `app.json` para um identificador único controlado pela sua organização **antes da primeira publicação**.
2. Execute `npx eas-cli@latest login` e `npx eas-cli@latest init` para autenticar e associar o projeto. Configure as credenciais de assinatura Android e o projeto Firebase Cloud Messaging para push.
3. Configure `EXPO_PUBLIC_API_URL` apontando para a API de produção HTTPS e associe o identificador EAS do projeto.
4. Gere o Android App Bundle:

   ```powershell
   npx eas-cli@latest build --platform android --profile production
   ```

5. Crie o app no Google Play Console. Para o primeiro envio, faça o upload do `.aab` no Play Console; depois, configure a conta de serviço e use `npx eas-cli@latest submit --platform android --profile production`.
6. Complete a ficha da loja, classificação indicativa, política de privacidade, declaração de permissões/localização/fotos, teste fechado e requisitos de publicação vigentes no Play Console.

## Produção

`server/uploads` guarda as fotos localmente para desenvolvimento. Em produção, use armazenamento de objetos durável, HTTPS, credenciais MySQL restritas e backup; proteja a API contra abuso e restrinja o CORS aos domínios necessários. A camada de mapa usa tiles públicos do OpenStreetMap, sujeitos à política de uso e atribuição do serviço.
