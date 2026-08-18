import { Clock3, Home, LogOut, TrendingUp } from "lucide-react";
import umcLogo from "../../../assets/umc-logo.png";

function TraineeSidebar({ onLogout, active, onActive, onNavigate }) {
  const items = [
    [Home, "Inicio"],
    [TrendingUp, "Progreso"],
    [Clock3, "Historial"],
  ];
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
            className={active === label ? "active" : ""}
            onClick={() => (label === "Historial" ? onNavigate?.("mi-historial") : onActive(label))}
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

export default TraineeSidebar;
