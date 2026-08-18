import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { loadProfile } from "../auth/loadProfile.js";
import { requireRole } from "../middleware/requireRole.js";
import { db } from "../config/firebaseAdmin.js";
import { calificarEvaluacion } from "../ai/ai.service.js";
import { obtenerPreguntas } from "./preguntas.js";

const router = Router();

// Colaborador: pide las 3 preguntas fijas de una competencia, justo antes
// de empezar a responder la evaluación (botón "Evaluar <competencia>").
// Estas preguntas NO las genera la IA, son siempre las mismas por
// competencia (ver preguntas.js) para que el criterio de comparación entre
// evaluaciones de una misma persona a lo largo del tiempo sea consistente.
router.get(
  "/preguntas/:competency",
  verifyToken,
  loadProfile,
  requireRole("colaborador"),
  (req, res) => {
    const { competency } = req.params;
    res.json({ competency, preguntas: obtenerPreguntas(competency) });
  },
);

// Estructura esperada de cada documento en evaluaciones/{id}:
// {
//   userId: "<uid del colaborador>",
//   competency: "Comunicación efectiva",
//   date: "<ISO timestamp>",
//   score: 85 | null,          // null mientras no se haya calificado
//   level: "Competente" | null,
// }
// Por ahora la colección no tiene documentos: no existe todavía un flujo
// que cree evaluaciones. Estas rutas ya consultan Firestore de verdad, así
// que en cuanto se empiecen a crear documentos ahí, aparecerán aquí solos.

// Junta cada evaluación con los datos básicos (nombre, cargo, iniciales)
// del colaborador al que pertenece, usando la colección "users".
async function attachCollaboratorInfo(docs) {
  const userIds = [...new Set(docs.map((doc) => doc.data().userId).filter(Boolean))];
  const usersById = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const snap = await db.collection("users").doc(uid).get();
      if (snap.exists) usersById[uid] = snap.data();
    }),
  );
  return docs.map((doc) => {
    const data = doc.data();
    const user = usersById[data.userId] || {};
    return {
      id: doc.id,
      ...data,
      name: user.name || "Colaborador eliminado",
      role: user.position || "",
      initials: user.initials || "",
    };
  });
}

// Evaluador: ve las evaluaciones de todos los colaboradores.
router.get("/", verifyToken, loadProfile, requireRole("evaluador"), async (req, res, next) => {
  try {
    const snap = await db.collection("evaluaciones").orderBy("date", "desc").get();
    const evaluaciones = await attachCollaboratorInfo(snap.docs);
    res.json({ evaluaciones });
  } catch (error) {
    next(error);
  }
});

// Colaborador: ve solo sus propias evaluaciones (su historial / "MyExam").
router.get("/mias", verifyToken, loadProfile, requireRole("colaborador"), async (req, res, next) => {
  try {
    const snap = await db
      .collection("evaluaciones")
      .where("userId", "==", req.uid)
      .orderBy("date", "desc")
      .get();
    const evaluaciones = await attachCollaboratorInfo(snap.docs);
    res.json({ evaluaciones });
  } catch (error) {
    next(error);
  }
});

// Evaluador: ve las evaluaciones de UN colaborador específico (modal de
// detalle en la vista "Colaboradores"). Misma consulta que "/mias" pero
// para cualquier userId, no solo el propio.
router.get(
  "/colaborador/:userId",
  verifyToken,
  loadProfile,
  requireRole("evaluador"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const snap = await db
        .collection("evaluaciones")
        .where("userId", "==", userId)
        .orderBy("date", "desc")
        .get();
      const evaluaciones = await attachCollaboratorInfo(snap.docs);
      res.json({ evaluaciones });
    } catch (error) {
      next(error);
    }
  },
);

// Colaborador: guarda una evaluación nueva con las preguntas y respuestas
// que respondió en el modal "Evaluar <competencia>". Por ahora se guarda
// sin nota (score: null) porque todavía no hay un flujo que la analice con
// IA; queda lista para que ese análisis la actualice más adelante.
router.post("/", verifyToken, loadProfile, requireRole("colaborador"), async (req, res, next) => {
  try {
    const { competency, respuestas } = req.body || {};

    if (!competency || typeof competency !== "string") {
      return res.status(400).json({ error: "Falta la competencia evaluada." });
    }
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({ error: "Faltan las respuestas de la evaluación." });
    }
    const respuestasValidas = respuestas.every(
      (item) =>
        item &&
        typeof item.question === "string" &&
        item.question.trim() !== "" &&
        typeof item.answer === "string" &&
        item.answer.trim() !== "",
    );
    if (!respuestasValidas) {
      return res.status(400).json({ error: "Cada pregunta debe tener una respuesta." });
    }

    // La IA analiza las respuestas y decide la nota y el nivel: no hay
    // ningún if/else de negocio aquí, el criterio es 100% del modelo.
    const analisis = await calificarEvaluacion(competency, respuestas);

    const nuevaEvaluacion = {
      userId: req.uid,
      competency,
      date: new Date().toISOString(),
      score: analisis.score,
      level: analisis.level,
      resumen: analisis.resumen,
      fortalezas: analisis.fortalezas,
      areasDeMejora: analisis.areasDeMejora,
      recomendaciones: analisis.recomendaciones,
      respuestas,
    };

    const docRef = await db.collection("evaluaciones").add(nuevaEvaluacion);
    res.status(201).json({ id: docRef.id, ...nuevaEvaluacion });
  } catch (error) {
    next(error);
  }
});

export default router;