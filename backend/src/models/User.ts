export interface User {
  id?: number;              // opcional porque é autoincremento
  name: string;             // nome do usuário
  email: string;            // email único
  password: string;         // senha criptografada
  role?: 'user' | 'admin';  // papel do usuário, padrão 'user'
}
