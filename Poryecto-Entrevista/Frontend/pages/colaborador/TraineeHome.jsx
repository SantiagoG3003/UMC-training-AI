// Vista "Inicio" del Colaborador.
// Antes vivía combinada con la vista "Progreso" dentro de TraineePortal.jsx
// (se cambiaba con un estado interno "active"). Ahora es su propia página,
// igual que Dashboard.jsx lo es para el Evaluador.
import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckSquare,
  ChevronDown,
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
import {
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import umcLogo from "../../assets/umc-logo.png";

// TODO: estos datos son de ejemplo. Cuando el colaborador tenga
// evaluaciones reales en Firestore, esta vista debería traerlas igual que
// Dashboard.jsx (evaluador) trae /api/colaboradores, en vez de usar estos
// arreglos fijos.
const competencies = [
  { name: "Comunicación efectiva", description: "Expresa ideas de forma clara y escucha activamente.", initial: 60, score: 75, Icon: MessageCircle, tone: "green", status: "Evaluar" },
  { name: "Trabajo en equipo", description: "Colabora y contribuye al logro de objetivos comunes.", initial: 50, score: 65, Icon: Users, tone: "orange", status: "Evaluar" },
  { name: "Liderazgo", description: "Inspira y guía al equipo hacia los objetivos.", initial: 70, score: 80, Icon: Star, tone: "blue", status: "Evaluar" },
  { name: "Resolución de problemas", description: "Analiza situaciones y propone soluciones efectivas.", initial: 45, score: 60, Icon: Settings, tone: "pink", status: "Evaluar" },
];

const history = [
  ["Comunicación efectiva", "10 Ago 2024", "85%", "green", MessageCircle],
  ["Liderazgo", "5 Ago 2024", "78%", "blue", Star],
  ["Trabajo en equipo", "28 Jul 2024", "65%", "orange", Users],
  ["Resolución de problemas", "15 Jul 2024", "60%", "pink", Settings],
];

const progress = [
  { month: "Mar", value: 40 }, { month: "Abr", value: 51 }, { month: "May", value: 56 },
  { month: "Jun", value: 62 }, { month: "Jul", value: 68 }, { month: "Ago", value: 72 },
];

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
            className={label === "Inicio" ? "active" : ""}
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

function CompetencyList({ onEvaluate }) {
  return (
    <article className="trainee-card trainee-competencies">
      <header>
        <h2>Mis competencias asignadas</h2>
        <button>Ver todas</button>
      </header>
      {competencies.map((competency) => {
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
      })}
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

function ProgressPanel() {
  return (
    <>
      <article className="trainee-card trainee-progress">
        <header>
          <h2>Tu progreso general</h2>
          <button>
            Últimos 6 meses <ChevronDown size={15} />
          </button>
        </header>
        <div className="trainee-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progress} margin={{ top: 14, right: 20, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e8eaf3" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#20285b", fontSize: 10 }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: "#27305d", fontSize: 10 }} />
              <Tooltip formatter={(value) => [`${value}%`, "Progreso"]} />
              <Line type="monotone" dataKey="value" stroke="#4820e4" strokeWidth={3} dot={{ r: 4, fill: "#4820e4" }} />
            </LineChart>
          </ResponsiveContainer>
          <span className="current-progress">
            <b>72%</b>
            Actual
          </span>
        </div>
        <footer>
          <ArrowUpRight />
          <span>
            <b>¡Vas mejorando!</b>
            Has mejorado 12% en comparación con tu primera evaluación.
          </span>
        </footer>
      </article>
      <article className="trainee-card trainee-history">
        <header>
          <h2>Últimas evaluaciones</h2>
          <button>Ver todas</button>
        </header>
        {history.map(([name, date, score, tone, Icon]) => (
          <div key={name}>
            <i className={tone}>
              <Icon size={17} />
            </i>
            <b>{name}</b>
            <span>{date}</span>
            <strong className={tone}>{score}</strong>
            <button>
              Ver detalle <ChevronDown size={14} />
            </button>
          </div>
        ))}
      </article>
    </>
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

export default function TraineeHome({ onLogout, onNavigate, token, profile }) {
  const [selectedCompetency, setSelectedCompetency] = useState(null);
  const firstName = profile?.name?.split(" ")[0] || "María";

  return (
    <div className="dashboard-page trainee-page">
      <TraineeSidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content trainee-content">
        <header className="trainee-header">
          <div>
            <h1>¡Hola, {firstName}! <span>👋</span></h1>
            <p>Bienvenida a tu espacio de crecimiento. Sigue desarrollando tus competencias.</p>
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
        <section className="trainee-metrics">
          <TraineeMetric Icon={CheckSquare} tone="violet" title="Evaluaciones realizadas" value="4" detail="Completadas" />
          <TraineeMetric Icon={TrendingUp} tone="green" title="Promedio de competencia" value="72%" detail="+12% vs. última evaluación" />
          <TraineeMetric Icon={BarChart3} tone="orange" title="Competencias en desarrollo" value="3" detail="Sigue así, vas por buen camino" />
        </section>
        <section className="trainee-grid">
          <CompetencyList onEvaluate={setSelectedCompetency} />
          <div className="trainee-side">
            <ProgressPanel />
          </div>
        </section>
        {selectedCompetency && (
          <EvaluationModal competency={selectedCompetency} onClose={() => setSelectedCompetency(null)} />
        )}
      </main>
    </div>
  );
}
