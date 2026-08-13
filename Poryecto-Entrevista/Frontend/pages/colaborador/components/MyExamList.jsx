import { useMemo, useState } from "react";
import { ChevronDown, Eye, Inbox, Search } from "lucide-react";
import { competencyStyle, formatDate, formatTime } from "../utils/myExamUtils";
import Profile from "./Profile";

function MyExamList({ rows, loading, error, profile, onSelect }) {
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
          `${item.competency}`.toLowerCase().includes(query.toLowerCase()) &&
          (status === "Todos" ||
            (status === "Completadas" ? item.score !== null : item.score === null)) &&
          (competency === "Todas" || item.competency === competency),
      ),
    [rows, query, status, competency],
  );

  return (
    <>
      <header className="evaluations-topbar">
        <div>
          <h1>Mi historial de evaluaciones</h1>
          <p>Consulta los resultados de las evaluaciones que has realizado.</p>
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
            placeholder="Buscar por competencia..."
          />
        </label>
        <label>
          <span>Estado:</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Todos</option>
            <option>Completadas</option>
            <option>Pendientes</option>
          </select>
          <ChevronDown size={16} />
        </label>
        <label>
          <span>Competencia:</span>
          <select value={competency} onChange={(event) => setCompetency(event.target.value)}>
            {competencyOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
      </section>
      <section className="evaluation-list-card">
        <div className="evaluation-list-head">
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
            <strong>Sin evaluaciones registradas</strong>
            <span>Cuando completes una evaluación desde "Progreso", la vas a ver aquí.</span>
          </div>
        ) : (
          filtered.map((item) => {
            const { icon: Icon, tone } = competencyStyle(item.competency);
            return (
              <article className="evaluation-row" key={item.id}>
                <div className="evaluation-competency">
                  <i className={tone}>
                    <Icon size={18} />
                  </i>
                  <b>{item.competency}</b>
                </div>
                <span className="evaluation-date">
                  {formatDate(item.date)}
                  <small>{formatTime(item.date)}</small>
                </span>
                <strong
                  className={
                    item.score === null ? "pending" : item.score < 70 ? "warning" : "success"
                  }
                >
                  {item.score === null ? "Pendiente" : `${item.score}%`}
                </strong>
                <button className="observe-button" onClick={() => onSelect(item)}>
                  <Eye size={18} />
                  Ver detalle
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

export default MyExamList;
