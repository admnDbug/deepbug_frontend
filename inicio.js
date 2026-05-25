document.addEventListener('DOMContentLoaded', () => {
    // 0. DETECCIÓN DE CACHÉ
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) window.location.reload();
    });

    // 1. VERIFICACIÓN DE SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.replace('login.html');
        return;
    }

    const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Usuario';
    document.getElementById('nombreUsuarioTop').textContent = nombreUsuario;

    // ==========================================
    // 2. LÓGICA DEL MAPA GEOGRÁFICO Y FILTROS
    // ==========================================
    let mapaDash;
    let marcadoresCapa;
    let dataEstacionesGlobal = [];

    function inicializarMapaDashboard() {
        if (mapaDash) mapaDash.remove();
        // preferCanvas es OBLIGATORIO para que html2pdf exporte los puntos
        mapaDash = L.map('mapa-dashboard', { preferCanvas: true }).setView([19.4326, -99.1332], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 18
        }).addTo(mapaDash);
        
        marcadoresCapa = L.layerGroup().addTo(mapaDash);
    }

    function getColorBMWP(bmwp) {
        if (bmwp === null || bmwp === undefined) return '#808080';
        if (bmwp > 68) return '#0d6efd';
        if (bmwp > 52) return '#0dcaf0';
        if (bmwp > 39) return '#198754';
        if (bmwp > 26) return '#ffc107';
        return '#fd7e14';
    }

    function obtenerCalidadBMWP(bmwp) {
        if (bmwp === null || bmwp === undefined) return 'Sin evaluar';
        if (bmwp > 68) return 'Excelente';
        if (bmwp > 52) return 'Muy buena';
        if (bmwp > 39) return 'Buena';
        if (bmwp > 26) return 'Regular';
        return 'Mala/Pésima';
    }

    async function cargarDatosMapa() {
        try {
            // Nota: usando la misma URL staging que usas en el resto de tu JS
            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/estaciones/mapa-datos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(!res.ok) throw new Error("Error en ruta mapa-datos");
            
            const datos = await res.json();
            dataEstacionesGlobal = datos;
            
            llenarFiltros(datos);
            renderizarMapaYTabla(datos);
        } catch (error) {
            console.error("Error al cargar datos geográficos:", error);
        }
    }

    function llenarFiltros(datos) {
        const selectZona = document.getElementById('filtro-zona');
        const selectEstacion = document.getElementById('filtro-estacion');
        
        const zonasMap = new Map();
        datos.forEach(est => {
            if(est.zona_id) zonasMap.set(est.zona_id._id, est.zona_id.nombre);
        });

        zonasMap.forEach((nombre, id) => {
            selectZona.insertAdjacentHTML('beforeend', `<option value="${id}">${nombre}</option>`);
        });

        selectZona.addEventListener('change', (e) => {
            const zonaId = e.target.value;
            selectEstacion.innerHTML = '<option value="todas">Todas las estaciones</option>';
            
            if (zonaId === 'todas') {
                selectEstacion.disabled = true;
                renderizarMapaYTabla(dataEstacionesGlobal);
            } else {
                selectEstacion.disabled = false;
                const filtradas = dataEstacionesGlobal.filter(est => est.zona_id && est.zona_id._id === zonaId);
                filtradas.forEach(est => {
                    // Prevenir fallback si en BD aún dice nombre_proyecto
                    const nombre = est.nombre_estacion || est.nombre_proyecto;
                    selectEstacion.insertAdjacentHTML('beforeend', `<option value="${est._id}">${nombre}</option>`);
                });
                renderizarMapaYTabla(filtradas);
            }
        });

        selectEstacion.addEventListener('change', (e) => {
            const estId = e.target.value;
            if (estId === 'todas') {
                const zonaId = document.getElementById('filtro-zona').value;
                renderizarMapaYTabla(dataEstacionesGlobal.filter(est => est.zona_id && est.zona_id._id === zonaId));
            } else {
                renderizarMapaYTabla(dataEstacionesGlobal.filter(est => est._id === estId));
            }
        });
    }

    function renderizarMapaYTabla(datos) {
        marcadoresCapa.clearLayers();
        const tbody = document.getElementById('tabla-mapa-body');
        tbody.innerHTML = '';
        
        const bounds = [];

        datos.forEach(est => {
            const latTexto = est.latitud ? est.latitud.toFixed(5) : 'N/A';
            const lngTexto = est.longitud ? est.longitud.toFixed(5) : 'N/A';
            const color = getColorBMWP(est.bmwp_total);
            const calidad = obtenerCalidadBMWP(est.bmwp_total);
            const nombreMostrado = est.nombre_estacion || est.nombre_proyecto || 'Sin Nombre';

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="fw-bold">${nombreMostrado}</td>
                    <td>${est.zona_id ? est.zona_id.nombre : 'Sin Zona'}</td>
                    <td class="text-muted">${latTexto}, ${lngTexto}</td>
                    <td class="fw-bold" style="color: ${color};">${est.bmwp_total !== null ? est.bmwp_total : '-'}</td>
                    <td><span class="badge" style="background-color: ${color};">${calidad}</span></td>
                </tr>
            `);

            if (est.latitud && est.longitud && !isNaN(est.latitud) && !isNaN(est.longitud)) {
                bounds.push([est.latitud, est.longitud]);
                const marker = L.circleMarker([est.latitud, est.longitud], {
                    radius: 8, fillColor: color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.9
                });
                
                marker.bindPopup(`<b>${nombreMostrado}</b><br>BMWP: ${est.bmwp_total !== null ? est.bmwp_total : 'N/A'}`);
                marcadoresCapa.addLayer(marker);
            }
        });

        if (bounds.length > 0) mapaDash.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Exportación a PDF
    const btnDescargarMapa = document.getElementById('btn-descargar-mapa');
    if(btnDescargarMapa) {
        btnDescargarMapa.addEventListener('click', () => {
            const elemento = document.getElementById('reporte-mapa-exportar');
            const opt = {
                margin:       10,
                filename:     'Reporte_Geografico_DeepBug.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(elemento).save();
        });
    }

    // ==========================================
    // 3. CARGA DE TARJETAS DE ESTACIONES
    // ==========================================
    async function cargarProyectos() {
        try {
            const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/estaciones', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error('Error al obtener los proyectos');

            const proyectos = await respuesta.json();
            const contenedor = document.getElementById('contenedorProyectos');
            
            // Mantenemos solo el primer hijo (El botón de "Nuevo Proyecto") y limpiamos el resto
            const tarjetasAisladas = contenedor.querySelectorAll('.col:not(:first-child)');
            tarjetasAisladas.forEach(t => t.remove());

            proyectos.forEach(proyecto => {
                const fechaStr = proyecto.fecha_creacion 
                    ? new Date(proyecto.fecha_creacion).toLocaleDateString('es-MX') 
                    : 'Sin fecha';
                
                const nombreZona = (proyecto.zona_id && proyecto.zona_id.nombre) 
                    ? proyecto.zona_id.nombre 
                    : 'Zona no especificada';

                const estadoP1 = (proyecto.estado_protocolos && proyecto.estado_protocolos.protocolo1) || 0;
                let alertaHTML = '';
                if (estadoP1 === 0) {
                    alertaHTML = `<div class="alert alert-danger p-2 mb-3 text-center rounded-3 shadow-sm" style="font-size: 0.8rem; font-weight: bold;"><i class="fas fa-exclamation-triangle me-1"></i> Llenar Protocolo 1 antes de campo</div>`;
                }

                const nombreMostrar = proyecto.nombre_estacion || proyecto.nombre_proyecto;

                const tarjetaHTML = `
                <div class="col">
                    <div class="project-card">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-file-alt card-icon me-2"></i>
                            <a class="card-title text-truncate" href="verproyecto.html?id=${proyecto._id}">${nombreMostrar}</a>
                        </div>
                        ${alertaHTML}
                        <div class="info-text">
                            <strong>Zona:</strong><br>${nombreZona}
                        </div>
                        <div class="info-text">
                            <strong>Fecha de creación:</strong> ${fechaStr}
                        </div>
                        <div class="info-text">
                            <strong>Código:</strong> ${proyecto.codigo_invitacion || 'N/A'}
                        </div>
                    </div>
                </div>
                `;

                contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
            });

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudieron cargar tus proyectos.');
        }
    }

    // ==========================================
    // 4. ACCIONES GENERALES (UNIRSE Y SALIR)
    // ==========================================
    const btnUnirse = document.getElementById('btnUnirseProyecto');
    if (btnUnirse) {
        btnUnirse.addEventListener('click', async () => {
            const codigo = document.getElementById('codigoInvitacionInput').value;
            if (!codigo) return alert('Ingresa un código');

            try {
                const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/validar-codigo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ codigo })
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert(data.mensaje);
                    window.location.reload(); 
                } else {
                    alert(data.mensaje);
                }
            } catch (error) {
                console.error(error);
                alert('Error al intentar unirse al proyecto.');
            }
        });
    }

    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear(); 
        window.location.replace('login.html');
    });

    // ==========================================
    // INICIALIZACIÓN SECUENCIAL
    // ==========================================
    setTimeout(() => {
        inicializarMapaDashboard();
        cargarDatosMapa();
        cargarProyectos();
    }, 200); // Pequeño retraso para que los divs se rendericen correctamente
});