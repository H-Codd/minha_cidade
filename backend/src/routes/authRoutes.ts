import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router: Router = Router();

// Rota para registrar usuário
router.post('/register', register);

// Rota para login
router.post('/login', login);

export default router;
