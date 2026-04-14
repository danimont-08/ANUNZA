-- Script SQL para crear la base de datos y tabla de usuarios
--Anunza_2026
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS anunza_db;

-- Usar la base de datos
USE anunza_db;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas más rápidas por correo
CREATE INDEX idx_correo ON usuarios(correo);

-- Insertar datos de prueba (opcional)
-- INSERT INTO usuarios (nombre, correo, telefono, password) VALUES 
-- ('Juan Pérez', 'juan@example.com', '123456789', 'hashed_password'),
-- ('María García', 'maria@example.com', '987654321', 'hashed_password');
