const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Permite peticiones desde tu frontend (Vite en 5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Endpoint que tu frontend está pidiendo (por eso el error 4000/api/auth/session)
app.get('/api/auth/session', (req, res) => {
  // TODO: reemplaza esto por tu lógica real de sesión (JWT, cookie, Firebase Auth, etc.)
  res.json({ user: null, authenticated: false });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // TODO: validar contra Firestore / Firebase Auth
  res.json({ ok: true, message: 'Login endpoint pendiente de implementar' });
});

// Esto es lo que mantiene vivo el proceso — sin esto, "clean exit" inmediato
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});