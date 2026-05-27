document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }

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

    let mapaDash;
    let marcadoresCapa;
    let dataEstacionesGlobal = [];
    const containerTabla = document.getElementById('contenedor-consultas');
    const searchInput = document.getElementById('search-consultas');

    function inicializarMapaDashboard() {
        if (mapaDash) mapaDash.remove();
        mapaDash = L.map('mapa-dashboard', { preferCanvas: true }).setView([19.4326, -99.1332], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', 
            maxZoom: 18,
            crossOrigin: 'anonymous'
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

    async function cargarDatosMapaYTabla() {
        try {
            const res = await fetch('https://deepbug-backend.onrender.com/api/estaciones/mapa-datos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(!res.ok) throw new Error("Error en ruta mapa-datos");
            
            const datos = await res.json();
            dataEstacionesGlobal = datos;
            
            llenarFiltros(datos);
            renderizarMapaYTabla(datos);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            containerTabla.innerHTML = '<p class="text-center text-danger mt-4">Error al cargar las estaciones.</p>';
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
                    const nombre = est.nombre_estacion || est.nombre_estacion;
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
        containerTabla.innerHTML = '';
        
        const bounds = [];

        datos.forEach(est => {
            const latTexto = est.latitud ? est.latitud.toFixed(5) : 'N/A';
            const lngTexto = est.longitud ? est.longitud.toFixed(5) : 'N/A';
            const color = getColorBMWP(est.bmwp_total);
            const calidad = obtenerCalidadBMWP(est.bmwp_total);
            const nombreMostrado = est.nombre_estacion || 'Sin Nombre';
            const zonaNombre = est.zona_id ? est.zona_id.nombre : 'Sin Zona';

            const row = document.createElement('div');
            row.className = 'table-info-data-row';
            row.innerHTML = `
                <div class="table-info-col-name table-info-text fw-bold" data-label="Estación">${nombreMostrado}</div>
                <div class="table-info-col-zona table-info-text" data-label="Zona">${zonaNombre}</div>
                <div class="table-info-col-ubic table-info-text" data-label="Coordenadas">${latTexto}, ${lngTexto}</div>
                <div class="table-info-col-date table-info-text fw-bold" data-label="BMWP" style="color: ${color};">${est.bmwp_total !== null ? est.bmwp_total : '-'}</div>
                <div class="table-info-col-resp table-info-text" data-label="Calidad"><span class="badge" style="background-color: ${color};">${calidad}</span></div>
                <div class="table-info-col-act">
                    <a class="table-info-btn-view" href="verestacion.html?id=${est._id}">Ver Visualización</a>
                </div>
            `;
            containerTabla.appendChild(row);

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
        
        aplicarBusqueda();
    }

    function aplicarBusqueda() {
        if (!searchInput) return;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.table-info-data-row');
        rows.forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', aplicarBusqueda);
    }

    const btnDescargarMapa = document.getElementById('btn-descargar-mapa');
    if (btnDescargarMapa) {
        btnDescargarMapa.addEventListener('click', () => {
            if (dataEstacionesGlobal.length === 0) {
                alert("Aún no hay datos cargados para descargar.");
                return;
            }
            
            const elemento = document.getElementById('reporte-mapa-exportar');
            btnDescargarMapa.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generando PDF...';
            btnDescargarMapa.disabled = true;

            const opt = {
                margin:       10,
                filename:     'Reporte_Directorio_DeepBug.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    allowTaint: true,
                    ignoreElements: (node) => {
                        if (node.classList && node.classList.contains('leaflet-control-zoom')) return true;
                        if (node.tagName && node.tagName.toLowerCase() === 'select') return true;
                        if (node.classList && node.classList.contains('table-info-search-wrapper')) return true;
                        if (node.classList && node.classList.contains('table-info-col-act')) return true;
                        if (node.classList && node.classList.contains('table-info-btn-view')) return true;
                        return false;
                    }
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
                pagebreak:    { mode: ['css', 'avoid-all'] }
            };
            
            html2pdf().set(opt).from(elemento).save().then(() => {
                btnDescargarMapa.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Descargar Reporte y Mapa';
                btnDescargarMapa.disabled = false;
            }).catch(err => {
                console.error("Error generando PDF:", err);
                alert("Ocurrió un error al generar el PDF.");
                btnDescargarMapa.innerHTML = '<i class="fas fa-file-pdf me-1"></i> Descargar Reporte y Mapa';
                btnDescargarMapa.disabled = false;
            });
        });
    }

    setTimeout(() => {
        inicializarMapaDashboard();
        cargarDatosMapaYTabla();
    }, 200);
});