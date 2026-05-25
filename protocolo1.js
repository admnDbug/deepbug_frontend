document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) window.location.reload();
    });
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    
    if (!token) return window.location.replace('login.html');
    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    let esModoEdicion = false;

    const listEquiposPatrones = ['Flujómetro', 'Termómetro', 'Conductivímetro', 'Multiparámetros', 'GPS'];
    const listInsumos = ['Red tipo D', 'Envases plásticos', 'Caja de Herramienta', 'R. Triangular', 'Frascos fisicoq.', 'Tijeras', 'Celular', 'Cinta métrica', 'Bolsas herméticas', 'Lápices', 'C. fluorescentes', 'Tabla anot.', 'Lupas', 'Viales de plásticos', 'Alcohol', 'Tamices', 'Pilotos indelebles', 'C. adhesiva', 'Etiquetas', 'Pinzas entomol.', 'Guantes', 'Bandejas blancas', 'Mascarillas', 'Botellas de lavado'];

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

    generarEquiposPatrones();
    generarInputsInsumos();

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
        document.querySelectorAll('.btn-remove-tec').forEach(btn => btn.onclick = function() { this.closest('.tecnico-row').remove(); });
    }

    document.getElementById('btn-add-tecnico').addEventListener('click', () => agregarTecnicoHTML());
    document.getElementById('btn-add-insumo').addEventListener('click', () => agregarOtroInsumo());

    cargarNombreProyecto();
    async function cargarNombreProyecto() {
        try {
            const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const proyecto = await res.json();
                document.getElementById('nombre-proyecto-nav').textContent = proyecto.nombre_estacion || 'Estación';
                document.getElementById('link-proyecto-top').href = `verproyecto.html?id=${proyectoId}`;
            }
        } catch (error) {}
    }
    
    cargarProtocolo();
    async function cargarProtocolo() {
        try {
            const respuesta = await fetch(`https://deepbug-backend-staging.onrender.com/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await respuesta.json();
            const protocolo1 = protocolos.find(p => p.protocolo_numero == 1 && p.estado === 'aprobado');

            if (!protocolo1) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') habilitarEdicion();
                agregarTecnicoHTML(); 
            } else {
                document.getElementById('estado-texto').textContent = "Modo Visualización";
                llenarFormulario(protocolo1.datos_formulario);
                if (rolUsuario === 'Responsable') document.getElementById('btnModificar').style.display = 'inline-block';
            }

            document.querySelectorAll("[data-role]").forEach(el => {
                if (el.getAttribute("data-role") !== rolUsuario) el.style.display = 'none';
            });
        } catch (error) {}
    }

    function llenarFormulario(form) {
        if(!form) return;
        if(form.datos_generales) {
            document.getElementById('dg_contacto').value = form.datos_generales.contacto || '';
            document.getElementById('dg_provincia').value = form.datos_generales.provincia || '';
            document.getElementById('dg_objetivo').value = form.datos_generales.objetivo || '';
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

    document.getElementById('btnModificar').addEventListener('click', habilitarEdicion);
    function habilitarEdicion() {
        esModoEdicion = true;
        document.getElementById('estado-texto').textContent = "Modo Edición";
        document.querySelectorAll('.proto-input').forEach(input => input.disabled = false);
        document.querySelectorAll('.proto-action').forEach(btn => btn.style.display = 'inline-block');
        document.getElementById('btnModificar').style.display = 'none';
        document.getElementById('btnGuardar').style.display = 'inline-block';
    }

    document.getElementById('btnGuardar').addEventListener('click', async (e) => {
        e.preventDefault();

        // ¡AQUÍ ESTABA EL ERROR! Faltaba inicializar verificacion_materiales
        const datos_formulario = {
            verificacion_materiales: { equipos: {}, insumos: {}, otros_insumos: [] },
            datos_generales: {
                contacto: document.getElementById('dg_contacto').value.trim(),
                provincia: document.getElementById('dg_provincia').value.trim(),
                objetivo: document.getElementById('dg_objetivo').value.trim()
            },
            responsables: {
                tecnicos: Array.from(document.querySelectorAll('.input-tecnico')).map(inp => inp.value.trim()).filter(v => v !== ""),
                conductor: document.getElementById('resp_conductor').value.trim(),
                fecha_elaboracion_plan: document.getElementById('resp_fecha').value.trim()
            },
        };

        // Empaquetar Equipos estáticos
        datos_formulario.verificacion_materiales.equipos.adecuacion = document.getElementById('chk_adecuacion').checked;
        datos_formulario.verificacion_materiales.equipos.adecuacion_no = document.getElementById('chk_adecuacion_no').checked;
        datos_formulario.verificacion_materiales.equipos.adecuacion_txt = document.getElementById('txt_adecuacion_no').value.trim();
        
        datos_formulario.verificacion_materiales.equipos.limpieza = document.getElementById('chk_limpieza').checked;
        datos_formulario.verificacion_materiales.equipos.limpieza_no = document.getElementById('chk_limpieza_no').checked;
        datos_formulario.verificacion_materiales.equipos.limpieza_txt = document.getElementById('txt_limpieza_no').value.trim();
        
        datos_formulario.verificacion_materiales.equipos.metrologica = document.getElementById('chk_metrologica').checked;
        datos_formulario.verificacion_materiales.equipos.observacion = document.getElementById('txt_observacion_equipos').value.trim();

        // Empaquetar Equipos dinámicos e Insumos
        document.querySelectorAll('.chk-equipo, .chk-patron').forEach(c => datos_formulario.verificacion_materiales.equipos[c.getAttribute('data-key')] = c.checked);
        document.querySelectorAll('.input-insumo').forEach(i => datos_formulario.verificacion_materiales.insumos[i.getAttribute('data-key')] = i.value.trim());
        
        document.querySelectorAll('.otro-insumo-row').forEach(row => {
            const nom = row.querySelector('.input-otro-nombre').value.trim();
            const cant = row.querySelector('.input-otro-cant').value.trim();
            if (nom) datos_formulario.verificacion_materiales.otros_insumos.push({ nombre: nom, cantidad: cant });
        });

        const paqueteSincronizacion = { protocolos: [{ biomonitoreo_id: proyectoId, protocolo_numero: 1, datos_formulario: datos_formulario }] };

        try {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            document.getElementById('btnGuardar').disabled = true;

            const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/protocolos/sincronizar', {
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