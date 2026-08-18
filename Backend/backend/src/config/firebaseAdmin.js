// Inicializa Firebase Admin SDK. Este es el "puente" que usa el backend
// para hablar con Firebase Authentication y Firestore.
//
// Usa el archivo serviceAccountKey.json completo (Firebase Console >
// Configuración del proyecto > Cuentas de servicio > Generar nueva clave
// privada, descarga el .json y pégalo tal cual en Backend/serviceAccountKey.json).
// Es más confiable que copiar la clave privada suelta en el .env, porque
// evita los problemas de saltos de línea/formato que rompen el parseo en
// Windows. Ese archivo YA está en .gitignore: nunca se sube a git.

import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/config/ -> src/ -> backend/ -> Backend/serviceAccountKey.json
const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");
function loadServiceAccount() {
  let raw;
  try {
    raw = readFileSync(serviceAccountPath, "utf8");
  } catch {
    throw new Error(
      `No se encontró ${serviceAccountPath}. Descarga la clave privada desde Firebase ` +
        "Console (Configuración del proyecto > Cuentas de servicio > Generar nueva " +
        "clave privada) y guarda ese .json exactamente en esa ruta.",
    );
  }
  if (!raw.trim()) {
    throw new Error(
      `${serviceAccountPath} está vacío. Pega ahí el contenido completo del .json ` +
        "que descargas desde Firebase Console (Cuentas de servicio > Generar nueva clave privada).",
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `${serviceAccountPath} no es un JSON válido. Vuelve a descargarlo desde Firebase ` +
        "Console y pégalo sin modificarlo.",
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;