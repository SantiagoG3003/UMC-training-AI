import { auth } from "../config/firebaseAdmin.js";
import { createUserProfile, getUserProfile } from "./auth.service.js";

// GET /api/auth/session
// El frontend ya inició sesión con Firebase (email/password) y manda su
// ID token. Acá solo confirmamos quién es y le devolvemos su perfil
// (nombre, rol, etc.) para que el frontend sepa a qué dashboard mandarlo.
export async function getSession(req, res, next) {
  try {
    const profile = req.userProfile;
    res.json({
      uid: req.uid,
      email: req.email,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/register
// Crea un usuario nuevo (en Firebase Auth) y su perfil (en Firestore).
// Pensado para que el EVALUADOR cree cuentas de colaboradores desde el
// panel de Colaboradores. No es un registro público.
// Body esperado: { email, password, name, role, position }
export async function register(req, res, next) {
  try {
    const { email, password, name, role, position, competencies } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Faltan datos: email, password, name y role son obligatorios." });
    }
    if (!["evaluador", "colaborador"].includes(role)) {
      return res.status(400).json({ error: "role debe ser 'evaluador' o 'colaborador'." });
    }

    const userRecord = await auth.createUser({ email, password, displayName: name });
    const profile = await createUserProfile(userRecord.uid, { name, role, position, competencies });

    res.status(201).json({ uid: userRecord.uid, profile });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }
    next(error);
  }
}

// GET /api/auth/me
// Igual a session, pero pensado para refrescar el perfil del usuario
// logueado en cualquier momento (por ejemplo al recargar la página).
export async function getMe(req, res, next) {
  try {
    const profile = await getUserProfile(req.uid);
    res.json({ uid: req.uid, email: req.email, profile });
  } catch (error) {
    next(error);
  }
}
