document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario');

    if (!token || rolUsuario !== 'Responsable') {
        alert("Acceso denegado. Solo el Responsable puede resolver conflictos.");
        window.location.href = 'inicio.html';
        return;
    }

    const nombreUsuarioTop = document.getElementById('nombreUsuarioTop');
    if (nombreUsuarioTop) nombreUsuarioTop.textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const estacionId = urlParams.get('id');
    const numProtocolo = urlParams.get('protocolo');

    if (!estacionId || !numProtocolo) {
        alert("Faltan datos para resolver el conflicto.");
        window.location.href = 'inicio.html';
        return;
    }

    document.getElementById('num-protocolo').textContent = numProtocolo;

    cargarConflictos();

    async function cargarConflictos() {
        try {
            const respuesta = await fetch(`https://deepbug-backend.onrender.com/api/protocolos/${estacionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error("No se pudieron cargar los protocolos");

            const todosLosProtocolos = await respuesta.json();
            
            const registros = todosLosProtocolos.filter(p => p.protocolo_numero == numProtocolo);
            const aprobado = registros.find(p => p.estado === 'aprobado');
            const todosEnConflicto = registros.filter(p => p.estado === 'en_conflicto');

            const contenedor = document.getElementById('contenedor-comparacion');

            if (!aprobado || todosEnConflicto.length === 0) {
                contenedor.innerHTML = `<div class="alert alert-success text-center">No se detectaron conflictos activos para este protocolo.</div>`;
                return;
            }

            contenedor.innerHTML = `
                <div class="col-lg-5 col-xl-5 d-flex">
                    <div class="card shadow border-2 border-success rounded-4 w-100 d-flex flex-column">
                        <div class="card-header bg-success text-white text-center fw-bold py-3">
                            <i class="fas fa-check-circle me-2"></i> Versión Actual (Aprobada)
                        </div>
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p class="text-muted small mb-1">Subido por:</p>
                                    <p class="fw-bold text-dark mb-0"><i class="fas fa-user-circle text-secondary me-2"></i>${aprobado.usuario_id?.nombre || 'Desconocido'}</p>
                                </div>
                                <div class="text-end">
                                    <p class="text-muted small mb-1">Fecha de sincronización:</p>
                                    <p class="fw-bold text-dark mb-0"><i class="far fa-calendar-alt text-secondary me-2"></i>${new Date(aprobado.fecha_llenado).toLocaleString('es-MX')}</p>
                                </div>
                            </div>
                            
                            <hr class="mt-0">
                            <p class="fw-bold text-dark mb-2"><i class="fas fa-database me-2"></i>Datos Registrados:</p>
                            
                            <div class="bg-light p-3 rounded-3 flex-grow-1 overflow-auto" style="height: 60vh; font-size: 0.95rem; border: 1px solid #dee2e6;">
                                ${generarVistaDatos(aprobado)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-2 col-xl-1 d-flex align-items-center justify-content-center py-4">
                    <div class="bg-light rounded-circle p-3 shadow-sm text-muted fw-bold fs-5">VS</div>
                </div>
            `;

            todosEnConflicto.forEach((conflicto, index) => {
                const tarjetaConflicto = `
                    <div class="col-lg-5 col-xl-5 mb-4 d-flex">
                        <div class="card shadow border-2 border-warning rounded-4 w-100 d-flex flex-column">
                            <div class="card-header bg-warning text-dark text-center fw-bold py-3">
                                Versión en Conflicto #${index + 1}
                            </div>
                            <div class="card-body p-4 d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <p class="text-muted small mb-1">Subido por:</p>
                                        <p class="fw-bold text-dark mb-0"><i class="fas fa-user-circle text-secondary me-2"></i>${conflicto.usuario_id?.nombre || 'Desconocido'}</p>
                                    </div>
                                    <div class="text-end">
                                        <p class="text-muted small mb-1">Fecha de sincronización:</p>
                                        <p class="fw-bold text-dark mb-0"><i class="far fa-calendar-alt text-secondary me-2"></i>${new Date(conflicto.fecha_llenado).toLocaleString('es-MX')}</p>
                                    </div>
                                </div>
                                
                                <hr class="mt-0">
                                <p class="fw-bold text-dark mb-2"><i class="fas fa-database me-2"></i>Datos Registrados:</p>
                                
                                <div class="bg-light p-3 rounded-3 flex-grow-1 overflow-auto mb-4" style="height: 60vh; font-size: 0.95rem; border: 1px solid #dee2e6;">
                                    ${generarVistaDatos(conflicto)}
                                </div>

                                <div class="d-flex gap-2 mt-auto">
                                    <button class="btn btn-outline-danger fw-bold rounded-pill py-2 w-50" onclick="resolver('${conflicto._id}', 'descartar')">
                                        <i class="fas fa-trash-alt me-1"></i> Descartar
                                    </button>
                                    <button class="btn btn-warning fw-bold rounded-pill py-2 w-50" onclick="resolver('${conflicto._id}', 'aprobar')">
                                        <i class="fas fa-exchange-alt me-1"></i> Reemplazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.insertAdjacentHTML('beforeend', tarjetaConflicto);
            });

        } catch (error) {
            console.error("Error al cargar conflictos:", error);
            document.getElementById('contenedor-comparacion').innerHTML = `<div class="alert alert-danger text-center">Error al cargar los datos del conflicto.</div>`;
        }
    }

    function formatearValor(valor) {
        if (typeof valor === 'boolean') {
            return valor ? '<span class="badge bg-success rounded-pill px-2">Sí / Presente</span>' : '<span class="badge bg-danger rounded-pill px-2">No / Ausente</span>';
        }
        
        if (Array.isArray(valor)) {
            if (valor.length === 0) return '<span class="text-muted small fst-italic">Vacío</span>';
            let html = '<ul class="list-unstyled ms-3 mb-0 border-start border-2 border-primary ps-2">';
            valor.forEach(item => {
                html += `<li class="small pb-1 text-dark">${formatearValor(item)}</li>`;
            });
            html += '</ul>';
            return html;
        }
        
        if (typeof valor === 'object' && valor !== null) {
            let html = '<div class="ms-2 mt-1 p-2 bg-white border border-light rounded shadow-sm">';
            for (const [subKey, subValue] of Object.entries(valor)) {
                const llaveLimpia = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                html += `
                    <div class="mb-1 d-flex flex-wrap align-items-center">
                        <strong class="small text-secondary me-2">${llaveLimpia}:</strong> 
                        <span class="small">${formatearValor(subValue)}</span>
                    </div>`;
            }
            html += '</div>';
            return html;
        }
        
        if (valor === "" || valor === null || valor === undefined) {
            return '<span class="text-muted small fst-italic">- Sin dato -</span>';
        }
        
        return `<span class="small text-dark fw-medium">${valor}</span>`;
    }

    function generarVistaDatos(protocolo) {
        let html = '<div class="d-flex flex-column gap-2">';
        
        if (protocolo.protocolo_numero == 5) {
            const datos = protocolo.datos_protocolo_5;
            if (!datos) return '<p class="text-muted mb-0">Sin datos registrados.</p>';
            
            html += `
                <div class="p-2 border-bottom border-light">
                    <strong class="d-block text-primary mb-1"><i class="fas fa-calculator me-1"></i>Sumatoria BMWP</strong>
                    <span class="badge bg-primary fs-6">${datos.sumatoria_total_bmwp || 0}</span>
                </div>`;
            
            if (datos.familias_encontradas && datos.familias_encontradas.length > 0) {
                html += `<div class="p-2"><strong class="d-block text-primary mb-2"><i class="fas fa-bug me-1"></i>Familias Encontradas</strong><div class="d-flex flex-column gap-1">`;
                datos.familias_encontradas.forEach(f => {
                    html += `
                        <div class="bg-white border rounded p-2 d-flex justify-content-between align-items-center shadow-sm">
                            <div>
                                <span class="small fw-bold text-dark">${f.nombre_familia}</span>
                                <span class="badge bg-light text-dark border ms-2" style="font-size: 0.8rem; font-weight: 600;">Cantidad: ${f.cantidad || 1}</span>
                            </div>
                            <span class="badge bg-info text-dark">BMWP: ${f.valor_bmwp}</span>
                        </div>`;
                });
                html += `</div></div>`;
            } else {
                 html += `<div class="p-2"><span class="text-muted small">No se registraron familias.</span></div>`;
            }
        } 
        else {
            const datos = protocolo.datos_formulario;
            if (!datos || Object.keys(datos).length === 0) return '<p class="text-muted mb-0">Sin datos registrados.</p>';
            
            for (const [key, value] of Object.entries(datos)) {
                const llaveLimpia = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                if (key === 'foto_url' && value) {
                    html += `
                        <div class="p-2 border-bottom border-light">
                            <strong class="d-block text-primary mb-1"><i class="fas fa-camera-retro me-1"></i>${llaveLimpia}</strong>
                            <a href="${value}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill"><i class="fas fa-external-link-alt me-1"></i>Ver Evidencia Fotográfica</a>
                        </div>`;
                    continue;
                }

                html += `
                    <div class="p-2 border-bottom border-light bg-transparent">
                        <strong class="d-block text-primary mb-1"><i class="fas fa-caret-right me-1"></i>${llaveLimpia}</strong>
                        ${formatearValor(value)}
                    </div>`;
            }
        }
        
        html += '</div>';
        return html;
    }

    window.resolver = async function(idProtocoloEnConflicto, accion) {
        const confirmar = confirm(`¿Estás seguro de que deseas ${accion === 'aprobar' ? 'reemplazar la versión actual por la entrante' : 'descartar la versión entrante y conservar la actual'}? Esta acción no se puede deshacer.`);
        
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`https://deepbug-backend.onrender.com/api/protocolos/resolver/${idProtocoloEnConflicto}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ accion: accion })
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Conflicto resuelto exitosamente!");
                window.location.href = `verestacion.html?id=${estacionId}`;
            } else {
                alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de red al intentar resolver el conflicto.");
        }
    }
});