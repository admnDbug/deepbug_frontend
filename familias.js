document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) window.location.reload();
    });

    const token = localStorage.getItem('token');
    if (!token) return window.location.replace('login.html');
    
    const nombreUsuarioTop = document.querySelector('.fw-bold.text-dark');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    // LÓGICA DE IMAGEN (Alta)
    const imageInput = document.getElementById('family-image-input');
    const uploadTrigger = document.getElementById('family-upload-trigger');
    const uploadText = document.getElementById('upload-text');
    if (uploadTrigger) uploadTrigger.addEventListener('click', () => imageInput.click());
    if (imageInput) imageInput.addEventListener('change', () => {
        if (imageInput.files[0]) uploadText.textContent = `Imagen: ${imageInput.files[0].name}`;
    });

    // LÓGICA DE IMAGEN (Edición)
    const editImageInput = document.getElementById('edit-family-image-input');
    const editUploadTrigger = document.getElementById('edit-family-upload-trigger');
    const editUploadText = document.getElementById('edit-upload-text');
    if (editUploadTrigger) editUploadTrigger.addEventListener('click', () => editImageInput.click());
    if (editImageInput) editImageInput.addEventListener('change', () => {
        if (editImageInput.files[0]) editUploadText.textContent = `Nueva foto: ${editImageInput.files[0].name}`;
    });

    cargarFamilias();

    // 1. CARGAR EL LISTADO COMPLETO
    async function cargarFamilias() {
        try {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/familias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const familias = await respuesta.json();
            const contenedor = document.getElementById('contenedorFamiliasLista');
            contenedor.innerHTML = ''; 

            if(familias.length === 0) {
                contenedor.innerHTML = '<p class="text-center mt-4 text-muted">No hay familias registradas.</p>';
                return;
            }

            familias.forEach(f => {
                const filaHTML = `
                <div class="family-table-row align-items-center">
                    <div class="family-col-name fw-bold">
                        ${f.imagen_url ? `<img src="${f.imagen_url}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : '<i class="fas fa-bug me-2 text-muted"></i>'}
                        ${f.nombre_familia}
                    </div>
                    <div class="family-col-orden">${f.orden || '-'}</div>
                    <div class="family-col-tamano">${f.tamano || '-'} mm</div>
                    
                    <div class="family-col-act" style="width: 80px; text-align: center;">
                        <button class="btn btn-sm btn-outline-primary btn-abrir-editar" 
                            data-id="${f._id}" 
                            data-nombre="${f.nombre_familia}" 
                            data-orden="${f.orden || ''}" 
                            data-tamano="${f.tamano || ''}" 
                            data-desc="${f.descripcion || ''}"
                            title="Editar Familia">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', filaHTML);
            });

            // Enlazar clics de edición
            document.querySelectorAll('.btn-abrir-editar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    
                    // Llenamos el formulario del modal de edición
                    document.getElementById('edit-family-id').value = target.getAttribute('data-id');
                    document.getElementById('edit-family-name').value = target.getAttribute('data-nombre');
                    document.getElementById('edit-family-order').value = target.getAttribute('data-orden');
                    document.getElementById('edit-family-size').value = target.getAttribute('data-tamano');
                    document.getElementById('edit-family-desc').value = target.getAttribute('data-desc');
                    
                    editUploadText.textContent = "Cambiar Foto de Evidencia (Opcional)";
                    editImageInput.value = ""; // Reseteamos archivos previos

                    // Abrimos el modal con Bootstrap
                    const modal = new bootstrap.Modal(document.getElementById('editFamilyModal'));
                    modal.show();
                });
            });

        } catch (error) {
            document.getElementById('contenedorFamiliasLista').innerHTML = '<p class="text-center mt-4 text-danger">Error de conexión.</p>';
        }
    }

    // 2. DISPARAR POST (ALTA TRADICIONAL)
    const addFamilyForm = document.getElementById('add-family-form');
    if(addFamilyForm) {
        addFamilyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (imageInput.files.length === 0) return alert("Selecciona una imagen base para el catálogo.");

            const btn = document.getElementById('btnGuardarFamilia');
            const txt = btn.textContent;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';
            btn.disabled = true;

            const formData = new FormData();
            formData.append('nombre_familia', document.getElementById('new-family-name').value.trim());
            formData.append('orden', document.getElementById('new-family-order').value.trim());
            formData.append('tamano', document.getElementById('new-family-size').value.trim());
            formData.append('descripcion', document.getElementById('new-family-desc').value.trim());
            formData.append('imagen', imageInput.files[0]);

            try {
                const res = await fetch('https://deepbug-backend.onrender.com/api/familias', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    alert("Familia registrada exitosamente.");
                    addFamilyForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addFamilyModal')).hide();
                    cargarFamilias();
                }
            } catch (error) { alert("Error de conexión."); }
            finally { btn.textContent = txt; btn.disabled = false; }
        });
    }

    // 3. DISPARAR PUT (ACTUALIZACIÓN COMPLETA CON FORM DATA)
    const editFamilyForm = document.getElementById('edit-family-form');
    editFamilyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fId = document.getElementById('edit-family-id').value;
        const btn = document.getElementById('btnActualizarFamilia');
        const txt = btn.textContent;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando catálogo...';
        btn.disabled = true;

        const formData = new FormData();
        formData.append('nombre_familia', document.getElementById('edit-family-name').value.trim());
        formData.append('orden', document.getElementById('edit-family-order').value.trim());
        formData.append('tamano', document.getElementById('edit-family-size').value.trim());
        formData.append('descripcion', document.getElementById('edit-family-desc').value.trim());
        
        // Si el usuario eligió una nueva foto, la adjuntamos; si no, el backend mantendrá la de Cloudinary actual
        if (editImageInput.files.length > 0) {
            formData.append('imagen', editImageInput.files[0]);
        }

        try {
            const res = await fetch(`https://deepbug-backend.onrender.com/api/familias/${fId}`, {
                method: 'PUT', // Método HTTP oficial para mutaciones
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData // Multipart/form-data automático
            });

            if (res.ok) {
                alert("¡Parámetros de la familia actualizados con éxito!");
                bootstrap.Modal.getInstance(document.getElementById('editFamilyModal')).hide();
                cargarFamilias();
            } else {
                const data = await res.json();
                alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            alert("Error de comunicación con Render.");
        } finally {
            btn.textContent = txt;
            btn.disabled = false;
        }
    });
});