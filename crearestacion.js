document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }
    
    const nombreUsuarioTop = document.querySelector('.fw-bold.text-dark');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    cargarZonas();

    async function cargarZonas() {
        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/zonas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const zonas = await respuesta.json();
            const selectZona = document.getElementById('zonaSelect');
            
            selectZona.innerHTML = '<option value="">Selecciona una zona...</option>';
            zonas.forEach(zona => {
                selectZona.innerHTML += `<option value="${zona._id}">${zona.nombre}</option>`;
            });
        } catch (error) {
            console.error("Error al cargar zonas:", error);
            document.getElementById('zonaSelect').innerHTML = '<option value="">Error al cargar zonas</option>';
        }
    }

    const inputNombre = document.getElementById('nombreEstacion');
    const selectZona = document.getElementById('zonaSelect');
    const btnGuardarFinal = document.getElementById('btnGuardarFinal');

    function revisarFormulario() {
        if (inputNombre.value.trim() !== "" && selectZona.value !== "") {
            btnGuardarFinal.classList.remove('disabled');
            btnGuardarFinal.style.pointerEvents = "auto";
        } else {
            btnGuardarFinal.classList.add('disabled');
            btnGuardarFinal.style.pointerEvents = "none";
        }
    }

    inputNombre.addEventListener('input', revisarFormulario);
    selectZona.addEventListener('change', revisarFormulario);

    const formCrearEstacion = document.getElementById('formCrearEstacion');
    
    formCrearEstacion.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const textoOriginal = btnGuardarFinal.innerHTML;
        btnGuardarFinal.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
        btnGuardarFinal.style.pointerEvents = "none";

        const nuevoEstacion = {
            nombre_estacion: inputNombre.value.trim(),
            zona_id: selectZona.value
        };

        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/estaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevoEstacion)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                const codigo = data.estacion.codigo_invitacion;
                alert(`¡Estacion creada exitosamente!\n\nEl código de invitación para tu equipo es: ${codigo}\n\nGuárdalo bien.`);
                window.location.href = 'inicio.html';
            } else {
                alert(`Error: ${data.mensaje}`);
                btnGuardarFinal.innerHTML = textoOriginal;
                btnGuardarFinal.style.pointerEvents = "auto";
            }
        } catch (error) {
            console.error("Error al crear estacion:", error);
            alert("Error de conexión al crear la estacion.");
            btnGuardarFinal.innerHTML = textoOriginal;
            btnGuardarFinal.style.pointerEvents = "auto";
        }
    });
});