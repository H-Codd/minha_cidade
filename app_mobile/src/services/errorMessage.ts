import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: unknown }>(error)) return fallback;

  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  return fallback;
}
