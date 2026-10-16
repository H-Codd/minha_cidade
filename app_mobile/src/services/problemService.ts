import api from './api';

export interface Problema {
  id: number;
  descricao: string;
  foto: string | null;
  latitude: number;
  longitude: number;
  status: 'Aberto' | 'Em análise' | 'Resolvido';
  data: string;
  categoria: string;
  nome_usuario?: string;
}

export interface Categoria {
  id: number;
  nome: string;
}

export async function buscarProblemas() {
  const { data } = await api.get<Problema[]>('/problems');
  return data;
}

export async function buscarCategorias() {
  const { data } = await api.get<Categoria[]>('/categories');
  return data;
}

export async function enviarOcorrencia(
  description: string,
  categoryId: number,
  photoUri: string,
  latitude: number,
  longitude: number,
) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Selecione um local válido no mapa antes de enviar o relato.');
  }

  const form = new FormData();
  form.append('description', description.trim());
  form.append('category_id', String(categoryId));
  form.append('latitude', String(latitude));
  form.append('longitude', String(longitude));

  const extension = photoUri.split('.').pop()?.split('?')[0] || 'jpg';
  form.append('foto', {
    uri: photoUri,
    name: `problema.${extension}`,
    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  } as unknown as Blob);

  const { data } = await api.post<Problema>('/problems', form);
  return data;
}
