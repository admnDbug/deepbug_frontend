// Archivo: registro.js

document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('formRegistro');

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // 1. Obtenemos los valores de los inputs
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const institucion = document.getElementById('institucion').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        // --- Atrapamos el código ---
        const codigo = document.getElementById('codigo').value;

        // 2. Validación básica
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden. Por favor, verifica.');
            return;
        }

        // Unimos nombre y apellidos si tu BD de Mongo solo espera "nombre"
        const nombreCompleto = `${nombre} ${apellidos}`;

        // 3. Preparamos los datos para Node.js
        const datosUsuario = {
            nombre: nombreCompleto,
            email: email,
            password: password,
            institucion: institucion,
            codigo: codigo // El backend espera esto para asignar el rol
        };

        try {
            // 4. Hacemos la petición a tu API (Asegúrate de que la URL sea la de tu servidor)
            // Si estás probando en local, usa http://localhost:PORT/api/auth/registro
            const respuesta = await fetch('http://localhost:3000/api/auth/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            });

            const data = await respuesta.json();

            // Si la respuesta fue exitosa (código 201)
            if (respuesta.ok) {
                // Como tu backend de registro ya devuelve un Token (ver línea 63 de auth.js), 
                // podemos guardar el token de una vez para iniciar sesión automáticamente
                localStorage.setItem('token', data.token);
                localStorage.setItem('rolUsuario', data.rol);
                
                alert(`¡Registro exitoso! Bienvenido, tu rol es: ${data.rol}`);
                
                // Redirigimos al Dashboard (inicio.html) en lugar del login
                window.location.href = 'inicio.html';
            } else {
                alert(`Error al registrar: ${data.mensaje}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Hubo un problema al conectar con el servidor. Verifica tu conexión o revisa la terminal de Node.js');
        }
    });
});