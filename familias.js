document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SEGURIDAD ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const nombreUsuarioTop = document.querySelector('.fw-bold.text-dark');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    // --- 2. LÓGICA DE LA IMAGEN (Visual) ---
    const imageInput = document.getElementById('family-image-input');
    const uploadTrigger = document.getElementById('family-upload-trigger');
    const uploadText = document.getElementById('upload-text');

    uploadTrigger.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', () => {
        if (imageInput.files && imageInput.files[0]) {
            uploadText.textContent = `Imagen: ${imageInput.files[0].name}`;
            uploadTrigger.style.borderColor = "#2196F3";
            uploadTrigger.style.backgroundColor = "rgba(33, 150, 243, 0.1)";
        }
    });

    // --- 3. CARGAR EL CATÁLOGO DE FAMILIAS ---
    cargarFamilias();

    async function cargarFamilias() {
        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/familias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const familias = await respuesta.json();
            const contenedor = document.getElementById('contenedorFamiliasLista');
            
            contenedor.innerHTML = ''; // Limpiamos

            if(familias.length === 0) {
                contenedor.innerHTML = '<p class="text-center mt-4 text-muted">No hay familias registradas en el catálogo global.</p>';
                return;
            }

            familias.forEach(familia => {
                const filaHTML = `
                <div class="family-table-row">
                    <div class="family-col-name fw-bold">
                        ${familia.imagen_url ? `<img src="${familia.imagen_url}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : '<i class="fas fa-bug me-2 text-muted"></i>'}
                        ${familia.nombre_familia}
                    </div>
                    <div class="family-col-orden">${familia.orden || '-'}</div>
                    <div class="family-col-tamano">${familia.tamano || '-'} mm</div>
                </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', filaHTML);
            });
        } catch (error) {
            console.error("Error al cargar familias:", error);
            document.getElementById('contenedorFamiliasLista').innerHTML = '<p class="text-center mt-4 text-danger">Error de conexión al cargar el catálogo.</p>';
        }
    }

    // --- 4. GUARDAR NUEVA FAMILIA (CON IMAGEN) ---
    const addFamilyForm = document.getElementById('add-family-form');
    const btnGuardarFamilia = document.getElementById('btnGuardarFamilia');

    addFamilyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (imageInput.files.length === 0) {
            return alert("Por favor, selecciona una imagen para identificar a esta familia.");
        }

        const textoOriginal = btnGuardarFamilia.textContent;
        btnGuardarFamilia.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subiendo...';
        btnGuardarFamilia.disabled = true;

        // Usamos FormData porque vamos a enviar un archivo (imagen)
        const formData = new FormData();
        formData.append('nombre_familia', document.getElementById('new-family-name').value.trim());
        formData.append('orden', document.getElementById('new-family-order').value.trim());
        formData.append('tamano', document.getElementById('new-family-size').value.trim());
        formData.append('descripcion', document.getElementById('new-family-desc').value.trim());
        formData.append('imagen', imageInput.files[0]); // El archivo físico

        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/familias', {
                method: 'POST',
                headers: {
                    // OJO: Cuando usas FormData, NO debes poner 'Content-Type': 'application/json'
                    // El navegador asignará el multipart/form-data automáticamente
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Familia registrada exitosamente en el catálogo!");
                
                // Limpiar formulario y cerrar modal
                addFamilyForm.reset();
                uploadText.textContent = "Agregar Imagen";
                uploadTrigger.style.borderColor = "#ddd";
                uploadTrigger.style.backgroundColor = "#fafafa";
                bootstrap.Modal.getInstance(document.getElementById('addFamilyModal')).hide();
                
                // Recargar la lista
                cargarFamilias();
            } else {
                alert(`Error al registrar: ${data.mensaje}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al subir la familia.");
        } finally {
            btnGuardarFamilia.innerHTML = textoOriginal;
            btnGuardarFamilia.disabled = false;
        }
    });
});