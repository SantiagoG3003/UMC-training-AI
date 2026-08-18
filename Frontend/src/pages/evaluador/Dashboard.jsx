// Iconos reutilizables del dashboard.
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  ChevronDown,
  Home,
  Inbox,
  Lightbulb,
  LogOut,
  MessageCircle,
  Settings,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import umcLogo from "../../assets/umc-logo.png";
import { apiFetch } from "../../api";

const competencyIcons = {
  "Comunicación efectiva": MessageCircle,
  "Trabajo en equipo": Users,
  "Liderazgo": Lightbulb,
  "Resolución de problemas": Settings,
  "Orientación a resultados": TrendingUp,
};
const toneOrder = ["violet", "green", "blue", "orange"];
function toneFor(index) {
  return toneOrder[index % toneOrder.length];
}
function iconFor(competency) {
  return competencyIcons[competency] || Settings;
}

// Marca visual compartida en la parte superior del sidebar.
function Logo() {
  return (
    <div className="side-brand">
      <img src={umcLogo} alt="UMC Training AI" />
      <span>
        <b>UMC</b>
        <small>Training AI</small>
      </span>
    </div>
  );
}

// Navegación lateral. Solo Inicio está marcado como opción activa por ahora.
function Sidebar({ onLogout, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [Users, "Colaboradores"],
    [CheckSquare, "Evaluaciones"],
  ];
  return (
    <aside className="sidebar">
      <Logo />
      <nav>
        {items.map(([Icon, label], index) => (
          <button
            className={index === 0 ? "active" : ""}
            key={label}
            onClick={() => {
              if (label === "Colaboradores") onNavigate?.("colaboradores");
              if (label === "Evaluaciones") onNavigate?.("evaluaciones");
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

// Estado vacío reutilizable: se usa mientras no haya evaluaciones reales.
function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Inbox size={26} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

// Últimos 6 meses (incluyendo el actual), con el promedio real de score de
// las evaluaciones completadas en cada uno. Si un mes no tiene evaluaciones,
// queda con promedio null para que la línea del gráfico no invente datos.
function buildEvolution(evaluaciones) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      mes: d.toLocaleDateString("es-CO", { month: "short" }),
      total: 0,
      count: 0,
    };
  });
  evaluaciones.forEach((item) => {
    if (item.score === null || item.score === undefined || !item.date) return;
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const month = months.find((m) => m.key === key);
    if (month) {
      month.total += item.score;
      month.count += 1;
    }
  });
  return months.map((m) => ({
    mes: m.mes,
    promedio: m.count ? Math.round(m.total / m.count) : null,
  }));
}

// Composición principal: encabezado, métricas, análisis de brechas, gráfico y evaluaciones.
function Dashboard({ onLogout, onNavigate, token, profile }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch("/api/colaboradores", { token }),
      apiFetch("/api/evaluaciones", { token }),
    ])
      .then(([colaboradoresRes, evaluacionesRes]) => {
        if (!active) return;
        setColaboradores(colaboradoresRes.colaboradores || []);
        setEvaluaciones(evaluacionesRes.evaluaciones || []);
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

  const firstName = profile?.name?.split(" ")[0] || "Evaluador";
  const initials = profile?.initials || "EV";
  const roleLabel = profile?.role === "colaborador" ? "Colaborador" : "Evaluador";

  const avgScore = useMemo(() => {
    if (!evaluaciones.length) return null;
    const total = evaluaciones.reduce((sum, item) => sum + (item.score ?? 0), 0);
    return Math.round(total / evaluaciones.length);
  }, [evaluaciones]);

  const gapPromedio = avgScore === null ? null : Math.max(0, 100 - avgScore);

  // Promedio por competencia, ordenado de menor a mayor (las que más
  // necesitan refuerzo primero). Se muestran hasta 4.
  const competencyGaps = useMemo(() => {
    const byCompetency = {};
    evaluaciones.forEach((item) => {
      if (item.score === null || item.score === undefined) return;
      if (!byCompetency[item.competency]) {
        byCompetency[item.competency] = { total: 0, count: 0 };
      }
      byCompetency[item.competency].total += item.score;
      byCompetency[item.competency].count += 1;
    });
    return Object.entries(byCompetency)
      .map(([competency, { total, count }]) => ({
        competency,
        avg: Math.round(total / count),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 4);
  }, [evaluaciones]);

  const evolutionData = useMemo(() => buildEvolution(evaluaciones), [evaluaciones]);
  const hasEvolutionData = evolutionData.some((item) => item.promedio !== null);

  // Las últimas 4, ya vienen ordenadas por fecha descendente desde el backend.
  // (4 en vez de 5 para que la tarjeta no empuje la página a scroll vertical).
  const latestEvaluations = evaluaciones.slice(0, 4);

  const metrics = [
    [
      UsersRound,
      "violet",
      "Colaboradores",
      loading ? "—" : String(colaboradores.length),
      "Activos",
    ],
    [
      CheckSquare,
      "green",
      "Evaluaciones",
      loading ? "—" : String(evaluaciones.length),
      evaluaciones.length ? "Completadas" : "Aún sin datos",
    ],
    [
      TrendingUp,
      "blue",
      "Nivel promedio",
      avgScore === null ? "—" : `${avgScore}%`,
      avgScore === null ? "Aún sin datos" : "Promedio del equipo",
    ],
    [
      AlertTriangle,
      "orange",
      "Lo que falta en promedio",
      gapPromedio === null ? "—" : `${gapPromedio}%`,
      gapPromedio === null ? "Aún sin datos" : "Para llegar al 100%",
    ],
  ];

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content">
        <header className="topbar">
          <div>
            <h1>
              ¡Bienvenido, {firstName}! <span>👋</span>
            </h1>
            <p>Aquí tienes un resumen general del desempeño del equipo.</p>
          </div>
          <div className="profile">
            <div className="user-avatar">{initials}</div>
            <div>
              <b>{profile?.name || "Evaluador"}</b>
              <small>{roleLabel}</small>
            </div>
            <ChevronDown className="chevron" size={17} />
          </div>
        </header>
        <section className="metrics">
          {metrics.map(([Icon, tone, title, value, detail]) => (
            <article className="metric" key={title}>
              <span className={`metric-icon ${tone}`}>
                <Icon />
              </span>
              <div>
                <small>{title}</small>
                <strong>{value}</strong>
                <em className={title.includes("falta") ? "down" : ""}>
                  {detail}
                </em>
              </div>
            </article>
          ))}
        </section>
        <section className="insights">
          <article className="card gaps">
            <div className="card-title">
              <h2>Competencias con más por mejorar</h2>
              <a href="#todas">Ver todas</a>
            </div>
            {error ? (
              <EmptyState
                title="No se pudo cargar la información"
                description={error}
              />
            ) : !loading && competencyGaps.length === 0 ? (
              <EmptyState
                title="Aún no hay evaluaciones"
                description="Cuando el equipo complete evaluaciones, aquí vas a ver qué competencias necesitan más refuerzo."
              />
            ) : (
              competencyGaps.map((item, index) => {
                const Icon = iconFor(item.competency);
                const tone = toneFor(index);
                return (
                  <div className="gap" key={item.competency}>
                    <span className={`gap-icon ${tone}`}>
                      <Icon size={14} />
                    </span>
                    <b>{item.competency}</b>
                    <div className="progress">
                      <i style={{ width: `${item.avg}%` }} />
                    </div>
                    <strong>{item.avg}%</strong>
                  </div>
                );
              })
            )}
          </article>
          <article className="card performance">
            <div className="card-title">
              <h2>Evolución del desempeño del equipo</h2>
              <button>
                Últimos 6 meses <ChevronDown size={13} />
              </button>
            </div>
            {error ? (
              <EmptyState
                title="No se pudo cargar la información"
                description={error}
              />
            ) : !loading && !hasEvolutionData ? (
              <EmptyState
                title="Todavía no hay datos"
                description="Este gráfico se va a completar a medida que se registren evaluaciones."
              />
            ) : (
              <div className="recharts-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={evolutionData}
                    margin={{ top: 5, right: 12, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eef0f6"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 10, fill: "#8992ab" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#8992ab" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      formatter={(value) =>
                        value === null ? "Sin datos" : [`${value}%`, "Promedio"]
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="promedio"
                      stroke="#6532dc"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#6532dc" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </section>
        <section className="card evaluations">
          <div className="card-title">
            <h2>Últimas evaluaciones realizadas</h2>
            <a href="#todas">Ver todas</a>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <span>Colaborador</span>
              <span>Competencia</span>
              <span>Fecha</span>
              <span>Resultado</span>
              <span>Estado</span>
            </div>
            {!loading &&
              !error &&
              latestEvaluations.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="person">
                    <i>{item.initials || "—"}</i>
                    <b>{item.name}</b>
                  </div>
                  <span>{item.competency}</span>
                  <span>
                    {item.date
                      ? new Date(item.date).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                  <b>{item.score === null || item.score === undefined ? "—" : `${item.score}%`}</b>
                  <mark>{item.level || "Completada"}</mark>
                </div>
              ))}
          </div>
          {error ? (
            <EmptyState
              title="No se pudo cargar la información"
              description={error}
            />
          ) : !loading && latestEvaluations.length === 0 ? (
            <EmptyState
              title="Sin evaluaciones registradas"
              description="Las evaluaciones que se completen van a aparecer acá."
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;