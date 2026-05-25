document.addEventListener('DOMContentLoaded', async () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    // 1. VERIFICACIÓN DE SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.replace('login.html');
        return;
    }

    // 2. ACTUALIZAR INTERFAZ CON DATOS DEL USUARIO
    const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Usuario';
    const spanUsuario = document.getElementById('nombreUsuarioTop');
    if (spanUsuario) spanUsuario.textContent = nombreUsuario;

    // 3. CERRAR SESIÓN
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.replace('login.html');
        });
    }


    // 5. Cargar proyectos
    async function cargarProyectos() {
        try {
            const response = await fetch('https://deepbug-backend-staging.onrender.com/api/estaciones/consultas/todos', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });

            // MEJORA: Leer el error exacto que manda el backend
            if (!response.ok) {
                const errorInfo = await response.json().catch(() => ({}));
                throw new Error(errorInfo.mensaje || `Error HTTP: ${response.status}`);
            }

            const proyectos = await response.json();
            renderizarTabla(proyectos);
            renderizarMapa(proyectos);

        } catch (error) {
            console.error('Detalle técnico del error:', error);
            alert(`No se pudieron cargar los proyectos. Razón: ${error.message}`);
        }
    }

    function renderizarTabla(proyectos) {
        document.querySelectorAll('.table-info-data-row').forEach(row => row.remove());

        proyectos.forEach(proyecto => {
            const row = document.createElement('div');
            row.className = 'table-info-data-row';
            
            const fechaStr = new Date(proyecto.fecha_creacion).toLocaleDateString('es-MX');
            const respNombre = proyecto.responsable_id && proyecto.responsable_id.length > 0 
                                ? proyecto.responsable_id[0].nombre 
                                : 'Sin responsable';
            const zonaNombre = proyecto.zona_id ? proyecto.zona_id.nombre : 'Sin zona';
            const ubicacion = proyecto.zona_id && proyecto.zona_id.ubicacion ? proyecto.zona_id.ubicacion : 'N/A';

            row.innerHTML = `
                <div class="table-info-col-name table-info-text" data-label="Proyecto">${proyecto.nombre_proyecto}</div>
                <div class="table-info-col-resp table-info-text" data-label="Responsable">${respNombre}</div>
                <div class="table-info-col-zona table-info-text" data-label="Zona">${zonaNombre}</div>
                <div class="table-info-col-ubic table-info-text" data-label="Ubicación">${ubicacion}</div>
                <div class="table-info-col-date table-info-text" data-label="Fecha">${fechaStr}</div>
                <div class="table-info-col-act">
                    <a class="table-info-btn-view" href="verproyecto.html?id=${proyecto._id}">Ver Proyecto</a>
                </div>
            `;
            containerTabla.appendChild(row);
        });
    }

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const projectRows = document.querySelectorAll('.table-info-data-row');

        projectRows.forEach(row => {
            const textContent = row.textContent.toLowerCase();
            row.style.display = textContent.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    cargarProyectos();
});