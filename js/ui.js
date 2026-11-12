/** @file Utilidades compartidas de interfaz y validación. */
export const $ = (id) => document.getElementById(id);

export function mostrarAviso(mensaje, tipo = "error") {
  $("aviso").dataset.tipo = tipo;
  $("aviso").textContent = mensaje;
}

export function conexion(texto, estado) {
  $("conexion").textContent = texto;
  $("conexion").dataset.estado = estado;
}

/** Evita repetir una acción pendiente y muestra los errores que produzca. */
export async function ejecutar(boton, accion) {
  if (boton.disabled) return;
  boton.dataset.pendiente = "true";
  boton.disabled = true;
  boton.setAttribute("aria-busy", "true");
  $("aviso").textContent = "";
  try { await accion(); }
  catch (error) { mostrarAviso(error.message); }
  finally {
    delete boton.dataset.pendiente;
    boton.disabled = false;
    boton.removeAttribute("aria-busy");
  }
}

/** Distingue una escritura guardada de un posible fallo posterior al recargar. */
export async function recargarTrasCambio(mensaje, cargas) {
  const resultados = await Promise.allSettled(cargas.map((carga) => carga()));
  const errores = resultados.filter((r) => r.status === "rejected");
  mostrarAviso(errores.length
    ? mensaje + " No se pudo actualizar toda la vista: "
      + errores.map((r) => r.reason.message).join(" · ")
    : mensaje, errores.length ? "aviso" : "exito");
}

export function idValido(valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("Introduce un ID entero mayor que cero.");
  }
  return id;
}

export function textoObligatorio(id) {
  const valor = $(id).value.trim();
  if (!valor) {
    throw new Error("Completa los campos obligatorios; no pueden contener solo espacios.");
  }
  return valor;
}

// Los datos del servidor se insertan como texto, sin interpretarlos como HTML.
export function celda(fila, valor) {
  const td = document.createElement("td");
  td.textContent = valor ?? "—";
  fila.append(td);
  return td;
}

export function estadoTorneo(estado) {
  const span = document.createElement("span");
  span.className = "ga-state";
  span.dataset.estado = estado;
  span.textContent = estado;
  return span;
}

export function mensajeTabla(id, columnas, mensaje) {
  const fila = document.createElement("tr");
  const td = celda(fila, mensaje);
  td.colSpan = columnas;
  td.className = "ga-empty";
  $(id).replaceChildren(fila);
}

export function botonAccion(texto, accion, peligro = false) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn " + (peligro ? "btn-danger" : "btn-line");
  boton.textContent = texto;
  boton.addEventListener("click", () => ejecutar(boton, accion));
  return boton;
}

export function rellenarSelector(id, datos, etiqueta, vacio) {
  const select = $(id);
  const anterior = select.value;
  select.replaceChildren(new Option(vacio, ""));
  for (const dato of datos) select.add(new Option(etiqueta(dato), dato.id));
  if (datos.some((dato) => String(dato.id) === anterior)) select.value = anterior;
}

export const formatoPremio = new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR"
});

export function fechaLegible(fecha) {
  return fecha ? fecha.split("-").reverse().join("/") : "—";
}
