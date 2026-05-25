document.addEventListener('DOMContentLoaded', async () => {

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Sesión no válida.');
        return window.location.replace('login.html');
    }

    document.querySelector('.fw-bold.text-dark').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const inputsGenerales = document.querySelectorAll('.addZones-input');
    const descripcionTextarea = document.querySelector('.addZones-textarea');
    
    const inputNombreZona = inputsGenerales[0];
    const inputCoordenadas = inputsGenerales[1];
    const inputUbicacion = inputsGenerales[2];
    const inputBMWP = inputsGenerales[3]; 
    
    const selectFamilia = document.querySelector('.addZones-reg-list select');
    const btnRegistrarFamilia = document.querySelector('.addZones-btn-register');
    const panelFamilias = document.querySelector('.addZones-right-panel');
    const btnGuardarZona = document.querySelector('.zone-btn-save');

    document.querySelectorAll('.addZones-product-card').forEach(card => card.remove());

    let familiasAgregadas = [];
    let catalogoGlobalFamilias = []; 

    async function cargarFamiliasGlobales() {
        try {
        
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/familias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error('Error al obtener el catálogo global');

            catalogoGlobalFamilias = await respuesta.json();
            
            selectFamilia.innerHTML = '<option value="">-- Selecciona una Familia --</option>';
            catalogoGlobalFamilias.forEach(f => {
                const option = document.createElement('option');
                option.value = f.nombre_familia; 
                option.textContent = f.nombre_familia;
                selectFamilia.appendChild(option);
            });

        } catch (error) {
            console.error(error);
            alert("No se pudieron cargar las familias globales.");
        }
    }

    cargarFamiliasGlobales();

    btnRegistrarFamilia.addEventListener('click', (e) => {
        e.preventDefault();

        const nombreFamilia = selectFamilia.value;
        const valorBMWP = inputBMWP.value.trim();

        if (nombreFamilia === "") {
            return alert("Por favor, selecciona una familia del catálogo.");
        }
        if (valorBMWP === "") {
            return alert("Por favor, asigne un valor BMWP/MEX a la familia antes de agregarla.");
        }
        if (familiasAgregadas.find(f => f.nombre_familia === nombreFamilia)) {
            return alert("Esta familia ya fue agregada a la zona.");
        }

        const familiaInfo = catalogoGlobalFamilias.find(f => f.nombre_familia === nombreFamilia);
        const urlImagen = familiaInfo && familiaInfo.imagen_url ? familiaInfo.imagen_url : 'img/placeholder_bug.png';

        familiasAgregadas.push({
            nombre_familia: nombreFamilia,
            valor_bmwp: parseFloat(valorBMWP),
            imagen_url: urlImagen,
            orden: familiaInfo ? familiaInfo.orden : 'Sin especificar',
            tamano: familiaInfo ? familiaInfo.tamano : 0
        });

        const nuevaFamiliaCard = document.createElement('div');
        nuevaFamiliaCard.className = 'addZones-product-card';
        nuevaFamiliaCard.innerHTML = `
            <i class="far fa-times-circle addZones-card-close"></i>
            <div class="addZones-card-img-box">
                <img src="${urlImagen}" alt="${nombreFamilia}" class="addZones-card-img" style="object-fit: cover;">
            </div>
            <div class="addZones-card-content">
                <h6 class="addZones-card-title">${nombreFamilia}</h6>
                <p class="addZones-card-subtitle">Valor BMWP: ${valorBMWP}</p>
            </div>
        `;

        const btnCerrar = nuevaFamiliaCard.querySelector('.addZones-card-close');
        btnCerrar.addEventListener('click', () => {
            nuevaFamiliaCard.remove();
            familiasAgregadas = familiasAgregadas.filter(f => f.nombre_familia !== nombreFamilia);
        });

        const accionesGuardado = document.querySelector('.zone-save-actions');
        panelFamilias.insertBefore(nuevaFamiliaCard, accionesGuardado);
        
        selectFamilia.value = "";
        inputBMWP.value = "";
    });

    btnGuardarZona.addEventListener('click', async (e) => {
        e.preventDefault(); 

        const nombreVal = inputNombreZona.value.trim();
        const coordVal = inputCoordenadas.value.trim();
        const ubiVal = inputUbicacion.value.trim();
        const descVal = descripcionTextarea.value.trim();
        
        let errores = [];
        if (!nombreVal || !coordVal || !ubiVal || !descVal) {
            errores.push("Debe llenar todos los campos de Datos Generales.");
        }
        if (familiasAgregadas.length === 0) {
            errores.push("Debe agregar al menos una familia a la zona.");
        }

        if (errores.length > 0) {
            return alert(errores.join("\n"));
        }

        const datosNuevaZona = {
            nombre: nombreVal,
            coordenadas: coordVal,
            ubicacion: ubiVal,
            descripcion: descVal,
            catalogo_familias: familiasAgregadas 
        };

        try {
            btnGuardarZona.textContent = "Guardando...";
            btnGuardarZona.style.pointerEvents = "none";

            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/zonas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosNuevaZona)
            });

            if (respuesta.ok) {
                alert("¡Zona guardada con éxito en la base de datos!");
                window.location.href = 'zonas.html'; 
            } else {
                const errorData = await respuesta.json();
                alert(`Error al guardar: ${errorData.mensaje}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor.");
        } finally {
            btnGuardarZona.textContent = "Guardar zona";
            btnGuardarZona.style.pointerEvents = "auto";
        }
    });
});