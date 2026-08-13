import { useEffect, useState } from "react";
import { BarChart3, CheckSquare, ChevronDown, TrendingUp, CircleHelp, ArrowUpRight } from "lucide-react";
import {
  buildCompetencies,
  buildProgressSeries,
  competencyDefinitions,
  chartColors,
  formatDate,
} from "./utils/trainingUtils";
import { apiFetch } from "../../api";
import EvaluationModal from "./components/EvaluationModal";
import CompetenciesView from "./components/CompetenciesView";
import TraineeSidebar from "./components/TraineeSidebar";
import TraineeMetric from "./components/TraineeMetric";
import CompetencyList from "./components/CompetencyList";
import ProgressPanel from "./components/ProgressPanel";

// Catálogos y utilidades ya importadas de trainingUtils
// (competencyDefinitions, chartColors, formatDate, buildCompetencies, buildProgressSeries)


// Los componentes TraineeSidebar, TraineeMetric, EmptyState, CompetencyList, ProgressPanel,
// MiniTrend, CompetenciesView y EvaluationModal están en sus archivos separados en components/

export default function TraineePortal({ onLogout, onNavigate, token, profile }) {
  const [active, setActive] = useState("Inicio");
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);

  // Trae las evaluaciones reales del colaborador logueado. Se puede volver
  // a llamar (por ejemplo desde onSaved del modal) para refrescar la lista
  // justo después de guardar una evaluación nueva.
  function loadEvaluaciones() {
    if (!token) return;
    apiFetch("/api/evaluaciones/mias", { token })
      .then((data) => setEvaluaciones(data.evaluaciones || []))
      .catch(() => setEvaluaciones([]));
  }

  useEffect(() => {
    loadEvaluaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const competencies = buildCompetencies(profile, evaluaciones);
  const firstName = profile?.name?.split(" ")[0] || "Colaborador";
  const initials = profile?.initials || "--";
  const position = profile?.position || "Colaborador";

  const scoresConNota = evaluaciones.map((item) => item.score).filter((score) => typeof score === "number");
  const promedio = scoresConNota.length
    ? Math.round(scoresConNota.reduce((a, b) => a + b, 0) / scoresConNota.length)
    : null;
  const enDesarrollo = competencies.filter((c) => c.score === null || c.score < 70).length;

  const metrics = [
    [
      CheckSquare,
      "violet",
      "Evaluaciones realizadas",
      String(evaluaciones.length),
      evaluaciones.length === 0 ? "Aún no has evaluado" : "Completadas",
    ],
    [
      TrendingUp,
      "green",
      "Promedio de competencia",
      promedio === null ? "—" : `${promedio}%`,
      promedio === null ? "Aún sin datos" : "Nivel actual",
    ],
    [
      BarChart3,
      "orange",
      "Competencias en desarrollo",
      String(enDesarrollo),
      evaluaciones.length === 0 ? "Realiza tu primera evaluación" : "Sigue así, vas por buen camino",
    ],
  ];

  return (
    <div className="dashboard-page trainee-page">
      <TraineeSidebar onLogout={onLogout} active={active} onActive={setActive} onNavigate={onNavigate} />
      <main className="content trainee-content">
        {active === "Progreso" ? (
          <CompetenciesView competencies={competencies} onEvaluate={setSelectedCompetency} profile={profile} />
        ) : (
          <>
            <header className="trainee-header">
              <div>
                <h1>
                  ¡Hola, {firstName}! <span>👋</span>
                </h1>
                <p>Bienvenido a tu espacio de crecimiento. Sigue desarrollando tus competencias.</p>
              </div>
              <div className="trainee-user">
                <i>{initials}</i>
                <span>
                  <b>{profile?.name || "Colaborador"}</b>
                  <small>{position}</small>
                </span>
                <ChevronDown size={16} />
              </div>
            </header>
            <section className="trainee-metrics">
              {metrics.map(([Icon, tone, title, value, detail]) => (
                <TraineeMetric key={title} Icon={Icon} tone={tone} title={title} value={value} detail={detail} />
              ))}
            </section>
            <section className="trainee-grid">
              <CompetencyList competencies={competencies} onEvaluate={setSelectedCompetency} onViewAll={() => setActive("Progreso")} />
              <div className="trainee-side">
                <ProgressPanel evaluaciones={evaluaciones} onViewAll={() => onNavigate?.("mi-historial")} />
              </div>
            </section>
          </>
        )}
        {selectedCompetency && (
          <EvaluationModal
            competency={selectedCompetency}
            onClose={() => setSelectedCompetency(null)}
            token={token}
            onSaved={loadEvaluaciones}
          />
        )}
      </main>
    </div>
  );
}