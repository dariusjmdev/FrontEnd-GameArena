/** @file Inscripciones y paneles de relaciones entre jugadores y torneos. */
import { peticion } from "./api.js";
import { $, idValido } from "./ui.js";

let torneoSeleccionado = null;
let jugadorSeleccionado = null;

function pintarParticipaciones(idLista, participaciones, relacion) {
  const lista = $(idLista);
  lista.replaceChildren();
  if (!participaciones.length) {
    const li = document.createElement("li");
    li.textContent = relacion === "jugador"
      ? "Este torneo todavía no tiene participantes."
      : "Este jugador todavía no tiene participaciones.";
    lista.append(li);
  }
  for (const p of participaciones) {
    const entidad = p[relacion];
    const li = document.createElement("li");
    const titulo = document.createElement("strong");
    titulo.textContent = "#" + entidad.id + " · "
      + (relacion === "jugador" ? entidad.nick : entidad.nombre);
    const detalle = document.createElement("small");
    detalle.textContent = "Participación #" + p.id + " · Puntos: " + p.puntos
      + " · Posición: " + p.posicion + (relacion === "torneo"
        ? " · " + entidad.estado + " · " + entidad.videojuego.nombre
        : " · " + entidad.nivel);
    li.append(titulo, detalle);
    lista.append(li);
  }
}

export function actualizarInscripcion() {
  $("btnInscribir").disabled = torneoSeleccionado === null
    || $("iJugador").options.length < 2
    || $("btnInscribir").dataset.pendiente === "true";
}

// 9. GET /jugadores/{id}/participaciones
export async function verTorneosJugador(id) {
  jugadorSeleccionado = id;
  $("panelTorneosJugador").hidden = false;
  $("tituloTorneosJugador").textContent = "Torneos del jugador #" + id;
  $("listaTorneosJugador").textContent = "Cargando torneos…";
  try {
    const datos = await peticion("/jugadores/" + id + "/participaciones");
    if (jugadorSeleccionado === id) pintarParticipaciones("listaTorneosJugador", datos, "torneo");
  } catch (error) {
    if (jugadorSeleccionado === id) $("listaTorneosJugador").textContent = "No se pudieron cargar los torneos del jugador.";
    throw error;
  }
}

// 18. GET /torneos/{id}/participaciones
export async function verParticipantes(id) {
  torneoSeleccionado = id;
  $("panelParticipantesTorneo").hidden = false;
  $("tituloParticipantesTorneo").textContent = "Participantes del torneo #" + id;
  $("listaParticipantesTorneo").textContent = "Cargando participantes…";
  actualizarInscripcion();
  try {
    const datos = await peticion("/torneos/" + id + "/participaciones");
    if (torneoSeleccionado === id) pintarParticipaciones("listaParticipantesTorneo", datos, "jugador");
  } catch (error) {
    if (torneoSeleccionado === id) $("listaParticipantesTorneo").textContent = "No se pudieron cargar los participantes.";
    throw error;
  }
}

// 19. POST /torneos/{id}/participaciones
export async function inscribirJugador() {
  const id = idValido(torneoSeleccionado);
  await peticion("/torneos/" + id + "/participaciones", { method: "POST", body: {
    jugador: { id: idValido($("iJugador").value) }, puntos: 0, posicion: 0
  } });
  $("formInscripcion").reset();
  return "Jugador inscrito en el torneo #" + id + ".";
}

/** Devuelve las recargas de los paneles abiertos para que app.js las coordine. */
export function cargasPaneles() {
  const cargas = [];
  if (torneoSeleccionado !== null) {
    const id = torneoSeleccionado;
    cargas.push(() => verParticipantes(id));
  }
  if (jugadorSeleccionado !== null) {
    const id = jugadorSeleccionado;
    cargas.push(() => verTorneosJugador(id));
  }
  return cargas;
}

export function cerrarTorneosJugador(id) {
  if (jugadorSeleccionado === id) {
    jugadorSeleccionado = null;
    $("panelTorneosJugador").hidden = true;
  }
}

export function cerrarParticipantes(id) {
  if (torneoSeleccionado === id) {
    torneoSeleccionado = null;
    $("panelParticipantesTorneo").hidden = true;
    actualizarInscripcion();
  }
}
