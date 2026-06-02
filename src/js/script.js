let contrasenas = [];

let tarjetaEditando = null;
let datoEditando = null;
const grid = document.getElementById("cards-grid");
const overlay = document.getElementById("Datos-overlay");
const btnAbrir = document.getElementById("add-new-btn");
const btnCancelar = document.getElementById("btn-cancelar");
const btnGuardar = document.getElementById("btn-guardar");
const uploadArea = document.getElementById("upload-area");
const inputImagen = document.getElementById("input-imagen");
const previewImagen = document.getElementById("preview-imagen");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const inputImportar = document.getElementById("input-importar");
const logoutBtn = document.getElementById("logout-btn");
const sessionUser = document.getElementById("session-user");

function renderVault() {
  const gridEl = document.getElementById("cards-grid");
  gridEl.innerHTML = "";

  if (!contrasenas.length) {
    gridEl.innerHTML = '<div class="empty-state">Todavia no hay contrasenas guardadas en la boveda.</div>';
    return;
  }

  contrasenas.forEach((dato) => {
    const tarjeta = crearTarjeta(dato);
    gridEl.appendChild(tarjeta);
  });
}

function inicializarSesionYBoveda() {
  const usuario = sessionStorage.getItem("DJPJM_usuario");
  const master = sessionStorage.getItem("DJPJM_master");

  if (!usuario || !master) {
    window.location.href = "login.html";
    return false;
  }

  sessionUser.textContent = usuario;

  if (verificarEstadoBoveda() === "NUEVA") {
    registrarContrasenaMaestra(master);
    contrasenas = [];
    renderVault();
    return true;
  }

  const datos = intentarIniciarSesion(master);
  if (datos === false) {
    alert("No se ha podido abrir la boveda con la contrasena maestra actual.");
    sessionStorage.removeItem("DJPJM_master");
    window.location.href = "login.html";
    return false;
  }

  contrasenas = datos || [];
  renderVault();
  return true;
}

if (btnAbrir) {
  btnAbrir.addEventListener("click", function () {
    overlay.classList.add("activo");
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", function () {
    exportarArchivoDJPJM();
  });
}

if (importBtn && inputImportar) {
  importBtn.addEventListener("click", function () {
    inputImportar.click();
  });
  inputImportar.addEventListener("change", function (evento) {
    importarArchivoDJPJM(evento);
    inputImportar.value = "";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("DJPJM_master");
    sessionStorage.removeItem("DJPJM_usuario");
    window.location.href = "login.html";
  });
}

btnCancelar.addEventListener("click", function () {
  cerrarDatos();
});

overlay.addEventListener("click", function (e) {
  if (e.target === overlay) {
    cerrarDatos();
  }
});

uploadArea.addEventListener("click", function () {
  inputImagen.click();
});

uploadArea.addEventListener("dragover", function (e) {
  e.preventDefault();
  uploadArea.classList.add("dragging");
});

uploadArea.addEventListener("dragleave", function () {
  uploadArea.classList.remove("dragging");
});

uploadArea.addEventListener("drop", function (e) {
  e.preventDefault();
  uploadArea.classList.remove("dragging");
  const file = e.dataTransfer.files[0];
  mostrarPreview(file);
});

inputImagen.addEventListener("change", function () {
  const file = inputImagen.files[0];
  mostrarPreview(file);
});

function cerrarDatos() {
  overlay.classList.remove("activo");
  document.getElementById("input-nombre").value = "";
  document.getElementById("input-usuario").value = "";
  document.getElementById("input-password").value = "";
  document.getElementById("input-confirmar").value = "";
  previewImagen.src = "";
  previewImagen.style.display = "none";
  uploadArea.style.display = "flex";
  inputImagen.value = "";
  tarjetaEditando = null;
  datoEditando = null;
}

btnGuardar.addEventListener("click", function () {
  const nombre = document.getElementById("input-nombre").value.trim();
  const usuario = document.getElementById("input-usuario").value.trim();
  const password = document.getElementById("input-password").value;
  const confirmar = document.getElementById("input-confirmar").value;
  const imagen = previewImagen.style.display !== "none" ? previewImagen.src : null;

  if (!password || !confirmar) {
    alert("La contrasena es obligatoria.");
    return;
  }

  if (password !== confirmar) {
    alert("Las contrasenas no coinciden.");
    return;
  }

  if (tarjetaEditando) {
    datoEditando.nombre = nombre;
    datoEditando.usuario = usuario;
    datoEditando.password = password;
    datoEditando.imagen = previewImagen.style.display !== "none" ? previewImagen.src : datoEditando.imagen;

    const nuevaTarjeta = crearTarjeta(datoEditando);
    tarjetaEditando.replaceWith(nuevaTarjeta);
  } else {
    const nueva = {
      id: crypto.randomUUID(),
      nombre,
      usuario,
      password,
      imagen,
    };
    contrasenas.push(nueva);
    const tarjeta = crearTarjeta(nueva);
    grid.appendChild(tarjeta);
  }

  guardarYcifrarBoveda(contrasenas);
  cerrarDatos();
});

function mostrarPreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImagen.src = e.target.result;
    previewImagen.style.display = "block";
    uploadArea.style.display = "none";
  };
  reader.readAsDataURL(file);
}

function crearTarjeta(dato) {
  const colores = ["green", "blue", "gray"];
  const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
  const inicial = dato.nombre ? dato.nombre.charAt(0).toUpperCase() : "?";

  const icono = dato.imagen
    ? `<img src="${dato.imagen}" class="icon-img" alt="Logo">`
    : `<div class="icon ${colorAleatorio}">${inicial}</div>`;

  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    ${icono}
    <div class="info">
      <span class="card-nombre">${dato.nombre || "Sin nombre"}</span>
      <span class="card-usuario">${dato.usuario || "Sin usuario"}</span>
      <span class="password">••••••••</span>
    </div>
    <div class="card-acciones">
      <i class="fa-regular fa-eye eye"></i>
      <button class="btn-editar" type="button"><i class="fa-regular fa-pen-to-square"></i></button>
      <button class="btn-eliminar" type="button"><i class="fa-regular fa-trash-can"></i></button>
    </div>
  `;

  const ojo = card.querySelector(".eye");
  const passwordSpan = card.querySelector(".password");
  let visible = false;

  ojo.addEventListener("click", function () {
    visible = !visible;
    passwordSpan.textContent = visible ? dato.password : "••••••••";
    ojo.classList.toggle("fa-eye");
    ojo.classList.toggle("fa-eye-slash");
  });

  const btnEliminar = card.querySelector(".btn-eliminar");
  btnEliminar.addEventListener("click", function () {
    card.remove();
    const index = contrasenas.indexOf(dato);
    if (index !== -1) {
      contrasenas.splice(index, 1);
      guardarYcifrarBoveda(contrasenas);
    }
  });

  const btnEditar = card.querySelector(".btn-editar");
  btnEditar.addEventListener("click", function () {
    tarjetaEditando = card;
    datoEditando = dato;
    document.getElementById("input-nombre").value = dato.nombre || "";
    document.getElementById("input-usuario").value = dato.usuario || "";
    document.getElementById("input-password").value = dato.password;
    document.getElementById("input-confirmar").value = dato.password;

    if (dato.imagen) {
      previewImagen.src = dato.imagen;
      previewImagen.style.display = "block";
      uploadArea.style.display = "none";
    }

    overlay.classList.add("activo");
  });

  return card;
}

const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");

toggleBtn.addEventListener("click", function () {
  sidebar.classList.toggle("collapsed");
});

inicializarSesionYBoveda();
