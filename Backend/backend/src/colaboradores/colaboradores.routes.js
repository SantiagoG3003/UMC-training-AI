import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { loadProfile } from "../auth/loadProfile.js";
import { requireRole } from "../middleware/requireRole.js";
import { db, auth } from "../config/firebaseAdmin.js";

const router = Router();

// Devuelve todos los usuarios con role === "colaborador" desde Firestore,
// enriquecidos con el correo real (que solo vive en Firebase Auth, no en
// Firestore). Si algún doc quedó huérfano (usuario borrado de Auth), se
// omite el correo en vez de romper toda la respuesta.
router.get("/", verifyToken, loadProfile, requireRole("evaluador"), async (req, res, next) => {
  try {
    const snap = await db.collection("users").where("role", "==", "colaborador").get();
    const colaboradores = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        let email = null;
        try {
          const authUser = await auth.getUser(doc.id);
          email = authUser.email || null;
        } catch {
          email = null;
        }
        return {
          id: doc.id,
          ...data,
          competencies: data.competencies || [],
          email,
        };
      }),
    );
    res.json({ colaboradores });
  } catch (error) {
    next(error);
  }
});

export default router;