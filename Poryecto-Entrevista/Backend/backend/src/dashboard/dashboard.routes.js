import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { loadProfile } from "../auth/loadProfile.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// TODO: reemplazar estos datos de ejemplo por consultas reales a Firestore
// (colecciones de evaluaciones, colaboradores, etc.) cuando las creemos.

router.get("/evaluador", verifyToken, loadProfile, requireRole("evaluador"), (req, res) => {
  res.json({
    mensaje: "Pendiente: traer métricas reales del evaluador desde Firestore.",
    usuario: req.userProfile,
  });
});

router.get("/colaborador", verifyToken, loadProfile, requireRole("colaborador"), (req, res) => {
  res.json({
    mensaje: "Pendiente: traer métricas reales del colaborador desde Firestore.",
    usuario: req.userProfile,
  });
});

export default router;
