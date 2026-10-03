import { Stack } from 'expo-router';
import Head from 'expo-router/head';

export default function RootLayout() {
  return (
    <>
      {/* Configuração de metadados e título da aba do navegador web */}
      <Head>
        <title>Minha Cidade</title>
        <meta name="description" content="Sistema de Relato Cidadão e Gestão Urbana" />
      </Head>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="(morador)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}