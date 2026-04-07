# 🔐 Documentación Técnica - ANUNZA

## 📖 Índice

1. [AuthContext](#authcontext)
2. [API Endpoints](#api-endpoints)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Seguridad](#seguridad)
5. [Extensiones Futuras](#extensiones-futuras)

---

## AuthContext

### Ubicación
`src/context/AuthContext.jsx`

### Funcionalidad

El `AuthContext` es un contexto global de React que maneja:

- **Estado del usuario** actual
- **Token JWT** de autenticación
- **Funciones** de login, logout, registro
- **Persistencia** en localStorage

### Hook useAuth

```javascript
const { user, token, login, logout, register, isAuthenticated } = useAuth();
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `user` | Object | Datos del usuario logueado |
| `token` | String | JWT token |
| `loading` | Boolean | Indica si está cargando |
| `error` | String | Último error |
| `isAuthenticated` | Boolean | Si hay usuario logueado |

### Métodos

```javascript
// Login
await login(correo, password)
// Retorna: { message, user, token }

// Registro
await register(nombre, correo, telefono, password)
// Retorna: { message, user, token }

// Logout
logout()
// Limpia estado y localStorage

// Actualizar perfil
await updateProfile(id, nombre, correo, telefono)
// Retorna: { message, user }
```

---

## API Endpoints

### Autenticación

#### POST `/api/auth/register`

**Descripción:** Registrar nuevo usuario

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "telefono": "123456789",
  "password": "password123"
}
```

**Respuesta (201):**
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

**Errores:**
- 400: Campos requeridos | Correo inválido | Contraseña muy corta | Correo ya registrado
- 500: Error del servidor

---

#### POST `/api/auth/login`

**Descripción:** Iniciar sesión

**Body:**
```json
{
  "correo": "juan@example.com",
  "password": "password123"
}
```

**Respuesta (200):**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "telefono": "123456789"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- 400: Correo y contraseña requeridos
- 401: Credenciales incorrectas
- 500: Error del servidor

---

### Usuarios (Requieren JWT)

#### GET `/api/users`

**Descripción:** Obtener lista de todos los usuarios

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "message": "Usuarios obtenidos exitosamente",
  "users": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "correo": "juan@example.com",
      "telefono": "123456789",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### GET `/api/users/profile`

**Descripción:** Obtener perfil del usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "message": "Perfil obtenido exitosamente",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "telefono": "123456789",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### PUT `/api/users/:id`

**Descripción:** Actualizar datos del usuario

**Parámetros:**
- `id`: ID del usuario a actualizar

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "correo": "juan.nuevo@example.com",
  "telefono": "987654321"
}
```

**Respuesta (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": { ... }
}
```

**Errores:**
- 400: Validaciones
- 403: No tienes permisos
- 404: Usuario no encontrado

---

#### DELETE `/api/users/:id`

**Descripción:** Eliminar usuario

**Parámetros:**
- `id`: ID del usuario a eliminar

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

---

## Flujo de Autenticación

### 1. Registro

```
Usuario ingresa datos
         ↓
Validación frontend (email, contraseña)
         ↓
POST /api/auth/register
         ↓
Backend valida
         ↓
Hash de contraseña con bcrypt
         ↓
Inserta en BD
         ↓
Genera JWT
         ↓
Devuelve JWT + usuario
         ↓
Frontend guarda en localStorage
         ↓
Redirige a dashboard
```

### 2. Login

```
Usuario ingresa correo + password
         ↓
POST /api/auth/login
         ↓
Backend busca usuario por correo
         ↓
Compara hash de password
         ↓
Si correcto: genera JWT
         ↓
Devuelve JWT + usuario
         ↓
Frontend guarda en localStorage
         ↓
Redirige a dashboard
```

### 3. Acceso a Ruta Protegida

```
Usuario accede a /dashboard
         ↓
PrivateRoute verifica isAuthenticated
         ↓
Si no autenticado: redirige a /login
         ↓
Si autenticado: renderiza Dashboard
         ↓
Dashboard obtiene usuarios con GET /api/users + JWT
         ↓
Middleware verifyToken valida JWT
         ↓
Si válido: devuelve datos
         ↓
Si inválido: error 401
```

---

## Seguridad

### Hashing de Contraseñas

```javascript
// backend/controllers/authController.js
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);
```

- **Algoritmo:** bcryptjs
- **Salt Rounds:** 10 (más alto = más seguro pero más lento)
- **Tiempo:** ~500ms por hash

### JWT

```javascript
const token = jwt.sign(
  { id: user.id, email: user.correo },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

- **Algoritmo:** HS256 (HMAC SHA-256)
- **Duración:** 24 horas
- **Secret:** Debe ser único y fuerte

### Middleware de Autenticación

```javascript
// backend/middleware/auth.js
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Validaciones

```javascript
// Email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contraseña
if (password.length < 6) throw new Error('Mínimo 6 caracteres');

// Base de datos
- Correo UNIQUE (no duplicados)
- Password VARCHAR(255) (para hash de bcrypt)
- Índice en correo (búsquedas rápidas)
```

---

## Extensiones Futuras

### 1. Recuperación de Contraseña

```
POST /api/auth/forgot-password
- Envia email con link
- Link con token temporal

POST /api/auth/reset-password
- Valida token
- Actualiza contraseña
```

### 2. Confirmación de Email

```
POST /api/auth/register
- Envia email de confirmación
- Usuario confirma email
- Activa cuenta
```

### 3. Autenticación Social

```
POST /api/auth/google
POST /api/auth/facebook
- OAuth 2.0
- Crea usuario automáticamente
```

### 4. Roles y Permisos

```
usuarios tabla con:
- role (admin, user, moderator)
- permissions (array)

Middleware:
- verifyRole(role)
- verifyPermission(permission)
```

### 5. Logs de Actividad

```
sesiones tabla:
- user_id
- ip_address
- user_agent
- created_at
- expires_at

POST /api/sessions
GET /api/sessions
```

### 6. Autenticación Multifactor (MFA)

```
- TOTP (Time-based One-Time Password)
- SMS code
- Email code

POST /api/auth/mfa/setup
POST /api/auth/mfa/verify
```

### 7. Rate Limiting

```
npm install express-rate-limit

- Login attempts limitados
- API calls limitadas por IP
- Previene ataques de fuerza bruta
```

---

## Archivos Principales

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `backend/server.js` | 50 | Servidor principal |
| `backend/config/database.js` | 20 | Conexión MySQL |
| `backend/middleware/auth.js` | 25 | Verificación JWT |
| `backend/models/User.js` | 60 | Modelo de usuario |
| `backend/controllers/authController.js` | 100 | Lógica de auth |
| `backend/controllers/userController.js` | 80 | CRUD de usuarios |
| `src/context/AuthContext.jsx` | 130 | Contexto global |
| `src/pages/Dashboard.jsx` | 150 | Dashboard |
| `src/components/FormularioLogin.jsx` | 80 | Formulario login |
| `src/components/FormularioRegistro.jsx` | 100 | Formulario registro |

---

**Total de código:** ~1,000 líneas (backend + frontend)  
**Componentes React:** 6  
**Endpoints API:** 7  
**Tablas MySQL:** 1  

---

## 📞 Soporte

Contacta al equipo de desarrollo para:
- Bugs
- Features requests
- Consultas técnicas
