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
    if (!token) {
        window.location.replace('login.html');
        return;
    }
    
    const nombreUsuarioTop = document.querySelector('.fw-bold.text-dark');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    // --- 2. CARGAR ZONAS ---
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

    // --- 3. VALIDACIÓN EN TIEMPO REAL (Botón dinámico) ---
    const inputNombre = document.getElementById('nombreProyecto');
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

    // --- 4. GUARDAR EN MONGODB ---
    const formCrearProyecto = document.getElementById('formCrearProyecto');
    
    formCrearProyecto.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página recargue
        
        // Animación de carga en el botón
        const textoOriginal = btnGuardarFinal.innerHTML;
        btnGuardarFinal.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
        btnGuardarFinal.style.pointerEvents = "none";

        const nuevoProyecto = {
            nombre_proyecto: inputNombre.value.trim(),
            zona_id: selectZona.value
        };

        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/biomonitoreos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevoProyecto)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                const codigo = data.proyecto.codigo_invitacion;
                alert(`¡Proyecto creado exitosamente!\n\nEl código de invitación para tu equipo es: ${codigo}\n\nGuárdalo bien.`);
                window.location.href = 'inicio.html';
            } else {
                alert(`Error: ${data.mensaje}`);
                btnGuardarFinal.innerHTML = textoOriginal;
                btnGuardarFinal.style.pointerEvents = "auto";
            }
        } catch (error) {
            console.error("Error al crear proyecto:", error);
            alert("Error de conexión al crear el proyecto.");
            btnGuardarFinal.innerHTML = textoOriginal;
            btnGuardarFinal.style.pointerEvents = "auto";
        }
    });
});