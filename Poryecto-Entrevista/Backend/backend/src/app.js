import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import dashboardRoutes from "./dashboard/dashboard.routes.js";
import colaboradoresRoutes from "./colaboradores/colaboradores.routes.js";
import evaluacionesRoutes from "./evaluaciones/evaluaciones.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/colaboradores", colaboradoresRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);

// Manejador de errores general
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

export default app;
