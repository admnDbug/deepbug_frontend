document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    
    if (!token) {
        window.location.replace('login.html');
        return;
    }
    
    const nombreUsuarioTop = document.getElementById('nombreUsuarioTop');
    if (nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const estacionId = urlParams.get('id');

    if (!estacionId) {
        alert("No se especificó un estacion.");
        window.location.href = 'inicio.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if(btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            if(confirm("¿Seguro que deseas salir?")) {
                localStorage.clear();
                window.location.replace('login.html');
            }
        });
    }

    aplicarRoles();
    cargarVistaEstacion();

    async function cargarVistaEstacion() {
        try {
            const resEstacion = await fetch(` /api/estaciones/${estacionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resEstacion.ok) throw new Error('No se pudo cargar la información general de la estacion.');
            const estacion = await resEstacion.json();

            let protocolos = [];
            try {
                const resProtocolos = await fetch(` /api/protocolos/${estacionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resProtocolos.ok) protocolos = await resProtocolos.json();
            } catch (errProtocolos) {
                console.warn("No se pudieron cargar los protocolos. Posible bloqueo de rol en backend.");
            }

            document.getElementById('vp-nombre-estacion').textContent = estacion.nombre_estacion || 'Estación sin nombre';
            document.getElementById('vp-zona-estacion').textContent = estacion.zona_id?.nombre || 'Sin Zona';
            document.getElementById('vp-fecha-creacion').textContent = new Date(estacion.fecha_creacion).toLocaleDateString('es-MX');
            
            if (estacion.responsable_id && estacion.responsable_id.length > 0) {
                document.getElementById('vp-responsable-nombre').textContent = estacion.responsable_id[0].nombre || 'Desconocido';
            }
            
            const alertaContainer = document.getElementById('vp-alerta-protocolo1');
            const estadoP1 = (estacion.estado_protocolos && estacion.estado_protocolos.protocolo1) || 0;
            if (estadoP1 === 0) {
                alertaContainer.innerHTML = `<div class="alert alert-danger fw-bold shadow-sm rounded-4"><i class="fas fa-exclamation-triangle me-2"></i> ¡Atención! Debes llenar el Protocolo 1 en esta web antes de salir a campo.</div>`;
            } else {
                alertaContainer.innerHTML = `<div class="alert alert-info fw-bold shadow-sm rounded-4"><i class="fas fa-mobile-alt me-2"></i> Recordatorio: Dile a tus colaboradores que sincronicen su app móvil antes de ir a campo.</div>`;
            }
            
            document.getElementById('vp-codigo-invitacion').textContent = estacion.codigo_invitacion || '------';

            dibujarColaboradores(estacion.colaboradores_id);
            dibujarProtocolos(protocolos);

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al cargar e la estacion: " + error.message);
        }
    }

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
                if (confirm('¿Eliminar a este colaborador de la estacion?')) {
                    await removerColaborador(colabId);
                }
            });
        });
    }

    async function removerColaborador(colaborador_id) {
        try {
            const res = await fetch(` /api/estaciones/${estacionId}/remover-colaborador`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ colaborador_id })
            });
            if (res.ok) cargarVistaEstacion();
            else alert("Error al remover colaborador.");
        } catch (error) { console.error(error); }
    }

    function dibujarProtocolos(protocolosRegistrados) {
        const contenedor = document.getElementById('contenedor-protocolos');
        contenedor.innerHTML = '';

        const titulos = {
            1: "Datos Generales",
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

        document.querySelectorAll('.protocol-card').forEach(card => {
            card.addEventListener('click', function() {
                const numero = this.getAttribute('data-numero');
                const estado = this.getAttribute('data-estado');

                if (estado === 'vacio' && rolUsuario !== 'Responsable') {
                    alert("Este protocolo aún no ha sido iniciado por el Responsable.");
                    return;
                }

                if (estado === 'conflicto' && rolUsuario === 'Responsable') {
                    window.location.href = `resolverconflicto.html?id=${estacionId}&protocolo=${numero}`;
                    return;
                }

                window.location.href = `protocolo${numero}.html?id=${estacionId}`;
            });
        });
    }

    function aplicarRoles() {
        document.querySelectorAll("[data-role]").forEach(el => {
            const rolesPermitidos = el.getAttribute("data-role").split(" ");
            
            if (!rolesPermitidos.includes(rolUsuario)) {
                el.style.setProperty('display', 'none', 'important');
            }
        });
    }
    const btnEliminarEstacion = document.getElementById('btn-eliminar-estacion');
    if (btnEliminarEstacion) {
        btnEliminarEstacion.addEventListener('click', async () => {
            const confirmacion = confirm("¿Estás absolutamente seguro de que deseas ELIMINAR este estacion?\n\nEsta acción borrará todos los protocolos, fotos y datos asociados. NO se puede deshacer.");
            if (!confirmacion) return;

            try {
                btnEliminarEstacion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Eliminando todo...';
                btnEliminarEstacion.disabled = true;

                const res = await fetch(` /api/estaciones/${estacionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    alert("Estacion eliminada con éxito.");
                    window.location.href = 'inicio.html';
                } else {
                    const data = await res.json();
                    alert(`Error: ${data.mensaje}`);
                    btnEliminarEstacion.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Eliminar Estacion Definitivamente';
                    btnEliminarEstacion.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar eliminar la estacion.");
                btnEliminarEstacion.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Eliminar Estacion Definitivamente';
                btnEliminarEstacion.disabled = false;
            }
        });
    }
    const btnSalirEstacion = document.getElementById('btn-salir-estacion');
    if (btnSalirEstacion) {
        btnSalirEstacion.addEventListener('click', async () => {
            const confirmacion = confirm("¿Estás seguro de que deseas salir de esta estacion? Ya no podrás ver ni editar los protocolos a menos que te vuelvan a invitar.");
            if (!confirmacion) return;

            try {
                btnSalirEstacion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saliendo...';
                btnSalirEstacion.disabled = true;

                const res = await fetch(` /api/estaciones/${estacionId}/salir`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    alert("Has salido de la estacion exitosamente.");
                    window.location.href = 'inicio.html'; 
                } else {
                    const data = await res.json();
                    alert(`Error: ${data.mensaje}`);
                    btnSalirEstacion.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Salir de la Estacion';
                    btnSalirEstacion.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar salir de la estacion.");
                btnSalirEstacion.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i> Salir de la Estacion';
                btnSalirEstacion.disabled = false;
            }
        });
    }
});