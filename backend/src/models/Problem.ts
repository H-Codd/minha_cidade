export interface Problem {
  id?: number;            // opcional porque é autoincremento
  description: string;    // descrição do problema
  photo?: string;         // caminho ou URL da foto (opcional)
  latitude?: number;      // coordenada geográfica (opcional)
  longitude?: number;     // coordenada geográfica (opcional)
  status?: 'Aberto' | 'Em andamento' | 'Resolvido'; // status do problema
  user_id: number;        // referência ao usuário que criou
  category_id: number;    // referência à categoria
  created_at?: string;    // data/hora de criação (SQLite gera automaticamente)
}
