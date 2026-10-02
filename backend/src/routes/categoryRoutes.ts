import { Router } from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';

const router: Router = Router();

// Rota para listar todas as categorias
router.get('/', getAllCategories);

// Rota para criar nova categoria
router.post('/', createCategory);

// Rota para atualizar categoria
router.put('/:id', updateCategory);

// Rota para deletar categoria
router.delete('/:id', deleteCategory);

export default router;
