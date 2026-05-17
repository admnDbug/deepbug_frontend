document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICACIÓN DE SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.href = 'login.html';
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
            window.location.href = 'login.html';
        });
    }

    // 4. Inicializar el mapa de Leaflet
    const map = L.map('mapa-consultas').setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const searchInput = document.querySelector('.table-info-search-input');
    const containerTabla = document.querySelector('.container-fluid.px-4');

    function getColorBMWP(bmwp) {
        if (bmwp === null || bmwp === undefined) return '#808080';
        if (bmwp > 100) return '#00008B';
        if (bmwp >= 61 && bmwp <= 100) return '#ADD8E6';
        if (bmwp >= 36 && bmwp <= 60) return '#008000';
        if (bmwp >= 16 && bmwp <= 35) return '#FFFF00';
        if (bmwp >= 11 && bmwp <= 15) return '#FFA500';
        return '#FF0000';
    }

    // 5. Cargar proyectos
    async function cargarProyectos() {
        try {
            const response = await fetch('http://localhost:3000/api/biomonitoreos/consultas/todos', {
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

    function renderizarMapa(proyectos) {
        proyectos.forEach(proyecto => {
            if (proyecto.zona_id && proyecto.zona_id.coordenadas) {
                const coordsArray = proyecto.zona_id.coordenadas.split(',').map(c => parseFloat(c.trim()));
                
                if (coordsArray.length === 2 && !isNaN(coordsArray[0]) && !isNaN(coordsArray[1])) {
                    const colorPunto = getColorBMWP(proyecto.bmwp_total);
                    
                    const marker = L.circleMarker(coordsArray, {
                        radius: 8,
                        fillColor: colorPunto,
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.9
                    }).addTo(map);
                    
                    const estadoTexto = proyecto.bmwp_total !== null ? `Puntaje: ${proyecto.bmwp_total}` : 'Aún sin evaluación';
                    marker.bindPopup(`
                        <div style="text-align: center;">
                            <strong>${proyecto.nombre_proyecto}</strong><br>
                            <span style="font-size: 12px; color: #555;">${proyecto.zona_id.nombre}</span><br>
                            <span style="display: inline-block; margin-top: 5px; padding: 3px 8px; border-radius: 4px; background: ${colorPunto}; color: ${colorPunto === '#FFFF00' || colorPunto === '#ADD8E6' ? '#000' : '#fff'};">
                                BMWP: ${estadoTexto}
                            </span>
                        </div>
                    `);
                }
            }
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