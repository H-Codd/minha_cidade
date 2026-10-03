CREATE DATABASE IF NOT EXISTS minha_cidade
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE minha_cidade;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  push_token VARCHAR(255) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problemas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  descricao VARCHAR(1000) NOT NULL,
  foto VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  status ENUM('Aberto', 'Em análise', 'Resolvido') NOT NULL DEFAULT 'Aberto',
  data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_categoria BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY ix_problemas_data (data),
  KEY ix_problemas_usuario (id_usuario),
  KEY ix_problemas_categoria (id_categoria),
  CONSTRAINT fk_problemas_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_problemas_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias (id) ON DELETE RESTRICT,
  CONSTRAINT chk_problemas_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_problemas_longitude CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comentarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problema_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  comentario VARCHAR(500) NOT NULL,
  data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_comentarios_problema_data (problema_id, data),
  CONSTRAINT fk_comentarios_problema FOREIGN KEY (problema_id)
    REFERENCES problemas (id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO categorias (nome) VALUES
  ('Buraco'),
  ('Iluminação'),
  ('Lixo'),
  ('Vazamento');
