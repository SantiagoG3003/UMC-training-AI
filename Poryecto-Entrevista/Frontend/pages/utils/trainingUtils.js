import {
  MessageCircle,
  Users,
  Lightbulb,
  Settings,
  TrendingUp,
} from "lucide-react";

/**
 * CATÁLOGO CENTRAL DE COMPETENCIAS
 * Define las 5 competencias principales del sistema UMC Training AI
 * Cada competencia tiene: nombre, descripción, ícono visual y color asignado
 * Se usa en TraineePortal para evaluar el progreso del colaborador
 */
export const competencyDefinitions = [
  {
    name: "Comunicación efectiva",
    description: "Expresa ideas de forma clara y escucha activamente.",
    Icon: MessageCircle, // Ícono de lucide-react (burbuja de diálogo)
    tone: "green", // Referencia al color CSS definido en chartColors
  },
  {
    name: "Trabajo en equipo",
    description: "Colabora y contribuye al logro de objetivos comunes.",
    Icon: Users,
    tone: "orange",
  },
  {
    name: "Liderazgo",
    description: "Inspira y guía al equipo hacia los objetivos.",
    Icon: Lightbulb,
    tone: "blue",
  },
  {
    name: "Resolución de problemas",
    description: "Analiza situaciones y propone soluciones efectivas.",
    Icon: Settings,
    tone: "pink",
  },
  {
    name: "Orientación a resultados",
    description: "Se enfoca en cumplir metas y superar expectativas.",
    Icon: TrendingUp,
    tone: "violet",
  },
];

/**
 * MAPEO DE COLORES POR TONO
 * Convierte los nombres de tone (verde, naranja, etc.) a códigos hexadecimales
 * Se usa en gráficos (recharts) para colorear líneas, áreas y barras
 * Ejemplo: chartColors.green = "#079b47" (verde UMC)
 */
export const chartColors = {
  green: "#079b47",    // Verde UMC
  orange: "#fa7900",   // Naranja UMC
  blue: "#3154dc",     // Azul UMC
  pink: "#ec2c68",     // Rosado UMC
  violet: "#682de3",   // Violeta UMC
};

/**
 * FUNCIÓN: formatDate()
 * PROPÓSITO: Convertir fecha ISO de Firestore a formato legible en español
 * ENTRADA: iso (string ISO 8601, ej: "2024-08-18T15:30:45Z")
 * SALIDA: string formateado (ej: "18 ago 2024")
 * LÓGICA:
 *   1. Validar que la fecha no sea vacía
 *   2. Parsear string ISO a objeto Date
 *   3. Validar que la fecha sea válida (NaN check)
 *   4. Formatear a español europeo: "día mes año"
 *   5. Capitalizar letra del mes (Ago → Ago)
 * USADO EN: ProgressPanel, MyExamList (mostrar fechas de evaluaciones)
 */
export function formatDate(iso) {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date
    .toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    .replace(".", "")
    .replace(/^(\d+) (\w)/, (_, d, l) => `${d} ${l.toUpperCase()}`);
}

/**
 * FUNCIÓN: buildCompetencies()
 * PROPÓSITO: Enriquecer competencias asignadas al colaborador con sus evaluaciones
 * ENTRADA:
 *   - profile: objeto con profile.competencies (array de nombres de competencias asignadas)
 *   - evaluaciones: array de todas las evaluaciones del colaborador
 * SALIDA: array de competencias mejoradas con score inicial, actual, y estado
 * LÓGICA:
 *   1. Obtener competencias asignadas del perfil del colaborador
 *   2. Filtrar competencyDefinitions para solo las asignadas
 *   3. Para cada competencia:
 *      a. Buscar todas las evaluaciones de esa competencia
 *      b. Ordenar por fecha (de antiguo a nuevo)
 *      c. Extraer score inicial (primera evaluación)
 *      d. Extraer score actual (última evaluación)
 *      e. Determinar estado: "Pendiente" (sin evaluar) o "Evaluar" (ya evaluada)
 *   4. Retornar competencias enriquecidas
 * USADO EN: TraineePortal (para mostrar panel de competencias del colaborador)
 */
export function buildCompetencies(profile, evaluaciones) {
  const assigned = profile?.competencies || [];
  return competencyDefinitions
    .filter((def) => assigned.includes(def.name))
    .map((def) => {
      // Buscar todas las evaluaciones de esta competencia, ordenadas por fecha
      const related = evaluaciones
        .filter((ev) => ev.competency === def.name)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const first = related[0];  // Primera evaluación (nivel inicial)
      const latest = related[related.length - 1]; // Última evaluación (nivel actual)
      
      // Extraer scores: si no hay score, usar null (evaluación sin calificar)
      const score = typeof latest?.score === "number" ? latest.score : null;
      const initial = typeof first?.score === "number" ? first.score : 0;
      
      return {
        ...def, // Spread de competencia base (name, description, Icon, tone)
        initial, // Score de la primera evaluación
        score,   // Score de la última evaluación
        status: score === null ? "Pendiente" : "Evaluar", // Estado para mostrar en botón
      };
    });
}

/**
 * FUNCIÓN: buildProgressSeries()
 * PROPÓSITO: Agrupar evaluaciones por mes para graficar línea de progreso
 * ENTRADA: evaluaciones (array de todas las evaluaciones del colaborador)
 * SALIDA: array de objetos con {label (mes/año), value (promedio mensual)}
 * LÓGICA:
 *   1. Filtrar solo evaluaciones que tienen score (descartar pendientes)
 *   2. Si no hay datos, retornar array vacío
 *   3. Agrupar por mes usando Map:
 *      a. Parsear fecha ISO a objeto Date
 *      b. Extraer mes y año (ej: "ago 24" para agosto 2024)
 *      c. Capitalizar primera letra del mes
 *      d. Agregar score a bucket del mes
 *   4. Convertir Map a array de objetos
 *   5. Calcular promedio de scores por mes
 *   6. Retornar para graficar línea de tendencia
 * USADO EN: ProgressPanel (gráfico de línea del progreso general)
 */
export function buildProgressSeries(evaluaciones) {
  // Filtrar solo evaluaciones con score válido
  const withScore = evaluaciones.filter((item) => typeof item.score === "number");
  if (withScore.length === 0) return [];
  
  // Map para agrupar scores por mes: {mes: [scores...]}
  const byMonth = new Map();
  
  // Procesar evaluaciones en orden cronológico
  [...withScore]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((item) => {
      // Parsear fecha y extraer mes/año
      const date = new Date(item.date);
      const raw = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      // Ej: "ago 24" → capitalizar primera letra → "Ago 24"
      const label = raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
      
      // Agregar score al bucket del mes (crear si no existe)
      const bucket = byMonth.get(label) || [];
      bucket.push(item.score);
      byMonth.set(label, bucket);
    });
  
  // Convertir Map a array y calcular promedio por mes
  return [...byMonth.entries()].map(([label, scores]) => ({
    label, // Ej: "Ago 24"
    value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), // Promedio redondeado
  }));
}
