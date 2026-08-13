// Cliente mínimo para la API de Gemini (Google AI Studio).
// No usa ninguna librería extra: Node 18+ ya trae fetch nativo.
//
// Necesitas una GEMINI_API_KEY gratis: https://aistudio.google.com/apikey
// (no pide tarjeta de crédito). Ponla en tu .env como GEMINI_API_KEY=...

import dotenv from "dotenv";
dotenv.config();

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Llama a Gemini pidiéndole que responda EXCLUSIVAMENTE en JSON y que
// cumpla el "responseSchema" indicado. Devuelve el objeto ya parseado.
export async function askGeminiJSON({ prompt, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta GEMINI_API_KEY en el .env del backend. Consigue una gratis en https://aistudio.google.com/apikey",
    );
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini respondió con error ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvió contenido utilizable.");
  }
  return JSON.parse(text);
}
