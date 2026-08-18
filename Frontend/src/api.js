// Todas las llamadas al backend pasan por acá. Cambia API_URL si tu
// backend corre en otra dirección (por ejemplo cuando lo subas a un
// servidor real).
export const API_URL = "http://localhost:4000";

export async function apiFetch(path, { token, ...options } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Error al comunicarse con el servidor.");
  }
  return data;
}
