# Backend — UMC Training AI

## Cómo funciona el login (con Firebase)

Firebase separa dos cosas y nosotros hacemos lo mismo:

1. **El login (email + contraseña) lo hace el FRONTEND directo con Firebase**,
   usando el SDK de Firebase para clientes (`firebase/auth`). Firebase le
   devuelve al frontend un "ID token".
2. **El backend nunca ve la contraseña.** Solo recibe ese ID token (en el
   header `Authorization: Bearer <token>`) y lo valida con Firebase Admin.
   Si es válido, sabe quién es el usuario (uid) y puede buscar su perfil
   (nombre, rol: evaluador/colaborador) en Firestore.

Flujo completo:

```
Login.jsx (frontend)
  → signInWithEmailAndPassword(auth, email, password)   [Firebase Auth]
  → obtiene el ID token
  → GET /api/auth/session  con  Authorization: Bearer <token>
  → backend valida el token y responde { uid, email, profile: { role, name, ... } }
  → frontend decide a qué dashboard mandar según profile.role
```

## Estructura

```
backend/
  src/
    config/firebaseAdmin.js     Conexión a Firebase (Auth + Firestore)
    middleware/verifyToken.js   Revisa el token en cada pedido
    middleware/requireRole.js   Bloquea rutas según el rol
    auth/                       Sesión, perfil y registro de usuarios
    dashboard/                  Datos de los dashboards (evaluador/colaborador)
    colaboradores/              Gestión de colaboradores (solo evaluador)
    evaluaciones/                Evaluaciones (todas / solo las propias)
    app.js                      Junta todas las rutas
    server.js                   Arranca el servidor
```

Las carpetas `dashboard`, `colaboradores` y `evaluaciones` por ahora solo
tienen rutas de ejemplo (`TODO`) — las vamos llenando con datos reales de
Firestore a medida que avancemos vista por vista.

## Para arrancar

```bash
cd backend
npm install
cp .env.example .env   # y completa los 3 valores de Firebase
npm run dev
```

## Estructura de datos en Firestore que vamos a necesitar

Colección `users/{uid}`:
```json
{
  "name": "María Gómez López",
  "role": "colaborador",
  "position": "Frontend Developer",
  "initials": "MG"
}
```

Más adelante (cuando conectemos Evaluaciones): colección `evaluations`
con al menos `userId`, `competency`, `date`, `score`, `answers`, etc.
