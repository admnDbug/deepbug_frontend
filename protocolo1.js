document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    
    if (!token) return window.location.href = 'login.html';
    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    let esModoEdicion = false;

    // Listas
    const listParametrosInSitu = ['Conductividad', 'pH', 'Temperatura', 'Oxígeno disuelto', 'Salinidad', 'Turbiedad'];
    const listEquiposPatrones = ['Flujómetro', 'Termómetro', 'Conductivímetro', 'Multiparámetros', 'GPS'];
    const listInsumos = ['Red tipo D', 'Envases plásticos', 'Caja de Herramienta', 'R. Triangular', 'Frascos fisicoq.', 'Tijeras', 'Celular', 'Cinta métrica', 'Bolsas herméticas', 'Lápices', 'C. fluorescentes', 'Tabla anot.', 'Lupas', 'Viales de plásticos', 'Alcohol', 'Tamices', 'Pilotos indelebles', 'C. adhesiva', 'Etiquetas', 'Pinzas entomol.', 'Guantes', 'Bandejas blancas', 'Mascarillas', 'Botellas de lavado'];

    // --- 2. GENERADORES DE INTERFAZ FIJA ---
    function generarInputsParametros() {
        const tbody = document.getElementById('tbody-parametros');
        tbody.innerHTML = '';
        listParametrosInSitu.forEach(param => {
            let row = `<tr>
                <td class="text-start fw-bold small text-muted" style="width:150px;">${param}</td>
                <td><input type="text" class="form-control proto-input param-unidad param-input-matrix" data-param="${param}" disabled></td>`;
            for(let i=1; i<=8; i++) {
                row += `<td><input type="text" class="form-control proto-input param-est param-input-matrix" data-param="${param}" data-est="${i}" disabled></td>`;
            }
            row += `<td><input type="text" class="form-control proto-input param-obs param-input-matrix" data-param="${param}" disabled style="text-align:left;"></td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }

    function generarEquiposPatrones() {
        const cont = document.getElementById('contenedor-equipos-patrones');
        cont.innerHTML = '';
        let html = '<div class="row g-2 mt-1">';
        
        listEquiposPatrones.forEach(eq => {
            html += `
            <div class="col-md-6 d-flex align-items-center gap-3 bg-white p-2 border rounded">
                <div class="form-check mb-0" style="width: 140px;">
                    <input class="form-check-input proto-input chk-equipo" type="checkbox" data-key="${eq}" disabled>
                    <label class="form-check-label small fw-bold">Llevar ${eq}</label>
                </div>
                <div class="form-check mb-0 border-start ps-3">
                    <input class="form-check-input proto-input chk-patron" type="checkbox" data-key="Patron_${eq}" disabled>
                    <label class="form-check-label small text-muted">Patrones de verificación</label>
                </div>
            </div>`;
        });
        
        // Cámara sin patrón
        html += `
        <div class="col-md-6 d-flex align-items-center gap-3 bg-white p-2 border rounded">
            <div class="form-check mb-0">
                <input class="form-check-input proto-input chk-equipo" type="checkbox" data-key="Cámara fotográfica" disabled>
                <label class="form-check-label small fw-bold">Cámara fotográfica</label>
            </div>
        </div></div>`;
        cont.innerHTML = html;
    }

    function generarInputsInsumos() {
        const cont = document.getElementById('contenedor-insumos');
        listInsumos.forEach(item => {
            cont.innerHTML += `
                <div class="col-md-4 col-sm-6 d-flex justify-content-between align-items-center bg-white p-2 rounded border shadow-sm">
                    <span class="small text-truncate" style="max-width: 70%;">${item}</span>
                    <input type="number" class="form-control form-control-sm proto-input input-insumo text-center" data-key="${item}" value="" placeholder="Ud." style="width: 60px;" disabled>
                </div>`;
        });
    }

    generarInputsParametros(); 
    generarEquiposPatrones();
    generarInputsInsumos();

    // --- 3. GENERADORES DINÁMICOS ---
    function agregarEstacionHTML(data = null) {
        const idx = document.querySelectorAll('.estacion-card').length + 1;
        const div = document.createElement('div');
        div.className = 'dynamic-container estacion-card';
        
        const estadoInput = esModoEdicion ? '' : 'disabled';
        const estadoBoton = esModoEdicion ? 'inline-block' : 'none';

        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong class="text-primary small"><i class="fas fa-map-pin me-1"></i>Estación ${idx}</strong>
                <button type="button" class="btn btn-sm text-danger border-0 proto-action btn-remove-est" style="display:${estadoBoton};"><i class="fas fa-trash"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-4"><label class="small text-muted mb-1">N° Control</label><input type="text" class="form-control form-control-sm proto-input est-control" placeholder="Ej. EST-001" value="${data?.control || ''}" ${estadoInput}></div>
                <div class="col-md-4"><label class="small text-muted mb-1">Lugar</label><input type="text" class="form-control form-control-sm proto-input est-lugar" placeholder="Lugar" value="${data?.lugar || ''}" ${estadoInput}></div>
                <div class="col-md-4"><label class="small text-muted mb-1">Tipo de Muestra</label><input type="text" class="form-control form-control-sm proto-input est-tipo" placeholder="Tipo Muestra" value="${data?.tipo_muestra || ''}" ${estadoInput}></div>
                <div class="col-md-6"><label class="small text-muted mb-1">Fecha</label><input type="text" class="form-control form-control-sm proto-input est-fecha" placeholder="DD/MM/YYYY" value="${data?.fecha || ''}" ${estadoInput}></div>
                <div class="col-md-6"><label class="small text-muted mb-1">Hora</label><input type="time" class="form-control form-control-sm proto-input est-hora" placeholder="Hora" value="${data?.hora || ''}" ${estadoInput}></div>
            </div>
        `;
        document.getElementById('contenedor-estaciones').appendChild(div);
        activarBotonesEliminar();
    }

    function agregarTecnicoHTML(nombre = '') {
        const div = document.createElement('div');
        div.className = 'd-flex gap-2 mb-2 tecnico-row align-items-center';
        
        const estadoInput = esModoEdicion ? '' : 'disabled';
        const estadoBoton = esModoEdicion ? 'inline-block' : 'none';

        div.innerHTML = `
            <i class="fas fa-user-tie text-secondary"></i>
            <input type="text" class="form-control form-control-sm proto-input input-tecnico" placeholder="Nombre completo del técnico" value="${nombre}" ${estadoInput}>
            <button type="button" class="btn btn-sm btn-outline-danger proto-action btn-remove-tec" style="display:${estadoBoton};"><i class="fas fa-times"></i></button>
        `;
        document.getElementById('contenedor-tecnicos').appendChild(div);
        activarBotonesEliminar();
    }

    function agregarOtroInsumo(nombre = '', cantidad = '') {
        const cont = document.getElementById('contenedor-otros-insumos');
        const div = document.createElement('div');
        div.className = 'col-md-6 col-lg-4 d-flex gap-2 align-items-center mb-2 otro-insumo-row';
        
        const estadoInput = esModoEdicion ? '' : 'disabled';
        const estadoBoton = esModoEdicion ? 'inline-block' : 'none';

        div.innerHTML = `
            <input type="text" class="form-control form-control-sm proto-input input-otro-nombre" placeholder="Nombre insumo" value="${nombre}" ${estadoInput}>
            <input type="number" class="form-control form-control-sm proto-input input-otro-cant text-center" placeholder="Cant." value="${cantidad}" style="width: 70px;" ${estadoInput}>
            <button type="button" class="btn btn-sm btn-outline-danger proto-action btn-remove-insumo" style="display:${estadoBoton};"><i class="fas fa-trash"></i></button>
        `;
        cont.appendChild(div);
        div.querySelector('.btn-remove-insumo').addEventListener('click', () => div.remove());
    }

    function activarBotonesEliminar() {
        document.querySelectorAll('.btn-remove-est').forEach(btn => btn.onclick = function() { this.closest('.estacion-card').remove(); });
        document.querySelectorAll('.btn-remove-tec').forEach(btn => btn.onclick = function() { this.closest('.tecnico-row').remove(); });
    }

    document.getElementById('btn-add-estacion').addEventListener('click', () => agregarEstacionHTML());
    document.getElementById('btn-add-tecnico').addEventListener('click', () => agregarTecnicoHTML());
    document.getElementById('btn-add-insumo').addEventListener('click', () => agregarOtroInsumo());

    // --- CARGAR NOMBRE DEL PROYECTO ---
    cargarNombreProyecto();
    async function cargarNombreProyecto() {
        try {
            const res = await fetch(`http://localhost:3000/api/biomonitoreos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const proyecto = await res.json();
                document.getElementById('nombre-proyecto-nav').textContent = proyecto.nombre_proyecto;
                document.getElementById('link-proyecto-top').href = `verproyecto.html?id=${proyectoId}`;
            } else {
                document.getElementById('nombre-proyecto-nav').textContent = "Proyecto Desconocido";
            }
        } catch (error) { document.getElementById('nombre-proyecto-nav').textContent = "Error de conexión"; }
    }
    
    // --- 4. CARGA DE DATOS DESDE EL BACKEND ---
    cargarProtocolo();

    async function cargarProtocolo() {
        try {
            const respuesta = await fetch(`http://localhost:3000/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await respuesta.json();
            const protocolo1 = protocolos.find(p => p.protocolo_numero == 1 && p.estado === 'aprobado');

            if (!protocolo1) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') {
                    habilitarEdicion();
                    agregarEstacionHTML(); 
                    agregarTecnicoHTML();  
                } else {
                    agregarEstacionHTML(); 
                    agregarTecnicoHTML(); 
                }
            } else {
                document.getElementById('estado-texto').textContent = "Modo Visualización";
                llenarFormulario(protocolo1.datos_formulario);
                if (rolUsuario === 'Responsable') document.getElementById('btnModificar').style.display = 'inline-block';
            }

            document.querySelectorAll("[data-role]").forEach(el => {
                if (el.getAttribute("data-role") !== rolUsuario) el.style.display = 'none';
            });

        } catch (error) { console.error("Error:", error); }
    }

    function llenarFormulario(form) {
        if(!form) return;

        if(form.datos_generales) {
            document.getElementById('dg_contacto').value = form.datos_generales.contacto || '';
            document.getElementById('dg_provincia').value = form.datos_generales.provincia || '';
            document.getElementById('dg_objetivo').value = form.datos_generales.objetivo || '';
        }

        if(form.identificacion?.estaciones?.length > 0) {
            form.identificacion.estaciones.forEach(est => agregarEstacionHTML(est));
        } else { agregarEstacionHTML(); }

        // Matriz de Parámetros
        if(form.parametros_in_situ) {
            document.querySelectorAll('.param-unidad').forEach(inp => {
                const p = inp.getAttribute('data-param');
                if(form.parametros_in_situ[p]) inp.value = form.parametros_in_situ[p].unidad || '';
            });
            document.querySelectorAll('.param-est').forEach(inp => {
                const p = inp.getAttribute('data-param');
                const e = inp.getAttribute('data-est');
                if(form.parametros_in_situ[p]) inp.value = form.parametros_in_situ[p][`e${e}`] || '';
            });
            document.querySelectorAll('.param-obs').forEach(inp => {
                const p = inp.getAttribute('data-param');
                if(form.parametros_in_situ[p]) inp.value = form.parametros_in_situ[p].obs || '';
            });
        }

        if(form.responsables) {
            document.getElementById('resp_conductor').value = form.responsables.conductor || '';
            document.getElementById('resp_fecha').value = form.responsables.fecha_elaboracion_plan || '';
            if(form.responsables.tecnicos?.length > 0) form.responsables.tecnicos.forEach(t => agregarTecnicoHTML(t));
            else agregarTecnicoHTML();
        }

        if(form.verificacion_materiales) {
            const v = form.verificacion_materiales;
            if(v.equipos) {
                document.getElementById('chk_adecuacion').checked = v.equipos.adecuacion || false;
                document.getElementById('chk_adecuacion_no').checked = v.equipos.adecuacion_no || false;
                document.getElementById('txt_adecuacion_no').value = v.equipos.adecuacion_txt || '';
                
                document.getElementById('chk_limpieza').checked = v.equipos.limpieza || false;
                document.getElementById('chk_limpieza_no').checked = v.equipos.limpieza_no || false;
                document.getElementById('txt_limpieza_no').value = v.equipos.limpieza_txt || '';

                document.getElementById('chk_metrologica').checked = v.equipos.metrologica || false;
                document.getElementById('txt_observacion_equipos').value = v.equipos.observacion || '';

                document.querySelectorAll('.chk-equipo, .chk-patron').forEach(chk => {
                    chk.checked = v.equipos[chk.getAttribute('data-key')] === true;
                });
            }
            if(v.insumos) {
                document.querySelectorAll('.input-insumo').forEach(inp => inp.value = v.insumos[inp.getAttribute('data-key')] || '');
            }
            if(v.otros_insumos && v.otros_insumos.length > 0) {
                v.otros_insumos.forEach(oi => agregarOtroInsumo(oi.nombre, oi.cantidad));
            }
        }
    }

    // --- 5. MODO EDICIÓN ---
    document.getElementById('btnModificar').addEventListener('click', habilitarEdicion);

    function habilitarEdicion() {
        esModoEdicion = true;
        document.getElementById('estado-texto').textContent = "Modo Edición";
        
        document.querySelectorAll('.proto-input').forEach(input => input.disabled = false);
        document.querySelectorAll('.proto-action').forEach(btn => btn.style.display = 'inline-block');
        
        document.getElementById('btnModificar').style.display = 'none';
        document.getElementById('btnGuardar').style.display = 'inline-block';
    }

    // --- 6. GUARDAR / SINCRONIZAR ---
    document.getElementById('btnGuardar').addEventListener('click', async (e) => {
        e.preventDefault();

        const datos_formulario = {
            datos_generales: {
                contacto: document.getElementById('dg_contacto').value.trim(),
                provincia: document.getElementById('dg_provincia').value.trim(),
                objetivo: document.getElementById('dg_objetivo').value.trim()
            },
            identificacion: {
                estaciones: Array.from(document.querySelectorAll('.estacion-card')).map(card => ({
                    control: card.querySelector('.est-control').value.trim(),
                    lugar: card.querySelector('.est-lugar').value.trim(),
                    tipo_muestra: card.querySelector('.est-tipo').value.trim(),
                    fecha: card.querySelector('.est-fecha').value.trim(),
                    hora: card.querySelector('.est-hora').value.trim()
                }))
            },
            responsables: {
                tecnicos: Array.from(document.querySelectorAll('.input-tecnico')).map(inp => inp.value.trim()).filter(v => v !== ""),
                conductor: document.getElementById('resp_conductor').value.trim(),
                fecha_elaboracion_plan: document.getElementById('resp_fecha').value.trim()
            },
            parametros_in_situ: {},
            verificacion_materiales: { 
                equipos: {
                    adecuacion: document.getElementById('chk_adecuacion').checked,
                    adecuacion_no: document.getElementById('chk_adecuacion_no').checked,
                    adecuacion_txt: document.getElementById('txt_adecuacion_no').value.trim(),
                    limpieza: document.getElementById('chk_limpieza').checked,
                    limpieza_no: document.getElementById('chk_limpieza_no').checked,
                    limpieza_txt: document.getElementById('txt_limpieza_no').value.trim(),
                    metrologica: document.getElementById('chk_metrologica').checked,
                    observacion: document.getElementById('txt_observacion_equipos').value.trim()
                }, 
                insumos: {},
                otros_insumos: [] 
            }
        };

        // Empaquetar Matriz Bidimensional
        listParametrosInSitu.forEach(param => {
            datos_formulario.parametros_in_situ[param] = { unidad: '', obs: '' };
            for(let i=1; i<=8; i++) datos_formulario.parametros_in_situ[param][`e${i}`] = '';
        });
        document.querySelectorAll('.param-unidad').forEach(inp => datos_formulario.parametros_in_situ[inp.getAttribute('data-param')].unidad = inp.value.trim());
        document.querySelectorAll('.param-obs').forEach(inp => datos_formulario.parametros_in_situ[inp.getAttribute('data-param')].obs = inp.value.trim());
        document.querySelectorAll('.param-est').forEach(inp => datos_formulario.parametros_in_situ[inp.getAttribute('data-param')][`e${inp.getAttribute('data-est')}`] = inp.value.trim());
        
        // Empaquetar Equipos dinámicos e Insumos
        document.querySelectorAll('.chk-equipo, .chk-patron').forEach(c => datos_formulario.verificacion_materiales.equipos[c.getAttribute('data-key')] = c.checked);
        document.querySelectorAll('.input-insumo').forEach(i => datos_formulario.verificacion_materiales.insumos[i.getAttribute('data-key')] = i.value.trim());
        
        document.querySelectorAll('.otro-insumo-row').forEach(row => {
            const nom = row.querySelector('.input-otro-nombre').value.trim();
            const cant = row.querySelector('.input-otro-cant').value.trim();
            if (nom) datos_formulario.verificacion_materiales.otros_insumos.push({ nombre: nom, cantidad: cant });
        });

        const paqueteSincronizacion = {
            protocolos: [{ biomonitoreo_id: proyectoId, protocolo_numero: 1, datos_formulario: datos_formulario }]
        };

        try {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            document.getElementById('btnGuardar').disabled = true;

            const respuesta = await fetch('http://localhost:3000/api/protocolos/sincronizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(paqueteSincronizacion)
            });

            if (respuesta.ok) {
                alert("Protocolo guardado y sincronizado exitosamente.");
                window.location.reload(); 
            } else {
                const data = await respuesta.json();
                alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            alert("Error de conexión al guardar.");
        } finally {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save me-2"></i>Guardar y Sincronizar';
            document.getElementById('btnGuardar').disabled = false;
        }
    });
});