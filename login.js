document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
    const formLogin = document.getElementById('formLogin');
    const emailInput = document.getElementById('emailLogin');
    const passwordInput = document.getElementById('passwordLogin');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    if (localStorage.getItem('correoGuardado')) {
        emailInput.value = localStorage.getItem('correoGuardado');
        rememberMeCheckbox.checked = true;
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        if (rememberMeCheckbox.checked) {
            localStorage.setItem('correoGuardado', email);
        } else {
            localStorage.removeItem('correoGuardado');
        }

        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('rolUsuario', data.usuario.rol);
                localStorage.setItem('nombreUsuario', data.usuario.nombre);
                
                window.location.href = 'inicio.html';
            } else {
                alert(`Error: ${data.mensaje}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor. Verifica que Node.js esté encendido.');
        }
    });
});