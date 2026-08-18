import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Eye,
  Home,
  Inbox,
  Lightbulb,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import umcLogo from "../../assets/umc-logo.png";
import { apiFetch } from "../../api";

// Íconos/colores por competencia, igual que en Colaboradores, para que la
// vista se vea consistente sin depender de datos inventados.
const competencyStyles = {
  "Comunicación efectiva": { icon: MessageCircle, tone: "green" },
  "Trabajo en equipo": { icon: Users, tone: "orange" },
  "Liderazgo": { icon: Star, tone: "blue" },
  "Resolución de problemas": { icon: Settings, tone: "pink" },
  "Orientación a resultados": { icon: CheckSquare, tone: "purple" },
};
function competencyStyle(name) {
  return competencyStyles[name] || { icon: CheckSquare, tone: "blue" };
}

function EvaluationSidebar({ onLogout, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [Users, "Colaboradores"],
    [CheckSquare, "Evaluaciones"],
  ];
  return (
    <aside className="sidebar evaluations-sidebar">
      <div className="side-brand">
        <img src={umcLogo} alt="UMC Training AI" />
        <span>
          <b>UMC</b>
          <small>Training AI</small>
        </span>
      </div>
      <nav>
        {items.map(([Icon, label]) => (
          <button
            key={label}
            className={label === "Evaluaciones" ? "active" : ""}
            onClick={() => {
              if (label === "Inicio") onNavigate("inicio");
              if (label === "Colaboradores") onNavigate("colaboradores");
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <button className="logout" onClick={onLogout}>
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  );
}

function Profile({ profile }) {
  const initials = profile?.initials || "EV";
  return (
    <div className="evaluation-profile">
      <span>{initials}</span>
      <div>
        <b>{profile?.name || "Evaluador"}</b>
        <small>Evaluador</small>
      </div>
      <ChevronDown size={16} />
    </div>
  );
}

function EvaluationList({ rows, loading, error, profile, onSelect }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [competency, setCompetency] = useState("Todas");

  const competencyOptions = useMemo(
    () => ["Todas", ...new Set(rows.map((r) => r.competency))],
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (item) =>
          `${item.name} ${item.competency}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "Todos" ||
            (status === "Completadas"
              ? item.score !== null
              : item.score === null)) &&
          (competency === "Todas" || item.competency === competency),
      ),
    [rows, query, status, competency],
  );

  return (
    <>
      <header className="evaluations-topbar">
        <div>
          <h1>Evaluaciones</h1>
          <p>
            Aquí puedes ver y manejar las evaluaciones de los colaboradores.
          </p>
        </div>
        <div className="topbar-tools">
          <Profile profile={profile} />
        </div>
      </header>
      <section className="evaluation-filters">
        <label className="evaluation-search">
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar colaborador o competencia..."
          />
        </label>
        <label>
          <span>Estado:</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>Todos</option>
            <option>Completadas</option>
            <option>Pendientes</option>
          </select>
          <ChevronDown size={16} />
        </label>
        <label>
          <span>Competencia:</span>
          <select
            value={competency}
            onChange={(event) => setCompetency(event.target.value)}
          >
            {competencyOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
      </section>
      <section className="evaluation-list-card">
        <div className="evaluation-list-head">
          <span>Colaborador</span>
          <span>Competencia</span>
          <span>Fecha</span>
          <span>Resultado</span>
          <span></span>
        </div>
        {loading ? (
          <div className="empty-state">
            <Inbox size={26} />
            <strong>Cargando evaluaciones…</strong>
          </div>
        ) : error ? (
          <div className="empty-state">
            <Inbox size={26} />
            <strong>No se pudo cargar la información</strong>
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Inbox size={26} />
            <strong>No hay colaboradores registrados</strong>
            <span>Registra colaboradores desde la sección "Colaboradores" para que aparezcan acá.</span>
          </div>
        ) : (
          filtered.map((item) => {
            const { icon: Icon, tone } = competencyStyle(item.competency);
            return (
              <article className="evaluation-row" key={item.id}>
                <div className="evaluation-person">
                  <i>{item.initials}</i>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.role}</small>
                  </span>
                </div>
                <div className="evaluation-competency">
                  <i className={tone}>
                    <Icon size={18} />
                  </i>
                  <b>{item.competency}</b>
                </div>
                <span className="evaluation-date">
                  {item.date
                    ? new Date(item.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </span>
                <strong
                  className={
                    item.score === null
                      ? "pending"
                      : item.score < 70
                        ? "warning"
                        : "success"
                  }
                >
                  {item.score === null ? "Pendiente" : `${item.score}%`}
                </strong>
                <button className="observe-button" onClick={() => onSelect(item)}>
                  <Eye size={18} />
                  Observar
                </button>
              </article>
            );
          })
        )}
        {!loading && !error && filtered.length > 0 && (
          <footer className="evaluation-pagination">
            <span>Mostrando {filtered.length} de {rows.length} evaluaciones</span>
          </footer>
        )}
      </section>
    </>
  );
}

function EvaluationDetail({ evaluation, profile, onBack }) {
  const { icon: Icon, tone } = competencyStyle(evaluation.competency);
  const completed = evaluation.score !== null;
  const score = evaluation.score ?? 0;
  const respuestas = evaluation.respuestas || [];
  const fortalezas = evaluation.fortalezas || [];
  const areasDeMejora = evaluation.areasDeMejora || [];
  const recomendaciones = evaluation.recomendaciones || [];
  return (
    <>
      <header className="evaluations-topbar detail-topbar">
        <div>
          <button className="back-evaluations" onClick={onBack}>
            <ArrowLeft size={16} />
            Volver a evaluaciones
          </button>
          <h1>Detalle de evaluación</h1>
          <p>Resumen de la evaluación de este colaborador.</p>
        </div>
        <div className="topbar-tools">
          <Profile profile={profile} />
        </div>
      </header>
      <section className="evaluation-summary">
        <div className="summary-person">
          <i>{evaluation.initials}</i>
          <span>
            <b>{evaluation.name}</b>
            <small>{evaluation.role}</small>
            {evaluation.date && (
              <em>
                <CalendarDays size={15} />
                Evaluación realizada el:{" "}
                {new Date(evaluation.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
              </em>
            )}
          </span>
        </div>
        <div className="summary-competency">
          <i className={tone}>
            <Icon size={23} />
          </i>
          <span>
            <small>Competencia evaluada</small>
            <b>{evaluation.competency}</b>
          </span>
        </div>
        <div className="summary-score">
          <small>Evaluación</small>
          <b>{completed ? `${score}%` : "Pendiente"}</b>
          <span>
            {completed ? `Nivel: ${evaluation.level}` : "Todavía sin calificar"}
          </span>
        </div>
        <div className="summary-status">
          <small>Estado</small>
          <mark className={completed ? "complete" : "pending"}>
            {completed ? (
              <>
                <CheckCircle2 size={16} />
                Completada
              </>
            ) : (
              "Pendiente"
            )}
          </mark>
        </div>
      </section>
      <div className="evaluation-detail-grid">
        <div className="case-column">
          <article className="detail-card case-answer">
            <h2>Preguntas y respuestas del colaborador</h2>
            {respuestas.length === 0 ? (
              <div className="empty-state">
                <Inbox size={26} />
                <strong>Aún no disponible</strong>
                <span>
                  {completed
                    ? "Esta evaluación no tiene preguntas y respuestas guardadas."
                    : "Este colaborador todavía no ha respondido esta evaluación."}
                </span>
              </div>
            ) : (
              respuestas.map((item, index) => (
                <section className="evaluation-question" key={`${item.question}-${index}`}>
                  <h3>Pregunta {index + 1}</h3>
                  <div>
                    <b>Pregunta</b>
                    <p>{item.question}</p>
                  </div>
                  <div>
                    <b>Respuesta del colaborador</b>
                    <p>{item.answer}</p>
                  </div>
                </section>
              ))
            )}
          </article>
        </div>
        <div className="ai-column">
          <article className="detail-card ai-analysis">
            <h2>Puntuación</h2>
            <div className="ai-score">
              <div
                className="score-ring"
                style={{ "--score": `${score * 3.6}deg` }}
              >
                <b>{completed ? `${score}%` : "—"}</b>
                <small>Puntuación total</small>
              </div>
              <div>
                <p>
                  {completed
                    ? evaluation.resumen ||
                      `Este colaborador obtuvo ${score}% en la competencia ${evaluation.competency}.`
                    : "Este colaborador todavía no tiene una evaluación registrada para esta competencia."}
                </p>
              </div>
            </div>
          </article>
          {completed && (fortalezas.length > 0 || areasDeMejora.length > 0 || recomendaciones.length > 0) && (
            <article className="detail-card ai-feedback">
              <h2>Retroalimentación de la IA</h2>
              {fortalezas.length > 0 && (
                <section className="strengths">
                  <h3>
                    <CheckCircle2 size={16} />
                    Lo que hizo bien
                  </h3>
                  {fortalezas.map((item, index) => (
                    <p key={index}>✓ {item}</p>
                  ))}
                </section>
              )}
              {areasDeMejora.length > 0 && (
                <section className="improvements">
                  <h3>
                    <Lightbulb size={16} />
                    Lo que puede mejorar
                  </h3>
                  {areasDeMejora.map((item, index) => (
                    <p key={index}>• {item}</p>
                  ))}
                </section>
              )}
              {recomendaciones.length > 0 && (
                <section className="recommendations">
                  <h3>
                    <Sparkles size={16} />
                    Recomendaciones
                  </h3>
                  {recomendaciones.map((item, index) => (
                    <p key={index}>→ {item}</p>
                  ))}
                </section>
              )}
            </article>
          )}
        </div>
      </div>
    </>
  );
}

export default function Evaluations({ onLogout, onNavigate, token, profile }) {
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch("/api/colaboradores", { token }),
      apiFetch("/api/evaluaciones", { token }),
    ])
      .then(([colaboradoresRes, evaluacionesRes]) => {
        if (!active) return;
        const colaboradores = colaboradoresRes.colaboradores || [];
        const evaluaciones = evaluacionesRes.evaluaciones || [];

        // Une cada evaluación real con el colaborador y la competencia a la
        // que pertenece. Para las competencias que un colaborador tiene
        // asignadas pero todavía no evaluó, se arma una fila "Pendiente".
        const byUserAndCompetency = {};
        evaluaciones.forEach((ev) => {
          byUserAndCompetency[`${ev.userId}::${ev.competency}`] = ev;
        });

        const built = [];
        colaboradores.forEach((c) => {
          const competencies = c.competencies?.length ? c.competencies : [null];
          competencies.forEach((competency) => {
            if (!competency) return;
            const real = byUserAndCompetency[`${c.id}::${competency}`];
            built.push({
              id: real ? real.id : `${c.id}::${competency}`,
              userId: c.id,
              name: c.name,
              role: c.position || "",
              initials: c.initials,
              competency,
              date: real?.date || null,
              score: real?.score ?? null,
              level: real?.level || null,
              resumen: real?.resumen || null,
              fortalezas: real?.fortalezas || [],
              areasDeMejora: real?.areasDeMejora || [],
              respuestas: real?.respuestas || [],
            });
          });
        });

        // Ordena por fecha descendente (más reciente primero); las filas
        // "Pendiente" (sin fecha, sin evaluación real todavía) van al final.
        built.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });

        setRows(built);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar la información.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="dashboard-page evaluations-page">
      <EvaluationSidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content evaluations-content">
        {selectedEvaluation ? (
          <EvaluationDetail
            evaluation={selectedEvaluation}
            profile={profile}
            onBack={() => setSelectedEvaluation(null)}
          />
        ) : (
          <EvaluationList
            rows={rows}
            loading={loading}
            error={error}
            profile={profile}
            onSelect={setSelectedEvaluation}
          />
        )}
      </main>
    </div>
  );
}