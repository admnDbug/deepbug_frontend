document.addEventListener('DOMContentLoaded', () => {
    // Detectar si la página se está cargando desde la caché al usar el botón "Atrás"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Si viene de la caché, forzamos una recarga completa para que valide el token de verdad
            window.location.reload();
        }
    });
    // --- 1. SEGURIDAD ---
    const token = localStorage.getItem('token');
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    if (!token) return window.location.replace('login.html');
    document.getElementById('nombreUsuarioTop').textContent = localStorage.getItem('nombreUsuario') || 'Usuario';

    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    if (!proyectoId) return window.location.href = 'inicio.html';

    // --- 2. TEXTOS Y DATOS (Flutter + Desire) ---
    let tipoGradiente = 'Alto';
    let puntajesAlto = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8Izq: 0, p8Der: 0, p9Izq: 0, p9Der: 0, p10Izq: 0, p10Der: 0 };
    let puntajesBajo = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8Izq: 0, p8Der: 0, p9Izq: 0, p9Der: 0, p10Izq: 0, p10Der: 0 };

    function getPuntajesActuales() { return tipoGradiente === 'Alto' ? puntajesAlto : puntajesBajo; }

    const nombresParametros = {
        1: { alto: "1. Heterogeneidad y estabilidad del sustrato", bajo: "1. Heterogeneidad y estabilidad del sustrato" },
        2: { alto: "2. Empotramiento del sustrato", bajo: "2. Caracterización del sustrato de pozas" },
        3: { alto: "3. Relación profundidad y velocidad", bajo: "3. Variabilidad de las pozas" },
        4: { alto: "4. Deposición de sedimentos", bajo: "4. Deposición de sedimentos" },
        5: { alto: "5. Estado del flujo del cauce", bajo: "5. Estado del flujo del cauce" },
        6: { alto: "6. Alteración del cauce", bajo: "6. Alteración del cauce" },
        7: { alto: "7. Frecuencia de rápidos", bajo: "7. Sinuosidad del canal" },
        8: { alto: "8. Estabilidad de la ribera (Márgenes)", bajo: "8. Estabilidad de la ribera (Márgenes)" },
        9: { alto: "9. Vegetación protectora de la ribera (Márgenes)", bajo: "9. Vegetación protectora de la ribera (Márgenes)" },
        10: { alto: "10. Amplitud de la vegetación ribereña (Márgenes)", bajo: "10. Amplitud de la vegetación ribereña (Márgenes)" }
    };

    // Textos de Desire para el Modal
    const descripciones = {
        p1: {
            alto: {
                optimo: "Más del 70 % del sustrato es heterogéneo y estable para ser colonizado.",
                suboptimo: "40-70 % del sustrato es heterogéneo y estable. Existe un sustrato nuevo o poco estable.",
                marginal: "20-40 % del sustrato es heterogéneo y estable. La mayor parte del sustrato está perturbado o removido.",
                pobre: "Menos de un 20 % del sustrato es heterogéneo y estable. Ausencia de hábitats disponibles."
            },
            bajo: {
                optimo: "Más de 70 % del sustrato es estable y puede ser colonizado por la epifauna. El tramo presenta una mezcla de piedras, troncos sumergidos o superficiales.",
                suboptimo: "Entre 40 y 70 % del sustrato es estable. Aún existe un sustrato nuevo aun sin condiciones para ser habitado.",
                marginal: "Entre 20 y 40 % del sustrato es estable. Frecuentemente perturbado o removido.",
                pobre: "Menos de un 20 % del sustrato es estable. Ausencia de hábitats adecuados."
            }
        },
        p2: {
            alto: {
                optimo: "0-25 % de la superficie de rocas, piedras y grava está rodeada de sedimento fino.",
                suboptimo: "25-50 % de la superficie de rocas, piedras y grava rodeadas de sedimento fino.",
                marginal: "50-75% de la superficie de rocas, piedras y grava rodeadas de sedimento fino.",
                pobre: "Más del 75 % de la superficie de rocas, piedras y grava rodeadas de sedimento fino."
            },
            bajo: {
                optimo: "Mezcla de sustrato, con grava y arena firme prevalente. Raíces y vegetación sumergida.",
                suboptimo: "Mezcla de arena blanda, barro o arcilla; el barro puede ser dominante. Algunas raíces presentes.",
                marginal: "Todo el barro, arcilla o arena en la parte inferior. Poca o ninguna raíz, no hay vegetación sumergida.",
                pobre: "Arcilla dura o lecho de roca. No hay capas de raíces o vegetación."
            }
        },
        p3: {
            alto: {
                optimo: "Presenta las cuatro combinaciones: a) lento/profundo, b) lento/bajo, c) rápido/profundo, d) rápido/bajo.",
                suboptimo: "Sólo tres combinaciones. La ausencia de rápido/bajo determina el menor puntaje.",
                marginal: "Sólo dos combinaciones. La ausencia de rápido/bajo determina el menor puntaje.",
                pobre: "Una sola combinación presente. Usualmente lento/profundo."
            },
            bajo: {
                optimo: "Mezcla de pozas superficiales, poco profundas, profundas y de gran profundidad.",
                suboptimo: "La mayoría de las pozas a gran profundidad; muy pocas superficiales.",
                marginal: "Pozas superficiales mucho más frecuente que las pozas profundas.",
                pobre: "La mayoría de las pozas de poca profundidad o pozas ausente."
            }
        },
        p4: {
            optimo: "Poca presencia de islas o barreras, menos del 20 % del fondo afectado por deposición de sedimentos.",
            suboptimo: "Aumento de la formación de barreras, canto rodado o arena. 20-50 % del fondo afectado.",
            marginal: "Deposición moderada de canto rodado y sedimento fino en barras viejas y nuevas. 50-80 % afectado.",
            pobre: "Depósitos grandes de material fino, incremento de barras, más del 80 % del fondo afectado."
        },
        p5: {
            optimo: "El nivel del agua alcanza la base de los márgenes y la exposición del sustrato de fondo es mínima.",
            suboptimo: "El agua sólo cubre el 75 % del cauce o menos del 25 % del sustrato de fondo queda expuesto.",
            marginal: "El nivel del agua cubre entre el 25 y 75 % del cauce y queda expuesta la mayor parte del sustrato.",
            pobre: "Muy poca agua sobre el cauce y la mayoría como pozas."
        },
        p6: {
            optimo: "Ausencia o mínima presencia de canalización o dragado. Corriente con cauce normal.",
            suboptimo: "Cierta canalización presente por puentes. Evidencia de canalización actual o pasada.",
            marginal: "Canalización extensiva. Diques presentes en ambas márgenes. Entre el 40 y 80% del río alterado.",
            pobre: "Márgenes protegidas con cemento. Más del 80 % del río alterado. Hábitats eliminados totalmente."
        },
        p7: {
            alto: {
                optimo: "Rápidos frecuentes. La relación distancia entre rápidos y el ancho del río es < 7.",
                suboptimo: "Rápidos poco frecuentes. Distancia entre rápidos y ancho del río entre 7 y 15.",
                marginal: "Rápidos ocasionales. Distancia entre rápidos y el ancho del río entre 15 y 25.",
                pobre: "Agua corre sin interrupción o rápidos muy bajos. Distancia mayor a 25."
            },
            bajo: {
                optimo: "Las curvas en la corriente aumentan la longitud de flujo 3 a 4 veces más que en línea recta.",
                suboptimo: "Las curvas aumentan la longitud de flujo 1 a 2 veces más tiempo que en línea recta.",
                marginal: "Las curvas aumentan la longitud de flujo 1 a 2 veces más tiempo que en línea recta.",
                pobre: "Canal recto; vía fluvial ha sido canalizada por una larga distancia."
            }
        },
        p8: {
            optimo: "Orillas estables, mínima o ausente evidencia de erosión, <5 % de las orillas afectadas.",
            suboptimo: "Orilla moderadamente estable, pequeñas áreas de erosión, 5-30 % erosionada.",
            marginal: "Ribera del 30-60 % de erosión, alto potencial de erosión durante descargas.",
            pobre: "Orillas poco estables, entre 60-100 % están erosionadas."
        },
        p9: {
            optimo: "Más del 90 % de las márgenes está cubierta por vegetación nativa (árboles, arbustos, macrófitas).",
            suboptimo: "Entre el 70 y 90 % de las márgenes cubiertas por vegetación nativa. Vegetación algo abierta.",
            marginal: "Entre el 50 y 70 % de las márgenes cubiertas por vegetación nativa. Vegetación abierta.",
            pobre: "Menos del 50 % de las márgenes cubiertas por vegetación nativa."
        },
        p10: {
            optimo: "Extensión de la vegetación ribereña mayor a 18 m y sin impacto antrópico.",
            suboptimo: "Extensión de la vegetación ribereña entre 12 y 18 m y un mínimo impacto.",
            marginal: "Extensión de la vegetación ribereña entre 6 y 12 m y un impacto evidente.",
            pobre: "Extensión menor a 6 m. Poca o ninguna vegetación debido a un fuerte impacto."
        },
        default: {
            optimo: "Condiciones excelentes y estables para el hábitat.",
            suboptimo: "Condiciones adecuadas, pero con ligeras alteraciones.",
            marginal: "Condiciones alteradas que afectan moderadamente el hábitat.",
            pobre: "Condiciones muy alteradas, hábitat severamente impactado."
        }
    };

    // --- 3. DIBUJAR LA TABLA CON EL DISEÑO DE DESIRE ---
    const contenedor = document.getElementById('contenedor-parametros');
    for (let i = 1; i <= 10; i++) {
        const esMargen = i >= 8;
        let inputsHTML = '';
        
        if (!esMargen) {
            inputsHTML = `<input type="number" class="score-input form-control mx-auto proto-input val-p${i}" data-key="p${i}" data-max="20" value="0" min="0" max="20" disabled>`;
        } else {
            inputsHTML = `
                <div class="d-flex flex-column align-items-center gap-1">
                    <div class="d-flex align-items-center gap-2"><span class="small fw-bold text-muted">I:</span><input type="number" class="score-input form-control input-mini proto-input val-p${i}Izq" data-key="p${i}Izq" data-max="10" value="0" min="0" max="10" disabled></div>
                    <div class="d-flex align-items-center gap-2"><span class="small fw-bold text-muted">D:</span><input type="number" class="score-input form-control input-mini proto-input val-p${i}Der" data-key="p${i}Der" data-max="10" value="0" min="0" max="10" disabled></div>
                </div>`;
        }

        contenedor.innerHTML += `
            <div class="parameter-row row mx-0 border-bottom py-3 align-items-center bg-white" data-param="p${i}" id="row-p${i}">
                <div class="col-5 parameter-name fw-bold" id="titulo-p${i}"></div>
                <div class="col-2 text-center">${inputsHTML}</div>
                <div class="col-2 text-center fw-bold level-text" id="lvl-p${i}">POBRE</div>
                <div class="col-3 text-center">
                    <button type="button" class="btn btn-detalle shadow-sm rounded-pill px-3" onclick="mostrarModal(${i})">Detalle del nivel</button>
                </div>
            </div>`;
    }

    // --- 4. CÁLCULO DE COLORES Y PUNTOS ---
    function obtenerCategoria(valor) {
        if (valor >= 16) return { texto: 'ÓPTIMO', color: '#2196F3' }; 
        if (valor >= 11) return { texto: 'SUBÓPTIMO', color: '#4CAF50' }; 
        if (valor >= 6) return { texto: 'MARGINAL', color: '#FFC107' }; 
        return { texto: 'POBRE', color: '#F44336' }; 
    }

    function recalcularUI() {
        const puntajes = getPuntajesActuales();
        let total = 0;

        for (let i = 1; i <= 10; i++) {
            // Títulos dinámicos
            document.getElementById(`titulo-p${i}`).textContent = tipoGradiente === 'Alto' ? nombresParametros[i].alto : nombresParametros[i].bajo;

            const esMargen = i >= 8;
            let sumaFila = 0;

            if (!esMargen) {
                const val = puntajes[`p${i}`] || 0;
                sumaFila = val;
                document.querySelector(`.val-p${i}`).value = val;
            } else {
                const valIzq = puntajes[`p${i}Izq`] || 0;
                const valDer = puntajes[`p${i}Der`] || 0;
                sumaFila = valIzq + valDer;
                document.querySelector(`.val-p${i}Izq`).value = valIzq;
                document.querySelector(`.val-p${i}Der`).value = valDer;
            }

            total += sumaFila;

            // Actualizar etiqueta de nivel
            const cat = obtenerCategoria(sumaFila);
            const lbl = document.getElementById(`lvl-p${i}`);
            lbl.textContent = cat.texto;
            lbl.style.color = cat.color;
        }

        // Total
        document.getElementById('totalScore').textContent = total;
        
        // Color del Badge General (usando los mismos colores)
        const pctTotal = total / 200;
        const badge = document.getElementById('badgeTotal');
        badge.className = 'badge-total shadow-sm mb-0 px-4 py-2 rounded-pill fw-bold text-white';
        if (pctTotal >= 0.8) badge.style.backgroundColor = '#2196F3';
        else if (pctTotal >= 0.55) badge.style.backgroundColor = '#4CAF50';
        else if (pctTotal >= 0.3) badge.style.backgroundColor = '#FFC107'; 
        else badge.style.backgroundColor = '#F44336';
    }

    // Eventos de escritura
    document.querySelectorAll('.score-input').forEach(input => {
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            const max = parseFloat(e.target.getAttribute('data-max'));
            if (val > max) val = max; 
            if (val < 0) val = 0;
            e.target.value = val; 

            getPuntajesActuales()[e.target.getAttribute('data-key')] = val;
            recalcularUI();
        });
    });

    document.getElementById('tipo_gradiente').addEventListener('change', (e) => {
        tipoGradiente = e.target.value;
        recalcularUI();
    });

    // --- 5. LÓGICA DEL MODAL ---
    window.mostrarModal = function(num) {
        const paramId = `p${num}`;
        const pts = getPuntajesActuales();
        const score = num < 8 ? (pts[paramId] || 0) : ((pts[`${paramId}Izq`] || 0) + (pts[`${paramId}Der`] || 0));
        
        const cat = obtenerCategoria(score);
        const dataParam = descripciones[paramId] || descripciones.default;
        
        // MAGIA: Si el parámetro tiene sub-descripciones por gradiente, elige la correcta
        const gradientKey = tipoGradiente.toLowerCase();
        const levelKey = cat.texto.toLowerCase().replace('ó', 'o');
        
        let textoFinal = "";
        if (dataParam[gradientKey]) {
            textoFinal = dataParam[gradientKey][levelKey];
        } else {
            textoFinal = dataParam[levelKey];
        }

        document.getElementById('modalNivelTitulo').textContent = cat.texto;
        document.getElementById('modalNivelTitulo').style.color = cat.color;
        document.getElementById('modalDescripcion').textContent = textoFinal;

        new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    }

    // --- NUEVO: CARGAR NOMBRE DEL PROYECTO ---
    cargarNombreProyecto();
    
    async function cargarNombreProyecto() {
        try {
            const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/estaciones/${proyectoId}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                const proyecto = await res.json();
                document.getElementById('nombre-proyecto-nav').textContent = proyecto.nombre_proyecto;
                // Le asignamos el link dinámico para volver a la pantalla de verproyecto
                document.getElementById('link-proyecto-top').href = `verproyecto.html?id=${proyectoId}`;
            } else {
                document.getElementById('nombre-proyecto-nav').textContent = "Proyecto Desconocido";
            }
        } catch (error) {
            console.error("Error al obtener el proyecto:", error);
            document.getElementById('nombre-proyecto-nav').textContent = "Error de conexión";
        }
    }

    // --- 6. CARGA DE DATOS ---
    cargarProtocolo();
    async function cargarProtocolo() {
        try {
            const res = await fetch(`https://deepbug-backend-staging.onrender.com/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const protocolos = await res.json();
            const protocolo3 = protocolos.find(p => p.protocolo_numero == 3 && p.estado === 'aprobado');

            if (!protocolo3) {
                document.getElementById('estado-texto').textContent = "Nuevo Llenado";
                if (rolUsuario === 'Responsable') habilitarEdicion();
                recalcularUI(); 
            } else {
                document.getElementById('estado-texto').textContent = "Modo Visualización";
                const form = protocolo3.datos_formulario;
                
                tipoGradiente = form.tipo_gradiente || 'Alto';
                document.getElementById('tipo_gradiente').value = tipoGradiente;

                if (form.puntajes_alto) puntajesAlto = { ...puntajesAlto, ...form.puntajes_alto };
                if (form.puntajes_bajo) puntajesBajo = { ...puntajesBajo, ...form.puntajes_bajo };
                recalcularUI();

                if (rolUsuario === 'Responsable') {
                    document.getElementById('btnModificar').style.display = 'inline-block';
                    document.getElementById('tipo_gradiente').disabled = true; // Se desbloquea al modificar
                }
            }

            document.querySelectorAll("[data-role]").forEach(el => {
                if (el.getAttribute("data-role") !== rolUsuario) el.style.display = 'none';
            });
        } catch (error) { console.error("Error:", error); }
    }

    // --- 7. EDICIÓN Y GUARDADO ---
    document.getElementById('btnModificar').addEventListener('click', habilitarEdicion);

    function habilitarEdicion() {
        document.getElementById('estado-texto').textContent = "Modo Edición";
        document.getElementById('estado-texto').classList.replace('text-primary', 'text-danger');
        
        document.querySelectorAll('.proto-input').forEach(input => input.disabled = false);
        document.getElementById('tipo_gradiente').disabled = false;
        
        document.getElementById('btnModificar').style.display = 'none';
        document.getElementById('btnGuardar').style.display = 'inline-block';
    }

    document.getElementById('btnGuardar').addEventListener('click', async (e) => {
        e.preventDefault();
        const totalAlto = Object.values(puntajesAlto).reduce((a, b) => a + b, 0);
        const totalBajo = Object.values(puntajesBajo).reduce((a, b) => a + b, 0);

        const paqueteSincronizacion = {
            protocolos: [{ 
                biomonitoreo_id: proyectoId, 
                protocolo_numero: 3, 
                datos_formulario: { tipo_gradiente: tipoGradiente, puntajes_alto: puntajesAlto, puntajes_bajo: puntajesBajo, puntaje_total_alto: totalAlto, puntaje_total_bajo: totalBajo }
            }]
        };

        try {
            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>...';
            document.getElementById('btnGuardar').disabled = true;

            const res = await fetch('https://deepbug-backend-staging.onrender.com/api/protocolos/sincronizar', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(paqueteSincronizacion)
            });

            if (res.ok) { window.location.reload(); } else { alert("Error al guardar."); }
        } catch (error) { alert("Error de red."); } 
    });
});