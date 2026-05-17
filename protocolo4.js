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
    const rolUsuario = localStorage.getItem('rolUsuario');
    if (!token) return window.location.replace('login.html');
    
    document.querySelector('.fw-bold.text-dark').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    // --- 2. PREPARAR EL HTML PARA CONECTARLO AL BACKEND ---
    const inputsPct = document.querySelectorAll('.habitat-item .habitat-pct');
    if(inputsPct[0]) inputsPct[0].id = 'porcentaje_h1';
    if(inputsPct[1]) inputsPct[1].id = 'porcentaje_h2';
    if(inputsPct[2]) inputsPct[2].id = 'porcentaje_h3';
    if(inputsPct[3]) inputsPct[3].id = 'porcentaje_h4';
    if(inputsPct[4]) inputsPct[4].id = 'porcentaje_h5';

    const inputsArrastre = document.querySelectorAll('#collapseHabitat .rounded-pill');
    if(inputsArrastre[0]) inputsArrastre[0].id = 'arrastre_h1';
    if(inputsArrastre[1]) inputsArrastre[1].id = 'arrastre_h2';
    if(inputsArrastre[2]) inputsArrastre[2].id = 'arrastre_h3';
    if(inputsArrastre[3]) inputsArrastre[3].id = 'arrastre_h4';
    if(inputsArrastre[4]) inputsArrastre[4].id = 'arrastre_h5';
    if(inputsArrastre[5]) inputsArrastre[5].id = 'metodo_colecta';

    const txtObservaciones = document.querySelector('#collapseObs textarea');
    if(txtObservaciones) txtObservaciones.id = 'observaciones';

    // --- 3. GENERAR FAUNA Y ESTIMACIÓN ---
    const llavesFauna = ['Perifiton', 'Algas filament.', 'Macrófitas', 'Macroinvertebrados', 'Peces', 'Porífera'];
    const llavesEstimacion = ['Gasteropoda', 'Bivalvia', 'Turbellaria', 'Oligochaeta', 'Hirudinea', 'Diptera', 'Amphipoda', 'Isopoda', 'Cangrejo', 'Camarón', 'Ephemeroptera', 'Plecoptera', 'Odonata', 'Hemiptera', 'Megaloptera', 'Trichoptera', 'Lepidoptera', 'Coleoptera'];
    
    function generarSliders(contenedorSelector, llaves, prefixClass) {
        const cont = document.querySelector(contenedorSelector);
        if(!cont) return;
        
        const legend = cont.querySelector('.metric-legend-deep'); 
        cont.innerHTML = '';
        if (legend) cont.appendChild(legend);

        let rowDiv = document.createElement('div');
        rowDiv.className = 'row g-4';
        
        llaves.forEach(llave => {
            const html = `
                <div class="col-md-6 col-lg-4 fauna-metric-item">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-bold mt-2 text-truncate" style="max-width:70%">${llave}</span> 
                        <span class="metric-num fw-bold mt-2 text-primary">0</span>
                    </div>
                    <div class="metric-bar-deep" data-value="0">
                        <div class="m-segment"></div><div class="m-segment"></div><div class="m-segment"></div><div class="m-segment"></div>
                        <input type="range" class="metric-slider d-none ${prefixClass}" data-key="${llave}" min="0" max="4" step="1" value="0" disabled>
                    </div>
                </div>
            `;
            rowDiv.insertAdjacentHTML('beforeend', html);
        });
        cont.appendChild(rowDiv);
    }

    generarSliders('#collapseFauna .protocolOne-accordion-body', llavesFauna, 'slider-fauna');
    generarSliders('#collapseEstimacion .protocolOne-accordion-body', llavesEstimacion, 'slider-estimacion');

    // --- 4. LÓGICA DE INTERFAZ VISUAL ---
    const btnModificar = document.getElementById('btnModificar');
    const btnGuardar = document.getElementById('btnGuardar');

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('habitat-pct')) {
            const val = Math.min(100, Math.max(0, e.target.value));
            e.target.value = val;
            const bar = e.target.closest('.habitat-item').querySelector('.progress-fill');
            if (bar) bar.style.width = val + '%';
        }
        
        if (e.target.classList.contains('metric-slider')) {
            const val = e.target.value;
            const bar = e.target.closest('.metric-bar-deep');
            const num = e.target.closest('.fauna-metric-item').querySelector('.metric-num');
            if (bar) bar.setAttribute('data-value', val);
            if (num) num.innerText = val;
        }
    });

    // --- 5. CARGAR NOMBRE DEL PROYECTO ---
    cargarNombreProyecto();
    
    async function cargarNombreProyecto() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/biomonitoreos/${proyectoId}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                const proyecto = await res.json();
                document.getElementById('nombre-proyecto-nav').textContent = proyecto.nombre_proyecto;
                document.getElementById('link-proyecto-top').href = `verproyecto.html?id=${proyectoId}`;
            } else {
                document.getElementById('nombre-proyecto-nav').textContent = "Proyecto Desconocido";
            }
        } catch (error) {
            console.error("Error al obtener el proyecto:", error);
            document.getElementById('nombre-proyecto-nav').textContent = "Error de conexión";
        }
    }

    // --- 6. CARGAR DATOS DESDE EL BACKEND ---
    cargarProtocolo();

    async function cargarProtocolo() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await res.json();
            const protocolo4 = protocolos.find(p => p.protocolo_numero == 4 && p.estado === 'aprobado');

            if (!protocolo4) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') habilitarEdicion();
            } else {
                document.getElementById('estado-texto').textContent = "Modo Visualización";
                llenarFormulario(protocolo4.datos_formulario);
                if (rolUsuario === 'Responsable' && btnModificar) btnModificar.style.display = 'inline-block';
            }

            // Aplicar Roles
            document.querySelectorAll("[data-role]").forEach(el => {
                const rolesPermitidos = el.getAttribute("data-role").split(" ");
                if (!rolesPermitidos.includes(rolUsuario) && !rolesPermitidos.includes(rolUsuario.toLowerCase())) {
                    el.classList.add('d-none');
                }
            });
        } catch (error) { console.error("Error al cargar:", error); }
    }

    function llenarFormulario(form) {
        if(!form) return;

        // 1. Llenar Textos Fijos y Otros
        if (form.textos) {
            ['porcentaje_h1', 'porcentaje_h2', 'porcentaje_h3', 'porcentaje_h4', 'porcentaje_h5', 
             'arrastre_h1', 'arrastre_h2', 'arrastre_h3', 'arrastre_h4', 'arrastre_h5', 
             'metodo_colecta', 'observaciones', 'otros_habitat'].forEach(id => {
                const el = document.getElementById(id);
                if (el && form.textos[id] !== undefined) {
                    el.value = form.textos[id];
                    el.dispatchEvent(new Event('input', { bubbles: true })); 
                }
            });
        }

        // 2. Llenar Fauna
        if (form.fauna_asociada) {
            document.querySelectorAll('.slider-fauna').forEach(slider => {
                const key = slider.getAttribute('data-key');
                if(form.fauna_asociada[key] !== undefined) {
                    slider.value = form.fauna_asociada[key];
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }

        // 3. Llenar Estimación
        if (form.estimacion_preliminar) {
            document.querySelectorAll('.slider-estimacion').forEach(slider => {
                const key = slider.getAttribute('data-key');
                if(form.estimacion_preliminar[key] !== undefined) {
                    slider.value = form.estimacion_preliminar[key];
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
    }

    // --- 7. HABILITAR EDICIÓN ---
    function habilitarEdicion() {
        document.getElementById('estado-texto').textContent = "Modo Edición";
        document.querySelectorAll('#protocolFourAccordion input, #protocolFourAccordion textarea').forEach(el => el.disabled = false);
        document.querySelectorAll('.metric-slider').forEach(el => el.classList.remove('d-none'));
        if (btnModificar) btnModificar.style.display = 'none';
        if (btnGuardar) btnGuardar.style.display = 'inline-block';
    }

    if (btnModificar) btnModificar.addEventListener('click', habilitarEdicion);

    // --- 8. GUARDAR Y EMPAQUETAR JSON ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();
            const textos = {};
            
            ['porcentaje_h1', 'porcentaje_h2', 'porcentaje_h3', 'porcentaje_h4', 'porcentaje_h5', 
             'arrastre_h1', 'arrastre_h2', 'arrastre_h3', 'arrastre_h4', 'arrastre_h5', 
             'metodo_colecta', 'observaciones', 'otros_habitat'].forEach(id => {
                const el = document.getElementById(id);
                if(el) textos[id] = el.value.trim();
            });

            const fauna_asociada = {};
            document.querySelectorAll('.slider-fauna').forEach(s => fauna_asociada[s.getAttribute('data-key')] = parseInt(s.value));

            const estimacion_preliminar = {};
            document.querySelectorAll('.slider-estimacion').forEach(s => estimacion_preliminar[s.getAttribute('data-key')] = parseInt(s.value));

            const datos_formulario = { textos, fauna_asociada, estimacion_preliminar };
            const paqueteSincronizacion = {
                protocolos: [{ biomonitoreo_id: proyectoId, protocolo_numero: 4, datos_formulario: datos_formulario }]
            };

            try {
                btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
                btnGuardar.disabled = true;

                const res = await fetch('https://deepbug-backend.onrender.com/api/protocolos/sincronizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(paqueteSincronizacion)
                });

                if (res.ok) {
                    alert("Protocolo 4 guardado exitosamente.");
                    window.location.reload(); 
                } else {
                    const data = await res.json(); alert(`Error: ${data.mensaje}`);
                }
            } catch (error) {
                alert("Error de conexión al guardar.");
            } finally {
                btnGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Guardar y Sincronizar';
                btnGuardar.disabled = false;
            }
        });
    }
});