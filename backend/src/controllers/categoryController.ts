import { Request, Response } from 'express';
import db from '../config/db';
import { Category } from '../models/Category';

// Listar todas as categorias
export const getAllCategories = (req: Request, res: Response): void => {
  db.all('SELECT * FROM categories', [], (err, rows: Category[]) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar categorias', details: err.message });
    } else {
      res.json(rows);
    }
  });
};

// Criar nova categoria
export const createCategory = (req: Request, res: Response): void => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    return;
  }

  db.run('INSERT INTO categories (name) VALUES (?)', [name], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao criar categoria', details: err.message });
    } else {
      res.status(201).json({ message: 'Categoria criada com sucesso', categoryId: this.lastID });
    }
  });
};

// Atualizar categoria
export const updateCategory = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name } = req.body;

  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao atualizar categoria', details: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Categoria não encontrada' });
    } else {
      res.json({ message: 'Categoria atualizada com sucesso' });
    }
  });
};

// Deletar categoria
export const deleteCategory = (req: Request, res: Response): void => {
  const { id } = req.params;

  db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao deletar categoria', details: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Categoria não encontrada' });
    } else {
      res.json({ message: 'Categoria deletada com sucesso' });
    }
  });
};
