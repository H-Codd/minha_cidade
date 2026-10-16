const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const requiredEnvironment = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE', 'JWT_SECRET'];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length) {
  const databaseVariables = missingEnvironment.filter((key) => key.startsWith('MYSQL_'));
  const message = databaseVariables.length
    ? `Configure o MySQL em app_mobile/server/.env (use .env.example como modelo): ${databaseVariables.join(', ')}.`
    : `Configure as variáveis obrigatórias no .env: ${missingEnvironment.join(', ')}.`;
  throw new Error(message);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
}

const port = Number(process.env.PORT || 3000);
const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use('/uploads', express.static(uploadDirectory, { fallthrough: false, maxAge: '1d' }));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
      callback(null, `${crypto.randomUUID()}${extensions[file.mimetype] || ''}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new Error('Envie uma foto nos formatos JPEG, PNG ou WebP.'));
      return;
    }
    callback(null, true);
  },
});

function responderErro(response, status, message) {
  return response.status(status).json({ message });
}

function autenticar(request, response, next) {
  const authorization = request.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return responderErro(response, 401, 'Faça login para continuar.');

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return responderErro(response, 401, 'Sessão inválida ou expirada. Entre novamente.');
  }
}

function exigirAdmin(request, response, next) {
  if (request.user.role !== 'admin') return responderErro(response, 403, 'Acesso restrito à prefeitura.');
  return next();
}

function validarEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validarCoordenada(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function criarToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function respostaSessao(user) {
  return {
    token: criarToken(user),
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
  };
}

const selecionarProblemas = `
  SELECT p.id, p.descricao, p.foto, p.latitude, p.longitude, p.status, p.data,
         c.nome AS categoria, u.nome AS nome_usuario
  FROM problemas p
  INNER JOIN categorias c ON c.id = p.id_categoria
  INNER JOIN usuarios u ON u.id = p.id_usuario
`;

app.get('/health', async (_request, response) => {
  await pool.query('SELECT 1');
  response.json({ status: 'ok' });
});

app.post('/auth/register', async (request, response) => {
  const { nome, email, password } = request.body || {};
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100) {
    return responderErro(response, 400, 'Informe um nome entre 2 e 100 caracteres.');
  }
  if (!validarEmail(email)) return responderErro(response, 400, 'Informe um e-mail válido.');
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return responderErro(response, 400, 'A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), passwordHash],
    );
    return response.status(201).json(respostaSessao({
      id: result.insertId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
    }));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return responderErro(response, 409, 'Este e-mail já está cadastrado.');
    throw error;
  }
});

app.post('/auth/login', async (request, response) => {
  const { email, password } = request.body || {};
  if (!validarEmail(email) || typeof password !== 'string') {
    return responderErro(response, 400, 'Informe um e-mail e senha válidos.');
  }
  const [rows] = await pool.execute(
    'SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = ? LIMIT 1',
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.senha_hash))) {
    return responderErro(response, 401, 'E-mail ou senha incorretos.');
  }
  return response.json(respostaSessao(user));
});

app.get('/auth/me', autenticar, async (request, response) => {
  const [rows] = await pool.execute(
    'SELECT id, nome, email, role FROM usuarios WHERE id = ? LIMIT 1',
    [request.user.sub],
  );
  if (!rows[0]) return responderErro(response, 404, 'Usuário não encontrado.');
  return response.json(rows[0]);
});

app.put('/users/push-token', autenticar, async (request, response) => {
  const { token } = request.body || {};
  if (token !== null && (typeof token !== 'string' || token.length > 255 ||
      !/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token))) {
    return responderErro(response, 400, 'Token de notificação inválido.');
  }
  await pool.execute('UPDATE usuarios SET push_token = ? WHERE id = ?', [token, request.user.sub]);
  return response.json({ saved: true });
});

app.put('/users/profile', autenticar, async (request, response) => {
  const { name, email, password, currentPassword } = request.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return responderErro(response, 400, 'Informe um nome entre 2 e 100 caracteres.');
  }
  if (!validarEmail(email)) return responderErro(response, 400, 'Informe um e-mail válido.');

  const [rows] = await pool.execute(
    'SELECT id, nome, email, senha_hash, role FROM usuarios WHERE id = ? LIMIT 1',
    [request.user.sub],
  );
  const user = rows[0];
  if (!user) return responderErro(response, 404, 'Usuário não encontrado.');

  let passwordHash = user.senha_hash;
  if (password) {
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return responderErro(response, 400, 'A nova senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
    }
    if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.senha_hash))) {
      return responderErro(response, 400, 'A senha atual está incorreta.');
    }
    passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    await pool.execute(
      'UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?',
      [name.trim(), email.trim().toLowerCase(), passwordHash, request.user.sub],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return responderErro(response, 409, 'Este e-mail já está em uso.');
    throw error;
  }
  return response.json({ id: user.id, nome: name.trim(), email: email.trim().toLowerCase(), role: user.role });
});

app.put('/users/password', autenticar, exigirAdmin, async (request, response) => {
  const { currentPassword, newPassword } = request.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
      newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    return responderErro(response, 400, 'A nova senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
  }
  const [rows] = await pool.execute('SELECT senha_hash FROM usuarios WHERE id = ? LIMIT 1', [request.user.sub]);
  if (!rows[0]) return responderErro(response, 404, 'Usuário não encontrado.');
  if (!(await bcrypt.compare(currentPassword, rows[0].senha_hash))) {
    return responderErro(response, 400, 'A senha atual está incorreta.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [passwordHash, request.user.sub]);
  return response.json({ updated: true });
});

app.get('/categories', async (_request, response) => {
  const [rows] = await pool.execute('SELECT id, nome FROM categorias ORDER BY nome');
  return response.json(rows);
});

app.post('/categories', autenticar, exigirAdmin, async (request, response) => {
  const { nome } = request.body || {};
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 80) {
    return responderErro(response, 400, 'Informe um nome de categoria entre 2 e 80 caracteres.');
  }
  try {
    const [result] = await pool.execute('INSERT INTO categorias (nome) VALUES (?)', [nome.trim()]);
    return response.status(201).json({ id: result.insertId, nome: nome.trim() });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return responderErro(response, 409, 'Esta categoria já existe.');
    throw error;
  }
});

app.delete('/categories/:id', autenticar, exigirAdmin, async (request, response) => {
  try {
    const [result] = await pool.execute('DELETE FROM categorias WHERE id = ?', [request.params.id]);
    if (!result.affectedRows) return responderErro(response, 404, 'Categoria não encontrada.');
    return response.status(204).end();
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return responderErro(response, 409, 'Não é possível remover uma categoria usada por relatos existentes.');
    }
    throw error;
  }
});

app.get('/problems', async (_request, response) => {
  const [rows] = await pool.execute(`${selecionarProblemas} ORDER BY p.data DESC`);
  return response.json(rows);
});

app.get('/problems/me', autenticar, async (request, response) => {
  const [rows] = await pool.execute(
    `${selecionarProblemas} WHERE p.id_usuario = ? ORDER BY p.data DESC`,
    [request.user.sub],
  );
  return response.json(rows);
});

app.get('/problems/:id/comments', async (request, response) => {
  const [problems] = await pool.execute('SELECT id FROM problemas WHERE id = ? LIMIT 1', [request.params.id]);
  if (!problems[0]) return responderErro(response, 404, 'Problema não encontrado.');
  const [rows] = await pool.execute(
    `SELECT c.id, c.comentario, c.data, u.nome AS nome_usuario
     FROM comentarios c INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.problema_id = ? ORDER BY c.data ASC`,
    [request.params.id],
  );
  return response.json(rows);
});

app.post('/problems/:id/comments', autenticar, async (request, response) => {
  const { comentario } = request.body || {};
  if (typeof comentario !== 'string' || comentario.trim().length < 2 || comentario.trim().length > 500) {
    return responderErro(response, 400, 'O comentário deve ter entre 2 e 500 caracteres.');
  }
  const [problems] = await pool.execute('SELECT id FROM problemas WHERE id = ? LIMIT 1', [request.params.id]);
  if (!problems[0]) return responderErro(response, 404, 'Problema não encontrado.');
  const [result] = await pool.execute(
    'INSERT INTO comentarios (problema_id, usuario_id, comentario) VALUES (?, ?, ?)',
    [request.params.id, request.user.sub, comentario.trim()],
  );
  const [rows] = await pool.execute(
    `SELECT c.id, c.comentario, c.data, u.nome AS nome_usuario
     FROM comentarios c INNER JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = ?`,
    [result.insertId],
  );
  return response.status(201).json(rows[0]);
});

app.get('/problems/:id', async (request, response) => {
  const [rows] = await pool.execute(`${selecionarProblemas} WHERE p.id = ? LIMIT 1`, [request.params.id]);
  if (!rows[0]) return responderErro(response, 404, 'Problema não encontrado.');
  return response.json(rows[0]);
});

app.post('/problems', autenticar, upload.single('foto'), async (request, response) => {
  const description = request.body?.description;
  const categoryId = Number(request.body?.category_id);
  const latitude = validarCoordenada(request.body?.latitude, -90, 90);
  const longitude = validarCoordenada(request.body?.longitude, -180, 180);
  const photo = request.file;

  if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000 ||
      !Number.isSafeInteger(categoryId) || categoryId < 1 || latitude === null || longitude === null || !photo) {
    if (photo) await fs.promises.unlink(photo.path);
    return responderErro(response, 400, 'Envie categoria, descrição (10 a 1000 caracteres), foto e localização válidas.');
  }

  let connection;
  let savedProblem;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [categories] = await connection.execute('SELECT id FROM categorias WHERE id = ? LIMIT 1', [categoryId]);
    if (!categories[0]) {
      await connection.rollback();
      await fs.promises.unlink(photo.path);
      return responderErro(response, 400, 'A categoria selecionada não existe.');
    }
    const photoPath = `/uploads/${photo.filename}`;
    const [result] = await connection.execute(
      `INSERT INTO problemas (descricao, foto, latitude, longitude, id_usuario, id_categoria)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [description.trim(), photoPath, latitude, longitude, request.user.sub, categoryId],
    );
    const [rows] = await connection.execute(`${selecionarProblemas} WHERE p.id = ? LIMIT 1`, [result.insertId]);
    if (!rows[0]) throw new Error('O relato foi inserido, mas não pôde ser confirmado no banco de dados.');
    savedProblem = rows[0];
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback();
    await fs.promises.unlink(photo.path);
    throw error;
  } finally {
    connection?.release();
  }
  return response.status(201).json(savedProblem);
});

async function enviarNotificacao(token, problemId, status) {
  try {
    const result = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: 'Atualização do seu relato',
        body: `O status do problema #${problemId} foi alterado para: ${status}.`,
        data: { problemId, status },
        sound: 'default',
        channelId: 'default',
      }),
    });
    const payload = await result.json();
    const ticket = payload?.data;
    if (!result.ok || ticket?.status !== 'ok') {
      const message = ticket?.message || payload?.errors?.[0]?.message || `Expo Push respondeu HTTP ${result.status}.`;
      console.error('Expo Push não aceitou a notificação:', message);
      return { sent: false, error: message };
    }
    return { sent: true };
  } catch (error) {
    console.error('Falha ao enviar notificação pelo Expo Push:', error);
    return { sent: false, error: 'Falha de comunicação com o serviço de notificações.' };
  }
}

app.put('/problems/:id/status', autenticar, exigirAdmin, async (request, response) => {
  const { status } = request.body || {};
  if (!['Aberto', 'Em análise', 'Resolvido'].includes(status)) {
    return responderErro(response, 400, 'Status inválido.');
  }
  const [rows] = await pool.execute(
    `SELECT p.id, p.status, u.push_token FROM problemas p
     INNER JOIN usuarios u ON u.id = p.id_usuario WHERE p.id = ? LIMIT 1`,
    [request.params.id],
  );
  const problem = rows[0];
  if (!problem) return responderErro(response, 404, 'Problema não encontrado.');
  if (problem.status === status) {
    return response.json({ status, notificationSent: false, statusUnchanged: true });
  }

  await pool.execute('UPDATE problemas SET status = ? WHERE id = ?', [status, problem.id]);
  if (!problem.push_token) return response.json({ status, notificationSent: false });
  const notification = await enviarNotificacao(problem.push_token, problem.id, status);
  return response.json({
    status,
    notificationSent: notification.sent,
    ...(notification.error ? { notificationError: notification.error } : {}),
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return responderErro(response, status, error.code === 'LIMIT_FILE_SIZE'
      ? 'A foto deve ter no máximo 5 MB.'
      : 'Não foi possível receber o arquivo enviado.');
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    return responderErro(response, 400, 'O corpo JSON da requisição está malformado.');
  }
  if (error.message?.startsWith('Envie uma foto')) return responderErro(response, 400, error.message);
  console.error('Erro inesperado na API:', error);
  return responderErro(response, 500, 'Erro interno. Tente novamente mais tarde.');
});

async function iniciarServidor() {
  await pool.query('SELECT 1');
  app.listen(port, '0.0.0.0', () => {
    console.log(`API Minha Cidade disponível na porta ${port}.`);
  });
}

iniciarServidor().catch((error) => {
  console.error('Não foi possível iniciar a API. Verifique a conexão com o MySQL e o arquivo .env.', error);
  process.exitCode = 1;
});
