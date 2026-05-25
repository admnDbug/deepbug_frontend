document.addEventListener('DOMContentLoaded', () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    // --- 1. SEGURIDAD ---
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    // Aplicar seguridad visual según el rol
    document.querySelectorAll("[data-role]").forEach(el => {
        if (el.getAttribute("data-role") !== rolUsuario) {
            el.style.setProperty('display', 'none', 'important');
        }
    });
    if (!token) return window.location.replace('login.html');

    // Mostrar botón de Admin solo si es Colaborador
    if (rolUsuario === 'Colaborador') {
        document.getElementById('contenedorBtnAdmin').style.setProperty('display', 'flex', 'important');
    }

    // --- 2. CARGAR DATOS DEL USUARIO ---
    cargarPerfil();

    async function cargarPerfil() {
        try {
            // Conectado a tu ruta GET /api/auth/perfil
            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/perfil', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const u = await res.json(); // Tu backend devuelve directamente el usuario

                // Llenar Header
                document.getElementById('displayNombre').textContent = u.nombre || 'Usuario';
                document.getElementById('displayCorreo').textContent = u.email || '';
                document.getElementById('displayRol').textContent = u.rol || rolUsuario;

                // Llenar Formulario
                document.getElementById('p_nombre').value = u.nombre || '';
                document.getElementById('p_email').value = u.email || '';
                document.getElementById('p_institucion').value = u.institucion || '';
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
        }
    }

    // --- 3. LÓGICA DE MODO EDICIÓN ---
    const btnEditar = document.getElementById('btnEditarPerfil');
    const btnGuardar = document.getElementById('btnGuardarPerfil');

    btnEditar.addEventListener('click', () => {
        // Habilitamos solo nombre e institución (el email se queda bloqueado por seguridad)
        document.getElementById('p_nombre').disabled = false;
        document.getElementById('p_institucion').disabled = false;
        
        btnEditar.style.display = 'none';
        btnGuardar.style.display = 'inline-block';
        document.getElementById('p_nombre').focus();
    });

    // --- 4. GUARDAR PERFIL ---
    document.getElementById('formPerfil').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Extraemos solo lo que acepta tu ruta PUT /api/auth/actualizar-perfil
        const datosActualizados = {
            nombre: document.getElementById('p_nombre').value.trim(),
            institucion: document.getElementById('p_institucion').value.trim()
        };

        try {
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            btnGuardar.disabled = true;

            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/actualizar-perfil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(datosActualizados)
            });

            if (res.ok) {
                alert("Información actualizada exitosamente.");
                
                // Volver a modo lectura
                document.getElementById('p_nombre').disabled = true;
                document.getElementById('p_institucion').disabled = true;
                
                btnGuardar.style.display = 'none';
                btnEditar.style.display = 'inline-block';
                
                // Actualizar localStorage y header
                localStorage.setItem('nombreUsuario', datosActualizados.nombre);
                cargarPerfil(); 
            } else {
                const err = await res.json(); alert(`Error: ${err.mensaje}`);
            }
        } catch (error) {
            alert("Error de conexión al servidor.");
        } finally {
            btnGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
            btnGuardar.disabled = false;
        }
    });

    // --- 5. VOLVERSE RESPONSABLE ---
    document.getElementById('btnAscenderAdmin').addEventListener('click', async () => {
        const codigo = document.getElementById('inputCodigoAdmin').value.trim();
        if (!codigo) return alert("Ingresa un código válido.");

        try {
            // Conectado a tu ruta POST /api/auth/validar-codigo
            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/validar-codigo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ codigo: codigo }) // Tu backend espera la variable 'codigo'
            });

            const data = await res.json();
            if (res.ok) {
                alert("¡Felicidades! Rol actualizado correctamente.");
                // Actualizamos el rol en localStorage para que la UI lo reconozca de inmediato
                localStorage.setItem('rolUsuario', 'Responsable');
                window.location.reload();
            } else {
                alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            alert("Error al verificar el código.");
        }
    });

    // --- 6. CAMBIAR CONTRASEÑA ---
    document.getElementById('formPassword').addEventListener('submit', async (e) => {
        e.preventDefault();
        const actual = document.getElementById('passActual').value;
        const nueva = document.getElementById('passNueva').value;
        const confirmar = document.getElementById('passConfirmar').value;

        if (nueva !== confirmar) return alert("Las contraseñas nuevas no coinciden.");

        try {
            const btn = document.getElementById('btnGuardarPassword');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
            btn.disabled = true;

            // Conectado a tu ruta PUT /api/auth/cambiar-password
            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/cambiar-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // Tu backend espera 'passwordActual' y 'nuevaPassword'
                body: JSON.stringify({ passwordActual: actual, nuevaPassword: nueva })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Contraseña cambiada con éxito. Por favor vuelve a iniciar sesión.");
                localStorage.clear();
                window.location.replace('login.html');
            } else {
                alert(`Error: ${data.mensaje}`);
            }
            btn.innerHTML = 'Actualizar Contraseña';
            btn.disabled = false;
        } catch (error) {
            alert("Error de conexión al servidor.");
        }
    });

    // --- 7. CERRAR SESIÓN ---
    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        if(confirm("¿Seguro que deseas salir?")) {
            localStorage.clear();
            window.location.replace('login.html');
        }
    });
});