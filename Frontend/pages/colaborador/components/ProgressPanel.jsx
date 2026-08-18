import { ArrowUpRight, ChevronDown, CircleHelp } from "lucide-react";
import { Tooltip, LineChart, Line, YAxis, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { buildProgressSeries, competencyDefinitions, formatDate } from "../utils/trainingUtils";
import EmptyState from "./EmptyState";

function ProgressPanel({ evaluaciones, onViewAll }) {
  const hasData = evaluaciones.length > 0;
  const progress = buildProgressSeries(evaluaciones);
  const currentValue = progress.length ? progress[progress.length - 1].value : 0;
  const recent = [...evaluaciones]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  return (
    <>
      <article className="trainee-card trainee-progress">
        <header>
          <h2>Tu progreso general</h2>
          <button>
            Últimos 6 meses <ChevronDown size={15} />
          </button>
        </header>
        {progress.length > 0 ? (
          <>
            <div className="trainee-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress} margin={{ top: 14, right: 20, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e8eaf3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#20285b", fontSize: 10 }} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#27305d", fontSize: 10 }}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, "Progreso"]} />
                  <Line type="monotone" dataKey="value" stroke="#4820e4" strokeWidth={3} dot={{ r: 4, fill: "#4820e4" }} />
                </LineChart>
              </ResponsiveContainer>
              <span className="current-progress">
                <b>{currentValue}%</b>Actual
              </span>
            </div>
            <footer>
              <ArrowUpRight />
              <span>
                <b>Sigue así</b>Este es tu progreso acumulado según tus evaluaciones realizadas.
              </span>
            </footer>
          </>
        ) : (
          <EmptyState
            title="Todavía no hay datos"
            description="Este gráfico se va a completar a medida que completes evaluaciones."
          />
        )}
      </article>
      <article className="trainee-card trainee-history">
        <header>
          <h2>Últimas evaluaciones</h2>
          <button onClick={onViewAll}>Ver todas</button>
        </header>
        {hasData ? (
          recent.map((item) => {
            const def = competencyDefinitions.find((c) => c.name === item.competency);
            const Icon = def?.Icon || CircleHelp;
            const tone = def?.tone || "violet";
            return (
              <div key={item.id}>
                <i className={tone}>
                  <Icon size={17} />
                </i>
                <b>{item.competency}</b>
                <span>{formatDate(item.date)}</span>
                <strong className={tone}>{item.score === null ? "—" : `${item.score}%`}</strong>
                <button onClick={onViewAll}>
                  Ver detalle <ChevronDown size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Sin evaluaciones registradas"
            description="Cuando completes una evaluación, la vas a ver aquí."
          />
        )}
      </article>
    </>
  );
}

export default ProgressPanel;
