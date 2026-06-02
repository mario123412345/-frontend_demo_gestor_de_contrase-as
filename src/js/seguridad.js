// Variable global en memoria (inicia vacia hasta que el usuario se loguee)
let contrasenaMaestra = null;

function obtenerClaveBoveda() {
  const usuarioActual = sessionStorage.getItem("DJPJM_usuario");
  return usuarioActual ? `Boveda_DJPJM_${usuarioActual}` : "Boveda_DJPJM";
}

// --- FUNCIONES DE ACCESO PARA EL FRONTEND ---

// 1. El Front usa esto para saber que pantalla mostrar (Login o Registro)
function verificarEstadoBoveda() {
  const datosCifrados = localStorage.getItem(obtenerClaveBoveda());
  // Si hay datos devuelve "EXISTENTE", si no, devuelve "NUEVA"
  return datosCifrados ? "EXISTENTE" : "NUEVA";
}

// 2. El Front usa esto cuando es la PRIMERA VEZ y el usuario crea su llave
function registrarContrasenaMaestra(nuevaContrasena) {
  contrasenaMaestra = nuevaContrasena;
  // Guardamos una boveda vacia cifrada para que ya exista en el sistema
  guardarYcifrarBoveda([]);
  return true;
}

// 3. El Front usa esto cuando el usuario INTENTA ENTRAR
function intentarIniciarSesion(passwordIntento) {
  const datosCifrados = localStorage.getItem(obtenerClaveBoveda());

  if (!datosCifrados) return false;

  try {
    // Intentamos descifrar con la contrasena que ha escrito en el formulario
    const bytes = CryptoJS.AES.decrypt(datosCifrados, passwordIntento);
    const datosDescifradosTexto = bytes.toString(CryptoJS.enc.Utf8);

    // Si la contrasena es mala, esto fallara y saltara al catch
    if (!datosDescifradosTexto) throw new Error("Llave incorrecta");

    // ¡EXITO! La contrasena es correcta. La guardamos en memoria para esta sesion.
    contrasenaMaestra = passwordIntento;

    // Devolvemos el array de contrasenas para que el Front pinte las tarjetas
    return JSON.parse(datosDescifradosTexto);
  } catch (error) {
    // Fallo de seguridad: Devolvemos false para que el Front ponga el input en rojo
    return false;
  }
}

// 2. Funcion para GUARDAR y CIFRAR
function guardarYcifrarBoveda(arrayContrasenas) {
  // Convertimos el array a texto
  const datosEnJSON = JSON.stringify(arrayContrasenas);

  // Ciframos con AES
  const datosCifrados = CryptoJS.AES.encrypt(datosEnJSON, contrasenaMaestra).toString();

  // Guardamos en el navegador
  localStorage.setItem(obtenerClaveBoveda(), datosCifrados);
  console.log("Boveda guardada y cifrada.");
}

// 3. Funcion para CARGAR y DESCIFRAR al arrancar
function cargarYdescifrarBoveda() {
  const datosCifrados = localStorage.getItem(obtenerClaveBoveda());

  if (!datosCifrados) {
    return []; // Si no hay nada guardado, devolvemos un array vacio
  }

  try {
    // Desciframos
    const bytes = CryptoJS.AES.decrypt(datosCifrados, contrasenaMaestra);
    const datosDescifradosTexto = bytes.toString(CryptoJS.enc.Utf8);

    if (!datosDescifradosTexto) throw new Error("Contrasena incorrecta");

    console.log("Boveda cargada con exito.");
    return JSON.parse(datosDescifradosTexto); // Devolvemos el array recuperado
  } catch (error) {
    alert("Contrasena Maestra incorrecta. No se pueden mostrar las contrasenas.");
    return [];
  }
}

// 4. Funcion para EXPORTAR el archivo .djpjm
function exportarArchivoDJPJM() {
  const datosCifrados = localStorage.getItem(obtenerClaveBoveda());

  if (!datosCifrados) {
    alert("La boveda esta vacia.");
    return;
  }

  const blob = new Blob([datosCifrados], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "Mis_Contrasenas.djpjm";

  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

// 5. Funcion para IMPORTAR un archivo .djpjm
function importarArchivoDJPJM(evento) {
  const archivo = evento.target.files[0];
  if (!archivo) return; // Si el usuario cancela, no hacemos nada

  const lector = new FileReader();

  lector.onload = function (e) {
    const contenidoCifrado = e.target.result;

    // Sobrescribimos la memoria del navegador con el archivo nuevo
    localStorage.setItem(obtenerClaveBoveda(), contenidoCifrado);

    alert("Boveda importada con exito. La pagina se recargara para aplicar los cambios.");
    // Recargamos la pagina para que el motor pida la contrasena maestra de nuevo
    window.location.reload();
  };

  // Leemos el archivo como texto plano
  lector.readAsText(archivo);
}

// 6. Funcion para DESTRUIR la boveda (Factory Reset)
function destruirBoveda() {
  // Borramos el archivo fisico de la memoria del navegador
  localStorage.removeItem(obtenerClaveBoveda());

  // Limpiamos la variable de sesion por si acaso
  contrasenaMaestra = null;

  // Recargamos la pagina para que la app vuelva al estado "NUEVA"
  window.location.reload();
}
