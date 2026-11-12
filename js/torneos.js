/** @file Gestión de torneos, filtros y formulario de edición. */
import { peticion } from "./api.js";
import { $, botonAccion, celda, estadoTorneo, fechaLegible, formatoPremio, idValido, mensajeTabla, textoObligatorio } from "./ui.js";

let torneoEnEdicion = null;
let filtrosAplicados = { estado: "", videojuegoId: "" };
let ultimaCarga = 0;

// 10. GET /torneos · 11. estado · 12. videojuego · 13. ambos filtros.
export async function cargarTorneos(acciones) {
  const numeroCarga = ++ultimaCarga;
  const parametros = new URLSearchParams();
  if (filtrosAplicados.estado) parametros.set("estado", filtrosAplicados.estado);
  if (filtrosAplicados.videojuegoId) parametros.set("videojuegoId", filtrosAplicados.videojuegoId);
  mensajeTabla("cuerpoTorneos", 7, "Cargando torneos…");

  try {
    const torneos = await peticion("/torneos" + (parametros.size ? "?" + parametros : ""));
    if (numeroCarga !== ultimaCarga) return;
    $("cuerpoTorneos").replaceChildren();
    for (const torneo of torneos) {
      const fila = document.createElement("tr");
      [torneo.id, torneo.nombre, torneo.videojuego.nombre,
        fechaLegible(torneo.fecha), formatoPremio.format(torneo.premio)]
        .forEach((valor) => celda(fila, valor));
      celda(fila, "").append(estadoTorneo(torneo.estado));
      const botones = document.createElement("div");
      botones.className = "ga-actions";
      botones.append(
        botonAccion("Participantes", () => acciones.verParticipantes(torneo.id)),
        botonAccion("Editar", () => editarTorneo(torneo.id)),
        botonAccion("Eliminar", () => acciones.eliminar(torneo.id), true)
      );
      celda(fila, "").append(botones);
      $("cuerpoTorneos").append(fila);
    }
    if (!torneos.length) {
      mensajeTabla("cuerpoTorneos", 7, parametros.size
        ? "No hay torneos con estos filtros." : "Todavía no hay torneos. Crea el primero.");
    }
    $("totalTorneos").textContent = torneos.length;
    $("totalTorneos").title = parametros.size ? "Torneos que cumplen los filtros" : "Total de torneos";
  } catch (error) {
    if (numeroCarga === ultimaCarga) {
      $("totalTorneos").textContent = "—";
      mensajeTabla("cuerpoTorneos", 7, "No se pudieron cargar los torneos. Usa Reconectar.");
    }
    throw error;
  }
}

/** Envía al servidor los filtros elegidos en los selectores. */
export async function filtrarTorneos(acciones) {
  filtrosAplicados = {
    estado: $("filtroEstado").value,
    videojuegoId: $("filtroVideojuego").value
  };
  await cargarTorneos(acciones);
}

// 14. GET /torneos/{id}
export async function buscarTorneo() {
  $("resTorneo").textContent = "";
  const t = await peticion("/torneos/" + idValido($("buscarTorneoId").value));
  $("resTorneo").textContent = "#" + t.id + " · " + t.nombre + " · " + t.videojuego.nombre
    + " · " + fechaLegible(t.fecha) + " · " + formatoPremio.format(t.premio) + " · " + t.estado;
}

export async function editarTorneo(id) {
  const t = await peticion("/torneos/" + id);
  torneoEnEdicion = t.id;
  $("tNombre").value = t.nombre;
  $("tVideojuego").value = t.videojuego.id;
  $("tFecha").value = t.fecha;
  $("tPremio").value = t.premio;
  $("tEstado").value = t.estado;
  $("tituloFormTorneo").textContent = "Editar torneo #" + t.id;
  $("btnTorneo").textContent = "Guardar cambios";
  $("btnCancelarTorneo").hidden = false;
  $("tNombre").focus();
}

export function cancelarTorneo() {
  torneoEnEdicion = null;
  $("formTorneo").reset();
  $("tituloFormTorneo").textContent = "Nuevo torneo";
  $("btnTorneo").textContent = "Crear torneo";
  $("btnCancelarTorneo").hidden = true;
}

// 15. POST /torneos · 16. PUT /torneos/{id}
export async function guardarTorneo() {
  const estado = $("tEstado").value;
  if (!["ABIERTO", "EN_CURSO", "FINALIZADO"].includes(estado)) {
    throw new Error("Elige un estado de torneo válido.");
  }
  const editando = torneoEnEdicion !== null;
  await peticion(editando ? "/torneos/" + torneoEnEdicion : "/torneos", {
    method: editando ? "PUT" : "POST",
    body: {
      nombre: textoObligatorio("tNombre"), fecha: $("tFecha").value,
      premio: Number($("tPremio").value), estado,
      videojuego: { id: idValido($("tVideojuego").value) }
    }
  });
  cancelarTorneo();
  $("resTorneo").textContent = "";
  return editando ? "Torneo actualizado." : "Torneo creado.";
}

// 17. DELETE /torneos/{id}. Un 409 conserva la fila y muestra el error.
export async function eliminarTorneo(id) {
  if (!confirm("¿Eliminar el torneo #" + id + "? Si tiene participaciones, el servidor rechazará la eliminación.")) return false;
  await peticion("/torneos/" + id, { method: "DELETE" });
  if (torneoEnEdicion === id) cancelarTorneo();
  $("resTorneo").textContent = "";
  return true;
}
