# 📱 ANUNZA - Sistema de Gestión de Usuarios con Autenticación

Una aplicación completa de gestión de usuarios con autenticación segura usando React + Node.js + Express + MySQL.

## 🎯 Características

✅ **Autenticación segura** con JWT  
✅ **Contraseñas encriptadas** con bcryptjs  
✅ **Registro e inicio de sesión** funcionales  
✅ **Dashboard protegido** con rutas privadas  
✅ **Gestión de perfil** (editar datos)  
✅ **Lista de usuarios** (solo autenticados)  
✅ **API REST completa** con CRUD  
✅ **Base de datos MySQL**  
✅ **Diseño responsive** y moderno  
✅ **Código limpio y comentado**  

---

## 📋 Requisitos Previos

- **Node.js** v14 o superior
- **npm** o **yarn**
- **MySQL** (local o remoto)
- **XAMPP** (si usas Apache + MySQL local)

---

## 🚀 Instalación y Configuración

### 1️⃣ Crear Base de Datos MySQL

**Opción A: Usando phpMyAdmin (XAMPP)**

1. Abre `http://localhost/phpmyadmin`
2. Ve a la pestaña "SQL"
3. Copia y pega el contenido de `backend/db/schema.sql`
4. Haz clic en "Ejecutar"

**Opción B: Usando MySQL Client**

```bash
mysql -u root -p < backend/db/schema.sql
```

O manualmente:

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

### 2️⃣ Configurar Backend (Express + Node.js)

#### Navega a la carpeta backend:

```bash
cd backend
```

#### Instala dependencias:

```bash
npm install
```

#### Configura variables de entorno:

Abre `.env` y ajusta según tu configuración MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=anunza_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

PORT=5000
NODE_ENV=development
```

#### Inicia el servidor:

```bash
npm start
```

O en modo desarrollo (con auto-reload):

```bash
npm run dev
```

✅ Deberías ver: `✓ Conectado a MySQL exitosamente` + `🚀 Servidor ejecutándose en http://localhost:5000`

---

### 3️⃣ Configurar Frontend (React + Vite)

#### En otra terminal, navega a la raíz del proyecto:

```bash
cd .
```

#### Instala dependencias:

```bash
npm install
```

#### Inicia el servidor de desarrollo:

```bash
npm run dev
```

✅ Abrirá automáticamente: `http://localhost:5173`

---

## 📁 Estructura de Carpetas

```
ANUNZA/
├── backend/                    # Servidor Express + Node.js
│   ├── config/
│   │   └── database.js         # Conexión MySQL
│   ├── controllers/
│   │   ├── authController.js   # Login y registro
│   │   └── userController.js   # CRUD de usuarios
│   ├── middleware/
│   │   └── auth.js             # Verificación de JWT
│   ├── models/
│   │   └── User.js             # Modelo de usuario
│   ├── routes/
│   │   ├── authRoutes.js       # Rutas de autenticación
│   │   └── userRoutes.js       # Rutas de usuarios
│   ├── db/
│   │   └── schema.sql          # Script SQL
│   ├── server.js               # Servidor principal
│   ├── package.json
│   └── .env                    # Variables de entorno
│
├── src/                        # Frontend React
│   ├── context/
│   │   └── AuthContext.jsx     # Contexto global de autenticación
│   ├── components/
│   │   ├── PrivateRoute.jsx    # Rutas protegidas
│   │   ├── FormularioLogin.jsx # Formulario de login
│   │   ├── FormularioRegistro.jsx # Formulario de registro
│   │   └── AuthForm.css        # Estilos de formularios
│   ├── pages/
│   │   ├── Home.jsx            # Página de inicio
│   │   ├── Home.css
│   │   ├── Dashboard.jsx       # Dashboard protegido
│   │   └── Dashboard.css
│   ├── App.jsx                 # Componente principal
│   ├── main.jsx                # Punto de entrada
│   ├── index.css               # Estilos globales
│   └── assets/
│
├── package.json                # Dependencias frontend
├── vite.config.js              # Configuración Vite
└── README.md                   # Este archivo
```

---

## 🔗 API Endpoints

### Autenticación

```
POST   /api/auth/register     Registrar nuevo usuario
POST   /api/auth/login        Iniciar sesión
```

### Usuarios (Requieren JWT)

```
GET    /api/users             Obtener todos los usuarios
GET    /api/users/profile     Obtener perfil del usuario autenticado
PUT    /api/users/:id         Actualizar usuario
DELETE /api/users/:id         Eliminar usuario
```

---

## 📝 Ejemplos de Uso de la API

### Registrar usuario

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "telefono": "123456789",
    "password": "password123"
  }'
```

**Respuesta:**

```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "telefono": "123456789"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "password": "password123"
  }'
```

### Obtener usuarios (requiere token)

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🎨 Rutas Frontend

- `/` → Página de inicio
- `/login` → Formulario de inicio de sesión
- `/register` → Formulario de registro
- `/dashboard` → Dashboard (✅ Protegido - requiere autenticación)

---

## 🔐 Seguridad Implementada

✅ **Contraseñas hasheadas** con bcryptjs (salt: 10)  
✅ **Tokens JWT** con expiración de 24 horas  
✅ **Rutas protegidas** con middleware de verificación  
✅ **Validación de emails** con regex  
✅ **Validación de contraseñas** (mínimo 6 caracteres)  
✅ **CORS habilitado** para comunicación frontend-backend  
✅ **Errores descriptivos** sin exponer datos sensibles  

---

## 🛠️ Troubleshooting

### Error: "ECONNREFUSED" en backend

**Problema:** La base de datos no está conectada

**Solución:**
1. Verifica que MySQL está corriendo
2. Revisa las credenciales en `.env`
3. Asegúrate de que la base de datos existe: `CREATE DATABASE anunza_db;`

### Error: "CORS error" en frontend

**Problema:** El backend no permite requests desde el frontend

**Solución:**
- Verifica que `cors()` está en `backend/server.js`
- Asegúrate que el backend está en `http://localhost:5000`

### Error: "Token inválido" en dashboard

**Problema:** El JWT expiró o es inválido

**Solución:**
1. Limpia localStorage: `localStorage.clear()`
2. Vuelve a hacer login
3. Verifica que `JWT_SECRET` es el mismo en `.env`

### Error: "Port 5000 already in use"

**Solución:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9

# O cambia el puerto en .env
PORT=3001
```

---

## 📚 Dependencias Principales

### Backend

- **express** - Framework web
- **mysql2** - Cliente MySQL
- **bcryptjs** - Hashing de contraseñas
- **jsonwebtoken** - JWT tokens
- **cors** - Control de CORS
- **dotenv** - Variables de entorno

### Frontend

- **react** - Librería UI
- **react-dom** - Render de React
- **react-router-dom** - Rutas
- **vite** - Build tool

---

## 🚀 Deployment

### Backend (Heroku / Render)

1. Sube el repositorio a GitHub
2. Conecta tu repositorio a Heroku/Render
3. Agrega variables de entorno en el panel
4. Deploy automático

### Frontend (Vercel / Netlify)

1. Actualiza `API_URL` en `src/context/AuthContext.jsx`
2. Deploy automático desde GitHub

---

## 📞 Soporte

Para reportar bugs o sugerencias, crea un issue en el repositorio.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

**¡Listo! 🎉 Ahora tienes un sistema completo de autenticación y gestión de usuarios.**
