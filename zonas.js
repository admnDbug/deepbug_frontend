document.addEventListener('DOMContentLoaded', () => {
    // 1. SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. NAVBAR Y CERRAR SESIÓN
    const nombreUsuarioTop = document.getElementById('nombreUsuarioTop');
    if(nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // 3. CARGA DE ZONAS
    cargarZonas();

    async function cargarZonas() {
        try {
            const respuesta = await fetch('http://localhost:3000/api/zonas', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error('Error al cargar zonas');

            const zonas = await respuesta.json();
            const contenedor = document.getElementById('contenedorZonasLista');
            contenedor.innerHTML = ''; // Limpiamos para que no se dupliquen al recargar
            
            if(zonas.length === 0) {
                contenedor.innerHTML = '<p class="text-center mt-4 text-muted">No hay zonas registradas aún.</p>';
                return;
            }

            zonas.forEach(zona => {
                let textoFamilias = 'Ninguna';
                if (zona.catalogo_familias && zona.catalogo_familias.length > 0) {
                    textoFamilias = zona.catalogo_familias.map(f => f.nombre_familia).join(', ');
                }

                // Inyectamos la fila con el botón de borrar (incluye el data-id con el _id de Mongo)
                const filaHTML = `
                <div class="zone-table-row align-items-center">
                    <div class="zone-col-name fw-bold">${zona.nombre}</div>
                    <div class="zone-col-loc">${zona.ubicacion}</div>
                    <div class="zone-col-coord">Coordenadas: ${zona.coordenadas}</div>
                    <div class="zone-col-fam" style="font-size: 12px;">${textoFamilias}</div>
                    <div class="zone-col-act" style="width: 80px; text-align: center;">
                        <button class="btn btn-sm btn-outline-danger btn-eliminar-zona" data-id="${zona._id}" title="Eliminar Zona">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', filaHTML);
            });

            // Asignar el evento a todos los botones de eliminar recién creados
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

    // 4. FUNCIÓN PARA ELIMINAR ZONA
    async function eliminarZona(zonaId) {
        const confirmar = confirm("¿Estás seguro de que deseas eliminar esta zona? Los proyectos asociados podrían quedarse sin catálogo.");
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`http://localhost:3000/api/zonas/${zonaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (respuesta.ok) {
                alert("Zona eliminada correctamente.");
                cargarZonas(); // Recargamos la tabla en vivo
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