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
    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    let fotoCargadaBase64 = null;
    let fotoUrlActual = null; 

    // --- 2. NAVEGACIÓN POR CHIPS ---
    document.querySelectorAll('.protocol-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.protocol-chip').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.protocol-section').forEach(s => s.classList.remove('active-section'));
            this.classList.add('active');
            document.getElementById(this.dataset.target).classList.add('active-section');
        });
    });

    // --- 3. ESTRUCTURA DE DATOS ---
    const mapasCheckboxes = {
        clima: ['Tormenta', 'Lluvia', 'Lluvia intermitente', 'Claro/Soleado', 'Nublado'],
        bosques: ['Bosque natural', 'Bosque plantado'],
        sucesional: ['Bosque maduro', 'Bosque secundario'],
        cult_perm: ['Café', 'Plátano', 'Cítricos', 'Palmas'],
        cult_anuales: ['Arroz', 'Caña', 'Maíz', 'Piña', 'Horticultura mixta'],
        veg_arbustiva: ['Rastrojos y arbustos', 'Formaciones herbáceas naturales', 'Vegetación baja inundable', 'Ganadería'],
        otros_usos: ['Área urbana', 'Área rural', 'Infraestructuras', 'Explo. minera', 'Acuicultura'],
        descargas: ['Ninguna', 'Descarga directa', 'Descarga indirecta'],
        tipo_efluente: ['Doméstica', 'Comercial', 'Industrial'],
        veg_acuatica: ['Enraizadas emergentes', 'Algas adheridas', 'Enraizadas sumergidas', 'Flotadoras libres', 'Ninguna'],
        olor: ['Ninguno', 'Pescado', 'Petróleo', 'Agua servida', 'Químico'],
        color: ['Ninguno', 'Blanco', 'Gris', 'Verde', 'Marrón']
    };

    function generarChecks(grupo, listaKeys) {
        const cont = document.getElementById(`cont-${grupo}`);
        if(!cont) return;
        listaKeys.forEach(key => {
            cont.innerHTML += `
                <div class="form-check form-check-inline mb-1">
                    <input class="form-check-input proto-input chk-${grupo}" type="checkbox" data-key="${key}" disabled>
                    <label class="form-check-label small">${key}</label>
                </div>`;
        });
    }

    Object.keys(mapasCheckboxes).forEach(grupo => generarChecks(grupo, mapasCheckboxes[grupo]));

    // --- 4. LÓGICA DE FOTOGRAFÍA (BASE64) ---
    document.getElementById('foto-preview').addEventListener('click', () => {
        if(!document.getElementById('n_control').disabled) { 
            document.getElementById('foto-upload').click();
        }
    });

    document.getElementById('foto-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                fotoCargadaBase64 = event.target.result.split(',')[1];
                
                let imgEl = document.getElementById('foto-cargada-img');
                if(!imgEl) {
                    imgEl = document.createElement('img');
                    imgEl.id = 'foto-cargada-img';
                    document.getElementById('foto-preview').appendChild(imgEl);
                }
                imgEl.src = event.target.result;
            };
            reader.readAsDataURL(file);
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

    // --- 6. CARGA DE DATOS ---
    cargarProtocolo();

    async function cargarProtocolo() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await res.json();
            const protocolo2 = protocolos.find(p => p.protocolo_numero == 2 && p.estado === 'aprobado');

            if (!protocolo2) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') habilitarEdicion();
            } else {
                document.getElementById('estado-texto').textContent = "Visualización";
                llenarFormulario(protocolo2.datos_formulario);
                if (rolUsuario === 'Responsable') document.getElementById('btnModificar').style.display = 'inline-block';
            }

            document.querySelectorAll("[data-role]").forEach(el => {
                if (el.getAttribute("data-role") !== rolUsuario) el.style.display = 'none';
            });

        } catch (error) { console.error("Error:", error); }
    }

    function llenarFormulario(form) {
        if(!form) return;

        // 1. Llenar Textos Dinámicos
        if (form.textos) {
            document.querySelectorAll('.txt-dinamico').forEach(inp => {
                if(form.textos[inp.id] !== undefined) inp.value = form.textos[inp.id];
            });
        }

        // 2. Llenar Selects simples
        const selectsSimples = ['horario', 'lluvias', 'subsistema', 'temp_agua_radio', 'tipologia', 'residuos', 'rectificacion', 'canalizado', 'aceites', 'extracciones', 'presas', 'erosion', 'dosel'];
        selectsSimples.forEach(id => {
            if(form[id]) document.getElementById(id).value = form[id];
        });

        // 3. Llenar Checkboxes
        Object.keys(mapasCheckboxes).forEach(grupo => {
            if(form[grupo]) {
                document.querySelectorAll(`.chk-${grupo}`).forEach(chk => {
                    const key = chk.getAttribute('data-key');
                    chk.checked = form[grupo][key] === true;
                });
            }
        });

        // 4. Mostrar Foto
        if (form.foto_url) {
            fotoUrlActual = form.foto_url;
            let imgEl = document.getElementById('foto-cargada-img');
            if(!imgEl) {
                imgEl = document.createElement('img');
                imgEl.id = 'foto-cargada-img';
                document.getElementById('foto-preview').appendChild(imgEl);
            }
            imgEl.src = form.foto_url; 
        }
    }

    // --- 7. HABILITAR EDICIÓN ---
    document.getElementById('btnModificar').addEventListener('click', habilitarEdicion);

    function habilitarEdicion() {
        document.getElementById('estado-texto').textContent = "Modo Edición";
        document.querySelectorAll('.proto-input').forEach(input => input.disabled = false);
        document.getElementById('btnModificar').style.display = 'none';
        document.getElementById('btnGuardar').style.display = 'inline-block';
    }

    // --- 8. GUARDAR Y EMPAQUETAR JSON ---
    document.getElementById('btnGuardar').addEventListener('click', async (e) => {
        e.preventDefault();

        const textos = {};
        document.querySelectorAll('.txt-dinamico').forEach(inp => textos[inp.id] = inp.value.trim());

        const datos_formulario = {
            textos: textos,
            horario: document.getElementById('horario').value,
            lluvias: document.getElementById('lluvias').value,
            subsistema: document.getElementById('subsistema').value,
            temp_agua_radio: document.getElementById('temp_agua_radio').value,
            tipologia: document.getElementById('tipologia').value,
            residuos: document.getElementById('residuos').value,
            rectificacion: document.getElementById('rectificacion').value,
            canalizado: document.getElementById('canalizado').value,
            aceites: document.getElementById('aceites').value,
            extracciones: document.getElementById('extracciones').value,
            presas: document.getElementById('presas').value,
            erosion: document.getElementById('erosion').value,
            dosel: document.getElementById('dosel').value
        };

        if (fotoCargadaBase64) {
            datos_formulario.foto_base64 = fotoCargadaBase64;
        } else if (fotoUrlActual) {
            datos_formulario.foto_url = fotoUrlActual;
        }

        Object.keys(mapasCheckboxes).forEach(grupo => {
            datos_formulario[grupo] = {};
            document.querySelectorAll(`.chk-${grupo}`).forEach(chk => {
                datos_formulario[grupo][chk.getAttribute('data-key')] = chk.checked;
            });
        });

        const paqueteSincronizacion = {
            protocolos: [{ biomonitoreo_id: proyectoId, protocolo_numero: 2, datos_formulario: datos_formulario }]
        };

        try {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            document.getElementById('btnGuardar').disabled = true;

            const res = await fetch('https://deepbug-backend.onrender.com/api/protocolos/sincronizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(paqueteSincronizacion)
            });

            if (res.ok) {
                alert("Protocolo 2 guardado exitosamente.");
                window.location.reload(); 
            } else {
                const data = await res.json(); alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            alert("Error de conexión al guardar.");
        } finally {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save me-2"></i>Guardar y Sincronizar';
            document.getElementById('btnGuardar').disabled = false;
        }
    });
});