import { Star } from "lucide-react";
import EmptyState from "./EmptyState";

function CompetencyList({ competencies, onEvaluate, onViewAll }) {
  return (
    <article className="trainee-card trainee-competencies">
      <header>
        <h2>Mis competencias asignadas</h2>
        <button onClick={onViewAll}>Ver todas</button>
      </header>
      {competencies.length === 0 ? (
        <EmptyState
          title="Sin competencias asignadas"
          description="Tu evaluador todavía no te ha asignado competencias para desarrollar."
        />
      ) : (
        competencies.map((competency) => {
          const { name, description, score, Icon, tone, status } = competency;
          return (
            <div className="trainee-competency" key={name}>
              <i className={tone}>
                <Icon size={26} />
              </i>
              <span>
                <b>{name}</b>
                <small>{description}</small>
              </span>
              <div className="trainee-score">
                <small>Nivel actual</small>
                <b>{score === null ? "—" : `${score}%`}</b>
                <em>
                  <i className={tone} style={{ width: `${score ?? 0}%` }} />
                </em>
              </div>
              <button className={status === "Pendiente" ? "pending" : ""} onClick={() => onEvaluate(competency)}>
                {status}
              </button>
            </div>
          );
        })
      )}
      <footer>
        <Star size={22} />
        <span>
          <b>Completa tus evaluaciones para seguir creciendo</b>
          <small>Realiza tus evaluaciones pendientes y mejora tus resultados.</small>
        </span>
      </footer>
    </article>
  );
}

export default CompetencyList;
