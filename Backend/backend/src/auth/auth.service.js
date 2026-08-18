// Firebase Authentication solo guarda email/password/uid.
// El nombre completo, el rol (evaluador o colaborador), el cargo, etc.
// los guardamos en Firestore, en la colección "users", usando el mismo
// uid que genera Firebase Auth como id del documento.
//
// Estructura esperada de cada documento en users/{uid}:
// {
//   name: "María Gómez López",
//   role: "colaborador",       // o "evaluador"
//   position: "Frontend Developer",
//   initials: "MG",
//   createdAt: <timestamp>
// }

import { db } from "../config/firebaseAdmin.js";

export async function getUserProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createUserProfile(uid, data) {
  const profile = {
    name: data.name,
    role: data.role, // "evaluador" | "colaborador"
    position: data.position || "",
    initials: data.initials || nameToInitials(data.name),
    competencies: Array.isArray(data.competencies) ? data.competencies : [],
    createdAt: new Date().toISOString(),
  };
  await db.collection("users").doc(uid).set(profile);
  return { id: uid, ...profile };
}

function nameToInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
