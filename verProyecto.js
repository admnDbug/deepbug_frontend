document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SEGURIDAD Y CONTEXTO ---
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    
    if (!token) {
        window.location.replace('login.html');
        return;
    }
    
    const nombreUsuarioTop = document.getElementById('nombreUsuarioTop');
    if (nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');

    if (!proyectoId) {
        alert("No se especificó un proyecto.");
        window.location.href = 'inicio.html';
        return;
    }

    // --- CERRAR SESIÓN ---
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if(btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            if(confirm("¿Seguro que deseas salir?")) {
                localStorage.clear();
                window.location.replace('login.html');
            }
        });
    }

    // Arrancamos el motor
    aplicarRoles();
    cargarVistaProyecto();

    // --- 2. CARGAR DATOS (PETICIONES SEPARADAS PARA EVITAR CRASHEOS) ---
    async function cargarVistaProyecto() {
        try {
            // Petición 1: Proyecto
            const resProyecto = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resProyecto.ok) throw new Error('No se pudo cargar la información general del proyecto.');
            const proyecto = await resProyecto.json();

            // Petición 2: Protocolos (Protegida por si el backend bloquea al colaborador)
            let protocolos = [];
            try {
                const resProtocolos = await fetch(`https://deepbug-backend-staging.onrender.com/api/protocolos/${proyectoId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resProtocolos.ok) protocolos = await resProtocolos.json();
            } catch (errProtocolos) {
                console.warn("No se pudieron cargar los protocolos. Posible bloqueo de rol en backend.");
            }

            // Llenar info general
            document.getElementById('vp-nombre-proyecto').textContent = proyecto.nombre_estacion || 'Estación sin nombre';
            document.getElementById('vp-zona-proyecto').textContent = proyecto.zona_id?.nombre || 'Sin Zona';
            document.getElementById('vp-fecha-creacion').textContent = new Date(proyecto.fecha_creacion).toLocaleDateString('es-MX');
            
            // Protección por si responsable_id viene vacío
            if (proyecto.responsable_id && proyecto.responsable_id.length > 0) {
                document.getElementById('vp-responsable-nombre').textContent = proyecto.responsable_id[0].nombre || 'Desconocido';
            }
            
            // Mostrar la alerta del Protocolo 1
            const alertaContainer = document.getElementById('vp-alerta-protocolo1');
            const estadoP1 = (proyecto.estado_protocolos && proyecto.estado_protocolos.protocolo1) || 0;
            if (estadoP1 === 0) {
                alertaContainer.innerHTML = `<div class="alert alert-danger fw-bold shadow-sm rounded-4"><i class="fas fa-exclamation-triangle me-2"></i> ¡Atención! Debes llenar el Protocolo 1 en esta web antes de salir a campo.</div>`;
            } else {
                alertaContainer.innerHTML = `<div class="alert alert-info fw-bold shadow-sm rounded-4"><i class="fas fa-mobile-alt me-2"></i> Recordatorio: Dile a tus colaboradores que sincronicen su app móvil antes de ir a campo.</div>`;
            }
            
            document.getElementById('vp-codigo-invitacion').textContent = proyecto.codigo_invitacion || '------';

            // Dibujar partes dinámicas
            dibujarColaboradores(proyecto.colaboradores_id);
            dibujarProtocolos(protocolos);

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al cargar el proyecto: " + error.message);
        }
    }

    // --- 3. DIBUJAR COLABORADORES ---
    function dibujarColaboradores(colaboradores) {
        const contenedor = document.getElementById('contenedor-colaboradores');
        contenedor.innerHTML = '';

        if (!colaboradores || colaboradores.length === 0) {
            contenedor.innerHTML = '<p class="text-muted small text-center">No hay colaboradores unidos aún.</p>';
            return;
        }

        colaboradores.forEach(colab => {
            const esResponsable = rolUsuario === 'Responsable';
            const btnEliminar = esResponsable ? 
                `<button class="btn btn-sm text-danger border-0 btn-eliminar-colab" data-id="${colab._id}">
                    <i class="far fa-times-circle fs-5"></i>
                </button>` : '';

            const colabHTML = `
                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div class="d-flex align-items-center">
                        <div class="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex justify-content-center align-items-center me-3" style="width: 40px; height: 40px;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <p class="mb-0 fw-bold text-dark" style="font-size: 0.9rem;">${colab.nombre}</p>
                            <p class="mb-0 text-muted" style="font-size: 0.8rem;">${colab.email}</p>
                        </div>
                    </div>
                    ${btnEliminar}
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', colabHTML);
        });

        document.querySelectorAll('.btn-eliminar-colab').forEach(btn => {
            btn.addEventListener('click', async function() {
                const colabId = this.getAttribute('data-id');
                if (confirm('¿Eliminar a este colaborador del proyecto?')) {
                    await removerColaborador(colabId);
                }
            });
        });
    }

    async function removerColaborador(colaborador_id) {
        try {
            const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}/remover-colaborador`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ colaborador_id })
            });
            if (res.ok) cargarVistaProyecto();
            else alert("Error al remover colaborador.");
        } catch (error) { console.error(error); }
    }

    // --- 4. DIBUJAR PROTOCOLOS Y DETECTAR CONFLICTOS ---
    function dibujarProtocolos(protocolosRegistrados) {
        const contenedor = document.getElementById('contenedor-protocolos');
        contenedor.innerHTML = '';

        const titulos = {
            1: "Datos Generales y Cuerpo de Agua",
            2: "Hábitat y Entorno",
            3: "Parámetros Fisicoquímicos",
            4: "Muestra Biológica",
            5: "Conteo y Valor BMWP"
        };

        for (let i = 1; i <= 5; i++) {
            const registrosDeEsteProtocolo = protocolosRegistrados.filter(p => p.protocolo_numero === i);
            
            let estadoVisual = 'vacio'; 
            let iconClass = 'fa-arrow-right text-muted';
            let bgClass = 'bg-white';
            let alertHTML = '';

            if (registrosDeEsteProtocolo.length > 0) {
                const hayConflicto = registrosDeEsteProtocolo.some(p => p.estado === 'en_conflicto');
                
                if (hayConflicto) {
                    estadoVisual = 'conflicto';
                    bgClass = 'bg-warning bg-opacity-10 border-warning';
                    iconClass = 'fa-exclamation-triangle text-warning';
                    alertHTML = rolUsuario === 'Responsable' 
                        ? `<div class="mt-2 small text-danger fw-bold"><i class="fas fa-shield-alt me-1"></i> ¡Conflicto de sincronización!</div>`
                        : `<div class="mt-2 small text-warning fw-bold"><i class="fas fa-clock me-1"></i> En revisión por el Responsable.</div>`;
                } else {
                    estadoVisual = 'aprobado';
                    bgClass = 'bg-success bg-opacity-10 border-success';
                    iconClass = 'fa-check-circle text-success';
                }
            }

            const cardHTML = `
                <div class="col-md-6 ${i === 5 ? 'col-12' : ''}">
                    <div class="card shadow-sm border-1 rounded-4 cursor-pointer protocol-card ${bgClass}" data-numero="${i}" data-estado="${estadoVisual}" style="cursor: pointer; transition: 0.3s;">
                        <div class="card-body p-4 d-flex flex-column justify-content-center">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="fw-bold mb-1">Protocolo ${i}</h6>
                                    <p class="text-muted small mb-0">${titulos[i]}</p>
                                </div>
                                <i class="fas ${iconClass} fs-3"></i>
                            </div>
                            ${alertHTML}
                        </div>
                    </div>
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', cardHTML);
        }

        // Navegación al hacer clic
        document.querySelectorAll('.protocol-card').forEach(card => {
            card.addEventListener('click', function() {
                const numero = this.getAttribute('data-numero');
                const estado = this.getAttribute('data-estado');

                if (estado === 'vacio' && rolUsuario !== 'Responsable') {
                    alert("Este protocolo aún no ha sido iniciado por el Responsable.");
                    return;
                }

                if (estado === 'conflicto' && rolUsuario === 'Responsable') {
                    window.location.href = `resolverconflicto.html?id=${proyectoId}&protocolo=${numero}`;
                    return;
                }

                window.location.href = `protocolo${numero}.html?id=${proyectoId}`;
            });
        });
    }

    // --- 5. EL MOTORCITO DE ROLES (EL PASO 2) ---
    function aplicarRoles() {
        document.querySelectorAll("[data-role]").forEach(el => {
            const rolesPermitidos = el.getAttribute("data-role").split(" ");
            
            // Si el rol del usuario NO está en la lista de permitidos, lo ocultamos a la fuerza
            if (!rolesPermitidos.includes(rolUsuario)) {
                el.style.setProperty('display', 'none', 'important');
            }
        });
    }
    // --- 6. LÓGICA PARA ELIMINAR EL PROYECTO ---
    const btnEliminarProyecto = document.getElementById('btn-eliminar-proyecto');
    if (btnEliminarProyecto) {
        btnEliminarProyecto.addEventListener('click', async () => {
            // Doble confirmación por seguridad
            const confirmacion = confirm("⚠️ ¿Estás absolutamente seguro de que deseas ELIMINAR este proyecto?\n\nEsta acción borrará todos los protocolos, fotos y datos asociados. NO se puede deshacer.");
            if (!confirmacion) return;

            try {
                // Cambiamos la interfaz para mostrar que está procesando
                btnEliminarProyecto.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Eliminando todo...';
                btnEliminarProyecto.disabled = true;

                const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    alert("Proyecto eliminado con éxito.");
                    window.location.href = 'inicio.html'; // Lo mandamos de regreso al dashboard
                } else {
                    const data = await res.json();
                    alert(`Error: ${data.mensaje}`);
                    // Restauramos el botón si falla
                    btnEliminarProyecto.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Eliminar Proyecto Definitivamente';
                    btnEliminarProyecto.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar eliminar el proyecto.");
                btnEliminarProyecto.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Eliminar Proyecto Definitivamente';
                btnEliminarProyecto.disabled = false;
            }
        });
    }
    // --- 7. LÓGICA PARA SALIR DEL PROYECTO (COLABORADOR) ---
    const btnSalirProyecto = document.getElementById('btn-salir-proyecto');
    if (btnSalirProyecto) {
        btnSalirProyecto.addEventListener('click', async () => {
            const confirmacion = confirm("¿Estás seguro de que deseas salir de este proyecto? Ya no podrás ver ni editar los protocolos a menos que te vuelvan a invitar.");
            if (!confirmacion) return;

            try {
                btnSalirProyecto.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saliendo...';
                btnSalirProyecto.disabled = true;

                const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}/salir`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    alert("Has salido del proyecto exitosamente.");
                    window.location.href = 'inicio.html'; // Lo mandamos al dashboard
                } else {
                    const data = await res.json();
                    alert(`Error: ${data.mensaje}`);
                    btnSalirProyecto.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Salir del Proyecto';
                    btnSalirProyecto.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar salir del proyecto.");
                btnSalirProyecto.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Salir del Proyecto';
                btnSalirProyecto.disabled = false;
            }
        });
    }
});