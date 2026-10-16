# Minha Cidade

Aplicativo Expo/React Native para relatos de problemas urbanos e painel da prefeitura. Os mapas usam OpenStreetMap sem chave paga; ao criar um relato, o morador marca o local do problema diretamente no mapa, sem compartilhar a localização atual do aparelho. As notificações de mudança de status usam Expo Push.

## API e banco de dados

Requisitos: Node.js 18 ou mais recente e MySQL 8.

1. Crie o banco e as tabelas:

   ```powershell
   Get-Content -Raw server\database\schema.sql | mysql -u root -p
   ```

2. Copie `server\.env.example` para `server\.env` e configure o acesso ao MySQL. A API também lê o `.env` da raiz do projeto como alternativa para variáveis compartilhadas, como `JWT_SECRET`. As variáveis definidas no ambiente do processo têm precedência.
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

O morador pode criar relatos com categoria, descrição, foto e local escolhido no mapa; consultar o histórico; acompanhar os relatos no mapa e comentar em cada ocorrência. A prefeitura pode consultar os relatos em lista/mapa, alterar status e gerir categorias.

## Notificações

O serviço Expo Push não exige uma conta paga, mas notificações remotas precisam de um dispositivo físico e de uma build nativa de desenvolvimento ou produção (não funcionam no Expo Go). Crie/vincule o projeto EAS, configure credenciais Android (FCM) no EAS e informe o UUID real do projeto em `EXPO_PUBLIC_EAS_PROJECT_ID` ou em `extra.eas.projectId` no app config. Depois de atualizar dependências nativas ou credenciais, gere e instale uma nova build. Ative as notificações na tela Configuração do morador. O Expo Push é um serviço externo gratuito sem garantia de entrega; a API informa quando o serviço não aceitou uma notificação.

## Publicar na Play Store

Antes de publicar, deixe a API acessível pela internet usando HTTPS e conectada a um MySQL de produção. Configure as variáveis `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` e um `JWT_SECRET` aleatório com pelo menos 32 caracteres no serviço que hospeda a API. Inicie a API com `npm start` dentro de `server` e confirme que `https://SEU-DOMINIO/health` responde `{"status":"ok"}`. Como as fotos são gravadas em `server/uploads`, o armazenamento desse diretório precisa persistir entre reinicializações; use um disco persistente ou adapte a API para armazenamento de objetos antes de produção.

1. Crie uma conta no [Google Play Console](https://play.google.com/console/) e crie o app. O identificador Android configurado é `com.hcodd.minhacidade`; confirme que ele é o identificador desejado e ainda não pertence a outro app, pois não pode ser trocado depois da publicação.
2. Entre no diretório `app_mobile`, faça login no EAS com a conta associada ao projeto e configure a URL pública da API no ambiente de produção:

   ```powershell
   cd app_mobile
   npx eas-cli@latest login
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://SEU-DOMINIO --environment production --visibility plaintext
   ```

   Use a URL raiz da API, sem `/api` no final. `EXPO_PUBLIC_API_URL` fica embutida no app; ela é pública e não deve conter senhas ou outras credenciais. O perfil `production` em `eas.json` usa o ambiente EAS de produção.
3. Gere o Android App Bundle para a Play Store:

   ```powershell
   npx eas-cli@latest build --platform android --profile production
   ```

   Se solicitado, configure a credencial de assinatura Android no EAS e guarde o acesso à conta. Aguarde a build terminar e baixe o arquivo `.aab`.
4. No Play Console, complete a ficha do app e os formulários obrigatórios: política de privacidade pública, segurança dos dados, classificação indicativa, público-alvo, anúncios e instruções de acesso para os revisores. Envie o `.aab` primeiro para **Teste interno** e instale-o por meio do link de teste para validar login, relatos, envio de fotos, mapa e comentários contra a API de produção.
5. Depois dos testes, crie uma versão na faixa **Teste fechado** e convide testadores. Para contas pessoais de desenvolvedor criadas depois de 13 de novembro de 2023, o Google atualmente exige pelo menos 12 testadores inscritos por 14 dias consecutivos antes de permitir solicitar acesso à produção. Confira os requisitos vigentes no [Play Console](https://support.google.com/googleplay/android-developer/answer/14151465?hl=pt-BR).
6. Quando a conta puder publicar em produção, envie o `.aab` para a faixa **Produção**, revise a versão e envie para análise. O primeiro envio também pode ser feito manualmente pelo Play Console. Para envios posteriores pela linha de comando, configure uma chave de conta de serviço do Google Play no EAS seguindo o [guia do EAS Submit](https://docs.expo.dev/submit/android/), e execute:

   ```powershell
   npx eas-cli@latest submit --platform android --profile production
   ```

   O upload não publica instantaneamente: o Google analisa a versão e a disponibiliza conforme a revisão e o rollout escolhidos.

## Produção

`server/uploads` guarda as fotos localmente para desenvolvimento. Em produção, use armazenamento de objetos durável, HTTPS, credenciais MySQL restritas e backup; proteja a API contra abuso e restrinja o CORS aos domínios necessários. A camada de mapa usa tiles públicos do OpenStreetMap, sujeitos à política de uso e atribuição do serviço.
