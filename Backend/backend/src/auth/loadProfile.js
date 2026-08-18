import { getUserProfile } from "./auth.service.js";

// Se usa después de verifyToken. Busca el perfil (nombre, rol, cargo)
// en Firestore usando el uid que ya viene en req.uid.
export async function loadProfile(req, res, next) {
  try {
    const profile = await getUserProfile(req.uid);
    if (!profile) {
      return res.status(404).json({
        error: "El usuario existe en Firebase Auth pero no tiene perfil en Firestore.",
      });
    }
    req.userProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
}
