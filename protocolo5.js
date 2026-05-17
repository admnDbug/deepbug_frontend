document.addEventListener('DOMContentLoaded', () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    // --- 1. SEGURIDAD Y CONFIGURACIÓN ---
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    if (!token) return window.location.replace('login.html');
    
    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    let isEditing = false;
    let addedFamilies = [];
    let catalogo = [];

    // --- 3. CONTROLES DE EDICIÓN ---
    const btnModificar = document.getElementById('btnModificar');
    const btnGuardar = document.getElementById('btnGuardar');
    const searchSection = document.getElementById('adminSearchSection');
    const searchInput = document.getElementById('familySearch');

    function habilitarEdicion() {
        isEditing = true;
        document.getElementById('estado-texto').textContent = "Modo Edición";
        document.getElementById('estado-texto').classList.replace('text-primary', 'text-danger');
        
        if (btnModificar) btnModificar.style.display = 'none';
        if (btnGuardar) btnGuardar.style.display = 'inline-block';
        
        if (searchSection) {
            searchSection.classList.remove('opacity-50');
            searchSection.style.pointerEvents = 'auto';
        }
        if (searchInput) searchInput.placeholder = "Buscar familia...";
        
        renderCatalog();
        updateUI();
    }

    if (btnModificar) btnModificar.addEventListener('click', habilitarEdicion);
    if (searchInput) searchInput.addEventListener('input', (e) => renderCatalog(e.target.value.toLowerCase()));

    // --- 4. LÓGICA DEL VISOR DE IMÁGENES ---
    window.abrirVisor = function(url, titulo) {
        if (!url || url.includes('placeholder')) return;
        const modal = new bootstrap.Modal(document.getElementById('modalImagenGrande'));
        document.getElementById('imgGrandeSource').src = url;
        document.getElementById('imgGrandeCaption').textContent = titulo;
        modal.show();
    };

    // --- 5. RENDERIZADO DEL CATÁLOGO VISUAL ---
    function renderCatalog(filter = "") {
        const list = document.getElementById('catalogList');
        if (!list) return;
        list.innerHTML = "";
        
        if (!isEditing) {
            list.innerHTML = "<p class='text-muted small text-center mt-3'><i class='fas fa-lock me-2'></i>Habilita la edición para gestionar familias.</p>";
            return;
        }

        const filtrados = catalogo.filter(f => f.nombre_familia.toLowerCase().includes(filter));
        
        if (filtrados.length === 0) {
            list.innerHTML = "<p class='text-muted small text-center mt-3'>No se encontraron familias en la zona.</p>";
            return;
        }

        filtrados.forEach(f => {
            const item = document.createElement('div');
            item.className = "d-flex justify-content-between align-items-center p-2 border-bottom hover-bg-light";
            item.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <img src="${f.imagen_url || 'img/placeholder_bug.png'}" class="rounded-circle border" style="width:35px; height:35px; object-fit:cover;" onerror="this.src='img/placeholder_bug.png'">
                    <div>
                        <span class="small fw-bold d-block text-dark">${f.nombre_familia}</span>
                        <span class="small text-success fw-bold">${f.valor_bmwp} pts</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary rounded-pill py-0 px-3 fw-bold" onclick="addFamily('${f._id}')">+</button>
            `;
            list.appendChild(item);
        });
    }

    // --- 6. LÓGICA DEL CARRITO ---
    window.addFamily = function(id) {
        if (addedFamilies.find(f => f.id === id)) {
            alert("Esta familia ya está en tu lista. Modifica la cantidad directamente.");
            return;
        }
        const f = catalogo.find(fam => fam._id === id);
        addedFamilies.push({ 
            id: f._id, 
            nombre_familia: f.nombre_familia, 
            valor_bmwp: f.valor_bmwp, 
            cantidad: 1, 
            foto_url: null, 
            foto_base64: null, 
            preview: null 
        });
        updateUI();
    };

    window.removeFamily = function(id) {
        addedFamilies = addedFamilies.filter(f => f.id !== id);
        updateUI();
    };

    window.updateQty = function(id, val) {
        const f = addedFamilies.find(fam => fam.id === id);
        if (f) f.cantidad = parseInt(val) || 1;
    };

    // Subida de imagen a Base64
    window.triggerImageUpload = function(id) {
        if(!isEditing) return;
        document.getElementById(`upload-${id}`).click();
    };

    window.handleImageUpload = function(event, id) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result.split(',')[1];
                const family = addedFamilies.find(f => f.id === id);
                if (family) {
                    family.foto_base64 = base64; 
                    family.preview = e.target.result; 
                    updateUI();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- 7. ACTUALIZACIÓN DE UI ---
    function updateUI() {
        const container = document.getElementById('analysisContainer');
        if (!container) return;
        
        container.innerHTML = "";
        let totalBMWP = 0;

        if(addedFamilies.length === 0) {
            container.innerHTML = `<div class="alert alert-secondary text-center small border-0 bg-light">No se han registrado familias aún.</div>`;
        }

        addedFamilies.forEach(f => {
            totalBMWP += f.valor_bmwp;
            const card = document.createElement('div');
            card.className = "protocolFive-family-card bg-white border shadow-sm rounded-4 p-3 d-flex justify-content-between align-items-center";
            
            let hasImage = !!(f.preview || f.foto_url);
            let imgSrc = hasImage ? (f.preview || f.foto_url) : '';

            let badgeFoto = (!hasImage) 
                ? `<span class="badge bg-danger ms-2" style="font-size:0.6rem;">Falta Evidencia</span>`
                : `<span class="badge bg-success ms-2" style="font-size:0.6rem;"><i class="fas fa-check"></i> Foto OK</span>`;

            // Si hay imagen, el click abre el visor (si no estamos editando). Si estamos editando, sube imagen.
            const accionImagen = isEditing 
                ? `onclick="triggerImageUpload('${f.id}')"` 
                : (hasImage ? `onclick="abrirVisor('${imgSrc}', '${f.nombre_familia}')"` : '');

            // Generar el contenido del cuadrito (Imagen o Icono de Subida)
            let imageHTML = hasImage 
                ? `<img src="${imgSrc}" alt="${f.nombre_familia}" class="img-family-protocol" onerror="this.src='img/placeholder_bug.png'">`
                : `<div class="img-family-protocol d-flex align-items-center justify-content-center bg-light border text-primary" style="font-size: 1.5rem;" title="Subir evidencia">
                       <i class="fas fa-cloud-upload-alt"></i>
                   </div>`;

            // El overlay oscuro que sale al pasar el ratón
            let overlayHTML = '';
            if (isEditing) {
                overlayHTML = `<div class="foto-overlay-mini"><i class="fas fa-camera"></i></div>`;
            } else if (hasImage) {
                overlayHTML = `<div class="foto-overlay-mini"><i class="fas fa-search-plus"></i></div>`;
            }

            card.innerHTML = `
                <div class="d-flex gap-3 align-items-center w-100">
                    <div class="protocolFive-icon-wrapper ${!isEditing && hasImage ? 'cursor-zoom-in' : ''}" ${accionImagen}>
                        ${imageHTML}
                        ${overlayHTML}
                        ${isEditing ? `<input type="file" id="upload-${f.id}" accept="image/*" style="display:none;" onchange="handleImageUpload(event, '${f.id}')">` : ''}
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-bold text-dark">${f.nombre_familia} ${badgeFoto}</h6>
                        <span class="small text-success fw-bold">BMWP: ${f.valor_bmwp} pts</span>
                        ${isEditing ? `
                            <div class="d-flex align-items-center gap-2 mt-2">
                                <span class="small fw-bold text-muted">Cant:</span>
                                <input type="number" value="${f.cantidad}" class="form-control form-control-sm text-center" style="width: 60px;" min="1" onchange="updateQty('${f.id}', this.value)">
                                <button class="btn btn-sm text-danger border-0" onclick="removeFamily('${f.id}')"><i class="fas fa-trash"></i></button>
                            </div>` : `<div class="mt-1"><span class="badge bg-light text-dark border">Cantidad: ${f.cantidad}</span></div>`}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        document.getElementById('totalBmwpLabel').innerText = `BMWP/MX: ${totalBMWP}`;
        document.getElementById('totalQualityBox').innerText = `Total de índice BMWP/Mex: ${totalBMWP}`;
        updateQualityResults(totalBMWP);
    }

    function updateQualityResults(score) {
        const resClass = document.getElementById('resClass');
        const resRange = document.getElementById('resRange');
        const resQuality = document.getElementById('resQuality');
        const resDot = document.getElementById('resDot');

        let data = { class: "Extr. contaminada", range: "< 19", desc: "Aguas extremadamente contaminadas", color: "#dc3545" };

        if (score > 150) data = { class: "Excelente", range: "> 150", desc: "Aguas de calidad excelente", color: "#0d6efd" };
        else if (score >= 78) data = { class: "Buena", range: "78 - 149", desc: "Aguas de calidad buena", color: "#198754" };
        else if (score >= 59) data = { class: "Regular", range: "59 - 77", desc: "Aguas de calidad regular", color: "#ffc107" };
        else if (score >= 39) data = { class: "Contaminada", range: "39 - 58", desc: "Aguas contaminadas", color: "#fd7e14" };
        else if (score >= 20) data = { class: "Muy contaminada", range: "20 - 38", desc: "Aguas muy contaminadas", color: "#d63384" };

        resClass.innerText = data.class;
        resClass.style.color = data.color;
        resRange.innerText = data.range;
        resQuality.innerText = data.desc;
        resDot.style.backgroundColor = data.color;
        resDot.style.boxShadow = `0 0 10px ${data.color}80`;
    }

    // --- NUEVO: CARGAR PROYECTO Y CATÁLOGO DE LA ZONA ---
    cargarProyectoYCatalogo();
    
    async function cargarProyectoYCatalogo() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/biomonitoreos/${proyectoId}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                const proyecto = await res.json();
                document.getElementById('nombre-proyecto-nav').textContent = proyecto.nombre_proyecto;
                document.getElementById('link-proyecto-top').href = `verproyecto.html?id=${proyectoId}`;
                
                if(proyecto.zona_id && proyecto.zona_id.catalogo_familias) {
                    catalogo = proyecto.zona_id.catalogo_familias;
                }
                cargarProtocolo();
            } else {
                document.getElementById('nombre-proyecto-nav').textContent = "Proyecto Desconocido";
            }
        } catch (error) {
            console.error("Error al obtener el proyecto:", error);
            document.getElementById('nombre-proyecto-nav').textContent = "Error de conexión";
        }
    }

    // --- 8. CARGA DESDE EL BACKEND ---
    async function cargarProtocolo() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await res.json();
            const protocolo5 = protocolos.find(p => p.protocolo_numero == 5 && p.estado === 'aprobado');

            if (!protocolo5) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') habilitarEdicion();
            } else {
                document.getElementById('estado-texto').textContent = "Modo Visualización";
                
                // LECTURA HÍBRIDA: Buscamos en datos_formulario o en datos_protocolo_5 por compatibilidad
                const dataP5 = protocolo5.datos_formulario || protocolo5.datos_protocolo_5 || {};
                const listaFams = dataP5.familias_registradas || [];

                // Mapeamos las familias encontradas al arreglo de la UI web
                addedFamilies = listaFams.map(f => ({
                    id: f.familia_id || f.id,
                    nombre: f.nombre || "Familia",
                    cantidad: parseInt(f.cantidad) || 0,
                    bmwp: parseInt(f.valor_bmwp || f.bmwp) || 0,
                    foto_base64: f.foto_base64 || null
                }));

                recalcularUI();

                if (rolUsuario === 'Responsable' && btnModificar) {
                    btnModificar.style.display = 'inline-block';
                }
            }

            renderCatalog();
            updateUI();

            document.querySelectorAll("[data-role]").forEach(el => {
                const rolesPermitidos = el.getAttribute("data-role").split(" ");
                if (!rolesPermitidos.includes(rolUsuario)) {
                    el.classList.add('d-none');
                }
            });

        } catch (error) { console.error("Error:", error); }
    }

    // --- 9. GUARDADO Y EMPAQUETADO ---
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();

            const faltanFotos = addedFamilies.some(f => !f.foto_url && !f.foto_base64);
            if (faltanFotos) {
                const confirmar = confirm("Hay familias sin foto de evidencia. ¿Estás seguro de que deseas guardar y subir esto?");
                if (!confirmar) return;
            }

            const totalBMWP = addedFamilies.reduce((sum, f) => sum + f.valor_bmwp, 0);

            const datos_protocolo_5 = {
                familias_encontradas: addedFamilies.map(f => ({
                    nombre_familia: f.nombre_familia,
                    valor_bmwp: f.valor_bmwp,
                    cantidad: f.cantidad, 
                    imagen_url: f.foto_url,
                    foto_base64: f.foto_base64 
                })),
                sumatoria_total_bmwp: totalBMWP
            };

            const paqueteSincronizacion = {
                protocolos: [{ 
                    biomonitoreo_id: proyectoId, 
                    protocolo_numero: 5, 
                    datos_formulario: null,
                    datos_protocolo_5: datos_protocolo_5 
                }]
            };

            try {
                btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subiendo fotos...';
                btnGuardar.disabled = true;

                const res = await fetch('https://deepbug-backend.onrender.com/api/protocolos/sincronizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(paqueteSincronizacion)
                });

                if (res.ok) {
                    alert("Protocolo 5 y fotografías guardadas exitosamente.");
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