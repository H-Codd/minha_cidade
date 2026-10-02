import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { User } from '../models/User';

// Segredo para assinar o token JWT
const JWT_SECRET = 'segredo_super_secreto'; // ideal usar variável de ambiente

// Registro de usuário
export const register = (req: Request, res: Response): void => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
  db.run(query, [name, email, hashedPassword], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao registrar usuário', details: err.message });
    } else {
      res.status(201).json({ message: 'Usuário registrado com sucesso', userId: this.lastID });
    }
  });
};

// Login de usuário
export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, row: User | undefined) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar usuário', details: err.message });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(password, row.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Senha inválida' });
      return;
    }

    const token = jwt.sign({ id: row.id, email: row.email, role: row.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ message: 'Login realizado com sucesso', token });
  });
};
