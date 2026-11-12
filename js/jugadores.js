/** @file Gestión de jugadores y estado de su formulario de edición. */
import { peticion } from "./api.js";
import { $, botonAccion, celda, idValido, mensajeTabla, rellenarSelector, textoObligatorio } from "./ui.js";

let jugadorEnEdicion = null;

// 4. GET /jugadores. app.js proporciona las acciones que afectan a otros módulos.
export async function cargarJugadores(acciones) {
  mensajeTabla("cuerpoJugadores", 5, "Cargando jugadores…");
  try {
    const jugadores = await peticion("/jugadores");
    $("cuerpoJugadores").replaceChildren();
    for (const jugador of jugadores) {
      const fila = document.createElement("tr");
      [jugador.id, jugador.nick, jugador.email, jugador.nivel]
        .forEach((valor) => celda(fila, valor));
      const botones = document.createElement("div");
      botones.className = "ga-actions";
      botones.append(
        botonAccion("Torneos", () => acciones.verTorneos(jugador.id)),
        botonAccion("Editar", () => editarJugador(jugador.id)),
        botonAccion("Eliminar", () => acciones.eliminar(jugador.id), true)
      );
      celda(fila, "").append(botones);
      $("cuerpoJugadores").append(fila);
    }
    if (!jugadores.length) mensajeTabla("cuerpoJugadores", 5, "Todavía no hay jugadores. Crea el primero.");
    $("totalJugadores").textContent = jugadores.length;
    rellenarSelector("iJugador", jugadores, (j) => j.nick + " (#" + j.id + ")", "Selecciona un jugador");
  } catch (error) {
    $("totalJugadores").textContent = "—";
    mensajeTabla("cuerpoJugadores", 5, "No se pudieron cargar los jugadores. Usa Reconectar.");
    throw error;
  }
}

// 5. GET /jugadores/{id}
export async function buscarJugador() {
  $("resJugador").textContent = "";
  const j = await peticion("/jugadores/" + idValido($("buscarJugadorId").value));
  $("resJugador").textContent = "#" + j.id + " · " + j.nick + " · " + j.email + " · Nivel: " + j.nivel;
}

export async function editarJugador(id) {
  const j = await peticion("/jugadores/" + id);
  jugadorEnEdicion = j.id;
  $("jNick").value = j.nick;
  $("jEmail").value = j.email;
  $("jNivel").value = j.nivel;
  $("tituloFormJugador").textContent = "Editar jugador #" + j.id;
  $("btnJugador").textContent = "Guardar cambios";
  $("btnCancelarJugador").hidden = false;
  $("jNick").focus();
}

export function cancelarJugador() {
  jugadorEnEdicion = null;
  $("formJugador").reset();
  $("tituloFormJugador").textContent = "Nuevo jugador";
  $("btnJugador").textContent = "Crear jugador";
  $("btnCancelarJugador").hidden = true;
}

// 6. POST /jugadores · 7. PUT /jugadores/{id}
export async function guardarJugador() {
  const editando = jugadorEnEdicion !== null;
  await peticion(editando ? "/jugadores/" + jugadorEnEdicion : "/jugadores", {
    method: editando ? "PUT" : "POST",
    body: { nick: textoObligatorio("jNick"), email: textoObligatorio("jEmail"), nivel: textoObligatorio("jNivel") }
  });
  cancelarJugador();
  $("resJugador").textContent = "";
  return editando ? "Jugador actualizado." : "Jugador creado.";
}

// 8. DELETE /jugadores/{id}. Devuelve false si se cancela la confirmación.
export async function eliminarJugador(id) {
  if (!confirm("¿Eliminar el jugador #" + id + "? Si tiene participaciones, el servidor rechazará la eliminación.")) return false;
  await peticion("/jugadores/" + id, { method: "DELETE" });
  if (jugadorEnEdicion === id) cancelarJugador();
  $("resJugador").textContent = "";
  return true;
}
