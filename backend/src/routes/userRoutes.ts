import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';

const router: Router = Router();

// Rota para listar todos os usuários
router.get('/users', getAllUsers);

// Rota para buscar usuário por ID
router.get('/users/:id', getUserById);

// Rota para atualizar usuário
router.put('/users/:id', updateUser);

// Rota para deletar usuário
router.delete('/users/:id', deleteUser);

export default router;
