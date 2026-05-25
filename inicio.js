// Archivo: inicio.js

document.addEventListener('DOMContentLoaded', () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    // 1. VERIFICACIÓN DE SEGURIDAD
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para ver esta página.');
        window.location.replace('login.html');
        return;
    }

    // 2. ACTUALIZAR INTERFAZ CON DATOS DEL USUARIO
    const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Usuario';
    document.getElementById('nombreUsuarioTop').textContent = nombreUsuario;

    cargarProyectos();

    // 3. FUNCIÓN PARA OBTENER Y DIBUJAR LOS PROYECTOS
    async function cargarProyectos() {
        try {
            const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/estaciones', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!respuesta.ok) throw new Error('Error al obtener los proyectos');

            const proyectos = await respuesta.json();
            const contenedor = document.getElementById('contenedorProyectos');

            proyectos.forEach(proyecto => {
                const fechaStr = proyecto.fecha_creacion 
                    ? new Date(proyecto.fecha_creacion).toLocaleDateString('es-MX') 
                    : 'Sin fecha';
                
                const nombreZona = (proyecto.zona_id && proyecto.zona_id.nombre) 
                    ? proyecto.zona_id.nombre 
                    : 'Zona no especificada';

                // Evaluamos el estado del protocolo 1 (Solo mostramos la alerta roja)
                const estadoP1 = (proyecto.estado_protocolos && proyecto.estado_protocolos.protocolo1) || 0;
                let alertaHTML = '';
                if (estadoP1 === 0) {
                    alertaHTML = `<div class="alert alert-danger p-2 mb-3 text-center rounded-3 shadow-sm" style="font-size: 0.8rem; font-weight: bold;"><i class="fas fa-exclamation-triangle me-1"></i> Llenar Protocolo 1 antes de campo</div>`;
                }

                // Creamos el HTML de la tarjeta
                const tarjetaHTML = `
                <div class="col">
                    <div class="project-card">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-file-alt card-icon me-2"></i>
                            <a class="card-title text-truncate" href="verproyecto.html?id=${proyecto._id}">${proyecto.nombre_proyecto}</a>
                        </div>
                        
                        ${alertaHTML}

                        <div class="info-text">
                            <strong>Zona:</strong><br>
                            ${nombreZona}
                        </div>
                        <div class="info-text">
                            <strong>Fecha de creación:</strong> ${fechaStr}
                        </div>
                        <div class="info-text">
                            <strong>Código:</strong> ${proyecto.codigo_invitacion || 'N/A'}
                        </div>

                        <button class="btn btn-pdf mt-3 w-100" onclick="alert('Generación de PDF en desarrollo')">Guardar PDF</button>
                    </div>
                </div>
                `;

                contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
            });

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudieron cargar tus proyectos.');
        }
    }

    // 4. LÓGICA PARA UNIRSE A UN PROYECTO CON CÓDIGO
    const btnUnirse = document.getElementById('btnUnirseProyecto');
    if (btnUnirse) {
        btnUnirse.addEventListener('click', async () => {
            const codigo = document.getElementById('codigoInvitacionInput').value;
            if (!codigo) return alert('Ingresa un código');

            try {
                const respuesta = await fetch('https://deepbug-backend-staging.onrender.com/api/auth/validar-codigo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
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
                console.error(error);
                alert('Error al intentar unirse al proyecto.');
            }
        });
    }

    // 5. CERRAR SESIÓN
    document.getElementById('btnCerrarSesion').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear(); 
        window.location.replace('login.html');
    });
});