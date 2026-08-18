import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseClient";
import { apiFetch } from "../api";
import umcLogo from "../assets/umc-logo.png";
import analyticsIllustration from "../assets/growth-analytics.svg";
import "../styles/Login.css";

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Login real con Firebase (correo + contraseña).
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      // 2. Le preguntamos al backend quién es (nombre, rol, etc.),
      // usando ese token como comprobante de que ya inició sesión.
      const { uid, profile } = await apiFetch("/api/auth/session", { token });

      // 3. Le pasamos al resto de la app el usuario ya identificado.
      onLogin({ uid, token, profile });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-logo-wrap">
          <img className="login-logo" src={umcLogo} alt="" />
          <span className="login-logo-text"><strong>UMC</strong><small>TRAINING AI</small></span>
        </div>
        <div className="login-brand-copy">
          <h1>Evalúa. Desarrolla.<br /><span>Crece.</span></h1>
          <p>Plataforma inteligente para la evaluación y seguimiento de las competencias.</p>
        </div>
        <img className="login-illustration" src={analyticsIllustration} alt="Ilustración de análisis de desempeño" />
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Iniciar sesión</h2>
          <p className="login-welcome">Bienvenido de nuevo a <span>UMC Training AI</span></p>

          <label htmlFor="email">Correo electrónico</label>
          <div className="login-input">
            <Mail size={18} />
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Ejemplo@umc.co" required />
          </div>

          <label htmlFor="password">Contraseña</label>
          <div className="login-input">
            <LockKeyhole size={18} />
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••" required />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <a className="forgot-password" href="#recuperar">¿Olvidaste tu contraseña?</a>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
          <p className="login-help">¿No tienes una cuenta? <a href="#administrador">Contacta con tu administrador</a></p>
        </form>
      </section>
    </main>
  );
}

// Traduce los errores de Firebase a mensajes que la gente entiende.
function mensajeDeError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Correo o contraseña incorrectos.";
  }
  if (code.includes("too-many-requests")) {
    return "Hubo muchos intentos. Espera un momento e intenta de nuevo.";
  }
  return err.message || "No se pudo iniciar sesión. Intenta de nuevo.";
}
