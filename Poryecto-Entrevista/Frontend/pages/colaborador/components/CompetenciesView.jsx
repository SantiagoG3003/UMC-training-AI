import { ArrowUpRight, BarChart3, CheckSquare, ChevronDown, CircleHelp, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { competencyDefinitions, chartColors } from "../utils/trainingUtils";
import TraineeMetric from "./TraineeMetric";
import EmptyState from "./EmptyState";

function MiniTrend({ competency }) {
  const end = competency.score ?? 40;
  const values = [
    competency.initial,
    Math.round((competency.initial + end) / 2) - 3,
    Math.round((competency.initial + end) / 2) + 3,
    end,
  ];
  const color = chartColors[competency.tone];
  const gradientId = `trend-${competency.tone}`;
  return (
    <div className="competency-trend">
      <div className="trend-scale">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
      <div className="trend-plot">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={values.map((value, index) => ({ index, value }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf0f6" />
            <XAxis hide dataKey="index" />
            <YAxis hide domain={[0, 100]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.25}
              fill={`url(#${gradientId})`}
              dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <footer>
          <span>Antes</span>
          <span>Después</span>
        </footer>
      </div>
    </div>
  );
}

function CompetenciesView({ competencies, onEvaluate, profile }) {
  const scoresConNota = competencies.map((c) => c.score).filter((score) => typeof score === "number");
  const promedio = scoresConNota.length
    ? Math.round(scoresConNota.reduce((a, b) => a + b, 0) / scoresConNota.length)
    : null;
  const enDesarrollo = competencies.filter((c) => c.score === null || c.score < 70).length;
  const initials = profile?.initials || "--";
  const position = profile?.position || "Colaborador";

  return (
    <>
      <header className="competencies-header">
        <div>
          <h1>Mis competencias</h1>
          <p>Visualiza tu nivel actual en cada competencia y tu progreso a lo largo del tiempo.</p>
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
      <section className="competencies-summary">
        <TraineeMetric Icon={CheckSquare} tone="violet" title="Competencias asignadas" value={String(competencies.length)} detail="En desarrollo" />
        <TraineeMetric
          Icon={TrendingUp}
          tone="green"
          title="Promedio actual"
          value={promedio === null ? "—" : `${promedio}%`}
          detail={promedio === null ? "Aún sin datos" : "Nivel actual"}
        />
        <TraineeMetric Icon={BarChart3} tone="orange" title="Competencias en desarrollo" value={String(enDesarrollo)} detail="Requieren práctica" />
        <TraineeMetric Icon={ArrowUpRight} tone="violet" title="Mejora promedio" value="—" detail="Aún sin datos" />
      </section>
      {competencies.length === 0 ? (
        <EmptyState
          title="Sin competencias asignadas"
          description="Tu evaluador todavía no te ha asignado competencias para desarrollar."
        />
      ) : (
        <section className="competency-detail-list">
          {competencies.map((competency) => {
            const Icon = competency.Icon;
            const growth = competency.score === null ? 0 : competency.score - competency.initial;
            const gap = competency.score === null ? 100 : 100 - competency.score;
            return (
              <article className={`competency-detail ${competency.tone}`} key={competency.name}>
                <div className="competency-about">
                  <i>
                    <Icon size={27} />
                  </i>
                  <span>
                    <b>{competency.name}</b>
                    <small>{competency.description}</small>
                    <button>Ver descripción</button>
                  </span>
                </div>
                <div className="competency-levels">
                  <span>
                    Antes <i><em style={{ width: `${competency.initial}%` }} /></i><b>{competency.initial}%</b>
                  </span>
                  <span>
                    Después <i><em style={{ width: `${competency.score ?? 0}%` }} /></i>
                    <b>{competency.score === null ? "—" : `${competency.score}%`}</b>
                  </span>
                </div>
                <MiniTrend competency={competency} />
                <div className="competency-growth">
                  <small>Crecimiento</small>
                  <b>{competency.score === null ? "—" : `+${growth}%`}</b>
                  <small>Brecha</small>
                  <strong>{gap}%</strong>
                </div>
                <button className="evaluate-competency" onClick={() => onEvaluate(competency)}>
                  Evaluar <ChevronDown size={16} />
                </button>
              </article>
            );
          })}
        </section>
      )}
      <footer className="competencies-note">
        <CircleHelp size={18} />
        Los niveles están basados en evaluaciones realizadas. Sigue evaluándote para seguir creciendo.
      </footer>
    </>
  );
}

export default CompetenciesView;
