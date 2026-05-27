document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) window.location.reload();
    });

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.replace('login.html');
        return;
    }

    const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Usuario';
    document.getElementById('nombreUsuarioTop').textContent = nombreUsuario;

    async function cargarEstaciones() {
        try {
            const respuesta = await fetch(' /api/estaciones', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error('Error al obtener las estaciones');

            const estaciones = await respuesta.json();
            const contenedor = document.getElementById('contenedorEstaciones');
            
            const tarjetasAisladas = contenedor.querySelectorAll('.col:not(:first-child)');
            tarjetasAisladas.forEach(t => t.remove());

            estaciones.forEach(estacion => {
                const fechaStr = estacion.fecha_creacion ? new Date(estacion.fecha_creacion).toLocaleDateString('es-MX') : 'Sin fecha';
                const nombreZona = (estacion.zona_id && estacion.zona_id.nombre) ? estacion.zona_id.nombre : 'Zona no especificada';
                const estadoP1 = (estacion.estado_protocolos && estacion.estado_protocolos.protocolo1) || 0;
                
                let alertaHTML = '';
                if (estadoP1 === 0) {
                    alertaHTML = `<div class="alert alert-danger p-2 mb-3 text-center rounded-3 shadow-sm" style="font-size: 0.8rem; font-weight: bold;"><i class="fas fa-exclamation-triangle me-1"></i> Llenar Protocolo 1 antes de campo</div>`;
                }

                const nombreMostrar = estacion.nombre_estacion || estacion.nombre_estacion;

                const tarjetaHTML = `
                <div class="col">
                    <div class="project-card">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-file-alt card-icon me-2"></i>
                            <a class="card-title text-truncate" href="verestacion.html?id=${estacion._id}">${nombreMostrar}</a>
                        </div>
                        ${alertaHTML}
                        <div class="info-text"><strong>Zona:</strong><br>${nombreZona}</div>
                        <div class="info-text"><strong>Fecha de creación:</strong> ${fechaStr}</div>
                        <div class="info-text"><strong>Código:</strong> ${estacion.codigo_invitacion || 'N/A'}</div>
                    </div>
                </div>
                `;

                contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudieron cargar tus estaciones.');
        }
    }

    const btnUnirse = document.getElementById('btnUnirseEstacion');
    if (btnUnirse) {
        btnUnirse.addEventListener('click', async () => {
            const codigo = document.getElementById('codigoInvitacionInput').value;
            if (!codigo) return alert('Ingresa un código');

            try {
                const respuesta = await fetch(' /api/auth/validar-codigo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ codigo })
                });
                const data = await respuesta.json();
                if (respuesta.ok) {
                    alert(data.mensaje);
                    window.location.reload(); 
                } else {
                    alert(data.mensaje);
                }
            } catch (error) {
                alert('Error al intentar unirse a la estacion.');
            }
        });
    }

    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear(); 
        window.location.replace('login.html');
    });

    setTimeout(() => {
        cargarEstaciones();
    }, 200);
});