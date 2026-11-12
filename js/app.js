/** @file Arranque, eventos y coordinación de las recargas de GameArena. */
import { $, conexion, ejecutar, mostrarAviso, recargarTrasCambio } from "./ui.js";
import * as Videojuegos from "./videojuegos.js";
import * as Jugadores from "./jugadores.js";
import * as Torneos from "./torneos.js";
import * as Participaciones from "./participaciones.js";

// Los módulos reciben funciones de app.js y no necesitan importarse entre sí.
const accionesJugadores = {
  verTorneos: Participaciones.verTorneosJugador,
  eliminar: borrarJugador
};
const accionesTorneos = {
  verParticipantes: Participaciones.verParticipantes,
  eliminar: borrarTorneo
};

async function cargarJugadores() {
  await Jugadores.cargarJugadores(accionesJugadores);
  Participaciones.actualizarInscripcion();
}

function cargarTorneos() {
  return Torneos.cargarTorneos(accionesTorneos);
}

async function borrarJugador(id) {
  if (!await Jugadores.eliminarJugador(id)) return;
  Participaciones.cerrarTorneosJugador(id);
  await recargarTrasCambio("Jugador eliminado.", [cargarJugadores]);
}

async function borrarTorneo(id) {
  if (!await Torneos.eliminarTorneo(id)) return;
  Participaciones.cerrarParticipantes(id);
  await recargarTrasCambio("Torneo eliminado.", [cargarTorneos]);
}

async function ejecutarAccion(boton, accion) {
  try { await ejecutar(boton, accion); }
  finally { Participaciones.actualizarInscripcion(); }
}

function enlazarFormulario(idForm, idBoton, accion) {
  $(idForm).addEventListener("submit", (evento) => {
    evento.preventDefault();
    return ejecutarAccion($(idBoton), accion);
  });
}

function enlazarBusqueda(idBoton, idInput, accion) {
  $(idBoton).addEventListener("click", () => ejecutarAccion($(idBoton), accion));
  $(idInput).addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      return ejecutarAccion($(idBoton), accion);
    }
  });
}

enlazarFormulario("formJuego", "btnJuego", async () => {
  const mensaje = await Videojuegos.guardarVideojuego();
  await recargarTrasCambio(mensaje, [Videojuegos.cargarVideojuegos]);
});
enlazarFormulario("formJugador", "btnJugador", async () => {
  const mensaje = await Jugadores.guardarJugador();
  await recargarTrasCambio(mensaje, [cargarJugadores, ...Participaciones.cargasPaneles()]);
});
enlazarFormulario("formTorneo", "btnTorneo", async () => {
  const mensaje = await Torneos.guardarTorneo();
  await recargarTrasCambio(mensaje, [cargarTorneos, ...Participaciones.cargasPaneles()]);
});
enlazarFormulario("formInscripcion", "btnInscribir", async () => {
  const mensaje = await Participaciones.inscribirJugador();
  await recargarTrasCambio(mensaje, [cargarTorneos, cargarJugadores, ...Participaciones.cargasPaneles()]);
});

enlazarBusqueda("btnBuscarJuego", "buscarJuegoId", Videojuegos.buscarVideojuego);
enlazarBusqueda("btnBuscarJugador", "buscarJugadorId", Jugadores.buscarJugador);
enlazarBusqueda("btnBuscarTorneo", "buscarTorneoId", Torneos.buscarTorneo);
$("btnCancelarJugador").addEventListener("click", Jugadores.cancelarJugador);
$("btnCancelarTorneo").addEventListener("click", Torneos.cancelarTorneo);
$("btnFiltrarTorneos").addEventListener("click", () => ejecutarAccion(
  $("btnFiltrarTorneos"), () => Torneos.filtrarTorneos(accionesTorneos)
));

// Pestañas accesibles mediante ratón, flechas y las teclas Inicio y Fin.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function activarTab(tab) {
  for (const otro of tabs) {
    const activo = otro === tab;
    otro.classList.toggle("active", activo);
    otro.setAttribute("aria-selected", String(activo));
    otro.tabIndex = activo ? 0 : -1;
    $(otro.getAttribute("aria-controls")).hidden = !activo;
  }
}
tabs.forEach((tab, indice) => {
  tab.addEventListener("click", () => activarTab(tab));
  tab.addEventListener("keydown", (evento) => {
    let destino;
    if (evento.key === "ArrowRight") destino = (indice + 1) % tabs.length;
    if (evento.key === "ArrowLeft") destino = (indice + tabs.length - 1) % tabs.length;
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = tabs.length - 1;
    if (destino === undefined) return;
    evento.preventDefault();
    activarTab(tabs[destino]);
    tabs[destino].focus();
  });
});

async function iniciar() {
  conexion("Conectando…", "pendiente");
  const resultados = await Promise.allSettled([
    Videojuegos.cargarVideojuegos(), cargarJugadores(), cargarTorneos()
  ]);
  const errores = resultados.filter((r) => r.status === "rejected");
  if (errores.length) {
    conexion(errores.length === 3 ? "No se pudo cargar" : "Carga incompleta", "error");
    const mensajes = errores.map((r) => r.reason.message);
    mostrarAviso([...new Set(mensajes)].join(" · "));
  }
}

$("btnReconectar").addEventListener("click", () => ejecutarAccion($("btnReconectar"), iniciar));
ejecutarAccion($("btnReconectar"), iniciar);
