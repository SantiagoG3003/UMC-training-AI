// Banco fijo de preguntas por competencia. Estas NO las genera la IA: son
// siempre las mismas 3 preguntas para cada competencia, así el criterio de
// comparación entre evaluaciones (para medir crecimiento) es consistente.
// Lo único que hace la IA es calificar las respuestas (ver ai.service.js).

export const PREGUNTAS_POR_COMPETENCIA = {
  "Comunicación efectiva": [
    "Explica cómo comunicarías una situación difícil manteniendo claridad y empatía.",
    "Describe cómo confirmarías que tu interlocutor comprendió el mensaje.",
    "¿Qué harías si la conversación no avanza como esperabas?",
  ],
  "Trabajo en equipo": [
    "Cuenta una situación en la que tuviste que colaborar con alguien con un estilo de trabajo muy distinto al tuyo. ¿Cómo lo manejaste?",
    "¿Qué haces cuando notas que un compañero de equipo no está cumpliendo su parte del trabajo?",
    "Describe cómo priorizarías el objetivo del equipo por encima de una preferencia personal.",
  ],
  "Liderazgo": [
    "Describe cómo motivarías a un equipo que está desmotivado tras no cumplir una meta.",
    "¿Cómo delegarías una tarea importante a alguien con poca experiencia, asegurando que salga bien?",
    "Cuenta cómo darías retroalimentación difícil a alguien de tu equipo sin desmotivarlo.",
  ],
  "Resolución de problemas": [
    "Describe un problema complejo que hayas enfrentado y cómo lo analizaste antes de actuar.",
    "¿Qué harías si la primera solución que intentas no funciona?",
    "Explica cómo decides entre varias soluciones posibles cuando el tiempo es limitado.",
  ],
  "Orientación a resultados": [
    "Cuenta cómo te aseguras de cumplir una meta cuando surgen obstáculos inesperados.",
    "¿Cómo priorizas tus tareas cuando tienes varios objetivos importantes al mismo tiempo?",
    "Describe una situación en la que ajustaste tu plan para lograr un resultado, sin perder de vista el objetivo final.",
  ],
};

// Si la competencia no está en el banco (por ejemplo, una nueva que aún no
// se agregó aquí), usamos estas 3 preguntas genéricas como respaldo.
const PREGUNTAS_GENERICAS = [
  "Describe una situación real en la que hayas puesto en práctica esta competencia.",
  "¿Qué dificultades enfrentaste y cómo las resolviste?",
  "¿Qué harías distinto si te enfrentaras a esa misma situación hoy?",
];

export function obtenerPreguntas(competency) {
  return PREGUNTAS_POR_COMPETENCIA[competency] || PREGUNTAS_GENERICAS;
}
