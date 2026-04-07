#  Guía Rápida de Inicio

### 1. Base de Datos MySQL

```sql
CREATE DATABASE IF NOT EXISTS anunza_db;
USE anunza_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_correo ON usuarios(correo);
```

### 2. Terminal 1 - Backend

```bash
cd backend
npm install
npm start
```

✅ Espera: `🚀 Servidor ejecutándose en http://localhost:5000`

### 3. Terminal 2 - Frontend

```bash
npm install
npm run dev
```

✅ Se abrirá: `http://localhost:5173`

---

## 🧪 Prueba Rápida

1. Ve a `http://localhost:5173/register`
2. Crea una cuenta con:
   - Nombre: `Juan Pérez`
   - Correo: `juan@test.com`
   - Teléfono: `123456789`
   - Contraseña: `123456`
3. Verás un token JWT generado
4. Se redirigirá automáticamente a `/dashboard`
5. En el dashboard verás:
   - Tu perfil
   - Lista de todos los usuarios
   - Opción de editar tu perfil

---

## 📱 URLs

| URL | Descripción |
|-----|-------------|
| `http://localhost:5173/` | Inicio |
| `http://localhost:5173/register` | Registro |
| `http://localhost:5173/login` | Login |
| `http://localhost:5173/dashboard` | Dashboard (solo autenticado) |
| `http://localhost:5000/api/health` | Estado del servidor |

---

## 🧬 Estructura de Datos

### Tabla `usuarios`

```sql
+----------+-------------+------+-----+-------------------+
| Field    | Type        | Null | Key | Default           |
+----------+-------------+------+-----+-------------------+
| id       | INT         | NO   | PRI | auto_increment    |
| nombre   | VARCHAR(100)| NO   |     | NULL              |
| correo   | VARCHAR(100)| NO   | UNI | NULL              |
| telefono | VARCHAR(20) | NO   |     | NULL              |
| password | VARCHAR(255)| NO   |     | NULL              |
| created  | TIMESTAMP   | NO   |     | CURRENT_TIMESTAMP |
+----------+-------------+------+-----+-------------------+
```

---

## 💡 Tips

- **JWT Token**: Se guarda en `localStorage` con clave `token`
- **Usuario**: Se guarda en `localStorage` con clave `user`
- **Token expira**: En 24 horas (configurable en `backend/controllers/authController.js`)
- **Contraseña**: Nunca se devuelve en las respuestas de API
- **Permisos**: Solo puedes editar/eliminar tu propio usuario

---

## 🐛 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `ECONNREFUSED` | MySQL no está corriendo | Inicia MySQL/XAMPP |
| `CORS error` | Backend no permite requests | Verifica CORS en Express |
| `Token inválido` | Token expirado | Limpia localStorage y vuelve a login |
| `Port 3000 in use` | Puerto ocupado | Cambia `PORT` en `.env` |

---

## 🎓 Arquitectura

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - AuthContext (estado global)          │
│  - PrivateRoute (protección)            │
│  - Componentes (Login, Registro, etc)   │
└────────┬────────────────────────────────┘
         │ HTTP/JSON
         ↓
┌─────────────────────────────────────────┐
│    Backend (Express + Node.js)          │
│  - Controllers (lógica de negocio)      │
│  - Routes (endpoints)                   │
│  - Middleware (autenticación JWT)       │
│  - Models (interacción con BD)          │
└────────┬────────────────────────────────┘
         │ SQL
         ↓
┌─────────────────────────────────────────┐
│      MySQL Database (usuarios)          │
└─────────────────────────────────────────┘
```

---
