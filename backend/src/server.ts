import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

// Rotas
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import problemRoutes from './routes/problemRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Controllers
import { getMyProblems } from './controllers/problemController';

// Middleware de autenticação
import { authenticateToken } from './middleware/authMiddleware';

const app: Application = express();
const PORT = 3000;

// Middlewares globais
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Arquivos enviados (fotos dos problemas)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);

// Rota inicial (teste rápido)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Minha Cidade funcionando ' });
});

// Rotas públicas
app.use('/auth', authRoutes);

// Rotas protegidas
app.use('/users', authenticateToken, userRoutes);
app.use('/categories', authenticateToken, categoryRoutes);

// Rotas de problemas urbanos
app.use('/issues', problemRoutes);
app.use('/notifications', notificationRoutes);

// Problemas do usuário logado
app.get(
  '/users/me/issues',
  authenticateToken,
  getMyProblems
);

// Tratamento de rota inexistente
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});