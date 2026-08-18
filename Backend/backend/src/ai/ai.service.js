// Toda la "inteligencia" de las evaluaciones vive aquí: la IA solo hace una
// cosa, calificar las respuestas. Ninguna regla if/else decide la nota: el
// criterio es 100% del modelo de Gemini, este archivo solo define QUÉ le
// pedimos y en qué forma queremos la respuesta (JSON).
// Las preguntas ahora son fijas por competencia, ver evaluaciones/preguntas.js.

import { askGeminiJSON } from "./gemini.service.js";

// CALIFICAR RESPUESTAS
// Recibe la competencia + el arreglo [{question, answer}] que ya se guardó
// en Firestore y le pide a la IA que la analice y la califique.
export async function calificarEvaluacion(competency, respuestas) {
  const schema = {
    type: "object",
    properties: {
      score: { type: "integer" },
      level: {
        type: "string",
        enum: ["Inicial", "En desarrollo", "Competente", "Avanzado"],
      },
      resumen: { type: "string" },
      fortalezas: { type: "array", items: { type: "string" } },
      areasDeMejora: { type: "array", items: { type: "string" } },
      recomendaciones: { type: "array", items: { type: "string" } },
    },
    required: ["score", "level", "resumen", "fortalezas", "areasDeMejora", "recomendaciones"],
  };

  const bloqueRespuestas = respuestas
    .map((item, i) => `Pregunta ${i + 1}: ${item.question}\nRespuesta: ${item.answer}`)
    .join("\n\n");

  const prompt = `
Eres un evaluador experto de competencias laborales. Analiza las siguientes
respuestas de un colaborador para la competencia "${competency}" y califícalas
de forma objetiva y consistente.

${bloqueRespuestas}

Instrucciones de calificación:
- score: número entero de 0 a 100 que refleje la calidad global de las
  respuestas (claridad, aplicación práctica, profundidad, coherencia).
- level: elige el nivel que mejor corresponda al score:
  0-49 "Inicial", 50-69 "En desarrollo", 70-89 "Competente", 90-100 "Avanzado".
- resumen: 3-4 frases explicando la calificación con el mayor detalle posible
  (qué se evaluó, qué tan bien se cubrió y por qué se llegó a ese puntaje).
- fortalezas: entre 1 y 3 puntos concretos observados en las respuestas.
- areasDeMejora: entre 1 y 3 puntos concretos a mejorar.
- recomendaciones: entre 2 y 4 acciones concretas y prácticas que el
  colaborador puede hacer para mejorar en esta competencia (cursos, hábitos,
  ejercicios, lecturas, etc.), como información adicional más allá de las
  áreas de mejora.

Responde solo con el JSON pedido, en español.
`.trim();

  return askGeminiJSON({ prompt, schema });
}
