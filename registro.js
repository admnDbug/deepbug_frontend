document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
    const formRegistro = document.getElementById('formRegistro');

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const institucion = document.getElementById('institucion').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const codigo = document.getElementById('codigo').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden. Por favor, verifica.');
            return;
        }

        const nombreCompleto = `${nombre} ${apellidos}`;

        const datosUsuario = {
            nombre: nombreCompleto,
            email: email,
            password: password,
            institucion: institucion,
            codigo: codigo 
        };

        try {
            const respuesta = await fetch(' /api/auth/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('rolUsuario', data.rol);
                
                alert(`¡Registro exitoso! Bienvenido, tu rol es: ${data.rol}`);
                
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