// Archivo: login.js

document.addEventListener('DOMContentLoaded', () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    const formLogin = document.getElementById('formLogin');
    const emailInput = document.getElementById('emailLogin');
    const passwordInput = document.getElementById('passwordLogin');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // 1. Si el usuario marcó "Recordar mi correo" antes, lo cargamos automáticamente
    if (localStorage.getItem('correoGuardado')) {
        emailInput.value = localStorage.getItem('correoGuardado');
        rememberMeCheckbox.checked = true;
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página intente cambiar de URL por defecto

        const email = emailInput.value;
        const password = passwordInput.value;

        // 2. Gestionamos el "Recordar correo"
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('correoGuardado', email);
        } else {
            localStorage.removeItem('correoGuardado');
        }

        try {
            // 3. Enviamos las credenciales al backend
            const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await respuesta.json();

            // 4. Analizamos la respuesta del servidor
            if (respuesta.ok) {
                // ¡Éxito! Guardamos la "llave" (Token) y el rol en la memoria del navegador
                localStorage.setItem('token', data.token);
                localStorage.setItem('rolUsuario', data.usuario.rol);
                localStorage.setItem('nombreUsuario', data.usuario.nombre); // Muy útil para el Nav Bar después
                
                // Redirigimos a la pantalla principal
                window.location.href = 'inicio.html';
            } else {
                // Contraseña incorrecta o usuario no existe
                alert(`Error: ${data.mensaje}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor. Verifica que Node.js esté encendido.');
        }
    });
});