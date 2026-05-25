// frontend/zonas.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }

    const nombreUsuarioTop = document.getElementById('nombreUsuarioTop');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.replace('login.html');
        });
    }

    // 2. CARGA DE ZONAS
    cargarZonas();

    async function cargarZonas() {
        try {
            
            //const respuesta = await fetch('https://deepbug-backend.onrender.com/api/zonas', {
            const respuesta = await fetch('https://deepbug-backend.onrender.com/api/zonas', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error('Error al cargar zonas');

            const zonas = await respuesta.json();
            const contenedor = document.getElementById('contenedorZonasLista');
            contenedor.innerHTML = ''; 
            
            if(zonas.length === 0) {
                contenedor.innerHTML = '<p class="text-center mt-4 text-muted">No hay zonas registradas aún.</p>';
                return;
            }

            zonas.forEach(zona => {
                let textoFamilias = 'Ninguna';
                if (zona.catalogo_familias && zona.catalogo_familias.length > 0) {
                    textoFamilias = zona.catalogo_familias.map(f => f.nombre_familia).join(', ');
                }

                const filaHTML = `
                <div class="zone-table-row align-items-center">
                    <div class="zone-col-name fw-bold">${zona.nombre}</div>
                    <div class="zone-col-loc">${zona.ubicacion}</div>
                    <div class="zone-col-coord">Coordenadas: ${zona.coordenadas}</div>
                    <div class="zone-col-fam" style="font-size: 12px;">${textoFamilias}</div>
                    <div class="zone-col-act" style="width: 100px; text-align: center; display: flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-sm btn-outline-primary btn-editar-zona" data-id="${zona._id}" title="Editar Zona">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar-zona" data-id="${zona._id}" title="Eliminar Zona">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', filaHTML);
            });

            // Asignar eventos a los botones de Editar
            document.querySelectorAll('.btn-editar-zona').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const zonaId = e.currentTarget.getAttribute('data-id');
                    window.location.href = `editarzona.html?id=${zonaId}`;
                });
            });

            // Asignar eventos a los botones de Eliminar
            document.querySelectorAll('.btn-eliminar-zona').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const zonaId = e.currentTarget.getAttribute('data-id');
                    eliminarZona(zonaId);
                });
            });

        } catch (error) {
            console.error(error);
            document.getElementById('contenedorZonasLista').innerHTML = '<p class="text-center mt-4 text-danger">Error al conectar con el servidor.</p>';
        }
    }

    async function eliminarZona(zonaId) {
        const confirmar = confirm("¿Estás seguro de que deseas eliminar esta zona? Las estaciones asociados podrían quedarse sin catálogo.");
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`https://deepbug-backend.onrender.com/api/zonas/${zonaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (respuesta.ok) {
                alert("Zona eliminada correctamente.");
                cargarZonas(); 
            } else {
                const errorData = await respuesta.json();
                alert(`Error: ${errorData.mensaje}`);
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error de conexión al intentar eliminar la zona.");
        }
    }
});