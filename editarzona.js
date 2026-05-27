document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.replace('login.html');

    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const zonaId = urlParams.get('id');
    if (!zonaId) return window.location.href = 'zonas.html';

    const txtNombre = document.getElementById('editNombreZona');
    const txtCoordenadas = document.getElementById('editCoordenadas');
    const txtUbicacion = document.getElementById('editUbicacion');
    const txtDescripcion = document.getElementById('editDescripcion');
    const selectFamilia = document.getElementById('selectFamiliaDto');
    const inputBMWP = document.getElementById('inputBMWP');
    const btnRegistrarFamilia = document.getElementById('btnRegistrarFamilia');
    const panelFamilias = document.getElementById('panelContenedorFamilias');
    const btnActualizarZona = document.getElementById('btnActualizarZona');

    let familiasAgregadas = [];
    let catalogoGlobalFamilias = [];

    async function cargarCatálogoGlobal() {
        try {
            const res = await fetch(' /api/familias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            catalogoGlobalFamilias = await res.json();
            
            selectFamilia.innerHTML = '<option value="">-- Selecciona una Familia --</option>';
            catalogoGlobalFamilias.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.nombre_familia;
                opt.textContent = f.nombre_familia;
                selectFamilia.appendChild(opt);
            });
            
            await precargarDatosZona();
        } catch (error) {
            console.error("Error cargando familias:", error);
        }
    }

    async function precargarDatosZona() {
        try {
            const res = await fetch(` /api/zonas/${zonaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("No se pudo obtener la información de la zona");
            
            const zona = await res.json();
            
            txtNombre.value = zona.nombre || '';
            txtCoordenadas.value = zona.coordenadas || '';
            txtUbicacion.value = zona.ubicacion || '';
            txtDescripcion.value = zona.descripcion || '';
            
            if (zona.catalogo_familias && Array.isArray(zona.catalogo_familias)) {
                zona.catalogo_familias.forEach(f => {
                    agregarFamiliaAlPanel(f.nombre_familia, f.valor_bmwp, f.imagen_url, f.orden, f.tamano);
                });
            }
        } catch (error) {
            alert("Error al precargar la zona: " + error.message);
        }
    }

    function agregarFamiliaAlPanel(nombre, valor, urlImg, orden, tamano) {
        if (familiasAgregadas.find(f => f.nombre_familia === nombre)) return;

        familiasAgregadas.push({ nombre_familia: nombre });

        const card = document.createElement('div');
        card.className = 'addZones-product-card';
        card.innerHTML = `
            <i class="far fa-times-circle addZones-card-close" title="Eliminar de la zona"></i>
            <div class="addZones-card-img-box">
                <img src="${urlImg || 'img/placeholder_bug.png'}" alt="${nombre}" class="addZones-card-img" style="object-fit: cover;">
            </div>
            <div class="addZones-card-content">
                <h6 class="addZones-card-title">${nombre}</h6>
                <p class="addZones-card-subtitle">Valor BMWP: ${valor}</p>
            </div>
        `;

        card.querySelector('.addZones-card-close').addEventListener('click', async () => {
            const confirmar = confirm(`¿Estás seguro de que deseas quitar "${nombre}" de esta zona?`);
            if (!confirmar) return;

            try {
                const res = await fetch(` /api/zonas/${zonaId}/familias/${nombre}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    card.remove();
                    familiasAgregadas = familiasAgregadas.filter(f => f.nombre_familia !== nombre);
                } else {
                    const err = await res.json();
                    alert(`Error al eliminar: ${err.mensaje}`);
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar eliminar la familia.");
            }
        });

        const accionesGuardado = document.querySelector('.zone-save-actions');
        panelFamilias.insertBefore(card, accionesGuardado);
    }

    btnRegistrarFamilia.addEventListener('click', async (e) => {
        e.preventDefault();
        const nombre = selectFamilia.value;
        const valor = inputBMWP.value.trim();

        if (!nombre || !valor) return alert("Selecciona una familia y define su puntaje BMWP.");
        
        if (familiasAgregadas.find(f => f.nombre_familia === nombre)) {
            return alert("Esta familia ya está agregada a la zona.");
        }

        const globalInfo = catalogoGlobalFamilias.find(f => f.nombre_familia === nombre);
        
        const payloadFamilia = {
            nombre_familia: nombre,
            valor_bmwp: parseFloat(valor),
            imagen_url: globalInfo?.imagen_url || '',
            orden: globalInfo?.orden || 'Sin especificar',
            tamano: globalInfo?.tamano || 0
        };

        try {
            btnRegistrarFamilia.textContent = "Guardando...";
            btnRegistrarFamilia.disabled = true;

            const res = await fetch(` /api/zonas/${zonaId}/familias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payloadFamilia)
            });

            if (res.ok) {
                agregarFamiliaAlPanel(nombre, valor, payloadFamilia.imagen_url, payloadFamilia.orden, payloadFamilia.tamano);
                selectFamilia.value = "";
                inputBMWP.value = "";
            } else {
                const err = await res.json();
                alert(`Error al registrar: ${err.mensaje}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al intentar guardar la familia.");
        } finally {
            btnRegistrarFamilia.textContent = "Registrar";
            btnRegistrarFamilia.disabled = false;
        }
    });

    btnActualizarZona.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: txtNombre.value.trim(),
            coordenadas: txtCoordenadas.value.trim(),
            ubicacion: txtUbicacion.value.trim(),
            descripcion: txtDescripcion.value.trim()
        };

        if(!payload.nombre || !payload.coordenadas || !payload.ubicacion) {
            return alert("Completa todos los campos generales obligatorios.");
        }

        try {
            btnActualizarZona.textContent = "Actualizando...";
            btnActualizarZona.style.pointerEvents = "none";

            const res = await fetch(` /api/zonas/${zonaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("¡Datos de la zona modificados exitosamente!");
                window.location.href = 'zonas.html';
            } else {
                const err = await res.json();
                alert(`Error al actualizar: ${err.mensaje}`);
            }
        } catch (error) {
            alert("Error de conexión con el servidor backend.");
        } finally {
            btnActualizarZona.textContent = "Actualizar Zona";
            btnActualizarZona.style.pointerEvents = "auto";
        }
    });

    cargarCatálogoGlobal();
});