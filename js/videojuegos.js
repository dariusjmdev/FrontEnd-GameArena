/** @file Alta, listado y búsqueda de videojuegos. */
import { peticion } from "./api.js";
import { $, celda, idValido, mensajeTabla, rellenarSelector, textoObligatorio } from "./ui.js";

// 1. GET /videojuegos: rellena la tabla y los selectores de videojuegos.
export async function cargarVideojuegos() {
  mensajeTabla("cuerpoVideojuegos", 3, "Cargando videojuegos…");
  try {
    const videojuegos = await peticion("/videojuegos");
    $("cuerpoVideojuegos").replaceChildren();
    for (const juego of videojuegos) {
      const fila = document.createElement("tr");
      [juego.id, juego.nombre, juego.genero].forEach((valor) => celda(fila, valor));
      $("cuerpoVideojuegos").append(fila);
    }
    if (!videojuegos.length) {
      mensajeTabla("cuerpoVideojuegos", 3, "Todavía no hay videojuegos. Crea el primero.");
    }
    $("totalVideojuegos").textContent = videojuegos.length;
    rellenarSelector("tVideojuego", videojuegos, (j) => j.nombre, "Selecciona un videojuego");
    rellenarSelector("filtroVideojuego", videojuegos, (j) => j.nombre, "Todos");
  } catch (error) {
    $("totalVideojuegos").textContent = "—";
    mensajeTabla("cuerpoVideojuegos", 3, "No se pudieron cargar los videojuegos. Usa Reconectar.");
    throw error;
  }
}

// 2. GET /videojuegos/{id}
export async function buscarVideojuego() {
  $("resJuego").textContent = "";
  const juego = await peticion("/videojuegos/" + idValido($("buscarJuegoId").value));
  $("resJuego").textContent = "#" + juego.id + " · " + juego.nombre + " · " + juego.genero;
}

// 3. POST /videojuegos. La recarga la coordina app.js.
export async function guardarVideojuego() {
  await peticion("/videojuegos", { method: "POST", body: {
    nombre: textoObligatorio("vNombre"), genero: textoObligatorio("vGenero")
  } });
  $("formJuego").reset();
  return "Videojuego creado.";
}
