import { Request, Response } from 'express';
import db from '../config/db';
import { User } from '../models/User';

// Listar todos os usuários
export const getAllUsers = (req: Request, res: Response): void => {
  db.all('SELECT id, name, email, role FROM users', [], (err, rows: User[]) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar usuários', details: err.message });
    } else {
      res.json(rows);
    }
  });
};

// Buscar usuário por ID
export const getUserById = (req: Request, res: Response): void => {
  const { id } = req.params;

  db.get('SELECT id, name, email, role FROM users WHERE id = ?', [id], (err, row: User | undefined) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar usuário', details: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Usuário não encontrado' });
    } else {
      res.json(row);
    }
  });
};

// Atualizar usuário
export const updateUser = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [name, email, role, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Erro ao atualizar usuário', details: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Usuário não encontrado' });
      } else {
        res.json({ message: 'Usuário atualizado com sucesso' });
      }
    }
  );
};

// Deletar usuário
export const deleteUser = (req: Request, res: Response): void => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao deletar usuário', details: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
    } else {
      res.json({ message: 'Usuário deletado com sucesso' });
    }
  });
};
