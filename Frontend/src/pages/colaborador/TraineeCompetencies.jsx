// Vista "Progreso" (Mis competencias) del Colaborador.
// Antes vivía combinada con la vista "Inicio" dentro de TraineePortal.jsx
// (se cambiaba con un estado interno "active"). Ahora es su propia página,
// igual que Collaborators.jsx / Evaluations.jsx lo son para el Evaluador.
import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckSquare,
  ChevronDown,
  CircleHelp,
  Clock3,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import umcLogo from "../../assets/umc-logo.png";

// TODO: mismos datos de ejemplo que en TraineeHome.jsx. Cuando exista un
// flujo real de evaluaciones para el colaborador, ambas vistas deberían
// traer esta información de /api/evaluaciones/mias en vez de usar arreglos
// fijos.
const competencies = [
  { name: "Comunicación efectiva", description: "Expresa ideas de forma clara y escucha activamente.", initial: 60, score: 75, Icon: MessageCircle, tone: "green" },
  { name: "Trabajo en equipo", description: "Colabora y contribuye al logro de objetivos comunes.", initial: 50, score: 65, Icon: Users, tone: "orange" },
  { name: "Liderazgo", description: "Inspira y guía al equipo hacia los objetivos.", initial: 70, score: 80, Icon: Star, tone: "blue" },
  { name: "Resolución de problemas", description: "Analiza situaciones y propone soluciones efectivas.", initial: 45, score: 60, Icon: Settings, tone: "pink" },
  { name: "Pensamiento crítico", description: "Analiza información y toma decisiones fundamentadas.", initial: 0, score: null, Icon: CircleHelp, tone: "violet" },
];

const chartColors = {
  green: "#079b47",
  orange: "#fa7900",
  blue: "#3154dc",
  pink: "#ec2c68",
  violet: "#682de3",
};

const aiQuestions = [
  "Explica cómo comunicarías una situación difícil manteniendo claridad y empatía.",
  "Describe cómo confirmarías que tu interlocutor comprendió el mensaje.",
  "¿Qué harías si la conversación no avanza como esperabas?",
];

function TraineeSidebar({ onLogout, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [TrendingUp, "Progreso"],
    [Clock3, "Historial"],
  ];
  const targets = { Inicio: "mi-espacio", Progreso: "mi-progreso", Historial: "mi-historial" };
  return (
    <aside className="sidebar trainee-sidebar">
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
            className={label === "Progreso" ? "active" : ""}
            onClick={() => onNavigate?.(targets[label])}
          >
            <Icon size={19} />
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

function TraineeMetric({ Icon, tone, title, value, detail }) {
  return (
    <article className="trainee-metric">
      <i className={tone}>
        <Icon size={29} />
      </i>
      <span>
        <small>{title}</small>
        <strong>{value}</strong>
        <em className={tone === "orange" ? "neutral" : ""}>{detail}</em>
      </span>
    </article>
  );
}

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
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.25} fill={`url(#${gradientId})`} dot={{ r: 3.5, fill: color, strokeWidth: 0 }} />
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

function EvaluationModal({ competency, onClose }) {
  const [answers, setAnswers] = useState(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const Icon = competency.Icon;
  const requestClose = () => setConfirmExit(true);
  return (
    <div className="trainee-modal-backdrop" onMouseDown={requestClose}>
      <section className="trainee-evaluation-modal" role="dialog" aria-modal="true" aria-label={`Evaluar ${competency.name}`} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <i className={competency.tone}>
              <Icon size={21} />
            </i>
            <span>
              <small>Evaluación de competencia</small>
              <h2>{competency.name}</h2>
            </span>
          </div>
          <button onClick={requestClose} aria-label="Cerrar">
            <X size={19} />
          </button>
        </header>
        <p className="modal-intro">Responde las tres preguntas. La IA analizará claridad, aplicación práctica y enfoque colaborativo.</p>
        <div className="ai-questions">
          {aiQuestions.map((question, index) => (
            <label key={question}>
              <b>Pregunta {index + 1}</b>
              <span>{question}</span>
              <textarea
                value={answers[index]}
                onChange={(event) =>
                  setAnswers((current) => current.map((answer, position) => (position === index ? event.target.value : answer)))
                }
                placeholder="Escribe tu respuesta..."
              />
            </label>
          ))}
        </div>
        {submitted && (
          <section className="modal-feedback">
            <h3>
              <BrainCircuit size={19} />
              Comentarios de la IA
            </h3>
            <div>
              <b>Resultado estimado: 82%</b>
              <p>Tu respuesta es clara y propone acciones concretas. Para mejorar, incluye cómo confirmarías los acuerdos y harías seguimiento.</p>
            </div>
            <ul>
              <li>✓ Comunicas el mensaje con empatía.</li>
              <li>✓ Propones una solución accionable.</li>
              <li>• Detalla el seguimiento posterior.</li>
            </ul>
          </section>
        )}
        <footer>
          <button className="cancel-evaluation" onClick={requestClose}>
            Cancelar
          </button>
          <button className="submit-evaluation" onClick={() => setSubmitted(true)}>
            <Sparkles size={17} />
            {submitted ? "Evaluación analizada" : "Enviar a la IA"}
          </button>
        </footer>
        {confirmExit && (
          <div className="evaluation-exit-confirmation" role="alertdialog" aria-modal="true" aria-label="Confirmar salida">
            <div>
              <h3>¿Quieres salir de la evaluación?</h3>
              <p>Las respuestas que aún no hayas enviado se perderán.</p>
              <footer>
                <button onClick={() => setConfirmExit(false)}>Seguir evaluando</button>
                <button onClick={onClose}>Salir y descartar</button>
              </footer>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TraineeCompetencies({ onLogout, onNavigate, token, profile }) {
  const [selectedCompetency, setSelectedCompetency] = useState(null);

  return (
    <div className="dashboard-page trainee-page">
      <TraineeSidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content trainee-content">
        <header className="competencies-header">
          <div>
            <h1>Mis competencias</h1>
            <p>Visualiza tu nivel actual en cada competencia y tu progreso a lo largo del tiempo.</p>
          </div>
          <div className="trainee-user">
            <i>{profile?.initials || "MG"}</i>
            <span>
              <b>{profile?.name || "María Gómez López"}</b>
              <small>{profile?.position || "Frontend Developer"}</small>
            </span>
            <ChevronDown size={16} />
          </div>
        </header>
        <section className="competencies-summary">
          <TraineeMetric Icon={CheckSquare} tone="violet" title="Competencias asignadas" value="5" detail="En desarrollo" />
          <TraineeMetric Icon={TrendingUp} tone="green" title="Promedio actual" value="72%" detail="Nivel Competente" />
          <TraineeMetric Icon={BarChart3} tone="orange" title="Competencias en desarrollo" value="3" detail="Requieren práctica" />
          <TraineeMetric Icon={ArrowUpRight} tone="violet" title="Mejora promedio" value="+15%" detail="Últimas 4 evaluaciones" />
        </section>
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
                <button className="evaluate-competency" onClick={() => setSelectedCompetency(competency)}>
                  Evaluar <ChevronDown size={16} />
                </button>
              </article>
            );
          })}
        </section>
        <footer className="competencies-note">
          <CircleHelp size={18} />
          Los niveles están basados en evaluaciones realizadas. Sigue evaluándote para seguir creciendo.
        </footer>
        {selectedCompetency && (
          <EvaluationModal competency={selectedCompetency} onClose={() => setSelectedCompetency(null)} />
        )}
      </main>
    </div>
  );
}
