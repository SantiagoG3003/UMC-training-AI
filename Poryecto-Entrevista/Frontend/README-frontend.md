# Frontend — conectar con Firebase y el backend

## 1. Instalar la librería de Firebase

En la carpeta de tu proyecto de React (donde está tu `package.json` actual,
el de Vite):

```bash
npm install firebase
```

## 2. Archivos nuevos que agregué

- `firebaseClient.js` → conexión de Firebase para el navegador (ya tiene
  tu `firebaseConfig` puesto).
- `api.js` → función `apiFetch` para hablar con tu backend.
- `pages/Login.jsx` → ya hace login real: llama a Firebase, obtiene el
  token, y le pregunta al backend quién es (nombre, rol) en
  `/api/auth/session`.
- `App.jsx` → ya no adivina el rol por el correo. Usa el rol real que
  devuelve el backend (`evaluador` o `colaborador`) para decidir a qué
  dashboard mandar a la persona, y cierra sesión de Firebase de verdad
  (`signOut`).

## 3. Para probar el login de punta a punta

1. Prende el backend (`cd backend && npm install && npm run dev`).
2. Crea el primer usuario evaluador a mano en Firebase (Authentication +
   documento en Firestore `users/{uid}` con `role: "evaluador"`) — si aún
   no lo has hecho.
3. Prende el frontend (`npm run dev` en la carpeta de React).
4. Entra con ese correo y contraseña. Debería llevarte al Dashboard del
   evaluador.

## Pendiente

- `Collaborators.jsx` todavía usa datos de ejemplo (no reales de
  Firestore) — cuando quieras seguimos con esa vista para que el
  evaluador pueda crear colaboradores de verdad usando
  `POST /api/auth/register`.
