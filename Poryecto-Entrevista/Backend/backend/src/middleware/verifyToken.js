// El frontend inicia sesión directo con Firebase (Firebase Authentication)
// y recibe un "ID token". Ese token se manda al backend en cada pedido,
// en el header Authorization: Bearer <token>.
//
// Este middleware revisa que el token sea válido y saca el uid del usuario.
// Si el token no existe o no es válido, corta el pedido con un error 401.

import { auth } from "../config/firebaseAdmin.js";

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No se envió el token de sesión." });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o vencido." });
  }
}
