import { ArrowLeft, CalendarDays, CheckCircle2, Inbox } from "lucide-react";
import { competencyStyle, formatDate, formatTime } from "../utils/myExamUtils";
import Profile from "./Profile";

function MyExamDetail({ evaluation, profile, onBack }) {
  const { icon: Icon, tone } = competencyStyle(evaluation.competency);
  const completed = evaluation.score !== null;
  const score = evaluation.score ?? 0;
  const respuestas = evaluation.respuestas || [];
  return (
    <>
      <header className="evaluations-topbar detail-topbar">
        <div>
          <button className="back-evaluations" onClick={onBack}>
            <ArrowLeft size={16} />
            Volver a mi historial
          </button>
          <h1>Detalle de evaluación</h1>
          <p>Revisa tus respuestas y el estado de esta evaluación.</p>
        </div>
        <div className="topbar-tools">
          <Profile profile={profile} />
        </div>
      </header>
      <section className="evaluation-summary">
        <div className="summary-person">
          <i>{profile?.initials || "--"}</i>
          <span>
            <b>{profile?.name || "Colaborador"}</b>
            <small>{profile?.position || "Colaborador"}</small>
            <em>
              <CalendarDays size={15} />
              Evaluación realizada el: {formatDate(evaluation.date)} - {formatTime(evaluation.date)}
            </em>
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
          <span>{completed ? `Nivel: ${evaluation.level}` : "Todavía sin calificar"}</span>
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
            <h2>Tus preguntas y respuestas</h2>
            {respuestas.length === 0 ? (
              <div className="empty-state">
                <Inbox size={26} />
                <strong>Sin respuestas registradas</strong>
                <span>Esta evaluación no tiene preguntas y respuestas guardadas.</span>
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
                    <b>Tu respuesta</b>
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
              <div className="score-ring" style={{ "--score": `${score * 3.6}deg` }}>
                <b>{completed ? `${score}%` : "—"}</b>
                <small>Puntuación total</small>
              </div>
              <div>
                <p>
                  {completed
                    ? `Obtuviste ${score}% en la competencia ${evaluation.competency}.`
                    : "Tu evaluador todavía no ha calificado esta evaluación."}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

export default MyExamDetail;
