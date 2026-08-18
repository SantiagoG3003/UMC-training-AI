import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadProfile } from "./loadProfile.js";
import { getSession, register, getMe } from "./auth.controller.js";

const router = Router();

// El login en sí (email + password) NO pasa por el backend: el frontend
// llama directo a Firebase Auth con el SDK del cliente. El backend solo
// entra en juego DESPUÉS, para confirmar la sesión y saber el rol.
router.get("/session", verifyToken, loadProfile, getSession);
router.get("/me", verifyToken, getMe);
// Solo un evaluador ya logueado puede crear cuentas nuevas (de
// colaboradores u otros evaluadores). Sin requireRole acá, cualquier
// colaborador logueado podría crearse a sí mismo como evaluador.
router.post("/register", verifyToken, loadProfile, requireRole("evaluador"), register);

export default router;