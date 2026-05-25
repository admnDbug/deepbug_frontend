document.addEventListener('DOMContentLoaded', async () => {
    // 1. SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }

    // 2. ACTUALIZAR INTERFAZ
    const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Usuario';
    const spanUsuario = document.getElementById('nombreUsuarioTop');
    if (spanUsuario) spanUsuario.textContent = nombreUsuario;

    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.replace('login.html');
        });
    }

    // 3. CARGAR ESTACIONES (Ruta corregida hacia el nuevo backend)
    const containerTabla = document.getElementById('contenedor-consultas'); // Asegúrate que este sea el ID en tu HTML

    async function cargarEstaciones() {
        try {
            // CAMBIO: Ahora usamos la ruta base de estaciones
            const response = await fetch('https://deepbug-backend-staging.onrender.com/api/estaciones', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al conectar con la API');

            const estaciones = await response.json();
            
            // Limpiamos tabla
            containerTabla.innerHTML = '';

            estaciones.forEach(estacion => {
                const row = document.createElement('div');
                row.className = 'table-info-data-row';

                const fechaStr = estacion.fecha_creacion ? new Date(estacion.fecha_creacion).toLocaleDateString('es-MX') : 'S/F';
                const respNombre = (estacion.responsable_id && estacion.responsable_id.length > 0) 
                    ? estacion.responsable_id[0].nombre 
                    : 'Sin responsable';
                const zonaNombre = estacion.zona_id ? estacion.zona_id.nombre : 'Sin zona';
                const ubicacion = estacion.zona_id && estacion.zona_id.ubicacion ? estacion.zona_id.ubicacion : 'N/A';

                row.innerHTML = `
                    <div class="table-info-col-name table-info-text" data-label="Estación">${estacion.nombre_estacion}</div>
                    <div class="table-info-col-resp table-info-text" data-label="Responsable">${respNombre}</div>
                    <div class="table-info-col-zona table-info-text" data-label="Zona">${zonaNombre}</div>
                    <div class="table-info-col-ubic table-info-text" data-label="Ubicación">${ubicacion}</div>
                    <div class="table-info-col-date table-info-text" data-label="Fecha">${fechaStr}</div>
                    <div class="table-info-col-act">
                        <a class="table-info-btn-view" href="verestacion.html?id=${estacion._id}">Ver Estación</a>
                    </div>
                `;
                containerTabla.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            containerTabla.innerHTML = '<p class="text-center text-danger mt-4">Error al cargar las estaciones.</p>';
        }
    }

    // 4. BUSCADOR
    const searchInput = document.getElementById('search-consultas'); // Asegúrate de tener este ID en tu HTML
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const rows = document.querySelectorAll('.table-info-data-row');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }

    cargarEstaciones();
});