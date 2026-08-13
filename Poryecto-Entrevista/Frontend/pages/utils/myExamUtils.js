import { CheckSquare, MessageCircle, Settings, Star, Users } from "lucide-react";

// Estilos de competencia para MyExam (consistente con Evaluations.jsx)
export const competencyStyles = {
  "Comunicación efectiva": { icon: MessageCircle, tone: "green" },
  "Trabajo en equipo": { icon: Users, tone: "orange" },
  "Liderazgo": { icon: Star, tone: "blue" },
  "Resolución de problemas": { icon: Settings, tone: "pink" },
  "Orientación a resultados": { icon: CheckSquare, tone: "purple" },
};

export function competencyStyle(name) {
  return competencyStyles[name] || { icon: CheckSquare, tone: "blue" };
}

// Convierte un ISO string (date de Firestore) a "10 Ago 2024"
export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// Convierte un ISO string (date de Firestore) a "10:30 a. m."
export function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}
