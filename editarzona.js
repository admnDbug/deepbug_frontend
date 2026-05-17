document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.replace('login.html');

    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const zonaId = urlParams.get('id');
    if (!zonaId) return window.location.href = 'zonas.html';

    // Elementos del DOM
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

    // 1. Cargar catálogo global de familias en el select
    async function cargarCatálogoGlobal() {
        try {
            const res = await fetch('https://deepbug-backend.onrender.com/api/familias', {
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
            
            // Una vez que el select está listo, precargamos la data de la zona específica
            await precargarDatosZona();
        } catch (error) {
            console.error("Error cargando familias:", error);
        }
    }

    // 2. Precargar los datos que ya tenía guardados la zona
    async function precargarDatosZona() {
        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/zonas/${zonaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("No se pudo obtener la información de la zona");
            
            const zona = await res.json();
            
            // Rellenamos cajas de texto
            txtNombre.value = zona.nombre || '';
            txtCoordenadas.value = zona.coordenadas || '';
            txtUbicacion.value = zona.ubicacion || '';
            txtDescripcion.value = zona.descripcion || '';
            
            // Poblamos el listado de familias existentes
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

        familiasAgregadas.push({
            nombre_familia: nombre,
            valor_bmwp: parseFloat(valor),
            imagen_url: urlImg || 'img/placeholder_bug.png',
            orden: orden || 'Sin especificar',
            tamano: tamano || 0
        });

        const card = document.createElement('div');
        card.className = 'addZones-product-card';
        card.innerHTML = `
            <i class="far fa-times-circle addZones-card-close"></i>
            <div class="addZones-card-img-box">
                <img src="${urlImg || 'img/placeholder_bug.png'}" alt="${nombre}" class="addZones-card-img" style="object-fit: cover;">
            </div>
            <div class="addZones-card-content">
                <h6 class="addZones-card-title">${nombre}</h6>
                <p class="addZones-card-subtitle">Valor BMWP: ${valor}</p>
            </div>
        `;

        card.querySelector('.addZones-card-close').addEventListener('click', () => {
            card.remove();
            familiasAgregadas = familiasAgregadas.filter(f => f.nombre_familia !== nombre);
        });

        const accionesGuardado = document.querySelector('.zone-save-actions');
        panelFamilias.insertBefore(card, accionesGuardado);
    }

    // 3. Registrar familia temporalmente en la vista
    btnRegistrarFamilia.addEventListener('click', (e) => {
        e.preventDefault();
        const nombre = selectFamilia.value;
        const valor = inputBMWP.value.trim();

        if (!nombre || !valor) return alert("Selecciona una familia y define su puntaje BMWP.");
        
        if (familiasAgregadas.find(f => f.nombre_familia === nombre)) {
            return alert("Esta familia ya está agregada a la cuenca.");
        }

        const globalInfo = catalogoGlobalFamilias.find(f => f.nombre_familia === nombre);
        const img = globalInfo && globalInfo.imagen_url ? globalInfo.imagen_url : '';
        const orden = globalInfo ? globalInfo.orden : 'Sin especificar';
        const tamano = globalInfo ? globalInfo.tamano : 0;

        agregarFamiliaAlPanel(nombre, valor, img, orden, tamano);
        selectFamilia.value = "";
        inputBMWP.value = "";
    });

    // 4. DISPARAR PUT ACTUALIZACIÓN
    btnActualizarZona.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: txtNombre.value.trim(),
            coordenadas: txtCoordenadas.value.trim(),
            ubicacion: txtUbicacion.value.trim(),
            descripcion: txtDescripcion.value.trim(),
            catalogo_familias: familiasAgregadas
        };

        if(!payload.nombre || !payload.coordenadas || !payload.ubicacion || payload.catalogo_familias.length === 0) {
            return alert("Completa todos los campos obligatorios y añade al menos una familia.");
        }

        try {
            btnActualizarZona.textContent = "Actualizando...";
            btnActualizarZona.style.pointerEvents = "none";

            const res = await fetch(`https://deepbug-backend.onrender.com/api/zonas/${zonaId}`, {
                method: 'PUT', // Contrato HTTP oficial de actualización
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("¡Zona modificada exitosamente en el catálogo!");
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

    // Iniciar flujo
    cargarCatálogoGlobal();
});