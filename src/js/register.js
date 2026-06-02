const USERS_STORAGE_KEY = "DJPJM_usuarios";
const BACKEND_REGISTER_LOG_URL = "https://backend-demo-gestor-de-contrase-as.onrender.com/api/auth/register";

function setMessage(element, message, type = "info") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `auth-message ${type}`;
}

function cargarUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usuarios));
}

async function registrarUsuarioLocal(usuario, contrasenaMaestra) {
  const usuarios = cargarUsuarios();
  const existe = usuarios.find((item) => item.usuario === usuario);

  if (existe) {
    throw new Error("El usuario ya existe.");
  }

  usuarios.push({
    usuario,
    contrasenaMaestra: await cifrarContrasena(contrasenaMaestra),
  });

  guardarUsuarios(usuarios);
}

async function validarUsuarioLocal(usuario, contrasenaMaestra) {
  const usuarios = cargarUsuarios();
  const user = usuarios.find((item) => item.usuario === usuario);

  if (!user) {
    throw new Error("El usuario no existe.");
  }

  const hash = await cifrarContrasena(contrasenaMaestra);
  if (user.contrasenaMaestra !== hash) {
    throw new Error("La contrasena maestra es incorrecta.");
  }

  return true;
}

function guardarSesionLocal(usuario, contrasenaMaestra) {
  sessionStorage.setItem("DJPJM_usuario", usuario);
  sessionStorage.setItem("DJPJM_master", contrasenaMaestra);
}

function ocultarUsuarioParcialmente(usuario) {
  const len = usuario.length;
  if (len <= 2) {
    return "**";
  }
  return usuario[0] + "*".repeat(len - 2) + usuario[len - 1];
}

async function registrarLogRemoto(usuario) {
  const usuarioVisibleParcial = ocultarUsuarioParcialmente(usuario);
  const payload = {
    evento: "USER_REGISTER",
    usuarioVisibleParcial: usuarioVisibleParcial,
  };

  try {
    const response = await fetch(BACKEND_REGISTER_LOG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`No se pudo registrar el log remoto. Estado: ${response.status} ${response.statusText}`);
    } else {
      console.log("Log remoto enviado correctamente");
    }
  } catch (error) {
    console.warn("No se pudo registrar el log remoto, pero el registro local fue exitoso:", error);
  }
}

async function registrarLogLoginRemoto(usuario) {
  const usuarioVisibleParcial = ocultarUsuarioParcialmente(usuario);
  const payload = {
    evento: "USER_LOGIN",
    usuarioVisibleParcial: usuarioVisibleParcial,
  };

  try {
    const response = await fetch(BACKEND_REGISTER_LOG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`No se pudo registrar el log de login. Estado: ${response.status} ${response.statusText}`);
    } else {
      console.log("Log de login enviado correctamente");
    }
  } catch (error) {
    console.warn("No se pudo registrar el log de login:", error);
  }
}

async function initializeRegister() {
  const usuarioInput = document.getElementById("reg-usuario");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput = document.getElementById("reg-confirmar");
  const registerBtn = document.getElementById("register-btn");
  const generateBtn = document.getElementById("generate-password-btn");
  const messageEl = document.getElementById("auth-message");

  generateBtn.addEventListener("click", async () => {
    setMessage(messageEl, "Generando contrasena maestra segura...", "info");

    try {
      const result = await generarYCifrarContrasena(18);
      passwordInput.value = result.contrasena;
      confirmInput.value = result.contrasena;
      setMessage(messageEl, "Contrasena maestra generada y rellenada en el formulario.", "success");
    } catch (error) {
      setMessage(messageEl, "No se pudo generar la contrasena.", "error");
    }
  });

  async function handleRegister() {
    const usuario = usuarioInput.value.trim();
    const contrasenaMaestra = passwordInput.value;
    const confirmar = confirmInput.value;

    if (!usuario || !contrasenaMaestra || !confirmar) {
      setMessage(messageEl, "Rellena todos los campos del registro.", "error");
      return;
    }

    if (contrasenaMaestra !== confirmar) {
      setMessage(messageEl, "Las contrasenas maestras no coinciden.", "error");
      return;
    }

    setMessage(messageEl, "Creando usuario en almacenamiento local...", "info");

    try {
      await registrarUsuarioLocal(usuario, contrasenaMaestra);
      guardarSesionLocal(usuario, contrasenaMaestra);
      registrarLogRemoto(usuario);
      window.location.href = "index.html";
    } catch (error) {
      setMessage(messageEl, error.message, "error");
    }
  }

  registerBtn.addEventListener("click", handleRegister);
  confirmInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleRegister();
    }
  });
}

async function initializeLogin() {
  const usuarioInput = document.getElementById("login-usuario");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const messageEl = document.getElementById("auth-message");

  async function handleLogin() {
    const usuario = usuarioInput.value.trim();
    const contrasenaMaestra = passwordInput.value;

    if (!usuario || !contrasenaMaestra) {
      setMessage(messageEl, "Introduce tu usuario y tu contrasena maestra.", "error");
      return;
    }

    setMessage(messageEl, "Validando acceso local...", "info");

    try {
      await validarUsuarioLocal(usuario, contrasenaMaestra);
      guardarSesionLocal(usuario, contrasenaMaestra);
      registrarLogLoginRemoto(usuario);
      window.location.href = "index.html";
    } catch (error) {
      setMessage(messageEl, error.message, "error");
    }
  }

  loginBtn.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("register-btn")) {
    initializeRegister();
  }

  if (document.getElementById("login-btn")) {
    initializeLogin();
  }
});
