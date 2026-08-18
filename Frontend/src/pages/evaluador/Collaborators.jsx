import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckSquare,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Eye,
  EyeOff,
  Filter,
  Home,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Users,
  X,
  MessageCircle,
  Lightbulb,
  LogOut,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import umcLogo from "../../assets/umc-logo.png";
import { apiFetch } from "../../api";

// Mismos colores que usa el resto del panel (skill-icons, new-competency-icon)
// para cada "tone" de competencia, en hex, porque recharts necesita colores
// reales y no puede leer las clases CSS.
const chartColors = {
  green: "#03a34d",
  orange: "#ff7200",
  blue: "#1739d9",
  pink: "#e82d68",
  purple: "#5133d3",
};

const competencyDefinitions = [
  {
    name: "Comunicaci\u00f3n efectiva",
    description: "Expresa ideas de forma clara y escucha activamente.",
    Icon: MessageCircle,
    tone: "green",
  },
  {
    name: "Trabajo en equipo",
    description: "Colabora y contribuye al logro de objetivos comunes.",
    Icon: Users,
    tone: "orange",
  },
  {
    name: "Liderazgo",
    description: "Inspira y gu\u00eda al equipo hacia los objetivos.",
    Icon: Lightbulb,
    tone: "blue",
  },
  {
    name: "Resoluci\u00f3n de problemas",
    description: "Analiza situaciones y propone soluciones efectivas.",
    Icon: Settings,
    tone: "pink",
  },
  {
    name: "Orientaci\u00f3n a resultados",
    description: "Se enfoca en cumplir metas y superar expectativas.",
    Icon: TrendingUp,
    tone: "purple",
  },
];

// Convierte un ISO string (createdAt de Firestore) a "10 May 2024".
function formatDate(iso) {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date
    .toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    .replace(".", "")
    .replace(/^(\d+) (\w)/, (_, d, l) => `${d} ${l.toUpperCase()}`);
}

// Igual que formatDate pero con hora (día + hora:minuto), para usar como
// etiqueta del eje X en la gráfica de evolución: varias evaluaciones pueden
// caer el mismo día, y sin la hora todas las etiquetas se verían idénticas.
function formatDateTime(iso) {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  const day = date
    .toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    .replace(".", "")
    .replace(/^(\d+) (\w)/, (_, d, l) => `${d} ${l.toUpperCase()}`);
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

function Sidebar({ onLogout, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [Users, "Colaboradores"],
    [CheckSquare, "Evaluaciones"],
  ];
  return (
    <aside className="sidebar collaborators-sidebar">
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
            className={label === "Colaboradores" ? "active" : ""}
            onClick={() => {
              if (label === "Inicio") onNavigate("inicio");
              if (label === "Evaluaciones") onNavigate("evaluaciones");
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

function SkillIcons({ names = [] }) {
  const matched = competencyDefinitions.filter((c) => names.includes(c.name));
  if (matched.length === 0) {
    return <div className="skill-cell"><small className="no-skills">Sin competencias</small></div>;
  }
  return (
    <div className="skill-cell">
      <div className="skill-icons">
        {matched.map(({ name, Icon, tone }) => (
          <i className={tone} key={name} aria-label={name}>
            <Icon size={15} />
          </i>
        ))}
      </div>
    </div>
  );
}

// Calcula, para cada competencia asignada al colaborador, la nota más
// reciente, la nota inicial (primera evaluación de esa competencia) y
// cuántas veces se evaluó. Solo se cuentan evaluaciones ya calificadas
// (score numérico); si la IA aún no calificó una, no cuenta para el
// promedio, pero sí para el total de "Evaluaciones realizadas".
function buildCompetencyProgress(names, evaluaciones) {
  return competencyDefinitions
    .filter((c) => names.includes(c.name))
    .map((def) => {
      const propias = evaluaciones
        .filter((e) => e.competency === def.name && typeof e.score === "number")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const initial = propias[0]?.score ?? null;
      const latest = propias[propias.length - 1]?.score ?? null;
      const gap = latest === null ? null : 100 - latest;
      return { ...def, initial, latest, count: propias.length, gap };
    });
}

// Arma los puntos para la gráfica de evolución: una fila por cada DÍA en el
// que se calificó al menos una competencia (agrupando por día, no por
// timestamp exacto, para que evaluaciones del mismo día caigan en el mismo
// punto y el tooltip pueda mostrarlas juntas). Si una competencia no fue
// evaluada ese día, su clave queda vacía y la línea salta al siguiente punto
// real gracias a connectNulls.
// Arma los puntos para la gráfica de evolución: un punto por cada momento
// exacto (fecha + hora) en que se calificó al menos una competencia. Si
// varias evaluaciones caen en el mismo instante exacto (poco común, pero
// puede pasar si se guardan en lote), se agrupan en un solo punto; si no,
// cada evaluación es su propio punto en el eje X, con su hora en la
// etiqueta para que no se vean todas iguales aunque sean del mismo día.
function buildEvolutionData(names, evaluaciones) {
  const scored = evaluaciones.filter(
    (e) => names.includes(e.competency) && typeof e.score === "number",
  );
  const byMoment = new Map();
  scored.forEach((e) => {
    const parsed = new Date(e.date);
    const key = Number.isNaN(parsed.getTime()) ? e.date : parsed.getTime();
    if (!byMoment.has(key)) {
      byMoment.set(key, {
        timestamp: Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime(),
        label: formatDateTime(e.date),
        entries: [],
      });
    }
    byMoment.get(key).entries.push(e);
  });
  return [...byMoment.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ label, entries }) => {
      const row = { label };
      names.forEach((name) => {
        const forName = entries.filter((e) => e.competency === name);
        if (forName.length) row[name] = forName[forName.length - 1].score;
      });
      return row;
    });
}

// Tooltip propio para la gráfica de evolución: el Tooltip por defecto de
// recharts termina mostrando solo la primera serie con valor. Aquí filtramos
// a las competencias que sí tienen dato en ese punto y las listamos todas.
function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const items = payload.filter((item) => item.value !== undefined && item.value !== null);
  if (!items.length) return null;
  return (
    <div className="chart-tooltip">
      <b>{label}</b>
      {items.map((item) => (
        <span key={item.dataKey} style={{ color: item.stroke || item.color }}>
          {item.dataKey} : {item.value}%
        </span>
      ))}
    </div>
  );
}

function gapClass(gap) {
  if (gap === null) return "";
  if (gap <= 15) return "low-gap";
  if (gap <= 35) return "medium-gap";
  return "high-gap";
}

function CollaboratorModal({ collaborator, onClose, token }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loadingEval, setLoadingEval] = useState(true);
  const [evalError, setEvalError] = useState("");

  useEffect(() => {
    if (!collaborator || !token) return undefined;
    let active = true;
    setLoadingEval(true);
    setEvalError("");
    apiFetch(`/api/evaluaciones/colaborador/${collaborator.id}`, { token })
      .then((data) => {
        if (active) setEvaluaciones(data.evaluaciones || []);
      })
      .catch((err) => {
        if (active) setEvalError(err.message || "No se pudieron cargar las evaluaciones.");
      })
      .finally(() => {
        if (active) setLoadingEval(false);
      });
    return () => {
      active = false;
    };
  }, [collaborator, token]);

  if (!collaborator) return null;
  const { name, id, position: job, competencies: names = [], createdAt, initials, email } =
    collaborator;
  const progreso = buildCompetencyProgress(names, evaluaciones);
  const gapsConDatos = progreso.filter((c) => c.gap !== null).map((c) => c.gap);
  const avgGap =
    gapsConDatos.length === 0
      ? null
      : Math.round(gapsConDatos.reduce((sum, g) => sum + g, 0) / gapsConDatos.length);
  const evolutionData = buildEvolutionData(names, evaluaciones);
  const comparisonData = progreso.map((c) => ({
    name: c.name,
    Inicial: c.initial ?? 0,
    Actual: c.latest ?? 0,
  }));
  const pieData = progreso
    .filter((c) => typeof c.latest === "number" && c.latest > 0)
    .map((c) => ({ name: c.name, value: c.latest, tone: c.tone }));
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="collaborator-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${name}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header modal-actions-header">
          <div>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={19} />
            </button>
          </div>
        </header>
        <div className="modal-overview">
          <article className="modal-profile">
            <i>{initials}</i>
            <span>
              <b>
                <Users size={15} /> ID: {id}
              </b>
              <b>
                <Mail size={15} /> Correo: {email || "No disponible"}
              </b>
              <b>
                <CalendarDays size={15} /> Ingreso: {formatDate(createdAt)}
              </b>
            </span>
          </article>
          <article>
            <small>☆ &nbsp; Competencias</small>
            <strong>{names.length}</strong>
            <em>Asignadas</em>
          </article>
          <article>
            <small>▣ &nbsp; Evaluaciones</small>
            <strong>{loadingEval ? "—" : evaluaciones.length}</strong>
            <em>Realizadas</em>
          </article>
          <article>
            <small>♤ &nbsp; Cargo</small>
            <strong className="job-value">{job || "Sin cargo"}</strong>
            <em>Puesto actual</em>
          </article>
          <article className="gap-metric">
            <small>◇ &nbsp; Brecha promedio</small>
            <strong>{loadingEval ? "—" : avgGap === null ? "—" : `${avgGap}%`}</strong>
            <em>General</em>
          </article>
        </div>

        <div className="modal-content-grid">
          <article className="modal-card modal-competencies">
            <h3>
              Competencias asignadas <small>{names.length} competencias</small>
            </h3>
            {loadingEval ? (
              <p className="filter-note">Cargando evaluaciones…</p>
            ) : evalError ? (
              <p className="filter-note">{evalError}</p>
            ) : progreso.length === 0 ? (
              <p className="filter-note">
                Este colaborador todavía no tiene competencias asignadas.
              </p>
            ) : (
              <>
                <div className="competency-column-head">
                  <span>Competencia</span>
                  <span>Nivel inicial</span>
                  <span>Nivel actual</span>
                  <span>Evaluaciones</span>
                  <span>Brecha</span>
                </div>
                {progreso.map(({ name: item, description, Icon, tone, initial, latest, count, gap }) => (
                  <div className="modal-competency" key={item}>
                    <span>
                      <i className={tone}>
                        <Icon size={15} />
                      </i>
                      <b>
                        {item}
                        <small>{description}</small>
                      </b>
                    </span>
                    <div className="level">
                      <i style={{ "--fill": `${initial ?? 0}%` }} />
                      <em>{initial === null ? "—" : `${initial}%`}</em>
                    </div>
                    <div className="level current-level">
                      <i style={{ "--fill": `${latest ?? 0}%` }} />
                      <em>{latest === null ? "—" : `${latest}%`}</em>
                    </div>
                    <strong>{count}</strong>
                    <mark className={gapClass(gap)}>
                      {gap === null ? "Sin datos" : `${gap}%`}
                    </mark>
                  </div>
                ))}
              </>
            )}
            {!loadingEval && !evalError && evaluaciones.length === 0 && (
              <footer className="gap-legend">
                <p className="filter-note">
                  Aún no hay evaluaciones registradas para este colaborador, por
                  lo que no es posible mostrar progreso ni brechas todavía.
                </p>
              </footer>
            )}
          </article>

          <article className="modal-card modal-chart-card">
            <h3>Evolución en el tiempo</h3>
            {loadingEval ? (
              <p className="filter-note">Cargando evaluaciones…</p>
            ) : evolutionData.length < 2 ? (
              <p className="filter-note">
                Se necesitan al menos dos evaluaciones calificadas para
                mostrar una evolución.
              </p>
            ) : (
              <>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData} margin={{ top: 10, right: 14, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#edf0f7" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#3d4778", fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#3d4778", fontSize: 10 }}
                      />
                      <Tooltip content={<EvolutionTooltip />} />
                      {progreso.map((c) => (
                        <Line
                          key={c.name}
                          type="monotone"
                          dataKey={c.name}
                          stroke={chartColors[c.tone] || "#4820e4"}
                          strokeWidth={2.5}
                          dot={{ r: 3.5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <ul className="chart-inline-legend">
                  {progreso.map((c) => (
                    <li key={c.name}>
                      <i style={{ background: chartColors[c.tone] || "#4820e4" }} />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>

          <article className="modal-card modal-chart-card">
            <h3>Distribución de competencias</h3>
            {loadingEval ? (
              <p className="filter-note">Cargando evaluaciones…</p>
            ) : pieData.length === 0 ? (
              <p className="filter-note">
                Aún no hay niveles actuales calificados para mostrar la
                distribución.
              </p>
            ) : (
              <>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={chartColors[entry.tone] || "#4820e4"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="chart-inline-legend">
                  {pieData.map((c) => (
                    <li key={c.name}>
                      <i style={{ background: chartColors[c.tone] || "#4820e4" }} />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>

          <article className="modal-card modal-chart-card">
            <h3>Comparación: inicial vs. actual</h3>
            {loadingEval ? (
              <p className="filter-note">Cargando evaluaciones…</p>
            ) : progreso.length === 0 ? (
              <p className="filter-note">
                Este colaborador todavía no tiene competencias asignadas.
              </p>
            ) : (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 14, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#edf0f7" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#3d4778", fontSize: 9 }}
                      interval={0}
                      tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#3d4778", fontSize: 10 }}
                    />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Inicial" fill="#cdc3ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#5320e4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

const availableCompetencies = competencyDefinitions;

function NewCollaboratorModal({ onClose, onSuccess, token }) {
  const [form, setForm] = useState({ name: "", job: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleCompetency = (name) => {
    setError("");
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : current.length < 5
          ? [...current, name]
          : current,
    );
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (selected.length < 3) {
      setError("Selecciona al menos 3 competencias para continuar.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        token,
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          role: "colaborador",
          position: form.job,
          competencies: selected,
        }),
      });
      onSuccess?.(form.name);
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el colaborador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-modal-backdrop" onMouseDown={onClose}>
      <form
        className="new-collaborator-modal"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2>Nuevo colaborador</h2>
            <p>Completa sus datos y asígnale las competencias que va a desarrollar.</p>
          </div>
          <button
            type="button"
            className="new-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </header>
        <section className="new-form-section">
          <h3>Información básica</h3>
          <label>
            Nombre completo
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: María Gómez López"
              required
            />
          </label>
          <label>
            Cargo
            <input
              value={form.job}
              onChange={(e) => setForm({ ...form, job: e.target.value })}
              placeholder="Ej: Frontend Developer"
              required
            />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Ej: maria.gomez@empresa.com"
              required
            />
          </label>
          <div className="new-password-row">
            <label>
              Contraseña
              <div className="new-password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  className="new-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label>
              Confirmar contraseña
              <div className="new-password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                  required
                />
                <button
                  type="button"
                  className="new-password-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>
        </section>
        <section className="competencies-selector">
          <div className="competencies-heading">
            <h3>
              Asignar competencias <small>(Selecciona de 3 a 5)</small>
            </h3>
            <span className={`competencies-count ${selected.length >= 3 ? "ok" : ""}`}>
              {selected.length} seleccionada{selected.length === 1 ? "" : "s"}
            </span>
          </div>
          {availableCompetencies.map(({ name, description, Icon, tone }) => {
            const checked = selected.includes(name);
            return (
              <label
                className={`new-competency ${checked ? "checked" : ""}`}
                key={name}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCompetency(name)}
                />
                <span className={`new-competency-icon ${tone}`}>
                  <Icon size={15} />
                </span>
                <span>
                  <b>{name}</b>
                  <small>{description}</small>
                </span>
                <i className="new-checkbox">{checked && "✓"}</i>
              </label>
            );
          })}
          {error && <p className="form-error">{error}</p>}
        </section>
        <footer>
          <button type="button" className="cancel-new" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="save-new" disabled={saving}>
            {saving ? "Guardando..." : "Guardar colaborador"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function Collaborators({ onLogout, onNavigate, token }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Todos los cargos");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [showNewCollaborator, setShowNewCollaborator] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCollaborators = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiFetch("/api/colaboradores", { token });
      setCollaborators(data.colaboradores || []);
    } catch (err) {
      setLoadError(err.message || "No se pudieron cargar los colaboradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, [token]);

  const handleCollaboratorCreated = (name) => {
    setSuccessToast(`${name || "El colaborador"} fue registrado correctamente.`);
    window.clearTimeout(handleCollaboratorCreated._t);
    handleCollaboratorCreated._t = window.setTimeout(() => setSuccessToast(""), 4000);
    loadCollaborators();
  };
  const filtered = useMemo(
    () =>
      collaborators.filter(
        (c) =>
          `${c.name} ${c.id} ${c.position}`.toLowerCase().includes(query.toLowerCase()) &&
          (role === "Todos los cargos" || c.position === role),
      ),
    [collaborators, query, role],
  );
  const roles = [
    "Todos los cargos",
    ...new Set(collaborators.map((c) => c.position).filter(Boolean)),
  ];

  return (
    <div className="dashboard-page collaborators-page">
      <Sidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content collaborators-content">
        <header className="collaborators-header">
          <div>
            <h1>Colaboradores</h1>
            <p>
              Gestiona las personas del equipo y las competencias asignadas.
            </p>
          </div>
          <div className="collaborators-actions">
 
            <div className="profile">
              <div className="user-avatar">CM</div>
              <div>
                <b>Carlos Méndez</b>
                <small>Evaluador</small>
              </div>
              <ChevronDown className="chevron" size={17} />
            </div>
            
          </div>
        </header>
        <section className="collaborators-card">
          <div className="filters-row">
            <label className="search-field">
              <Search size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar colaborador..."
              />
            </label>
            <label className="select-field">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
            <button
              className={
                showFilters ? "filter-button selected" : "filter-button"
              }
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filtros
            </button>
            <button
              className="add-collaborator"
              onClick={() => setShowNewCollaborator(true)}
            >
              <Plus size={18} />
              Nuevo colaborador
            </button>
          </div>
          {showFilters && (
            <div className="filter-note">
              Usa los campos para filtrar por cargo o estado.
            </div>
          )}
          {loading && <div className="filter-note">Cargando colaboradores...</div>}
          {!loading && loadError && (
            <div className="filter-note">
              {loadError}{" "}
              <button type="button" className="cancel-new" onClick={loadCollaborators}>
                Reintentar
              </button>
            </div>
          )}
          {!loading && !loadError && (
            <div className="collaborators-table">
              <div className="collaborators-row collaborators-head">
                <span>Colaborador</span>
                <span>Cargo</span>
                <span>Fecha de ingreso</span>
                <span>Competencias asignadas</span>
                <span>Correo</span>
                <span>Accion</span>
              </div>
              {filtered.length === 0 && (
                <div className="filter-note">
                  No hay colaboradores que coincidan con la búsqueda.
                </div>
              )}
              {filtered.map((c) => (
                <div className="collaborators-row" key={c.id}>
                  <div className="collaborator-name">
                    <i className={`avatar avatar-${c.id.slice(-1)}`}>
                      {c.initials}
                    </i>
                    <span>
                      <b>{c.name}</b>
                      <small>ID: {c.id}</small>
                    </span>
                  </div>
                  <span className="job">{c.position || "Sin cargo"}</span>
                  <span className="job">{formatDate(c.createdAt)}</span>
                  <SkillIcons names={c.competencies} />
                  <span className="job">{c.email || "No disponible"}</span>
                  <div className="row-actions">
                    <button
                      aria-label={`Ver ${c.name}`}
                      onClick={() => setSelectedCollaborator(c)}
                    >
                      <Eye size={19} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <CollaboratorModal
        collaborator={selectedCollaborator}
        onClose={() => setSelectedCollaborator(null)}
        token={token}
      />
      {showNewCollaborator && (
        <NewCollaboratorModal
          onClose={() => setShowNewCollaborator(false)}
          onSuccess={handleCollaboratorCreated}
          token={token}
        />
      )}
      {successToast && (
        <div className="success-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setSuccessToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}