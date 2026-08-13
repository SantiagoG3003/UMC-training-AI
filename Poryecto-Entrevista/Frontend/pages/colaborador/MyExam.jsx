// Vista "Mi historial" del Colaborador.
// A diferencia de pages/evaluador/Evaluations.jsx (que el Evaluador usa para ver
// las evaluaciones de TODOS los colaboradores), aquí el colaborador solo ve
// las evaluaciones que él mismo ha realizado. Los datos vienen de Firestore
// vía GET /api/evaluaciones/mias (incluyendo las preguntas y respuestas que
// se guardan al enviar una evaluación desde TraineePortal.jsx).
import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import MyExamSidebar from "./components/MyExamSidebar";
import MyExamList from "./components/MyExamList";
import MyExamDetail from "./components/MyExamDetail";
import { competencyStyle, formatDate, formatTime } from "./utils/myExamUtils";

// onNavigate: opcional, para conectar con la navegación del portal del
// colaborador (p. ej. volver a "Inicio" en TraineeHome.jsx o a "Progreso"
// en TraineeCompetencies.jsx).
export default function MyExam({ onLogout, onNavigate, token, profile }) {
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    apiFetch("/api/evaluaciones/mias", { token })
      .then((data) => {
        if (active) setRows(data.evaluaciones || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar tu historial.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="dashboard-page evaluations-page">
      <MyExamSidebar onLogout={onLogout} onNavigate={onNavigate} />
      <main className="content evaluations-content">
        {selectedEvaluation ? (
          <MyExamDetail
            evaluation={selectedEvaluation}
            profile={profile}
            onBack={() => setSelectedEvaluation(null)}
          />
        ) : (
          <MyExamList
            rows={rows}
            loading={loading}
            error={error}
            profile={profile}
            onSelect={setSelectedEvaluation}
          />
        )}
      </main>
    </div>
  );
}