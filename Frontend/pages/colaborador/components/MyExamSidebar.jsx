import { Clock3, Home, LogOut, TrendingUp } from "lucide-react";
import umcLogo from "../../../assets/umc-logo.png";

function MyExamSidebar({ onLogout, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [TrendingUp, "Progreso"],
    [Clock3, "Historial"],
  ];
  const targets = { Inicio: "mi-espacio", Progreso: "mi-progreso", Historial: "mi-historial" };
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
            className={label === "Historial" ? "active" : ""}
            onClick={() => onNavigate?.(targets[label])}
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

export default MyExamSidebar;
