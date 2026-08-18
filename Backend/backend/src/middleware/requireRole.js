// Se usa DESPUÉS de verifyToken. Revisa que req.userProfile (ya cargado
// desde Firestore por getUserProfile) tenga el rol permitido.
//
// Ejemplo de uso en una ruta:
//   router.get("/colaboradores", verifyToken, loadProfile, requireRole("evaluador"), controller)

export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    const rol = req.userProfile?.role;
    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: "No tienes permiso para esto." });
    }
    next();
  };
}
