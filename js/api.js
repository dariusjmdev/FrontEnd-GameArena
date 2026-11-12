/** @file Comunicación HTTP con el servidor Spring Boot. */
import { conexion } from "./ui.js";

export const API_URL = "http://localhost:8080";

/**
 * Envía una petición y devuelve el JSON recibido, o null para HTTP 204.
 * Lanza un error si falla la conexión o el servidor responde con un error HTTP.
 * @param {string} ruta Ruta relativa a API_URL.
 * @param {object} opciones Método HTTP y cuerpo opcional.
 * @returns {Promise<*>} Datos devueltos por el servidor.
 */
export async function peticion(ruta, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), 12000);

  try {
    let respuesta;
    try {
      respuesta = await fetch(API_URL + ruta, {
        method,
        headers: body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });
    } catch (error) {
      conexion("Sin conexión", "error");
      throw new Error(error.name === "AbortError"
        ? "El servidor tarda demasiado en responder. Prueba a reconectar."
        : "No se puede conectar con " + API_URL
          + ". Comprueba que Spring Boot está arrancado y que CORS está permitido.");
    }

    conexion("Servidor conectado", "ok");
    if (respuesta.status === 204) return null;

    const texto = await respuesta.text();
    let datos = null;
    if (texto) {
      try { datos = JSON.parse(texto); }
      catch {
        if (respuesta.ok) throw new Error("El servidor no ha devuelto un JSON válido.");
      }
    }

    // fetch no lanza una excepción automáticamente por un HTTP 400, 404 o 500.
    if (!respuesta.ok) {
      const motivo = datos?.message || datos?.detail || datos?.error
        || texto.slice(0, 250) || respuesta.statusText;
      throw new Error("HTTP " + respuesta.status + ": " + motivo);
    }
    return datos;
  } finally {
    clearTimeout(temporizador);
  }
}
