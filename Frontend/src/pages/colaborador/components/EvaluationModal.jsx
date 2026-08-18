import { useEffect, useState } from "react";
import { BrainCircuit, Sparkles, X } from "lucide-react";
import { apiFetch } from "../../../api";

/**
 * COMPONENTE: EvaluationModal
 * PROPÓSITO: Modal para que el colaborador responda preguntas de evaluación de una competencia
 * 
 * FLUJO DE INTERACCIÓN:
 * 1. Usuario hace click en "Evaluar competencia"
 * 2. Se abre el modal con competencia seleccionada
 * 3. La IA genera 3 preguntas dinámicas para esa competencia
 * 4. Colaborador escribe respuestas (máx 3)
 * 5. Hace click en "Enviar"
 * 6. Backend califica con IA (genera score, nivel, feedback)
 * 7. Se muestra resultado en el mismo modal
 * 
 * PROPS:
 * - competency: objeto con name, Icon, tone (ej: "Comunicación efectiva", MessageCircle, "green")
 * - onClose: callback para cerrar el modal
 * - token: token JWT del usuario logueado (para autenticar peticiones a la API)
 * - onSaved: callback para refrescar lista de evaluaciones después de guardar
 */
function EvaluationModal({ competency, onClose, token, onSaved }) {
  // ============ ESTADO GENERAL ============
  const [aiQuestions, setAiQuestions] = useState([]); // Array de preguntas generadas por IA
  const [loadingQuestions, setLoadingQuestions] = useState(true); // ¿Cargando preguntas?
  const [questionsError, setQuestionsError] = useState(""); // Error al cargar preguntas
  
  // ============ ESTADO DE RESPUESTAS ============
  const [answers, setAnswers] = useState(["", "", ""]); // 3 campos de respuesta (índices 0,1,2)
  
  // ============ ESTADO DE FLUJO ============
  const [submitted, setSubmitted] = useState(false); // ¿Ya envió respuestas?
  const [result, setResult] = useState(null); // Resultado de calificación IA {score, level, resumen, fortalezas, areasDeMejora}
  
  // ============ ESTADO DE CONFIRMACIONES ============
  const [confirmExit, setConfirmExit] = useState(false); // ¿Mostrar dialog de salida?
  const [confirmSubmit, setConfirmSubmit] = useState(false); // ¿Mostrar dialog de confirmar envío?
  
  // ============ ESTADO DE GUARDADO ============
  const [saving, setSaving] = useState(false); // ¿Guardando evaluación?
  const [error, setError] = useState(""); // Error al guardar
  
  const Icon = competency.Icon; // Ícono de la competencia (ej: MessageCircle)
  
  // Shortcuts para abrir dialogs de confirmación
  const requestClose = () => setConfirmExit(true);
  const requestSubmit = () => setConfirmSubmit(true);

  /**
   * EFECTO: Cargar preguntas de la IA al abrir modal
   * DISPARO: Cuando cambia [token, competency.name]
   * PASOS:
   * 1. Validar que existe token (si no, retornar)
   * 2. Marcar active=true (para limpiar si componente se desmonta)
   * 3. Mostrar loading
   * 4. Llamar API: GET /api/evaluaciones/preguntas/:competencyName
   * 5. Si éxito: guardar preguntas, inicializar array de respuestas vacías
   * 6. Si error: guardar mensaje de error
   * 7. Cleanup: si se desmonta, marcar active=false
   */
  useEffect(() => {
    if (!token) return undefined;
    let active = true; // Flag para evitar state update en componente desmontado
    setLoadingQuestions(true);
    setQuestionsError("");
    
    // Llamar API para obtener preguntas generadas dinámicamente
    apiFetch(`/api/evaluaciones/preguntas/${encodeURIComponent(competency.name)}`, { token })
      .then((data) => {
        if (active) {
          // Guardar preguntas de la IA
          setAiQuestions(data.preguntas || []);
          // Inicializar array de respuestas vacías (una por cada pregunta)
          setAnswers((data.preguntas || []).map(() => ""));
        }
      })
      .catch((err) => {
        if (active) setQuestionsError(err.message || "No se pudieron generar las preguntas.");
      })
      .finally(() => {
        if (active) setLoadingQuestions(false);
      });
    return () => {
      active = false; // Limpiar flag si componente se desmonta
    };
  }, [token, competency.name]);

  // Guarda la evaluación (pregunta + respuesta de cada ítem) en Firestore
  // a través de /api/evaluaciones. La IA la califica en el backend antes de
  // guardarla, y esa misma respuesta trae la nota y el feedback reales.
  async function handleConfirmSubmit() {
    setSaving(true);
    setError("");
    try {
      const respuestas = aiQuestions.map((question, index) => ({
        question,
        answer: answers[index],
      }));
      const data = await apiFetch("/api/evaluaciones", {
        method: "POST",
        token,
        body: JSON.stringify({ competency: competency.name, respuestas }),
      });
      setResult(data);
      setSubmitted(true);
      setConfirmSubmit(false);
      onSaved?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="trainee-modal-backdrop" onMouseDown={requestClose}>
      <section
        className="trainee-evaluation-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Evaluar ${competency.name}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
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
        <p className="modal-intro">
          Responde las tres preguntas. La IA analizará claridad, aplicación práctica y enfoque colaborativo.
        </p>
        <div className="ai-questions">
          {loadingQuestions ? (
            <p>Cargando preguntas…</p>
          ) : questionsError ? (
            <p className="evaluation-submit-error">{questionsError}</p>
          ) : (
            aiQuestions.map((question, index) => (
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
            ))
          )}
        </div>
        {submitted && result && (
          <section className="modal-feedback">
            <h3>
              <BrainCircuit size={19} />
              Comentarios de la IA
            </h3>
            <div>
              <b>Resultado: {result.score}% · {result.level}</b>
              <p>{result.resumen}</p>
            </div>
            <ul>
              {(result.fortalezas || []).map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
              {(result.areasDeMejora || []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        )}
        <footer>
          <button className="cancel-evaluation" onClick={requestClose}>
            Cancelar
          </button>
          <button
            className="submit-evaluation"
            onClick={requestSubmit}
            disabled={submitted || saving || loadingQuestions || aiQuestions.length === 0}
          >
            <Sparkles size={17} />
            {submitted ? "Evaluación analizada" : "Enviar"}
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
        {confirmSubmit && (
          <div className="evaluation-exit-confirmation" role="alertdialog" aria-modal="true" aria-label="Confirmar envío">
            <div>
              <h3>¿Enviar tu evaluación?</h3>
              <p>Se guardarán tus preguntas y respuestas. No podrás editarlas después de enviarlas.</p>
              {error && <p className="evaluation-submit-error">{error}</p>}
              <footer>
                <button onClick={() => setConfirmSubmit(false)} disabled={saving}>
                  Seguir editando
                </button>
                <button onClick={handleConfirmSubmit} disabled={saving}>
                  {saving ? "Enviando..." : "Confirmar envío"}
                </button>
              </footer>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default EvaluationModal;
